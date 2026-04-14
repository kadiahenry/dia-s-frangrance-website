const fs = require('fs/promises');
const http = require('http');
const https = require('https');
const path = require('path');

const { buildProductSlug } = require('../../backend/utils/product-slug');

const siteUrl = String(process.env.SITEMAP_SITE_URL || process.env.SITE_URL || 'https://diasfragrance.com')
  .trim()
  .replace(/\/+$/, '');
const productApiUrl = String(process.env.SITEMAP_PRODUCTS_API_URL || '').trim();
const outputPath = path.join(__dirname, '..', 'src', 'sitemap.xml');

const staticPaths = [
  '/',
  '/products',
  '/about',
  '/contact',
  '/shipping',
  '/returns',
  '/privacy',
  '/accessibility',
  '/faq',
  '/cookie-policy'
];

function fetchJson(url) {
  const client = url.startsWith('https://') ? https : http;

  return new Promise((resolve, reject) => {
    client.get(url, response => {
      if ((response.statusCode || 500) >= 400) {
        reject(new Error(`Request failed with status ${response.statusCode}`));
        response.resume();
        return;
      }

      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => {
        body += chunk;
      });
      response.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

async function loadProducts() {
  if (productApiUrl) {
    try {
      const products = await fetchJson(productApiUrl);

      if (Array.isArray(products) && products.length) {
        return products;
      }
    } catch (error) {
      console.warn(`[sitemap] Falling back to local product seed data: ${error.message}`);
    }
  }

  return require('../../backend/data/seed-products');
}

function toProductPath(product) {
  return `/product/${product.slug || buildProductSlug(product.name, product.type || '')}`;
}

function toUrlEntry(url) {
  return `  <url>\n    <loc>${url}</loc>\n  </url>`;
}

async function main() {
  const products = await loadProducts();
  const productPaths = products
    .filter(product => product && product.name)
    .map(toProductPath);
  const allPaths = [...new Set([...staticPaths, ...productPaths])];
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...allPaths.map(routePath => toUrlEntry(`${siteUrl}${routePath}`)),
    '</urlset>',
    ''
  ].join('\n');

  await fs.writeFile(outputPath, xml, 'utf8');
  console.log(`[sitemap] Wrote ${allPaths.length} URLs to ${outputPath}`);
}

main().catch(error => {
  console.error('[sitemap] Failed to generate sitemap:', error.message);
  process.exitCode = 1;
});
