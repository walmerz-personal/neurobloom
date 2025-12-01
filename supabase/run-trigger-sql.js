#!/usr/bin/env node
/**
 * Run SQL directly against Supabase using the REST API
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'mcp-server', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

// Read the trigger SQL
const triggerSQL = fs.readFileSync(
    path.join(__dirname, 'add-user-trigger.sql'),
    'utf8'
);

// Extract just the SQL commands we need (remove comments and verification)
const cleanSQL = triggerSQL
    .split('\n')
    .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
    .join('\n')
    .split(';')
    .slice(0, 3) // Just the function, drop trigger, and create trigger
    .join(';') + ';';

console.log('🔧 Executing SQL migration...\n');
console.log(cleanSQL);
console.log('\n' + '='.repeat(80) + '\n');

// Use Supabase's PostgREST to execute SQL via RPC
const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);

const postData = JSON.stringify({
    query: cleanSQL
});

const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
    }
};

const urlObj = new URL(url);
options.hostname = urlObj.hostname;
options.path = urlObj.pathname + urlObj.search;
options.port = urlObj.port || 443;

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ SQL executed successfully!');
            console.log('Response:', data || 'No response body');
        } else {
            console.error(`❌ Failed with status ${res.statusCode}`);
            console.error('Response:', data);
            console.log('\n⚠️  Supabase REST API may not support direct SQL execution.');
            console.log('Please run the SQL manually in the Supabase dashboard.');
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
    console.log('\n📋 Manual instructions:');
    console.log('1. Go to https://app.supabase.com');
    console.log('2. Open SQL Editor');
    console.log('3. Run the SQL shown above');
});

req.write(postData);
req.end();
