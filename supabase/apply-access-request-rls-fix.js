#!/usr/bin/env node
/**
 * Apply Access Request RLS Fix Migration
 * This script applies the RLS policy fix for SMS access requests
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'mcp-server', '.env') });

// Also try loading from root .env.local
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
    require('dotenv').config({ path: envLocalPath });
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials');
    console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    console.error('You can set them in:');
    console.error('  - supabase/mcp-server/.env');
    console.error('  - .env.local (with EXPO_PUBLIC_SUPABASE_URL)');
    process.exit(1);
}

console.log('🔧 Connecting to Supabase...');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function applyMigration() {
    try {
        console.log('\n📝 Reading migration file...');
        
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'fix-access-request-rls.sql'),
            'utf8'
        );

        // Split by semicolons and filter out comments/empty statements
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

        console.log(`\n📋 Found ${statements.length} SQL statements to execute\n`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            // Skip SELECT statements (verification queries)
            if (statement.trim().toUpperCase().startsWith('SELECT')) {
                console.log(`⏭️  Skipping verification query ${i + 1}`);
                continue;
            }

            console.log(`🔨 Executing statement ${i + 1}...`);
            console.log(`   ${statement.substring(0, 80)}...`);

            try {
                // Use RPC to execute raw SQL (requires a function or direct DB access)
                // Since we have service role, we can use the REST API directly
                const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                    },
                    body: JSON.stringify({ sql: statement })
                });

                if (!response.ok) {
                    // Try alternative: use pg REST API
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const result = await response.json();
                console.log(`   ✅ Statement ${i + 1} executed successfully`);
            } catch (error) {
                // If REST API doesn't work, we'll need to use direct PostgreSQL connection
                // For now, let's try using Supabase's SQL execution via the management API
                console.log(`   ⚠️  REST API method failed, trying alternative...`);
                
                // Alternative: Use the Supabase JS client's RPC if available
                // Or we need to tell user to run manually
                console.log(`   ❌ Cannot execute DDL via REST API`);
                console.log(`   📝 Please run this SQL in Supabase SQL Editor:\n`);
                console.log('='.repeat(80));
                console.log(statement);
                console.log('='.repeat(80));
                console.log('');
            }
        }

        console.log('\n✅ Migration application complete!');
        console.log('\n📋 Next steps:');
        console.log('1. If any statements failed, copy them from above and run in Supabase SQL Editor');
        console.log('2. Verify the policies were created by running the verification query');
        console.log('3. Test the SMS access request feature in your app\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\n💡 Alternative: Run the SQL file directly in Supabase SQL Editor:');
        console.error('   1. Go to https://app.supabase.com');
        console.error('   2. Open your project → SQL Editor');
        console.error('   3. Copy contents of supabase/fix-access-request-rls.sql');
        console.error('   4. Paste and run\n');
        process.exit(1);
    }
}

applyMigration();
