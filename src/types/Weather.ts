/** Unidad de temperatura configurada en ajustes. */
export type Unit = "celsius" | "fahrenheit";

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
