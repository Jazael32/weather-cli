# AGENTS.md

Bun + TypeScript console weather app. The app is **not implemented yet** — `index.ts` is a placeholder. `README.md` (Spanish) is the spec: menu-driven CLI for looking up weather by city, managing saved/default cities, and settings.

## Commands

- Runtime is **Bun**, not Node. Use `bun install` for deps and `bun run index.ts` to run.
- `bun run typecheck` — the only check (`bun check`, TypeScript 7 native). No tests, linter, or formatter are configured.
- OpenMeteo needs no API key and no `.env`; lookups are two steps: geocoding API (city name → lat/long) → forecast API. Example URLs are in the README.

## Conventions

- User-facing output (menu, prompts) is in Spanish, per the README spec.
- `tsconfig.json` uses `verbatimModuleSyntax` — type-only imports must be `import type`.
- Keep `index.ts` as the entrypoint (referenced by `package.json` `module` field).
- Stated end goal (README): ship a standalone executable via `bun build --compile`.
