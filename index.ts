import * as readline from "node:readline";
import { geocodeCity, getForecast, getWeather } from "./src/api.ts";
import type { GeoResult } from "./src/api.ts";
import { cyan, green, red, yellow } from "./src/colors.ts";
import { loadStore, saveStore } from "./src/storage.ts";
import { runWithSpinner } from "./src/spinner.ts";
import type { City, MenuOption, Store } from "./src/types.ts";
import { formatPlace, printForecast, printWeather, renderMenu } from "./src/ui.ts";

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
function ask(prompt: string): Promise<string | null> {
  process.stdout.write(prompt);
  const queued = queuedLines.shift();
  if (queued !== undefined) return Promise.resolve(queued);
  if (inputClosed) return Promise.resolve(null);
  return new Promise<string | null>((resolve) => {
    lineWaiter = resolve;
  });
}

function nextCityId(store: Store): number {
  return store.cities.reduce((max, city) => Math.max(max, city.id), 0) + 1;
}

/** Muestra el clima de una ciudad con spinner y manejo de errores en español.
 *  Con `label` se personaliza el texto del spinner (p. ej. con progreso). */
async function showCityWeather(city: City, store: Store, label?: string): Promise<void> {
  const spinnerLabel = label ?? `Obteniendo clima de ${formatPlace(city)}...`;
  try {
    const weather = await runWithSpinner(spinnerLabel, () =>
      getWeather(city.latitude, city.longitude, store.settings.unit),
    );
    printWeather(city, weather, store.settings.unit);
  } catch (error) {
    console.log(red(`  No se pudo obtener el clima de ${formatPlace(city)}: ${(error as Error).message}\n`));
  }
}

async function showDefaultWeather(store: Store): Promise<void> {
  const city = store.cities.find((c) => c.id === store.defaultCityId);
  if (!city) {
    console.log(yellow("  Aún no hay ciudad default. Usa la opción 5 para establecerla.\n"));
    return;
  }
  await showCityWeather(city, store);
}

async function showAllWeather(store: Store): Promise<void> {
  if (store.cities.length === 0) {
    console.log(yellow("  No hay ciudades guardadas. Usa la opción 3 para agregar la primera.\n"));
    return;
  }
  const total = store.cities.length;
  for (const [index, city] of store.cities.entries()) {
    await showCityWeather(city, store, `Obteniendo clima de ${city.name} (${index + 1}/${total})...`);
  }
}

/** Pronóstico de 7 días para una ciudad elegida de la lista. */
async function showForecast(store: Store): Promise<void> {
  if (store.cities.length === 0) {
    console.log(yellow("  No hay ciudades guardadas. Usa la opción 3 para agregar la primera.\n"));
    return;
  }
  console.log("  Ciudades guardadas:\n");
  const city = await chooseCity(store, "ver el pronóstico");
  if (!city) return;

  try {
    const forecast = await runWithSpinner(`Obteniendo pronóstico de ${formatPlace(city)}...`, () =>
      getForecast(city.latitude, city.longitude, store.settings.unit),
    );
    printForecast(city, forecast, store.settings.unit);
  } catch (error) {
    console.log(red(`  No se pudo obtener el pronóstico de ${formatPlace(city)}: ${(error as Error).message}\n`));
  }
}

function listCities(store: Store): void {
  store.cities.forEach((city, index) => {
    const marker = city.id === store.defaultCityId ? ` ${cyan("(default)")}` : "";
    console.log(`    ${index + 1}. ${formatPlace(city)}${marker}`);
  });
}

/** Lista las ciudades guardadas y pide un número; null si se cancela, es
 *  inválido o se cerró la entrada. */
async function chooseCity(store: Store, action: string): Promise<City | null> {
  listCities(store);
  const num = await pickFromRange(store.cities.length, action);
  if (num === null) return null;
  return store.cities[num - 1] ?? null;
}

/** Pide un número del 1 al máximo; null si se cancela, es inválido o se
 *  cerró la entrada. */
async function pickFromRange(max: number, action: string): Promise<number | null> {
  const answer = await ask(`\n  Número de la ciudad a ${action} (0 para cancelar): `);
  if (answer === null) return null;
  const trimmed = answer.trim();
  if (trimmed === "0") {
    console.log("  Operación cancelada.\n");
    return null;
  }
  const num = Number(trimmed);
  if (!Number.isInteger(num) || num < 1 || num > max) {
    console.log(yellow("  Número no válido.\n"));
    return null;
  }
  return num;
}

async function searchAndAddCity(store: Store): Promise<void> {
  const answer = await ask("  Nombre de la ciudad a buscar: ");
  if (answer === null) return;
  const query = answer.trim();
  if (!query) {
    console.log(yellow("  No ingresaste ningún nombre.\n"));
    return;
  }

  let results: GeoResult[];
  try {
    results = await runWithSpinner(`Buscando "${query}"...`, () => geocodeCity(query));
  } catch (error) {
    console.log(red(`  Error al buscar: ${(error as Error).message}\n`));
    return;
  }
  if (results.length === 0) {
    console.log(red(`  No se encontró ninguna ciudad llamada "${query}".\n`));
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
    console.log(yellow("  Número no válido.\n"));
    return;
  }

  const duplicated = store.cities.some(
    (c) =>
      c.name === result.name &&
      Math.abs(c.latitude - result.latitude) < 0.01 &&
      Math.abs(c.longitude - result.longitude) < 0.01,
  );
  if (duplicated) {
    console.log(yellow(`  ${formatPlace(result)} ya está en tu lista de ciudades.\n`));
    return;
  }

  const city: City = {
    id: nextCityId(store),
    name: result.name,
    country: result.country,
    admin1: result.admin1,
    latitude: result.latitude,
    longitude: result.longitude,
  };
  store.cities.push(city);
  saveStore(store);
  console.log(green(`  Ciudad agregada: ${formatPlace(city)}`));
  if (store.defaultCityId === null) {
    store.defaultCityId = city.id;
    saveStore(store);
    console.log(green("  Se estableció como ciudad default por ser la primera.\n"));
  } else {
    console.log();
  }
}

async function removeCity(store: Store): Promise<void> {
  if (store.cities.length === 0) {
    console.log(yellow("  No hay ciudades guardadas.\n"));
    return;
  }
  console.log("  Ciudades guardadas:\n");
  const city = await chooseCity(store, "eliminar");
  if (!city) return;

  const wasDefault = store.defaultCityId === city.id;
  store.cities = store.cities.filter((c) => c.id !== city.id);
  if (wasDefault) {
    const newDefault = store.cities[0];
    store.defaultCityId = newDefault?.id ?? null;
  }
  saveStore(store);
  console.log(green(`  Ciudad eliminada: ${formatPlace(city)}`));
  if (wasDefault) {
    const newDefault = store.cities[0];
    console.log(
      newDefault ? green(`  Nueva ciudad default: ${formatPlace(newDefault)}.\n`) : "  Ya no hay ciudad default.\n",
    );
  } else {
    console.log();
  }
}

async function setDefaultCity(store: Store): Promise<void> {
  if (store.cities.length === 0) {
    console.log(yellow("  No hay ciudades guardadas. Usa la opción 3 para agregar la primera.\n"));
    return;
  }
  console.log("  Ciudades guardadas:\n");
  const city = await chooseCity(store, "establecer como default");
  if (!city) return;

  store.defaultCityId = city.id;
  saveStore(store);
  console.log(green(`  Ciudad default: ${formatPlace(city)}\n`));
}

async function openSettings(store: Store): Promise<void> {
  const current = store.settings.unit === "celsius" ? "°C" : "°F";
  const next = store.settings.unit === "celsius" ? "°F" : "°C";
  console.log("  Ajustes");
  console.log(`  Unidad de temperatura actual: ${current}\n`);
  console.log(`  1. Cambiar a ${next}`);
  console.log("  2. Volver");
  const answer = await ask("  Selecciona una opción: ");
  if (answer === null || answer.trim() !== "1") return;

  store.settings.unit = store.settings.unit === "celsius" ? "fahrenheit" : "celsius";
  saveStore(store);
  console.log(green(`\n  Unidad de temperatura actualizada a ${next}.\n`));
}

/** Opciones del menú principal: el renderizado y el dispatch derivan de este
 *  array, así agregar una función nueva es agregar una entrada. */
const menuOptions: MenuOption[] = [
  { key: "1", label: () => "Clima de ciudad default", handler: showDefaultWeather },
  { key: "2", label: (store) => `Clima de todas las ciudades (${store.cities.length})`, handler: showAllWeather },
  { key: "3", label: () => "Buscar y agregar ciudad", handler: searchAndAddCity },
  { key: "4", label: () => "Eliminar ciudad", handler: removeCity },
  { key: "5", label: () => "Establecer ciudad default", handler: setDefaultCity },
  { key: "6", label: () => "Pronóstico de 7 días", handler: showForecast },
  { key: "8", label: (store) => `Ajustes (${store.settings.unit === "celsius" ? "°C" : "°F"})`, handler: openSettings },
  { key: "9", label: () => "Salir", exit: true },
];

async function main(): Promise<void> {
  const store = loadStore();
  let running = true;

  while (running) {
    console.log(renderMenu(store, menuOptions));
    const answer = await ask("  Selecciona una opción: ");
    if (answer === null) break; // entrada cerrada: salir
    console.log();

    const option = menuOptions.find((o) => o.key === answer.trim());
    if (!option) {
      console.log(yellow("  Opción no válida. Intenta de nuevo.\n"));
      continue;
    }
    await option.handler?.(store);
    if (option.exit) running = false;
  }

  rl.close();
  console.log(green("  ¡Hasta luego!\n"));
}

main().catch((error: unknown) => {
  console.error(red("Error inesperado:"), error);
  process.exit(1);
});
