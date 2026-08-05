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

  it('should apply data-theme attribute and CSS class to document root', () => {
    service.setColorMode('dark');
    TestBed.flushEffects();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);

    service.setColorMode('light');
    TestBed.flushEffects();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.classList.contains('light-theme')).toBe(true);
  });
});
