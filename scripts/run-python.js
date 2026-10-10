const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

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
  console.error('👉 Run "npm run setup" to automatically create and configure it.\n');
  process.exit(1);
}

const pythonBin = getPythonPath();
const args = process.argv.slice(2);

const child = spawn(pythonBin, args, {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});

child.on('error', (err) => {
  console.error('Failed to spawn Python process:', err);
  process.exit(1);
});
