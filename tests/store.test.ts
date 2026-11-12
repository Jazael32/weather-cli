import { writeFileSync } from "node:fs";
import { afterEach, describe, expect, test } from "bun:test";
import {
  activateTempStore,
  readTempStore,
  resetTempStore,
  writeTempStore,
} from "./helpers/storeSetup.ts";
import { loadStore, saveStore } from "../src/storage/store.ts";
import type { Store } from "../src/types/Store.ts";

describe("loadStore", () => {
  afterEach(() => {
    const path = process.env.WEATHER_CLI_STORE;
    if (path) resetTempStore(path);
  });

  test("devuelve el estado inicial si el archivo no existe", () => {
    activateTempStore();
    expect(loadStore()).toEqual({
      cities: [],
      defaultCityId: null,
      settings: { unit: "celsius" },
    });
  });

  test("lee el estado guardado (round trip con saveStore)", () => {
    activateTempStore();
    const store: Store = {
      cities: [
        {
          id: 1,
          name: "Bogotá",
          country: "Colombia",
          admin1: "Bogotá D.C.",
          latitude: 4.6097,
          longitude: -74.0817,
        },
      ],
      defaultCityId: 1,
      settings: { unit: "fahrenheit" },
    };
    saveStore(store);
    expect(loadStore()).toEqual(store);
  });

  test("devuelve el estado inicial si el JSON está corrupto", () => {
    activateTempStore();
    // Sobrescribimos con contenido que no es JSON válido.
    writeFileSync(process.env.WEATHER_CLI_STORE!, "{ no es json", "utf8");
    expect(loadStore()).toEqual({
      cities: [],
      defaultCityId: null,
      settings: { unit: "celsius" },
    });
  });

  test("ignora los campos con tipos incorrectos", () => {
    activateTempStore();
    writeTempStore({
      cities: "no es una lista",
      defaultCityId: "no es un número",
      settings: { unit: 42 },
    });
    expect(loadStore()).toEqual({
      cities: [],
      defaultCityId: null,
      settings: { unit: "celsius" },
    });
  });

  test("rechaza la unidad desconocida y usa celsius", () => {
    activateTempStore();
    writeTempStore({ cities: [], settings: { unit: "kelvin" } });
    expect(loadStore().settings.unit).toBe("celsius");
  });

  test("saveStore serializa con indentación de 2 espacios", () => {
    activateTempStore();
    saveStore({ cities: [], defaultCityId: null, settings: { unit: "celsius" } });
    expect(readTempStore()).toBe(
      JSON.stringify({ cities: [], defaultCityId: null, settings: { unit: "celsius" } }, null, 2),
    );
  });
});
