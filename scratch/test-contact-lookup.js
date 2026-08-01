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

async function testDirectLookup() {
  const testUserId = '226b48a5-90d5-4c4c-a227-b976a2b07e03';
  
  // Insert contact
  const { data: contact, error: insertErr } = await supabaseAdmin
    .from('emergency_contacts')
    .insert({
      user_id: testUserId,
      name: 'Test Proche UUID Direct',
    })
    .select()
    .single();

  console.log('Inserted Contact:', contact, insertErr);

  // Direct select by UUID
  const { data: found, error: findErr } = await supabaseAdmin
    .from('emergency_contacts')
    .select('*')
    .eq('id', contact.id)
    .maybeSingle();

  console.log('Found Contact by UUID:', found, findErr);

  // Clean up
  await supabaseAdmin.from('emergency_contacts').delete().eq('id', contact.id);
}

testDirectLookup().catch(err => console.error(err));
