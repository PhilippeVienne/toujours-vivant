const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const vars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = (match[2] || '').trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    if (key && val && !key.startsWith('#') && !key.startsWith('VERCEL_')) {
      vars[key] = val;
    }
  }
});

console.log('Pushing environment variables to Vercel Production...');

for (const [key, value] of Object.entries(vars)) {
  try {
    console.log(`Setting ${key}...`);
    execSync(`npx vercel env add ${key} production`, {
      input: value,
      stdio: ['pipe', 'inherit', 'inherit']
    });
  } catch (err) {
    console.warn(`Notice for ${key}:`, err.message);
  }
}

console.log('✅ Environment variables pushed to Vercel!');
