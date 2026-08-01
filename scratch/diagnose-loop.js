const { chromium } = require('playwright');

async function diagnoseLoopHomePage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const requests = [];
  const consoleLogs = [];

  page.on('request', req => {
    requests.push({ url: req.url(), method: req.method(), time: Date.now() });
  });

  page.on('console', msg => {
    consoleLogs.push(msg.text());
  });

  console.log('Navigating to http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/');
  
  // Wait 10 seconds and observe network traffic for repeating requests
  await page.waitForTimeout(10000);

  console.log('--- TOTAL REQUESTS OVER 10 SECONDS:', requests.length, '---');
  
  // Group by URL to find repeating endpoints
  const counts = {};
  requests.forEach(r => {
    const cleanUrl = r.url.split('?')[0];
    counts[cleanUrl] = (counts[cleanUrl] || 0) + 1;
  });

  console.log('--- REPEATING REQUEST COUNTS ---', JSON.stringify(counts, null, 2));

  await browser.close();
}

diagnoseLoopHomePage().catch(err => console.error(err));
