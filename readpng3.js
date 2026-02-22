const fs = require('fs');
const zlib = require('zlib');

function getTransparentBox(filePath) {
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
  
  // PNG filter types: 0 (None), 1 (Sub), 2 (Up), 3 (Average), 4 (Paeth)
  const bytesPerPixel = colorType === 6 ? 4 : (colorType === 2 ? 3 : 1);
  const scanlineLength = 1 + width * bytesPerPixel;
  
  const pixels = Buffer.alloc(width * height * bytesPerPixel);
  
  function paethPredictor(a, b, c) {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    if (pb <= pc) return b;
    return c;
  }
  
  let minTransparentY = height;
  let maxTransparentY = -1;
  let transparentCount = 0;
  
  for (let y = 0; y < height; y++) {
    const filter = uncompressed[y * scanlineLength];
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < bytesPerPixel; c++) {
        const raw = uncompressed[y * scanlineLength + 1 + x * bytesPerPixel + c];
        const left = x === 0 ? 0 : pixels[y * (width * bytesPerPixel) + ((x - 1) * bytesPerPixel) + c];
        const up = y === 0 ? 0 : pixels[(y - 1) * (width * bytesPerPixel) + (x * bytesPerPixel) + c];
        const upLeft = (x === 0 || y === 0) ? 0 : pixels[(y - 1) * (width * bytesPerPixel) + ((x - 1) * bytesPerPixel) + c];
        
        let recon = 0;
        if (filter === 0) recon = raw;
        else if (filter === 1) recon = raw + left;
        else if (filter === 2) recon = raw + up;
        else if (filter === 3) recon = raw + Math.floor((left + up) / 2);
        else if (filter === 4) recon = raw + paethPredictor(left, up, upLeft);
        
        pixels[y * (width * bytesPerPixel) + (x * bytesPerPixel) + c] = recon % 256;
      }
      
      const alpha = colorType === 6 ? pixels[y * (width * bytesPerPixel) + (x * bytesPerPixel) + 3] : 255;
      if (alpha < 255) {  // Assuming transparent is alpha < 255
        if (y < minTransparentY) minTransparentY = y;
        if (y > maxTransparentY) maxTransparentY = y;
        transparentCount++;
      }
    }
  }
  
  console.log(`Transparent area from y=${minTransparentY} to y=${maxTransparentY}`);
  console.log(`Height of transparent area: ${maxTransparentY - minTransparentY + 1}`);
  console.log(`Total transparent pixels: ${transparentCount}`);
  
  // find actual bounding box (first fully transparent contiguous vertical space across full width)
}

getTransparentBox('client/images/rell.png');
