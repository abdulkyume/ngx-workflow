/**
 * Angular static builds emit index.csr.html for Client-rendered routes.
 * Static hosts (Vercel) expect index.html at the site root.
 */
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const browserDir = join(root, 'dist/ngx-flow-web/browser');
const csr = join(browserDir, 'index.csr.html');
const index = join(browserDir, 'index.html');

if (!existsSync(csr)) {
  console.error('prepare-static-deploy: missing', csr);
  process.exit(1);
}

copyFileSync(csr, index);
console.log('prepare-static-deploy: wrote browser/index.html from index.csr.html');
