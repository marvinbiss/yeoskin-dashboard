import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Get migration file from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: node scripts/run-migration.js <migration-file>');
  console.error('Example: node scripts/run-migration.js migrations/006_routines_upsells.sql');
  process.exit(1);
}

// Parse Supabase URL to get connection details
const supabaseUrl = process.env.VITE_SUPABASE_URL;
if (!supabaseUrl) {
  console.error('Error: VITE_SUPABASE_URL not found in .env');
  process.exit(1);
}

// Extract project ref from Supabase URL
const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!match) {
  console.error('Error: Invalid Supabase URL format');
  process.exit(1);
}

const projectRef = match[1];

// You need to set DATABASE_URL in .env for direct database access
// Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('');
  console.error('Error: DATABASE_URL not found in .env');
  console.error('');
  console.error('Add this to your .env file:');
  console.error(`DATABASE_URL=postgresql://postgres.${projectRef}:[YOUR-DB-PASSWORD]@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`);
  console.error('');
  console.error('Or run the migration manually via Supabase Dashboard > SQL Editor');
  process.exit(1);
}

async function runMigration() {
  const client = new pg.Client({ connectionString: databaseUrl });

  try {
    console.log(`Connecting to database...`);
    await client.connect();
    console.log('Connected!\n');

    const migrationPath = join(__dirname, '..', migrationFile);
    console.log(`Reading migration: ${migrationFile}`);
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log(`Executing migration...`);
    console.log('─'.repeat(60));

    await client.query(sql);

    console.log('─'.repeat(60));
    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    if (error.detail) console.error('Detail:', error.detail);
    if (error.hint) console.error('Hint:', error.hint);
    if (error.where) console.error('Where:', error.where);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
