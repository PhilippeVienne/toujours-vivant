const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright');
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

async function testContactUuidLink() {
  const testUserId = '226b48a5-90d5-4c4c-a227-b976a2b07e03';
  
  // 1. Insert a contact
  const { data: contact } = await supabaseAdmin
    .from('emergency_contacts')
    .insert({
      user_id: testUserId,
      name: 'Maman Lien Test',
      phone: '+33612345678',
    })
    .select()
    .single();

  console.log('Inserted contact UUID:', contact.id);

  // 2. Fetch public status using contact UUID
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const response = await page.goto(`http://localhost:3000/api/status/${contact.id}`);
  const json = await response.json();
  console.log('API Response for Contact UUID:', JSON.stringify(json, null, 2));

  // 3. Clean up
  await supabaseAdmin.from('emergency_contacts').delete().eq('id', contact.id);
  await browser.close();
}

testContactUuidLink().catch(err => console.error(err));
