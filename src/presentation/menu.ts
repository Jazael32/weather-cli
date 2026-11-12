import type { MenuOption } from "../types/MenuOption.ts";
import { bold, cyan } from "../utils/colors.ts";
import { THICK_LINE } from "../utils/constants.ts";
import { ask } from "./input.ts";
import { showWarning } from "./output.ts";

/** Menú principal: se renderiza a partir del array de opciones. */
export function renderMenu(options: MenuOption[]): string {
  return [
    cyan(THICK_LINE),
    `         ${bold(cyan("WEATHER CLI"))}`,
    cyan(THICK_LINE),
    ...options.map((option) => `  ${cyan(option.key)}. ${option.label()}`),
    cyan(THICK_LINE),
  ].join("\n");
}

/** Bucle principal: renderiza el menú y ejecuta la opción elegida hasta salir. */
export async function runMenu(options: MenuOption[]): Promise<void> {
  let running = true;

  while (running) {
    console.log(renderMenu(options));
    const answer = await ask("  Selecciona una opción: ");
    if (answer === null) break; // entrada cerrada: salir
    console.log();

    const option = options.find((o) => o.key === answer.trim());
    if (!option) {
      showWarning("  Opción no válida. Intenta de nuevo.\n");
      continue;
    }
    await option.handler?.();
    if (option.exit) running = false;
  }
}
