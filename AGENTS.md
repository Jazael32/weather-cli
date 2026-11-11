# AGENTS.md

Bun + TypeScript console weather app, fully implemented. Spanish, menu-driven CLI: current weather per city, 7-day forecast, saved/default cities, and settings. State persists in `~/.weather-cli.json`. `README.md` is the original spec.

## Structure

- `index.ts` — entrypoint: readline handling, feature handlers, and the data-driven `menuOptions` array.
- `src/api.ts` — OpenMeteo geocoding + forecast calls (`geocodeCity`, `getWeather`, `getForecast`) and response types.
- `src/storage.ts` — load/save of the JSON store.
- `src/types.ts` — shared domain types (`City`, `Store`, `MenuOption`, ...).
- `src/ui.ts` — menu rendering and weather/forecast printing.
- `src/colors.ts` — ANSI color helpers; auto-disabled when not a TTY or when `NO_COLOR` is set.
- `src/spinner.ts` — async loading indicator (`runWithSpinner`); static line when not a TTY.
- `src/wmo.ts` — WMO weather code → Spanish description + emoji.

## Commands

- Runtime is **Bun**, not Node. Use `bun install` for deps and `bun run index.ts` to run.
- `bun run typecheck` — the only check (`bun check`, TypeScript 7 native). No tests, linter, or formatter are configured.
- `bun run build` — compiles the standalone executable (`weather-cli.exe` on Windows), the end goal from the README.
- OpenMeteo needs no API key and no `.env`; lookups are two steps: geocoding API (city name → lat/long) → forecast API. Example URLs are in the README.

## Conventions

- User-facing output (menu, prompts) is in Spanish, per the README spec.
- `tsconfig.json` uses `verbatimModuleSyntax` — type-only imports must be `import type`.
- `tsconfig.json` uses `noUncheckedIndexedAccess` — indexed access returns `T | undefined`; handle it with `??`.
- Keep `index.ts` as the entrypoint (referenced by `package.json` `module` field).
- The menu is data-driven: add new features as entries in `menuOptions` (`index.ts`) — rendering and dispatch derive from that array.
