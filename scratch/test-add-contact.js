const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

async function testFullContactFlow() {
  console.log('Testing full contact creation flow...');

  // 1. Create or get test user in public.users
  const testUserId = '226b48a5-90d5-4c4c-a227-b976a2b07e03';
  await supabaseAdmin.from('users').upsert({
    id: testUserId,
    email: 'philippegeek@gmail.com',
    full_name: 'Philippe Vienne',
    emergency_token: 'tok_demo12345'
  });

  // 2. Insert contact with ONLY name
  const { data, error } = await supabaseAdmin
    .from('emergency_contacts')
    .insert({
      user_id: testUserId,
      name: 'Maman',
      notify_by_email: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error inserting contact:', error);
  } else {
    console.log('🎉 CLEAN SUCCESS! Contact created:', data);
    console.log('Contact token:', data.contact_token);

    // Clean up test contact
    await supabaseAdmin.from('emergency_contacts').delete().eq('id', data.id);
    console.log('Test contact cleaned up successfully.');
  }
}

testFullContactFlow();
