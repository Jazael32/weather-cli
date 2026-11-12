import { afterEach, describe, expect, mock, test } from "bun:test";
import { geocodeCity } from "../../src/api/geocoding.ts";
import type { GeoResult } from "../../src/types/GeoResult.ts";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function mockFetchJson(payload: unknown) {
  const fetchMock = mock(async (url: string) => new Response(JSON.stringify(payload)));
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe("geocodeCity", () => {
  test("devuelve los resultados de la API", async () => {
    const results: GeoResult[] = [
      {
        name: "Bogotá",
        country: "Colombia",
        admin1: "Bogotá D.C.",
        latitude: 4.6097,
        longitude: -74.0817,
      },
    ];
    mockFetchJson({ results });
    expect(await geocodeCity("Bogotá")).toEqual(results);
  });

  test("devuelve una lista vacía si la API no encontró nada", async () => {
    mockFetchJson({});
    expect(await geocodeCity("XXXXXXX")).toEqual([]);
  });

  test("construye la URL con los parámetros esperados", async () => {
    const fetchMock = mockFetchJson({ results: [] });
    await geocodeCity("Ottawa", 3);

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.origin + url.pathname).toBe("https://geocoding-api.open-meteo.com/v1/search");
    expect(url.searchParams.get("name")).toBe("Ottawa");
    expect(url.searchParams.get("count")).toBe("3");
    expect(url.searchParams.get("language")).toBe("es");
    expect(url.searchParams.get("format")).toBe("json");
  });

  test("usa 5 resultados por defecto", async () => {
    const fetchMock = mockFetchJson({ results: [] });
    await geocodeCity("Ottawa");
    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.searchParams.get("count")).toBe("5");
  });
});
