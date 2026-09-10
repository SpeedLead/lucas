"use client";

import { Reveal } from "@/components/motion/reveal";
import { Section } from "@/components/site/section";
import { Card } from "@/components/ui/card";
import { FILL_ME_IN, siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "motion/react";

export function TableTennis() {
  const { blurb, stats, skills } = siteConfig.tableTennis;

  return (
    <Section id="table-tennis" eyebrow="Hobby no. 1" title="Table tennis 🏓" blurb={blurb}>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Player card — descended from the stat card on Lucas's first site */}
        <Reveal direction="right">
          <Card className="gap-0 overflow-hidden rounded-lg border border-line p-0 ring-0">
            <div className="flex items-center justify-between bg-court px-5 py-2.5 text-[#08150f]">
              <span className="font-display text-xl tracking-wide">PLAYER CARD</span>
              <span className="font-mono text-[0.65rem] font-bold tracking-wider">
                TABLE TENNIS
              </span>
            </div>
            <dl className="px-5 py-1">
              {stats.map((stat) => {
                const empty = stat.value === FILL_ME_IN;
                return (
                  <div
                    key={stat.label}
                    className="flex items-baseline justify-between gap-4 border-b border-line py-3 last:border-b-0"
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

        {/* Skill bars */}
        <Reveal direction="left">
          <Card className="h-full rounded-lg border border-line p-5 ring-0">
            <p className="mb-5 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
              Self-assessment (100% honest)
            </p>
            <div className="space-y-4">
              {skills.map((skill, i) => (
                <SkillBar key={skill.label} label={skill.label} value={skill.value} index={i} />
              ))}
            </div>
          </Card>
        </Reveal>
      </div>
    </Section>
  );
}

function SkillBar({
  label,
  value,
  index,
}: {
  label: string;
  value: number;
  index: number;
}) {
  const reduced = useReducedMotion();

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span>{label}</span>
        <span className="font-mono text-xs text-brand tabular-nums">{value}</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-line/60"
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brand to-court"
          initial={reduced ? false : { width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true, margin: "-60px" }}
          transition={
            reduced
              ? { duration: 0 }
              : { duration: 0.9, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }
          }
          style={reduced ? { width: `${value}%` } : undefined}
        />
      </div>
    </div>
  );
}
