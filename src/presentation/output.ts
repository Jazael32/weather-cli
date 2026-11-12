import type { City } from "../types/City.ts";
import type { CurrentWeather, DailyForecast, Unit } from "../types/Weather.ts";
import { bold, cyan, dim, green, red, yellow } from "../utils/colors.ts";
import { THIN_LINE } from "../utils/constants.ts";
import { formatDay, formatPlace, unitSymbol } from "../utils/format.ts";
import { weatherDescription, weatherEmoji } from "../utils/wmo.ts";

/** Imprime el clima actual de una ciudad. */
export function printWeather(city: City, weather: CurrentWeather, unit: Unit): void {
  const symbol = unitSymbol(unit);
  console.log(`  Clima en ${bold(formatPlace(city))}`);
  console.log(`  ${dim(THIN_LINE)}`);
  console.log(`  Temperatura: ${yellow(`${weather.temperature} ${symbol}`)}`);
  console.log(`  Humedad:     ${weather.humidity} %`);
  console.log(`  Viento:      ${weather.windSpeed} km/h\n`);
}

/** Imprime el pronóstico de 7 días de una ciudad. */
export function printForecast(city: City, forecast: DailyForecast[], unit: Unit): void {
  const symbol = unitSymbol(unit);
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

/** Imprime la lista numerada de ciudades; marca la default. */
export function printCityList(cities: City[], defaultCityId: number | null): void {
  cities.forEach((city, index) => {
    const marker = city.id === defaultCityId ? ` ${cyan("(default)")}` : "";
    console.log(`    ${index + 1}. ${formatPlace(city)}${marker}`);
  });
}

/** Confirmación en verde. */
export function showSuccess(message: string): void {
  console.log(green(message));
}

/** Error en rojo. */
export function showError(message: string): void {
  console.log(red(message));
}

/** Aviso en amarillo. */
export function showWarning(message: string): void {
  console.log(yellow(message));
}
