import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Components
import { DiagramComponent } from './components/diagram/diagram.component';
import { NodeComponent } from './components/node/node.component';
import { EdgeComponent } from './components/edge/edge.component';
import { HandleComponent } from './components/handle/handle.component';
import { RoundedRectNodeComponent } from './components/custom-node/rounded-rect-node.component';

// Services
import { DiagramStateService } from './services/diagram-state.service';
import { LayoutService } from './services/layout.service';
import { UndoRedoService } from './services/undo-redo.service';

// Injection Tokens
import { NGX_FLOW_NODE_TYPES } from './injection-tokens/node-types.token';
import { NGX_FLOW_EDGE_TYPES } from './injection-tokens/edge-types.token';
import { Type } from '@angular/core';
import { Node } from './models';

@NgModule({
  imports: [
    CommonModule,
    DiagramComponent,
    NodeComponent,
    EdgeComponent,
    HandleComponent,
    RoundedRectNodeComponent, // Import custom node component if it's standalone
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
      provide: NGX_FLOW_NODE_TYPES,
      useValue: {
        'rounded-rect': RoundedRectNodeComponent,
        // Add other custom node types here
      },
    },
    // {
    //   provide: NGX_FLOW_EDGE_TYPES,
    //   useValue: {
    //     'custom-edge': CustomEdgeComponent,
    //   },
    // },
  ],
  exports: [
    DiagramComponent,
    NodeComponent,
    EdgeComponent,
    HandleComponent,
    RoundedRectNodeComponent,
  ],
})
export class NgxFlowModule {}