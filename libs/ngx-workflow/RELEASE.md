# Releasing ngx-workflow

## Requirements checklist (KIP ATM states canvas)

| Requirement | Portal | Library (`0.7.2+`) |
|-------------|--------|---------------------|
| List click → center node at 100% zoom | `atm-group-states-panel` | — |
| Canvas click → scroll list only (no center) | `atm-group-states-panel` | — |
| Double-click → detail panel (no center) | deferred selection in canvas | — |
| Bezier edges (not smoothstep) | mapper + `routeAtmEdges` | — |
| Outgoing: bottom-center, incoming: top-center | `sourceHandle` / `targetHandle` | handle positions |
| Single anchor for multiple parallel edges | — (removed `centerAnchors` from mapper) | `centerAnchors: true` opt-in only |
| Custom node ports (top/bottom) | `ports: 2` on nodes | `shouldRenderDefaultHandles()` |

## Version bump

1. Update `libs/ngx-workflow/package.json` `version`.
2. Add a section to `libs/ngx-workflow/CHANGELOG.md`.

## Build & pack

```bash
cd ngx-workflow
npm install
npm run test:lib
npm run build:lib
npm run pack:lib
```

`pack:lib` writes `ngx-workflow-<version>.tgz` in the repo root.

## Publish to npm

```bash
npm run publish:lib
```

## Consume in KIP Platform Portal

Install from npm after publish (do **not** use `file:` / `npm link` unless Portal and ngx-workflow share the same Angular major version):

```bash
cd kip-platform-portal
npm install ngx-workflow@^0.7.2
npm start
```

Until Portal upgrades to Angular 22, stay on published `ngx-workflow@0.7.1` or publish `0.7.2` and verify template compatibility before bumping the Portal dependency.
