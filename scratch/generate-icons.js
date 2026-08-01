const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#10b981'); // Emerald 500
  grad.addColorStop(0.5, '#14b8a6'); // Teal 500
  grad.addColorStop(1, '#4f46e5'); // Indigo 600

  ctx.fillStyle = grad;
  ctx.beginPath();
  const radius = size * 0.25;
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();

  // Dark Inner Card
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  const innerMargin = size * 0.08;
  const innerSize = size - innerMargin * 2;
  ctx.roundRect(innerMargin, innerMargin, innerSize, innerSize, radius * 0.7);
  ctx.fill();

  // Shield Icon drawing
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = size * 0.07;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const cx = size / 2;
  const cy = size / 2;
  const s = size * 0.25;

  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + s, cy - s * 0.6);
  ctx.lineTo(cx + s, cy + s * 0.2);
  ctx.quadraticCurveTo(cx + s, cy + s * 0.8, cx, cy + s * 1.1);
  ctx.quadraticCurveTo(cx - s, cy + s * 0.8, cx - s, cy + s * 0.2);
  ctx.lineTo(cx - s, cy - s * 0.6);
  ctx.closePath();
  ctx.stroke();

  // Checkmark inside shield
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = size * 0.06;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.4, cy - s * 0.05);
  ctx.lineTo(cx - s * 0.1, cy + s * 0.25);
  ctx.lineTo(cx + s * 0.4, cy - s * 0.3);
  ctx.stroke();

  const outDir = path.join(__dirname, '../public/icons');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, filename);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Icon created: ${outPath} (${size}x${size})`);
}

try {
  generateIcon(192, 'icon-192.png');
  generateIcon(512, 'icon-512.png');
} catch (err) {
  console.error('Canvas error, fallback creating directory & basic icon:', err);
}
