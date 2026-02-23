const fs = require('fs');
const file = 'c:/Users/gafru/Desktop/filed-work-website/client/src/components/VideoEditor.jsx';
let content = fs.readFileSync(file, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

// 1. Update initial state for frame2 fit
content = content.replace(
  'const [vid1Pos, setVid1Pos] = useState({ x: 50, y: 25 });',
  'const [vid1Pos, setVid1Pos] = useState({ x: 50.14, y: 21.48 });'
);
content = content.replace(
  'const [vid1Size, setVid1Size] = useState(80);',
  'const [vid1Size, setVid1Size] = useState(96.57);'
);
content = content.replace(
  'const [vid2Pos, setVid2Pos] = useState({ x: 50, y: 75 });',
  'const [vid2Pos, setVid2Pos] = useState({ x: 49.81, y: 78.41 });'
);
content = content.replace(
  'const [vid2Size, setVid2Size] = useState(80);',
  'const [vid2Size, setVid2Size] = useState(95.93);'
);

// 2. Add aspect ratio tracking for videos in frame2
// We need to make the container height dynamic to fit the box
// Box 1: 1043x805 in 1080x1920 -> height is 805/1920 = 41.92%
// Box 2: 1036x805 in 1080x1920 -> height is 805/1920 = 41.92%

content = content.replace(
  'const [vid2Size, setVid2Size] = useState(95.93);',
  `const [vid2Size, setVid2Size] = useState(95.93);
  const [vid1Aspect, setVid1Aspect] = useState(1043/805);
  const [vid2Aspect, setVid2Aspect] = useState(1036/805);`
);

// 3. Update UI to use black background and better fitting
content = content.replace(
  'transform: \'translate(-50%, -50%)\',',
  'transform: \'translate(-50%, -50%)\', aspectRatio: frameMode === \'frame2\' ? vid1Aspect : \'auto\','
);
content = content.replace(
  'transform: \'translate(-50%, -50%)\',',
  'transform: \'translate(-50%, -50%)\', aspectRatio: frameMode === \'frame2\' ? vid2Aspect : \'auto\','
);

// Update color/filter for frame2 bg
content = content.replace(
  'src="/images/frame.jpg"',
  'src="/images/frame.jpg" style={{ filter: "hue-rotate(240deg) brightness(0.2)" }}' // This makes green (120) go to blue/black? 
  // Better use mix-blend-mode or just overlay black boxes.
);

// Actually, let's just put black boxes OVER the green areas if it's frame2
content = content.replace(
  `{frameMode === 'frame2' && (
                    <img
                      src="/images/frame.jpg"
                      alt="Frame 2 Background"
                      className="absolute inset-0 z-0 w-full h-full object-cover pointer-events-none"
                    />
                  )}`,
  `{frameMode === 'frame2' && (
                    <div className="absolute inset-0 z-0 w-full h-full overflow-hidden">
                       <img
                        src="/images/frame.jpg"
                        alt="Frame 2 Background"
                        className="w-full h-full object-cover pointer-events-none"
                      />
                      {/* Black boxes to hide green gaps */}
                      <div className="absolute bg-black" style={{ left: '1.85%', top: '0.52%', width: '96.57%', height: '41.92%', zIndex: 1 }}></div>
                      <div className="absolute bg-black" style={{ left: '1.85%', top: '57.45%', width: '95.93%', height: '41.92%', zIndex: 1 }}></div>
                    </div>
                  )}`
);

// Update FFmpeg to replace green with black and use overlay order
// We will overlay videos FIRST, then the frame with colorkey
content = content.replace(
  `          // Background frame scaled to reel size
          const scaleBg = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920';
          frameFilter += \`[1:v]\${scaleBg}[vbase]\`;

          // Vid1 overlay
          const targetW1 = 1080 * (vid1Size / 100);
          let w1 = Math.round(targetW1); if (w1 % 2 !== 0) w1 += 1;
          frameFilter += \`;[0:v]scale=\${w1}:-1[v1];[\${lastFrameStream}][v1]overlay=x=(W*\${vid1Pos.x}/100-w/2):y=(H*\${vid1Pos.y}/100-h/2)[vframe1]\`;
          lastFrameStream = 'vframe1';

          // Vid2 overlay if exists
          if (video2File) {
            const targetW2 = 1080 * (vid2Size / 100);
            let w2 = Math.round(targetW2); if (w2 % 2 !== 0) w2 += 1;
            frameFilter += \`;[2:v]scale=\${w2}:-1[v2];[\${lastFrameStream}][v2]overlay=x=(W*\${vid2Pos.x}/100-w/2):y=(H*\${vid2Pos.y}/100-h/2)[vframe2]\`;
            lastFrameStream = 'vframe2';
          }`,
  `          // Prepare black background
          frameFilter += "color=black:s=1080x1920[vbg]";

          // Scale Vid1
          const targetW1 = 1080 * (vid1Size / 100);
          let w1 = Math.round(targetW1); if (w1 % 2 !== 0) w1 += 1;
          const targetH1 = 1920 * (41.92 / 100); // Box height
          let h1 = Math.round(targetH1); if (h1 % 2 !== 0) h1 += 1;
          frameFilter += \`;[0:v]scale=\${w1}:\${h1}:force_original_aspect_ratio=increase,crop=\${w1}:\${h1}[v1]\`;
          
          // Overlay Vid1 on black
          frameFilter += \`;[vbg][v1]overlay=x=(W*\${vid1Pos.x}/100-w/2):y=(H*\${vid1Pos.y}/100-h/2)[vtmp1]\`;
          lastFrameStream = 'vtmp1';

          // Scale and Overlay Vid2 if exists
          if (video2File) {
            const targetW2 = 1080 * (vid2Size / 100);
            let w2 = Math.round(targetW2); if (w2 % 2 !== 0) w2 += 1;
            const targetH2 = 1920 * (41.92 / 100);
            let h2 = Math.round(targetH2); if (h2 % 2 !== 0) h2 += 1;
            frameFilter += \`;[2:v]scale=\${targetW2}:\${targetH2}:force_original_aspect_ratio=increase,crop=\${targetW2}:\${targetH2}[v2]\`;
            frameFilter += \`;[vtmp1][v2]overlay=x=(W*\${vid2Pos.x}/100-w/2):y=(H*\${vid2Pos.y}/100-h/2)[vtmp2]\`;
            lastFrameStream = 'vtmp2';
          }

          // Finally overlay the frame image (input 1) but make green transparent
          const scaleBg = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920';
          frameFilter += \`;[1:v]\${scaleBg},colorkey=0x00FF00:0.1:0.1[vframe_masked]\`;
          frameFilter += \`;[\${lastFrameStream}][vframe_masked]overlay=0:0[vfinal]\`;
          lastFrameStream = 'vfinal';`
);

fs.writeFileSync(file, content);
console.log("updated");
