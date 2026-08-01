const { chromium } = require('playwright');

async function testSettingsUpdate() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const testUserId = '226b48a5-90d5-4c4c-a227-b976a2b07e03';
  console.log('Testing POST /api/user/settings with 45 minutes...');
  const res = await page.request.post('http://localhost:3000/api/user/settings', {
    data: {
      userId: testUserId,
      pingFrequencyMinutes: 45
    }
  });

  const json = await res.json();
  console.log('Update result:', res.status(), json);

  // Now fetch settings to confirm persistence
  const getRes = await page.request.get(`http://localhost:3000/api/user/settings?userId=${encodeURIComponent(testUserId)}`);
  const getJson = await getRes.json();
  console.log('GET settings result:', getRes.status(), getJson);

  await browser.close();
}

testSettingsUpdate().catch(err => console.error(err));
