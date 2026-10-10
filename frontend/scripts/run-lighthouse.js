const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const routes = [
  { name: 'Home', url: 'http://localhost:3000/' },
  { name: 'Jobs List', url: 'http://localhost:3000/jobs' },
  { name: 'Job Details', url: 'http://localhost:3000/jobs/0857725c-354a-46ae-938b-f364de31ca31' },
  { name: 'Login', url: 'http://localhost:3000/login' },
  { name: 'Dashboard', url: 'http://localhost:3000/dashboard' },
];

const tempDir = path.join(__dirname, '..', 'lh-results');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Ensure CHROME_PATH is set
process.env.CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const results = [];

for (const r of routes) {
  const safeName = r.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const reportPath = path.join(tempDir, `${safeName}.json`);

  console.log(`Auditing ${r.name} (${r.url})...`);
  try {
    const cmd = `npx lighthouse "${r.url}" --chrome-flags="--headless --no-sandbox --disable-gpu" --output=json --output-path="${reportPath}" --quiet --only-categories=performance,accessibility,best-practices,seo`;
    execSync(cmd, { stdio: 'inherit', env: process.env });

    const raw = fs.readFileSync(reportPath, 'utf8');
    const report = JSON.parse(raw);

    const categories = report.categories || {};
    const perf = Math.round((categories.performance?.score || 0) * 100);
    const a11y = Math.round((categories.accessibility?.score || 0) * 100);
    const bp = Math.round((categories['best-practices']?.score || 0) * 100);
    const seo = Math.round((categories.seo?.score || 0) * 100);

    // Collect failing audits
    const failures = [];
    for (const key in report.audits) {
      const audit = report.audits[key];
      if (audit.score !== null && audit.score < 0.9 && audit.scoreDisplayMode !== 'notApplicable' && audit.scoreDisplayMode !== 'informative') {
        failures.push({
          id: audit.id,
          title: audit.title,
          score: audit.score,
          description: audit.description,
        });
      }
    }

    results.push({
      page: r.name,
      url: r.url,
      scores: {
        performance: perf,
        accessibility: a11y,
        bestPractices: bp,
        seo: seo,
      },
      failures,
    });
  } catch (err) {
    console.error(`Error auditing ${r.name}:`, err.message);
    results.push({
      page: r.name,
      url: r.url,
      error: err.message,
    });
  }
}

const outputPath = path.join(tempDir, 'summary.json');
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`Audit complete. Summary written to ${outputPath}`);
