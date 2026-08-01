const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim();
});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUserToken() {
  const userId = '226b48a5-90d5-4c4c-a227-b976a2b07e03';
  const { data, error } = await supabaseAdmin.from('users').select('*').eq('id', userId).single();
  
  console.log('User row in DB:', data, error);
}

checkUserToken().catch(err => console.error(err));
