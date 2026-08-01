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

async function checkSpecificUuid() {
  const uuid = '4145eaeb-f5b1-4300-81fd-6bd35fccbaf3';
  console.log(`Checking UUID ${uuid} in Supabase...`);

  // 1. Check emergency_contacts
  const { data: contact, error: contactErr } = await supabaseAdmin
    .from('emergency_contacts')
    .select('*')
    .eq('id', uuid)
    .maybeSingle();

  console.log('Contact match:', contact, contactErr);

  // 2. Check users
  const { data: user, error: userErr } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', uuid)
    .maybeSingle();

  console.log('User match:', user, userErr);
}

checkSpecificUuid().catch(err => console.error(err));
