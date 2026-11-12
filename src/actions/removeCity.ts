import { chooseCity } from "../presentation/input.ts";
import { showSuccess, showWarning } from "../presentation/output.ts";
import { getCities, removeCityById } from "../storage/citiesStorage.ts";
import { formatPlace } from "../utils/format.ts";

/** Elimina una ciudad elegida de la lista; si era la default, la primera
 *  restante pasa a serlo. */
export async function removeCity(): Promise<void> {
  if (getCities().length === 0) {
    showWarning("  No hay ciudades guardadas.\n");
    return;
  }
  console.log("  Ciudades guardadas:\n");
  const city = await chooseCity("eliminar");
  if (!city) return;

  const result = removeCityById(city.id);
  if (!result) return;

  showSuccess(`  Ciudad eliminada: ${formatPlace(result.removed)}`);
  if (result.wasDefault) {
    if (result.newDefault) {
      showSuccess(`  Nueva ciudad default: ${formatPlace(result.newDefault)}.\n`);
    } else {
      console.log("  Ya no hay ciudad default.\n");
    }
  } else {
    console.log();
  }
}
