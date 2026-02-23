const fs = require('fs');
const file = 'c:/Users/gafru/Desktop/filed-work-website/client/src/components/VideoEditor.jsx';
let content = fs.readFileSync(file, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

// 1. Sync Playback of both videos
content = content.replace(
  'const player2Ref = useRef(null);',
  `const player2Ref = useRef(null);
  
  useEffect(() => {
    if (isPlaying) {
      if (playerRef.current) playerRef.current.play().catch(e => console.warn("Player 1 play blocked", e));
      if (player2Ref.current) player2Ref.current.play().catch(e => console.warn("Player 2 play blocked", e));
    } else {
      if (playerRef.current) playerRef.current.pause();
      if (player2Ref.current) player2Ref.current.pause();
    }
  }, [isPlaying]);`
);

// 2. Fix remaining "duration" references in Trim UI that should be target-aware
content = content.replace(
  /style=\{\{ width: `\$\{duration \? \(\(duration - trimEnd\) \/ duration\) \* 100 : 0\}%` \}\}/,
  'style={{ width: `${(editingTarget === "vid1" ? duration : video2Duration) ? (((editingTarget === "vid1" ? duration : video2Duration) - (editingTarget === "vid1" ? trimEnd : v2TrimEnd)) / (editingTarget === "vid1" ? duration : video2Duration)) * 100 : 0}%` }}'
);

content = content.replace(
  '<span>{formatTime(trimStart)} ({trimStart.toFixed(1)}s)</span>',
  '<span>{formatTime(editingTarget === "vid1" ? trimStart : v2TrimStart)} ({(editingTarget === "vid1" ? trimStart : v2TrimStart).toFixed(1)}s)</span>'
);

content = content.replace(
  '<span>{formatTime(trimEnd)} ({trimEnd.toFixed(1)}s)</span>',
  '<span>{formatTime(editingTarget === "vid1" ? trimEnd : v2TrimEnd)} ({(editingTarget === "vid1" ? trimEnd : v2TrimEnd).toFixed(1)}s)</span>'
);

// 3. Add Filter Preview to Video 2
content = content.replace(
  'className="w-full h-auto object-cover bg-black"',
  'className="w-full h-auto object-cover bg-black" style={{ filter: `brightness(${v2Brightness}) contrast(${v2Contrast}) saturate(${v2Saturation})` }}'
);

fs.writeFileSync(file, content);
console.log("Final touch-ups complete");
