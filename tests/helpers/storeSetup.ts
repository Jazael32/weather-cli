import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let tempDir: string | null = null;

/** Activa un store temporal: sobrescribe WEATHER_CLI_STORE con una ruta
 *  nueva y vacía, para que loadStore/saveStore no toquen el archivo real. */
export function activateTempStore(): string {
  tempDir ??= mkdtempSync(join(tmpdir(), "weather-cli-test-"));
  const path = join(tempDir, `store-${Math.random().toString(36).slice(2)}.json`);
  rmSync(path, { force: true });
  process.env.WEATHER_CLI_STORE = path;
  return path;
}

/** Reemplaza la ruta activa por un archivo inexistente (store en blanco). */
export function resetTempStore(path: string): void {
  rmSync(path, { force: true });
}

/** Escribe JSON directamente en el store temporal activo. */
export function writeTempStore(data: unknown): void {
  writeFileSync(activePath(), JSON.stringify(data, null, 2), "utf8");
}

/** Lee el contenido crudo del store temporal activo. */
export function readTempStore(): string {
  return readFileSync(activePath(), "utf8");
}

function activePath(): string {
  const path = process.env.WEATHER_CLI_STORE;
  if (!path) throw new Error("activateTempStore() no fue llamado");
  return path;
}
