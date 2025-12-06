import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Components
import { DiagramComponent } from './components/diagram/diagram.component';
import { RoundedRectNodeComponent } from './components/custom-node/rounded-rect-node.component';
import { NodeToolbarComponent } from './components/node-toolbar/node-toolbar.component';

// Services
import { DiagramStateService } from './services/diagram-state.service';
import { LayoutService } from './services/layout.service';
import { UndoRedoService } from './services/undo-redo.service';

// Injection Tokens
import { NGX_WORKFLOW_NODE_TYPES } from './injection-tokens/node-types.token';
import { NGX_WORKFLOW_EDGE_TYPES } from './injection-tokens/edge-types.token';
import { Type } from '@angular/core';
import { Node } from './models';

@NgModule({
  imports: [
    CommonModule,
    DiagramComponent,
    RoundedRectNodeComponent, // Import custom node component if it's standalone
    NodeToolbarComponent, // Import node toolbar component
  ],
  declarations: [
    // Standalone components are imported, not declared.
    // If a non-standalone component was needed, it would go here.
  ],
  providers: [
    DiagramStateService,
    LayoutService,
    UndoRedoService,
    {
      provide: NGX_WORKFLOW_NODE_TYPES,
      useValue: {
        'rounded-rect': RoundedRectNodeComponent,
        // Add other custom node types here
      },
    },
  ],
  exports: [
    DiagramComponent,
    RoundedRectNodeComponent,
    NodeToolbarComponent, // Export node toolbar component
  ],
})
export class NgxWorkflowModule { }