import { getWeather } from "../api/weather.ts";
import { printWeather, showError, showWarning } from "../presentation/output.ts";
import { runWithSpinner } from "../presentation/spinner.ts";
import { getDefaultCity, getCities } from "../storage/citiesStorage.ts";
import { getUnit } from "../storage/settingsStorage.ts";
import type { City } from "../types/City.ts";
import { formatPlace } from "../utils/format.ts";

/** Muestra el clima de una ciudad con spinner y manejo de errores en español.
 *  Con `label` se personaliza el texto del spinner (p. ej. con progreso). */
async function showCityWeather(city: City, label?: string): Promise<void> {
  const spinnerLabel = label ?? `Obteniendo clima de ${formatPlace(city)}...`;
  const unit = getUnit();
  try {
    const weather = await runWithSpinner(spinnerLabel, () =>
      getWeather(city.latitude, city.longitude, unit),
    );
    printWeather(city, weather, unit);
  } catch (error) {
    showError(`  No se pudo obtener el clima de ${formatPlace(city)}: ${(error as Error).message}\n`);
  }
}

/** Clima de la ciudad guardada como default. */
export async function showDefaultWeather(): Promise<void> {
  const city = getDefaultCity();
  if (!city) {
    showWarning("  Aún no hay ciudad default. Usa la opción 5 para establecerla.\n");
    return;
  }
  await showCityWeather(city);
}

/** Clima de todas las ciudades guardadas, con progreso en el spinner. */
export async function showAllWeather(): Promise<void> {
  const cities = getCities();
  if (cities.length === 0) {
    showWarning("  No hay ciudades guardadas. Usa la opción 3 para agregar la primera.\n");
    return;
  }
  const total = cities.length;
  for (const [index, city] of cities.entries()) {
    await showCityWeather(city, `Obteniendo clima de ${city.name} (${index + 1}/${total})...`);
  }
}
