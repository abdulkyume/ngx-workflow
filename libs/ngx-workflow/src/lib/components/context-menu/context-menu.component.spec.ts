import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ContextMenuComponent } from './context-menu.component';
import { ContextMenuService, ContextMenuState } from '../../services/context-menu.service';

describe('ContextMenuComponent', () => {
  let component: ContextMenuComponent;
  let fixture: ComponentFixture<ContextMenuComponent>;
  let mockContextMenuService: jasmine.SpyObj<ContextMenuService>;
  let stateSignal = signal<ContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    items: [],
  });

  beforeEach(async () => {
    stateSignal = signal<ContextMenuState>({
      isOpen: true,
      position: { x: 100, y: 150 },
      items: [
        { label: 'Option 1', action: jasmine.createSpy('action1') },
        { label: 'Option 2', action: jasmine.createSpy('action2') }
      ],
    });

    mockContextMenuService = jasmine.createSpyObj('ContextMenuService', ['close'], {
      state: stateSignal,
    });

    await TestBed.configureTestingModule({
      imports: [ContextMenuComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ContextMenuService, useValue: mockContextMenuService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContextMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should trigger action and close menu on onActionClick', () => {
    const fakeEvent = jasmine.createSpyObj('MouseEvent', ['stopPropagation']);
    const actionSpy = jasmine.createSpy('action');

    component.onActionClick(fakeEvent, actionSpy);

    expect(fakeEvent.stopPropagation).toHaveBeenCalled();
    expect(actionSpy).toHaveBeenCalled();
    expect(mockContextMenuService.close).toHaveBeenCalled();
  });

  it('should close context menu on document click outside when open', () => {
    const fakeClickEvent = {
      target: document.createElement('div')
    } as any;

    component.onDocumentClick(fakeClickEvent);
    expect(mockContextMenuService.close).toHaveBeenCalled();
  });
});
