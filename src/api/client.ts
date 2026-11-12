/** fetch + validación de respuesta HTTP, compartida por los endpoints. */
export async function fetchJson(url: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error("no se pudo conectar, revisa tu conexión a internet");
  }
  if (!response.ok) {
    throw new Error(`la API respondió con código ${response.status}`);
  }
  return response.json();
}
