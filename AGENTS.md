# AGENTS.md

Bun + TypeScript console weather app, fully implemented. Spanish, menu-driven CLI: current weather per city, 7-day forecast, saved/default cities, and settings. State persists in `~/.weather-cli.json`. `README.md` is the original spec.

## Structure

- `src/index.ts` — entrypoint: the data-driven `menuOptions` array and `main()`; referenced by `package.json` `module` field.
- `src/actions/` — one file per user-facing feature (`getWeather`, `getForecast`, `addCity`, `removeCity`, `setDefaultCity`, `settings`); each orchestrates input → API/storage → output.
- `src/presentation/` — console interaction: `menu.ts` (render + dispatch loop), `input.ts` (readline with line queue; `ask`, `pickFromRange`, `chooseCity`), `output.ts` (printers + `showSuccess`/`showError`/`showWarning`), `spinner.ts` (async loading indicator; static line when not a TTY).
- `src/storage/` — persistence over `~/.weather-cli.json`: `store.ts` (raw load/save with tolerant parsing), `citiesStorage.ts` (cities + default), `settingsStorage.ts` (unit). The file is the source of truth: domain ops read-modify-save on each call.
- `src/types/` — one file per domain concept (`City`, `GeoResult`, `Weather`, `Settings`, `Store`, `MenuOption`).
- `src/api/` — OpenMeteo integration: `client.ts` (shared `fetchJson`), `geocoding.ts` (city name → lat/long), `weather.ts` (current weather + forecast).
- `src/utils/` — `colors.ts` (ANSI helpers; auto-disabled when not a TTY or `NO_COLOR` is set), `wmo.ts` (WMO code → Spanish description + emoji), `format.ts` (`formatPlace`, `formatDay`, `unitSymbol`), `constants.ts`.
- `tests/` — bun tests mirroring `src/` (storage + APIs con mocks); `tests/helpers/storeSetup.ts` redirige el store a un archivo temporal.

## Commands

- Runtime is **Bun**, not Node. Use `bun install` for deps and `bun run src/index.ts` to run.
- `bun run typecheck` — revisión de tipos (`bun check`, TypeScript 7 native).
- `bun run test` — test runner integrado de Bun (`bun test`); los tests viven en `tests/` (espejo de `src/`) y usan `WEATHER_CLI_STORE` + `global.fetch` mockeado, sin red ni toques al `~/.weather-cli.json` real.
- `bun run build` — compila el ejecutable standalone (`weather-cli.exe` en Windows). Ejecuta `bun test` primero: si algún test falla, el build aborta.
- OpenMeteo needs no API key and no `.env`; lookups are two steps: geocoding API (city name → lat/long) → forecast API. Example URLs are in the README.

## Conventions

- User-facing output (menu, prompts) is in Spanish, per the README spec.
- `tsconfig.json` uses `verbatimModuleSyntax` — type-only imports must be `import type`.
- `tsconfig.json` uses `noUncheckedIndexedAccess` — indexed access returns `T | undefined`; handle it with `??`.
- Keep `src/index.ts` as the entrypoint (referenced by `package.json` `module` field).
- The menu is data-driven: add new features as entries in `menuOptions` (`src/index.ts`) — rendering and dispatch derive from that array.
- Actions don't receive shared state: they read and write through the `src/storage/` modules, and `menuOptions` labels read state via storage getters at render time.
