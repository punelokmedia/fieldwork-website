const fs = require('fs');
const file = 'c:/Users/gafru/Desktop/filed-work-website/client/src/components/VideoEditor.jsx';
let content = fs.readFileSync(file, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

// 1. Add new states for independent editing
content = content.replace(
  'const [vid2Aspect, setVid2Aspect] = useState(1032 / 732);',
  `const [vid2Aspect, setVid2Aspect] = useState(1032 / 732);
  const [editingTarget, setEditingTarget] = useState('vid1'); // 'vid1' or 'vid2'
  const [v2TrimStart, setV2TrimStart] = useState(0);
  const [v2TrimEnd, setV2TrimEnd] = useState(0);
  const [v2Brightness, setV2Brightness] = useState(1);
  const [v2Contrast, setV2Contrast] = useState(1);
  const [v2Saturation, setV2Saturation] = useState(1);
  const [video2Duration, setVideo2Duration] = useState(0);
  const [video2Played, setVideo2Played] = useState(0);
  const player2Ref = useRef(null);`
);

// 2. Add Toggle UI in the tools sidebar (at the top of sidebar scroll area)
content = content.replace(
  '<div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 min-h-0">',
  `<div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 min-h-0">
          {/* Video Selection for Editing */}
          {frameMode === 'frame2' && (
            <div className="flex flex-col gap-2 p-3 bg-gray-800/50 rounded-xl border border-gray-700 mb-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Editing Input</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingTarget('vid1')}
                  className={\`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 \${editingTarget === 'vid1' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}\`}
                >
                  <Video size={14} />
                  Video 1
                </button>
                <button
                  onClick={() => setEditingTarget('vid2')}
                  disabled={!video2Src}
                  className={\`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 \${editingTarget === 'vid2' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-gray-700 text-gray-400 hover:bg-gray-600 disabled:opacity-30'}\`}
                >
                  <Video size={14} />
                  Video 2
                </button>
              </div>
              {editingTarget === 'vid2' && !video2Src && <p className="text-[9px] text-amber-500 text-center">Open Layout tab to add Video 2</p>}
            </div>
          )}`
);

// 3. Update Trim Tool to use dynamic state
content = content.replace(
  /                  <div className="flex justify-between items-center">\n\s*<span className="text-xs font-semibold text-gray-400 uppercase">Trim Range<\/span>.*?<\/div>/s,
  `                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-400 uppercase">Trim Range ({editingTarget === 'vid1' ? 'Vid 1' : 'Vid 2'})</span>
                    <span className="text-xs font-mono text-red-400">{formatTime(editingTarget === 'vid1' ? trimStart : v2TrimStart)} - {formatTime((editingTarget === 'vid1' ? trimEnd : v2TrimEnd) || (editingTarget === 'vid1' ? duration : video2Duration))}</span>
                  </div>`
);

// Replace trimStart references in the Trim UI block
// This is brittle, let's try a more specific replacement for the trim inputs
// Actually, I'll update the whole trim section logic in next step if it fails.

// 4. Update Filter sliders
content = content.replace(
  'value={brightness} onChange={(e) => setBrightness(parseFloat(e.target.value))}',
  'value={editingTarget === "vid1" ? brightness : v2Brightness} onChange={(e) => editingTarget === "vid1" ? setBrightness(parseFloat(e.target.value)) : setV2Brightness(parseFloat(e.target.value))}'
);
content = content.replace(
  'value={contrast} onChange={(e) => setContrast(parseFloat(e.target.value))}',
  'value={editingTarget === "vid1" ? contrast : v2Contrast} onChange={(e) => editingTarget === "vid1" ? setContrast(parseFloat(e.target.value)) : setV2Contrast(parseFloat(e.target.value))}'
);
content = content.replace(
  'value={saturation} onChange={(e) => setSaturation(parseFloat(e.target.value))}',
  'value={editingTarget === "vid1" ? saturation : v2Saturation} onChange={(e) => editingTarget === "vid1" ? setSaturation(parseFloat(e.target.value)) : setV2Saturation(parseFloat(e.target.value))}'
);

// 5. Update FFmpeg logic for frame2 to apply v2 filters
content = content.replace(
  'frameFilter += `;[2:v]scale=${targetW2}:${targetH2}:force_original_aspect_ratio=increase,crop=${targetW2}:${targetH2}[v2]`;',
  `let v2In = "2:v";
          if (v2TrimStart > 0 || (v2TrimEnd > 0 && v2TrimEnd > v2TrimStart)) {
             // In complex filters, we might need to handle trim differently if multiple inputs.
             // But for now let's just use the scale/crop stage.
          }
          let v2Filters = \`scale=\${targetW2}:\${targetH2}:force_original_aspect_ratio=increase,crop=\${targetW2}:\${targetH2}\`;
          if (v2Brightness !== 1 || v2Contrast !== 1 || v2Saturation !== 1) {
            v2Filters += \`,eq=brightness=\${v2Brightness - 1}:contrast=\${v2Contrast}:saturation=\${v2Saturation}\`;
          }
          frameFilter += \`;[2:v]\${v2Filters}[v2]\`;`
);

// Also need to handle Video 2 Trim in FFmpeg command
// FFmpeg can't easily trim input 2 differently inside a complex filter without -ss/-t on the input itself.
// So let's add -ss/-t to input 2 in cmdFrame.
content = content.replace(
  /if \(video2File\) \{\s*await ffmpeg\.writeFile\('video2\.mp4', await fetchFile\(video2File\)\);\s*cmdFrame\.push\('-i', 'video2\.mp4'\);\s*\}/s,
  `if (video2File) {
            await ffmpeg.writeFile('video2.mp4', await fetchFile(video2File));
            if (v2TrimStart > 0) cmdFrame.push('-ss', v2TrimStart.toString());
            if (v2TrimEnd > 0 && v2TrimEnd > v2TrimStart) cmdFrame.push('-to', v2TrimEnd.toString());
            cmdFrame.push('-i', 'video2.mp4');
          }`
);

// 6. Update Video 2 Ref and Metadata
content = content.replace(
  '<video\n                        src={video2Src}',
  `<video
                        ref={player2Ref}
                        src={video2Src}
                        onLoadedMetadata={(e) => {
                          setVideo2Duration(e.target.duration);
                          if (v2TrimEnd === 0) setV2TrimEnd(e.target.duration);
                        }}
                        onTimeUpdate={(e) => setVideo2Played(e.target.currentTime)}`
);

fs.writeFileSync(file, content);
console.log("Updated for dual video editing tools");
