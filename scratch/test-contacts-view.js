const { chromium } = require('playwright');
const path = require('path');

async function testContactsView() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  console.log('Navigating to http://localhost:3000/contacts ...');
  await page.goto('http://localhost:3000/contacts');
  await page.waitForTimeout(1000);

  const screenshotPath = path.join(__dirname, '../screenshot_contacts_fixed.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Saved screenshot to:', screenshotPath);

  await browser.close();
}

testContactsView().catch(err => console.error(err));
