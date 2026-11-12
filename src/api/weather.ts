import type { CurrentWeather, DailyForecast, Unit } from "../types/Weather.ts";
import { fetchJson } from "./client.ts";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

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
