const { chromium } = require('playwright');

async function testIconsFetch() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Testing GET /icons/icon-192.png...');
  const res192 = await page.goto('http://localhost:3000/icons/icon-192.png');
  console.log('Status 192:', res192.status());

  console.log('Testing GET /icons/icon-512.png...');
  const res512 = await page.goto('http://localhost:3000/icons/icon-512.png');
  console.log('Status 512:', res512.status());

  await browser.close();
}

testIconsFetch().catch(err => console.error(err));
