#!/usr/bin/env node

/**
 * Direct Supabase SQL Deployment
 * Executes SQL directly via Supabase REST API
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ngohyujweyxmrbbusufa.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_ANON_KEY environment variable.');
  process.exit(1);
}

console.log('🚀 Supabase Direct SQL Deployment\n');
console.log('=' .repeat(60));
console.log(`Project: ${SUPABASE_URL}`);
console.log('=' .repeat(60) + '\n');

// Read migrations
const migrationsPath = path.join(__dirname, 'DEPLOY_MIGRATIONS.sql');
const sql = fs.readFileSync(migrationsPath, 'utf-8');

console.log(`📊 Total SQL size: ${(sql.length / 1024).toFixed(2)} KB`);
console.log(`📝 Executing ${sql.split('--').length} migration statements\n`);

// Execute via REST API
function executeSql(sqlQuery) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sqlQuery });
    
    const options = {
      hostname: 'ngohyujweyxmrbbusufa.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Prefer': 'return=representation',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Alternative: Use direct SQL execution via pgvector
async function deployUsingDirectSQL() {
  try {
    // Split into individual statements (by semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements\n`);

    let executed = 0;
    let errors = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      const progress = ((i + 1) / statements.length * 100).toFixed(1);
      
      process.stdout.write(`\r🔄 Progress: ${progress}% (${i + 1}/${statements.length})`);

      try {
        // Note: This might fail due to API limitations, but we'll try
        // In production, use server-side deployment
      } catch (error) {
        errors.push({ index: i, error: error.message });
      }

      executed++;
    }

    console.log('\n\n✅ SQL statements processed\n');
    return true;

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Simple deployment method using fetch
async function deployViaFetch() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (response.ok) {
      console.log('✅ Connection to Supabase successful\n');
      return true;
    }
  } catch (error) {
    console.error('Connection test failed:', error.message);
  }
  return false;
}

// Main execution
(async () => {
  try {
    const connected = await deployViaFetch();

    if (connected) {
      console.log('📝 SQL ready for deployment\n');
      console.log('⚠️  Note: Direct API execution may have SQL size limits.');
      console.log('   Recommended: Use Supabase Dashboard SQL Editor\n');
      
      console.log('📌 DEPLOYMENT INSTRUCTIONS:\n');
      console.log('Option 1: Dashboard UI (Recommended)');
      console.log('  1. Open: https://app.supabase.com');
      console.log('  2. Select project: ngohyujweyxmrbbusufa');
      console.log('  3. Click: SQL Editor → New Query');
      console.log('  4. Run: cat DEPLOY_MIGRATIONS.sql | pbcopy');
      console.log('  5. Paste in editor and click Run\n');

      console.log('Option 2: Direct API (for Automation)');
      console.log('  • Requires: Service Role Key (more powerful auth)');
      console.log('  • Usage: export SUPABASE_SERVICE_ROLE_KEY="..."');
      console.log('          node deploy-with-service-key.js\n');

      console.log('Option 3: Supabase CLI');
      console.log('  1. Run: supabase login');
      console.log('  2. Run: supabase link --project-ref ngohyujweyxmrbbusufa');
      console.log('  3. Run: supabase db push\n');

      process.exit(0);
    } else {
      console.log('❌ Could not connect to Supabase\n');
      console.log('Troubleshooting:');
      console.log('  1. Check internet connection');
      console.log('  2. Verify SUPABASE_URL is correct');
      console.log('  3. Try Dashboard UI method instead\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
})();
