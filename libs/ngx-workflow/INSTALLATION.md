# Installation Guide for ngx-workflow

This guide will walk you through the steps to install and set up `ngx-workflow` in your Angular project.

## Prerequisites

- Angular CLI (version **17.1** through **22**; workspace demo uses Angular 22)
- Node.js (LTS version)
- An existing Angular project (or create a new one using `ng new`)

## Step 1: Install `ngx-workflow`

```bash
npm install ngx-workflow
```

Ensure peer dependencies are present:

```bash
npm install @angular/common @angular/core @angular/forms
```

## Step 2: Layout Dependencies (Optional)

Automatic ELK layout is bundled with the library via `elkjs`. You do **not** need a separate Dagre install — Dagre is not used.

If your bundler requires an explicit app dependency for `elkjs` / `uuid`, install them:

```bash
npm install elkjs uuid
```

## Step 3: Import `NgxWorkflowModule`

For a standalone Angular application, import `NgxWorkflowModule` (or individual standalone components) into your component or `app.config.ts`.

```typescript
// src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxWorkflowModule, NGX_WORKFLOW_NODE_TYPES } from 'ngx-workflow';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(CommonModule, NgxWorkflowModule),
    // Optional custom nodes:
    // {
    //   provide: NGX_WORKFLOW_NODE_TYPES,
    //   useValue: {
    //     'custom-node-type': YourCustomNodeComponent,
    //   },
    // },
  ]
};
```

Or import directly in a standalone component:

```typescript
import { NgxWorkflowModule } from 'ngx-workflow';

@Component({
  standalone: true,
  imports: [NgxWorkflowModule],
  // ...
})
export class AppComponent {}
```

If you are using a traditional `NgModule` setup:

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxWorkflowModule } from 'ngx-workflow';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, NgxWorkflowModule],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

## Step 4: Include Global Styles

`ngx-workflow` uses CSS variables for theming. Override them in your global stylesheet as needed:

```css
:root {
  --ngx-workflow-primary: #3b82f6;
  --ngx-workflow-bg: #f8fafc;
  --ngx-workflow-node-bg: #ffffff;
  --ngx-workflow-node-border: #cbd5e1;
  --ngx-workflow-edge-stroke: #64748b;
}
```

You are now ready to use `ngx-workflow`. See the [README](README.md) and [Usage Guide](USAGE.md) for examples.
