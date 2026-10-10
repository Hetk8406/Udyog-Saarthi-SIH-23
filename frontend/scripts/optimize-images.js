const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. Hero Illustration SVG
const heroSvg = `<svg width="1200" height="675" viewBox="0 0 1200 675" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e3a8a" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
    <linearGradient id="cardGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#818cf8" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="675" rx="24" fill="url(#bgGrad)" />

  <!-- Grid subtle lines -->
  <g opacity="0.1" stroke="#ffffff" stroke-width="1">
    <line x1="100" y1="0" x2="100" y2="675" />
    <line x1="300" y1="0" x2="300" y2="675" />
    <line x1="500" y1="0" x2="500" y2="675" />
    <line x1="700" y1="0" x2="700" y2="675" />
    <line x1="900" y1="0" x2="900" y2="675" />
    <line x1="1100" y1="0" x2="1100" y2="675" />
    <line x1="0" y1="120" x2="1200" y2="120" />
    <line x1="0" y1="240" x2="1200" y2="240" />
    <line x1="0" y1="360" x2="1200" y2="360" />
    <line x1="0" y1="480" x2="1200" y2="480" />
    <line x1="0" y1="600" x2="1200" y2="600" />
  </g>

  <!-- Glow circles -->
  <circle cx="200" cy="180" r="140" fill="#2563eb" opacity="0.4" filter="blur(60px)" />
  <circle cx="1000" cy="480" r="160" fill="#38bdf8" opacity="0.3" filter="blur(60px)" />

  <!-- Central Dashboard / Pathway Graphic -->
  <!-- Left Card: Equal Opportunity Discovery -->
  <rect x="120" y="160" width="290" height="360" rx="16" fill="url(#cardGrad1)" stroke="#ffffff" stroke-opacity="0.25" stroke-width="1.5" />
  <rect x="150" y="195" width="48" height="48" rx="10" fill="#38bdf8" />
  <text x="174" y="227" fill="#0f172a" font-family="sans-serif" font-weight="900" font-size="22" text-anchor="middle">💼</text>
  <text x="150" y="275" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="20">Verified Jobs</text>
  <text x="150" y="305" fill="#93c5fd" font-family="sans-serif" font-size="14">Government &amp; PSUs</text>
  <text x="150" y="325" fill="#93c5fd" font-family="sans-serif" font-size="14">Disability Reservations</text>
  <rect x="150" y="360" width="230" height="40" rx="8" fill="#1e293b" />
  <text x="165" y="385" fill="#38bdf8" font-family="sans-serif" font-size="12" font-weight="bold">✓ 100% Verified Gazette Criteria</text>
  <rect x="150" y="420" width="160" height="32" rx="6" fill="#22c55e" fill-opacity="0.2" stroke="#22c55e" stroke-width="1" />
  <text x="165" y="441" fill="#86efac" font-family="sans-serif" font-size="12" font-weight="bold">Explainable Match: 95%</text>

  <!-- Center Card: Accessible Exam Center -->
  <rect x="455" y="120" width="290" height="420" rx="20" fill="#ffffff" fill-opacity="0.95" />
  <rect x="485" y="150" width="56" height="56" rx="12" fill="#1d4ed8" />
  <text x="513" y="186" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="26" text-anchor="middle">♿</text>
  <text x="485" y="235" fill="#0f172a" font-family="sans-serif" font-weight="bold" font-size="22">Exam Prep</text>
  <text x="485" y="260" fill="#64748b" font-family="sans-serif" font-size="14">Mock Tests &amp; Scribe Support</text>

  <!-- Progress Bar -->
  <rect x="485" y="295" width="230" height="12" rx="6" fill="#e2e8f0" />
  <rect x="485" y="295" width="180" height="12" rx="6" fill="url(#accentGrad)" />
  <text x="485" y="330" fill="#475569" font-family="sans-serif" font-size="12" font-weight="600">Screen Reader Ready • Extra Time</text>

  <rect x="485" y="360" width="230" height="70" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
  <text x="500" y="388" fill="#1e293b" font-family="sans-serif" font-size="13" font-weight="bold">Accommodations Configured</text>
  <text x="500" y="412" fill="#64748b" font-family="sans-serif" font-size="12">Magnification • High Contrast</text>

  <rect x="485" y="455" width="230" height="46" rx="8" fill="#1d4ed8" />
  <text x="600" y="484" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">Start Practice Mock Test</text>

  <!-- Right Card: Dedicated Job Coach -->
  <rect x="790" y="160" width="290" height="360" rx="16" fill="url(#cardGrad1)" stroke="#ffffff" stroke-opacity="0.25" stroke-width="1.5" />
  <rect x="820" y="195" width="48" height="48" rx="10" fill="#f59e0b" />
  <text x="844" y="227" fill="#0f172a" font-family="sans-serif" font-weight="900" font-size="22" text-anchor="middle">🤝</text>
  <text x="820" y="275" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="20">Job Coaching</text>
  <text x="820" y="305" fill="#93c5fd" font-family="sans-serif" font-size="14">Personal Mentorship</text>
  <text x="820" y="325" fill="#93c5fd" font-family="sans-serif" font-size="14">Interview Accommodations</text>
  <rect x="820" y="360" width="230" height="40" rx="8" fill="#1e293b" />
  <text x="835" y="385" fill="#fcd34d" font-family="sans-serif" font-size="12" font-weight="bold">★ Certified Disability Mentors</text>
  <rect x="820" y="420" width="180" height="32" rx="6" fill="#3b82f6" fill-opacity="0.2" stroke="#60a5fa" stroke-width="1" />
  <text x="835" y="441" fill="#bfdbfe" font-family="sans-serif" font-size="12" font-weight="bold">Consent &amp; Privacy First</text>

  <!-- Banner Bottom -->
  <rect x="360" y="580" width="480" height="48" rx="24" fill="#ffffff" fill-opacity="0.1" stroke="#ffffff" stroke-opacity="0.3" stroke-width="1" />
  <text x="600" y="610" fill="#e2e8f0" font-family="sans-serif" font-size="14" font-weight="600" text-anchor="middle">
    Designed for WCAG 2.1 AAA Accessibility &amp; DPDP Act 2023 Compliance
  </text>
</svg>`;

// 2. Mission Illustration SVG
const missionSvg = `<svg width="960" height="480" viewBox="0 0 960 480" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="missionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>
  </defs>

  <rect width="960" height="480" rx="16" fill="url(#missionGrad)" />

  <!-- Pillars grid -->
  <g transform="translate(60, 60)">
    <rect x="0" y="0" width="185" height="340" rx="12" fill="#ffffff" fill-opacity="0.06" stroke="#ffffff" stroke-opacity="0.15" />
    <circle cx="45" cy="45" r="24" fill="#2563eb" />
    <text x="45" y="53" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">1</text>
    <text x="25" y="110" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">Discovery</text>
    <text x="25" y="140" fill="#94a3b8" font-family="sans-serif" font-size="12">100% reservation transparency</text>
    <text x="25" y="160" fill="#94a3b8" font-family="sans-serif" font-size="12">PSU &amp; Govt Vacancies</text>

    <rect x="215" y="0" width="185" height="340" rx="12" fill="#ffffff" fill-opacity="0.06" stroke="#ffffff" stroke-opacity="0.15" />
    <circle cx="260" cy="45" r="24" fill="#0284c7" />
    <text x="260" y="53" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">2</text>
    <text x="240" y="110" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">Preparation</text>
    <text x="240" y="140" fill="#94a3b8" font-family="sans-serif" font-size="12">Assistive mock exams</text>
    <text x="240" y="160" fill="#94a3b8" font-family="sans-serif" font-size="12">Bilingual question bank</text>

    <rect x="430" y="0" width="185" height="340" rx="12" fill="#ffffff" fill-opacity="0.06" stroke="#ffffff" stroke-opacity="0.15" />
    <circle cx="475" cy="45" r="24" fill="#059669" />
    <text x="475" y="53" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">3</text>
    <text x="455" y="110" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">Coaching</text>
    <text x="455" y="140" fill="#94a3b8" font-family="sans-serif" font-size="12">Personal job coaches</text>
    <text x="455" y="160" fill="#94a3b8" font-family="sans-serif" font-size="12">Guardian consent controls</text>

    <rect x="645" y="0" width="185" height="340" rx="12" fill="#ffffff" fill-opacity="0.06" stroke="#ffffff" stroke-opacity="0.15" />
    <circle cx="690" cy="45" r="24" fill="#7c3aed" />
    <text x="690" y="53" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">4</text>
    <text x="670" y="110" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">AI Helper</text>
    <text x="670" y="140" fill="#94a3b8" font-family="sans-serif" font-size="12">Explainable suggestions</text>
    <text x="670" y="160" fill="#94a3b8" font-family="sans-serif" font-size="12">Plain language summaries</text>
  </g>
</svg>`;

async function main() {
  const imagesDir = path.join(__dirname, '..', 'public', 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const results = [];

  // 1. Process Hero Illustration
  const heroSvgBuffer = Buffer.from(heroSvg);
  const heroPngPath = path.join(imagesDir, 'hero-illustration.png');
  const heroWebpPath = path.join(imagesDir, 'hero-illustration.webp');
  const heroAvifPath = path.join(imagesDir, 'hero-illustration.avif');

  // Convert SVG to uncompressed PNG
  await sharp(heroSvgBuffer).png({ compressionLevel: 0 }).toFile(heroPngPath);
  const heroPngSize = fs.statSync(heroPngPath).size;

  // Convert PNG to WebP (quality 82)
  await sharp(heroPngPath).webp({ quality: 82, effort: 6 }).toFile(heroWebpPath);
  const heroWebpSize = fs.statSync(heroWebpPath).size;

  // Convert PNG to AVIF (quality 75)
  await sharp(heroPngPath).avif({ quality: 75, effort: 6 }).toFile(heroAvifPath);
  const heroAvifSize = fs.statSync(heroAvifPath).size;

  results.push({
    name: 'hero-illustration',
    originalFormat: 'PNG (uncompressed)',
    originalSize: heroPngSize,
    webpSize: heroWebpSize,
    avifSize: heroAvifSize,
    webpSavings: (((heroPngSize - heroWebpSize) / heroPngSize) * 100).toFixed(1) + '%',
    avifSavings: (((heroPngSize - heroAvifSize) / heroPngSize) * 100).toFixed(1) + '%',
  });

  // 2. Process Mission Illustration
  const missionSvgBuffer = Buffer.from(missionSvg);
  const missionPngPath = path.join(imagesDir, 'inclusion-mission.png');
  const missionWebpPath = path.join(imagesDir, 'inclusion-mission.webp');
  const missionAvifPath = path.join(imagesDir, 'inclusion-mission.avif');

  await sharp(missionSvgBuffer).png({ compressionLevel: 0 }).toFile(missionPngPath);
  const missionPngSize = fs.statSync(missionPngPath).size;

  await sharp(missionPngPath).webp({ quality: 82, effort: 6 }).toFile(missionWebpPath);
  const missionWebpSize = fs.statSync(missionWebpPath).size;

  await sharp(missionPngPath).avif({ quality: 75, effort: 6 }).toFile(missionAvifPath);
  const missionAvifSize = fs.statSync(missionAvifPath).size;

  results.push({
    name: 'inclusion-mission',
    originalFormat: 'PNG (uncompressed)',
    originalSize: missionPngSize,
    webpSize: missionWebpSize,
    avifSize: missionAvifSize,
    webpSavings: (((missionPngSize - missionWebpSize) / missionPngSize) * 100).toFixed(1) + '%',
    avifSavings: (((missionPngSize - missionAvifSize) / missionPngSize) * 100).toFixed(1) + '%',
  });

  console.log(JSON.stringify(results, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
