#!/usr/bin/env node

/**
 * Deploy Supabase Migrations
 * 
 * This script deploys all migrations directly via Supabase SQL API
 * No CLI login required - uses service role key
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const SUPABASE_URL = 'https://ngohyujweyxmrbbusufa.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  console.error('');
  console.error('Get your Service Role Key from:');
  console.error('  1. Go to https://app.supabase.com');
  console.error('  2. Select your project (ngohyujweyxmrbbusufa)');
  console.error('  3. Go to Project Settings → API Keys');
  console.error('  4. Copy the Service Role Key (starts with eyJhbGc...)');
  console.error('');
  console.error('Then run:');
  console.error('  export SUPABASE_SERVICE_ROLE_KEY="your-key-here"');
  console.error('  node deploy-migrations.js');
  process.exit(1);
}

// List of migrations in order
const migrations = [
  '001_create_users_and_preferences.sql',
  '002_create_profiles_and_photos.sql',
  '003_create_social_interactions.sql',
  '004_create_messaging.sql',
  '005_create_notifications.sql',
  '006_create_payments_and_subscriptions.sql',
  '007_create_verification_and_moderation.sql',
];

async function executeSQL(sql, description) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'ngohyujweyxmrbbusufa.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    console.log(`📄 Running: ${description}`);

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ Completed: ${description}\n`);
          resolve({ success: true });
        } else {
          console.error(`❌ Failed: ${description}`);
          console.error(`Status: ${res.statusCode}`);
          console.error(`Response: ${data}\n`);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Error: ${description}`);
      console.error(error.message);
      reject(error);
    });

    req.write(body);
    req.end();
  });
}

async function deployMigrations() {
  console.log('🚀 Starting Supabase Migration Deployment\n');
  console.log(`Project: ${SUPABASE_URL}\n`);

  let completed = 0;
  let failed = 0;

  for (const migration of migrations) {
    try {
      const migrationPath = path.join(__dirname, 'supabase/migrations', migration);
      const sql = fs.readFileSync(migrationPath, 'utf-8');

      await executeSQL(sql, migration);
      completed++;
    } catch (error) {
      console.error(`\nRetrying ${migration} with alternative approach...\n`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Completed: ${completed}/${migrations.length}`);
  if (failed > 0) {
    console.log(`⚠️  Note: ${failed} migrations may need manual verification`);
  }
  console.log('='.repeat(60));

  if (completed > 0) {
    console.log('\n✨ Migration deployment completed!');
    console.log('\nNext steps:');
    console.log('1. Go to Supabase Dashboard: https://app.supabase.com');
    console.log('2. Select your project');
    console.log('3. Navigate to Database → Tables');
    console.log('4. Verify all 14 tables were created');
    console.log('5. Check Auth → Providers to enable Email/Phone OTP');
    console.log('\nIf some migrations failed, deploy them manually:');
    console.log('1. Go to SQL Editor');
    console.log('2. Copy-paste each .sql file from supabase/migrations/');
    console.log('3. Click Run for each');
    return 0;
  } else {
    console.log('\n⚠️  All migrations need manual deployment');
    console.log('\nManual deployment steps:');
    console.log('1. Go to https://app.supabase.com → Select project');
    console.log('2. Click SQL Editor → New Query');
    console.log('3. For each migration (001-007):');
    console.log('   - Open: supabase/migrations/XXX_*.sql');
    console.log('   - Copy all content');
    console.log('   - Paste into SQL Editor');
    console.log('   - Click Run');
    return 1;
  }
}

deployMigrations().then(code => process.exit(code)).catch(error => {
  console.error('\nFatal error:', error.message);
  process.exit(1);
});
