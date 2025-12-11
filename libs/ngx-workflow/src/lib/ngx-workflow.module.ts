import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Components
import { DiagramComponent } from './components/diagram/diagram.component';
import { RoundedRectNodeComponent } from './components/custom-node/rounded-rect-node.component';
import { NodeToolbarComponent } from './components/node-toolbar/node-toolbar.component';
import { PanelComponent } from './components/panel/panel.component';
import { BackgroundComponent } from './components/background/background.component';
import { MinimapComponent } from './components/minimap/minimap.component';
import { ZoomControlsComponent } from './components/zoom-controls/zoom-controls.component';
import { LayoutAlignmentControlsComponent } from './components/layout-alignment-controls/layout-alignment-controls.component';
import { SearchControlsComponent } from './components/search-controls/search-controls.component';
import { ExportControlsComponent } from './components/export-controls/export-controls.component';
import { PropertiesSidebarComponent } from './components/properties-sidebar/properties-sidebar.component';
import { UndoRedoControlsComponent } from './components/undo-redo-controls/undo-redo-controls.component';
import { VersionHistoryComponent } from './components/version-history/version-history.component';
import { GridOverlayComponent } from './components/grid-overlay/grid-overlay.component';
import { ContextMenuComponent } from './components/context-menu/context-menu.component';

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
    BackgroundComponent,
    MinimapComponent,
    ZoomControlsComponent,
    LayoutAlignmentControlsComponent,
    SearchControlsComponent,
    ExportControlsComponent,
    PropertiesSidebarComponent,
    UndoRedoControlsComponent,
    NodeToolbarComponent,
    PanelComponent,
    VersionHistoryComponent,
    GridOverlayComponent,
    ContextMenuComponent
  ],
  declarations: [
    // Standalone components are imported, not declared.
  ],
  providers: [
    DiagramStateService,
    LayoutService,
    UndoRedoService,
    {
      provide: NGX_WORKFLOW_NODE_TYPES,
      useValue: {
        'rounded-rect': RoundedRectNodeComponent,
      },
    },
  ],
  exports: [
    DiagramComponent,
    BackgroundComponent,
    MinimapComponent,
    ZoomControlsComponent,
    LayoutAlignmentControlsComponent,
    SearchControlsComponent,
    ExportControlsComponent,
    PropertiesSidebarComponent,
    UndoRedoControlsComponent,
    NodeToolbarComponent,
    PanelComponent
  ],
})
export class NgxWorkflowModule { }