"use client";

import { Reveal } from "@/components/motion/reveal";
import { Section } from "@/components/site/section";
import { Card } from "@/components/ui/card";
import { FILL_ME_IN, siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";

const STRINGS = [
  { note: "E", width: 3.2, amp: 13 },
  { note: "A", width: 2.8, amp: 11 },
  { note: "D", width: 2.4, amp: 9 },
  { note: "G", width: 2.0, amp: 8 },
  { note: "B", width: 1.7, amp: 7 },
  { note: "e", width: 1.4, amp: 6 },
] as const;

const REST_COLOR = "#a29d90";
const PLUCK_COLOR = "#ff6a13";

const BOX_W = 420;
const BOX_H = 210;
const PAD_Y = 26;

export function Guitar() {
  const { blurb, stats } = siteConfig.guitar;

  return (
    <Section id="guitar" eyebrow="Hobby no. 2" title="Guitar 🎸" blurb={blurb}>
      <div className="grid gap-6 md:grid-cols-2">
        <Reveal direction="right">
          <Card className="h-full rounded-lg border border-line p-5 ring-0">
            <Strings />
          </Card>
        </Reveal>

        <Reveal direction="left">
          <Card className="h-full gap-0 rounded-lg border border-line p-0 ring-0">
            <dl className="px-5 py-1">
              {stats.map((stat) => {
                const empty = stat.value === FILL_ME_IN;
                return (
                  <div
                    key={stat.label}
                    className="flex items-baseline justify-between gap-4 border-b border-line py-3.5 last:border-b-0"
                  >
                    <dt className="text-sm text-muted-foreground">{stat.label}</dt>
                    <dd
                      className={cn(
                        "text-right font-mono text-sm text-brand",
                        empty && "text-muted-foreground/50 italic",
                      )}
                      title={empty ? stat.hint : undefined}
                    >
                      {stat.value}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </Card>
        </Reveal>
      </div>
    </Section>
  );
}

function Strings() {
  const reduced = useReducedMotion();
  const gap = (BOX_H - PAD_Y * 2) / (STRINGS.length - 1);

  return (
    <div>
      <p className="mb-3 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
        {reduced ? "Six strings" : "Hover a string \u2193"}
      </p>

      <svg
        viewBox={`0 0 ${BOX_W} ${BOX_H}`}
        className="w-full"
        role="img"
        aria-label="Six guitar strings that vibrate when you hover over them"
      >
        {/* nut + bridge */}
        <rect x="10" y={PAD_Y - 14} width="5" height={BOX_H - PAD_Y * 2 + 28} rx="2" fill="#33322f" />
        <rect
          x={BOX_W - 15}
          y={PAD_Y - 14}
          width="5"
          height={BOX_H - PAD_Y * 2 + 28}
          rx="2"
          fill="#33322f"
        />

        {STRINGS.map((string, i) => (
          <GuitarString
            key={string.note}
            note={string.note}
            y={PAD_Y + gap * i}
            width={string.width}
            amp={string.amp}
            hitHeight={gap}
            reduced={reduced === true}
          />
        ))}
      </svg>
    </div>
  );
}

/**
 * One string. Motion cannot interpolate the `d` attribute (it is a path
 * string, not a number), so we animate a numeric bend offset instead and
 * derive `d` from it through useTransform.
 */
function GuitarString({
  note,
  y,
  width,
  amp,
  hitHeight,
  reduced,
}: {
  note: string;
  y: number;
  width: number;
  amp: number;
  hitHeight: number;
  reduced: boolean;
}) {
  const bend = useMotionValue(0);
  const stroke = useMotionValue(REST_COLOR);
  const d = useTransform(
    bend,
    (offset) => `M 15 ${y} Q ${BOX_W / 2} ${y + offset} ${BOX_W - 15} ${y}`,
  );

  function pluck() {
    if (reduced) return;
    // Decaying oscillation, then back to rest.
    animate(bend, [amp, -amp * 0.72, amp * 0.45, -amp * 0.22, 0], {
      duration: 0.85,
      ease: "easeOut",
    });
    animate(stroke, [PLUCK_COLOR, PLUCK_COLOR, REST_COLOR], {
      duration: 0.85,
      ease: "easeOut",
    });
  }

  return (
    <g>
      {/* fat invisible hit area \u2014 strings are thin and hard to hover */}
      <line
        x1="15"
        y1={y}
        x2={BOX_W - 15}
        y2={y}
        stroke="transparent"
        strokeWidth={hitHeight}
        className="cursor-pointer"
        onPointerEnter={pluck}
      />
      <motion.path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={width}
        strokeLinecap="round"
        className="pointer-events-none"
      />
      <text x="0" y={y + 4} className="fill-muted-foreground/60 font-mono" fontSize="10">
        {note}
      </text>
    </g>
  );
}
