import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HandleComponent } from './handle.component';
import { HandleRegistryService } from '../../services/handle-registry.service';

describe('HandleComponent', () => {
  let component: HandleComponent;
  let fixture: ComponentFixture<HandleComponent>;
  let mockHandleRegistry: jasmine.SpyObj<HandleRegistryService>;

  beforeEach(async () => {
    mockHandleRegistry = jasmine.createSpyObj('HandleRegistryService', ['registerHandle', 'unregisterHandle']);

    await TestBed.configureTestingModule({
      imports: [HandleComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: HandleRegistryService, useValue: mockHandleRegistry }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HandleComponent);
    component = fixture.componentInstance;
  });

  it('should register handle on creation with required signal inputs', () => {
    fixture.componentRef.setInput('nodeId', 'node-1');
    fixture.componentRef.setInput('handleId', 'handle-a');
    fixture.componentRef.setInput('type', 'source');
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(mockHandleRegistry.registerHandle).toHaveBeenCalledWith(
      'node-1',
      'handle-a',
      'source',
      jasmine.objectContaining({
        dataType: undefined,
        isConnectable: undefined,
        isValidConnection: undefined
      })
    );
  });

  it('should unregister handle on destroy', () => {
    fixture.componentRef.setInput('nodeId', 'node-1');
    fixture.componentRef.setInput('handleId', 'handle-a');
    fixture.componentRef.setInput('type', 'source');
    fixture.detectChanges();

    fixture.destroy();
    expect(mockHandleRegistry.unregisterHandle).toHaveBeenCalledWith('node-1', 'handle-a', 'source');
  });
});
