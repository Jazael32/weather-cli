import type { Unit } from "../types/Weather.ts";
import { loadStore, saveStore } from "./store.ts";

/** Unidad de temperatura configurada. */
export function getUnit(): Unit {
  return loadStore().settings.unit;
}

/** Alterna entre °C y °F; devuelve la nueva unidad. */
export function toggleUnit(): Unit {
  const store = loadStore();
  const unit: Unit = store.settings.unit === "celsius" ? "fahrenheit" : "celsius";
  store.settings.unit = unit;
  saveStore(store);
  return unit;
}
