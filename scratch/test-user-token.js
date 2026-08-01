const { chromium } = require('playwright');

async function testUserTokenApi() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const token = 'tok_226b48a590d5';
  console.log(`Testing GET /api/status/${token}...`);
  const response = await page.goto(`http://localhost:3000/api/status/${token}`);
  const status = response.status();
  const json = await response.json();

  console.log(`Status Code: ${status}`);
  console.log('JSON Output:', JSON.stringify(json, null, 2));

  await browser.close();
}

testUserTokenApi().catch(err => console.error(err));
