const { chromium } = require('playwright');

async function testRealtimeStatus() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const userId = '226b48a5-90d5-4c4c-a227-b976a2b07e03';
  console.log('Testing GET /api/ping...');
  const res = await page.goto(`http://localhost:3000/api/ping?userId=${encodeURIComponent(userId)}`);
  const json = await res.json();

  console.log('Realtime Status API Response:');
  console.log('Status:', json.status);
  console.log('Seconds Remaining:', json.secondsRemaining);
  console.log('Last Ping At:', json.user?.lastPingAt);
  console.log('Configured Minutes:', json.user?.pingFrequencyMinutes);

  await browser.close();
}

testRealtimeStatus().catch(err => console.error(err));
