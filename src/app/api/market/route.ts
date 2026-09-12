import { fetchMarketSnapshot } from "@/lib/market-server";

/**
 * Lets the market section refresh itself without a page reload.
 *
 * The underlying Yahoo fetch is cached for 60s (see `fetchMarketSnapshot`), so
 * hammering this route costs us nothing — it just re-serves the same snapshot.
 */
export async function GET() {
  const snapshot = await fetchMarketSnapshot();

  if (!snapshot) {
    return Response.json({ error: "Market data is unavailable right now." }, { status: 503 });
  }

  return Response.json(snapshot, {
    headers: { "cache-control": "public, max-age=30, stale-while-revalidate=60" },
  });
}
