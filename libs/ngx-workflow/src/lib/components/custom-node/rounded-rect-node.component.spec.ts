import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { RoundedRectNodeComponent } from './rounded-rect-node.component';
import { Node } from '../../models/node.model';

describe('RoundedRectNodeComponent', () => {
  let component: RoundedRectNodeComponent;
  let fixture: ComponentFixture<RoundedRectNodeComponent>;

  const mockNode: Node = {
    id: 'node-1',
    type: 'rounded-rect',
    position: { x: 10, y: 20 },
    width: 200,
    height: 80,
    data: { label: 'Custom Node Title' }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoundedRectNodeComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(RoundedRectNodeComponent);
    component = fixture.componentInstance;
  });

  it('should create and display node label text', () => {
    component.node = mockNode;
    fixture.detectChanges();

    expect(component).toBeTruthy();
    const textEl: SVGTextElement = fixture.nativeElement.querySelector('text');
    expect(textEl.textContent?.trim()).toBe('Custom Node Title');
  });

  it('should fallback to default label if none provided', () => {
    component.node = { id: '2', type: 'rounded-rect', position: { x: 0, y: 0 } };
    fixture.detectChanges();

    const textEl: SVGTextElement = fixture.nativeElement.querySelector('text');
    expect(textEl.textContent?.trim()).toBe('Custom Node');
  });
});
