const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createOgPngBuffer(width = 1200, height = 630) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 2; // Truecolor RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = createChunk('IHDR', ihdr);

  const lineSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * lineSize);

  // Gradient background: Dark Slate (#090d16) to Emerald Dark (#064e3b)
  for (let y = 0; y < height; y++) {
    const lineOffset = y * lineSize;
    rawData[lineOffset] = 0; // Filter None

    const ratioY = y / height;
    for (let x = 0; x < width; x++) {
      const ratioX = x / width;
      const pxOffset = lineOffset + 1 + x * 3;

      // Dark blue-black base with emerald radial highlight in top-left
      const distFromCenter = Math.sqrt(Math.pow(ratioX - 0.2, 2) + Math.pow(ratioY - 0.3, 2));
      const highlight = Math.max(0, 1 - distFromCenter * 1.5);

      const r = Math.min(255, Math.floor(9 + highlight * 20));
      const g = Math.min(255, Math.floor(13 + highlight * 170));
      const b = Math.min(255, Math.floor(22 + highlight * 110));

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);

  const crcBuffer = Buffer.alloc(4);
  const crcContent = Buffer.concat([typeBuffer, data]);
  const crcValue = crc32(crcContent);
  crcBuffer.writeUInt32BE(crcValue, 0);

  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    for (let j = 0; j < 8; j++) {
      if ((crc ^ byte) & 1) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc = crc >>> 1;
      }
      byte = byte >>> 1;
    }
  }
  return (crc ^ -1) >>> 0;
}

const publicDir = path.join(__dirname, '../public');
fs.writeFileSync(path.join(publicDir, 'og-image.png'), createOgPngBuffer(1200, 630));
console.log('✅ Generated public/og-image.png (1200x630) successfully!');
