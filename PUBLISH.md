# Publishing ngx-workflow to NPM

This guide describes how to build and publish the `ngx-workflow` library to NPM.

## Prerequisites

1.  **NPM Account**: You need an account on [npmjs.com](https://www.npmjs.com/).
2.  **Login**: Run `npm login` in your terminal and follow the prompts.

## Steps

### 1. Update Version

Update the version number in `libs/ngx-workflow/package.json`. Follow [Semantic Versioning](https://semver.org/).

```json
{
  "name": "ngx-workflow",
  "version": "0.0.2", 
  ...
}
```

### 2. Build the Library

Run the build command to compile the library. This uses `ng-packagr` to create an optimized package format (APF).

```bash
ng build ngx-workflow
```

The output will be generated in `dist/ngx-workflow`.

### 3. Publish

Navigate to the distribution directory and run `npm publish`.

```bash
cd dist/ngx-workflow
npm publish
```

**Note:** If this is the first time you are publishing a scoped package (e.g., `@your-org/ngx-workflow`), you might need to add `--access public`:

```bash
npm publish --access public
```

## Verification

After publishing, you can verify your package on [npmjs.com](https://www.npmjs.com/package/ngx-workflow).

## Competitor Analysis (vs React Flow)

To be a strong competitor to React Flow, consider adding the following features in future releases:

*   **Sub-Flows**: Fully recursive nested flows.
*   **Custom Edge Types**: Easier API for creating custom edges with HTML/SVG content.
*   **Layout Engine**: Built-in integration with Dagre or ElkJS for auto-layout (currently manual or via service).
*   **Minimap & Controls**: (Already implemented! ✅)
*   **Accessibility**: Continue improving keyboard navigation and ARIA labels.
*   **Documentation**: Create a dedicated documentation site (e.g., using Storybook or Docusaurus) with interactive examples.
