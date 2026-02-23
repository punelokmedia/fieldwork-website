const fs = require('fs');
const file = 'c:/Users/gafru/Desktop/filed-work-website/client/src/components/VideoEditor.jsx';
let content = fs.readFileSync(file, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

// 1. Update initial state for NEW frame coordinates
content = content.replace(
  /const \[vid1Pos, setVid1Pos\] = useState\(\{ x: [\d.]+, y: [\d.]+ \}\);/,
  'const [vid1Pos, setVid1Pos] = useState({ x: 50.05, y: 21.80 });'
);
content = content.replace(
  /const \[vid1Size, setVid1Size\] = useState\([\d.]+\);/,
  'const [vid1Size, setVid1Size] = useState(95.65);'
);
content = content.replace(
  /const \[vid2Pos, setVid2Pos\] = useState\(\{ x: [\d.]+, y: [\d.]+ \}\);/,
  'const [vid2Pos, setVid2Pos] = useState({ x: 50.00, y: 78.96 });'
);
content = content.replace(
  /const \[vid2Size, setVid2Size\] = useState\([\d.]+\);/,
  'const [vid2Size, setVid2Size] = useState(95.56);'
);

content = content.replace(
  /const \[vid1Aspect, setVid1Aspect\] = useState\([\d./]+\);/,
  'const [vid1Aspect, setVid1Aspect] = useState(1033/793);'
);
content = content.replace(
  /const \[vid2Aspect, setVid2Aspect\] = useState\([\d./]+\);/,
  'const [vid2Aspect, setVid2Aspect] = useState(1032/732);'
);

// 2. Update the background "black boxes" in UI to match new positions
content = content.replace(
  /<div className="absolute bg-black" style={{ left: '1.85%', top: '0.52%', width: '96.57%', height: '41.92%', zIndex: 1 }}><\/div>/,
  '<div className="absolute bg-black" style={{ left: "2.22%", top: "1.15%", width: "95.65%", height: "41.30%", zIndex: 1 }}></div>' // (24/1080=2.22, 22/1920=1.15)
);
content = content.replace(
  /<div className="absolute bg-black" style={{ left: '1.85%', top: '57.45%', width: '95.93%', height: '41.92%', zIndex: 1 }}><\/div>/,
  '<div className="absolute bg-black" style={{ left: "2.22%", top: "59.90%", width: "95.56%", height: "38.12%", zIndex: 1 }}></div>' // (1150/1920=59.90)
);

// 3. Update FFmpeg logic: 
// - Change colorkey to black (0x000000) for the new frame
// - Update the crop heights to match new boxes (Top: 793, Bottom: 732)
content = content.replace(
  'const targetH1 = 1920 * (41.92 / 100);',
  'const targetH1 = 793;'
);
content = content.replace(
  'const targetH2 = 1920 * (41.92 / 100);',
  'const targetH2 = 732;'
);
content = content.replace(
  'colorkey=0x00FF00:0.1:0.1',
  'colorkey=0x000000:0.1:0.1' // Make black transparent in the frame overlay
);

fs.writeFileSync(file, content);
console.log("Updated for new black frame");
