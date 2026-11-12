/** Resultado de la API de geocoding (un lugar encontrado por nombre). */
export type GeoResult = {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
};
