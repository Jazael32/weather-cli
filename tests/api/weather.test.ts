import { afterEach, describe, expect, mock, test } from "bun:test";
import { getForecast, getWeather } from "../../src/api/weather.ts";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function mockFetchJson(payload: unknown) {
  const fetchMock = mock(async (url: string) => new Response(JSON.stringify(payload)));
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe("getWeather", () => {
  test("mapea la respuesta current de la API", async () => {
    mockFetchJson({
      current: {
        temperature_2m: 21.5,
        relative_humidity_2m: 64,
        wind_speed_10m: 12.3,
      },
    });
    expect(await getWeather(4.6097, -74.0817, "celsius")).toEqual({
      temperature: 21.5,
      humidity: 64,
      windSpeed: 12.3,
    });
  });

  test("usa 0 como valor por defecto para campos opcionales", async () => {
    mockFetchJson({ current: { temperature_2m: 10 } });
    expect(await getWeather(0, 0, "fahrenheit")).toEqual({
      temperature: 10,
      humidity: 0,
      windSpeed: 0,
    });
  });

  test("lanza error si falta el bloque current", async () => {
    mockFetchJson({});
    expect(getWeather(0, 0, "celsius")).rejects.toThrow("respuesta inesperada de la API");
  });

  test("lanza error si falta la temperatura", async () => {
    mockFetchJson({ current: { relative_humidity_2m: 50 } });
    expect(getWeather(0, 0, "celsius")).rejects.toThrow("respuesta inesperada de la API");
  });

  test("envía las coordenadas y la unidad en la URL", async () => {
    const fetchMock = mockFetchJson({ current: { temperature_2m: 1 } });
    await getWeather(4.6097, -74.0817, "fahrenheit");
    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.origin + url.pathname).toBe("https://api.open-meteo.com/v1/forecast");
    expect(url.searchParams.get("latitude")).toBe("4.6097");
    expect(url.searchParams.get("longitude")).toBe("-74.0817");
    expect(url.searchParams.get("temperature_unit")).toBe("fahrenheit");
    expect(url.searchParams.get("current")).toBe(
      "temperature_2m,relative_humidity_2m,wind_speed_10m",
    );
  });
});

describe("getForecast", () => {
  const daily = {
    time: ["2026-11-11", "2026-11-12"],
    weather_code: [0, 95],
    temperature_2m_max: [18.2, 15.7],
    temperature_2m_min: [6.1, 5.4],
    precipitation_probability_max: [10, 80],
  };

  test("mapea el pronóstico diario de la API", async () => {
    mockFetchJson({ daily });
    expect(await getForecast(4.6097, -74.0817, "celsius")).toEqual([
      {
        date: "2026-11-11",
        weatherCode: 0,
        tempMax: 18.2,
        tempMin: 6.1,
        precipProb: 10,
      },
      {
        date: "2026-11-12",
        weatherCode: 95,
        tempMax: 15.7,
        tempMin: 5.4,
        precipProb: 80,
      },
    ]);
  });

  test("usa 0 para los valores nulos de la API", async () => {
    mockFetchJson({
      daily: {
        time: ["2026-11-11"],
        weather_code: [null],
        temperature_2m_max: [null],
        temperature_2m_min: [7],
        precipitation_probability_max: [null],
      },
    });
    expect(await getForecast(0, 0, "celsius")).toEqual([
      { date: "2026-11-11", weatherCode: 0, tempMax: 0, tempMin: 7, precipProb: 0 },
    ]);
  });

  test("lanza error si falta el bloque daily", async () => {
    mockFetchJson({});
    expect(getForecast(0, 0, "celsius")).rejects.toThrow("respuesta inesperada de la API");
  });

  test("lanza error si daily no tiene fechas", async () => {
    mockFetchJson({ daily: { time: [] } });
    expect(getForecast(0, 0, "celsius")).rejects.toThrow("respuesta inesperada de la API");
  });

  test("envía los parámetros del pronóstico en la URL", async () => {
    const fetchMock = mockFetchJson({ daily });
    await getForecast(4.6097, -74.0817, "fahrenheit", 3);
    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.origin + url.pathname).toBe("https://api.open-meteo.com/v1/forecast");
    expect(url.searchParams.get("daily")).toBe(
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    );
    expect(url.searchParams.get("forecast_days")).toBe("3");
    expect(url.searchParams.get("timezone")).toBe("auto");
    expect(url.searchParams.get("temperature_unit")).toBe("fahrenheit");
  });

  test("usa 7 días por defecto", async () => {
    const fetchMock = mockFetchJson({ daily });
    await getForecast(0, 0, "celsius");
    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.searchParams.get("forecast_days")).toBe("7");
  });
});
