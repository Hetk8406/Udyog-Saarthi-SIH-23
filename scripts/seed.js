const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

function getPythonPath() {
  const isWindows = process.platform === 'win32';
  const windowsPath = path.join(rootDir, 'backend', '.venv', 'Scripts', 'python.exe');
  const posixPath = path.join(rootDir, 'backend', '.venv', 'bin', 'python');

  if (isWindows && fs.existsSync(windowsPath)) return windowsPath;
  if (!isWindows && fs.existsSync(posixPath)) return posixPath;
  if (fs.existsSync(windowsPath)) return windowsPath;
  if (fs.existsSync(posixPath)) return posixPath;

  console.error('\n❌ Python virtual environment not found in backend/.venv');
  console.error('👉 Run "npm run setup" first.\n');
  process.exit(1);
}

const pythonBin = getPythonPath();
const managePy = path.join(rootDir, 'backend', 'manage.py');

const seedCommands = [
  'seed_demo_users',
  'seed_demo_jobs',
  'seed_demo_learning',
  'seed_demo_notifications',
  'seed_demo_support',
  'seed_demo_admin_data',
];

console.log('🌱 Seeding demo database for Udyog Saarthi in sequence...\n');

for (const cmd of seedCommands) {
  console.log(`▶ Executing: python manage.py ${cmd}`);
  const result = spawnSync(pythonBin, [managePy, cmd], {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`\n❌ Seeding failed at command: ${cmd}`);
    process.exit(result.status || 1);
  }
}

console.log('\n✅ All demo data successfully seeded!');
