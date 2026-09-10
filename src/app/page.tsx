import { About } from "@/components/site/about";
import { Contact } from "@/components/site/contact";
import { SiteFooter } from "@/components/site/footer";
import { Guitar } from "@/components/site/guitar";
import { Hero } from "@/components/site/hero";
import { SiteNav } from "@/components/site/nav";
import { Projects } from "@/components/site/projects";
import { TableTennis } from "@/components/site/table-tennis";

export default function HomePage() {
  return (
    <>
      <a
        href="#about"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-black"
      >
        Skip to content
      </a>

      <SiteNav />

      <main>
        <Hero />
        <About />
        <TableTennis />
        <Guitar />
        <Projects />
        <Contact />
      </main>

      <SiteFooter />
    </>
  );
}
