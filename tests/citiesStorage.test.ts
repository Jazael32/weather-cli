import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { activateTempStore, resetTempStore } from "./helpers/storeSetup.ts";
import {
  addCity,
  getCities,
  getDefaultCity,
  removeCityById,
  setDefaultCityById,
} from "../src/storage/citiesStorage.ts";
import type { GeoResult } from "../src/types/GeoResult.ts";

const bogota: GeoResult = {
  name: "Bogotá",
  country: "Colombia",
  admin1: "Bogotá D.C.",
  latitude: 4.6097,
  longitude: -74.0817,
};

const ottawa: GeoResult = {
  name: "Ottawa",
  country: "Canadá",
  admin1: "Ontario",
  latitude: 45.4215,
  longitude: -75.6972,
};

describe("citiesStorage", () => {
  beforeEach(() => {
    activateTempStore();
  });

  afterEach(() => {
    const path = process.env.WEATHER_CLI_STORE;
    if (path) resetTempStore(path);
  });

  test("addCity en un store vacío se vuelve la ciudad default", () => {
    const result = addCity(bogota);
    expect(result.status).toBe("added");
    if (result.status !== "added") return;
    expect(result.becameDefault).toBe(true);
    expect(result.city).toEqual({
      id: 1,
      name: "Bogotá",
      country: "Colombia",
      admin1: "Bogotá D.C.",
      latitude: 4.6097,
      longitude: -74.0817,
    });
    expect(getCities()).toHaveLength(1);
    expect(getDefaultCity()?.id).toBe(1);
  });

  test("addCity asigna ids incrementales y no cambia la default", () => {
    addCity(bogota);
    const result = addCity(ottawa);
    expect(result.status).toBe("added");
    if (result.status !== "added") return;
    expect(result.becameDefault).toBe(false);
    expect(result.city.id).toBe(2);
    expect(getDefaultCity()?.name).toBe("Bogotá");
  });

  test("addCity detecta duplicados por nombre y coordenadas cercanas", () => {
    addCity(bogota);
    const result = addCity({ ...bogota, latitude: 4.6097 + 0.005 });
    expect(result.status).toBe("duplicate");
    expect(getCities()).toHaveLength(1);
  });

  test("addCity permite ciudades con el mismo nombre en lugares distintos", () => {
    addCity(bogota);
    const result = addCity({ ...bogota, latitude: 4.7, longitude: -74.2 });
    expect(result.status).toBe("added");
    expect(getCities()).toHaveLength(2);
  });

  test("removeCityById elimina una ciudad que no es la default", () => {
    addCity(bogota);
    addCity(ottawa);
    const result = removeCityById(2);
    expect(result).toEqual({
      removed: { ...ottawa, id: 2 },
      wasDefault: false,
      newDefault: null,
    });
    expect(getDefaultCity()?.name).toBe("Bogotá");
  });

  test("removeCityById sobre la default promueve a la primera restante", () => {
    addCity(bogota);
    addCity(ottawa);
    const result = removeCityById(1);
    expect(result?.wasDefault).toBe(true);
    expect(result?.newDefault?.name).toBe("Ottawa");
    expect(getDefaultCity()?.name).toBe("Ottawa");
  });

  test("removeCityById de la única ciudad deja la default en null", () => {
    addCity(bogota);
    const result = removeCityById(1);
    expect(result?.wasDefault).toBe(true);
    expect(result?.newDefault).toBeNull();
    expect(getDefaultCity()).toBeNull();
    expect(getCities()).toHaveLength(0);
  });

  test("removeCityById con id inexistente devuelve null", () => {
    expect(removeCityById(99)).toBeNull();
  });

  test("setDefaultCityById cambia la ciudad default", () => {
    addCity(bogota);
    addCity(ottawa);
    expect(setDefaultCityById(2)?.name).toBe("Ottawa");
    expect(getDefaultCity()?.id).toBe(2);
  });

  test("setDefaultCityById con id inexistente devuelve null y no cambia nada", () => {
    addCity(bogota);
    expect(setDefaultCityById(99)).toBeNull();
    expect(getDefaultCity()?.id).toBe(1);
  });
});
