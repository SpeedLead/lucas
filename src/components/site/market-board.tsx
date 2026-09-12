"use client";

import { formatPrice, MarketChart } from "@/components/site/market-chart";
import { Card } from "@/components/ui/card";
import type { MarketQuote, MarketSnapshot } from "@/lib/market";
import { MARKET_SOURCE_URL } from "@/lib/market";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function MarketBoard({
  initial,
  refreshSeconds,
}: {
  initial: MarketSnapshot | null;
  refreshSeconds: number;
}) {
  const [snapshot, setSnapshot] = useState(initial);
  const [stale, setStale] = useState(false);
  // Tracked by symbol, not row index, so a refresh that reorders the list keeps
  // the reader on the index they picked.
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (document.hidden) return;
      try {
        const response = await fetch("/api/market", { cache: "no-store" });
        if (!response.ok) throw new Error(String(response.status));
        const next: MarketSnapshot = await response.json();
        if (cancelled) return;
        setSnapshot(next);
        setStale(false);
      } catch {
        if (!cancelled) setStale(true);
      }
    }

    // The page may have been built when Yahoo was unreachable; try once here.
    if (!initial) void load();

    const timer = refreshSeconds > 0 ? setInterval(load, refreshSeconds * 1000) : null;
    const onVisible = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [initial, refreshSeconds]);

  const quotes = snapshot?.quotes ?? [];
  // `active` is undefined only if a refresh hands back an empty list.
  const active = quotes.find((quote) => quote.symbol === picked) ?? quotes[0];
  if (!snapshot || !active) return <MarketUnavailable retrying={!stale} />;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Left: the index the reader is pointing at, in full. */}
      <Card className="h-full gap-0 rounded-lg border border-line p-5 ring-0">
        <p className="mb-3 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
          Hover an index &rarr;
        </p>

        <div className="mb-1 flex items-baseline justify-between gap-3">
          <h3 className="font-display text-2xl tracking-wide">{active.name}</h3>
          <span className="font-mono text-[0.65rem] text-muted-foreground">{active.symbol}</span>
        </div>

        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-mono text-3xl text-foreground">{active.priceText}</span>
          <Delta quote={active} />
        </div>

        {/* flex-1: the chart takes whatever height the taller card leaves over,
            instead of stranding it at the bottom of this one. */}
        <div className="flex flex-1 flex-col justify-center">
          <MarketChart quote={active} />
        </div>

        <DayRange quote={active} />
      </Card>

      {/* Right: every index, in the same label/value rhythm as the other cards. */}
      <Card className="h-full gap-0 overflow-hidden rounded-lg border border-line p-0 ring-0">
        <div className="flex items-center justify-between gap-2 border-b border-line bg-secondary px-5 py-2.5">
          <span className="font-display text-lg tracking-wide">{snapshot.region}</span>
          <span className="flex items-center gap-1.5 font-mono text-[0.6rem] tracking-wider text-muted-foreground">
            <span
              className={cn(
                "size-1.5 rounded-full",
                stale ? "bg-muted-foreground" : "bg-up motion-safe:animate-pulse",
              )}
              aria-hidden="true"
            />
            {stale ? "RECONNECTING" : `AS OF ${snapshot.asOfLabel.toUpperCase()}`}
          </span>
        </div>

        <ul className="px-5 py-1">
          {quotes.map((quote) => {
            const selected = quote.symbol === active.symbol;
            return (
              <li key={quote.symbol} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  onPointerEnter={() => setPicked(quote.symbol)}
                  onFocus={() => setPicked(quote.symbol)}
                  onClick={() => setPicked(quote.symbol)}
                  aria-pressed={selected}
                  className={cn(
                    "-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
                    selected ? "bg-foreground/[0.04]" : "hover:bg-foreground/[0.04]",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate text-sm">{quote.name}</span>
                  <Sparkline quote={quote} />
                  <span className="shrink-0 text-right">
                    <span className="block font-mono text-sm tabular-nums text-foreground">
                      {quote.priceText}
                    </span>
                    <Delta quote={quote} compact />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="px-5 pb-3 pt-2 text-[0.7rem] text-muted-foreground">
          Scraped from{" "}
          <a
            href={MARKET_SOURCE_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="underline decoration-line underline-offset-2 hover:text-brand"
          >
            Yahoo Finance
          </a>
          . Delayed, and definitely not advice.
        </p>
      </Card>
    </div>
  );
}

/**
 * The arrow and the sign carry the direction as well as the colour does, so
 * red/green never has to do that job alone.
 */
function Delta({ quote, compact = false }: { quote: MarketQuote; compact?: boolean }) {
  if (quote.changeText === null && quote.changePercentText === null) return null;
  const up = (quote.change ?? 0) >= 0;

  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        compact ? "block text-[0.7rem]" : "text-sm",
        up ? "text-up" : "text-down",
      )}
    >
      <span aria-hidden="true">{up ? "▲" : "▼"} </span>
      <span className="sr-only">{up ? "up " : "down "}</span>
      {compact ? quote.changePercentText : `${quote.changeText} (${quote.changePercentText})`}
    </span>
  );
}

/**
 * Where today's price sits between the low and the high — a ratio against a
 * limit, so a meter rather than another chart. Prev close rides along as text
 * because it often falls outside the day's range.
 */
function DayRange({ quote }: { quote: MarketQuote }) {
  const { low, high, price, previousClose } = quote;
  const up = (quote.change ?? 0) >= 0;

  if (low === null || high === null) return null;
  const position = high === low ? 50 : ((price - low) / (high - low)) * 100;

  return (
    <div className={cn("mt-4 border-t border-line pt-3", up ? "text-up" : "text-down")}>
      <div className="flex items-baseline justify-between gap-3 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground">
        <span>Today&apos;s range</span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-px w-3 shrink-0 border-t border-dashed border-muted-foreground/70"
            aria-hidden="true"
          />
          Prev close {previousClose === null ? "—" : formatPrice(previousClose)}
        </span>
      </div>

      <div
        className="relative mt-2.5 h-1.5 rounded-full bg-line/70"
        role="meter"
        aria-valuenow={Math.round(position)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${quote.name} at ${quote.priceText}, between today's low of ${formatPrice(low)} and high of ${formatPrice(high)}`}
      >
        <span
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current ring-2 ring-card"
          style={{ left: `${clampPercent(position)}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="mt-1.5 flex justify-between font-mono text-[0.7rem] tabular-nums text-foreground">
        <span>{formatPrice(low)}</span>
        <span>{formatPrice(high)}</span>
      </div>
    </div>
  );
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/** 
 * Row trend. Shape only — the number beside it is the value, so this stays a
 * thin mark with no axis, no labels and no fill.
 */
function Sparkline({ quote }: { quote: MarketQuote }) {
  if (quote.points.length < 2) return <span className="hidden w-14 sm:block" aria-hidden="true" />;

  const values = quote.points.map(([, value]) => value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const d = quote.points
    .map(([fraction, value], i) => {
      const x = 1 + fraction * 54;
      const y = 1 + (1 - (value - min) / span) * 18;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 56 20"
      className={cn("hidden w-14 shrink-0 sm:block", (quote.change ?? 0) >= 0 ? "text-up" : "text-down")}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function MarketUnavailable({ retrying }: { retrying: boolean }) {
  return (
    <Card className="rounded-lg border border-line p-5 ring-0">
      <p className="text-sm text-muted-foreground">
        {retrying ? (
          <>Fetching today&apos;s numbers…</>
        ) : (
          <>
            Couldn&apos;t reach the market data just now. It&apos;s scraped live from{" "}
            <a
              href={MARKET_SOURCE_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="underline decoration-line underline-offset-2 hover:text-brand"
            >
              Yahoo Finance
            </a>
            , so this happens sometimes — it should sort itself out in a minute.
          </>
        )}
      </p>
    </Card>
  );
}

export function MarketBoardSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="h-[22rem] rounded-lg border border-line ring-0 motion-safe:animate-pulse" />
      <Card className="h-[22rem] rounded-lg border border-line ring-0 motion-safe:animate-pulse" />
    </div>
  );
}
