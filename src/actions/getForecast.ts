import { getForecast } from "../api/weather.ts";
import { chooseCity } from "../presentation/input.ts";
import { printForecast, showError, showWarning } from "../presentation/output.ts";
import { runWithSpinner } from "../presentation/spinner.ts";
import { getCities } from "../storage/citiesStorage.ts";
import { getUnit } from "../storage/settingsStorage.ts";
import { formatPlace } from "../utils/format.ts";

/** Pronóstico de 7 días para una ciudad elegida de la lista. */
export async function showForecast(): Promise<void> {
  if (getCities().length === 0) {
    showWarning("  No hay ciudades guardadas. Usa la opción 3 para agregar la primera.\n");
    return;
  }
  console.log("  Ciudades guardadas:\n");
  const city = await chooseCity("ver el pronóstico");
  if (!city) return;

  try {
    const unit = getUnit();
    const forecast = await runWithSpinner(`Obteniendo pronóstico de ${formatPlace(city)}...`, () =>
      getForecast(city.latitude, city.longitude, unit),
    );
    printForecast(city, forecast, unit);
  } catch (error) {
    showError(`  No se pudo obtener el pronóstico de ${formatPlace(city)}: ${(error as Error).message}\n`);
  }
}
