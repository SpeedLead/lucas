import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Section({
  id,
  eyebrow,
  title,
  blurb,
  children,
  className,
}: {
  id: string;
  eyebrow: string;
  title: string;
  blurb?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        // overflow-hidden: horizontal Reveal offsets (translateX) must not leak
        // out and widen the page on narrow screens.
        "scroll-mt-16 overflow-hidden border-t border-dashed border-line py-16 md:py-24",
        className,
      )}
    >
      <div className="mx-auto max-w-5xl px-5">
        <Reveal>
          <p className="mb-3 flex items-center gap-2.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-brand">
            <span className="h-px w-6 bg-brand" />
            {eyebrow}
          </p>
          <h2 className="font-display text-4xl tracking-tight md:text-5xl">{title}</h2>
          {blurb ? (
            <p className="mt-4 max-w-[58ch] text-muted-foreground">{blurb}</p>
          ) : null}
        </Reveal>

        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}
