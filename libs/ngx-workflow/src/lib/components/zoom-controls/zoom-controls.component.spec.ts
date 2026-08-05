import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ZoomControlsComponent } from './zoom-controls.component';

describe('ZoomControlsComponent', () => {
  let component: ZoomControlsComponent;
  let fixture: ComponentFixture<ZoomControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoomControlsComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(ZoomControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute correct zoomPercent', () => {
    component.zoom = 1.5;
    expect(component.zoomPercent).toBe(150);

    component.zoom = 0.75;
    expect(component.zoomPercent).toBe(75);
  });

  it('should emit zoomIn on onZoomIn()', () => {
    spyOn(component.zoomIn, 'emit');
    component.onZoomIn();
    expect(component.zoomIn.emit).toHaveBeenCalled();
  });

  it('should emit zoomOut on onZoomOut()', () => {
    spyOn(component.zoomOut, 'emit');
    component.onZoomOut();
    expect(component.zoomOut.emit).toHaveBeenCalled();
  });

  it('should emit fitView on onFitView()', () => {
    spyOn(component.fitView, 'emit');
    component.onFitView();
    expect(component.fitView.emit).toHaveBeenCalled();
  });

  it('should emit resetZoom on onResetZoom()', () => {
    spyOn(component.resetZoom, 'emit');
    component.onResetZoom();
    expect(component.resetZoom.emit).toHaveBeenCalled();
  });
});
