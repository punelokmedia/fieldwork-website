const fs = require('fs');

function decodePNGText(buffer) {
  let offset = 8;
  const chunks = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    
    if (type === 'IHDR') {
      console.log('Size:', buffer.readUInt32BE(offset + 8), 'x', buffer.readUInt32BE(offset + 12));
    }
    offset += 12 + length;
  }
}

try {
  decodePNGText(fs.readFileSync('client/images/rell.png'));
} catch (e) {
  console.error(e);
}
