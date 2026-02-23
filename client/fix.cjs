const fs = require('fs');
const file = 'c:/Users/gafru/Desktop/filed-work-website/client/src/components/VideoEditor.jsx';
let content = fs.readFileSync(file, 'utf8');

// I'll grab the substring starting from `onEnded={() => setIsPlaying(false)}` 
// down to `/>` that is just before `{frameMode === 'frame1' && (`

const startMarker = 'onEnded={() => setIsPlaying(false)}\n                    onError={(e) => console.error("Video Tag Error:", e)}';
const endMarker = '/>\n\n                  {frameMode === \'frame1\' && (';

let startIndex = content.indexOf('onEnded={() => setIsPlaying(false)}');
let nextClose = content.indexOf('/>', startIndex) + 2;

const replacement = `onEnded={() => setIsPlaying(false)}
                    onError={(e) => console.error("Video Tag Error:", e)}
                    onMouseDown={(e) => frameMode === 'frame2' ? handleDragStart(e, 'vid1') : undefined}
                    onTouchStart={(e) => frameMode === 'frame2' ? handleDragStart(e, 'vid1') : undefined}
                    style={frameMode === 'frame1' ? {
                      left: '2.315%', top: '37.396%', width: '94.167%', height: '61.094%', zIndex: 5,
                      filter: \`brightness(\${brightness}) contrast(\${contrast}) saturate(\${saturation})\`
                    } : frameMode === 'frame2' ? {
                      left: \`\${vid1Pos.x}%\`,
                      top: \`\${vid1Pos.y}%\`,
                      width: \`\${vid1Size}%\`,
                      transform: 'translate(-50%, -50%)',
                      filter: \`brightness(\${brightness}) contrast(\${contrast}) saturate(\${saturation})\`,
                      zIndex: 10,
                      cursor: isDragging ? 'grabbing' : 'grab',
                      border: activeTab === 'layout' ? '2px dashed lime' : 'none'
                    } : {
                      filter: \`brightness(\${brightness}) contrast(\${contrast}) saturate(\${saturation})\`
                    }}
                  />`;

if(startIndex !== -1 && nextClose !== -1) {
    content = content.substring(0, startIndex) + replacement + content.substring(nextClose);
    fs.writeFileSync(file, content);
    console.log("REPLACED SUCCESSFULLY!");
} else {
    console.log("MARKERS NOT FOUND");
}
