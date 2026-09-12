import { parseMarketIndices, MARKET_SOURCE_URL, type MarketSnapshot } from "@/lib/market";
import { cacheLife } from "next/cache";
import { request as httpsRequest } from "node:https";
import { createBrotliDecompress, createGunzip, createInflate } from "node:zlib";

/** Server-only: pulls the page down and hands back a parsed snapshot. */

// Yahoo's homepage is ~900 KB and regularly takes 2–5s to come back.
const TIMEOUT_MS = 15_000;
const MAX_BODY_BYTES = 8 * 1024 * 1024;
const MAX_REDIRECTS = 2;

const BROWSER_HEADERS = {
  // Yahoo server-renders the header strip only for browser-shaped requests.
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml",
  "accept-language": "en-US,en;q=0.9",
  "accept-encoding": "gzip, deflate, br",
} as const;

/**
 * Plain `node:https` rather than `fetch`, because Yahoo answers with roughly
 * 30 KB of response headers (a 19 KB `link:` preload list and an 8 KB CSP) and
 * undici caps them at 16 KB — `fetch` fails outright with "Headers Overflow
 * Error". `https.request` takes a `maxHeaderSize` per call, no runtime flag.
 */
function getPage(url: string, redirectsLeft = MAX_REDIRECTS): Promise<string | null> {
  return new Promise((resolve) => {
    const request = httpsRequest(
      url,
      { method: "GET", headers: BROWSER_HEADERS, maxHeaderSize: 64 * 1024, timeout: TIMEOUT_MS },
      (response) => {
        const status = response.statusCode ?? 0;
        const location = response.headers.location;

        if (status >= 300 && status < 400 && location && redirectsLeft > 0) {
          response.resume();
          resolve(getPage(new URL(location, url).toString(), redirectsLeft - 1));
          return;
        }
        if (status !== 200) {
          response.resume();
          resolve(null);
          return;
        }

        const encoding = response.headers["content-encoding"];
        const stream =
          encoding === "gzip"
            ? response.pipe(createGunzip())
            : encoding === "br"
              ? response.pipe(createBrotliDecompress())
              : encoding === "deflate"
                ? response.pipe(createInflate())
                : response;

        let body = "";
        stream.setEncoding("utf8");
        stream.on("data", (chunk: string) => {
          body += chunk;
          if (body.length > MAX_BODY_BYTES) {
            request.destroy();
            resolve(null);
          }
        });
        stream.on("end", () => resolve(body));
        stream.on("error", () => resolve(null));
      },
    );

    request.on("error", () => resolve(null));
    request.on("timeout", () => {
      request.destroy();
      resolve(null);
    });
    request.end();
  });
}

/**
 * Returns null on any failure — an unreachable Yahoo must not fail the build.
 *
 * Cached, so the page and `/api/market` share one scrape a minute however many
 * readers arrive. A failure gets its own short lifetime so a transient blip is
 * retried in half a minute instead of being pinned for the next ten.
 */
export async function fetchMarketSnapshot(): Promise<MarketSnapshot | null> {
  "use cache";

  let snapshot: MarketSnapshot | null = null;
  try {
    const html = await getPage(MARKET_SOURCE_URL);
    if (html) snapshot = parseMarketIndices(html);
  } catch {
    snapshot = null;
  }

  if (!snapshot) {
    // Short, but never 0: a `stale: 0` entry cannot be prerendered, which turns
    // a failed scrape during `next build` into a failed build.
    cacheLife({ stale: 30, revalidate: 30, expire: 60 });
    return null;
  }

  cacheLife({ stale: 60, revalidate: 60, expire: 600 });
  return snapshot;
}
