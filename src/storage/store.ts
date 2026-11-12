import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { yellow } from "../utils/colors.ts";
import type { Store } from "../types/Store.ts";

/** Ruta del archivo de datos: en el perfil del usuario, para que el binario
 *  compilado funcione desde cualquier carpeta. */
const STORE_PATH = join(homedir(), ".weather-cli.json");

/** La capa de storage lee el archivo en cada operación; el aviso de archivo
 *  corrupto se muestra una sola vez por proceso. */
let warnedCorrupt = false;

function defaultStore(): Store {
  return { cities: [], defaultCityId: null, settings: { unit: "celsius" } };
}

/** Carga el estado guardado; si no existe o está corrupto, devuelve el inicial. */
export function loadStore(): Store {
  if (!existsSync(STORE_PATH)) return defaultStore();
  try {
    const raw = JSON.parse(readFileSync(STORE_PATH, "utf8")) as Partial<Store>;
    return {
      cities: Array.isArray(raw.cities) ? raw.cities : [],
      defaultCityId: typeof raw.defaultCityId === "number" ? raw.defaultCityId : null,
      settings: { unit: raw.settings?.unit === "fahrenheit" ? "fahrenheit" : "celsius" },
    };
  } catch {
    if (!warnedCorrupt) {
      warnedCorrupt = true;
      console.error(
        yellow("  Aviso: no se pudo leer ~/.weather-cli.json, se usará el estado inicial.\n"),
      );
    }
    return defaultStore();
  }
}

/** Guarda el estado en disco. */
export function saveStore(store: Store): void {
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}
