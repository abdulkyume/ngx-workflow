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
    expect(component.position()).toBe('top-left');
  });

  it('should reflect position and className inputs', () => {
    fixture.componentRef.setInput('position', 'bottom-right');
    fixture.componentRef.setInput('className', 'custom-class');
    fixture.detectChanges();

    expect(component.position()).toBe('bottom-right');
    expect(component.className()).toBe('custom-class');

    const el: HTMLElement = fixture.nativeElement.querySelector('.ngx-workflow__panel');
    expect(el.classList.contains('ngx-workflow__panel--bottom-right')).toBeTrue();
    expect(el.classList.contains('custom-class')).toBeTrue();
  });

  it('should apply custom inline styles via style input', () => {
    fixture.componentRef.setInput('style', { width: '350px', zIndex: 20 });
    fixture.detectChanges();

    expect(component.style()).toEqual({ width: '350px', zIndex: 20 });
    const el: HTMLElement = fixture.nativeElement.querySelector('.ngx-workflow__panel');
    expect(el.style.width).toBe('350px');
    expect(el.style.zIndex).toBe('20');
  });
});
