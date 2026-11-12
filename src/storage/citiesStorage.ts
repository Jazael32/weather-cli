import type { City } from "../types/City.ts";
import type { GeoResult } from "../types/GeoResult.ts";
import type { Store } from "../types/Store.ts";
import { loadStore, saveStore } from "./store.ts";

/** Resultado de agregar una ciudad. */
export type AddCityResult =
  | { status: "added"; city: City; becameDefault: boolean }
  | { status: "duplicate"; city: City };

/** Resultado de eliminar una ciudad. */
export type RemoveCityResult = {
  removed: City;
  /** ¿La ciudad eliminada era la default? */
  wasDefault: boolean;
  /** Nueva ciudad default (la primera restante) si se eliminó la default. */
  newDefault: City | null;
};

function nextCityId(store: Store): number {
  return store.cities.reduce((max, city) => Math.max(max, city.id), 0) + 1;
}

/** ¿Ya hay guardada una ciudad en el mismo lugar (coordenadas casi iguales)? */
function findDuplicate(store: Store, result: GeoResult): City | undefined {
  return store.cities.find(
    (c) =>
      c.name === result.name &&
      Math.abs(c.latitude - result.latitude) < 0.01 &&
      Math.abs(c.longitude - result.longitude) < 0.01,
  );
}

/** Devuelve todas las ciudades guardadas. */
export function getCities(): City[] {
  return loadStore().cities;
}

/** Devuelve la ciudad marcada como default, si existe. */
export function getDefaultCity(): City | null {
  const store = loadStore();
  return store.cities.find((c) => c.id === store.defaultCityId) ?? null;
}

/** Agrega una ciudad a la lista; si es la primera, se convierte en default. */
export function addCity(result: GeoResult): AddCityResult {
  const store = loadStore();
  const duplicated = findDuplicate(store, result);
  if (duplicated) return { status: "duplicate", city: duplicated };

  const city: City = {
    id: nextCityId(store),
    name: result.name,
    country: result.country,
    admin1: result.admin1,
    latitude: result.latitude,
    longitude: result.longitude,
  };
  store.cities.push(city);
  const becameDefault = store.defaultCityId === null;
  if (becameDefault) store.defaultCityId = city.id;
  saveStore(store);
  return { status: "added", city, becameDefault };
}

/** Elimina una ciudad por id; si era la default, la primera restante la sustituye. */
export function removeCityById(id: number): RemoveCityResult | null {
  const store = loadStore();
  const city = store.cities.find((c) => c.id === id);
  if (!city) return null;

  const wasDefault = store.defaultCityId === id;
  store.cities = store.cities.filter((c) => c.id !== id);
  let newDefault: City | null = null;
  if (wasDefault) {
    newDefault = store.cities[0] ?? null;
    store.defaultCityId = newDefault?.id ?? null;
  }
  saveStore(store);
  return { removed: city, wasDefault, newDefault };
}

/** Establece la ciudad default por id; null si el id no existe. */
export function setDefaultCityById(id: number): City | null {
  const store = loadStore();
  const city = store.cities.find((c) => c.id === id);
  if (!city) return null;

  store.defaultCityId = id;
  saveStore(store);
  return city;
}
