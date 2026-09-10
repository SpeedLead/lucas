"use client";

import { Magnetic } from "@/components/motion/magnetic";
import { ScrambleText } from "@/components/motion/scramble-text";
import { PongGame } from "@/components/site/pong-game";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

export function Hero() {
  return (
    <header id="top" className="relative overflow-hidden">
      {/* Soft brand glow behind the hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 size-[38rem] -translate-x-1/2 rounded-full bg-brand/12 blur-[110px]"
      />

      <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-5 pb-16 pt-12 md:grid-cols-[1.05fr_1fr] md:pb-24 md:pt-20">
        <div>
          <p className="mb-4 flex items-center gap-2.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-brand">
            <span className="h-px w-6 bg-brand" />
            {siteConfig.role} · currently rallying
          </p>

          <h1 className="font-display text-[clamp(3.2rem,11vw,6rem)] leading-[0.9] tracking-tight">
            <span className="block text-muted-foreground">HEY, I&apos;M</span>
            <ScrambleText text="LUCAS" className="block text-brand" />
          </h1>

          <RotatingTagline />

          <p className="mt-5 max-w-[46ch] text-muted-foreground">{siteConfig.heroIntro}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Magnetic>
              <Button asChild size="lg" className="rounded-full">
                <a href="#contact">{siteConfig.contact.cta} 👋</a>
              </Button>
            </Magnetic>
            <Magnetic>
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <a href="#about">Get to know me</a>
              </Button>
            </Magnetic>
          </div>
        </div>

        {/* min-w-0: without it an auto-sized grid track can be widened by its
            own content, which is how the canvas got into a resize loop. */}
        <div className="min-w-0 md:pt-4">
          <PongGame />
        </div>
      </div>
    </header>
  );
}

function RotatingTagline() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const taglines = siteConfig.taglines;

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % taglines.length),
      2600,
    );
    return () => window.clearInterval(id);
  }, [reduced, taglines.length]);

  // Reduced motion: show them all as a static list rather than cycling.
  if (reduced) {
    return (
      <p className="mt-4 text-lg text-foreground">{taglines.join(" · ")}</p>
    );
  }

  return (
    <div className="mt-4 flex h-8 items-center overflow-hidden text-lg">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: 22, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -22, opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="block"
        >
          {taglines[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
