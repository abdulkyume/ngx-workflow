import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PanelComponent } from './panel.component';

describe('PanelComponent', () => {
  let component: PanelComponent;
  let fixture: ComponentFixture<PanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(PanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with default position top-left', () => {
    expect(component).toBeTruthy();
    expect(component.position).toBe('top-left');
  });

  it('should reflect position input', () => {
    component.position = 'bottom-right';
    component.className = 'custom-class';
    fixture.detectChanges();

    expect(component.position).toBe('bottom-right');
    expect(component.className).toBe('custom-class');
  });
});
