const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const backendEnv = path.join(rootDir, 'backend', '.env');
const frontendEnv = path.join(rootDir, 'frontend', '.env.local');

let hasError = false;

if (!fs.existsSync(backendEnv)) {
  console.error('\n❌ Missing backend/.env');
  console.error('👉 Please copy "backend/.env.example" to "backend/.env" and set your variables.\n');
  hasError = true;
}

if (!fs.existsSync(frontendEnv)) {
  console.error('\n❌ Missing frontend/.env.local');
  console.error('👉 Please copy "frontend/.env.example" to "frontend/.env.local" and set your variables.\n');
  hasError = true;
}

if (hasError) {
  process.exit(1);
}

process.exit(0);
