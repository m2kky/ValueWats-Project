const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { Client } = require('pg');

const SOURCE_DB = 'valuewats_agent_pre_migration_test';
const TARGET_DB = 'valuewats_agent_migration_test';
const REPRESENTATIVE_TABLES = [
  'tenants',
  'users',
  'AIAgent',
  'AgentAction',
  'AgentKnowledge',
  'conversations',
  'ConversationAgent'
];

function databaseName(connectionString) {
  return new URL(connectionString).pathname.replace(/^\//, '');
}

function assertSafeDatabases(sourceUrl, targetUrl) {
  if (databaseName(sourceUrl) !== SOURCE_DB) {
    throw new Error(`SOURCE_DATABASE_URL must target ${SOURCE_DB}`);
  }
  if (databaseName(targetUrl) !== TARGET_DB) {
    throw new Error(`TARGET_DATABASE_URL must target ${TARGET_DB}`);
  }
  if (sourceUrl === targetUrl) {
    throw new Error('SOURCE_DATABASE_URL and TARGET_DATABASE_URL must differ');
  }
}

function run(command, args, options = {}) {
  execFileSync(command, args, { stdio: 'inherit', ...options });
}

function runPrismaMigrateDeploy(targetUrl) {
  const prismaCli = path.join(__dirname, '..', 'node_modules', 'prisma', 'build', 'index.js');
  run(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: targetUrl }
  });
}

function containerConnectionString(connectionString) {
  const url = new URL(connectionString);
  url.hostname = 'localhost';
  url.port = '5432';
  url.search = '';
  return url.toString();
}

function postgresToolConnectionString(connectionString) {
  const url = new URL(connectionString);
  url.search = '';
  return url.toString();
}

function dumpBackup(sourceUrl, backupPath) {
  const container = process.env.POSTGRES_DOCKER_CONTAINER;
  if (!container) {
    run(process.env.PG_DUMP_BIN || 'pg_dump', ['--format=custom', '--file', backupPath, postgresToolConnectionString(sourceUrl)]);
    return;
  }

  const containerBackupPath = `/tmp/${path.basename(backupPath)}`;
  run('docker', ['exec', container, 'pg_dump', '--format=custom', '--file', containerBackupPath, containerConnectionString(sourceUrl)]);
  run('docker', ['cp', `${container}:${containerBackupPath}`, backupPath]);
}

function restoreBackup(targetUrl, backupPath) {
  const container = process.env.POSTGRES_DOCKER_CONTAINER;
  if (!container) {
    run(process.env.PG_RESTORE_BIN || 'pg_restore', ['--dbname', postgresToolConnectionString(targetUrl), '--clean', '--if-exists', backupPath]);
    return;
  }

  const containerBackupPath = `/tmp/${path.basename(backupPath)}`;
  run('docker', ['cp', backupPath, `${container}:${containerBackupPath}`]);
  run('docker', ['exec', container, 'pg_restore', '--dbname', containerConnectionString(targetUrl), '--clean', '--if-exists', containerBackupPath]);
}

function adminUrl(targetUrl) {
  const url = new URL(targetUrl);
  url.pathname = '/postgres';
  url.search = '';
  return url.toString();
}

async function recreateTargetDatabase(targetUrl) {
  const client = new Client({ connectionString: adminUrl(targetUrl) });
  await client.connect();
  try {
    await client.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = $1 AND pid <> pg_backend_pid()
    `, [TARGET_DB]);
    await client.query(`DROP DATABASE IF EXISTS "${TARGET_DB}"`);
    await client.query(`CREATE DATABASE "${TARGET_DB}"`);
  } finally {
    await client.end();
  }
}

async function tableExists(client, tableName) {
  const result = await client.query(`
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = $1
  `, [tableName]);
  return result.rowCount > 0;
}

async function rowCounts(connectionString) {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const counts = {};
    for (const table of REPRESENTATIVE_TABLES) {
      if (await tableExists(client, table)) {
        const result = await client.query(`SELECT COUNT(*)::int AS count FROM "${table}"`);
        counts[table] = result.rows[0].count;
      }
    }
    return counts;
  } finally {
    await client.end();
  }
}

function assertCountsEqual(label, expected, actual) {
  for (const [table, count] of Object.entries(expected)) {
    if (actual[table] !== count) {
      throw new Error(`${label}: ${table} row count changed from ${count} to ${actual[table]}`);
    }
  }
}

async function main() {
  const sourceUrl = process.env.SOURCE_DATABASE_URL;
  const targetUrl = process.env.TARGET_DATABASE_URL;
  if (!sourceUrl || !targetUrl) {
    throw new Error('SOURCE_DATABASE_URL and TARGET_DATABASE_URL are required');
  }
  assertSafeDatabases(sourceUrl, targetUrl);

  const backupPath = path.join(os.tmpdir(), `valuewats-agent-migration-${Date.now()}.dump`);
  const sourceCounts = await rowCounts(sourceUrl);

  try {
    dumpBackup(sourceUrl, backupPath);

    await recreateTargetDatabase(targetUrl);
    restoreBackup(targetUrl, backupPath);
    const restoredCounts = await rowCounts(targetUrl);
    assertCountsEqual('initial restore', sourceCounts, restoredCounts);

    runPrismaMigrateDeploy(targetUrl);
    const migratedCounts = await rowCounts(targetUrl);
    assertCountsEqual('post-migration', sourceCounts, migratedCounts);

    await recreateTargetDatabase(targetUrl);
    restoreBackup(targetUrl, backupPath);
    const restoredAgainCounts = await rowCounts(targetUrl);
    assertCountsEqual('backup restore validation', sourceCounts, restoredAgainCounts);

    console.log(JSON.stringify({
      source: SOURCE_DB,
      target: TARGET_DB,
      counts: sourceCounts,
      status: 'ok'
    }, null, 2));
  } finally {
    if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = {
  SOURCE_DB,
  TARGET_DB,
  assertSafeDatabases,
  rowCounts
};
