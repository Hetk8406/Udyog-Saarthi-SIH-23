const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

function getPythonPath() {
  const isWindows = process.platform === 'win32';
  const windowsPath = path.join(rootDir, 'backend', '.venv', 'Scripts', 'python.exe');
  const posixPath = path.join(rootDir, 'backend', '.venv', 'bin', 'python');

  if (isWindows && fs.existsSync(windowsPath)) {
    return windowsPath;
  }
  if (!isWindows && fs.existsSync(posixPath)) {
    return posixPath;
  }
  if (fs.existsSync(windowsPath)) return windowsPath;
  if (fs.existsSync(posixPath)) return posixPath;

  console.error('\n❌ Python virtual environment not found in backend/.venv');
  console.error('👉 Run "npm run setup" to create and configure it.\n');
  process.exit(1);
}

const pythonBin = getPythonPath();
const env = {
  ...process.env,
  USE_SQLITE: 'True',
  SQLITE_DB_NAME: 'test_e2e.sqlite3',
};

console.log('🔄 Setting up isolated E2E SQLite database (test_e2e.sqlite3)...');

const managePy = path.join(rootDir, 'backend', 'manage.py');

// 1. Run migrations
console.log('📦 Applying database migrations...');
const migrateRes = spawnSync(pythonBin, [managePy, 'migrate', '--no-input'], {
  cwd: rootDir,
  stdio: 'inherit',
  env,
});

if (migrateRes.status !== 0) {
  console.error('❌ Failed to run migrations for test_e2e.sqlite3');
  process.exit(migrateRes.status || 1);
}

// 2. Run seed_e2e_data --reset
console.log('🌱 Seeding deterministic test data (--reset)...');
const seedRes = spawnSync(pythonBin, [managePy, 'seed_e2e_data', '--reset'], {
  cwd: rootDir,
  stdio: 'inherit',
  env,
});

if (seedRes.status !== 0) {
  console.error('❌ Failed to seed E2E data into test_e2e.sqlite3');
  process.exit(seedRes.status || 1);
}

console.log('✅ Isolated E2E database is ready!\n');
