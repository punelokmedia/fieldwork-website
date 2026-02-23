const fs = require('fs');
const file = 'c:/Users/gafru/Desktop/filed-work-website/client/src/components/VideoEditor.jsx';
let content = fs.readFileSync(file, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

// 1. Remove the prepended block
const problematicStart = "const trimTimelineTimeFromClientX = useCallback((clientX) => {";
if (content.startsWith(problematicStart)) {
    const endOfBlock = "}, [duration, video2Duration, editingTarget]);";
    const index = content.indexOf(endOfBlock);
    if (index !== -1) {
        content = content.substring(index + endOfBlock.length);
    }
}

// 2. Ensure imports are clean (remove potential leftover from line 8)
content = content.trimStart();

// 3. Find and replace the old trimTimelineTimeFromClientX inside the component
const oldVersion = `  const trimTimelineTimeFromClientX = useCallback((clientX) => {
    const el = trimTimelineRef.current;
    if (!el || !duration) return 0;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pct * duration;
  }, [duration]);`;

const newVersion = `  const trimTimelineTimeFromClientX = useCallback((clientX) => {
    const el = trimTimelineRef.current;
    const currentDur = editingTarget === 'vid1' ? duration : video2Duration;
    if (!el || !currentDur) return 0;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pct * currentDur;
  }, [duration, video2Duration, editingTarget]);`;

content = content.replace(oldVersion, newVersion);

fs.writeFileSync(file, content);
console.log("Fixed temporal dead zone / import error");
