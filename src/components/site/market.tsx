import { MarketBoard, MarketBoardSkeleton } from "@/components/site/market-board";
import { Section } from "@/components/site/section";
import { fetchMarketSnapshot } from "@/lib/market-server";
import { siteConfig } from "@/lib/site-config";
import { Suspense } from "react";

export function Market() {
  const { blurb } = siteConfig.market;

  return (
    <Section id="market" eyebrow="Hobby no. 2" title="Markets 📈" blurb={blurb}>
      {/* The heading ships immediately; only the board waits on Yahoo. */}
      <Suspense fallback={<MarketBoardSkeleton />}>
        <MarketData />
      </Suspense>
    </Section>
  );
}

async function MarketData() {
  // Handed over even when null: the board shows the "couldn't load" card and
  // retries from the browser, so a page built while Yahoo was down heals itself
  // for the reader instead of staying broken until the next deploy.
  const snapshot = await fetchMarketSnapshot();

  return <MarketBoard initial={snapshot} refreshSeconds={siteConfig.market.refreshSeconds} />;
}
