import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ExportService } from './export.service';

describe('ExportService Unit Tests', () => {
  let service: ExportService;
  let dummySvg: SVGSVGElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ExportService
      ]
    });
    service = TestBed.inject(ExportService);

    dummySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    dummySvg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'rect'));
    spyOn(dummySvg, 'getBBox').and.returnValue({ x: 0, y: 0, width: 100, height: 100, top: 0, left: 0, bottom: 100, right: 100, toJSON: () => {} } as DOMRect);
  });

  it('should export diagram as SVG file', () => {
    const clickSpy = spyOn(HTMLAnchorElement.prototype, 'click');
    service.exportToSVG(dummySvg, 'custom-test.svg');
    expect(clickSpy).toHaveBeenCalled();
  });

  it('should handle errors gracefully during SVG export when invalid element is passed', () => {
    expect(() => service.exportToSVG(null as any)).toThrow();
  });

  it('should handle copyToClipboard gracefully when clipboard API is missing', async () => {
    try {
      spyOnProperty(navigator, 'clipboard', 'get').and.returnValue(undefined as any);
    } catch {
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true, writable: true });
    }

    await expectAsync(service.copyToClipboard(dummySvg)).toBeRejectedWithError('Clipboard API not supported in this browser');
  });
});
