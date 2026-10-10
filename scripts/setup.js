const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const venvDir = path.join(rootDir, 'backend', '.venv');
const isWindows = process.platform === 'win32';

console.log('🚀 Setting up Udyog Saarthi from scratch...\n');

function getSystemPython() {
  const candidates = isWindows ? ['python', 'py'] : ['python3', 'python'];
  for (const cmd of candidates) {
    const res = spawnSync(cmd, ['--version'], { stdio: 'pipe' });
    if (res.status === 0) return cmd;
  }
  return null;
}

// 1. Create venv if missing
if (!fs.existsSync(venvDir)) {
  console.log('📦 Creating Python virtual environment in backend/.venv...');
  const sysPython = getSystemPython();
  if (!sysPython) {
    console.error('❌ Python 3 was not found in system PATH. Please install Python 3.10+ and add it to PATH.');
    process.exit(1);
  }
  const createVenv = spawnSync(sysPython, ['-m', 'venv', venvDir], { stdio: 'inherit', cwd: rootDir });
  if (createVenv.status !== 0) {
    console.error('❌ Failed to create virtual environment.');
    process.exit(1);
  }
} else {
  console.log('✔ Python virtual environment verified in backend/.venv');
}

// 2. Locate venv python
const venvPython = isWindows
  ? path.join(venvDir, 'Scripts', 'python.exe')
  : path.join(venvDir, 'bin', 'python');

// 3. Install backend requirements
console.log('\n📦 Installing Python requirements from backend/requirements.txt...');
const reqFile = path.join(rootDir, 'backend', 'requirements.txt');
const pipInstall = spawnSync(venvPython, ['-m', 'pip', 'install', '-r', reqFile], {
  stdio: 'inherit',
  cwd: rootDir,
});
if (pipInstall.status !== 0) {
  console.error('❌ Failed to install Python dependencies.');
  process.exit(1);
}

// 4. Install root and frontend npm dependencies
console.log('\n📦 Installing root npm dependencies...');
const rootNpm = spawnSync(isWindows ? 'npm.cmd' : 'npm', ['install'], {
  stdio: 'inherit',
  cwd: rootDir,
});
if (rootNpm.status !== 0) {
  console.error('❌ Failed to install root npm packages.');
  process.exit(1);
}

console.log('\n📦 Installing frontend npm dependencies...');
const frontendNpm = spawnSync(isWindows ? 'npm.cmd' : 'npm', ['install'], {
  stdio: 'inherit',
  cwd: path.join(rootDir, 'frontend'),
});
if (frontendNpm.status !== 0) {
  console.error('❌ Failed to install frontend dependencies.');
  process.exit(1);
}

// 5. Run backend migrations
console.log('\n📦 Applying database migrations...');
const managePy = path.join(rootDir, 'backend', 'manage.py');
const migrate = spawnSync(venvPython, [managePy, 'migrate'], {
  stdio: 'inherit',
  cwd: rootDir,
});
if (migrate.status !== 0) {
  console.error('❌ Failed to run database migrations.');
  process.exit(1);
}

console.log('\n✨ Initial setup complete! Run "npm run seed" then "npm run dev".');
