import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { VersionHistoryComponent } from './version-history.component';
import { DiagramComponent } from '../diagram/diagram.component';
import { VersionSnapshot } from '../../models/version.model';

describe('VersionHistoryComponent', () => {
  let component: VersionHistoryComponent;
  let fixture: ComponentFixture<VersionHistoryComponent>;
  let mockDiagram: any;

  const mockVersions: VersionSnapshot[] = [
    {
      id: 'v1',
      timestamp: Date.now() - 10000,
      state: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
      nodeCount: 0,
      edgeCount: 0,
      description: 'Initial Version'
    }
  ];

  beforeEach(async () => {
    mockDiagram = {
      getVersionHistory: jasmine.createSpy('getVersionHistory').and.returnValue(mockVersions),
      restoreVersion: jasmine.createSpy('restoreVersion'),
      clearVersionHistory: jasmine.createSpy('clearVersionHistory'),
      saveVersion: jasmine.createSpy('saveVersion'),
      autoSaveService: {
        deleteVersion: jasmine.createSpy('deleteVersion')
      }
    };

    await TestBed.configureTestingModule({
      imports: [VersionHistoryComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(VersionHistoryComponent);
    component = fixture.componentInstance;
    component.diagram = mockDiagram;
    fixture.detectChanges();
  });

  it('should create and load version history', () => {
    expect(component).toBeTruthy();
    expect(mockDiagram.getVersionHistory).toHaveBeenCalled();
    expect(component.versions).toEqual(mockVersions);
  });

  it('should format relative timestamps accurately for all ranges', () => {
    const now = Date.now();
    expect(component.formatTimestamp(now)).toBe('Just now');
    expect(component.formatTimestamp(now - 2 * 60 * 1000)).toBe('2 minutes ago');
    expect(component.formatTimestamp(now - 1 * 60 * 1000)).toBe('1 minute ago');
    expect(component.formatTimestamp(now - 3 * 3600 * 1000)).toBe('3 hours ago');
    expect(component.formatTimestamp(now - 1 * 3600 * 1000)).toBe('1 hour ago');
    expect(component.formatTimestamp(now - 4 * 86400 * 1000)).toBe('4 days ago');
    expect(component.formatTimestamp(now - 1 * 86400 * 1000)).toBe('1 day ago');
    expect(component.formatTimestamp(now - 10 * 86400 * 1000)).toBe(new Date(now - 10 * 86400 * 1000).toLocaleDateString());

    expect(component.formatFullDate(now)).toBe(new Date(now).toLocaleString());
  });

  it('should restore version when confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.restoreVersion('v1');
    expect(mockDiagram.restoreVersion).toHaveBeenCalledWith('v1');
  });

  it('should delete version when confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.deleteVersion('v1');
    expect(mockDiagram.autoSaveService.deleteVersion).toHaveBeenCalledWith('v1');
  });

  it('should clear all history when confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.clearAll();
    expect(mockDiagram.clearVersionHistory).toHaveBeenCalled();
  });

  it('should call diagram saveVersion and reload on saveVersion()', () => {
    component.newVersionDescription = 'Manual Save';
    component.showSaveInput = true;

    component.saveVersion();

    expect(mockDiagram.saveVersion).toHaveBeenCalledWith('Manual Save');
    expect(component.showSaveInput).toBe(false);
    expect(component.newVersionDescription).toBe('');
  });

  it('should toggle save input visibility', () => {
    component.toggleSaveInput();
    expect(component.showSaveInput).toBe(true);

    component.toggleSaveInput();
    expect(component.showSaveInput).toBe(false);
  });

  it('should reload versions on refresh()', () => {
    component.refresh();
    expect(mockDiagram.getVersionHistory).toHaveBeenCalled();
  });
});
