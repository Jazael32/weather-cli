import type { CurrentWeather, DailyForecast, GeoResult } from "./api.ts";
import { bold, cyan, dim, yellow } from "./colors.ts";
import { weatherDescription, weatherEmoji } from "./wmo.ts";
import type { City, MenuOption, Store, Unit } from "./types.ts";

/** Ancho del menú, igual al ejemplo del README. */
const WIDTH = 40;

const THICK_LINE = "═".repeat(WIDTH);
const THIN_LINE = "─".repeat(WIDTH - 2);

/** Nombre de lugar legible: "Ottawa, Ontario, Canadá". */
export function formatPlace(place: City | GeoResult): string {
  const parts = [place.name];
  if (place.admin1) parts.push(place.admin1);
  if (place.country) parts.push(place.country);
  return parts.join(", ");
}

/** Menú principal: se renderiza a partir del array de opciones. */
export function renderMenu(store: Store, options: MenuOption[]): string {
  return [
    cyan(THICK_LINE),
    `         ${bold(cyan("WEATHER CLI"))}`,
    cyan(THICK_LINE),
    ...options.map((option) => `  ${cyan(option.key)}. ${option.label(store)}`),
    cyan(THICK_LINE),
  ].join("\n");
}

/** Imprime el clima actual de una ciudad. */
export function printWeather(city: City, weather: CurrentWeather, unit: Unit): void {
  const symbol = unit === "celsius" ? "°C" : "°F";
  console.log(`  Clima en ${bold(formatPlace(city))}`);
  console.log(`  ${dim(THIN_LINE)}`);
  console.log(`  Temperatura: ${yellow(`${weather.temperature} ${symbol}`)}`);
  console.log(`  Humedad:     ${weather.humidity} %`);
  console.log(`  Viento:      ${weather.windSpeed} km/h\n`);
}

/** "mar 10 nov" a partir de la fecha ISO "2026-11-10" (al mediodía local,
 *  para evitar desfases de zona horaria). */
function formatDay(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  const parts = new Intl.DateTimeFormat("es", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).formatToParts(date);
  const get = (type: string): string =>
    parts.find((part) => part.type === type)?.value.replace(/\.$/, "") ?? "";
  return `${get("weekday")} ${get("day")} ${get("month")}`;
}

/** Imprime el pronóstico de 7 días de una ciudad. */
export function printForecast(city: City, forecast: DailyForecast[], unit: Unit): void {
  const symbol = unit === "celsius" ? "°C" : "°F";
  console.log(`  Pronóstico de 7 días para ${bold(formatPlace(city))} (${symbol})`);
  console.log(`  ${dim(THIN_LINE)}`);
  for (const day of forecast) {
    const date = formatDay(day.date).padEnd(10);
    const min = cyan(`mín ${String(Math.round(day.tempMin)).padStart(3)}°`);
    const max = yellow(`máx ${String(Math.round(day.tempMax)).padStart(3)}°`);
    const rain = `💧${String(day.precipProb).padStart(3)}%`;
    const description = weatherDescription(day.weatherCode).padEnd(28);
    console.log(`  ${date}  ${min}  ${max}  ${rain}   ${description}${weatherEmoji(day.weatherCode)}`);
  }
  console.log();
}
