#!/usr/bin/env node

/**
 * Supabase Migration Runner
 * 
 * Usage:
 *   node scripts/run-migrations.js
 * 
 * This script applies all migrations to your Supabase project
 * in the correct order (001 → 007)
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ngohyujweyxmrbbusufa.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error(
    '❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set.'
  );
  console.error('Please set it before running migrations:');
  console.error('export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration(migrationFile) {
  console.log(`\n📄 Running: ${migrationFile}`);

  const migrationPath = path.join(__dirname, '../supabase/migrations', migrationFile);
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  try {
    const { error } = await supabase.rpc('exec', { sql });

    if (error) {
      // Handle the specific error - the exec function might not exist yet
      // Try alternative approach
      console.log(`   Using alternative approach...`);
      
      // Split by statement and execute individually
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          const result = await supabase.rpc('exec', { sql: statement + ';' });
          if (result.error) {
            // If exec doesn't exist, just report it
            console.warn(`   ⚠️  Note: Direct SQL execution requires using Dashboard`);
            return false;
          }
        }
      }
    }

    console.log(`✅ Completed: ${migrationFile}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${migrationFile}`);
    console.error(error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Supabase Migration Runner\n');
  console.log(`Supabase Project: ${SUPABASE_URL}\n`);

  const migrations = [
    '001_create_users_and_preferences.sql',
    '002_create_profiles_and_photos.sql',
    '003_create_social_interactions.sql',
    '004_create_messaging.sql',
    '005_create_notifications.sql',
    '006_create_payments_and_subscriptions.sql',
    '007_create_verification_and_moderation.sql',
  ];

  let completed = 0;
  let failed = 0;

  for (const migration of migrations) {
    const result = await runMigration(migration);
    if (result) {
      completed++;
    } else {
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Completed: ${completed}/${migrations.length}`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}/${migrations.length}`);
  }
  console.log('='.repeat(60));

  if (failed > 0) {
    console.log('\n⚠️  Some migrations failed. Please check the errors above.');
    console.log('\nAlternative: Use Supabase Dashboard to apply migrations manually:');
    console.log('1. Go to SQL Editor');
    console.log('2. Copy-paste each migration file in order');
    console.log('3. Click "Run"');
    process.exit(1);
  }

  console.log('\n✨ All migrations applied successfully!');
  console.log('\nNext steps:');
  console.log('1. Navigate to Supabase Dashboard');
  console.log('2. Verify tables were created in Database section');
  console.log('3. Update your app configuration');
  console.log('4. Run: npm start');
}

main().catch(console.error);
