const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('[migrate] Connected to PostgreSQL');

    await client.query(`
      CREATE TABLE IF NOT EXISTS "_luxup_migrations" (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('[migrate] No migrations directory found, skipping');
      return;
    }

    const entries = fs
      .readdirSync(migrationsDir)
      .filter((e) => {
        const stat = fs.statSync(path.join(migrationsDir, e));
        return (
          stat.isDirectory() &&
          fs.existsSync(path.join(migrationsDir, e, 'migration.sql'))
        );
      })
      .sort();

    for (const migrationName of entries) {
      const result = await client.query(
        'SELECT name FROM "_luxup_migrations" WHERE name = $1',
        [migrationName],
      );

      if (result.rows.length > 0) {
        console.log(`[migrate] Already applied: ${migrationName}`);
        continue;
      }

      const sqlPath = path.join(migrationsDir, migrationName, 'migration.sql');
      const sql = fs.readFileSync(sqlPath, 'utf-8');

      console.log(`[migrate] Applying: ${migrationName}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO "_luxup_migrations" (name) VALUES ($1)',
          [migrationName],
        );
        await client.query('COMMIT');
        console.log(`[migrate] Applied: ${migrationName}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${migrationName} failed: ${err.message}`);
      }
    }

    console.log('[migrate] All migrations applied');
  } finally {
    await client.end();
  }
}

migrate().catch((err) => {
  console.error('[migrate] Migration failed:', err.message);
  process.exit(1);
});
