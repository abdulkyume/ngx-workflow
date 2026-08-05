import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ContextMenuService, ContextMenuItem } from './context-menu.service';

describe('ContextMenuService', () => {
  let service: ContextMenuService;

  const items: ContextMenuItem[] = [
    { label: 'Action 1', action: () => {} }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ContextMenuService
      ]
    });
    service = TestBed.inject(ContextMenuService);
  });

  it('should create with initial closed state', () => {
    expect(service.state().isOpen).toBe(false);
  });

  it('should open and close context menu', () => {
    service.open({ x: 100, y: 200 }, items, 'target-node');
    expect(service.state().isOpen).toBe(true);
    expect(service.state().position).toEqual({ x: 100, y: 200 });
    expect(service.state().items).toEqual(items);
    expect(service.state().target).toBe('target-node');

    service.close();
    expect(service.state().isOpen).toBe(false);
  });

  it('should toggle context menu state', () => {
    service.toggle({ x: 50, y: 50 }, items);
    expect(service.state().isOpen).toBe(true);

    service.toggle({ x: 50, y: 50 }, items);
    expect(service.state().isOpen).toBe(false);
  });
});
