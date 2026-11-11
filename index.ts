import * as readline from "node:readline";
import { geocodeCity, getWeather } from "./src/api.ts";
import type { GeoResult } from "./src/api.ts";
import { loadStore, saveStore } from "./src/storage.ts";
import { formatPlace, printWeather, renderMenu } from "./src/ui.ts";
import type { City, Store } from "./src/types.ts";

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

/** Muestra el clima de una ciudad con manejo de errores en español. */
async function showCityWeather(city: City, store: Store): Promise<void> {
  try {
    const weather = await getWeather(city.latitude, city.longitude, store.settings.unit);
    printWeather(city, weather, store.settings.unit);
  } catch (error) {
    console.log(`  No se pudo obtener el clima de ${formatPlace(city)}: ${(error as Error).message}\n`);
  }
}

async function showDefaultWeather(store: Store): Promise<void> {
  const city = store.cities.find((c) => c.id === store.defaultCityId);
  if (!city) {
    console.log("  Aún no hay ciudad default. Usa la opción 5 para establecerla.\n");
    return;
  }
  await showCityWeather(city, store);
}

async function showAllWeather(store: Store): Promise<void> {
  if (store.cities.length === 0) {
    console.log("  No hay ciudades guardadas. Usa la opción 3 para agregar la primera.\n");
    return;
  }
  for (const city of store.cities) {
    await showCityWeather(city, store);
  }
}

function listCities(store: Store): void {
  store.cities.forEach((city, index) => {
    const marker = city.id === store.defaultCityId ? " (default)" : "";
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
    console.log("  Número no válido.\n");
    return null;
  }
  return num;
}

async function searchAndAddCity(store: Store): Promise<void> {
  const answer = await ask("  Nombre de la ciudad a buscar: ");
  if (answer === null) return;
  const query = answer.trim();
  if (!query) {
    console.log("  No ingresaste ningún nombre.\n");
    return;
  }

  let results: GeoResult[];
  try {
    results = await geocodeCity(query);
  } catch (error) {
    console.log(`  Error al buscar: ${(error as Error).message}\n`);
    return;
  }
  if (results.length === 0) {
    console.log(`  No se encontró ninguna ciudad llamada "${query}".\n`);
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
    console.log("  Número no válido.\n");
    return;
  }

  const duplicated = store.cities.some(
    (c) =>
      c.name === result.name &&
      Math.abs(c.latitude - result.latitude) < 0.01 &&
      Math.abs(c.longitude - result.longitude) < 0.01,
  );
  if (duplicated) {
    console.log(`  ${formatPlace(result)} ya está en tu lista de ciudades.\n`);
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
  console.log(`  Ciudad agregada: ${formatPlace(city)}`);
  if (store.defaultCityId === null) {
    store.defaultCityId = city.id;
    saveStore(store);
    console.log("  Se estableció como ciudad default por ser la primera.\n");
  } else {
    console.log();
  }
}

async function removeCity(store: Store): Promise<void> {
  if (store.cities.length === 0) {
    console.log("  No hay ciudades guardadas.\n");
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
  console.log(`  Ciudad eliminada: ${formatPlace(city)}`);
  if (wasDefault) {
    const newDefault = store.cities[0];
    console.log(
      newDefault ? `  Nueva ciudad default: ${formatPlace(newDefault)}.\n` : "  Ya no hay ciudad default.\n",
    );
  } else {
    console.log();
  }
}

async function setDefaultCity(store: Store): Promise<void> {
  if (store.cities.length === 0) {
    console.log("  No hay ciudades guardadas. Usa la opción 3 para agregar la primera.\n");
    return;
  }
  console.log("  Ciudades guardadas:\n");
  const city = await chooseCity(store, "establecer como default");
  if (!city) return;

  store.defaultCityId = city.id;
  saveStore(store);
  console.log(`  Ciudad default: ${formatPlace(city)}\n`);
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
  console.log(`\n  Unidad de temperatura actualizada a ${next}.\n`);
}

async function main(): Promise<void> {
  const store = loadStore();
  let running = true;

  while (running) {
    console.log(renderMenu(store));
    const answer = await ask("  Selecciona una opción: ");
    if (answer === null) break; // entrada cerrada: salir
    console.log();

    switch (answer.trim()) {
      case "1":
        await showDefaultWeather(store);
        break;
      case "2":
        await showAllWeather(store);
        break;
      case "3":
        await searchAndAddCity(store);
        break;
      case "4":
        await removeCity(store);
        break;
      case "5":
        await setDefaultCity(store);
        break;
      case "8":
        await openSettings(store);
        break;
      case "9":
        running = false;
        break;
      default:
        console.log("  Opción no válida. Intenta de nuevo.\n");
    }
  }

  rl.close();
  console.log("  ¡Hasta luego!\n");
}

main().catch((error: unknown) => {
  console.error("Error inesperado:", error);
  process.exit(1);
});
