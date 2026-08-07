import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoConfig {
  title: string;
  description: string;
  path?: string;
  keywords?: string;
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article';
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noIndex?: boolean;
}

export const SITE_NAME = 'ngx-workflow';
/** Canonical origin — no trailing slash */
export const SITE_URL = 'https://ngx-workflow.vercel.app';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/icon-512.png`;
export const DEFAULT_OG_IMAGE_ALT = 'ngx-workflow — Angular Signals flowchart engine';

const JSON_LD_ID = 'ngx-seo-jsonld';
const CANONICAL_ID = 'ngx-seo-canonical';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  apply(config: SeoConfig): void {
    const fullTitle = config.title.includes(SITE_NAME)
      ? config.title
      : `${config.title} · ${SITE_NAME}`;
    const url = this.absoluteUrl(config.path);
    const image = this.absoluteAsset(config.image) || DEFAULT_OG_IMAGE;
    const imageAlt = config.imageAlt || DEFAULT_OG_IMAGE_ALT;
    const ogType = config.type ?? 'website';
    const robots = config.noIndex
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

    this.title.setTitle(fullTitle);

    this.meta.updateTag({ name: 'description', content: config.description });
    this.meta.updateTag({ name: 'robots', content: robots });
    this.meta.updateTag({ name: 'googlebot', content: robots });
    this.meta.updateTag({
      name: 'keywords',
      content:
        config.keywords ||
        'ngx-workflow, Angular flowchart, Angular node editor, Angular Signals, ELK layout, workflow diagram',
    });
    this.meta.updateTag({ name: 'author', content: 'Abdul Kyume' });
    this.meta.updateTag({ name: 'application-name', content: SITE_NAME });

    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    this.meta.updateTag({ property: 'og:type', content: ogType });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:image:secure_url', content: image });
    this.meta.updateTag({ property: 'og:image:alt', content: imageAlt });
    this.meta.updateTag({ property: 'og:image:type', content: 'image/png' });
    this.meta.updateTag({ property: 'og:image:width', content: '512' });
    this.meta.updateTag({ property: 'og:image:height', content: '512' });
    this.meta.updateTag({ property: 'og:locale', content: 'en_US' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
    this.meta.updateTag({ name: 'twitter:image:alt', content: imageAlt });

    this.setCanonical(url);
    this.setJsonLd(config.jsonLd);
  }

  /** Absolute page URL without trailing slash (except we never emit bare trailing slash). */
  absoluteUrl(path?: string): string {
    const p = this.normalizePath(path);
    return p === '/' ? SITE_URL : `${SITE_URL}${p}`;
  }

  private absoluteAsset(image?: string): string | null {
    if (!image) return null;
    if (image.startsWith('http://') || image.startsWith('https://')) return image;
    return `${SITE_URL}${image.startsWith('/') ? image : `/${image}`}`;
  }

  private normalizePath(path?: string): string {
    if (!path || path === '') return '/';
    const withSlash = path.startsWith('/') ? path : `/${path}`;
    if (withSlash.length > 1 && withSlash.endsWith('/')) {
      return withSlash.slice(0, -1);
    }
    return withSlash;
  }

  private setCanonical(url: string): void {
    const head = this.document.head;
    if (!head) return;

    let link =
      (this.document.getElementById(CANONICAL_ID) as HTMLLinkElement | null) ??
      (head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null);

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }

    link.id = CANONICAL_ID;
    link.setAttribute('href', url);
  }

  private setJsonLd(data?: Record<string, unknown> | Record<string, unknown>[]): void {
    const head = this.document.head;
    if (!head) return;

    const existing = this.document.getElementById(JSON_LD_ID);
    if (!data) {
      existing?.remove();
      return;
    }

    const items = (Array.isArray(data) ? data : [data]).map((item) => {
      // Drop per-item @context when wrapping in @graph
      const { ['@context']: _ctx, ...rest } = item;
      return rest;
    });

    const payload =
      items.length === 1
        ? { '@context': 'https://schema.org', ...items[0] }
        : { '@context': 'https://schema.org', '@graph': items };

    const script =
      (existing as HTMLScriptElement | null) ?? this.document.createElement('script');
    script.id = JSON_LD_ID;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(payload);
    if (!existing) {
      head.appendChild(script);
    }
  }
}
