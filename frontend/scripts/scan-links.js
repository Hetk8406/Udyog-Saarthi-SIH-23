const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

const srcDir = path.join(__dirname, '..', 'src');
const allFiles = getAllFiles(srcDir);

const internalLinks = new Set();
const externalLinks = [];
const linkUsages = [];

// Regex to capture href="..." or href={'...'} or href={`...`}
const hrefRegex = /href=(?:["']([^"']+)["']|\{[`'"]([^`'"]+)[`'"]\})/g;

// Also check for <a> tags with external links
const aTagRegex = /<a\s+[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>/gi;

allFiles.forEach((filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  let match;

  while ((match = hrefRegex.exec(content)) !== null) {
    const url = match[1] || match[2];
    if (!url) continue;

    if (url.startsWith('http://') || url.startsWith('https://')) {
      externalLinks.push({ file: filePath, url });
    } else if (url.startsWith('/')) {
      // Remove query string and hash
      const cleanUrl = url.split('?')[0].split('#')[0];
      internalLinks.add(cleanUrl);
      linkUsages.push({ file: filePath, raw: url, clean: cleanUrl });
    }
  }
});

console.log('--- FOUND INTERNAL PATHS ---');
console.log(Array.from(internalLinks).sort());

console.log('\n--- FOUND EXTERNAL LINKS ---');
console.log(externalLinks);
