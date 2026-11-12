import type { City } from "../types/City.ts";
import type { GeoResult } from "../types/GeoResult.ts";
import type { Unit } from "../types/Weather.ts";

/** Nombre de lugar legible: "Ottawa, Ontario, Canadá". */
export function formatPlace(place: City | GeoResult): string {
  const parts = [place.name];
  if (place.admin1) parts.push(place.admin1);
  if (place.country) parts.push(place.country);
  return parts.join(", ");
}

/** "mar 10 nov" a partir de la fecha ISO "2026-11-10" (al mediodía local,
 *  para evitar desfases de zona horaria). */
export function formatDay(isoDate: string): string {
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

/** Símbolo de la unidad de temperatura: "°C" o "°F". */
export function unitSymbol(unit: Unit): string {
  return unit === "celsius" ? "°C" : "°F";
}
