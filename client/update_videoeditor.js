const fs = require('fs');
const file = 'c:/Users/gafru/Desktop/filed-work-website/client/src/components/VideoEditor.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. State changes
content = content.replace(
  "const [useReelFrame, setUseReelFrame] = useState(false);",
  `const [frameMode, setFrameMode] = useState('none'); // 'none', 'frame1', 'frame2'
  const [video2File, setVideo2File] = useState(null);
  const [video2Src, setVideo2Src] = useState(null);
  const [vid1Pos, setVid1Pos] = useState({ x: 50, y: 25 });
  const [vid1Size, setVid1Size] = useState(80);
  const [vid2Pos, setVid2Pos] = useState({ x: 50, y: 75 });
  const [vid2Size, setVid2Size] = useState(80);`
);

// 2. Drag & Resize additions
content = content.replace(
  "startPosY: target === 'text' ? textPos.y : logoPos.y,",
  "startPosY: target === 'text' ? textPos.y : target === 'logo' ? logoPos.y : target === 'vid1' ? vid1Pos.y : vid2Pos.y,\n      startPosX: target === 'text' ? textPos.x : target === 'logo' ? logoPos.x : target === 'vid1' ? vid1Pos.x : vid2Pos.x,"
);

// Clean duplicate startPosX from above replacement manually:
content = content.replace(
  "startPosX: target === 'text' ? textPos.x : logoPos.x,\n      startPosY: target === 'text' ? textPos.y : target === 'logo' ? logoPos.y : target === 'vid1' ? vid1Pos.y : vid2Pos.y,\n      startPosX: target === 'text' ? textPos.x : target === 'logo' ? logoPos.x : target === 'vid1' ? vid1Pos.x : vid2Pos.x,",
  "startPosX: target === 'text' ? textPos.x : target === 'logo' ? logoPos.x : target === 'vid1' ? vid1Pos.x : vid2Pos.x,\n      startPosY: target === 'text' ? textPos.y : target === 'logo' ? logoPos.y : target === 'vid1' ? vid1Pos.y : vid2Pos.y,"
);

content = content.replace(
  "setTextPos({ x: newX, y: newY });\n    } else if (dragTarget === 'logo') {\n      setLogoPos({ x: newX, y: newY });\n    }",
  "setTextPos({ x: newX, y: newY });\n    } else if (dragTarget === 'logo') {\n      setLogoPos({ x: newX, y: newY });\n    } else if (dragTarget === 'vid1') {\n      setVid1Pos({ x: newX, y: newY });\n    } else if (dragTarget === 'vid2') {\n      setVid2Pos({ x: newX, y: newY });\n    }"
);

content = content.replace(
  "startTextSize: textSize\n    };",
  "startTextSize: textSize,\n      startVid1Size: vid1Size,\n      startVid2Size: vid2Size\n    };"
);

content = content.replace(
  "setTextSize(Math.max(2, Math.min(30, newSize)));\n    }",
  "setTextSize(Math.max(2, Math.min(30, newSize)));\n    } else if (dragTarget === 'vid1') {\n      const newSize = dragContextRef.current.startVid1Size + (deltaPercent * 2);\n      setVid1Size(Math.max(10, Math.min(150, newSize)));\n    } else if (dragTarget === 'vid2') {\n      const newSize = dragContextRef.current.startVid2Size + (deltaPercent * 2);\n      setVid2Size(Math.max(10, Math.min(150, newSize)));\n    }"
);

// Variables dependent on Frame replacing useReelFrame
content = content.replace(/useReelFrame \?/g, "(frameMode !== 'none') ?");
content = content.replace(/!useReelFrame/g, "frameMode === 'none'");

content = content.replace(
  "if (useReelFrame) {",
  "if (frameMode === 'frame1') {"
);

// We need to add FFmpeg handling for frameMode === 'frame2'
content = content.replace(
  "// Handle normal export formats if frame is not used\n      else {",
  `// Handle Frame 2 (2 Videos)
      else if (frameMode === 'frame2') {
        setProgress(90);
        try {
          await ffmpeg.writeFile('frame2.jpg', await fetchFile('/images/frame.jpg'));
          let cmdFrame = ['-i', outName, '-i', 'frame2.jpg'];
          if (video2File) {
            await ffmpeg.writeFile('video2.mp4', await fetchFile(video2File));
            cmdFrame.push('-i', 'video2.mp4');
          }

          let frameFilter = '';
          let nextFrameIdx = video2File ? 3 : 2;
          let lastFrameStream = 'vbase';

          // Background frame scaled to reel size
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
          }

          if (logoWritten) {
            cmdFrame.push('-i', 'logo.png');
            const targetWidth = 1080 * (logoSize / 100);
            let w = Math.round(targetWidth); if (w % 2 !== 0) w += 1;
            const opacityVal = logoOpacity / 100;
            frameFilter += \`;[\${nextFrameIdx}:v]format=rgba,colorchannelmixer=aa=\${opacityVal},scale=\${w}:-1[logo];[\${lastFrameStream}][logo]overlay=x=(W*\${logoPos.x}/100-w/2):y=(H*\${logoPos.y}/100-h/2)[vlogo]\`;
            lastFrameStream = 'vlogo';
            nextFrameIdx++;
          }
          if (text) {
            cmdFrame.push('-i', 'text_overlay.png');
            frameFilter += \`;[\${lastFrameStream}][\${nextFrameIdx}:v]overlay=0:0[vtext]\`;
            lastFrameStream = 'vtext';
          }

          cmdFrame.push(
            '-filter_complex', frameFilter,
            '-map', \`[\${lastFrameStream}]\`,
            '-map', '0:a?',
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '28',
            '-pix_fmt', 'yuv420p',
            '-r', '30',
            '-c:a', 'aac',
            'export_framed.mp4'
          );

          let returnCode = await ffmpeg.exec(cmdFrame);
          if (returnCode !== 0) throw new Error('Frame 2 overlay failed.');
          finalOutName = 'export_framed.mp4';
        } catch (overlayErr) {
          console.error("Frame 2 overlay error:", overlayErr);
        }
      }
      else {`
);

// HTML Changes
content = content.replace(
  `{useReelFrame && (
                    <img
                      src="/images/rell.png"
                      alt="Reel Frame Overlay"
                      className="absolute inset-0 z-10 w-full h-full object-fill pointer-events-none"
                    />
                  )}`,
  `{frameMode === 'frame1' && (
                    <img
                      src="/images/rell.png"
                      alt="Reel Frame Overlay"
                      className="absolute inset-0 z-10 w-full h-full object-fill pointer-events-none"
                    />
                  )}
                  {frameMode === 'frame2' && (
                    <img
                      src="/images/frame.jpg"
                      alt="Frame 2 Background"
                      className="absolute inset-0 z-0 w-full h-full object-cover pointer-events-none"
                    />
                  )}`
);

content = content.replace(
  `className={useReelFrame ? "absolute object-cover bg-black" : "max-h-[600px] w-auto h-auto object-contain"}`,
  `className={frameMode !== 'none' ? "absolute object-cover bg-black" : "max-h-[600px] w-auto h-auto object-contain"}`
);

content = content.replace(
  `style={useReelFrame ? {
                      left: '2.315%', top: '37.396%', width: '94.167%', height: '61.094%',
                      filter: \`brightness(\${brightness}) contrast(\${contrast}) saturate(\${saturation})\`
                    } : {`,
  `style={frameMode === 'frame1' ? {
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
                    } : {`
);

// Add event handlers for vid1 if frameMode=frame2 
content = content.replace(
  `style={frameMode === 'frame1' ? {`, // actually we need to add onMouseDown to the video element itself if layout mode
  `style={frameMode === 'frame1' ? {`
);

content = content.replace(
  `onEnded={() => setIsPlaying(false)}
                    onError={(e) => console.error("Video Tag Error:", e)}
                    style={`,
  `onEnded={() => setIsPlaying(false)}
                    onError={(e) => console.error("Video Tag Error:", e)}
                    onMouseDown={(e) => frameMode === 'frame2' && handleDragStart(e, 'vid1')}
                    onTouchStart={(e) => frameMode === 'frame2' && handleDragStart(e, 'vid1')}
                    style={`
);

// Add video2
content = content.replace(
  `{frameMode === 'frame2' && (
                    <img
                      src="/images/frame.jpg"
                      alt="Frame 2 Background"
                      className="absolute inset-0 z-0 w-full h-full object-cover pointer-events-none"
                    />
                  )}`,
  `{frameMode === 'frame2' && (
                    <img
                      src="/images/frame.jpg"
                      alt="Frame 2 Background"
                      className="absolute inset-0 z-0 w-full h-full object-cover pointer-events-none"
                    />
                  )}
                  {frameMode === 'frame2' && video2Src && (
                    <div
                      className="absolute z-10"
                      style={{
                        left: \`\${vid2Pos.x}%\`,
                        top: \`\${vid2Pos.y}%\`,
                        width: \`\${vid2Size}%\`,
                        transform: 'translate(-50%, -50%)',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        border: activeTab === 'layout' ? '2px dashed lime' : 'none'
                      }}
                      onMouseDown={(e) => handleDragStart(e, 'vid2')}
                      onTouchStart={(e) => handleDragStart(e, 'vid2')}
                    >
                      <video
                        src={video2Src}
                        className="w-full h-auto object-contain bg-black"
                        muted
                        loop
                        autoPlay
                        playsInline
                      />
                      {activeTab === 'layout' && (
                        <div
                          className="absolute -bottom-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-2 border-white cursor-se-resize flex items-center justify-center shadow-md z-30 pointer-events-auto"
                          onMouseDown={(e) => handleResizeStart(e, 'vid2')}
                          onTouchStart={(e) => handleResizeStart(e, 'vid2')}
                        >
                          <Maximize size={12} className="text-white pointer-events-none" />
                        </div>
                      )}
                    </div>
                  )}
                  {frameMode === 'frame2' && activeTab === 'layout' && (
                    <div
                      className="absolute pointer-events-none z-20"
                      style={{
                        left: \`\${vid1Pos.x}%\`,
                        top: \`\${vid1Pos.y}%\`,
                        width: \`\${vid1Size}%\`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                       <div
                          className="absolute -bottom-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-2 border-white cursor-se-resize flex items-center justify-center shadow-md z-30 pointer-events-auto"
                          onMouseDown={(e) => handleResizeStart(e, 'vid1')}
                          onTouchStart={(e) => handleResizeStart(e, 'vid1')}
                        >
                          <Maximize size={12} className="text-white pointer-events-none" />
                        </div>
                    </div>
                  )}
`
);

content = content.replace(
  `<div className="flex border-b border-gray-700 bg-gray-800 shrink-0 overflow-x-auto">
          {['trim', 'crop', 'filter', 'text', 'logo', 'clips', 'split', 'audio'].map(tab => {`,
  `<div className="flex border-b border-gray-700 bg-gray-800 shrink-0 overflow-x-auto">
          {['trim', 'layout', 'crop', 'filter', 'text', 'logo', 'clips', 'split', 'audio'].map(tab => {
            if (tab === 'layout') {
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={\`flex-1 min-w-[52px] py-1.5 md:py-3 flex flex-col items-center gap-1 text-[10px] sm:text-xs font-medium uppercase tracking-wider transition-all border-b-2 \${activeTab === tab ? 'border-red-500 text-red-500 bg-red-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}\`}
                >
                  <Columns3 size={16} />
                  <span>Layout</span>
                </button>
              );
            }`
);

content = content.replace(
  `{activeTab === 'trim' && (`,
  `{activeTab === 'layout' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Select Frame Layout</label>
                <select
                  value={frameMode}
                  onChange={(e) => setFrameMode(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-red-500"
                >
                  <option value="none">Default (No Frame)</option>
                  <option value="frame1">Pune Lok Reel Frame (rell.png)</option>
                  <option value="frame2">Dual Video Frame (frame.jpg)</option>
                </select>
              </div>

              {frameMode === 'frame2' && (
                <div className="space-y-4 pt-4 border-t border-gray-700">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Video 2 (Secondary)</label>
                    <div className="flex items-center gap-2">
                       <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                             setVideo2File(file);
                             setVideo2Src(URL.createObjectURL(file));
                          }
                        }}
                        className="hidden"
                        id="video2-upload"
                      />
                      <label htmlFor="video2-upload" className="flex-1 py-4 border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-red-500 hover:text-red-400 transition-colors bg-gray-700/30">
                        <Video size={24} />
                        <span className="text-xs">{video2File ? "Change Video 2" : "Select Video 2"}</span>
                      </label>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                    <p className="text-xs text-blue-200">
                      <strong>Tip:</strong> You can drag the videos directly on the preview to position them, and use the corner handle to resize them.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'trim' && (`
);

fs.writeFileSync(file, content);
console.log("Done");
