import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ThemeService, ColorMode } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ThemeService
      ]
    });
    service = TestBed.inject(ThemeService);
  });

  it('should create and default to light mode', () => {
    expect(service.colorMode()).toBe('light');
    expect(service.effectiveTheme()).toBe('light');
  });

  it('should update theme colorMode via setColorMode', () => {
    service.setColorMode('dark');
    expect(service.colorMode()).toBe('dark');
    expect(service.effectiveTheme()).toBe('dark');

    service.setColorMode('system');
    expect(service.colorMode()).toBe('system');
    expect(['light', 'dark']).toContain(service.effectiveTheme());
  });

  it('should apply data-theme to registered hosts only, not document root', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const htmlThemeBefore = document.documentElement.getAttribute('data-theme');

    service.registerHost(host);
    service.setColorMode('dark');
    TestBed.flushEffects();

    expect(host.getAttribute('data-theme')).toBe('dark');
    expect(host.classList.contains('dark-theme')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe(htmlThemeBefore);

    service.setColorMode('light');
    TestBed.flushEffects();

    expect(host.getAttribute('data-theme')).toBe('light');
    expect(host.classList.contains('light-theme')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe(htmlThemeBefore);

    service.unregisterHost(host);
    expect(host.getAttribute('data-theme')).toBeNull();
    host.remove();
  });
});
