import type { GeoResult } from "../types/GeoResult.ts";
import { fetchJson } from "./client.ts";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

/** Busca ciudades por nombre (Geocoding API, resultados en español). */
export async function geocodeCity(name: string, count = 5): Promise<GeoResult[]> {
  const params = new URLSearchParams({
    name,
    count: String(count),
    language: "es",
    format: "json",
  });
  const data = (await fetchJson(`${GEOCODING_URL}?${params}`)) as { results?: GeoResult[] };
  return data.results ?? [];
}
