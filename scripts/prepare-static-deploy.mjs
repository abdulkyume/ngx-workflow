/**
 * Angular static builds may emit both:
 * - index.html — prerendered homepage (preferred for SEO / Google)
 * - index.csr.html — client-rendered shell
 *
 * Static hosts (Vercel) need index.html at the site root.
 * Prefer the prerendered file; only fall back to CSR when missing.
 */
import { copyFileSync, existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const browserDir = join(root, 'dist/ngx-flow-web/browser');
const csr = join(browserDir, 'index.csr.html');
const index = join(browserDir, 'index.html');

function hasPrerenderedBody(htmlPath) {
  if (!existsSync(htmlPath)) return false;
  const html = readFileSync(htmlPath, 'utf8');
  // Prerendered home includes hero copy; CSR shell is mostly empty <app-root>
  return (
    html.includes('ngx-workflow') &&
    (html.includes('hero-title') ||
      html.includes('Node editors for Angular') ||
      html.includes('Getting started') ||
      // Substantial hydrated markup inside app-root
      /<app-root[^>]*>[\s\S]{400,}<\/app-root>/i.test(html))
  );
}

if (hasPrerenderedBody(index)) {
  const bytes = statSync(index).size;
  console.log(
    `prepare-static-deploy: keeping prerendered browser/index.html (${bytes} bytes) for SEO`
  );
  process.exit(0);
}

if (!existsSync(csr)) {
  console.error('prepare-static-deploy: missing both prerendered index.html and index.csr.html');
  process.exit(1);
}

copyFileSync(csr, index);
console.log(
  'prepare-static-deploy: wrote browser/index.html from index.csr.html (no prerendered home found)'
);
