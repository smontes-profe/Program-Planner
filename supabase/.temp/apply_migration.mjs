import { readFileSync } from 'fs';
import { createRequire } from 'module';

// Dynamic import pg
const pg = await import('pg').catch(async () => {
  // If pg isn't available, try requiring it from node_modules
  console.error('pg module not found, please install it');
  process.exit(1);
});

const { Client } = pg.default || pg;

// Read .env.local manually
const envContent = readFileSync('.env.local', 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
if (!dbUrlMatch) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const sql = readFileSync('supabase/migrations/20260409000001_ra_coverage_and_ce_auto.sql', 'utf8');
console.log('Executing migration...');

const client = new Client({ connectionString: dbUrlMatch[1] });
try {
  await client.connect();
  await client.query(sql);
  console.log('✅ Migration applied successfully!');
} catch (e) {
  console.error('❌ Error:', e.message);
} finally {
  await client.end();
}
