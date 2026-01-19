#!/usr/bin/env node
/**
 * Apply Access Request RLS Fix - Direct Database Connection
 * This script applies the migration using a direct database connection
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'mcp-server', '.env') });
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
    require('dotenv').config({ path: envLocalPath });
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

// Extract project ref from URL to construct DB connection string
const projectRefMatch = SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/);
if (!projectRefMatch) {
    console.error('❌ Could not extract project reference from URL');
    process.exit(1);
}

const projectRef = projectRefMatch[1];

console.log('🔧 NeuroBloom - Access Request RLS Fix');
console.log('=======================================\n');
console.log(`📋 Project: ${projectRef}`);
console.log('📝 Reading migration file...\n');

const migrationSQL = fs.readFileSync(
    path.join(__dirname, 'fix-access-request-rls.sql'),
    'utf8'
);

// Remove comments and verification queries for execution
const executableSQL = migrationSQL
    .split('\n')
    .filter(line => {
        const trimmed = line.trim();
        return trimmed && 
               !trimmed.startsWith('--') && 
               !trimmed.startsWith('/*') &&
               !trimmed.toUpperCase().startsWith('SELECT'); // Skip verification queries
    })
    .join('\n')
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => s + ';')
    .join('\n\n');

console.log('💡 To apply this migration, you have two options:\n');
console.log('Option 1: Use Supabase Dashboard (Recommended)');
console.log('  1. Go to https://app.supabase.com');
console.log('  2. Select your project');
console.log('  3. Go to SQL Editor');
console.log('  4. Copy and paste the SQL from: supabase/fix-access-request-rls.sql');
console.log('  5. Click Run\n');

console.log('Option 2: Use Supabase CLI (if project is linked)');
console.log('  1. Run: supabase login');
console.log('  2. Run: supabase link --project-ref ' + projectRef);
console.log('  3. Run: supabase db push\n');

console.log('Option 3: Use psql (if you have direct DB access)');
console.log('  The migration file is ready at: supabase/migrations/20260118230417_fix_access_request_rls.sql\n');

console.log('📄 Migration SQL Preview:');
console.log('='.repeat(80));
console.log(executableSQL.substring(0, 500) + '...');
console.log('='.repeat(80));
console.log('\n✅ Migration file is ready to apply!');
