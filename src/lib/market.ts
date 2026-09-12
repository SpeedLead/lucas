/**
 * Market indices, read out of Yahoo Finance's own header strip.
 *
 * There is no public JSON endpoint we can use here (query1.finance.yahoo.com
 * refuses anonymous server-side calls, and marketwatch.com sits behind a bot
 * wall that 401s every request without a real browser), so we parse the markup
 * Yahoo server-renders into `data-testid="market-indices-header"`.
 *
 * That markup is not a contract. If Yahoo changes it, `parseMarketIndices`
 * returns null and the section shows a "couldn't load" card rather than
 * breaking the page or the build.
 *
 * This file is pure and safe to import from client components; the network
 * side lives in `market-server.ts`.
 */

export const MARKET_SOURCE_URL = "https://finance.yahoo.com/";

/** Points kept per series after downsampling. Enough shape, small payload. */
const MAX_POINTS = 120;

/** One point of an intraday series: [x, value] with x normalised to 0…1. */
export type MarketPoint = [number, number];

export type MarketQuote = {
  symbol: string;
  name: string;
  /** Numbers drive the chart; the *Text fields are Yahoo's own formatting. */
  price: number;
  priceText: string;
  change: number | null;
  changeText: string | null;
  changePercent: number | null;
  changePercentText: string | null;
  /** Yesterday's close — the dashed baseline on the chart. */
  previousClose: number | null;
  low: number | null;
  high: number | null;
  /** Oldest → newest. Empty when the series could not be recovered. */
  points: MarketPoint[];
  href: string;
};

export type MarketSnapshot = {
  /** Which Yahoo tab this came from, e.g. "US Markets". */
  region: string;
  quotes: MarketQuote[];
  /** When we fetched it (ISO), plus the same instant in market time. */
  asOf: string;
  asOfLabel: string;
  sourceUrl: string;
};

const HEADER_MARKER = 'data-testid="market-indices-header"';
const ITEM_MARKER = 'data-testid="ticker-list-item"';

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&");
}

/** Reads one attribute out of a single tag's source text. */
function readAttr(tag: string, name: string): string | null {
  const match = new RegExp(`\\b${name}="([^"]*)"`).exec(tag);
  return match ? decodeEntities(match[1]) : null;
}

/**
 * Yahoo puts each live number in a <fin-streamer> carrying both the raw value
 * (data-value) and the formatted one (text content).
 */
function readStreamer(item: string, field: string) {
  const match = new RegExp(
    `<fin-streamer[^>]*\\bdata-field="${field}"[^>]*>([\\s\\S]*?)</fin-streamer>`,
  ).exec(item);
  if (!match) return null;

  const openTag = match[0].slice(0, match[0].indexOf(">"));
  const raw = readAttr(openTag, "data-value");
  const value = raw === null ? Number.NaN : Number(raw);
  const text = decodeEntities(match[1].replace(/<[^>]*>/g, "")).trim();

  return { value: Number.isFinite(value) ? value : null, text: text || null };
}

/** Every coordinate pair in an SVG path made only of M/L commands. */
function pathPoints(d: string): MarketPoint[] {
  const numbers = d.match(/-?\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length < 4) return [];

  const points: MarketPoint[] = [];
  for (let i = 0; i + 1 < numbers.length; i += 2) {
    points.push([Number(numbers[i]), Number(numbers[i + 1])]);
  }
  return points;
}

function downsample(points: MarketPoint[], max: number): MarketPoint[] {
  if (points.length <= max) return points;

  const step = (points.length - 1) / (max - 1);
  const out: MarketPoint[] = [];
  for (let i = 0; i < max - 1; i += 1) out.push(points[Math.round(i * step)]);
  out.push(points[points.length - 1]); // the last point is the current price
  return out;
}

/**
 * Rebuilds the intraday series from Yahoo's 56×24 sparkline.
 *
 * Two things make this possible. The dashed rule is drawn at yesterday's close,
 * and the dot marks the latest point — so we know two (y, value) pairs and the
 * scale is linear between them. When a series crosses its previous close Yahoo
 * emits one path per run above/below the line, hence the merge-and-sort.
 */
function readSeries(item: string, price: number, change: number | null) {
  const tags = [...item.matchAll(/<path\b[^>]*>/g)].map((match) => match[0]);

  const dashed = tags.find((tag) => tag.includes("stroke-dasharray"));
  const baselineY = dashed ? pathPoints(readAttr(dashed, "d") ?? "")[0]?.[1] : undefined;

  const dot = /<circle\b[^>]*>/.exec(item);
  const lastY = dot ? Number(readAttr(dot[0], "cy")) : Number.NaN;

  let raw: MarketPoint[] = [];
  for (const tag of tags) {
    // Skip the baseline rule, the gradient-filled area copy of the line, and
    // the chevron icons that share this markup.
    if (tag.includes("stroke-dasharray") || !tag.includes('fill="transparent"')) continue;
    const d = readAttr(tag, "d");
    if (!d || !d.includes("L")) continue;
    raw.push(...pathPoints(d));
  }

  raw.sort((a, b) => a[0] - b[0]);
  raw = raw.filter((point, i) => i === 0 || point[0] - raw[i - 1][0] > 1e-9);

  const previousClose = change === null ? null : price - change;
  const scalable =
    raw.length > 1 &&
    previousClose !== null &&
    baselineY !== undefined &&
    Number.isFinite(lastY) &&
    Math.abs(lastY - baselineY) > 1e-6;

  if (!scalable) return { previousClose, points: [] as MarketPoint[], low: null, high: null };

  const perUnitY = (price - previousClose) / (lastY - baselineY);
  const firstX = raw[0][0];
  const spanX = raw[raw.length - 1][0] - firstX || 1;

  const points = downsample(raw, MAX_POINTS).map(([x, y]): MarketPoint => {
    const value = previousClose + (y - baselineY) * perUnitY;
    return [round((x - firstX) / spanX, 5), round(value, 4)];
  });

  const values = points.map(([, value]) => value);
  return { previousClose, points, low: Math.min(...values), high: Math.max(...values) };
}

function round(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/** Pure, so it can be checked against a saved page without hitting the network. */
export function parseMarketIndices(html: string, asOf = new Date()): MarketSnapshot | null {
  const start = html.indexOf(HEADER_MARKER);
  if (start < 0) return null;

  const end = html.indexOf("</aside>", start);
  const region = html.slice(start, end > start ? end : start + 400_000);

  const quotes: MarketQuote[] = [];
  for (const item of region.split(ITEM_MARKER).slice(1)) {
    const symbol = readAttr(item, "data-symbol");
    const price = readStreamer(item, "regularMarketPrice");
    if (!symbol || !price?.value || !price.text) continue;

    const change = readStreamer(item, "regularMarketChange");
    const percent = readStreamer(item, "regularMarketChangePercent");
    const name = /data-testid="ticker-symbol-link"[\s\S]*?<span class="text[^"]*"[^>]*>([\s\S]*?)<\/span>/
      .exec(item);
    const series = readSeries(item, price.value, change?.value ?? null);

    quotes.push({
      symbol,
      name: name ? decodeEntities(name[1]).trim() : symbol,
      price: price.value,
      priceText: price.text,
      change: change?.value ?? null,
      changeText: change?.text ?? null,
      changePercent: percent?.value ?? null,
      changePercentText: percent?.text ?? null,
      href: `${MARKET_SOURCE_URL}quote/${encodeURIComponent(symbol)}/`,
      ...series,
    });
  }

  if (quotes.length === 0) return null;

  const selected = /role="option"\s+aria-selected(?!=")[^>]*>([^<]*)/.exec(region);

  return {
    region: selected ? decodeEntities(selected[1]).trim() : "US Markets",
    quotes,
    asOf: asOf.toISOString(),
    // Formatted on the server in market time so SSR and the client agree.
    asOfLabel: `${new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      minute: "2-digit",
    }).format(asOf)} ET`,
    sourceUrl: MARKET_SOURCE_URL,
  };
}
