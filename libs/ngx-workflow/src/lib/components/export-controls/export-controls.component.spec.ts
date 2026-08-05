import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ExportControlsComponent } from './export-controls.component';

describe('ExportControlsComponent', () => {
  let component: ExportControlsComponent;
  let fixture: ComponentFixture<ExportControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportControlsComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(ExportControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit exportJSON on onExportJSON()', () => {
    spyOn(component.exportJSON, 'emit');
    component.onExportJSON();
    expect(component.exportJSON.emit).toHaveBeenCalled();
  });

  it('should emit importJSON on onImportJSON()', () => {
    spyOn(component.importJSON, 'emit');
    component.onImportJSON();
    expect(component.importJSON.emit).toHaveBeenCalled();
  });
});
