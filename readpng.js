const fs = require('fs');
const zlib = require('zlib');

function readPNG(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.readUInt32BE(0) !== 0x89504E47) throw new Error("Not a PNG");
  
  let offset = 8;
  let width, height, colorType, bitDepth;
  const idatChunks = [];
  
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    
    if (type === 'IHDR') {
      width = buffer.readUInt32BE(offset + 8);
      height = buffer.readUInt32BE(offset + 12);
      bitDepth = buffer.readUInt8(offset + 16);
      colorType = buffer.readUInt8(offset + 17);
    } else if (type === 'IDAT') {
      idatChunks.push(buffer.slice(offset + 8, offset + 8 + length));
    } else if (type === 'IEND') {
      break;
    }
    
    offset += 12 + length;
  }
  
  const compressedData = Buffer.concat(idatChunks);
  const uncompressed = zlib.inflateSync(compressedData);
  
  return { width, height, colorType, bitDepth, data: uncompressed };
}

try {
  const { width, height, colorType, bitDepth, data } = readPNG('client/public/images/rell.png');
  console.log(`Dimensions: ${width}x${height}, ColorType: ${colorType}, BitDepth: ${bitDepth}`);
  
  // Parse scanlines to find transparent bounds
  // A scanline starts with a filter byte.
  // Assuming RGBA (colorType 6) and 8-bit depth: 4 bytes per pixel.
  const bytesPerPixel = colorType === 6 ? 4 : (colorType === 2 ? 3 : 1);
  const scanlineLength = 1 + width * bytesPerPixel;
  
  let startY = 0;
  let transparentHeight = 0;
  
  // We want to find the bounding box where alpha is NOT 0 for the opaque parts.
  // Alternatively, the user says "black part". Let's look for entirely transparent (or black/white) regions.
  let transparentStartY = -1;
  let transparentEndY = -1;

  for (let y = 0; y < height; y++) {
    // We can't trivially parse the uncompressed data without un-filtering it first.
    // However, if the filter byte is 0 (None), we can. If it's not 0, we have to unfilter.
  }
  
} catch (e) {
  console.error(e);
}
