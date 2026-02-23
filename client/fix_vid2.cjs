const fs = require('fs');
const file = 'c:/Users/gafru/Desktop/filed-work-website/client/src/components/VideoEditor.jsx';
let content = fs.readFileSync(file, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

// Update vid2 style to include aspectRatio for better fitting
content = content.replace(
  /width: `${vid2Size}%`,\n\s*transform: 'translate\(-50%, -50%\)',/,
  "width: `${vid2Size}%`,\n                        transform: 'translate(-50%, -50%)', aspectRatio: frameMode === 'frame2' ? vid2Aspect : 'auto',"
);

fs.writeFileSync(file, content);
console.log("Updated vid2 aspect ratio");
