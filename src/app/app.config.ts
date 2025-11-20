import {
  ApplicationConfig,
  importProvidersFrom,
  provideZonelessChangeDetection,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgxFlowModule,
  NGX_FLOW_NODE_TYPES,
  RoundedRectNodeComponent,
  DiagramStateService,
  LayoutService,
  UndoRedoService,
} from 'ngx-flow';

import { routes } from './app.routes';
import { provideRouter } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),

    importProvidersFrom(CommonModule, NgxFlowModule), // Import NgxFlowModule
    DiagramStateService,
    LayoutService,
    UndoRedoService,
    {
      provide: NGX_FLOW_NODE_TYPES,
      useValue: {
        'rounded-rect': RoundedRectNodeComponent,
        // Add other custom node types here for the demo
      },
    },
  ],
};
function provideBrowserGlobalErrorListeners():
  | import('@angular/core').Provider
  | import('@angular/core').EnvironmentProviders {
  throw new Error('Function not implemented.');
}
