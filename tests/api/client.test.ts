import { afterEach, describe, expect, mock, test } from "bun:test";
import { fetchJson } from "../../src/api/client.ts";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

/** Instala un fetch falso que responde con el cuerpo y status indicados. */
function mockFetch(impl: () => Promise<Response>) {
  const fetchMock = mock(impl);
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe("fetchJson", () => {
  test("devuelve el JSON parseado de una respuesta ok", async () => {
    mockFetch(async () => new Response(JSON.stringify({ ok: true, valor: 7 })));
    expect(await fetchJson("https://example.com")).toEqual({ ok: true, valor: 7 });
  });

  test("lanza un error en español si no hay conexión", async () => {
    mockFetch(async () => {
      throw new TypeError("fetch failed");
    });
    expect(fetchJson("https://example.com")).rejects.toThrow(
      "no se pudo conectar, revisa tu conexión a internet",
    );
  });

  test("lanza un error con el código HTTP si la respuesta no es ok", async () => {
    mockFetch(async () => new Response("{}", { status: 500 }));
    expect(fetchJson("https://example.com")).rejects.toThrow("la API respondió con código 500");
  });
});
