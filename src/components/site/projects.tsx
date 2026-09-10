"use client";

import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { Section } from "@/components/site/section";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FILL_ME_IN, siteConfig, type ProjectStatus } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import type { ReactNode } from "react";
import { useRef } from "react";

const STATUS_STYLES: Record<ProjectStatus, string> = {
  building: "border-brand/40 bg-brand/10 text-brand",
  thinking: "border-court/40 bg-court/10 text-court",
  learning: "border-line bg-muted/40 text-muted-foreground",
  shipped: "border-court/40 bg-court/15 text-court",
};

export function Projects() {
  return (
    <Section
      id="projects"
      eyebrow="AI + business"
      title="Stuff I'm building"
      blurb={siteConfig.projectsBlurb}
    >
      <RevealGroup className="grid gap-4 sm:grid-cols-2">
        {siteConfig.projects.map((project, i) => {
          const empty = project.title === FILL_ME_IN;
          return (
            <RevealItem key={`${project.title}-${i}`}>
              <Tilt>
                <Card className="group h-full gap-3 rounded-lg border border-line p-5 ring-0 transition-colors hover:border-brand/50">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-2xl" aria-hidden="true">
                      {project.emoji}
                    </span>
                    <div className="flex gap-1.5">
                      <Badge variant="outline" className="border-line font-mono text-[0.6rem]">
                        {project.tag}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn("font-mono text-[0.6rem]", STATUS_STYLES[project.status])}
                      >
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                  <h3
                    className={cn(
                      "font-display text-2xl tracking-wide",
                      empty && "text-muted-foreground/50 italic",
                    )}
                  >
                    {project.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{project.blurb}</p>
                </Card>
              </Tilt>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </Section>
  );
}

/** Subtle 3D tilt toward the cursor. */
function Tilt({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), {
    stiffness: 220,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), {
    stiffness: 220,
    damping: 20,
  });

  if (reduced) return <div className="h-full">{children}</div>;

  return (
    <motion.div
      ref={ref}
      className="h-full [transform-style:preserve-3d]"
      style={{ rotateX, rotateY, perspective: 800 }}
      onPointerMove={(event) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        x.set((event.clientX - rect.left) / rect.width - 0.5);
        y.set((event.clientY - rect.top) / rect.height - 0.5);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
