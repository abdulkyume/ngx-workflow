import { Component, ChangeDetectionStrategy, ElementRef, OnInit, Renderer2, NgZone, OnDestroy, HostListener, WritableSignal, Inject, Optional, computed, ViewChild, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { DiagramStateService } from '../../services/diagram-state.service';
import { Viewport, XYPosition, Node, Edge, TempEdge, DiagramState } from '../../models';
import { Subscription } from 'rxjs';
import { NGX_FLOW_NODE_TYPES } from '../../injection-tokens';
import { NodeComponentType } from '../../types';
import { getBezierPath, getStraightPath, getStepPath, getSelfLoopPath } from '../../utils';
import { v4 as uuidv4 } from 'uuid';
import { ZoomControlsComponent } from '../zoom-controls/zoom-controls.component';
import { MinimapComponent } from '../minimap/minimap.component';
import { BackgroundComponent } from '../background/background.component';
import { AlignmentControlsComponent } from '../alignment-controls/alignment-controls.component';

// Helper function to get a node from the array
function getNode(id: string, nodes: Node[]): Node | undefined {
  return nodes.find(n => n.id === id);
}

// Helper function to determine handle position based on node and handle id/type
function getHandleAbsolutePosition(node: Node, handleId: string | undefined): XYPosition {
  const nodeWidth = node.width || 170;
  const nodeHeight = node.height || 60;
  let offsetX = 0;
  let offsetY = 0;

  switch (handleId) {
    case 'top':
      offsetX = nodeWidth / 2;
      offsetY = 0;
      break;
    case 'right':
      offsetX = nodeWidth;
      offsetY = nodeHeight / 2;
      break;
    case 'bottom':
      offsetX = nodeWidth / 2;
      offsetY = nodeHeight;
      break;
    case 'left':
      offsetX = 0;
      offsetY = nodeHeight / 2;
      break;
    default: // Center of the node if no specific handle
      offsetX = nodeWidth / 2;
      offsetY = nodeHeight / 2;
  }
  return {
    x: node.position.x + offsetX,
    y: node.position.y + offsetY
  };
}

@Component({
  selector: 'ngx-diagram',
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, NgComponentOutlet, ZoomControlsComponent, MinimapComponent, BackgroundComponent, AlignmentControlsComponent]
})
export class DiagramComponent implements OnInit, OnDestroy, OnChanges {
  // Trigger rebuild
  @ViewChild('svg', { static: true }) svgRef!: ElementRef<SVGSVGElement>;

  // Input properties for declarative usage
  @Input() initialNodes: Node[] = [];
  @Input() initialEdges: Edge[] = [];
  @Input() initialViewport?: Viewport;
  @Input() showZoomControls: boolean = true;

  // Input for showing/hiding minimap
  @Input() showMinimap: boolean = true;

  // Input for background configuration
  @Input() showBackground: boolean = true;
  @Input() backgroundVariant: 'dots' | 'lines' | 'cross' = 'dots';
  @Input() backgroundGap: number = 20;
  @Input() backgroundSize: number = 1;
  @Input() backgroundColor: string = '#81818a';
  @Input() backgroundBgColor: string = '#f0f0f0';

  // Output events
  @Output() nodeClick = new EventEmitter<Node>();
  @Output() edgeClick = new EventEmitter<Edge>();
  @Output() connect = new EventEmitter<{ source: string; sourceHandle?: string; target: string; targetHandle?: string }>();
  @Output() nodesChange = new EventEmitter<Node[]>();
  @Output() edgesChange = new EventEmitter<Edge[]>();

  viewport!: WritableSignal<Viewport>;
  nodes!: WritableSignal<Node[]>;
  edges!: WritableSignal<Edge[]>;
  tempEdges!: WritableSignal<TempEdge[]>;

  // Expose Math to the template
  Math = Math;

  private isPanning = false;
  private lastPanPosition: XYPosition = { x: 0, y: 0 };
  private subscriptions = new Subscription();

  // Lasso selection properties
  isSelecting = false;
  selectionStart: XYPosition = { x: 0, y: 0 };
  selectionEnd: XYPosition = { x: 0, y: 0 };

  // Node Dragging
  private isDraggingNode = false;
  private draggingNode: Node | null = null;
  private draggingNodes: Node[] = []; // All nodes being dragged (for multi-select)
  private startNodePosition: XYPosition = { x: 0, y: 0 };
  private startNodePositions: Map<string, XYPosition> = new Map(); // Initial positions for multi-drag
  private startPointerPosition: XYPosition = { x: 0, y: 0 };

  // Connection (Handle)
  private isConnecting = false;
  private currentPreviewEdgeId: string | null = null;
  private currentTargetHandle: { nodeId: string; handleId?: string; type: 'source' | 'target' } | null = null;
  private connectingSourceNodeId: string | null = null;
  private connectingSourceHandleId: string | undefined = undefined;

  // Resizing
  private isResizing = false;
  private resizingNode: Node | null = null;
  private resizeHandle: 'nw' | 'ne' | 'sw' | 'se' | null = null;
  private startResizePosition: XYPosition = { x: 0, y: 0 };
  private startNodeDimensions: { width: number; height: number; x: number; y: number } = { width: 0, height: 0, x: 0, y: 0 };

  // Edge Updating
  private isUpdatingEdge = false;
  private updatingEdge: Edge | null = null;
  private updatingEdgeHandle: 'source' | 'target' | null = null;

  // Edge Label Editing
  editingEdgeId: string | null = null;

  onEdgeDoubleClick(event: MouseEvent, edge: Edge): void {
    event.stopPropagation();
    event.preventDefault();
    this.editingEdgeId = edge.id;
  }

  updateEdgeLabel(edge: Edge, newLabel: string): void {
    this.diagramStateService.updateEdge(edge.id, { label: newLabel });
    this.editingEdgeId = null;
  }

  onEdgeLabelBlur(): void {
    this.editingEdgeId = null;
  }

  // Default node dimensions
  defaultNodeWidth = 170;
  defaultNodeHeight = 60;

  // Input for custom connection validation (optional)
  @Input() connectionValidator?: (sourceNodeId: string, targetNodeId: string) => boolean;
  // Input for node resizing (global toggle)
  @Input() nodesResizable: boolean = true;
  // Helper to check if a connection is allowed
  private isValidConnection(sourceId: string, targetId: string): boolean {
    // console.log('isValidConnection checking:', sourceId, targetId);
    // Prevent duplicate edges between same source and target
    const existing = this.edges().some(e => e.source === sourceId && e.target === targetId);
    if (existing) {
      // console.log('isValidConnection: existing edge found');
      return false;
    }
    // Use custom validator if provided
    if (this.connectionValidator) {
      return this.connectionValidator(sourceId, targetId);
    }
    return true;
  }

  constructor(
    private el: ElementRef<HTMLElement>, // Host element
    private renderer: Renderer2,
    private ngZone: NgZone,
    private diagramStateService: DiagramStateService,
    @Optional() @Inject(NGX_FLOW_NODE_TYPES) private nodeTypes: Record<string, NodeComponentType> | null
  ) { }

  ngOnInit(): void {
    this.diagramStateService.el = this.svgRef;
    this.viewport = this.diagramStateService.viewport;
    this.nodes = this.diagramStateService.nodes;
    this.edges = this.diagramStateService.edges;
    this.tempEdges = this.diagramStateService.tempEdges;

    // Set initial data if provided
    if (this.initialNodes.length > 0) {
      this.initialNodes.forEach(node => this.diagramStateService.addNode(node));
    }
    if (this.initialEdges.length > 0) {
      // Add initial edges directly to the signal without triggering connect events
      this.diagramStateService.edges.set([...this.initialEdges]);
    }
    if (this.initialViewport) {
      this.diagramStateService.setViewport(this.initialViewport);
    }

    // Subscribe to state changes and emit events
    // Note: We only subscribe to connect events from user interactions, not programmatic additions
    this.subscriptions.add(
      this.diagramStateService.nodeClick.subscribe((node: Node) => this.nodeClick.emit(node))
    );
    this.subscriptions.add(
      this.diagramStateService.edgeClick.subscribe((edge: Edge) => this.edgeClick.emit(edge))
    );
    this.subscriptions.add(
      this.diagramStateService.connect.subscribe((connection) => this.connect.emit(connection))
    );
    this.subscriptions.add(
      this.diagramStateService.nodesChange.subscribe((nodes: Node[]) => this.nodesChange.emit(nodes))
    );
    this.subscriptions.add(
      this.diagramStateService.edgesChange.subscribe((edges: Edge[]) => this.edgesChange.emit(edges))
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle changes to input properties after initialization
    if (changes['initialNodes'] && !changes['initialNodes'].firstChange) {
      // Sync nodes: add new ones, remove deleted ones, update existing ones
      const currentNodes = this.nodes();
      const currentNodeIds = new Set(currentNodes.map(n => n.id));
      const newNodeIds = new Set(this.initialNodes.map(n => n.id));

      // Remove nodes that are no longer in initialNodes
      currentNodes.forEach(node => {
        if (!newNodeIds.has(node.id)) {
          this.diagramStateService.removeNode(node.id);
        }
      });

      // Add or update nodes from initialNodes
      this.initialNodes.forEach(node => {
        if (!currentNodeIds.has(node.id)) {
          // New node - add it
          this.diagramStateService.addNode(node);
        } else {
          // Existing node - update it
          this.diagramStateService.updateNode(node.id, node);
        }
      });
    }
    if (changes['initialEdges'] && !changes['initialEdges'].firstChange) {
      // Set edges directly without triggering connect events
      this.diagramStateService.edges.set([...this.initialEdges]);
    }
    if (changes['initialViewport'] && !changes['initialViewport'].firstChange && this.initialViewport) {
      this.diagramStateService.setViewport(this.initialViewport);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get transform(): string {
    const v = this.viewport();
    return `translate(${v.x}, ${v.y}) scale(${v.zoom})`;
  }

  trackByNodeId(index: number, node: Node): string {
    return node.id;
  }

  trackByEdgeId(index: number, edge: Edge): string {
    return edge.id;
  }

  @HostListener('window:keydown.delete', ['$event'])
  onDeleteKeyPress(event: any): void {
    this.diagramStateService.deleteSelectedElements();
  }

  @HostListener('window:keydown.control.z', ['$event'])
  @HostListener('window:keydown.meta.z', ['$event']) // For macOS
  onUndoKeyPress(event: any): void {
    event.preventDefault(); // Prevent browser undo
    this.diagramStateService.undo();
  }

  @HostListener('window:keydown.control.shift.z', ['$event'])
  @HostListener('window:keydown.meta.shift.z', ['$event']) // For macOS
  onRedoKeyPress(event: any): void {
    event.preventDefault(); // Prevent browser redo
    this.diagramStateService.redo();
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.ngZone.runOutsideAngular(() => {
      const svgRect = this.svgRef.nativeElement.getBoundingClientRect();
      const clientX = event.clientX;
      const clientY = event.clientY;

      const viewportBefore = this.viewport();

      const pointX = (clientX - svgRect.left - viewportBefore.x) / viewportBefore.zoom;
      const pointY = (clientY - svgRect.top - viewportBefore.y) / viewportBefore.zoom;

      const scaleFactor = 1.05;
      const newZoom = event.deltaY < 0 ? viewportBefore.zoom * scaleFactor : viewportBefore.zoom / scaleFactor;

      const clampedZoom = Math.max(0.1, Math.min(10, newZoom));

      const newX = clientX - svgRect.left - pointX * clampedZoom;
      const newY = clientY - svgRect.top - pointY * clampedZoom;

      this.diagramStateService.setViewport({ x: newX, y: newY, zoom: clampedZoom });
    });
  }

  onPointerDown(event: PointerEvent): void {
    let targetElement = event.target as Element;

    // Check for resize handle first (highest priority)
    const resizeHandleElement = targetElement.closest('.ngx-flow__resize-handle') as HTMLElement;
    if (resizeHandleElement) {
      const nodeElement = resizeHandleElement.closest('.ngx-flow__node') as HTMLElement;
      if (nodeElement) {
        const nodeId = nodeElement.dataset['id'];
        const node = this.nodes().find(n => n.id === nodeId);
        const handle = resizeHandleElement.dataset['handle'] as 'nw' | 'ne' | 'sw' | 'se';
        if (node && handle && (node.resizable !== false) && this.nodesResizable) {
          this.startResizing(event, node, handle);
          return;
        }
      }
    }

    let handleElement = targetElement.closest('.ngx-flow__handle') as HTMLElement;
    const nodeElement = targetElement.closest('.ngx-flow__node') as HTMLElement;

    if (event.button !== 0) return;

    if (handleElement && handleElement.dataset['type'] === 'source') {
      // Start Connecting
      this.startConnecting(event, handleElement);
    } else if (nodeElement) {
      // Start Dragging Node
      const nodeId = nodeElement.dataset['id'];
      const node = this.nodes().find(n => n.id === nodeId);
      if (node && node.draggable) {
        this.startDraggingNode(event, node);
      }
      // Select Node
      if (node) {
        this.diagramStateService.onNodeClick(node);
        this.diagramStateService.selectNodes([node.id], event.ctrlKey || event.metaKey || event.shiftKey);
      }
    } else {
      // Pan or Select
      const isClickingOnCanvas = targetElement === this.svgRef.nativeElement || targetElement.classList.contains('ngx-flow__background');
      if (isClickingOnCanvas) {
        if (event.shiftKey) {
          this.startSelecting(event);
        } else {
          this.startPanning(event);
        }
      }
    }
  }

  onPointerMove(event: PointerEvent): void {
    // console.log('onPointerMove', { dragging: this.isDraggingNode, connecting: this.isConnecting, resizing: this.isResizing });
    if (this.isResizing) {
      this.resize(event);
    } else if (this.isUpdatingEdge) {
      this.updateEdge(event);
    } else if (this.isConnecting) {
      this.updateConnection(event);
    } else if (this.isDraggingNode) {
      this.dragNode(event);
    } else if (this.isPanning) {
      this.pan(event);
    } else if (this.isSelecting) {
      this.updateSelection(event);
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (this.isResizing) {
      this.stopResizing(event);
    } else if (this.isUpdatingEdge) {
      this.stopUpdatingEdge(event);
    } else if (this.isConnecting) {
      this.finishConnecting(event);
    } else if (this.isDraggingNode) {
      this.stopDraggingNode(event);
    } else if (this.isPanning) {
      this.stopPanning(event);
    } else if (this.isSelecting) {
      this.stopSelecting(event);
    }
  }

  onPointerLeave(event: PointerEvent): void {
    if (this.isResizing || this.isUpdatingEdge || this.isPanning || this.isSelecting || this.isDraggingNode || this.isConnecting) {
      this.onPointerUp(event);
    }
  }

  // --- Connecting Logic ---

  private startConnecting(event: PointerEvent, handleElement: HTMLElement): void {
    event.stopPropagation();
    event.preventDefault();

    this.isConnecting = true;
    this.svgRef.nativeElement.setPointerCapture(event.pointerId);

    const nodeId = handleElement.dataset['nodeid'];
    const handleId = handleElement.dataset['handleid'];

    if (!nodeId) return;

    this.connectingSourceNodeId = nodeId;
    this.connectingSourceHandleId = handleId;

    const previewEdgeId = `preview-${uuidv4()}`;
    this.currentPreviewEdgeId = previewEdgeId;

    const viewport = this.viewport();
    const diagramSvgEl = this.svgRef.nativeElement;
    const handleScreenCoords = handleElement.getBoundingClientRect();
    const diagramScreenCoords = diagramSvgEl.getBoundingClientRect();

    const sourceX = (handleScreenCoords.x + handleScreenCoords.width / 2 - diagramScreenCoords.x - viewport.x) / viewport.zoom;
    const sourceY = (handleScreenCoords.y + handleScreenCoords.height / 2 - diagramScreenCoords.y - viewport.y) / viewport.zoom;

    const newTempEdge: TempEdge = {
      id: previewEdgeId,
      source: nodeId,
      sourceHandle: handleId,
      target: 'preview-target',
      targetHandle: undefined,
      type: 'straight',
      animated: true,
      style: { stroke: 'blue', strokeWidth: '2' },
      sourceX: sourceX,
      sourceY: sourceY,
      targetX: sourceX,
      targetY: sourceY,
    };
    this.diagramStateService.addTempEdge(newTempEdge);
  }

  private updateConnection(event: PointerEvent): void {
    if (!this.currentPreviewEdgeId) return;

    this.ngZone.runOutsideAngular(() => {
      const diagramSvgEl = this.svgRef.nativeElement;
      const diagramScreenCoords = diagramSvgEl.getBoundingClientRect();
      const viewport = this.viewport();

      const currentPointerX = (event.clientX - diagramScreenCoords.x - viewport.x) / viewport.zoom;
      const currentPointerY = (event.clientY - diagramScreenCoords.y - viewport.y) / viewport.zoom;

      this.diagramStateService.updateTempEdgeTarget(this.currentPreviewEdgeId!, { x: currentPointerX, y: currentPointerY });

      // Use geometric distance check instead of elementFromPoint to avoid pointer capture issues
      let closestHandle: { nodeId: string, handleId: string } | null = null;
      let minDistance = 20; // Detection radius

      const nodes = this.nodes();
      for (const node of nodes) {
        const handles = ['top', 'right', 'bottom', 'left'];
        for (const handleId of handles) {
          const handlePos = getHandleAbsolutePosition(node, handleId);
          const dist = Math.hypot(handlePos.x - currentPointerX, handlePos.y - currentPointerY);
          if (dist < minDistance) {
            minDistance = dist;
            closestHandle = { nodeId: node.id, handleId: handleId };
          }
        }
      }

      this.clearTargetHandleHighlight();

      if (closestHandle) {
        const targetNodeId = closestHandle.nodeId;
        const targetHandleId = closestHandle.handleId;

        // Allow connecting to any handle on a different node OR same node (self-loop)
        // console.log('updateConnection: handle found', targetNodeId, this.connectingSourceNodeId);
        if (targetNodeId && this.isValidConnection(this.connectingSourceNodeId!, targetNodeId)) {
          this.currentTargetHandle = { nodeId: targetNodeId, handleId: targetHandleId, type: 'target' };

          // We need to find the handle element to highlight it
          // This is a bit expensive but necessary for visual feedback
          const handleEl = this.el.nativeElement.querySelector(`.ngx-flow__handle[data-nodeid="${targetNodeId}"][data-handleid="${targetHandleId}"]`);
          if (handleEl) {
            this.renderer.addClass(handleEl, 'ngx-flow__handle--valid-target');
          }
        } else {
          this.currentTargetHandle = null;
        }
      } else {
        this.currentTargetHandle = null;
      }
    });
  }

  private finishConnecting(event: PointerEvent): void {
    event.stopPropagation();
    event.preventDefault();

    this.isConnecting = false;
    this.svgRef.nativeElement.releasePointerCapture(event.pointerId);
    this.clearTargetHandleHighlight();

    if (this.currentPreviewEdgeId) {
      this.diagramStateService.removeEdge(this.currentPreviewEdgeId);
    }

    if (this.currentTargetHandle && this.connectingSourceNodeId) {
      const sourceId = this.connectingSourceNodeId;
      const targetId = this.currentTargetHandle.nodeId;

      if (this.isValidConnection(sourceId, targetId)) {
        const newEdge: Edge = {
          id: uuidv4(),
          source: sourceId,
          sourceHandle: this.connectingSourceHandleId,
          target: targetId,
          targetHandle: this.currentTargetHandle.handleId,
          type: 'bezier',
        };
        this.diagramStateService.addEdge(newEdge);
      } else {
        // Visual feedback for invalid connection: flash source node
        const sourceNodeEl = this.el.nativeElement.querySelector(`[data-nodeid="${sourceId}"]`);
        if (sourceNodeEl) {
          this.renderer.addClass(sourceNodeEl, 'invalid-connection');
          setTimeout(() => this.renderer.removeClass(sourceNodeEl, 'invalid-connection'), 1000);
        }
      }
    }

    this.currentPreviewEdgeId = null;
    this.currentTargetHandle = null;
    this.connectingSourceNodeId = null;
    this.connectingSourceHandleId = undefined;
  }

  private clearTargetHandleHighlight(): void {
    const activeHighlights = document.querySelectorAll('.ngx-flow__handle--valid-target');
    activeHighlights.forEach(el => this.renderer.removeClass(el, 'ngx-flow__handle--valid-target'));
  }

  // --- Dragging Logic ---

  private startDraggingNode(event: PointerEvent, node: Node): void {
    event.stopPropagation();
    this.isDraggingNode = true;
    this.draggingNode = node;
    this.startNodePosition = { x: node.position.x, y: node.position.y };
    this.startPointerPosition = { x: event.clientX, y: event.clientY };
    this.svgRef.nativeElement.setPointerCapture(event.pointerId);

    // Check if this node is part of a multi-selection
    const selectedNodes = this.nodes().filter(n => n.selected);
    if (selectedNodes.length > 1 && node.selected) {
      // Multi-node drag: store all selected nodes and their positions
      this.draggingNodes = selectedNodes;
      this.startNodePositions.clear();
      selectedNodes.forEach(n => {
        this.startNodePositions.set(n.id, { x: n.position.x, y: n.position.y });
      });
    } else {
      // Single node drag
      this.draggingNodes = [node];
      this.startNodePositions.clear();
      this.startNodePositions.set(node.id, { x: node.position.x, y: node.position.y });
    }

    this.diagramStateService.onDragStart(node);
  }

  private dragNode(event: PointerEvent): void {
    if (!this.draggingNode) return;
    event.stopPropagation();

    this.ngZone.runOutsideAngular(() => {
      const zoom = this.viewport().zoom;
      const deltaX = (event.clientX - this.startPointerPosition.x) / zoom;
      const deltaY = (event.clientY - this.startPointerPosition.y) / zoom;

      if (this.draggingNodes.length > 1) {
        // Multi-node drag: move all selected nodes by the same delta
        const moves = this.draggingNodes.map(node => {
          const startPos = this.startNodePositions.get(node.id)!;
          return {
            id: node.id,
            position: {
              x: startPos.x + deltaX,
              y: startPos.y + deltaY
            }
          };
        });
        this.diagramStateService.moveNodes(moves);
      } else {
        // Single node drag
        const newPosition = {
          x: this.startNodePosition.x + deltaX,
          y: this.startNodePosition.y + deltaY,
        };
        this.diagramStateService.moveNode(this.draggingNode!.id, newPosition);
      }
    });
  }

  private stopDraggingNode(event: PointerEvent): void {
    if (!this.draggingNode) return;
    event.stopPropagation();
    this.isDraggingNode = false;
    this.svgRef.nativeElement.releasePointerCapture(event.pointerId);

    // Trigger onDragEnd for all dragged nodes
    this.draggingNodes.forEach(node => {
      this.diagramStateService.onDragEnd(node);
    });

    this.draggingNode = null;
    this.draggingNodes = [];
    this.startNodePositions.clear();
  }

  // --- Resizing Logic ---

  private startResizing(event: PointerEvent, node: Node, handle: 'nw' | 'ne' | 'sw' | 'se'): void {
    event.stopPropagation();
    this.isResizing = true;
    this.resizingNode = node;
    this.resizeHandle = handle;
    this.startResizePosition = { x: event.clientX, y: event.clientY };
    this.startNodeDimensions = {
      width: node.width || this.defaultNodeWidth,
      height: node.height || this.defaultNodeHeight,
      x: node.position.x,
      y: node.position.y
    };
    this.svgRef.nativeElement.setPointerCapture(event.pointerId);
    this.diagramStateService.onResizeStart(node);
  }

  private resize(event: PointerEvent): void {
    if (!this.resizingNode || !this.resizeHandle) return;
    event.stopPropagation();

    const resizingNode = this.resizingNode;
    const resizeHandle = this.resizeHandle;

    this.ngZone.runOutsideAngular(() => {
      const zoom = this.viewport().zoom;
      const deltaX = (event.clientX - this.startResizePosition.x) / zoom;
      const deltaY = (event.clientY - this.startResizePosition.y) / zoom;

      let newWidth = this.startNodeDimensions.width;
      let newHeight = this.startNodeDimensions.height;
      let newX = this.startNodeDimensions.x;
      let newY = this.startNodeDimensions.y;

      // Calculate new dimensions based on handle
      switch (resizeHandle) {
        case 'se': // Southeast - resize from bottom-right
          newWidth = this.startNodeDimensions.width + deltaX;
          newHeight = this.startNodeDimensions.height + deltaY;
          break;
        case 'sw': // Southwest - resize from bottom-left
          newWidth = this.startNodeDimensions.width - deltaX;
          newHeight = this.startNodeDimensions.height + deltaY;
          newX = this.startNodeDimensions.x + deltaX;
          break;
        case 'ne': // Northeast - resize from top-right
          newWidth = this.startNodeDimensions.width + deltaX;
          newHeight = this.startNodeDimensions.height - deltaY;
          newY = this.startNodeDimensions.y + deltaY;
          break;
        case 'nw': // Northwest - resize from top-left
          newWidth = this.startNodeDimensions.width - deltaX;
          newHeight = this.startNodeDimensions.height - deltaY;
          newX = this.startNodeDimensions.x + deltaX;
          newY = this.startNodeDimensions.y + deltaY;
          break;
      }

      // Apply constraints
      const minWidth = resizingNode.minWidth || 50;
      const minHeight = resizingNode.minHeight || 30;
      const maxWidth = resizingNode.maxWidth || 500;
      const maxHeight = resizingNode.maxHeight || 500;

      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

      // Adjust position if constrained (for nw, ne, sw handles)
      if (resizeHandle === 'nw' || resizeHandle === 'sw') {
        const widthDiff = newWidth - (this.startNodeDimensions.width - deltaX);
        newX = this.startNodeDimensions.x + deltaX - widthDiff;
      }
      if (resizeHandle === 'nw' || resizeHandle === 'ne') {
        const heightDiff = newHeight - (this.startNodeDimensions.height - deltaY);
        newY = this.startNodeDimensions.y + deltaY - heightDiff;
      }

      // Update node
      this.diagramStateService.resizeNode(resizingNode.id, newWidth, newHeight, { x: newX, y: newY });
    });
  }

  private stopResizing(event: PointerEvent): void {
    if (!this.resizingNode) return;
    event.stopPropagation();
    this.isResizing = false;
    this.svgRef.nativeElement.releasePointerCapture(event.pointerId);
    this.diagramStateService.onResizeEnd(this.resizingNode);
    this.resizingNode = null;
    this.resizeHandle = null;
  }

  // --- Edge Updating Logic ---

  startUpdatingEdge(event: PointerEvent, edge: Edge, handleType: 'source' | 'target'): void {
    event.stopPropagation();
    this.isUpdatingEdge = true;
    this.updatingEdge = edge;
    this.updatingEdgeHandle = handleType;
    this.svgRef.nativeElement.setPointerCapture(event.pointerId);

    const tempEdgeId = `temp-update-${edge.id}`;
    this.currentPreviewEdgeId = tempEdgeId;

    const sourceNode = this.nodes().find(n => n.id === edge.source);
    const targetNode = this.nodes().find(n => n.id === edge.target);

    if (!sourceNode || !targetNode) return;

    const sourcePos = getHandleAbsolutePosition(sourceNode, edge.sourceHandle);
    const targetPos = getHandleAbsolutePosition(targetNode, edge.targetHandle);

    let startX, startY, endX, endY;

    if (handleType === 'source') {
      startX = targetPos.x;
      startY = targetPos.y;
      endX = sourcePos.x;
      endY = sourcePos.y;
    } else {
      startX = sourcePos.x;
      startY = sourcePos.y;
      endX = targetPos.x;
      endY = targetPos.y;
    }

    this.diagramStateService.addTempEdge({
      id: tempEdgeId,
      source: edge.source,
      sourceHandle: edge.sourceHandle,
      target: edge.target,
      targetHandle: edge.targetHandle,
      type: edge.type || 'bezier',
      animated: edge.animated,
      sourceX: startX,
      sourceY: startY,
      targetX: endX,
      targetY: endY,
      style: edge.style,
      markerEnd: edge.markerEnd
    });
  }

  private updateEdge(event: PointerEvent): void {
    if (!this.updatingEdge || !this.currentPreviewEdgeId) return;
    event.stopPropagation();

    this.ngZone.runOutsideAngular(() => {
      const diagramRect = this.svgRef.nativeElement.getBoundingClientRect();
      const viewport = this.viewport();
      const point = {
        x: (event.clientX - diagramRect.left - viewport.x) / viewport.zoom,
        y: (event.clientY - diagramRect.top - viewport.y) / viewport.zoom
      };

      this.diagramStateService.updateTempEdgeTarget(this.currentPreviewEdgeId!, point);

      const element = document.elementFromPoint(event.clientX, event.clientY);
      const handle = element?.closest('.ngx-flow__handle');

      if (handle) {
        const nodeId = handle.getAttribute('data-nodeid');
        const handleId = handle.getAttribute('data-handleid');
        const type = handle.getAttribute('data-type');

        if (nodeId && type) {
          this.currentTargetHandle = { nodeId, handleId: handleId || undefined, type: type as 'source' | 'target' };
        }
      } else {
        this.currentTargetHandle = null;
      }
    });
  }

  private stopUpdatingEdge(event: PointerEvent): void {
    if (!this.updatingEdge) return;
    event.stopPropagation();
    this.isUpdatingEdge = false;
    this.svgRef.nativeElement.releasePointerCapture(event.pointerId);

    if (this.currentPreviewEdgeId) {
      this.diagramStateService.removeEdge(this.currentPreviewEdgeId);
      this.currentPreviewEdgeId = null;
    }
  }


  // --- Panning Logic ---

  private startPanning(event: PointerEvent): void {
    this.isPanning = true;
    this.lastPanPosition = { x: event.clientX, y: event.clientY };
    this.renderer.setStyle(this.svgRef.nativeElement, 'cursor', 'grabbing');
    this.svgRef.nativeElement.setPointerCapture(event.pointerId);
    this.diagramStateService.clearSelection();
  }

  private pan(event: PointerEvent): void {
    this.ngZone.runOutsideAngular(() => {
      const deltaX = event.clientX - this.lastPanPosition.x;
      const deltaY = event.clientY - this.lastPanPosition.y;

      const currentViewport = this.viewport();
      this.diagramStateService.setViewport({
        x: currentViewport.x + deltaX,
        y: currentViewport.y + deltaY,
        zoom: currentViewport.zoom,
      });

      this.lastPanPosition = { x: event.clientX, y: event.clientY };
    });
  }

  private stopPanning(event: PointerEvent): void {
    this.isPanning = false;
    this.renderer.setStyle(this.svgRef.nativeElement, 'cursor', 'grab');
    this.svgRef.nativeElement.releasePointerCapture(event.pointerId);
  }

  // --- Selection Logic ---

  private startSelecting(event: PointerEvent): void {
    this.isSelecting = true;
    this.selectionStart = this.getDiagramCoordinates(event.clientX, event.clientY);
    this.selectionEnd = { ...this.selectionStart };
    this.svgRef.nativeElement.setPointerCapture(event.pointerId);
  }

  private updateSelection(event: PointerEvent): void {
    this.ngZone.runOutsideAngular(() => {
      this.selectionEnd = this.getDiagramCoordinates(event.clientX, event.clientY);
    });
  }

  private stopSelecting(event: PointerEvent): void {
    this.isSelecting = false;
    this.svgRef.nativeElement.releasePointerCapture(event.pointerId);
    this.performLassoSelection();
  }

  private getDiagramCoordinates(clientX: number, clientY: number): XYPosition {
    const svgRect = this.svgRef.nativeElement.getBoundingClientRect();
    const viewport = this.viewport();

    const x = (clientX - svgRect.left - viewport.x) / viewport.zoom;
    const y = (clientY - svgRect.top - viewport.y) / viewport.zoom;
    return { x, y };
  }

  private performLassoSelection(): void {
    const minX = Math.min(this.selectionStart.x, this.selectionEnd.x);
    const maxX = Math.max(this.selectionStart.x, this.selectionEnd.x);
    const minY = Math.min(this.selectionStart.y, this.selectionEnd.y);
    const maxY = Math.max(this.selectionStart.y, this.selectionEnd.y);

    const selectedNodeIds: string[] = [];
    this.nodes().forEach((node: Node) => {
      const nodeX = node.position.x;
      const nodeY = node.position.y;
      const nodeWidth = node.width || this.defaultNodeWidth;
      const nodeHeight = node.height || this.defaultNodeHeight;

      if (
        nodeX < maxX &&
        nodeX + nodeWidth > minX &&
        nodeY < maxY &&
        nodeY + nodeHeight > minY
      ) {
        selectedNodeIds.push(node.id);
      }
    });

    this.diagramStateService.clearSelection();
    this.diagramStateService.selectNodes(selectedNodeIds, false);
  }

  // --- Edge Logic ---

  getEdgePath(edge: Edge | TempEdge, isTemporary: boolean = false): string {
    const nodes = this.nodes();
    let sourcePos: XYPosition;
    let targetPos: XYPosition;

    if (isTemporary && 'sourceX' in edge && 'sourceY' in edge && 'targetX' in edge && 'targetY' in edge) {
      sourcePos = { x: edge.sourceX, y: edge.sourceY };
      targetPos = { x: edge.targetX, y: edge.targetY };
    } else {
      const sourceNode = getNode(edge.source, nodes);
      const targetNode = getNode(edge.target, nodes);

      if (!sourceNode || !targetNode) {
        return 'M 0 0';
      }

      sourcePos = getHandleAbsolutePosition(sourceNode, edge.sourceHandle);
      targetPos = getHandleAbsolutePosition(targetNode, edge.targetHandle);

      if (sourceNode.id === targetNode.id) {
        return getSelfLoopPath(sourcePos, edge.sourceHandle);
      }
    }

    switch (edge.type) {
      case 'bezier': return getBezierPath(sourcePos, targetPos);
      case 'step': return getStepPath(sourcePos, targetPos);
      case 'straight':
      default: return getStraightPath(sourcePos, targetPos);
    }
  }

  getMarkerUrl(marker: string | undefined): string | null {
    if (!marker) return null;
    // Support built-in markers or custom marker IDs
    if (marker === 'arrow' || marker === 'arrowclosed' || marker === 'dot') {
      return `url(#ngx-flow__${marker})`;
    }
    return `url(#${marker})`;
  }

  getEdgeLabelPosition(edge: Edge): XYPosition {
    const nodes = this.nodes();
    const sourceNode = getNode(edge.source, nodes);
    const targetNode = getNode(edge.target, nodes);

    if (!sourceNode || !targetNode) {
      return { x: 0, y: 0 };
    }

    const sourcePos = getHandleAbsolutePosition(sourceNode, edge.sourceHandle);
    const targetPos = getHandleAbsolutePosition(targetNode, edge.targetHandle);

    // Return midpoint of the edge
    return {
      x: (sourcePos.x + targetPos.x) / 2,
      y: (sourcePos.y + targetPos.y) / 2
    };
  }

  onEdgeClick(event: MouseEvent, edge: Edge): void {
    event.stopPropagation();
    event.preventDefault();

    this.diagramStateService.onEdgeClick(edge);

    const isMultiSelect = event.ctrlKey || event.metaKey || event.shiftKey;

    // Clear node selection when selecting edges
    this.diagramStateService.nodes.update(nodes =>
      nodes.map(n => ({ ...n, selected: false }))
    );

    // Toggle edge selection
    this.diagramStateService.edges.update(edges =>
      edges.map(e => ({
        ...e,
        selected: e.id === edge.id
          ? !e.selected
          : (isMultiSelect ? e.selected : false)
      }))
    );
  }

  // --- Node Logic ---

  getCustomNodeComponent(type: string | undefined): NodeComponentType | null {
    if (type && this.nodeTypes && this.nodeTypes[type]) {
      return this.nodeTypes[type];
    }
    return null;
  }

  zoomIn(): void {
    const currentViewport = this.viewport();
    const newZoom = Math.min(currentViewport.zoom * 1.2, 10);
    this.diagramStateService.setViewport({
      ...currentViewport,
      zoom: newZoom
    });
  }

  zoomOut(): void {
    const currentViewport = this.viewport();
    const newZoom = Math.max(currentViewport.zoom / 1.2, 0.1);
    this.diagramStateService.setViewport({
      ...currentViewport,
      zoom: newZoom
    });
  }

  resetZoom(): void {
    const currentViewport = this.viewport();
    this.diagramStateService.setViewport({
      ...currentViewport,
      zoom: 1
    });
  }

  fitView(): void {
    const nodes = this.nodes();
    if (nodes.length === 0) return;

    // Calculate bounds of all nodes
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach(node => {
      const width = node.width || this.defaultNodeWidth;
      const height = node.height || this.defaultNodeHeight;

      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + width);
      maxY = Math.max(maxY, node.position.y + height);
    });

    const boundsWidth = maxX - minX;
    const boundsHeight = maxY - minY;

    // Get SVG dimensions
    const svgRect = this.svgRef.nativeElement.getBoundingClientRect();
    const padding = 50; // Padding around nodes

    // Calculate zoom to fit
    const zoomX = (svgRect.width - padding * 2) / boundsWidth;
    const zoomY = (svgRect.height - padding * 2) / boundsHeight;
    const zoom = Math.min(zoomX, zoomY, 2); // Max zoom of 2x for fit view

    // Calculate center position
    const x = (svgRect.width - boundsWidth * zoom) / 2 - minX * zoom;
    const y = (svgRect.height - boundsHeight * zoom) / 2 - minY * zoom;

    this.diagramStateService.setViewport({ x, y, zoom });
  }

  /**
   * Returns the current state of the diagram (nodes, edges, viewport).
   */
  getDiagramState(): DiagramState {
    return this.diagramStateService.getDiagramState();
  }

  /**
   * Sets the state of the diagram.
   */
  setDiagramState(state: DiagramState): void {
    this.diagramStateService.setDiagramState(state);
  }

  /**
   * Exports the diagram as an SVG file.
   * @param fileName The name of the file to download (default: 'diagram.svg')
   * @param download Whether to trigger a download (default: true)
   * @returns The SVG string
   */
  exportToSVG(fileName: string = 'diagram.svg', download: boolean = true): string {
    const svgElement = this.svgRef.nativeElement;

    // Clone the SVG to avoid modifying the live diagram
    const clone = svgElement.cloneNode(true) as SVGSVGElement;

    // Get the bounding box of the content (nodes and edges)
    // We need to calculate this manually because getBBox() on the clone won't work if it's not in the DOM
    const nodes = this.nodes();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    if (nodes.length > 0) {
      nodes.forEach(node => {
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + (node.width || this.defaultNodeWidth));
        maxY = Math.max(maxY, node.position.y + (node.height || this.defaultNodeHeight));
      });
    } else {
      minX = 0; minY = 0; maxX = 100; maxY = 100;
    }

    // Add some padding
    const padding = 20;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const width = maxX - minX;
    const height = maxY - minY;

    // Set the viewBox to the content bounds
    clone.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
    clone.setAttribute('width', `${width}`);
    clone.setAttribute('height', `${height}`);

    // Remove the transform from the viewport group in the clone to reset zoom/pan
    // The viewport group is the first child g element
    const viewportGroup = clone.querySelector('.ngx-flow__viewport');
    if (viewportGroup) {
      viewportGroup.removeAttribute('transform');
    }

    // Serialize the SVG
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(clone);

    // Add XML declaration
    if (!svgString.match(/^<xml/)) {
      svgString = '<?xml version="1.0" encoding="utf-8"?>\n' + svgString;
    }

    if (download) {
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      this.downloadFile(url, fileName);
      URL.revokeObjectURL(url);
    }

    return svgString;
  }

  /**
   * Exports the diagram as a PNG image.
   * @param fileName The name of the file to download (default: 'diagram.png')
   * @param download Whether to trigger a download (default: true)
   * @returns A promise that resolves to the data URL of the PNG
   */
  async exportToPNG(fileName: string = 'diagram.png', download: boolean = true): Promise<string> {
    const svgString = this.exportToSVG(fileName, false);

    return new Promise((resolve, reject) => {
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, 0, 0);

        const pngUrl = canvas.toDataURL('image/png');

        if (download) {
          this.downloadFile(pngUrl, fileName);
        }

        URL.revokeObjectURL(url);
        resolve(pngUrl);
      };

      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };

      img.src = url;
    });
  }

  private downloadFile(url: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getEdgeHandlePosition(edge: Edge, type: 'source' | 'target'): XYPosition {
    const nodes = this.nodes();
    const nodeId = type === 'source' ? edge.source : edge.target;
    const handleId = type === 'source' ? edge.sourceHandle : edge.targetHandle;
    const node = nodes.find(n => n.id === nodeId);

    if (!node) return { x: 0, y: 0 };

    const pos = getHandleAbsolutePosition(node, handleId);

    return {
      x: isFinite(pos.x) ? pos.x : 0,
      y: isFinite(pos.y) ? pos.y : 0
    };
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    // Ignore if focus is on an input or textarea
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Delete or Backspace to remove selected elements
    if (event.key === 'Delete' || event.key === 'Backspace') {
      this.diagramStateService.deleteSelectedElements();
    }

    // Ctrl+A or Cmd+A to select all
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.preventDefault(); // Prevent default browser select all
      this.diagramStateService.selectAll();
    }

    // Undo (Ctrl+Z) and Redo (Ctrl+Y or Ctrl+Shift+Z)
    if (event.ctrlKey || event.metaKey) {
      if (event.key === 'z') {
        event.preventDefault();
        this.diagramStateService.undo();
      } else if (event.key === 'y' || (event.shiftKey && event.key === 'Z')) {
        event.preventDefault();
        this.diagramStateService.redo();
      }
    }
  }
}
