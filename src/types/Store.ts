import type { City } from "./City.ts";
import type { Settings } from "./Settings.ts";

/** Estado persistido en ~/.weather-cli.json */
export type Store = {
  cities: City[];
  defaultCityId: number | null;
  settings: Settings;
};
