import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ZoomControlsComponent } from './zoom-controls.component';
import { DEFAULT_ZOOM_CONTROLS_ITEMS, ZoomControlItem } from './zoom-controls.model';
import { DiagramStateService } from '../../services/diagram-state.service';

describe('ZoomControlsComponent', () => {
  let component: ZoomControlsComponent;
  let fixture: ComponentFixture<ZoomControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoomControlsComponent],
      providers: [provideZonelessChangeDetection(), DiagramStateService],
    }).compileComponents();

    fixture = TestBed.createComponent(ZoomControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute correct zoomPercent', () => {
    fixture.componentRef.setInput('zoom', 1.5);
    expect(component.zoomPercent()).toBe(150);

    fixture.componentRef.setInput('zoom', 0.75);
    expect(component.zoomPercent()).toBe(75);
  });

  it('should use default Figma items when config is omitted', () => {
    expect(component.visibleItems().map(item => item.id)).toEqual(
      DEFAULT_ZOOM_CONTROLS_ITEMS.map(item => item.id),
    );
  });

  it('should honor custom items and hide invisible ones', () => {
    const items: ZoomControlItem[] = [
      { id: 'a', type: 'action', action: 'zoomIn', icon: 'plus' },
      { id: 'hidden', type: 'separator', visible: false },
      { id: 'custom', type: 'action', action: 'myAction', label: 'Go' },
    ];
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    expect(component.visibleItems().map(item => item.id)).toEqual(['a', 'custom']);
  });

  it('should emit zoomIn on built-in action click', () => {
    const spy = jasmine.createSpy('zoomIn');
    component.zoomIn.subscribe(spy);
    component.onItemClick({
      id: 'zoomIn',
      type: 'action',
      action: 'zoomIn',
    });
    expect(spy).toHaveBeenCalled();
  });

  it('should emit zoomOut, fitView, resetZoom, fullscreen, undo, redo on built-in action clicks', () => {
    const zoomOutSpy = jasmine.createSpy('zoomOut');
    const fitViewSpy = jasmine.createSpy('fitView');
    const resetZoomSpy = jasmine.createSpy('resetZoom');
    const fullscreenSpy = jasmine.createSpy('fullscreen');
    const undoSpy = jasmine.createSpy('undo');
    const redoSpy = jasmine.createSpy('redo');

    component.zoomOut.subscribe(zoomOutSpy);
    component.fitView.subscribe(fitViewSpy);
    component.resetZoom.subscribe(resetZoomSpy);
    component.fullscreen.subscribe(fullscreenSpy);
    component.undo.subscribe(undoSpy);
    component.redo.subscribe(redoSpy);

    spyOn(component, 'isActionDisabled').and.returnValue(false);

    component.onItemClick({ id: 'zoomOut', type: 'action', action: 'zoomOut' });
    expect(zoomOutSpy).toHaveBeenCalled();

    component.onItemClick({ id: 'fitView', type: 'action', action: 'fitView' });
    expect(fitViewSpy).toHaveBeenCalled();

    component.onItemClick({ id: 'resetZoom', type: 'action', action: 'resetZoom' });
    expect(resetZoomSpy).toHaveBeenCalled();

    component.onItemClick({ id: 'fullscreen', type: 'action', action: 'fullscreen' });
    expect(fullscreenSpy).toHaveBeenCalled();

    component.onItemClick({ id: 'undo', type: 'action', action: 'undo' });
    expect(undoSpy).toHaveBeenCalled();

    component.onItemClick({ id: 'redo', type: 'action', action: 'redo' });
    expect(redoSpy).toHaveBeenCalled();
  });

  it('should emit actionClick for custom actions with mouse event', () => {
    const spy = jasmine.createSpy('actionClick');
    component.actionClick.subscribe(spy);
    const mouseEvt = new MouseEvent('click');
    component.onItemClick(
      {
        id: 'custom',
        type: 'action',
        action: 'myAction',
        label: 'Go',
      },
      mouseEvt
    );
    expect(spy).toHaveBeenCalledWith({ id: 'custom', action: 'myAction', event: mouseEvt });
  });

  it('should support all 8 anchor positions and custom configs', () => {
    expect(component.resolvedPosition()).toBe('bottom-left');

    fixture.componentRef.setInput('position', 'top-center');
    expect(component.resolvedPosition()).toBe('top-center');

    fixture.componentRef.setInput('config', { position: 'center-right', orientation: 'vertical' });
    fixture.componentRef.setInput('position', undefined);
    expect(component.resolvedPosition()).toBe('center-right');
    expect(component.resolvedOrientation()).toBe('vertical');
  });

  it('should support custom style, className, and safeSvg', () => {
    fixture.componentRef.setInput('style', { background: 'red' });
    fixture.componentRef.setInput('className', 'my-custom-zoom');
    expect(component.resolvedStyle()).toEqual({ background: 'red' });
    expect(component.resolvedClassName()).toBe('my-custom-zoom');

    const svg = '<svg><circle cx="8" cy="8" r="4"/></svg>';
    expect(component.safeSvg(svg)).not.toBeNull();
  });

  it('should resolve icon keys from icon or action', () => {
    expect(component.iconKey({ id: 'a', type: 'action', icon: 'plus' })).toBe('plus');
    expect(component.iconKey({ id: 'b', type: 'action', action: 'zoomOut' })).toBe('zoomOut');
    expect(component.iconKey({ id: 'c', type: 'action', action: 'undo' })).toBe('undo');
    expect(component.iconKey({ id: 'd', type: 'action', action: 'redo' })).toBe('redo');
  });
});
