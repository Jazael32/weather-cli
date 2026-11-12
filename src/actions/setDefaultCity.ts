import { chooseCity } from "../presentation/input.ts";
import { showSuccess, showWarning } from "../presentation/output.ts";
import { getCities, setDefaultCityById } from "../storage/citiesStorage.ts";
import { formatPlace } from "../utils/format.ts";

/** Establece una ciudad elegida de la lista como default. */
export async function setDefaultCity(): Promise<void> {
  if (getCities().length === 0) {
    showWarning("  No hay ciudades guardadas. Usa la opción 3 para agregar la primera.\n");
    return;
  }
  console.log("  Ciudades guardadas:\n");
  const city = await chooseCity("establecer como default");
  if (!city) return;

  setDefaultCityById(city.id);
  showSuccess(`  Ciudad default: ${formatPlace(city)}\n`);
}
