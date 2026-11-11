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

/** Pronóstico de un día. */
export type DailyForecast = {
  /** Fecha ISO "2026-11-10". */
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  /** Probabilidad máxima de precipitación (0-100). */
  precipProb: number;
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

/** Obtiene el pronóstico diario de unas coordenadas (OpenMeteo Forecast API). */
export async function getForecast(
  latitude: number,
  longitude: number,
  unit: Unit,
  days = 7,
): Promise<DailyForecast[]> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    forecast_days: String(days),
    timezone: "auto",
    temperature_unit: unit,
  });
  const data = (await fetchJson(`${FORECAST_URL}?${params}`)) as {
    daily?: {
      time?: string[];
      weather_code?: (number | null)[];
      temperature_2m_max?: (number | null)[];
      temperature_2m_min?: (number | null)[];
      precipitation_probability_max?: (number | null)[];
    };
  };
  const daily = data.daily;
  if (!daily?.time?.length) {
    throw new Error("respuesta inesperada de la API");
  }
  return daily.time.map((date, index) => ({
    date,
    weatherCode: daily.weather_code?.[index] ?? 0,
    tempMax: daily.temperature_2m_max?.[index] ?? 0,
    tempMin: daily.temperature_2m_min?.[index] ?? 0,
    precipProb: daily.precipitation_probability_max?.[index] ?? 0,
  }));
}
