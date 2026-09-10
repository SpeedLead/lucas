"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";

/* ── Look ─────────────────────────────────────────────────────────── */
const COLORS = {
  table: "#141414",
  line: "#33322f",
  net: "#1f8a5f",
  ball: "#f3ede1",
  player: "#ff6a13",
  ai: "#1f8a5f",
  glow: "rgba(255,106,19,0.45)",
} as const;

/* ── Tuning ───────────────────────────────────────────────────────── */
const STEP = 1 / 120; // fixed physics timestep (seconds)
const MAX_FRAME = 0.25; // clamp huge dt after a tab is backgrounded
const BALL_R = 7;
const PADDLE_W = 10;
const PADDLE_INSET = 18;
const START_SPEED = 330;
const MAX_SPEED = 880;
const SPEEDUP = 1.045;
const AI_SPEED = 290;
const KEY_SPEED = 460;

const RALLY_TAUNTS = [
  "ok, not bad",
  "was that on purpose?",
  "ok, showoff 😤",
  "alright ALRIGHT",
  "are you a robot??",
  "my grandma rallies longer",
  "genuinely impressive now",
] as const;

const SCORE_TAUNTS = {
  player: ["you got lucky", "fine. nice shot.", "ok that one was good", "🏓💀"],
  ai: ["too easy", "skill issue", "get good", "i'm not even trying"],
} as const;

type Vec = { x: number; y: number };

type Game = {
  w: number;
  h: number;
  ball: Vec;
  vel: Vec;
  playerY: number;
  aiY: number;
  aiError: number;
  paddleH: number;
  rally: number;
  serveDelay: number;
  keyDir: number;
  pointerY: number | null;
};

export function PongGame() {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);

  const [score, setScore] = useState({ player: 0, ai: 0 });
  // null = nothing said yet, so the opening prompt still applies.
  const [taunt, setTaunt] = useState<string | null>(null);

  // A mouse can play; a finger cannot without hijacking page scroll, so
  // coarse-pointer devices watch the AI rally itself instead. Read as an
  // external store rather than setState-in-effect (which cascades renders).
  const interactive = usePointerFine();

  const shownTaunt =
    taunt ??
    (interactive ? "move your mouse to play →" : "demo mode — play it on a computer");

  // Effect Events (React 19.2): the game loop can call these without `taunt`
  // becoming a dependency — a re-run would restart the match mid-rally.
  const say = useEffectEvent((message: string) => setTaunt(message));
  const sayOnFirstMove = useEffectEvent(() => {
    if (taunt === null) setTaunt("here we go");
  });

  useEffect(() => {
    if (reduced) return;

    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const canPlay = interactive;

    /* ── Setup ──────────────────────────────────────────────────── */
    const game: Game = {
      w: 0,
      h: 0,
      ball: { x: 0, y: 0 },
      vel: { x: 0, y: 0 },
      playerY: 0,
      aiY: 0,
      aiError: 0,
      paddleH: 0,
      rally: 0,
      serveDelay: 0.6,
      keyDir: 0,
      pointerY: null,
    };
    gameRef.current = game;

    function resize() {
      // clientWidth/Height is the *content* box. getBoundingClientRect() would
      // include the 1px border, making the canvas overflow its wrapper, widen
      // the grid column, and retrigger the ResizeObserver — an endless loop.
      const width = wrap!.clientWidth;
      const height = wrap!.clientHeight;
      if (width === 0 || height === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const bitmapW = Math.round(width * dpr);
      const bitmapH = Math.round(height * dpr);

      // Always refresh game dimensions. (These must NOT sit behind the bitmap
      // check below: in StrictMode the effect remounts with a fresh `game`
      // while the canvas element keeps its old size, so an early return here
      // would leave game.w/h at 0 and everything would draw into nothing.)
      game.w = width;
      game.h = height;
      game.paddleH = Math.max(44, Math.min(game.h * 0.24, 112));

      // Assigning canvas.width clears the bitmap, so only touch it on a real
      // change — otherwise every stray observer tick wipes the frame.
      if (canvas!.width !== bitmapW || canvas!.height !== bitmapH) {
        canvas!.width = bitmapW;
        canvas!.height = bitmapH;
      }
      // Resetting the bitmap also resets the transform, so re-apply it.
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      game.playerY = clamp(game.playerY || game.h / 2, game.paddleH / 2, game.h - game.paddleH / 2);
      game.aiY = clamp(game.aiY || game.h / 2, game.paddleH / 2, game.h - game.paddleH / 2);
      if (game.ball.x === 0 && game.ball.y === 0) serve(1);
    }

    function serve(direction: number) {
      game.ball = { x: game.w / 2, y: game.h / 2 };
      const angle = (Math.random() - 0.5) * 0.6;
      game.vel = {
        x: Math.cos(angle) * START_SPEED * direction,
        y: Math.sin(angle) * START_SPEED,
      };
      game.rally = 0;
      game.serveDelay = 0.7;
      game.aiError = (Math.random() - 0.5) * game.paddleH * 0.5;
    }

    /* ── Physics ────────────────────────────────────────────────── */
    function update(dt: number) {
      if (game.serveDelay > 0) {
        game.serveDelay -= dt;
        return;
      }

      // Player paddle: pointer if we have one, else keyboard, else follow ball.
      if (canPlay && game.pointerY !== null) {
        game.playerY += (game.pointerY - game.playerY) * Math.min(1, dt * 18);
      } else if (game.keyDir !== 0) {
        game.playerY += game.keyDir * KEY_SPEED * dt;
      } else if (!canPlay) {
        // Demo mode: the "player" side plays itself, a little sloppily.
        const target = game.vel.x < 0 ? game.ball.y : game.h / 2;
        game.playerY += clamp(target - game.playerY, -AI_SPEED * dt, AI_SPEED * dt);
      }
      game.playerY = clamp(game.playerY, game.paddleH / 2, game.h - game.paddleH / 2);

      // AI paddle: only chases when the ball is coming at it, and it aims
      // slightly wrong on purpose — an unbeatable opponent is not fun.
      const aiTarget = game.vel.x > 0 ? game.ball.y + game.aiError : game.h / 2;
      game.aiY += clamp(aiTarget - game.aiY, -AI_SPEED * dt, AI_SPEED * dt);
      game.aiY = clamp(game.aiY, game.paddleH / 2, game.h - game.paddleH / 2);

      // Ball
      game.ball.x += game.vel.x * dt;
      game.ball.y += game.vel.y * dt;

      // Top / bottom walls
      if (game.ball.y - BALL_R < 0) {
        game.ball.y = BALL_R;
        game.vel.y = Math.abs(game.vel.y);
      } else if (game.ball.y + BALL_R > game.h) {
        game.ball.y = game.h - BALL_R;
        game.vel.y = -Math.abs(game.vel.y);
      }

      const playerX = PADDLE_INSET + PADDLE_W;
      const aiX = game.w - PADDLE_INSET - PADDLE_W;

      // Player paddle hit
      if (
        game.vel.x < 0 &&
        game.ball.x - BALL_R <= playerX &&
        game.ball.x - BALL_R >= playerX - PADDLE_W - 12 &&
        Math.abs(game.ball.y - game.playerY) <= game.paddleH / 2 + BALL_R
      ) {
        bounce(playerX + BALL_R, game.playerY, 1);
      }

      // AI paddle hit
      if (
        game.vel.x > 0 &&
        game.ball.x + BALL_R >= aiX &&
        game.ball.x + BALL_R <= aiX + PADDLE_W + 12 &&
        Math.abs(game.ball.y - game.aiY) <= game.paddleH / 2 + BALL_R
      ) {
        bounce(aiX - BALL_R, game.aiY, -1);
      }

      // Scoring
      if (game.ball.x < -BALL_R * 4) {
        setScore((s) => ({ ...s, ai: s.ai + 1 }));
        say(pick(SCORE_TAUNTS.ai));
        serve(1);
      } else if (game.ball.x > game.w + BALL_R * 4) {
        setScore((s) => ({ ...s, player: s.player + 1 }));
        say(pick(SCORE_TAUNTS.player));
        serve(-1);
      }
    }

    function bounce(x: number, paddleY: number, dir: number) {
      game.ball.x = x;
      const offset = (game.ball.y - paddleY) / (game.paddleH / 2); // -1..1
      const speed = Math.min(Math.hypot(game.vel.x, game.vel.y) * SPEEDUP, MAX_SPEED);
      const angle = offset * 0.9; // steeper the further from paddle centre
      game.vel.x = Math.cos(angle) * speed * dir;
      game.vel.y = Math.sin(angle) * speed;
      game.rally += 1;
      game.aiError = (Math.random() - 0.5) * game.paddleH * 0.55;

      // Taunts address the player, so stay quiet in demo mode where the
      // visitor isn't actually hitting anything.
      if (dir === 1 && canPlay) {
        const milestone = Math.floor(game.rally / 3);
        if (milestone > 0 && game.rally % 3 === 0) {
          say(RALLY_TAUNTS[Math.min(milestone - 1, RALLY_TAUNTS.length - 1)] ?? "nice");
        }
      }
    }

    /* ── Render ─────────────────────────────────────────────────── */
    function draw() {
      const { w, h } = game;
      ctx!.clearRect(0, 0, w, h);

      // Table
      ctx!.fillStyle = COLORS.table;
      ctx!.fillRect(0, 0, w, h);

      // Net
      ctx!.strokeStyle = COLORS.net;
      ctx!.globalAlpha = 0.5;
      ctx!.setLineDash([7, 11]);
      ctx!.lineWidth = 2;
      ctx!.beginPath();
      ctx!.moveTo(w / 2, 0);
      ctx!.lineTo(w / 2, h);
      ctx!.stroke();
      ctx!.setLineDash([]);
      ctx!.globalAlpha = 1;

      // Paddles
      roundRect(ctx!, PADDLE_INSET, game.playerY - game.paddleH / 2, PADDLE_W, game.paddleH, 5);
      ctx!.fillStyle = COLORS.player;
      ctx!.fill();

      roundRect(
        ctx!,
        w - PADDLE_INSET - PADDLE_W,
        game.aiY - game.paddleH / 2,
        PADDLE_W,
        game.paddleH,
        5,
      );
      ctx!.fillStyle = COLORS.ai;
      ctx!.fill();

      // Ball (hidden briefly between points)
      if (game.serveDelay <= 0) {
        ctx!.shadowColor = COLORS.glow;
        ctx!.shadowBlur = 16;
        ctx!.fillStyle = COLORS.ball;
        ctx!.beginPath();
        ctx!.arc(game.ball.x, game.ball.y, BALL_R, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }

      // Rally counter
      if (game.rally > 2) {
        ctx!.fillStyle = COLORS.line;
        ctx!.font = "600 11px ui-monospace, SFMono-Regular, monospace";
        ctx!.textAlign = "center";
        ctx!.fillText(`RALLY ${game.rally}`, w / 2, h - 12);
      }
    }

    /* ── Loop (fixed timestep so 60Hz and 120Hz behave identically) ── */
    let raf = 0;
    let last = performance.now();
    let accumulator = 0;
    let running = true;

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, MAX_FRAME);
      last = now;
      accumulator += dt;
      while (accumulator >= STEP) {
        update(STEP);
        accumulator -= STEP;
      }
      draw();
    }

    function start() {
      if (running) return;
      running = true;
      last = performance.now();
      accumulator = 0;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    /* ── Input ──────────────────────────────────────────────────── */
    function onPointerMove(event: PointerEvent) {
      if (!canPlay) return;
      const rect = canvas!.getBoundingClientRect();
      game.pointerY = clamp(event.clientY - rect.top, 0, rect.height);
      sayOnFirstMove();
    }

    function onPointerLeave() {
      game.pointerY = null;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowUp") {
        game.keyDir = -1;
        game.pointerY = null;
        event.preventDefault();
      } else if (event.key === "ArrowDown") {
        game.keyDir = 1;
        game.pointerY = null;
        event.preventDefault();
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.key === "ArrowUp" || event.key === "ArrowDown") game.keyDir = 0;
    }

    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }

    /* ── Wire up ────────────────────────────────────────────────── */
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);

    // Don't burn CPU animating a hero nobody is looking at.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) start();
        else stop();
      },
      { threshold: 0.01 },
    );
    io.observe(wrap);

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("keydown", onKeyDown);
    canvas.addEventListener("keyup", onKeyUp);
    document.addEventListener("visibilitychange", onVisibility);

    running = false;
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("visibilitychange", onVisibility);
      gameRef.current = null;
    };
  }, [reduced, interactive]);

  if (reduced) return <StaticRally />;

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={wrapRef}
        className="relative h-[240px] w-full overflow-hidden rounded-lg border border-line bg-[#141414] sm:h-[280px]"
      >
        <canvas
          ref={canvasRef}
          tabIndex={0}
          role="img"
          aria-label={`Ping pong mini-game. You ${score.player}, computer ${score.ai}. Use arrow keys to play.`}
          /* absolute so the canvas can never influence the wrapper's size */
          className="absolute inset-0 block h-full w-full cursor-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        />

        {/* Scoreboard */}
        <div className="pointer-events-none absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-3 font-mono text-sm tabular-nums">
          <span className="text-brand">{score.player}</span>
          <span className="text-muted-foreground/50">:</span>
          <span className="text-court">{score.ai}</span>
        </div>
      </div>

      <p
        className="text-center font-mono text-xs text-muted-foreground"
        aria-live="polite"
      >
        {shownTaunt}
        {interactive ? " · or use ↑ ↓" : ""}
      </p>
    </div>
  );
}

/** Reduced-motion fallback: the still rally from Lucas's first website. */
function StaticRally() {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-[240px] w-full overflow-hidden rounded-lg border border-line bg-[#141414] sm:h-[280px]">
        <div className="absolute inset-y-0 left-1/2 border-l-2 border-dashed border-court/50" />
        <div className="absolute left-[14%] top-1/2 h-12 w-2.5 -translate-y-1/2 rounded-full bg-brand" />
        <div className="absolute right-[14%] top-1/2 h-12 w-2.5 -translate-y-1/2 rounded-full bg-court" />
        <div className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cream" />
      </div>
      <p className="text-center font-mono text-xs text-muted-foreground">
        (animation paused — you asked for reduced motion)
      </p>
    </div>
  );
}

/* ── helpers ──────────────────────────────────────────────────────── */

/** True when the visitor has a real pointer (mouse/trackpad) rather than a finger. */
function usePointerFine(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(pointer: fine)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(pointer: fine)").matches,
    () => true, // server guess; corrected on hydration
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] ?? items[0]!;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
