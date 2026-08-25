import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ZoomControlsComponent } from './zoom-controls.component';
import { DEFAULT_ZOOM_CONTROLS_ITEMS, ZoomControlItem } from './zoom-controls.model';

describe('ZoomControlsComponent', () => {
  let component: ZoomControlsComponent;
  let fixture: ComponentFixture<ZoomControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoomControlsComponent],
      providers: [provideZonelessChangeDetection()],
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

  it('should emit actionClick for custom actions', () => {
    const spy = jasmine.createSpy('actionClick');
    component.actionClick.subscribe(spy);
    component.onItemClick({
      id: 'custom',
      type: 'action',
      action: 'myAction',
      label: 'Go',
    });
    expect(spy).toHaveBeenCalledWith({ id: 'custom', action: 'myAction' });
  });

  it('should default position to bottom-left', () => {
    expect(component.resolvedPosition()).toBe('bottom-left');
  });

  it('should resolve icon keys from icon or action', () => {
    expect(component.iconKey({ id: 'a', type: 'action', icon: 'plus' })).toBe('plus');
    expect(component.iconKey({ id: 'b', type: 'action', action: 'zoomOut' })).toBe('zoomOut');
  });
});
