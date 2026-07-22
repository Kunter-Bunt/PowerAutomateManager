# Quickstart: Power Automate Manager (Tool Shell)

**Feature**: 001-power-automate-manager | **Phase**: 1

Validation guide proving the shared shell works end-to-end inside PPTB. Implementation details live in tasks.md / source; this is a run & verify guide.

## Prerequisites

- Power Platform ToolBox desktop app installed; Debug Menu enabled (Settings → Show Debug Menu).
- A Dataverse connection added and active in PPTB (Production or non-prod), with Flows / Connection References present.
- Node.js 18+ and this repo cloned.

## Build & load

```powershell
cd PowerAutomateManager.PPTB
npm install
npm run build
```

Then in PPTB: Debug → Load Local Tool → select `PowerAutomateManager.PPTB/dist` → Load Tool → open **Power Automate Manager**.

For iteration: `npm run build -- --watch`, then close and reopen the tool tab to pick up changes.

## Validation scenarios

Scenarios map to the spec's user stories and functional requirements ([spec.md](spec.md)).

1. **Navigation & list (US1, FR-001–005)**: Select Flows, then Connection References, then Connections. Each shows the correct list; switching replaces the list. A category with no objects shows an empty-state (not an error).
2. **Details panel (US2, FR-006–008)**: Select one object → the right panel shows its details form; select a different object → it updates; clear selection → neutral empty state.
3. **Multi-select (US3, FR-009–012)**: CTRL+click toggles individual rows; SHIFT+click selects a range; plain click collapses to one; switching category clears the selection.
4. **Toolbar (US4, FR-013–017)**: Refresh reloads; Select All selects all visible; Clear Selection empties the selection; actions remain available across categories.
5. **Search (US5, FR-018–022)**: Type in the search box → list narrows to matches; Select All then selects only visible matches (FR-016); clearing search restores the list; switching category resets search; a non-matching term shows empty-state.
6. **Error handling (FR-023–024)**: Simulate a failed load (e.g., disconnect) → a retryable error state appears and the UI stays responsive; Refresh retries.
7. **Theme (Constitution II)**: Toggle PPTB light/dark → the tool and its icon adapt.

## Automated checks

```powershell
npm run lint          # zero errors (Principle I)
npm run typecheck     # tsc --noEmit, strict (Principle I)
npm test              # Vitest: SelectionModel, batch, clients (mocked host), Shell/List/Details
```

Expected: lint/typecheck clean; unit tests cover CTRL/SHIFT/plain-click + de-dup + reset, paging in `fetchAll`, and load/empty/error/ready transitions.

## Done when

- All 7 scenarios pass against a real environment with hundreds of objects without UI freezing.
- `CategoryModule` registry renders the three navigation items (category modules themselves ship in 002–004; before those exist, each shows an empty-state placeholder).
