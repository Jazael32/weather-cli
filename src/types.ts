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

/** Opción del menú principal. */
export type MenuOption = {
  key: string;
  /** Etiqueta mostrada; puede depender del estado (contador, unidad...). */
  label: (store: Store) => string;
  /** Acción al elegir la opción; las de salida no necesitan handler. */
  handler?: (store: Store) => void | Promise<void>;
  /** Si es true, termina el bucle del menú tras ejecutarse. */
  exit?: boolean;
};
