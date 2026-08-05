# Contributing to ngx-workflow

Thank you for your interest in contributing to `ngx-workflow`! We welcome contributions from the community.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/abdulkyume/ngx-workflow.git
   cd ngx-workflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the demo app**
   ```bash
   npm start
   ```
   Open `http://localhost:4200` for the docs site, examples, and Canvas Studio (`/sandbox`).

4. **Build the library**
   ```bash
   npm run build:lib
   ```

## Running Tests & Checks

- Library unit tests: `npm run test:lib`
- Typecheck library: `npm run lint`
- Optional Prettier write: `npm run format`
- Demo app production build: `npm run build:web`

## Pull Request Guidelines

1. Fork the repo and create your branch from `main`.
2. Use conventional commits (e.g. `feat: add new node type`, `fix: edge connection bug`).
3. Cover changes with tests when applicable.
4. Update README / docs if you change API behavior.
5. Ensure Prettier formatting is clean (`npm run format`).

## Reporting Bugs

Open an issue on GitHub with:

- A clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if possible
- Environment details (Angular version, browser, OS, `ngx-workflow` version)

Happy coding!
