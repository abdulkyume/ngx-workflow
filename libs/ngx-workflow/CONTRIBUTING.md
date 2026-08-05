# Contributing to ngx-workflow

We welcome contributions to `ngx-workflow`.

## Setup

```bash
git clone https://github.com/abdulkyume/ngx-workflow.git
cd ngx-workflow
npm install
npm start
```

Useful scripts:

| Script | Purpose |
|--------|---------|
| `npm start` | Demo app (docs, examples, `/sandbox`) |
| `npm run build:lib` | Production library build |
| `npm run test:lib` | Headless library unit tests |
| `npm run lint` | Library TypeScript check (`tsc --noEmit`) |
| `npm run format` | Optional Prettier write |
| `npm run build:web` | Production demo app build |

## Pull Requests

1. Branch from `main`
2. Use conventional commits (`feat:`, `fix:`, `docs:`, …)
3. Add/update tests when behavior changes
4. Update docs if the public API changes
5. Ensure `npm run build:lib` and `npm run test:lib` pass

## Reporting Bugs

Open an issue at https://github.com/abdulkyume/ngx-workflow/issues with reproduction steps, expected vs actual behavior, and environment details.

Thank you for contributing!
