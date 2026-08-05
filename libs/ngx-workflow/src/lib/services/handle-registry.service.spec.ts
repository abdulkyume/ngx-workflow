import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HandleRegistryService } from './handle-registry.service';
import { Node, Edge } from '../models';

describe('HandleRegistryService', () => {
  let service: HandleRegistryService;

  const node: Node = { id: 'node-1', type: 'default', position: { x: 0, y: 0 } };
  const edge: Edge = { id: 'edge-1', source: 'node-1', target: 'node-2' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        HandleRegistryService
      ]
    });
    service = TestBed.inject(HandleRegistryService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should default canConnect to true for unregistered handles', () => {
    expect(service.canConnect('unregistered', 'h1', 'source', node, [])).toBe(true);
  });

  it('should register and unregister handles', () => {
    service.registerHandle('n1', 'h1', 'source', { isConnectable: false });
    expect(service.canConnect('n1', 'h1', 'source', node, [])).toBe(false);

    service.unregisterHandle('n1', 'h1', 'source');
    expect(service.canConnect('n1', 'h1', 'source', node, [])).toBe(true);
  });

  it('should evaluate boolean, number, and function for isConnectable', () => {
    // Boolean limit
    service.registerHandle('n1', 'h-bool', 'source', { isConnectable: true });
    expect(service.canConnect('n1', 'h-bool', 'source', node, [])).toBe(true);

    // Number limit
    service.registerHandle('n1', 'h-num', 'source', { isConnectable: 1 });
    expect(service.canConnect('n1', 'h-num', 'source', node, [])).toBe(true);
    expect(service.canConnect('n1', 'h-num', 'source', node, [edge])).toBe(false);

    // Function limit
    service.registerHandle('n1', 'h-fn', 'source', {
      isConnectable: (n, edges) => n.id === 'node-1' && edges.length === 0
    });
    expect(service.canConnect('n1', 'h-fn', 'source', node, [])).toBe(true);
    expect(service.canConnect('n1', 'h-fn', 'source', node, [edge])).toBe(false);
  });

  it('should validate data types via canConnectTypes', () => {
    service.registerHandle('n1', 'out', 'source', { dataType: 'string' });
    service.registerHandle('n2', 'in1', 'target', { dataType: 'string' });
    service.registerHandle('n2', 'in2', 'target', { dataType: 'number' });
    service.registerHandle('n3', 'in-any', 'target', { dataType: 'any' });

    expect(service.canConnectTypes('n1', 'out', 'n2', 'in1')).toBe(true);
    expect(service.canConnectTypes('n1', 'out', 'n2', 'in2')).toBe(false);
    expect(service.canConnectTypes('n1', 'out', 'n3', 'in-any')).toBe(true);

    // Missing handleId or unregistered
    expect(service.canConnectTypes('n1', undefined, 'n2', 'in1')).toBe(true);
  });
});
