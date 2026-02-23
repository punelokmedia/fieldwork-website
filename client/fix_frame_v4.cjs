const fs = require('fs');
const file = 'c:/Users/gafru/Desktop/filed-work-website/client/src/components/VideoEditor.jsx';
let content = fs.readFileSync(file, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

// 1. Fix the video style (remove duplicate aspectRatio and fix logic)
content = content.replace(
  /transform: 'translate\(-50%, -50%\)', aspectRatio: frameMode === 'frame2' \? vid2Aspect : 'auto', aspectRatio: frameMode === 'frame2' \? vid1Aspect : 'auto',/,
  "transform: 'translate(-50%, -50%)', aspectRatio: frameMode === 'frame2' ? vid1Aspect : 'auto',"
);

// 2. Fix the frame2 background rendering (remove weird filter and use clean container)
// I will replace the entire frameMode === 'frame2' block to be sure
const frame2UIPattern = /\{frameMode === 'frame2' && \(\n\s*<img\n\s*src="\/images\/frame\.jpg".*?\/>\n\s*\)\}/s;
const newFrame2UI = `{frameMode === 'frame2' && (
                    <div className="absolute inset-0 z-0 w-full h-full overflow-hidden">
                       <img
                        src="/images/frame.jpg"
                        alt="Frame 2 Background"
                        className="w-full h-full object-fill pointer-events-none"
                      />
                    </div>
                  )}`;

content = content.replace(frame2UIPattern, newFrame2UI);

// 3. Ensure state is correct
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

// 4. Fix FFmpeg colorkey - the new image has pure black boxes
content = content.replace(
  /colorkey=0x[0-9A-F]+:0\.1:0\.1/,
  'colorkey=0x000000:0.1:0.1'
);

fs.writeFileSync(file, content);
console.log("Updated VideoEditor.jsx for exact frame2 fit");
