import { geocodeCity } from "../api/geocoding.ts";
import { ask, pickFromRange } from "../presentation/input.ts";
import { showError, showSuccess, showWarning } from "../presentation/output.ts";
import { runWithSpinner } from "../presentation/spinner.ts";
import { addCity } from "../storage/citiesStorage.ts";
import type { GeoResult } from "../types/GeoResult.ts";
import { formatPlace } from "../utils/format.ts";

/** Busca una ciudad por nombre y la agrega a la lista. */
export async function searchAndAddCity(): Promise<void> {
  const answer = await ask("  Nombre de la ciudad a buscar: ");
  if (answer === null) return;
  const query = answer.trim();
  if (!query) {
    showWarning("  No ingresaste ningún nombre.\n");
    return;
  }

  let results: GeoResult[];
  try {
    results = await runWithSpinner(`Buscando "${query}"...`, () => geocodeCity(query));
  } catch (error) {
    showError(`  Error al buscar: ${(error as Error).message}\n`);
    return;
  }
  if (results.length === 0) {
    showError(`  No se encontró ninguna ciudad llamada "${query}".\n`);
    return;
  }

  console.log("\n  Resultados de la búsqueda:");
  results.forEach((result, index) => {
    console.log(`    ${index + 1}. ${formatPlace(result)}`);
  });

  const index = await pickFromRange(results.length, "agregar");
  if (index === null) return;
  const result = results[index - 1];
  if (!result) {
    showWarning("  Número no válido.\n");
    return;
  }

  const outcome = addCity(result);
  if (outcome.status === "duplicate") {
    showWarning(`  ${formatPlace(outcome.city)} ya está en tu lista de ciudades.\n`);
    return;
  }

  showSuccess(`  Ciudad agregada: ${formatPlace(outcome.city)}`);
  if (outcome.becameDefault) {
    showSuccess("  Se estableció como ciudad default por ser la primera.\n");
  } else {
    console.log();
  }
}
