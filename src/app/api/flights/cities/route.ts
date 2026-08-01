import { NextResponse, type NextRequest } from "next/server";
import { searchFlightableCities } from "@/lib/travelpayouts/cities";

export const runtime = "nodejs";

/**
 * Backs the Flights search form's origin/destination autocomplete. Never
 * ships Travelpayouts' full ~9,600-city reference dataset to the browser —
 * the client sends a query string, this searches server-side (where the
 * dataset is cached) and returns only the matches.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const cities = await searchFlightableCities(query);
  return NextResponse.json(
    { cities },
    { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
