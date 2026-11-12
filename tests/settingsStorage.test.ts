import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { activateTempStore, resetTempStore, writeTempStore } from "./helpers/storeSetup.ts";
import { getUnit, toggleUnit } from "../src/storage/settingsStorage.ts";

describe("settingsStorage", () => {
  beforeEach(() => {
    activateTempStore();
  });

  afterEach(() => {
    const path = process.env.WEATHER_CLI_STORE;
    if (path) resetTempStore(path);
  });

  test("getUnit devuelve celsius por defecto", () => {
    expect(getUnit()).toBe("celsius");
  });

  test("toggleUnit alterna a fahrenheit y persiste el cambio", () => {
    expect(toggleUnit()).toBe("fahrenheit");
    expect(getUnit()).toBe("fahrenheit");
  });

  test("toggleUnit dos veces vuelve a celsius", () => {
    toggleUnit();
    expect(toggleUnit()).toBe("celsius");
  });

  test("respeta la unidad guardada en el archivo", () => {
    writeTempStore({
      cities: [],
      defaultCityId: null,
      settings: { unit: "fahrenheit" },
    });
    expect(getUnit()).toBe("fahrenheit");
  });
});
