import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE'; // Fallback or ensure it's loaded
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE'; // Fallback

// Ensure Supabase URL and Key are available
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_SUPABASE_URL_HERE')) {
  console.error("Supabase URL or Anon Key is not set in environment variables. Please check your .env file or your Vite configuration.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getSchemaForTable(tableName) {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public') // Assuming your tables are in the 'public' schema
      .eq('table_name', tableName)
      .order('ordinal_position', { ascending: true });

    if (error) {
      console.error('Error fetching schema:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected error:', err);
    return null;
  }
}

// Check for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from the project's .env.
// The existing `src/scripts/supabaseClient.js` should already have this.
// I need to ensure this temporary script can also access them.

// For Vite, client-side env vars are prefixed with VITE_.
// For server-side Node.js, they are usually just without the prefix.
// This script runs in Node.js, so I need to load dotenv correctly.

async function run() {
  console.log(`Fetching schema for table 'matches' from Supabase...`);
  const schema = await getSchemaForTable('matches');
  if (schema) {
    console.log(`Schema for 'matches' table:`);
    console.table(schema);
  } else {
    console.log(`Could not retrieve schema for 'matches' table.`);
  }
}

run();
