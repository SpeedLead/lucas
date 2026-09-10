"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const LINKS = [
  { id: "about", label: "About" },
  { id: "table-tennis", label: "Table Tennis" },
  { id: "guitar", label: "Guitar" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Say hi" },
] as const;

export function SiteNav() {
  const [active, setActive] = useState<string>("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const sections = LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => el !== null,
    );

    const io = new IntersectionObserver(
      (entries) => {
        // The section closest to the top of the viewport wins.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((el) => io.observe(el));

    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-300",
        scrolled
          ? "border-line bg-background/80 backdrop-blur-md"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5">
        <a
          href="#top"
          className="group flex shrink-0 items-center gap-2 font-display text-lg tracking-wide"
        >
          <span className="size-2.5 rounded-full bg-brand shadow-[0_0_0_3px_rgba(255,106,19,0.2)] transition-transform duration-300 group-hover:scale-125" />
          LUCAS
        </a>

        <div className="-mr-1 flex items-center gap-1 overflow-x-auto text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className={cn(
                "whitespace-nowrap rounded-md px-2.5 py-1.5 transition-colors",
                active === link.id
                  ? "text-brand"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
