import { ask } from "../presentation/input.ts";
import { showSuccess } from "../presentation/output.ts";
import { getUnit, toggleUnit } from "../storage/settingsStorage.ts";
import { unitSymbol } from "../utils/format.ts";

/** Muestra los ajustes y permite alternar la unidad de temperatura. */
export async function openSettings(): Promise<void> {
  const unit = getUnit();
  const current = unitSymbol(unit);
  const next = unitSymbol(unit === "celsius" ? "fahrenheit" : "celsius");
  console.log("  Ajustes");
  console.log(`  Unidad de temperatura actual: ${current}\n`);
  console.log(`  1. Cambiar a ${next}`);
  console.log("  2. Volver");
  const answer = await ask("  Selecciona una opción: ");
  if (answer === null || answer.trim() !== "1") return;

  toggleUnit();
  showSuccess(`\n  Unidad de temperatura actualizada a ${next}.\n`);
}
