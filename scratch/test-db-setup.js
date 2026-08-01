const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);

const supabaseAdmin = createClient(supabaseUrl, serviceKey);

async function checkAndSetup() {
  console.log('Testing Supabase admin connection...');

  // 1. Try querying emergency_contacts table
  const { data, error } = await supabaseAdmin.from('emergency_contacts').select('*').limit(1);
  if (!error) {
    console.log('SUCCESS: Table public.emergency_contacts ALREADY EXISTS in Supabase! Rows:', data.length);
    return;
  }

  console.log('Table error detected:', error.message, error.code);
}

checkAndSetup();
