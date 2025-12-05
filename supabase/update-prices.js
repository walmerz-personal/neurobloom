#!/usr/bin/env node
/**
 * Update Seed Prices
 * Reduces the cost of seeds to make them more accessible
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'mcp-server', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

console.log('🔧 Connecting to Supabase...');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function updateSeedPrices() {
    try {
        console.log('\n📝 Updating seed prices...\n');

        const updates = [
            { name: 'Lavender', cost: 10 },
            { name: 'Sunflower', cost: 30 },
            { name: 'Rose', cost: 50 },
            { name: 'Oak Tree', cost: 100 }
        ];

        for (const { name, cost } of updates) {
            const { data, error } = await supabase
                .from('items')
                .update({ cost })
                .eq('name', name)
                .select();

            if (error) {
                console.error(`❌ Error updating ${name}:`, error.message);
            } else {
                console.log(`✅ Updated ${name} to ${cost} points`);
            }
        }

        console.log('\n📊 Fetching current prices...\n');
        const { data: items, error } = await supabase
            .from('items')
            .select('name, cost')
            .order('cost');

        if (error) {
            console.error('❌ Error fetching items:', error.message);
        } else {
            console.log('Current seed prices:');
            items.forEach(item => {
                console.log(`  ${item.name}: ${item.cost} points`);
            });
        }

        console.log('\n✅ Price update complete!\n');

    } catch (error) {
        console.error('❌ Update failed:', error.message);
        process.exit(1);
    }
}

updateSeedPrices();
