const fs = require('fs');
const file = 'c:/Users/gafru/Desktop/filed-work-website/client/src/components/VideoEditor.jsx';
let content = fs.readFileSync(file, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

// 1. Update trimTimelineTimeFromClientX to be target-aware
content = content.replace(
  /const trimTimelineTimeFromClientX = useCallback\(\(clientX\) => \{\s*const el = trimTimelineRef\.current;\s*if \(!el || !duration\) return 0;\s*const rect = el\.getBoundingClientRect\(\);\s*const pct = Math\.max\(0, Math\.min\(1, \(clientX - rect\.left\) \/ rect\.width\)\);\s*return pct \* duration;\s*\}, \[duration\]\);/s,
  `const trimTimelineTimeFromClientX = useCallback((clientX) => {
    const el = trimTimelineRef.current;
    const currentDur = editingTarget === 'vid1' ? duration : video2Duration;
    if (!el || !currentDur) return 0;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pct * currentDur;
  }, [duration, video2Duration, editingTarget]);`
);

// 2. Update handleTrimTimelineClick to seek correct player
content = content.replace(
  /const handleTrimTimelineClick = useCallback\(\(e\) => \{\s*if \(trimDragging\) return;\s*const time = trimTimelineTimeFromClientX\(e\.clientX\);\s*setPlayed\(time\);\s*if \(playerRef\.current\) playerRef\.current\.currentTime = time;\s*\}, \[trimDragging, trimTimelineTimeFromClientX\]\);/s,
  `const handleTrimTimelineClick = useCallback((e) => {
    if (trimDragging) return;
    const time = trimTimelineTimeFromClientX(e.clientX);
    if (editingTarget === 'vid1') {
      setPlayed(time);
      if (playerRef.current) playerRef.current.currentTime = time;
    } else {
      setVideo2Played(time);
      if (player2Ref.current) player2Ref.current.currentTime = time;
    }
  }, [trimDragging, trimTimelineTimeFromClientX, editingTarget]);`
);

// 3. Update trim dragging logic (the useEffect)
content = content.replace(
  'const { trimStart: ts, trimEnd: te } = trimValuesRef.current;',
  `const { trimStart: ts_v1, trimEnd: te_v1 } = trimValuesRef.current;
      const ts = editingTarget === 'vid1' ? ts_v1 : v2TrimStart;
      const te = editingTarget === 'vid1' ? te_v1 : v2TrimEnd;
      const currentDur = editingTarget === 'vid1' ? duration : video2Duration;`
);

content = content.replace(
  'setTrimStart(val);',
  "editingTarget === 'vid1' ? setTrimStart(val) : setV2TrimStart(val);"
);

content = content.replace(
  'if (playerRef.current) playerRef.current.currentTime = val;',
  "if (editingTarget === 'vid1') { if (playerRef.current) playerRef.current.currentTime = val; } else { if (player2Ref.current) player2Ref.current.currentTime = val; }"
);

content = content.replace(
  'setTrimEnd(Math.max(ts + 0.1, Math.min(duration, time)));',
  "editingTarget === 'vid1' ? setTrimEnd(Math.max(ts + 0.1, Math.min(duration, time))) : setV2TrimEnd(Math.max(ts + 0.1, Math.min(currentDur, time)));"
);

// 4. Update the Trim UI slider ranges and values
// Min/Max/Value for Slider 1 (Start)
content = content.replace(
  'type="range" min="0" max={duration} step="0.1"',
  'type="range" min="0" max={editingTarget === "vid1" ? duration : video2Duration} step="0.1"',
  'g'
);

content = content.replace(
  'value={trimStart}',
  'value={editingTarget === "vid1" ? trimStart : v2TrimStart}'
);

content = content.replace(
  'value={trimEnd}',
  'value={editingTarget === "vid1" ? trimEnd : v2TrimEnd}'
);

// Update OnChange for Trim Start range
content = content.replace(
  /onChange=\{\(e\) => \{\s*const val = parseFloat\(e\.target\.value\);\s*if \(val < trimEnd\) \{\s*setTrimStart\(val\);\s*if \(playerRef\.current\) playerRef\.current\.currentTime = val;\s*\}\s*\}\}/s,
  `onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        const curEnd = editingTarget === 'vid1' ? trimEnd : v2TrimEnd;
                        if (val < curEnd) {
                          if (editingTarget === 'vid1') {
                            setTrimStart(val);
                            if (playerRef.current) playerRef.current.currentTime = val;
                          } else {
                            setV2TrimStart(val);
                            if (player2Ref.current) player2Ref.current.currentTime = val;
                          }
                        }
                      }}`
);

// Update OnChange for Trim End range
content = content.replace(
  /onChange=\{\(e\) => \{\s*const val = parseFloat\(e\.target\.value\);\s*if \(val > trimStart\) \{\s*setTrimEnd\(val\);\s*\}\s*\}\}/s,
  `onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        const curStart = editingTarget === 'vid1' ? trimStart : v2TrimStart;
                        if (val > curStart) {
                          if (editingTarget === 'vid1') setTrimEnd(val);
                          else setV2TrimEnd(val);
                        }
                      }}`
);

// 5. Update Trim Progress UI (The timeline visual bars)
content = content.replace(
  'style={{ width: `${duration ? (trimStart / duration) * 100 : 0}%` }}',
  'style={{ width: `${(editingTarget === "vid1" ? duration : video2Duration) ? ((editingTarget === "vid1" ? trimStart : v2TrimStart) / (editingTarget === "vid1" ? duration : video2Duration)) * 100 : 0}%` }}'
);
content = content.replace(
  'style={{\n                          left: `${duration ? (trimStart / duration) * 100 : 0}%`,\n                          width: `${duration ? ((trimEnd - trimStart) / duration) * 100 : 100}%`,\n                        }}',
  'style={{ left: `${(editingTarget === "vid1" ? duration : video2Duration) ? ((editingTarget === "vid1" ? trimStart : v2TrimStart) / (editingTarget === "vid1" ? duration : video2Duration)) * 100 : 0}%`, width: `${(editingTarget === "vid1" ? duration : video2Duration) ? (((editingTarget === "vid1" ? trimEnd : v2TrimEnd) - (editingTarget === "vid1" ? trimStart : v2TrimStart)) / (editingTarget === "vid1" ? duration : video2Duration)) * 100 : 100}%`, }}'
);
// Handles
content = content.replace(
  'style={{ left: `${duration ? (trimStart / duration) * 100 : 0}%` }}',
  'style={{ left: `${(editingTarget === "vid1" ? duration : video2Duration) ? ((editingTarget === "vid1" ? trimStart : v2TrimStart) / (editingTarget === "vid1" ? duration : video2Duration)) * 100 : 0}%` }}'
);
content = content.replace(
  'style={{ left: `${duration ? (trimEnd / duration) * 100 : 100}%` }}',
  'style={{ left: `${(editingTarget === "vid1" ? duration : video2Duration) ? ((editingTarget === "vid1" ? trimEnd : v2TrimEnd) / (editingTarget === "vid1" ? duration : video2Duration)) * 100 : 100}%` }}'
);

fs.writeFileSync(file, content);
console.log("Trim UI updated for target awareness");
