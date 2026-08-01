const { chromium } = require('playwright');

async function testSpecificStatusApi() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const uuid = '4145eaeb-f5b1-4300-81fd-6bd35fccbaf3';
  console.log(`Testing GET /api/status/${uuid}...`);
  const response = await page.goto(`http://localhost:3000/api/status/${uuid}`);
  const status = response.status();
  const json = await response.json();

  console.log(`Status Code: ${status}`);
  console.log('JSON Output:', JSON.stringify(json, null, 2));

  await browser.close();
}

testSpecificStatusApi().catch(err => console.error(err));
