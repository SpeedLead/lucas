import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-line py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-5 text-center font-mono text-xs text-muted-foreground">
        <p>
          made by {siteConfig.name.toLowerCase()}{" "}
          <span className="text-brand" aria-hidden="true">
            ●
          </span>{" "}
          thanks for stopping by
        </p>
        <p className="text-muted-foreground/60">
          built with next.js + typescript + tailwind · no cookies, no tracking, just pong
        </p>
      </div>
    </footer>
  );
}
