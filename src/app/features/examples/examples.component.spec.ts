import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ExamplesComponent } from './examples.component';
import { LayoutService } from 'ngx-workflow';

describe('ExamplesComponent', () => {
  let component: ExamplesComponent;
  let fixture: ComponentFixture<ExamplesComponent>;
  let mockLayoutService: { applyElkLayout: jasmine.Spy };

  beforeEach(async () => {
    mockLayoutService = {
      applyElkLayout: jasmine.createSpy('applyElkLayout').and.resolveTo([
        { id: 'a1', label: 'Root Ingestion', position: { x: 50, y: 50 } },
        { id: 'a2', label: 'Branch A (Auth)', position: { x: 250, y: 50 } }
      ])
    };

    await TestBed.configureTestingModule({
      imports: [ExamplesComponent],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: LayoutService,
          useValue: mockLayoutService
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExamplesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create ExamplesComponent', () => {
    expect(component).toBeTruthy();
    expect(component.scenarios.length).toBeGreaterThanOrEqual(5);
  });

  it('should include the workflow legend scenario', () => {
    const legendScenario = component.scenarios.find(s => s.id === 'legend');
    expect(legendScenario).toBeDefined();
    expect(legendScenario?.title).toContain('Workflow Legend');
    expect(legendScenario?.nodes.length).toBe(5);
    expect(legendScenario?.edges.length).toBe(4);
  });

  it('should switch active scenario when selectScenario is called', () => {
    const legendScenario = component.scenarios.find(s => s.id === 'legend')!;
    component.selectScenario(legendScenario);

    expect(component.activeScenario().id).toBe('legend');
    expect(component.showCode()).toBeFalse();
  });

  it('should toggle legend collapse state and update position', () => {
    expect(component.legendCollapsed()).toBeFalse();
    component.toggleLegendCollapsed();
    expect(component.legendCollapsed()).toBeTrue();

    const mockEvent = {
      target: { value: 'bottom-left' }
    } as unknown as Event;

    component.onLegendPosChange(mockEvent);
    expect(component.legendPosition()).toBe('bottom-left');
  });

  it('should update legend theme, width, and computed style', () => {
    component.onLegendThemeChange({ target: { value: 'dark' } } as unknown as Event);
    expect(component.legendTheme()).toBe('dark');
    expect(component.legendTextColor()).toBe('#f8fafc');

    component.onLegendWidthChange({ target: { value: 'wide' } } as unknown as Event);
    expect(component.legendWidth()).toBe('wide');
    expect(component.legendPanelStyle().width).toBe('370px');

    const snippet = component.getActiveCodeSnippet();
    expect(snippet).toBeDefined();
  });

  it('should toggle search controls, background, minimap, and zoom controls', () => {
    const initialSearch = component.showSearchControls();
    component.toggleSearchControls();
    expect(component.showSearchControls()).toBe(!initialSearch);

    const initialBg = component.showBackground();
    component.toggleBackground();
    expect(component.showBackground()).toBe(!initialBg);

    const initialMinimap = component.showMinimap();
    component.toggleMinimap();
    expect(component.showMinimap()).toBe(!initialMinimap);

    const initialZoom = component.showZoomControls();
    component.toggleZoomControls();
    expect(component.showZoomControls()).toBe(!initialZoom);
  });

  it('should toggle animated and cycle backgrounds', () => {
    const initialAnim = component.animated();
    component.toggleAnimated();
    expect(component.animated()).toBe(!initialAnim);

    expect(component.bgVariant()).toBe('dots');
    component.cycleBg();
    expect(component.bgVariant()).toBe('lines');
    component.cycleBg();
    expect(component.bgVariant()).toBe('cross');
    component.cycleBg();
    expect(component.bgVariant()).toBe('dots');
  });

  it('should toggle code view', () => {
    expect(component.showCode()).toBeFalse();
    component.toggleCode();
    expect(component.showCode()).toBeTrue();
  });

  it('should handle onNodeDoubleClick, load node config, and save updates', async () => {
    const node = component.scenarios.find(s => s.id === 'legend')!.nodes[0];
    component.selectScenario(component.scenarios.find(s => s.id === 'legend')!);

    await component.onNodeDoubleClick(node);

    expect(component.inspectorOpen()).toBeTrue();
    expect(component.isFetchingConfig()).toBeFalse();
    expect(component.activeNodeConfig()).toBeDefined();
    expect(component.editFormLabel()).toBe(node.label!);

    component.onEditLabel({ target: { value: 'Updated HTTP Ingestion' } } as unknown as Event);
    component.onEditEndpoint({ target: { value: '/v2/webhooks/orders' } } as unknown as Event);

    component.saveNodeConfig();
    expect(component.activeScenario().nodes[0].label).toBe('Updated HTTP Ingestion');
    expect(component.saveToastMessage()).toContain('Updated HTTP Ingestion');

    component.closeInspector();
    expect(component.inspectorOpen()).toBeFalse();

    component.toggleInspector();
    expect(component.inspectorOpen()).toBeTrue();

    // Clicking empty pane should close inspector:
    component.onPaneClick();
    expect(component.inspectorOpen()).toBeFalse();

    // Clicking a different node should close previous node inspector:
    await component.onNodeDoubleClick(node);
    expect(component.inspectorOpen()).toBeTrue();
    const otherNode = component.scenarios.find(s => s.id === 'legend')!.nodes[1];
    component.onNodeClick(otherNode);
    expect(component.inspectorOpen()).toBeFalse();

    // Toggle properties sidebar
    expect(component.showPropertiesSidebar()).toBeFalse();
    component.togglePropertiesSidebar();
    expect(component.showPropertiesSidebar()).toBeTrue();
  });

  it('should trigger auto layout for autolayout scenario', async () => {
    const autolayoutScen = component.scenarios.find(s => s.id === 'autolayout')!;
    component.selectScenario(autolayoutScen);

    await component.triggerAutoLayout();
    expect(component.activeScenario().nodes.length).toBe(5);
    expect(component.activeScenario().nodes[0].position.x).toBeDefined();
    expect(component.activeScenario().nodes[0].position.y).toBeDefined();
  });
});
