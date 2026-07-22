# Power Automate Manager (PPTB tool)

A Power Platform ToolBox tool to browse and manage Power Automate **Flows**, **Connection References**, and **Connections**.

This package contains the **tool shell** (feature `001`): left navigation, a per-category object list, a details panel, CTRL/SHIFT multi-select, a common toolbar (Refresh, Select All, Clear Selection), and a filter/group/sort bar with a search box. Category-specific behavior (flow/connection-reference/connection modules) is added by features `002`–`004`, which register into the shell.

## Develop

```powershell
npm install
npm run dev        # Vite dev server (host APIs only available inside PPTB)
npm run typecheck  # tsc --noEmit (strict)
npm run lint       # ESLint, zero warnings
npm test           # Vitest (unit + component, mocked host APIs)
npm run build      # tsc + vite build -> dist/
```

## Load in Power Platform ToolBox

1. `npm run build`
2. In PPTB: Settings → enable **Show Debug Menu**.
3. Debug → **Load Local Tool** → select this folder's `dist/` → **Load Tool**.
4. Open **Power Automate Manager**. Use `npm run build -- --watch` and reopen the tool tab to pick up changes.

## Architecture

- `src/services/` — the only place that talks to the host globals (`toolboxAPI`, `dataverseAPI`, `powerplatformAPI`).
- `src/models/` — shared types and the typed host-API surface.
- `src/lib/` — `batch` (bounded-concurrency writes + retry/backoff), `grouping` (forest builder), `theme`.
- `src/state/` — `SelectionModel` (CTRL/SHIFT/group-node selection) and `useCategoryData` (load/search/error/empty).
- `src/categories/registry.ts` — where category modules (002–004) register.
- `src/app/` — the shell UI (Shell, NavigationBar, Toolbar, FilterBar, ObjectList, DetailsPanel).

See `../specs/001-power-automate-manager/` for the spec, plan, and tasks.
