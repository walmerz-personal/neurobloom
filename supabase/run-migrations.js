#!/usr/bin/env node
/**
 * Supabase Migration Runner
 * Runs the necessary migrations to fix the PGRST116 error
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'mcp-server', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials in .env file');
    console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    process.exit(1);
}

console.log('🔧 Connecting to Supabase...');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runMigrations() {
    try {
        console.log('\n📝 Step 1: Creating user creation trigger...');

        // Read and run the trigger migration
        const triggerSQL = fs.readFileSync(
            path.join(__dirname, 'add-user-trigger.sql'),
            'utf8'
        );

        // Execute the trigger creation (need to use RPC or direct SQL)
        // Note: Supabase JS client doesn't directly support running DDL
        // We'll need to use the Supabase API

        console.log('⚠️  Note: This script requires the Supabase CLI or direct PostgreSQL access');
        console.log('Please run the following SQL in your Supabase dashboard:\n');
        console.log('='.repeat(80));
        console.log(triggerSQL);
        console.log('='.repeat(80));

        console.log('\n📝 Step 2: Finding existing auth users...');

        // Get all auth users (this requires service role)
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

        if (authError) {
            console.error('❌ Error fetching auth users:', authError.message);
            return;
        }

        console.log(`✅ Found ${authData.users.length} auth user(s)`);

        // Check which users are missing from users table
        for (const authUser of authData.users) {
            console.log(`\n🔍 Checking user: ${authUser.email} (${authUser.id})`);

            const { data: dbUser, error: dbError } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (dbError && dbError.code === 'PGRST116') {
                console.log('   ❌ User NOT found in users table - needs to be created');
                console.log('   📝 Creating user entry...');

                const name = authUser.user_metadata?.name || authUser.email.split('@')[0];
                const role = authUser.user_metadata?.role || 'survivor';

                const { error: insertError } = await supabase
                    .from('users')
                    .insert([{
                        id: authUser.id,
                        email: authUser.email,
                        name: name,
                        role: role
                    }]);

                if (insertError) {
                    console.error('   ❌ Error creating user:', insertError.message);
                } else {
                    console.log(`   ✅ Successfully created user entry for ${authUser.email}`);
                }
            } else if (!dbError) {
                console.log(`   ✅ User already exists in users table`);
            } else {
                console.error(`   ❌ Error checking user:`, dbError.message);
            }
        }

        console.log('\n✅ Migration check complete!');
        console.log('\n📋 Next steps:');
        console.log('1. Copy the SQL above and run it in Supabase SQL Editor');
        console.log('2. Restart your Expo app (press "r" in Metro bundler)');
        console.log('3. Verify the errors are gone\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigrations();
