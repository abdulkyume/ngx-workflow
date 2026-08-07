import { SeoConfig, SITE_NAME, SITE_URL } from '../services/seo.service';

export const DEFAULT_KEYWORDS = [
  'ngx-workflow',
  'Angular flowchart',
  'Angular node editor',
  'Angular Signals diagram',
  'Angular workflow canvas',
  'ELK layout Angular',
  'node-based editor',
  'react-flow Angular alternative',
  'xyflow Angular',
  'SVG workflow diagram',
  'Angular 22 flowchart',
].join(', ');

const ORG = {
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/icon-512.png`,
    width: 512,
    height: 512,
  },
  sameAs: [
    'https://github.com/abdulkyume/ngx-workflow',
    'https://www.npmjs.com/package/ngx-workflow',
  ],
};

export function softwareApplicationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    alternateName: ['ngx-workflow Angular', 'Angular Signals flowchart'],
    applicationCategory: 'DeveloperApplication',
    applicationSubCategory: 'Diagram / flowchart library',
    operatingSystem: 'Web',
    softwareVersion: '0.5.2',
    description:
      'High-performance Angular Signals flowchart and node-based workflow editor with ELK layout, smart edges, RGBA styling, and studio chrome for Angular 17.1–22.',
    url: SITE_URL,
    downloadUrl: 'https://www.npmjs.com/package/ngx-workflow',
    installUrl: 'https://www.npmjs.com/package/ngx-workflow',
    codeRepository: 'https://github.com/abdulkyume/ngx-workflow',
    license: 'https://opensource.org/licenses/MIT',
    programmingLanguage: ['TypeScript', 'Angular'],
    featureList: [
      'Angular Signals reactivity',
      'ELK auto-layout',
      'Smart edge routing',
      'RGBA node and edge colors',
      'Edge flow and dot animation',
      'Minimap, undo/redo, export',
      'Properties sidebar',
      'Custom nodes and handles',
    ],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    author: {
      '@type': 'Person',
      name: 'Abdul Kyume',
      url: 'https://github.com/abdulkyume',
    },
    publisher: ORG,
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description:
      'Official documentation, examples, and sandbox for ngx-workflow — an Angular Signals flowchart and node editor library.',
    inLanguage: 'en',
    publisher: ORG,
  };
}

export function softwareSourceCodeJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: SITE_NAME,
    description:
      'Open-source Angular library for interactive node-based editors and workflow diagrams.',
    codeRepository: 'https://github.com/abdulkyume/ngx-workflow',
    url: 'https://github.com/abdulkyume/ngx-workflow',
    programmingLanguage: {
      '@type': 'ComputerLanguage',
      name: 'TypeScript',
    },
    runtimePlatform: 'Angular',
    license: 'https://opensource.org/licenses/MIT',
    author: {
      '@type': 'Person',
      name: 'Abdul Kyume',
      url: 'https://github.com/abdulkyume',
    },
  };
}

export function faqJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is ngx-workflow?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ngx-workflow is an Angular Signals library for building interactive flowchart and node-based workflow editors with ELK layout, smart edges, minimap, and studio chrome.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which Angular versions does ngx-workflow support?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ngx-workflow supports Angular 17.1 through Angular 22 via peer dependencies on @angular/core, @angular/common, and @angular/forms.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I install ngx-workflow?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Install with npm install ngx-workflow, import NgxWorkflowModule or the standalone diagram component, and bind nodes and edges signals.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is ngx-workflow a React Flow alternative for Angular?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. It targets Angular-native Signals workflows similar to React Flow / xyflow, including custom nodes, animated edges, markers, and controlled graph state.',
        },
      },
    ],
  };
}

export function techArticleJsonLd(opts: {
  title: string;
  description: string;
  path: string;
}): Record<string, unknown> {
  const url = opts.path === '/' ? SITE_URL : `${SITE_URL}${opts.path}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: opts.title,
    description: opts.description,
    url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    inLanguage: 'en',
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
    author: ORG,
    publisher: ORG,
  };
}

export function breadcrumbJsonLd(
  crumbs: Array<{ name: string; path: string }>
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.path === '/' ? SITE_URL : `${SITE_URL}${c.path}`,
    })),
  };
}

export function homeSeoConfig(): SeoConfig {
  return {
    title: 'ngx-workflow — Angular Signals flowchart engine',
    description:
      'High-performance Angular node-based editor with Signals, ELK layout, smart edges, RGBA styling, and studio chrome. Build flowchart and workflow canvases for Angular 17–22.',
    path: '/',
    keywords: DEFAULT_KEYWORDS,
    jsonLd: [
      websiteJsonLd(),
      softwareApplicationJsonLd(),
      softwareSourceCodeJsonLd(),
      faqJsonLd(),
    ],
  };
}

const DOC_SEO: Record<string, Omit<SeoConfig, 'path'>> = {
  '/docs/intro': {
    title: 'Getting started',
    description:
      'Install ngx-workflow and render your first Angular Signals flowchart in a few steps.',
    keywords: `${DEFAULT_KEYWORDS}, getting started, npm install ngx-workflow`,
    type: 'article',
  },
  '/docs/concepts': {
    title: 'Core concepts',
    description:
      'Learn nodes, edges, viewport, handles, and controlled vs uncontrolled state in ngx-workflow.',
    keywords: `${DEFAULT_KEYWORDS}, nodes, edges, viewport, handles, controlled state`,
    type: 'article',
  },
  '/docs/api': {
    title: 'API reference',
    description:
      'API overview for ngx-workflow-diagram inputs, outputs, Node/Edge models, and connection limits.',
    keywords: `${DEFAULT_KEYWORDS}, API reference, Angular diagram API, Node Edge interface`,
    type: 'article',
  },
  '/docs/customization': {
    title: 'Customization',
    description:
      'Custom nodes, RGBA colors, edge animation and markers, themes, and SVG defs in ngx-workflow.',
    keywords: `${DEFAULT_KEYWORDS}, custom nodes, RGBA, edge animation, markers, theming`,
    type: 'article',
  },
  '/docs/inputs': {
    title: 'Inputs API',
    description:
      'Complete list of ngx-workflow-diagram @Input() properties with types, defaults, and examples.',
    keywords: `${DEFAULT_KEYWORDS}, Angular @Input, diagram inputs`,
    type: 'article',
  },
  '/docs/outputs': {
    title: 'Outputs API',
    description:
      'Complete list of ngx-workflow-diagram @Output() events for nodes, edges, connect, and canvas.',
    keywords: `${DEFAULT_KEYWORDS}, Angular @Output, diagram events`,
    type: 'article',
  },
};

/** Resolve SEO for top-level / known doc routes. Detail pages set their own. */
export function resolveRouteSeo(url: string): SeoConfig | null {
  const path = url.split('?')[0].split('#')[0];
  if (path === '/' || path === '') return null;

  if (path.startsWith('/docs/inputs/') && path !== '/docs/inputs/') {
    return null; // detail component owns SEO
  }
  if (path.startsWith('/docs/outputs/') && path !== '/docs/outputs/') {
    return null;
  }

  const doc = DOC_SEO[path];
  if (doc) {
    const crumbs = [
      { name: 'Home', path: '/' },
      { name: 'Docs', path: '/docs/intro' },
      { name: doc.title, path },
    ];
    return {
      ...doc,
      path,
      jsonLd: [
        techArticleJsonLd({
          title: doc.title,
          description: doc.description,
          path,
        }),
        breadcrumbJsonLd(crumbs),
      ],
    };
  }

  if (path.startsWith('/docs')) {
    return {
      title: 'Documentation',
      description:
        'Guides, API reference, and customization docs for the ngx-workflow Angular flowchart library.',
      path,
      keywords: DEFAULT_KEYWORDS,
      type: 'article',
      jsonLd: [
        techArticleJsonLd({
          title: 'Documentation',
          description:
            'Guides, API reference, and customization docs for the ngx-workflow Angular flowchart library.',
          path,
        }),
        breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Docs', path },
        ]),
      ],
    };
  }

  if (path.startsWith('/examples')) {
    return {
      title: 'Examples',
      description:
        'Interactive ngx-workflow scenarios: pipelines, ELK layout, path routing, and high-density graphs.',
      path,
      keywords: `${DEFAULT_KEYWORDS}, examples, ELK layout demo, Angular flowchart examples`,
      jsonLd: [
        techArticleJsonLd({
          title: 'Examples',
          description:
            'Interactive ngx-workflow scenarios: pipelines, ELK layout, path routing, and high-density graphs.',
          path,
        }),
        breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Examples', path: '/examples' },
        ]),
      ],
    };
  }

  if (path.startsWith('/sandbox')) {
    return {
      title: 'Sandbox Studio',
      description:
        'Live playground to explore ngx-workflow inputs, outputs, RGBA styling, edge animation, and canvas behavior in the browser.',
      path,
      keywords: `${DEFAULT_KEYWORDS}, sandbox, playground, Angular diagram studio`,
      jsonLd: breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Sandbox Studio', path: '/sandbox' },
      ]),
    };
  }

  return null;
}
