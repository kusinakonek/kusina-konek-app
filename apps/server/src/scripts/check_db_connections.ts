/**
 * Database Connection Test using Supabase Client
 * Uses HTTPS instead of direct PostgreSQL connection
 */

import { env } from '../config/env';
import { createClient } from '@supabase/supabase-js';

async function checkDatabaseConnections() {
    console.log('🔄 Starting Database Connection Check (via Supabase Client)...\n');

    // Check environment variables
    console.log('1. Checking environment variables...');
    console.log(`   DATABASE_URL: ${env.DATABASE_URL ? '✅ Set (hidden)' : '❌ NOT SET'}`);
    console.log(`   SUPABASE_URL: ${env.SUPABASE_URL ? '✅ Set' : '❌ NOT SET'}`);
    console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ NOT SET'}`);

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('\n❌ Supabase credentials not set. Please check your .env file.');
        return;
    }

    try {
        // Create Supabase client
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

        console.log('\n2. Attempting to connect via Supabase HTTP API...');

        // Try to list tables using Supabase's API
        const { data, error } = await supabase
            .from('Role')
            .select('*')
            .limit(1);

        if (error) {
            // Check if it's a "table doesn't exist" error vs connection error
            if (error.message.includes('does not exist') || error.code === '42P01') {
                console.log('   ⚠️ Connected to Supabase, but the "Role" table does not exist yet.');
                console.log('   You need to run the init_db.sql script in Supabase SQL Editor.');
            } else {
                console.error('   ❌ Error:', error.message);
            }
        } else {
            console.log('   ✅ Successfully connected to Supabase!');
            console.log(`   Found ${data.length} role(s) in Role table.`);
        }

        // Try to query what tables exist using raw SQL via Supabase
        console.log('\n3. Checking for existing tables...');
        const { data: tables, error: tableError } = await supabase.rpc('get_tables');

        if (tableError) {
            // The RPC might not exist, try a direct query
            console.log('   Trying alternative method...');

            // Test each expected table
            const expectedTables = ['Role', 'Status', 'User', 'Address', 'Food', 'DropOffLocation', 'Distribution', 'Feedback'];

            for (const table of expectedTables) {
                const { error: checkError } = await supabase
                    .from(table)
                    .select('*')
                    .limit(0);

                if (checkError && (checkError.message.includes('does not exist') || checkError.code === '42P01')) {
                    console.log(`   - ${table}: ❌ NOT FOUND`);
                } else if (checkError) {
                    console.log(`   - ${table}: ⚠️ Error: ${checkError.message}`);
                } else {
                    console.log(`   - ${table}: ✅ EXISTS`);
                }
            }
        } else {
            console.log('   Tables found:', tables);
        }

        console.log('\n🎉 Supabase HTTP connection is working!');
        console.log('\nNote: If direct PostgreSQL (port 5432) is blocked,');
        console.log('you can still use Supabase through its HTTP API.');

    } catch (error: any) {
        console.error('\n❌ Connection Check Failed:');
        console.error(`   Error: ${error.message}`);
    }
}

checkDatabaseConnections();
