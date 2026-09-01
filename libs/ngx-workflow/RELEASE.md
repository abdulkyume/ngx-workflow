# Releasing ngx-workflow

## Version bump

1. Update `libs/ngx-workflow/package.json` `version`.
2. Add a section to `libs/ngx-workflow/CHANGELOG.md`.

## Pre-publish checklist

```bash
cd ngx-workflow
npm install
npm run lint
npm run test:lib
npm run build:lib
npm run pack:lib
```

Verify the tarball:

```bash
tar -tf ngx-workflow-<version>.tgz
# Expect: package.json, CHANGELOG.md, fesm2022/, types/, README.md, LICENSE
```

Dry-run publish (no upload):

```bash
npm publish ./dist/ngx-workflow --access public --dry-run
```

## Publish to npm

```bash
npm run publish:lib
```

Requires npm login (`npm whoami`) and publish rights on the `ngx-workflow` package.

## Local tarball (development)

```bash
npm run pack:lib
# → ngx-workflow-<version>.tgz in repo root
```

Install in a consumer app:

```bash
npm install /path/to/ngx-workflow/ngx-workflow-<version>.tgz
```

## Edge anchor modes (library API)

| Goal | Edge configuration |
|------|-------------------|
| Spread siblings along the handle border | Default when `centerAnchors` is unset or `false`; optional `data.anchorSpreadMax` (px) |
| Single attach point, fan paths | `data.centerAnchors: true` |
| Custom handle sides | `sourceHandle` / `targetHandle`: `top` \| `bottom` \| `left` \| `right` |

Integration-specific routing (presets, persistence, UI) belongs in the **consumer app**, not this package.
