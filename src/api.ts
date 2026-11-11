import type { Unit } from "./types.ts";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

/** Resultado de la API de geocoding (un lugar encontrado por nombre). */
export type GeoResult = {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
};

/** Clima actual de una ciudad. */
export type CurrentWeather = {
  temperature: number;
  humidity: number;
  windSpeed: number;
};

async function fetchJson(url: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error("no se pudo conectar, revisa tu conexión a internet");
  }
  if (!response.ok) {
    throw new Error(`la API respondió con código ${response.status}`);
  }
  return response.json();
}

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

/** Obtiene el clima actual de unas coordenadas (OpenMeteo Forecast API). */
export async function getWeather(
  latitude: number,
  longitude: number,
  unit: Unit,
): Promise<CurrentWeather> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,relative_humidity_2m,wind_speed_10m",
    temperature_unit: unit,
  });
  const data = (await fetchJson(`${FORECAST_URL}?${params}`)) as {
    current?: {
      temperature_2m?: number;
      relative_humidity_2m?: number;
      wind_speed_10m?: number;
    };
  };
  const current = data.current;
  if (!current || current.temperature_2m === undefined) {
    throw new Error("respuesta inesperada de la API");
  }
  return {
    temperature: current.temperature_2m,
    humidity: current.relative_humidity_2m ?? 0,
    windSpeed: current.wind_speed_10m ?? 0,
  };
}
