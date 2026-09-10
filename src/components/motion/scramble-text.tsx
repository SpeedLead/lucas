"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!<>-_\\/[]{}—=+*^?#";

// useLayoutEffect warns during SSR; fall back to useEffect on the server.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Decodes text character-by-character on mount, like a terminal unscrambling.
 *
 * Renders the final text on the server so SSR and the first client render
 * match exactly (no hydration mismatch), then scrambles before paint.
 */
export function ScrambleText({
  text,
  className,
  speed = 26,
  revealEvery = 2,
}: {
  text: string;
  className?: string;
  /** ms per animation tick */
  speed?: number;
  /** ticks required to lock in each character */
  revealEvery?: number;
}) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(text);
  const frame = useRef(0);

  useIsomorphicLayoutEffect(() => {
    if (reduced) {
      setDisplay(text);
      return;
    }

    frame.current = 0;
    // Scramble before the browser paints, so the real text never flashes.
    setDisplay(scrambleFrom(text, 0, revealEvery));

    const id = window.setInterval(() => {
      frame.current += 1;
      const locked = Math.floor(frame.current / revealEvery);
      setDisplay(scrambleFrom(text, frame.current, revealEvery));
      if (locked >= text.length) {
        window.clearInterval(id);
        setDisplay(text);
      }
    }, speed);

    return () => window.clearInterval(id);
  }, [text, reduced, speed, revealEvery]);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}

function scrambleFrom(text: string, frame: number, revealEvery: number): string {
  const locked = Math.floor(frame / revealEvery);
  let out = "";
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i] ?? "";
    if (i < locked || char === " ") {
      out += char;
    } else {
      out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? char;
    }
  }
  return out;
}
