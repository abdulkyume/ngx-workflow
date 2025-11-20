# Publishing ngx-flow to npm

This guide outlines the process of building and publishing the `ngx-flow` library to the npm registry.

## 1. Prerequisites

-   An npm account.
-   Access rights to publish to the `ngx-flow` package on npm.
-   Angular CLI installed globally (`npm install -g @angular/cli`).

## 2. Build the Library

Navigate to your project's root directory (where `angular.json` is located) and run the Angular CLI build command for your library.

```bash
ng build ngx-flow --configuration production
```

This command will compile your library in production mode and output the distributable files to the `dist/ngx-flow` folder in your project root.

## 3. Verify the Build Output

Before publishing, it's a good practice to inspect the contents of the `dist/ngx-flow` folder. Ensure that:

-   The `package.json` file is present and correctly configured.
-   All necessary JavaScript files, TypeScript definition files (`.d.ts`), and style files are included.
-   The `README.md` and `LICENSE` files are in the root of the `dist/ngx-flow` folder.

## 4. Log in to npm

If you're not already logged in, use the `npm login` command in your terminal. You'll be prompted for your npm username, password, and email.

```bash
npm login
```

## 5. Publish to npm

Once logged in and after a successful build, navigate into the `dist/ngx-flow` directory and publish the package.

```bash
cd dist/ngx-flow
npm publish --access public
```

The `--access public` flag is important for publishing open-source packages. If your package name is scoped (e.g., `@your-scope/ngx-flow`), you might omit this flag if it's a public scope.

After successful publication, your library will be available on the npm registry, and others can install it using `npm install ngx-flow`.

## 6. Versioning Strategy (Semantic Versioning)

`ngx-flow` follows [Semantic Versioning (SemVer)](https://semver.org/spec/v2.0.0.html). This means version numbers are incremented as follows:

-   **Major version (1.0.0):** Incremented for incompatible API changes (breaking changes).
-   **Minor version (0.1.0):** Incremented for new features that are backward-compatible.
-   **Patch version (0.0.1):** Incremented for backward-compatible bug fixes.

Before releasing a new version:

1.  **Update `version` in `libs/ngx-flow/package.json`:**
    Modify the `version` field in the library's `package.json` according to SemVer rules.
2.  **Commit the version change:**
    Create a commit specifically for the version update (e.g., `git commit -m "chore: release 0.1.0"`).
3.  **Create a Git tag:**
    Tag the commit with the new version number: `git tag v0.1.0`.
4.  **Push to remote:**
    Push both the commits and the tags to your remote repository: `git push && git push --tags`.
5.  **Re-build and Publish:**
    Follow steps 2-5 to build and publish the new version.

---
