# Installation Guide for ngx-flow

This guide will walk you through the steps to install and set up `ngx-flow` in your Angular project.

## Prerequisites

-   Angular CLI (version 17 or higher)
-   Node.js (LTS version)
-   An existing Angular project (or create a new one using `ng new`)

## Step 1: Install `ngx-flow`

First, install the `ngx-flow` library from npm. In your Angular project's root directory, run:

```bash
npm install ngx-flow
```

## Step 2: Install Layout Algorithm Dependencies (Optional)

If you plan to use the automatic layout features (Dagre or ELK), you will need to install their respective libraries:

```bash
npm install @dagrejs/dagre elkjs
npm install --save-dev @types/dagre @types/elkjs # Install TypeScript type definitions
```

## Step 3: Install UUID for Unique IDs (Optional but Recommended)

`ngx-flow` internally uses `uuid` for generating unique IDs for nodes and edges. While not strictly required if you provide your own IDs, it's recommended for convenience.

```bash
npm install uuid
npm install --save-dev @types/uuid
```

## Step 4: Import `NgxFlowModule`

For a standalone Angular application (Angular 15+), you need to import `NgxFlowModule` into your `app.config.ts` (or the `providers` array of the component/module where you plan to use `ngx-flow`).

```typescript
// src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxFlowModule } from 'ngx-flow'; // Assuming `ngx-flow` is installed from npm

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    importProvidersFrom(CommonModule, NgxFlowModule),
    // If you plan to use custom nodes, provide them here:
    // {
    //   provide: NGX_FLOW_NODE_TYPES,
    //   useValue: {
    //     'custom-node-type': YourCustomNodeComponent,
    //   },
    // },
  ]
};
```

If you are using a traditional `NgModule` setup, import `NgxFlowModule` into your `AppModule` or a feature module:

```typescript
// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { NgxFlowModule } from 'ngx-flow'; // Assuming `ngx-flow` is installed from npm
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    NgxFlowModule, // Import the NgxFlowModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## Step 5: Include Global Styles

`ngx-flow` uses CSS variables for theming and some basic styles. Ensure these are included in your application's global stylesheet (`src/styles.css` or `src/styles.scss`).

```css
/* src/styles.css */
body {
  margin: 0;
  font-family: sans-serif;
}

/* Default light theme variables */
:root {
  --ngx-flow-selection-color: #1a192b;
  --ngx-flow-node-bg: #ffffff;
  --ngx-flow-node-border: #1a192b;
  --ngx-flow-node-text-color: #333333;
  --ngx-flow-edge-color: #b1b1b7;
  --ngx-flow-source-handle-color: #1a192b;
  --ngx-flow-source-handle-border: #ffffff;
  --ngx-flow-target-handle-color: #1a192b;
  --ngx-flow-target-handle-border: #ffffff;
  --ngx-flow-handle-valid-target-color: #00ff00;
  --ngx-flow-handle-valid-target-border: #007f00;
  --ngx-flow-background-color: #f8f8f8;
}

/* Optional: Dark mode example */
/*
body.dark-mode {
  --ngx-flow-selection-color: #c9c9c9;
  --ngx-flow-node-bg: #333333;
  --ngx-flow-node-border: #eeeeee;
  --ngx-flow-node-text-color: #ffffff;
  --ngx-flow-edge-color: #777777;
  --ngx-flow-source-handle-color: #c9c9c9;
  --ngx-flow-source-handle-border: #333333;
  --ngx-flow-target-handle-color: #c9c9c9;
  --ngx-flow-target-handle-border: #333333;
  --ngx-flow-handle-valid-target-color: #008000;
  --ngx-flow-handle-valid-target-border: #004000;
  --ngx-flow-background-color: #1a192b;
}
*/
```

You are now ready to use `ngx-flow` in your Angular components! See the [Usage Guide](USAGE.md) for examples.
