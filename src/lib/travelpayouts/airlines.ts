import "server-only";

type AirlineEntry = {
  code: string;
  name: string | null;
};

let cache: Map<string, string> | null = null;
let cachePromise: Promise<Map<string, string>> | null = null;

/**
 * Travelpayouts' own public static reference dataset — real airline names,
 * not fabricated. Only English names are reliably populated (French/Arabic
 * `name_translations` are almost entirely null upstream), so this is used
 * for every locale rather than guessing a translation ourselves. Falls back
 * to the bare IATA code (still a real API field) if a code isn't found.
 */
async function loadAirlines(): Promise<Map<string, string>> {
  if (cache) return cache;
  if (!cachePromise) {
    cachePromise = fetch("https://api.travelpayouts.com/data/en/airlines.json", {
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 86_400 },
    })
      .then((res) => (res.ok ? (res.json() as Promise<AirlineEntry[]>) : []))
      .then((entries) => {
        const map = new Map<string, string>();
        for (const entry of entries) {
          if (entry.name) map.set(entry.code, entry.name);
        }
        cache = map;
        return map;
      })
      .catch(() => new Map<string, string>());
  }
  return cachePromise;
}

export async function resolveAirlineName(iataCode: string): Promise<string> {
  try {
    const airlines = await loadAirlines();
    return airlines.get(iataCode) ?? iataCode;
  } catch {
    return iataCode;
  }
}
