import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { GridOverlayComponent } from './grid-overlay.component';

describe('GridOverlayComponent', () => {
  let component: GridOverlayComponent;
  let fixture: ComponentFixture<GridOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GridOverlayComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(GridOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with default values', () => {
    expect(component).toBeTruthy();
    expect(component.gridSize).toBe(20);
    expect(component.gridColor).toBe('#cbd5e1');
    expect(component.width).toBe(5000);
    expect(component.height).toBe(5000);
  });

  it('should set input properties correctly', () => {
    fixture.componentRef.setInput('gridSize', 30);
    fixture.componentRef.setInput('gridColor', '#ff0000');
    fixture.componentRef.setInput('width', 2000);
    fixture.componentRef.setInput('height', 2000);
    fixture.detectChanges();

    const svgElement: SVGElement = fixture.nativeElement.querySelector('svg');
    expect(svgElement.getAttribute('viewBox')).toBe('0 0 2000 2000');
  });
});
