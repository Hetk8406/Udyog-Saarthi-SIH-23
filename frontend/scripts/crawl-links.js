/**
 * Internal Link Crawler for Udyog Saarthi
 * Scans the local Next.js server for all reachable internal links and verifies
 * that each returns HTTP 200 without broken links, 404s, or 500 errors.
 *
 * Run with: npm run test:links or node scripts/crawl-links.js
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const visited = new Set();
const queue = ['/'];
const brokenLinks = [];
const successfulLinks = [];

function fetchUrl(targetUrl) {
  return new Promise((resolve) => {
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;

    const req = client.get(
      targetUrl,
      {
        headers: {
          'User-Agent': 'UdyogSaarthi-LinkCrawler/1.0',
          Accept: 'text/html,application/xhtml+xml',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body,
          });
        });
      }
    );

    req.on('error', (err) => {
      resolve({
        status: 0,
        error: err.message,
        body: '',
      });
    });

    req.setTimeout(8000, () => {
      req.abort();
      resolve({
        status: 408,
        error: 'Request Timeout',
        body: '',
      });
    });
  });
}

function extractInternalLinks(html, currentPath) {
  const links = new Set();
  // Match href="..." and href='...'
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match;

  while ((match = hrefRegex.exec(html)) !== null) {
    const rawHref = match[1].trim();

    // Skip empty, javascript:, mailto:, tel:, anchor-only
    if (
      !rawHref ||
      rawHref.startsWith('#') ||
      rawHref.startsWith('javascript:') ||
      rawHref.startsWith('mailto:') ||
      rawHref.startsWith('tel:')
    ) {
      continue;
    }

    // Skip external links
    if (rawHref.startsWith('http://') || rawHref.startsWith('https://')) {
      if (rawHref.startsWith(BASE_URL)) {
        const pathPart = rawHref.slice(BASE_URL.length) || '/';
        const clean = pathPart.split('#')[0];
        links.add(clean);
      }
      continue;
    }

    // Must be internal link starting with /
    if (rawHref.startsWith('/')) {
      const clean = rawHref.split('#')[0];
      links.add(clean);
    }
  }

  return Array.from(links);
}

async function crawl() {
  console.log(`=======================================================`);
  console.log(`🕷️ Starting Udyog Saarthi Internal Link Crawler`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`=======================================================\n`);

  const startTime = Date.now();

  // Seed with important known primary routes to ensure comprehensive coverage
  const initialSeeds = [
    '/',
    '/jobs',
    '/learning',
    '/success-stories',
    '/about',
    '/privacy-policy',
    '/terms',
    '/login',
    '/register',
    '/reset-password',
    '/support',
    '/feedback',
    '/dashboard',
    '/dashboard/applications',
    '/dashboard/profile',
    '/dashboard/saved-jobs',
    '/dashboard/notifications',
    '/coach',
    '/admin-panel',
    '/demo-portal',
  ];

  initialSeeds.forEach((s) => {
    if (!queue.includes(s)) queue.push(s);
  });

  while (queue.length > 0) {
    const currentPath = queue.shift();
    if (visited.has(currentPath)) continue;
    visited.add(currentPath);

    const fullUrl = `${BASE_URL}${currentPath}`;
    process.stdout.write(`Checking: ${currentPath.padEnd(45)} `);

    const res = await fetchUrl(fullUrl);

    if (res.status >= 200 && res.status < 400) {
      console.log(`✓ [${res.status}] OK`);
      successfulLinks.push({ path: currentPath, status: res.status });

      // If HTML response, parse more links
      const contentType = res.headers ? res.headers['content-type'] : '';
      if (contentType && contentType.includes('text/html')) {
        const newLinks = extractInternalLinks(res.body, currentPath);
        for (const link of newLinks) {
          if (!visited.has(link) && !queue.includes(link)) {
            // Avoid crawling non-page static assets
            if (!link.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|map|json|txt|xml)$/i)) {
              queue.push(link);
            }
          }
        }
      }
    } else {
      console.log(`✗ [${res.status || 'ERR'}] FAILED`);
      brokenLinks.push({ path: currentPath, status: res.status, error: res.error });
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n=======================================================`);
  console.log(`🏁 Crawl Complete in ${duration}s`);
  console.log(`Total URLs Audited : ${visited.size}`);
  console.log(`Successful (200 OK) : ${successfulLinks.length}`);
  console.log(`Broken Links (404/500): ${brokenLinks.length}`);
  console.log(`=======================================================`);

  if (brokenLinks.length > 0) {
    console.error('\n❌ The following broken links were detected:');
    brokenLinks.forEach((b) => console.error(`  - ${b.path} (Status: ${b.status} ${b.error || ''})`));
    process.exit(1);
  } else {
    console.log('\n✅ All internal links resolved successfully! Zero broken routes found.\n');
    process.exit(0);
  }
}

crawl().catch((err) => {
  console.error('Fatal crawler error:', err);
  process.exit(1);
});
