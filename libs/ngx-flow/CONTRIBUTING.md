# Contributing to ngx-flow

We welcome and appreciate contributions to `ngx-flow`! Whether it's reporting a bug, suggesting a new feature, improving documentation, or submitting code, your help is invaluable.

Please take a moment to review this document to make the contribution process as smooth and effective as possible.

---

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project, you agree to abide by its terms.

---

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please open an issue on our [GitHub Issues page](https://github.com/your-org/ngx-flow/issues). When reporting a bug, please include:

-   A clear and concise description of the bug.
-   Steps to reproduce the behavior.
-   Expected behavior.
-   Actual behavior.
-   Screenshots or animated GIFs (if applicable).
-   Your environment details (Angular version, browser, OS, `ngx-flow` version).

### Suggesting Enhancements

We love new ideas! If you have a suggestion for a new feature or an improvement to an existing one, please open an issue on our [GitHub Issues page](https://github.com/your-org/ngx-flow/issues). Describe your idea clearly and explain why you think it would be valuable to the library.

### Improving Documentation

Good documentation is crucial for any library. If you find errors, omissions, or areas that could be explained more clearly in our `README.md`, usage guides, or API reference, please consider opening a pull request with your improvements.

### Contributing Code

We use a standard GitHub flow for contributions:

1.  **Fork the Repository:** Start by forking the `ngx-flow` repository to your own GitHub account.
2.  **Clone Your Fork:** Clone your forked repository to your local machine:
    ```bash
    git clone https://github.com/your-username/ngx-flow.git
    cd ngx-flow
    ```
3.  **Create a New Branch:** Create a new branch for your feature or bug fix:
    ```bash
    git checkout -b feature/your-feature-name
    # or
    git checkout -b bugfix/issue-description
    ```
4.  **Set up the Development Environment:**
    -   Ensure you have Node.js (LTS) and Angular CLI installed globally.
    -   Install dependencies: `npm install`
    -   Build the library: `npm run build` (or `ng build ngx-flow`)
    -   Run the demo application to test your changes: `npm start` (or `ng serve --project ngx-flow-demo`)
5.  **Make Your Changes:**
    -   Write clean, maintainable, and idiomatic Angular/TypeScript code.
    -   Adhere to the existing code style.
    -   Write (or update) unit tests for your changes.
    -   Ensure all tests pass: `npm test` (or `ng test ngx-flow`)
    -   Ensure the demo application still functions as expected.
6.  **Commit Your Changes:**
    -   Write clear, concise commit messages. Follow conventional commits if possible (e.g., `feat: add new feature`, `fix: resolve bug`).
7.  **Push to Your Fork:**
    ```bash
    git push origin feature/your-feature-name
    ```
8.  **Open a Pull Request (PR):**
    -   Go to the original `ngx-flow` repository on GitHub.
    -   You should see a prompt to open a pull request from your new branch.
    -   Provide a clear title and detailed description of your changes.
    -   Reference any related issues (e.g., `Closes #123`, `Fixes #456`).
    -   Be prepared to engage in a review process.

---

## Development Environment Setup

After cloning the repository:

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Build the library:**
    ```bash
    npm run build ngx-flow
    ```
    This compiles the library and makes it available for the demo application.
3.  **Run the demo application:**
    ```bash
    npm start
    ```
    This will serve the demo application (typically at `http://localhost:4200`) where you can test your changes to the library in a live environment.

## Style Guide

-   Follow Angular's official [style guide](https://angular.io/guide/styleguide).
-   Use Prettier for code formatting.
-   Ensure your code passes linting checks (`npm run lint`).

---

Thank you for contributing to `ngx-flow`!
