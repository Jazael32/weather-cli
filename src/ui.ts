import type { CurrentWeather, GeoResult } from "./api.ts";
import type { City, Store, Unit } from "./types.ts";

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

/** Menú principal, con el contador de ciudades y la unidad actuales. */
export function renderMenu(store: Store): string {
  const unit = store.settings.unit === "celsius" ? "°C" : "°F";
  return [
    THICK_LINE,
    "         WEATHER CLI",
    THICK_LINE,
    "  1. Clima de ciudad default",
    `  2. Clima de todas las ciudades (${store.cities.length})`,
    "  3. Buscar y agregar ciudad",
    "  4. Eliminar ciudad",
    "  5. Establecer ciudad default",
    `  8. Ajustes (${unit})`,
    "  9. Salir",
    THICK_LINE,
  ].join("\n");
}

/** Imprime el clima actual de una ciudad. */
export function printWeather(city: City, weather: CurrentWeather, unit: Unit): void {
  const symbol = unit === "celsius" ? "°C" : "°F";
  console.log(`  Clima en ${formatPlace(city)}`);
  console.log(`  ${THIN_LINE}`);
  console.log(`  Temperatura: ${weather.temperature} ${symbol}`);
  console.log(`  Humedad:     ${weather.humidity} %`);
  console.log(`  Viento:      ${weather.windSpeed} km/h\n`);
}
