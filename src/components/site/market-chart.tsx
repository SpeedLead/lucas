"use client";

import type { MarketQuote } from "@/lib/market";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "motion/react";
import { useId, useMemo, useRef, useState } from "react";

/**
 * Intraday line for one index.
 *
 * Fixed viewBox with no `preserveAspectRatio` override, so the ratio is locked
 * and pointer-x maps straight back onto the data. Strokes are non-scaling, so
 * they stay 2px whatever width the card ends up at.
 */
const VIEW = { w: 560, h: 265 };
const PAD = { left: 12, right: 12, top: 20, bottom: 20 };

const priceFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPrice(value: number): string {
  return priceFormat.format(value);
}

/**
 * Maps the series into viewBox space. The previous close joins the domain so
 * the baseline is always on screen, and the domain is padded 10% either side.
 */
function buildScale(current: MarketQuote) {
  if (current.points.length < 2) return null;

  const values = current.points.map(([, value]) => value);
  if (current.previousClose !== null) values.push(current.previousClose);

  let min = Math.min(...values);
  let max = Math.max(...values);
  const span = max - min || Math.abs(max) * 0.002 || 1;
  min -= span * 0.1;
  max += span * 0.1;

  const innerW = VIEW.w - PAD.left - PAD.right;
  const innerH = VIEW.h - PAD.top - PAD.bottom;
  const toY = (value: number) => PAD.top + (1 - (value - min) / (max - min)) * innerH;

  return {
    toY,
    plotted: current.points.map(
      ([fraction, value]) => [PAD.left + fraction * innerW, toY(value)] as const,
    ),
  };
}

export function MarketChart({ quote }: { quote: MarketQuote }) {
  const gradientId = useId();
  const reduced = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState<number | null>(null);

  const up = (quote.change ?? 0) >= 0;
  const scale = useMemo(() => buildScale(quote), [quote]);

  if (!scale) {
    return (
      <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
        No intraday line for {quote.name} right now.
      </div>
    );
  }

  const { toY, plotted } = scale;
  const line = plotted.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
  const area = `${line} L ${plotted[plotted.length - 1][0]} ${VIEW.h - PAD.bottom} L ${plotted[0][0]} ${VIEW.h - PAD.bottom} Z`;
  const baselineY = quote.previousClose === null ? null : toY(quote.previousClose);

  const last = plotted[plotted.length - 1];
  const active = cursor === null ? null : quote.points[cursor];

  /** The pointer only has to be *closest* to a point, not on top of it. */
  function moveToPointer(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) return;

    const x = ((clientX - rect.left) / rect.width) * VIEW.w;
    let nearest = 0;
    for (let i = 1; i < plotted.length; i += 1) {
      if (Math.abs(plotted[i][0] - x) < Math.abs(plotted[nearest][0] - x)) nearest = i;
    }
    setCursor(nearest);
  }

  function step(delta: number) {
    setCursor((current) => {
      const next = (current ?? quote.points.length - 1) + delta;
      return Math.min(quote.points.length - 1, Math.max(0, next));
    });
  }

  const cursorX = cursor === null ? null : plotted[cursor][0];
  const cursorY = cursor === null ? null : plotted[cursor][1];

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
        className={cn(
          "block w-full touch-pan-y rounded-sm outline-none",
          "focus-visible:ring-2 focus-visible:ring-brand/60",
          up ? "text-up" : "text-down",
        )}
        role="img"
        aria-label={`${quote.name} today: ${quote.priceText}, ${quote.changeText ?? ""} ${
          quote.changePercentText ?? ""
        }. Low ${formatPrice(quote.low ?? quote.price)}, high ${formatPrice(quote.high ?? quote.price)}.`}
        tabIndex={0}
        onPointerMove={(event) => moveToPointer(event.clientX)}
        onPointerLeave={() => setCursor(null)}
        onBlur={() => setCursor(null)}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") step(1);
          else if (event.key === "ArrowLeft") step(-1);
          else if (event.key === "Escape") setCursor(null);
          else return;
          event.preventDefault();
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.26" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Yesterday's close. Dashed because it is a threshold, not a gridline. */}
        {baselineY !== null ? (
          <line
            x1={PAD.left}
            y1={baselineY}
            x2={VIEW.w - PAD.right}
            y2={baselineY}
            className="stroke-muted-foreground/55"
            strokeWidth="1"
            strokeDasharray="2 4"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}

        <path d={area} fill={`url(#${gradientId})`} stroke="none" />

        <motion.path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={reduced ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Latest point, ringed in the card surface so it reads over the fill. */}
        <circle cx={last[0]} cy={last[1]} r="4" fill="currentColor" className="stroke-card" strokeWidth="2" />

        {cursorX !== null && cursorY !== null ? (
          <g>
            <line
              x1={cursorX}
              y1={PAD.top}
              x2={cursorX}
              y2={VIEW.h - PAD.bottom}
              className="stroke-foreground/35"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={cursorX} cy={cursorY} r="4" fill="currentColor" className="stroke-card" strokeWidth="2" />
          </g>
        ) : null}
      </svg>

      {active && cursorY !== null ? (
        <Tooltip
          quote={quote}
          value={active[1]}
          atFraction={active[0]}
          // Sit opposite the point so the readout never covers the mark it describes.
          below={cursorY < VIEW.h / 2}
        />
      ) : null}

      {/* No timestamps come down with the series, so the axis says only which
          end is which — better than inventing times we do not have. */}
      <div className="mt-1 flex justify-between font-mono text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground/70">
        <span>Earlier today</span>
        <span>Now</span>
      </div>
    </div>
  );
}

/** Values lead, labels follow — the reader already knows which index this is. */
function Tooltip({
  quote,
  value,
  atFraction,
  below,
}: {
  quote: MarketQuote;
  value: number;
  atFraction: number;
  below: boolean;
}) {
  const fromClose = quote.previousClose === null ? null : value - quote.previousClose;
  const up = (fromClose ?? 0) >= 0;

  return (
    <div
      className={cn(
        "pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border border-line bg-background/95 px-2.5 py-1.5 text-center shadow-lg backdrop-blur-sm",
        below ? "bottom-7" : "top-1",
      )}
      style={{ left: `${clamp(atFraction * 100, 14, 86)}%` }}
      role="status"
      aria-live="polite"
    >
      <div className="font-mono text-sm tabular-nums text-foreground">{formatPrice(value)}</div>
      {fromClose === null ? null : (
        <div className={cn("font-mono text-[0.65rem] tabular-nums", up ? "text-up" : "text-down")}>
          {up ? "▲" : "▼"} {formatPrice(Math.abs(fromClose))} vs close
        </div>
      )}
    </div>
  );
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}
