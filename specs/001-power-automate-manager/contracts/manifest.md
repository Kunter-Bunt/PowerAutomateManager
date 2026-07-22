# Contract: Package Manifest

**Feature**: 001-power-automate-manager | **Phase**: 1

The tool's `package.json` MUST follow the PPTB manifest conventions. Baseline for the shell:

```json
{
  "name": "@kunter-bunt/power-automate-manager",
  "version": "0.1.0",
  "displayName": "Power Automate Manager",
  "description": "Browse and manage Power Automate Flows, Connection References, and Connections.",
  "main": "index.html",
  "icon": "icons/power-automate-manager.svg",
  "license": "MIT",
  "contributors": [{ "name": "Kunter-Bunt" }],
  "configurations": {
    "repository": "https://github.com/Kunter-Bunt/PowerAutomateManager"
  },
  "features": {
    "minAPI": "1.2.0"
  },
  "keywords": ["power-automate", "dataverse", "power-platform", "toolbox"],
  "devDependencies": {
    "@pptb/types": "^1.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

## Rules

- Top-level `icon` (relative to `dist` root); `configurations.iconURL` is deprecated and MUST NOT be used.
- Icon SVG MUST use `fill="currentColor"` / `stroke="currentColor"` for theme awareness.
- `features.minAPI` MUST be the highest minimum version across all host methods the tool calls. Baseline `1.2.0` (required by `toolboxAPI.connections.getActiveConnection`). Features 002–004 MUST raise it if they adopt higher-versioned methods.
- `license` MUST be one of the approved identifiers (MIT chosen).
- Build output places `index.html`, `icons/`, and assets at the `dist` root.

## Verification

- `npm run build` produces a `dist/` with `index.html` and `icons/power-automate-manager.svg`.
- `npm run finalize-package` succeeds prior to publish.
- Loading the built folder via the PPTB Debug menu shows the tool with a theme-adaptive icon.
