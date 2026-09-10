import { Magnetic } from "@/components/motion/magnetic";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

export function Contact() {
  const needsEmail = siteConfig.email.includes("example.com");

  return (
    <section
      id="contact"
      className="relative scroll-mt-16 overflow-hidden border-t border-dashed border-line py-20 md:py-28"
    >
      <div className="relative mx-auto max-w-5xl px-5 text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-[100px]"
        />

        <Reveal className="relative">
          <p className="mb-3 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-brand">
            Making friends
          </p>
          <h2 className="font-display text-5xl tracking-tight md:text-6xl">
            {siteConfig.contact.heading}
          </h2>
          <p className="mx-auto mt-4 max-w-[52ch] text-muted-foreground">
            {siteConfig.contact.blurb}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Magnetic>
              <Button asChild size="lg" className="rounded-full">
                <a href={`mailto:${siteConfig.email}`}>{siteConfig.contact.cta} →</a>
              </Button>
            </Magnetic>
            {siteConfig.socials.map((social) => (
              <Magnetic key={social.label}>
                <Button asChild variant="outline" size="lg" className="rounded-full">
                  <a href={social.href} target="_blank" rel="noreferrer noopener">
                    {social.label}
                  </a>
                </Button>
              </Magnetic>
            ))}
          </div>

          <p className="mt-6 font-mono text-xs text-muted-foreground">
            {siteConfig.email}
          </p>

          {needsEmail ? (
            <p className="mx-auto mt-4 max-w-md rounded-md border border-dashed border-brand/50 bg-brand/5 px-4 py-2.5 font-mono text-xs text-brand">
              👋 Lucas — put your real email in{" "}
              <code>src/lib/site-config.ts</code> before you deploy. (Only you see
              this note; it disappears once you change it.)
            </p>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
