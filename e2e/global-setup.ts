import path from 'path';
import { spawnSync } from 'child_process';

export default async function globalSetup() {
  console.log('\n[E2E Global Setup] Initializing test SQLite database...');
  const setupScript = path.resolve(__dirname, '../scripts/setup-e2e-db.js');
  const res = spawnSync(process.execPath, [setupScript], {
    stdio: 'inherit',
    env: {
      ...process.env,
      USE_SQLITE: 'True',
      SQLITE_DB_NAME: 'test_e2e.sqlite3',
    },
  });

  if (res.status !== 0) {
    throw new Error(`Failed to initialize E2E test database. Exit code: ${res.status}`);
  }
  console.log('[E2E Global Setup] Database initialization completed.\n');
}
