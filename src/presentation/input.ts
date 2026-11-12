import * as readline from "node:readline";
import { getCities, getDefaultCity } from "../storage/citiesStorage.ts";
import type { City } from "../types/City.ts";
import { printCityList, showWarning } from "./output.ts";

/** Interfaz de entrada con cola de líneas: no pierde líneas que llegan entre
 *  preguntas (entrada por pipe) y funciona igual en modo interactivo. */
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const queuedLines: string[] = [];
let lineWaiter: ((line: string | null) => void) | null = null;
let inputClosed = false;

rl.on("line", (line: string) => {
  if (lineWaiter) {
    const resolve = lineWaiter;
    lineWaiter = null;
    resolve(line);
  } else {
    queuedLines.push(line);
  }
});

function onInputEnd(): void {
  inputClosed = true;
  if (lineWaiter) {
    const resolve = lineWaiter;
    lineWaiter = null;
    resolve(null);
  }
}

rl.on("close", onInputEnd);
process.stdin.on("end", onInputEnd);
process.stdin.on("close", onInputEnd);

/** Escribe el prompt y lee una línea; null si la entrada se cerró (EOF). */
export function ask(prompt: string): Promise<string | null> {
  process.stdout.write(prompt);
  const queued = queuedLines.shift();
  if (queued !== undefined) return Promise.resolve(queued);
  if (inputClosed) return Promise.resolve(null);
  return new Promise<string | null>((resolve) => {
    lineWaiter = resolve;
  });
}

/** Cierra la interfaz de entrada al terminar la app. */
export function closeInput(): void {
  rl.close();
}

/** Pide un número del 1 al máximo; null si se cancela, es inválido o se
 *  cerró la entrada. */
export async function pickFromRange(max: number, action: string): Promise<number | null> {
  const answer = await ask(`\n  Número de la ciudad a ${action} (0 para cancelar): `);
  if (answer === null) return null;
  const trimmed = answer.trim();
  if (trimmed === "0") {
    console.log("  Operación cancelada.\n");
    return null;
  }
  const num = Number(trimmed);
  if (!Number.isInteger(num) || num < 1 || num > max) {
    showWarning("  Número no válido.\n");
    return null;
  }
  return num;
}

/** Lista las ciudades guardadas y pide un número; null si se cancela, es
 *  inválido o se cerró la entrada. */
export async function chooseCity(action: string): Promise<City | null> {
  const cities = getCities();
  printCityList(cities, getDefaultCity()?.id ?? null);
  const num = await pickFromRange(cities.length, action);
  if (num === null) return null;
  return cities[num - 1] ?? null;
}
