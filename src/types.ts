/** Unidad de temperatura configurada en ajustes. */
export type Unit = "celsius" | "fahrenheit";

/** Ciudad guardada por el usuario. */
export type City = {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
};

/** Ajustes de la aplicación. */
export type Settings = {
  unit: Unit;
};

/** Estado persistido en ~/.weather-cli.json */
export type Store = {
  cities: City[];
  defaultCityId: number | null;
  settings: Settings;
};
