import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PaletteComponent, PaletteItem } from './palette.component';

describe('PaletteComponent', () => {
  let component: PaletteComponent;
  let fixture: ComponentFixture<PaletteComponent>;

  const item: PaletteItem = {
    type: 'default',
    label: 'Test Node',
    icon: 'icon',
    data: {}
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaletteComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(PaletteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle onDragStart with dataTransfer', () => {
    const mockDataTransfer = jasmine.createSpyObj('DataTransfer', ['setData']);
    const dragEvent = {
      dataTransfer: mockDataTransfer
    } as any;

    component.onDragStart(dragEvent, item);

    expect(mockDataTransfer.setData).toHaveBeenCalledWith(
      'application/ngx-workflow-node',
      JSON.stringify(item)
    );
    expect(mockDataTransfer.effectAllowed).toBe('copy');
  });

  it('should handle onDragStart without dataTransfer gracefully', () => {
    const dragEvent = {
      dataTransfer: null
    } as any;

    expect(() => component.onDragStart(dragEvent, item)).not.toThrow();
  });
});
