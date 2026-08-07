import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoConfig {
  title: string;
  description: string;
  path?: string;
}

const SITE = 'ngx-workflow';
const BASE_URL = 'https://ngx-workflow.vercel.app';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  apply(config: SeoConfig): void {
    const fullTitle = config.title.includes(SITE) ? config.title : `${config.title} · ${SITE}`;
    this.title.setTitle(fullTitle);

    this.meta.updateTag({ name: 'description', content: config.description });
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: SITE });
    if (config.path) {
      this.meta.updateTag({ property: 'og:url', content: `${BASE_URL}${config.path}` });
    }
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });
  }
}
