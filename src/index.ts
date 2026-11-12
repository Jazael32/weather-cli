import { searchAndAddCity } from "./actions/addCity.ts";
import { showForecast } from "./actions/getForecast.ts";
import { showAllWeather, showDefaultWeather } from "./actions/getWeather.ts";
import { removeCity } from "./actions/removeCity.ts";
import { openSettings } from "./actions/settings.ts";
import { setDefaultCity } from "./actions/setDefaultCity.ts";
import { closeInput } from "./presentation/input.ts";
import { runMenu } from "./presentation/menu.ts";
import { getCities } from "./storage/citiesStorage.ts";
import { getUnit } from "./storage/settingsStorage.ts";
import type { MenuOption } from "./types/MenuOption.ts";
import { green, red } from "./utils/colors.ts";
import { unitSymbol } from "./utils/format.ts";

/** Opciones del menú principal: el renderizado y el dispatch derivan de este
 *  array, así agregar una función nueva es agregar una entrada. */
const menuOptions: MenuOption[] = [
  { key: "1", label: () => "Clima de ciudad default", handler: showDefaultWeather },
  { key: "2", label: () => `Clima de todas las ciudades (${getCities().length})`, handler: showAllWeather },
  { key: "3", label: () => "Buscar y agregar ciudad", handler: searchAndAddCity },
  { key: "4", label: () => "Eliminar ciudad", handler: removeCity },
  { key: "5", label: () => "Establecer ciudad default", handler: setDefaultCity },
  { key: "6", label: () => "Pronóstico de 7 días", handler: showForecast },
  { key: "8", label: () => `Ajustes (${unitSymbol(getUnit())})`, handler: openSettings },
  { key: "9", label: () => "Salir", exit: true },
];

async function main(): Promise<void> {
  await runMenu(menuOptions);

  closeInput();
  console.log(green("  ¡Hasta luego!\n"));
}

main().catch((error: unknown) => {
  console.error(red("Error inesperado:"), error);
  process.exit(1);
});
