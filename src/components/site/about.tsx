import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { Section } from "@/components/site/section";
import { Card } from "@/components/ui/card";
import { FILL_ME_IN, siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function About() {
  return (
    <Section id="about" eyebrow="About me" title="The short version">
      <div className="grid gap-10 md:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4 text-muted-foreground">
          {siteConfig.about.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <RevealGroup className="grid grid-cols-2 gap-3 self-start">
          {siteConfig.funFacts.map((fact) => {
            const empty = fact.value === FILL_ME_IN;
            return (
              <RevealItem key={fact.label}>
                <Card className="h-full gap-1.5 rounded-lg border border-line bg-card/60 p-4 ring-0 transition-colors hover:border-brand/50">
                  <span className="text-xl" aria-hidden="true">
                    {fact.emoji}
                  </span>
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                    {fact.label}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      empty && "text-muted-foreground/50 italic",
                    )}
                  >
                    {fact.value}
                  </span>
                </Card>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </Section>
  );
}
