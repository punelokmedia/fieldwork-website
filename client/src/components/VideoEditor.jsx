import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import Cropper from 'react-easy-crop';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import {
  Play, Pause, Scissors, Music, Download, Type, Sliders,
  Loader2, Check, X, Volume2, Image as ImageIcon, Maximize, Film, Video, ImagePlus, Crop as CropIcon, MousePointer2, Columns3, AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';

const VIDEO_CROP_MIN_ZOOM = 1;
const VIDEO_CROP_MAX_ZOOM = 4;

function formatTime(sec) {
  if (sec == null || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')} `;
}

const VideoEditor = ({ file, onSave, onCancel }) => {
  const [ffmpeg] = useState(new FFmpeg());
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Video State
  const [videoSrc, setVideoSrc] = useState(null);
  const [duration, setDuration] = useState(0);
  const [played, setPlayed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const playerRef = useRef(null);

  // Edit State
  const [activeTab, setActiveTab] = useState('trim'); // trim, filter, text, audio
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0); // Default to 0 (auto-detect)

  // Filters
  const [brightness, setBrightness] = useState(1); // 1 is default for ffmpeg eq
  const [contrast, setContrast] = useState(1);
  const [saturation, setSaturation] = useState(1);

  // Audio State
  const [audioFile, setAudioFile] = useState(null);
  const [audioVolume, setAudioVolume] = useState(1);
  const [videoVolume, setVideoVolume] = useState(1);

  // Text Overlay
  const [text, setText] = useState('');
  const [textHtml, setTextHtml] = useState('');
  const textEditorRef = useRef(null);
  const selectedTextRangeRef = useRef(null); // to keep selection across inputs
  const [textColor, setTextColor] = useState('white');
  const [textSize, setTextSize] = useState(5); // Percentage of video height
  const [textAlign, setTextAlign] = useState('center');
  const [language, setLanguage] = useState('Marathi');
  const [textPos, setTextPos] = useState({ x: 50, y: 80 }); // Percentage 0-100
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragTarget, setDragTarget] = useState(null); // 'text' or 'logo'
  const dragContextRef = useRef(null);

  // Logo Overlay
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoPos, setLogoPos] = useState({ x: 10, y: 10 }); // Percentage
  const [logoSize, setLogoSize] = useState(15); // Percentage of width
  const [logoOpacity, setLogoOpacity] = useState(100); // Percentage 0-100

  // Clips (video or image) - can add multiple to include in project
  const [clips, setClips] = useState([]); // [{ id, file, type: 'video'|'image', previewUrl }]

  const [exportFormat, setExportFormat] = useState('original');
  const [useReelFrame, setUseReelFrame] = useState(false);

  // Video crop (zoom/pan like image) — applied in FFmpeg
  const [videoCrop, setVideoCrop] = useState({ x: 0, y: 0 });
  const [videoZoom, setVideoZoom] = useState(1);
  const [videoCroppedAreaPixels, setVideoCroppedAreaPixels] = useState(null);
  const [videoCroppedAreaPercent, setVideoCroppedAreaPercent] = useState(null);
  const [videoCropAspect, setVideoCropAspect] = useState('free'); // free, 1:1, 9:16, 16:9
  const [cropPreviewSrc, setCropPreviewSrc] = useState(null); // one frame for Cropper UI
  const videoCropperRef = useRef(null);
  // Select-area crop (drag rectangle + handles) — like Image Editor
  const [videoCropMode, setVideoCropMode] = useState('moveZoom'); // 'moveZoom' | 'select'
  const [videoSelectionCrop, setVideoSelectionCrop] = useState(undefined);

  // Split video — split points (seconds), export segments
  const [splitPoints, setSplitPoints] = useState([]); // sorted ascending, e.g. [30, 60]
  const [splitExporting, setSplitExporting] = useState(false);
  const [excludedSegments, setExcludedSegments] = useState(() => new Set()); // keys "start-end" for segments to exclude from export

  const containerRef = useRef(null);
  const clipsInputRef = useRef(null);
  const splitTimeInputRef = useRef(null);
  const splitTimelineRef = useRef(null);
  const trimTimelineRef = useRef(null);
  const [trimDragging, setTrimDragging] = useState(null); // 'start' | 'end' | null
  const trimValuesRef = useRef({ trimStart: 0, trimEnd: 0 });
  trimValuesRef.current = { trimStart, trimEnd };
  const clipsRef = useRef(clips);
  clipsRef.current = clips;

  const applyColorToSelection = useCallback((color) => {
    setTextColor(color);
    if (!textEditorRef.current) return;

    textEditorRef.current.focus();

    const sel = window.getSelection();
    if (selectedTextRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(selectedTextRangeRef.current);
    }

    document.execCommand('styleWithCSS', false, true);
    document.execCommand('foreColor', false, color);

    // Store current text again
    setTextHtml(textEditorRef.current.innerHTML);
    setText(textEditorRef.current.innerText || textEditorRef.current.textContent);
  }, []);

  // Load FFmpeg
  useEffect(() => {
    // Prevent re-loading if already loaded or running
    if (loaded) return;

    const load = async () => {
      // 1. Critical Environment Check
      if (!window.crossOriginIsolated) {
        setLoadError("Server Config Error: SharedArrayBuffer is missing. COOP/COEP headers required.");
        return;
      }

      try {
        setLoadError(null);
        console.log("Initializing Video Engine...");

        // 2. Try Local Load
        try {
          const baseURL = `${window.location.origin}/ffmpeg`;
          console.log("Attempting Local Load:", baseURL);

          // Validate existence
          const resp = await fetch(`${baseURL}/ffmpeg-core.js`, { method: 'HEAD' });
          if (!resp.ok) throw new Error("Local file missing");

          await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
          });
          console.log("Success: Loaded from Local.");
        } catch (localErr) {
          console.warn("Local Load Failed:", localErr);
          console.log("Attempting Default CDN Load...");

          // 3. Fallback: Use default params (usually unpkg)
          await ffmpeg.load();
          console.log("Success: Loaded from CDN.");
        }

        setLoaded(true);
      } catch (e) {
        console.error("Critical Load Error:", e);
        // Better error extraction
        const msg = (e && e.message) ? e.message : (typeof e === 'string' ? e : JSON.stringify(e));
        setLoadError(`Engine Failure: ${msg || "Unknown Error"}`);
      }
    };

    load();
  }, [ffmpeg, loaded]);

  // Load Video File
  useEffect(() => {
    if (file) {
      if (typeof file === 'string') {
        setVideoSrc(file);
        console.log("Video source set to URL:", file);
      } else if (file instanceof File || file instanceof Blob) {
        const url = URL.createObjectURL(file);
        setVideoSrc(url);
        console.log("Video source set to Blob:", url);
      } else {
        console.error("Invalid file type passed to editor:", file);
      }
    }
  }, [file]);

  // Capture one video frame for crop preview when Crop tab is active
  useEffect(() => {
    if (activeTab !== 'crop' || !videoSrc) {
      if (cropPreviewSrc) {
        URL.revokeObjectURL(cropPreviewSrc);
        setCropPreviewSrc(null);
      }
      return;
    }
    const video = playerRef.current;
    if (!video) return;
    const capture = () => {
      try {
        const w = video.videoWidth || videoDimensions.width;
        const h = video.videoHeight || videoDimensions.height;
        if (!w || !h) return;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, w, h);
        canvas.toBlob((blob) => {
          if (blob) setCropPreviewSrc(URL.createObjectURL(blob));
        }, 'image/jpeg', 0.92);
      } catch (e) {
        console.warn('Crop preview capture failed', e);
      }
    };
    if (video.readyState >= 2) {
      capture();
    } else {
      video.addEventListener('loadeddata', capture, { once: true });
      return () => video.removeEventListener('loadeddata', capture);
    }
  }, [activeTab, videoSrc, videoDimensions.width, videoDimensions.height]);

  const onVideoCropAreaChange = useCallback((croppedArea, croppedAreaPixels) => {
    setVideoCroppedAreaPercent(croppedArea);
    setVideoCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Focus cropper for arrow keys when Crop tab active and preview ready
  useEffect(() => {
    if (activeTab !== 'crop' || !cropPreviewSrc) return;
    const t = setTimeout(() => {
      const el = videoCropperRef.current?.current ?? videoCropperRef.current;
      if (el && typeof el.focus === 'function') el.focus({ preventScroll: true });
    }, 400);
    return () => clearTimeout(t);
  }, [activeTab, cropPreviewSrc]);

  const focusVideoCropper = () => {
    const el = videoCropperRef.current?.current ?? videoCropperRef.current;
    if (el && typeof el.focus === 'function') el.focus({ preventScroll: true });
  };

  // Arrow keys: when Cropper not focused, focus it and move crop manually so export stays correct
  useEffect(() => {
    if (activeTab !== 'crop' || !cropPreviewSrc) return;
    const step = 16;
    const handleKeyDown = (e) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const el = videoCropperRef.current?.current ?? videoCropperRef.current;
      if (!el) return;
      if (document.activeElement === el) return; // Cropper handles it
      e.preventDefault();
      e.stopPropagation();
      el.focus({ preventScroll: true });
      const newCrop = { ...videoCrop };
      switch (e.key) {
        case 'ArrowUp': newCrop.y -= step; break;
        case 'ArrowDown': newCrop.y += step; break;
        case 'ArrowLeft': newCrop.x -= step; break;
        case 'ArrowRight': newCrop.x += step; break;
        default: return;
      }
      setVideoCrop(newCrop);
      // Sync crop area for export: map crop box (container coords) to media pixels using zoom and translation
      requestAnimationFrame(() => {
        const container = el.parentElement;
        if (!container || !videoDimensions.width || !videoDimensions.height) return;
        const cr = container.getBoundingClientRect();
        const cropRect = el.getBoundingClientRect();
        const cw = cr.width;
        const ch = cr.height;
        const vw = videoDimensions.width;
        const vh = videoDimensions.height;
        const scale = Math.min(cw / vw, ch / vh);
        const offsetX = (cw - vw * scale) / 2;
        const offsetY = (ch - vh * scale) / 2;
        const eff = scale * videoZoom;
        const px = (cropRect.left - cr.left - offsetX - newCrop.x) / eff;
        const py = (cropRect.top - cr.top - offsetY - newCrop.y) / eff;
        const pw = cropRect.width / eff;
        const ph = cropRect.height / eff;
        const x = Math.max(0, Math.min(px, vw - 2));
        const y = Math.max(0, Math.min(py, vh - 2));
        const w = Math.max(2, Math.min(pw, vw - x));
        const h = Math.max(2, Math.min(ph, vh - y));
        setVideoCroppedAreaPixels({ x, y, width: w, height: h });
        setVideoCroppedAreaPercent({
          x: (x / vw) * 100,
          y: (y / vh) * 100,
          width: (w / vw) * 100,
          height: (h / vh) * 100
        });
      });
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [activeTab, cropPreviewSrc, videoCrop]);

  // Sync Play State
  useEffect(() => {
    if (playerRef.current) {
      if (isPlaying) playerRef.current.play().catch(e => console.error("Play error:", e));
      else playerRef.current.pause();
    }
  }, [isPlaying]);

  // Polling for duration as backup
  useEffect(() => {
    if (!videoSrc || duration > 0) return;

    const interval = setInterval(() => {
      if (playerRef.current) {
        const d = playerRef.current.duration; // Native
        if (d && !isNaN(d) && d > 0) {
          handleDuration(d);
          clearInterval(interval);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [videoSrc, duration]);

  // Revoke clip preview URLs on unmount
  useEffect(() => {
    return () => {
      (clipsRef.current || []).forEach(c => { if (c.previewUrl) URL.revokeObjectURL(c.previewUrl); });
    };
  }, []);

  // Skip excluded segments when they're excluded or when playback enters them
  useEffect(() => {
    if (!duration || excludedSegments.size === 0) return;
    const seg = getSegmentAtTime(played);
    if (seg && isSegmentExcluded(seg.start, seg.end)) {
      const nextTime = getNextIncludedTime(played);
      if (nextTime < duration && playerRef.current) {
        playerRef.current.currentTime = nextTime;
        setPlayed(nextTime);
      }
    }
  }, [excludedSegments, played, duration, splitPoints]);

  // Drag Logic
  const handleDragStart = (e, target) => {
    // Only prevent default if it's left click or touch
    if (e.type !== 'touchstart' && e.button !== 0) return;
    setIsDragging(true);
    setDragTarget(target);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragContextRef.current = {
      startX: clientX,
      startY: clientY,
      startPosX: target === 'text' ? textPos.x : logoPos.x,
      startPosY: target === 'text' ? textPos.y : logoPos.y,
    };
  };

  const handleDragMove = useCallback((e) => {
    if (!isDragging || !containerRef.current || !dragTarget || !dragContextRef.current) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = containerRef.current.getBoundingClientRect();

    const deltaX = ((clientX - dragContextRef.current.startX) / rect.width) * 100;
    const deltaY = ((clientY - dragContextRef.current.startY) / rect.height) * 100;

    let newX = dragContextRef.current.startPosX + deltaX;
    let newY = dragContextRef.current.startPosY + deltaY;
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));

    if (dragTarget === 'text') {
      setTextPos({ x: newX, y: newY });
    } else if (dragTarget === 'logo') {
      setLogoPos({ x: newX, y: newY });
    }
  }, [isDragging, dragTarget, textPos, logoPos]); // Added textPos, logoPos to dependencies

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragTarget(null);
  };

  // Resize Logic
  const handleResizeStart = (e, target) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setDragTarget(target);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragContextRef.current = {
      startX: clientX,
      startY: clientY,
      startLogoSize: logoSize,
      startTextSize: textSize
    };
  };

  const handleResizeMove = useCallback((e) => {
    if (!isResizing || !containerRef.current || !dragTarget || !dragContextRef.current) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = clientX - dragContextRef.current.startX;
    const deltaPercent = (deltaX / rect.width) * 100;

    if (dragTarget === 'logo') {
      const newSize = dragContextRef.current.startLogoSize + (deltaPercent * 2);
      setLogoSize(Math.max(5, Math.min(90, newSize)));
    } else if (dragTarget === 'text') {
      const newSize = dragContextRef.current.startTextSize + (deltaPercent / 1.5);
      setTextSize(Math.max(2, Math.min(30, newSize)));
    }
  }, [isResizing, dragTarget, logoSize, textSize]); // Added logoSize, textSize to dependencies

  const handleResizeEnd = () => {
    setIsResizing(false);
    setDragTarget(null);
  };

  // Global listeners for smoother drag and resize
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
    } else if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      window.addEventListener('touchmove', handleResizeMove);
      window.addEventListener('touchend', handleResizeEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);

      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
      window.removeEventListener('touchmove', handleResizeMove);
      window.removeEventListener('touchend', handleResizeEnd);
    };
  }, [isDragging, isResizing, handleDragMove, handleResizeMove]);

  const handleProcessVideo = async () => {
    if (!loaded) return;
    setProcessing(true);

    try {
      // Write file to memory
      try {
        await ffmpeg.writeFile('input.mp4', await fetchFile(file));
        console.log("Success: Wrote input.mp4");
      } catch (writeErr) {
        throw new Error("Failed to write input video to memory: " + writeErr.message);
      }

      // If user excluded some segments in Split, export only included segments (concat them first)
      const allSegs = getSegments();
      const includedSegs = allSegs.filter(seg => !excludedSegments.has(segmentKey(seg.start, seg.end)));
      const useSplitExport = excludedSegments.size > 0 && includedSegs.length > 0;
      let videoInputFile = 'input.mp4';
      let applyTrim = true;

      if (excludedSegments.size > 0 && includedSegs.length === 0) {
        alert('No segments included. Add back at least one segment or remove split points, then export.');
        setProcessing(false);
        return;
      }

      if (useSplitExport) {
        setProgress(5);
        for (let i = 0; i < includedSegs.length; i++) {
          const { start, end } = includedSegs[i];
          const segName = `split_seg_${i}.mp4`;
          const ret = await ffmpeg.exec(['-ss', String(start), '-to', String(end), '-i', 'input.mp4', '-c', 'copy', segName]);
          if (ret !== 0) throw new Error(`Split segment ${i + 1} failed.`);
          setProgress(5 + Math.round(((i + 1) / includedSegs.length) * 15));
        }
        const listContent = includedSegs.map((_, i) => `file 'split_seg_${i}.mp4'`).join('\n');
        await ffmpeg.writeFile('split_list.txt', listContent);
        const ret = await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'split_list.txt', '-c', 'copy', 'input_trimmed.mp4']);
        if (ret !== 0) throw new Error('Concat of split segments failed.');
        videoInputFile = 'input_trimmed.mp4';
        applyTrim = false; // trimmed video is already the "keep" part
        setProgress(22);
      }

      // Let's reconstruct the command with complex filters more robustly
      const cmd = [];
      let filterComplex = [];
      let lastVideoStream = '0:v'; // Start with the main video input stream
      let currentInputIndex = 1; // For additional inputs (logo, audio)

      // Input seeking for trim (fast) — only when not using split-export
      if (applyTrim && trimStart > 0) cmd.push('-ss', trimStart.toString());
      if (applyTrim && trimEnd > 0 && trimEnd > trimStart) cmd.push('-to', trimEnd.toString());

      cmd.push('-i', videoInputFile);

      // Add Logo Input
      let logoWritten = false;
      if (logoFile) {
        try {
          await ffmpeg.writeFile('logo.png', await fetchFile(logoFile));
          console.log("Success: Wrote logo.png");
          cmd.push('-i', 'logo.png'); // Input 1
          currentInputIndex++;
          logoWritten = true;
        } catch (logoErr) {
          console.error("Failed to write logo file:", logoErr);
        }
      }

      // Add Audio Input
      let audioWritten = false;
      if (audioFile) {
        try {
          await ffmpeg.writeFile('music.mp3', await fetchFile(audioFile));
          console.log("Success: Wrote music.mp3");
          cmd.push('-i', 'music.mp3'); // Input 2 (or 1 if no logo)
          currentInputIndex++;
          audioWritten = true;
        } catch (audioErr) {
          console.error("Failed to write audio file:", audioErr);
        }
      }

      // 1. EQ Filter
      if (brightness !== 1 || contrast !== 1 || saturation !== 1) {
        let eqFilter = `eq=brightness=${brightness - 1}:contrast=${contrast}:saturation=${saturation}`;
        filterComplex.push(`[${lastVideoStream}]${eqFilter}[v_eq]`);
        lastVideoStream = 'v_eq';
      }

      // 2. Text (Drawtext) - can be part of the chain
      // 2. Text (Drawtext) - can be part of the chain
      // 2. Text Overlay (via Canvas -> PNG)
      // We generate an image of the text using the browser's canvas (proper font shaping)
      // and overlay that image. This fixes Devanagari rendering issues.
      let textInputIndex = -1;

      const baseTextCanvasW = useReelFrame ? 1080 : (videoDimensions.width || 1280);
      const baseTextCanvasH = useReelFrame ? 1920 : (videoDimensions.height || 720);

      if (text) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = baseTextCanvasW;
          canvas.height = baseTextCanvasH;
          const ctx = canvas.getContext('2d');

          if (!ctx) throw new Error("Could not create canvas context");

          // Calculate font size
          const fontSizePx = (baseTextCanvasH * textSize) / 100;
          ctx.font = `bold ${fontSizePx}px Arial, sans-serif`;
          ctx.textBaseline = 'middle';
          ctx.textAlign = 'left'; // Always left because we calculate drawX per word manually

          // Shadow
          ctx.shadowColor = 'black';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          // Text Wrapping Logic
          // Calculate max available width based on center position to avoid cutting
          const margin = baseTextCanvasW * 0.05;
          const availableLeft = (baseTextCanvasW * textPos.x) / 100 - margin;
          const availableRight = baseTextCanvasW - ((baseTextCanvasW * textPos.x) / 100) - margin;
          const maxWidth = Math.min(availableLeft, availableRight) * 2;

          const tempDiv = document.createElement('div');
          // Replace manual newlines with <br> to preserve formatting if there's no HTML
          tempDiv.innerHTML = textHtml || text.replace(/\n/g, '<br>');

          let textSegments = [];
          function traverse(node, currentColor) {
            if (node.nodeType === Node.TEXT_NODE) {
              // Keep spaces intact but break at spaces for wrapping
              const words = node.textContent.split(/( |\t)/);
              words.forEach(w => {
                if (w !== '') textSegments.push({ text: w, color: currentColor });
              });
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              let color = currentColor;
              if (node.tagName === 'FONT' && node.color) color = node.color;
              if (node.style && node.style.color) color = node.style.color;

              const isBlock = ['DIV', 'P', 'BR'].includes(node.tagName);

              // Handle implicitly broken lines
              if (isBlock && textSegments.length > 0 && textSegments[textSegments.length - 1].text !== '\n') {
                textSegments.push({ text: '\n', color: currentColor });
              }

              node.childNodes.forEach(child => traverse(child, color));

              if (['DIV', 'P'].includes(node.tagName) && textSegments.length > 0 && textSegments[textSegments.length - 1].text !== '\n') {
                textSegments.push({ text: '\n', color: currentColor });
              }
            }
          }
          traverse(tempDiv, textColor);

          let lines = [];
          let currentLine = [];
          let currentLineWidth = 0;

          textSegments.forEach(seg => {
            if (seg.text === '\n') {
              lines.push(currentLine);
              currentLine = [];
              currentLineWidth = 0;
              return;
            }
            const w = ctx.measureText(seg.text).width;
            if (currentLineWidth + w > maxWidth && currentLine.length > 0 && !seg.text.match(/^\s+$/)) {
              lines.push(currentLine);
              currentLine = [seg];
              currentLineWidth = w;
            } else {
              currentLine.push(seg);
              currentLineWidth += w;
            }
          });
          if (currentLine.length > 0) lines.push(currentLine);

          // Draw Text
          const centerX = (baseTextCanvasW * textPos.x) / 100;
          const centerY = (baseTextCanvasH * textPos.y) / 100;
          const lineHeight = fontSizePx * 1.2;

          lines.forEach((lineSegments, i) => {
            const y = centerY + (i - (lines.length - 1) / 2) * lineHeight;
            let lineWidth = lineSegments.reduce((sum, seg) => sum + ctx.measureText(seg.text).width, 0);
            let drawX = centerX;

            if (textAlign === 'left') drawX = centerX - maxWidth / 2;
            else if (textAlign === 'right') drawX = centerX + maxWidth / 2 - lineWidth;
            else drawX = centerX - lineWidth / 2; // center

            lineSegments.forEach(seg => {
              ctx.fillStyle = seg.color;
              ctx.fillText(seg.text, drawX, y);
              drawX += ctx.measureText(seg.text).width;
            });
          });

          // Convert to Blob
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
          await ffmpeg.writeFile('text_overlay.png', await fetchFile(blob));
          console.log("Success: Generated and wrote text_overlay.png");

          // We need to add this input to the command, but we construct 'cmd' below.
          // Just mark that we have text.

        } catch (e) {
          console.error("Text Canvas Error:", e);
          throw new Error("Failed to render text overlay: " + e.message);
        }
      }

      // Re-map inputs for complex filter
      // Inputs:
      // 0: Video
      // Logo? -> index 1
      // Audio? -> index 2 (or 1)
      // Text? -> index 3 (or 2 or 1)

      let nextInputIdx = 1;
      let logoIdx = -1;
      let audioIdx = -1;
      let textIdx = -1;

      // Reset CMD inputs to be clean
      cmd.length = 0;
      // Seek/Trim options must be before input 0
      if (applyTrim && trimStart > 0) cmd.push('-ss', trimStart.toString());
      if (applyTrim && trimEnd > 0 && trimEnd > trimStart) cmd.push('-to', trimEnd.toString());
      cmd.push('-i', videoInputFile); // 0

      if (logoWritten && !useReelFrame) {
        cmd.push('-i', 'logo.png');
        logoIdx = nextInputIdx++;
      }
      if (audioWritten) {
        cmd.push('-i', 'music.mp3');
        audioIdx = nextInputIdx++;
      }
      if (text && !useReelFrame) {
        cmd.push('-i', 'text_overlay.png');
        textIdx = nextInputIdx++;
      }

      // FILTER CHAIN
      // 0. Video crop — zoom/pan (moveZoom) or select-area (select) like Image Editor
      const W = videoDimensions.width || 1280;
      const H = videoDimensions.height || 720;
      let cropX, cropY, cropW, cropH;
      if (videoCropMode === 'select' && videoSelectionCrop?.width && videoSelectionCrop?.height) {
        if (videoSelectionCrop.unit === '%') {
          cropX = (videoSelectionCrop.x / 100) * W;
          cropY = (videoSelectionCrop.y / 100) * H;
          cropW = (videoSelectionCrop.width / 100) * W;
          cropH = (videoSelectionCrop.height / 100) * H;
        } else {
          const scaleX = W / (videoDimensions.width || W);
          const scaleY = H / (videoDimensions.height || H);
          cropX = videoSelectionCrop.x * scaleX;
          cropY = videoSelectionCrop.y * scaleY;
          cropW = videoSelectionCrop.width * scaleX;
          cropH = videoSelectionCrop.height * scaleY;
        }
      } else if (videoCroppedAreaPixels && videoCroppedAreaPixels.width > 0 && videoCroppedAreaPixels.height > 0) {
        cropX = videoCroppedAreaPixels.x;
        cropY = videoCroppedAreaPixels.y;
        cropW = videoCroppedAreaPixels.width;
        cropH = videoCroppedAreaPixels.height;
      } else if (videoCroppedAreaPercent && videoCroppedAreaPercent.width > 0 && videoCroppedAreaPercent.height > 0) {
        cropX = (videoCroppedAreaPercent.x / 100) * W;
        cropY = (videoCroppedAreaPercent.y / 100) * H;
        cropW = (videoCroppedAreaPercent.width / 100) * W;
        cropH = (videoCroppedAreaPercent.height / 100) * H;
      }
      if (cropX != null && cropW > 0 && cropH > 0) {
        let x = Math.round(cropX);
        let y = Math.round(cropY);
        let w = Math.round(cropW);
        let h = Math.round(cropH);
        x = Math.max(0, Math.min(x, W - 2));
        y = Math.max(0, Math.min(y, H - 2));
        w = Math.max(2, Math.min(w, W - x));
        h = Math.max(2, Math.min(h, H - y));
        if (w % 2 !== 0) w -= 1;
        if (h % 2 !== 0) h -= 1;
        filterComplex.push(`[${lastVideoStream}]crop=${w}:${h}:${x}:${y}[v_crop]`);
        lastVideoStream = 'v_crop';
      }

      // 1. EQ
      if (brightness !== 1 || contrast !== 1 || saturation !== 1) {
        let eqFilter = `eq=brightness=${brightness - 1}:contrast=${contrast}:saturation=${saturation}`;
        filterComplex.push(`[${lastVideoStream}]${eqFilter}[v_eq]`);
        lastVideoStream = 'v_eq';
      }

      // 2. Logo Overlay
      if (logoWritten && !useReelFrame) {
        const targetWidth = videoDimensions.width * (logoSize / 100);
        let w = Math.round(targetWidth);
        if (w % 2 !== 0) w += 1; // Even width

        // Handle opacity with colorchannelmixer
        const opacityVal = logoOpacity / 100;

        filterComplex.push(`[${logoIdx}:v]format=rgba,colorchannelmixer=aa=${opacityVal},scale=${w}:-1[logo]`);
        filterComplex.push(`[${lastVideoStream}][logo]overlay=x=(W*${logoPos.x}/100-w/2):y=(H*${logoPos.y}/100-h/2)[v_logo]`);
        lastVideoStream = 'v_logo';
      }

      // 3. Text Overlay (Image)
      if (text && !useReelFrame) {
        // Overlay at 0:0 since canvas matches video size
        filterComplex.push(`[${lastVideoStream}][${textIdx}:v]overlay=0:0[v_text]`);
        lastVideoStream = 'v_text';
      }

      // 4. Audio Mixing
      if (audioWritten) {
        filterComplex.push(`[0:a]volume=${videoVolume}[a1]`);
        filterComplex.push(`[${audioIdx}:a]volume=${audioVolume}[a2]`);
        filterComplex.push(`[a1][a2]amix=inputs=2:duration=first[aout]`);

        filterComplex.push(`[${lastVideoStream}]format=yuv420p[v_final]`);
        lastVideoStream = 'v_final';

        cmd.push('-map', `[${lastVideoStream}]`);
        cmd.push('-map', '[aout]');
      } else {
        filterComplex.push(`[${lastVideoStream}]format=yuv420p[v_final]`);
        lastVideoStream = 'v_final';

        cmd.push('-map', `[${lastVideoStream}]`);
        cmd.push('-map', '0:a');
      }

      if (filterComplex.length > 0) {
        cmd.push('-filter_complex', filterComplex.join(';'));
      }

      // Encoding: when we have clips, output main as segment0 then concat; else single output
      // Use fixed 30fps so clips match main video frame base — smooth concat, no delay
      const MAIN_FPS = 30;
      const hasClips = clips.length > 0;
      const mainOutput = hasClips ? 'segment0.mp4' : 'output.mp4';
      cmd.push('-c:v', 'libx264');
      cmd.push('-preset', 'ultrafast');
      cmd.push('-r', String(MAIN_FPS));
      cmd.push('-vsync', 'cfr');
      cmd.push(mainOutput);

      console.log('Running FFmpeg (main):', cmd.join(' '));

      ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg Log]:', message);
      });

      ffmpeg.on('progress', ({ progress }) => {
        let p = hasClips ? Math.round(progress * 30) : Math.round(progress * 100);
        if (useSplitExport) p = 22 + Math.round(p * 0.78);
        setProgress(p);
      });

      let returnCode = await ffmpeg.exec(cmd);
      if (returnCode !== 0) {
        throw new Error(`FFmpeg exited with code ${returnCode}. Check console for details.`);
      }

      if (hasClips) {
        // Same frame size as main video — clips match video basis; even dimensions for libx264
        let w = videoDimensions.width || 1280;
        let h = videoDimensions.height || 720;
        if (w % 2 !== 0) w += 1;
        if (h % 2 !== 0) h += 1;
        const MAIN_FPS_CLIP = 30;
        const scalePad = `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1`;
        const scaleFps = `${scalePad},fps=${MAIN_FPS_CLIP}`;
        const IMAGE_CLIP_DURATION = 3;

        for (let i = 0; i < clips.length; i++) {
          const clip = clips[i];
          const segName = `segment${i + 1}.mp4`;
          const ext = clip.type === 'video' ? (clip.file.name.toLowerCase().endsWith('.webm') ? 'webm' : 'mp4') : (clip.file.name.toLowerCase().endsWith('.png') ? 'png' : 'jpg');
          const clipName = `clip_${i}.${ext}`;
          setProgress(30 + Math.round(((i + 0.5) / clips.length) * 50));

          await ffmpeg.writeFile(clipName, await fetchFile(clip.file));

          if (clip.type === 'image') {
            returnCode = await ffmpeg.exec([
              '-loop', '1', '-i', clipName,
              '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', String(IMAGE_CLIP_DURATION),
              '-filter_complex', `[0:v]${scaleFps}[v]`, '-map', '[v]', '-map', '1:a',
              '-shortest', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
              '-r', String(MAIN_FPS_CLIP), '-vsync', 'cfr',
              segName
            ]);
          } else {
            returnCode = await ffmpeg.exec([
              '-i', clipName,
              '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
              '-filter_complex', `[0:v]${scaleFps}[v]`, '-map', '[v]', '-map', '1:a', '-shortest',
              '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
              '-r', String(MAIN_FPS_CLIP), '-vsync', 'cfr',
              segName
            ]);
          }
          if (returnCode !== 0) throw new Error(`Clip segment ${i + 1} failed.`);
        }

        const listLines = ['file \'segment0.mp4\'', ...clips.map((_, i) => `file 'segment${i + 1}.mp4'`)];
        await ffmpeg.writeFile('list.txt', listLines.join('\n'));
        setProgress(85);
        returnCode = await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-fflags', '+genpts', '-c', 'copy', 'output.mp4']);
        if (returnCode !== 0) throw new Error('Concat failed.');
        setProgress(100);
      }

      let outName = hasClips ? 'output.mp4' : mainOutput;

      // Apply export format: Reel (9:16), YouTube (16:9), or Thumbnail (single frame image)
      if (exportFormat === 'thumbnail') {
        returnCode = await ffmpeg.exec(['-i', outName, '-vframes', '1', '-f', 'image2', '-c:v', 'png', 'thumbnail.png']);
        if (returnCode !== 0) throw new Error('Thumbnail extract failed.');
        const thumbData = await ffmpeg.readFile('thumbnail.png');
        const thumbBlob = new Blob([thumbData.buffer], { type: 'image/png' });
        const thumbFile = new File([thumbBlob], 'thumbnail.png', { type: 'image/png' });
        onSave(thumbFile);
        return;
      }

      // Reel/YouTube: crop-to-fill (no black bars) — scale up to fill frame then center crop
      let finalOutName = outName;

      // Handle custom Pune Lok Frame overlay
      if (useReelFrame) {
        setProgress(90);
        try {
          // Add Pune Lok frame overlay
          await ffmpeg.writeFile('rell.png', await fetchFile('/images/rell.png'));

          let cmdFrame = ['-i', outName, '-i', 'rell.png'];
          let frameFilter = '';
          let nextFrameIdx = 2;
          let lastFrameStream = 'vbase';

          // The transparent window in rell.png is approximately at x=25, y=718 with width=1017, height=1173
          const scaleCropPad = 'scale=1017:1173:force_original_aspect_ratio=increase,crop=1017:1173,pad=1080:1920:25:718:black';
          frameFilter += `[0:v]${scaleCropPad}[vbase];[vbase][1:v]overlay=0:0[vframe]`;
          lastFrameStream = 'vframe';

          if (logoWritten) {
            cmdFrame.push('-i', 'logo.png');
            const targetWidth = 1080 * (logoSize / 100);
            let w = Math.round(targetWidth);
            if (w % 2 !== 0) w += 1;

            const opacityVal = logoOpacity / 100;
            frameFilter += `;[${nextFrameIdx}:v]format=rgba,colorchannelmixer=aa=${opacityVal},scale=${w}:-1[logo];[${lastFrameStream}][logo]overlay=x=(W*${logoPos.x}/100-w/2):y=(H*${logoPos.y}/100-h/2)[vlogo]`;
            lastFrameStream = 'vlogo';
            nextFrameIdx++;
          }
          if (text) {
            cmdFrame.push('-i', 'text_overlay.png');
            frameFilter += `;[${lastFrameStream}][${nextFrameIdx}:v]overlay=0:0[vtext]`;
            lastFrameStream = 'vtext';
          }

          cmdFrame.push(
            '-filter_complex', frameFilter,
            '-map', `[${lastFrameStream}]`,
            '-map', '0:a?',
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '28',
            '-pix_fmt', 'yuv420p',
            '-r', '30',
            '-c:a', 'aac',
            'export_framed.mp4'
          );

          returnCode = await ffmpeg.exec(cmdFrame);
          if (returnCode !== 0) throw new Error('Frame overlay failed.');
          finalOutName = 'export_framed.mp4';
        } catch (overlayErr) {
          console.error("Frame overlay error:", overlayErr);
        }
      }
      // Handle normal export formats if frame is not used
      else {
        if (exportFormat === 'reel') {
          const scaleCrop = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920';
          returnCode = await ffmpeg.exec(['-i', outName, '-vf', scaleCrop, '-map', '0:v', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', 'export_reel.mp4']);
          if (returnCode !== 0) throw new Error('Reel export failed.');
          finalOutName = 'export_reel.mp4';
        } else if (exportFormat === 'youtube') {
          const scaleCrop = 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080';
          returnCode = await ffmpeg.exec(['-i', outName, '-vf', scaleCrop, '-map', '0:v', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', 'export_youtube.mp4']);
          if (returnCode !== 0) throw new Error('YouTube export failed.');
          finalOutName = 'export_youtube.mp4';
        }
      }

      // Always append outerframe.mp4 at the end of the video IF IT HASN'T BEEN APPENDED ALREADY
      const alreadyHasOutro = file.name.includes('_with_outro');
      if (!alreadyHasOutro) {
        try {
          setProgress(95);
          await ffmpeg.writeFile('outerframe.mp4', await fetchFile('/images/outerframe.mp4'));

          let targetW = 1280; let targetH = 720;
          if (exportFormat === 'reel') { targetW = 1080; targetH = 1920; }
          else if (exportFormat === 'youtube') { targetW = 1920; targetH = 1080; }
          else if (exportFormat === 'original') {
            targetW = videoDimensions.width || 1280; targetH = videoDimensions.height || 720;
            if (targetW % 2 !== 0) targetW += 1; if (targetH % 2 !== 0) targetH += 1;
          }

          const scalePad = `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30`;

          // First attempt: concatenate with audio
          let concatRes = await ffmpeg.exec([
            '-i', finalOutName,
            '-i', 'outerframe.mp4',
            '-filter_complex', `[0:v]${scalePad}[v0]; [1:v]${scalePad}[v1]; [v0][0:a][v1][1:a]concat=n=2:v=1:a=1[v][a]`,
            '-map', '[v]', '-map', '[a]',
            '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-pix_fmt', 'yuv420p',
            '-c:a', 'aac',
            'final_with_outro.mp4'
          ]);

          if (concatRes !== 0) {
            console.log("Audio concat failed, trying video-only concat fallback...");
            // Fallback: concatenate video only (if either video lies missing audio)
            concatRes = await ffmpeg.exec([
              '-i', finalOutName,
              '-i', 'outerframe.mp4',
              '-filter_complex', `[0:v]${scalePad}[v0]; [1:v]${scalePad}[v1]; [v0][v1]concat=n=2:v=1:a=0[v]`,
              '-map', '[v]',
              '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-pix_fmt', 'yuv420p',
              'final_with_outro.mp4'
            ]);
          }

          if (concatRes === 0) {
            finalOutName = 'final_with_outro.mp4';
          } else {
            console.warn("Outerframe append failed, using base file.");
          }
        } catch (e) {
          console.error("Failure while appending outer frame:", e);
        }
      }

      const data = await ffmpeg.readFile(finalOutName);
      const blob = new Blob([data.buffer], { type: 'video/mp4' });

      let finalDownloadName = exportFormat === 'reel' ? 'reel.mp4' : exportFormat === 'youtube' ? 'youtube.mp4' : 'edited_video.mp4';
      if (!finalDownloadName.includes('_with_outro')) {
        finalDownloadName = finalDownloadName.replace('.mp4', '_with_outro.mp4');
      }

      const editedFile = new File([blob], finalDownloadName, { type: 'video/mp4' });

      onSave(editedFile);

    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      alert(`Processing failed: ${msg}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDuration = (d) => {
    setDuration(d);
    // Update trim end if it's default (0) or invalid
    if (trimEnd === 0 || trimEnd > d) {
      setTrimEnd(d);
    }
  };

  // Trim timeline: get time from mouse X
  const trimTimelineTimeFromClientX = useCallback((clientX) => {
    const el = trimTimelineRef.current;
    if (!el || !duration) return 0;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pct * duration;
  }, [duration]);

  const handleTrimTimelineClick = useCallback((e) => {
    if (trimDragging) return;
    const time = trimTimelineTimeFromClientX(e.clientX);
    setPlayed(time);
    if (playerRef.current) playerRef.current.currentTime = time;
  }, [trimDragging, trimTimelineTimeFromClientX]);

  useEffect(() => {
    if (!trimDragging) return;
    const onMove = (e) => {
      const time = trimTimelineTimeFromClientX(e.clientX);
      const { trimStart: ts, trimEnd: te } = trimValuesRef.current;
      if (trimDragging === 'start') {
        const val = Math.max(0, Math.min(time, te - 0.1));
        setTrimStart(val);
        if (playerRef.current) playerRef.current.currentTime = val;
      } else {
        setTrimEnd(Math.max(ts + 0.1, Math.min(duration, time)));
      }
    };
    const onUp = () => setTrimDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [trimDragging, trimTimelineTimeFromClientX, duration]);

  const addClips = (e) => {
    const chosen = e.target.files;
    if (!chosen?.length) return;
    const newClips = [];
    for (let i = 0; i < chosen.length; i++) {
      const file = chosen[i];
      const type = file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : null;
      if (!type) continue;
      const previewUrl = URL.createObjectURL(file);
      newClips.push({ id: `${Date.now()}-${i}-${file.name}`, file, type, previewUrl });
    }
    setClips(prev => [...prev, ...newClips]);
    e.target.value = '';
  };

  const removeClip = (id) => {
    setClips(prev => {
      const clip = prev.find(c => c.id === id);
      if (clip?.previewUrl) URL.revokeObjectURL(clip.previewUrl);
      return prev.filter(c => c.id !== id);
    });
  };

  // Split: get segments from split points and duration
  const getSegments = () => {
    if (!duration || duration <= 0) return [];
    const pts = [...splitPoints].filter(t => t > 0 && t < duration).sort((a, b) => a - b);
    const segs = [];
    let start = 0;
    for (const end of pts) {
      if (end > start) segs.push({ start, end });
      start = end;
    }
    if (start < duration) segs.push({ start, end: duration });
    return segs.length ? segs : [{ start: 0, end: duration }];
  };

  const addSplitAtCurrent = () => {
    const t = played;
    if (t <= 0 || t >= duration) return;
    setSplitPoints(prev => [...prev, t].sort((a, b) => a - b));
  };

  const addSplitAtTime = (sec) => {
    const t = parseFloat(sec);
    if (isNaN(t) || t <= 0 || t >= duration) return;
    setSplitPoints(prev => [...prev, t].sort((a, b) => a - b));
  };

  const removeSplitPoint = (at) => {
    setSplitPoints(prev => prev.filter(t => Math.abs(t - at) > 0.01));
  };

  const seekTo = (t) => {
    let time = Math.max(0, Math.min(duration, t));
    // If seeking to excluded segment, jump to next included segment
    const seg = getSegmentAtTime(time);
    if (seg && isSegmentExcluded(seg.start, seg.end)) {
      // If in excluded segment, jump to its end or next included start
      const nextTime = getNextIncludedTime(time);
      time = nextTime < duration ? nextTime : seg.end;
    }
    setPlayed(time);
    if (playerRef.current) playerRef.current.currentTime = time;
  };

  const handleSplitTimelineClick = (e) => {
    const el = splitTimelineRef.current;
    if (!el || !duration) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const time = pct * duration;
    seekTo(time);
  };

  const addSplitAtTimelinePosition = (e) => {
    e.stopPropagation();
    const el = splitTimelineRef.current;
    if (!el || !duration) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const time = pct * duration;
    if (time > 0.1 && time < duration - 0.1) addSplitAtTime(time);
  };

  const sortedSplitPoints = [...splitPoints].filter(t => t > 0 && t < duration).sort((a, b) => a - b);

  const segmentKey = (start, end) => `${Number(start).toFixed(2)}-${Number(end).toFixed(2)}`;
  const isSegmentExcluded = (start, end) => excludedSegments.has(segmentKey(start, end));
  const excludeSegment = (start, end) => setExcludedSegments(prev => new Set(prev).add(segmentKey(start, end)));
  const includeSegment = (start, end) => setExcludedSegments(prev => {
    const next = new Set(prev);
    next.delete(segmentKey(start, end));
    return next;
  });

  // Find which segment a time falls into
  const getSegmentAtTime = (time) => {
    const segs = getSegments();
    return segs.find(seg => time >= seg.start && time < seg.end);
  };

  // Find next included segment start time (or end of video)
  const getNextIncludedTime = (currentTime) => {
    const segs = getSegments();
    for (const seg of segs) {
      if (seg.start > currentTime && !isSegmentExcluded(seg.start, seg.end)) {
        return seg.start;
      }
    }
    return duration; // No next included segment, go to end
  };

  // Skip excluded segments during playback
  const skipExcludedSegments = useCallback((currentTime) => {
    if (!duration || excludedSegments.size === 0) return;
    const seg = getSegmentAtTime(currentTime);
    if (seg && isSegmentExcluded(seg.start, seg.end)) {
      const nextTime = getNextIncludedTime(currentTime);
      if (nextTime < duration && playerRef.current) {
        playerRef.current.currentTime = nextTime;
        setPlayed(nextTime);
      } else if (playerRef.current) {
        // No more included segments, pause
        playerRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [excludedSegments, duration, splitPoints]);

  const exportSegmentAsFile = async (start, end, index) => {
    if (!loaded || !file) return;
    setSplitExporting(true);
    try {
      await ffmpeg.writeFile('input.mp4', await fetchFile(file));
      const outName = `segment_${index}.mp4`;
      await ffmpeg.exec(['-ss', String(start), '-to', String(end), '-i', 'input.mp4', '-c', 'copy', outName]);
      const data = await ffmpeg.readFile(outName);
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video_segment_${index + 1}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Segment export failed: ' + (e?.message || String(e)));
    } finally {
      setSplitExporting(false);
    }
  };

  const exportAllSegments = async () => {
    const segs = getSegments().filter(seg => !isSegmentExcluded(seg.start, seg.end));
    if (!segs.length) return;
    if (!loaded || !file) return;
    setSplitExporting(true);
    try {
      await ffmpeg.writeFile('input.mp4', await fetchFile(file));
      let exportIndex = 0;
      for (const { start, end } of segs) {
        const outName = `segment_${exportIndex}.mp4`;
        await ffmpeg.exec(['-ss', String(start), '-to', String(end), '-i', 'input.mp4', '-c', 'copy', outName]);
        const data = await ffmpeg.readFile(outName);
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `video_segment_${exportIndex + 1}.mp4`;
        a.click();
        URL.revokeObjectURL(url);
        exportIndex++;
      }
    } catch (e) {
      console.error(e);
      alert('Export failed: ' + (e?.message || String(e)));
    } finally {
      setSplitExporting(false);
    }
  };

  const includedSegmentCount = getSegments().filter(seg => !isSegmentExcluded(seg.start, seg.end)).length;

  return (


    <div className="flex flex-col md:flex-row h-full w-full bg-gray-900 text-white min-h-0 font-sans">
      {/* Main Preview Area - 45% height on mobile, flex-1 on desktop */}
      <div className="w-full md:flex-1 h-[45%] md:h-full bg-black relative flex flex-col items-center justify-center overflow-hidden order-1 md:order-2 min-h-0 p-4">
        {loadError ? (
          <div className="text-center p-8 bg-red-900/20 border border-red-500/50 rounded-xl max-w-md">
            <p className="text-red-400 font-bold mb-2">Editor Engine Failed to Load</p>
            <p className="text-gray-400 text-sm mb-4">{loadError}</p>
            <p className="text-xs text-gray-500">Please check your internet connection and try again.</p>
          </div>
        ) : (
          <>
            {videoSrc && (
              <>
                {activeTab === 'crop' && cropPreviewSrc ? (
                  videoCropMode === 'select' ? (
                    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden bg-black">
                      <p className="text-xs text-white/80 mb-2 text-center px-2">
                        Image ki tarah: video frame par <strong>drag</strong> karke box banayein, phir <strong>corners/handles</strong> se resize karein.
                      </p>
                      <div className="flex-1 min-h-0 w-full flex items-center justify-center">
                        <div className="inline-block max-w-full max-h-full min-w-0 flex items-center justify-center min-h-[280px]">
                          <ReactCrop
                            crop={videoSelectionCrop}
                            onChange={(pixelCrop, percentCrop) => {
                              if (!percentCrop || (percentCrop.width <= 0 || percentCrop.height <= 0)) {
                                setVideoSelectionCrop(percentCrop || pixelCrop);
                                return;
                              }
                              const x = Math.max(0, Math.min(100, percentCrop.x));
                              const y = Math.max(0, Math.min(100, percentCrop.y));
                              const w = Math.max(1, Math.min(100 - x, percentCrop.width));
                              const h = Math.max(1, Math.min(100 - y, percentCrop.height));
                              setVideoSelectionCrop({ ...percentCrop, unit: '%', x, y, width: w, height: h });
                            }}
                            style={{ lineHeight: 0, display: 'block', width: '100%', height: '100%' }}
                            className="[&_.ReactCrop__child-wrapper]:!block [&_.ReactCrop__crop-selection]:outline-[3px] [&_.ReactCrop__crop-selection]:outline-white [&_.ReactCrop__drag-handle]:!bg-white"
                          >
                            <img
                              src={cropPreviewSrc}
                              alt="Crop"
                              className="block max-w-full max-h-full object-contain select-none"
                              style={{ maxHeight: 'min(70vh, 500px)' }}
                              draggable={false}
                            />
                          </ReactCrop>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer outline-none"
                      title="Pehle yahan click karein, phir arrow keys se crop move karein. Drag bhi kar sakte hain."
                      tabIndex={0}
                      onClick={focusVideoCropper}
                      onKeyDown={(e) => { if (e.target === e.currentTarget) focusVideoCropper(); }}
                    >
                      <Cropper
                        image={cropPreviewSrc}
                        crop={videoCrop}
                        zoom={videoZoom}
                        aspect={videoCropAspect === 'free' ? (videoDimensions.width && videoDimensions.height ? videoDimensions.width / videoDimensions.height : 16 / 9) : videoCropAspect === '1:1' ? 1 : videoCropAspect === '9:16' ? 9 / 16 : 16 / 9}
                        onCropChange={setVideoCrop}
                        onCropComplete={onVideoCropAreaChange}
                        onZoomChange={setVideoZoom}
                        minZoom={VIDEO_CROP_MIN_ZOOM}
                        maxZoom={VIDEO_CROP_MAX_ZOOM}
                        objectFit="contain"
                        keyboardStep={16}
                        className="max-h-[600px] max-w-full"
                        cropperProps={{ tabIndex: 0, 'aria-label': 'Video crop – click here then use arrow keys to move' }}
                        setCropperRef={(ref) => { videoCropperRef.current = ref?.current ?? ref; }}
                      />
                    </div>
                  )
                ) : null}
                <div
                  ref={containerRef}
                  className={`relative shadow-2xl rounded-xl overflow-hidden border border-gray-800 flex items-center justify-center max-w-full max-h-[600px] ${useReelFrame ? 'bg-transparent h-full w-auto aspect-[9/16]' : 'bg-black w-full'}`}
                  style={{
                    display: activeTab === 'crop' ? 'none' : 'flex'
                  }}
                >
                  <video
                    ref={playerRef}
                    key={videoSrc}
                    src={videoSrc}
                    className={useReelFrame ? "absolute object-cover bg-black" : "max-h-[600px] w-auto h-auto object-contain"}
                    controls={false}
                    playsInline
                    preload="auto"
                    crossOrigin="anonymous"
                    onLoadedMetadata={(e) => {
                      console.log("Metadata Loaded:", e.target.duration, e.target.videoWidth, e.target.videoHeight);
                      if (e.target.duration && isFinite(e.target.duration)) {
                        handleDuration(e.target.duration);
                      }
                      setVideoDimensions({ width: e.target.videoWidth, height: e.target.videoHeight });
                    }}
                    onTimeUpdate={(e) => {
                      const currentTime = e.target.currentTime;
                      setPlayed(currentTime);
                      if (excludedSegments.size > 0) {
                        skipExcludedSegments(currentTime);
                      }
                    }}
                    onEnded={() => setIsPlaying(false)}
                    onError={(e) => console.error("Video Tag Error:", e)}
                    style={useReelFrame ? {
                      left: '2.315%', top: '37.396%', width: '94.167%', height: '61.094%',
                      filter: `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`
                    } : {
                      filter: `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`
                    }}
                  />

                  {useReelFrame && (
                    <img
                      src="/images/rell.png"
                      alt="Reel Frame Overlay"
                      className="absolute inset-0 z-10 w-full h-full object-fill pointer-events-none"
                    />
                  )}

                  {/* Overlay Text Preview */}
                  {text && (
                    <div
                      className="absolute z-20 select-none pointer-events-none"
                      style={{
                        left: `${textPos.x}%`,
                        top: `${textPos.y}%`,
                        transform: 'translate(-50%, -50%)',
                        width: `${Math.min(textPos.x, 100 - textPos.x) * 2}%`,
                      }}
                    >
                      <div
                        className="font-bold drop-shadow-lg leading-tight mx-auto block relative whitespace-pre-wrap pointer-events-auto w-full"
                        style={{
                          color: textColor,
                          textAlign: textAlign,
                          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                          maxWidth: '100%',
                          border: activeTab === 'text' ? '2px dashed rgba(255,255,255,0.5)' : 'none',
                          padding: '4px',
                          fontSize: containerRef.current ? `${(containerRef.current.clientHeight * textSize) / 100}px` : '24px',
                          wordBreak: 'break-word',
                          cursor: isDragging ? 'grabbing' : 'grab'
                        }}
                        onMouseDown={(e) => handleDragStart(e, 'text')}
                        onTouchStart={(e) => handleDragStart(e, 'text')}
                        dangerouslySetInnerHTML={{ __html: textHtml || text.replace(/\n/g, '<br>') }}
                      />
                      {activeTab === 'text' && (
                        <div
                          className="absolute -bottom-2 -right-2 w-5 h-5 bg-red-500 rounded-full border-2 border-white cursor-se-resize flex items-center justify-center shadow-md z-30 pointer-events-auto"
                          onMouseDown={(e) => handleResizeStart(e, 'text')}
                          onTouchStart={(e) => handleResizeStart(e, 'text')}
                        >
                          <Maximize size={10} className="text-white pointer-events-none" />
                        </div>
                      )}
                    </div>
                  )}
                  {logoPreview && (
                    <div
                      className="absolute z-20 select-none"
                      style={{
                        left: `${logoPos.x}%`,
                        top: `${logoPos.y}%`,
                        width: `${logoSize}%`,
                        opacity: logoOpacity / 100,
                        transform: 'translate(-50%, -50%)',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        border: activeTab === 'logo' ? '2px dashed deepskyblue' : 'none',
                      }}
                      onMouseDown={(e) => handleDragStart(e, 'logo')}
                      onTouchStart={(e) => handleDragStart(e, 'logo')}
                    >
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="w-full h-auto object-contain pointer-events-none drop-shadow-lg"
                      />
                      {/* Resize Handle */}
                      {activeTab === 'logo' && (
                        <div
                          className="absolute -bottom-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-2 border-white cursor-se-resize flex items-center justify-center shadow-md z-30 pointer-events-auto"
                          onMouseDown={(e) => handleResizeStart(e, 'logo')}
                          onTouchStart={(e) => handleResizeStart(e, 'logo')}
                        >
                          <Maximize size={12} className="text-white pointer-events-none" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Play Controls - Overlay on mobile, below on desktop */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded-full z-30 md:relative md:bottom-auto md:left-auto md:translate-x-0 md:bg-transparent md:mt-4">
              <button onClick={() => setIsPlaying(!isPlaying)} className="p-1.5 bg-red-600 rounded-full hover:bg-red-700 transition">
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <div className="text-[10px] sm:text-sm font-mono self-center">
                {played.toFixed(1)}s / {duration.toFixed(1)}s
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sidebar Controls - 55% height on mobile, fixed width on desktop */}
      <div className="w-full md:w-96 h-[55%] md:h-full bg-gray-800 border-r md:border-l border-gray-700 flex flex-col order-2 md:order-1 relative z-10 shadow-xl md:shadow-none min-h-0 overflow-hidden">
        <div className="px-6 py-2.5 md:py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
          <h2 className="text-lg md:text-xl font-bold text-white">Video Editor</h2>
          {loadError ? (
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400" title={loadError}>
                Error
              </span>
              <button onClick={() => window.location.reload()} className="text-xs underline text-red-400 hover:text-red-300">Retry</button>
            </div>
          ) : (
            <span className={`text-xs px-2 py-1 rounded-full ${loaded ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400 animate-pulse'}`}>
              {loaded ? 'Ready' : 'Loading Engine...'}
            </span>
          )}
        </div>

        {/* Tabs - Sticky at top of sidebar */}
        <div className="flex border-b border-gray-700 bg-gray-800 shrink-0 overflow-x-auto">
          {['trim', 'crop', 'filter', 'text', 'logo', 'clips', 'split', 'audio'].map(tab => {
            const icons = { trim: Scissors, crop: CropIcon, filter: Sliders, text: Type, logo: ImageIcon, clips: Film, split: Columns3, audio: Music };
            const Icon = icons[tab];
            const label = tab === 'clips' ? 'Clips' : tab === 'crop' ? 'Crop' : tab === 'split' ? 'Split' : tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[52px] py-1.5 md:py-3 flex flex-col items-center gap-1 text-[10px] sm:text-xs font-medium uppercase tracking-wider transition-all border-b-2 ${activeTab === tab ? 'border-red-500 text-red-500 bg-red-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
              >
                <Icon size={16} />
                <span>{label}{tab === 'clips' && clips.length > 0 ? ` (${clips.length})` : tab === 'split' && splitPoints.length > 0 ? ` (${splitPoints.length})` : ''}</span>
              </button>
            )
          })}
        </div>


        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 min-h-0">
          {activeTab === 'trim' && (
            <div className="space-y-6">
              {duration === 0 ? (
                <div className="text-center py-10 text-gray-500 animate-pulse">
                  <Loader2 size={32} className="mx-auto mb-2 animate-spin" />
                  <p>Loading Video Metadata...</p>

                  <div className="flex flex-col items-center gap-2 mt-4">
                    <button onClick={() => {
                      if (playerRef.current) {
                        const d = playerRef.current.duration;
                        if (d && isFinite(d) && d > 0) handleDuration(d);
                        else {
                          alert("Metadata not ready. Try playing manually or using manual override.");
                          playerRef.current.load();
                        }
                      }
                    }} className="text-xs underline text-red-400 pointer-events-auto cursor-pointer relative z-10">
                      Force Load Metadata
                    </button>

                    <div className="pt-4 border-t border-gray-700/50 w-full max-w-[200px]">
                      <p className="text-[10px] uppercase tracking-wider mb-2">Manual Override</p>
                      <input
                        type="number"
                        className="bg-gray-800 border border-gray-600 rounded px-3 py-2 w-full text-center text-sm focus:border-red-500 outline-none"
                        placeholder="Duration (sec)"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseFloat(e.target.value);
                            if (val > 0) handleDuration(val);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[11px] text-gray-500">Bich se bhi crop kar sakte hain: in/out handles ko drag karein. Click bar par seek.</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                      <span>{formatTime(0)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                    <div
                      ref={trimTimelineRef}
                      onClick={handleTrimTimelineClick}
                      className="relative h-10 rounded-lg bg-gray-700 border border-gray-600 cursor-pointer overflow-hidden select-none"
                    >
                      {/* Dimmed: before start */}
                      <div
                        className="absolute top-0 bottom-0 left-0 bg-gray-800/80"
                        style={{ width: `${duration ? (trimStart / duration) * 100 : 0}%` }}
                      />
                      {/* Kept: between start and end */}
                      <div
                        className="absolute top-0 bottom-0 bg-green-600/40 border-x border-green-500/50"
                        style={{
                          left: `${duration ? (trimStart / duration) * 100 : 0}%`,
                          width: `${duration ? ((trimEnd - trimStart) / duration) * 100 : 100}%`,
                        }}
                      />
                      {/* Dimmed: after end */}
                      <div
                        className="absolute top-0 bottom-0 right-0 bg-gray-800/80"
                        style={{ width: `${duration ? ((duration - trimEnd) / duration) * 100 : 0}%` }}
                      />
                      {/* Start handle */}
                      <div
                        className="absolute top-0 bottom-0 w-3 -ml-1.5 z-10 flex items-center cursor-ew-resize group"
                        style={{ left: `${duration ? (trimStart / duration) * 100 : 0}%` }}
                        onMouseDown={(e) => { e.stopPropagation(); setTrimDragging('start'); }}
                        title="Start — drag"
                      >
                        <span className="w-1 h-full bg-green-500 group-hover:bg-green-400 rounded-full" />
                      </div>
                      {/* End handle */}
                      <div
                        className="absolute top-0 bottom-0 w-3 -ml-1.5 z-10 flex items-center justify-end cursor-ew-resize group"
                        style={{ left: `${duration ? (trimEnd / duration) * 100 : 100}%` }}
                        onMouseDown={(e) => { e.stopPropagation(); setTrimDragging('end'); }}
                        title="End — drag"
                      >
                        <span className="w-1 h-full bg-green-500 group-hover:bg-green-400 rounded-full" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase flex justify-between">Start <span>{formatTime(trimStart)} ({trimStart.toFixed(1)}s)</span></label>
                    <input
                      type="range" min="0" max={duration} step="0.1"
                      value={trimStart}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (val < trimEnd) {
                          setTrimStart(val);
                          if (playerRef.current) playerRef.current.currentTime = val;
                        }
                      }}
                      className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase flex justify-between">End <span>{formatTime(trimEnd)} ({trimEnd.toFixed(1)}s)</span></label>
                    <input
                      type="range" min="0" max={duration} step="0.1"
                      value={trimEnd}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (val > trimStart) setTrimEnd(val);
                      }}
                      className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                  </div>
                  <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 text-center">
                    <p className="text-sm text-gray-300">Keep: <span className="font-bold text-white">{formatTime(trimStart)} – {formatTime(trimEnd)}</span> ({(trimEnd - trimStart).toFixed(1)}s)</p>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'crop' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Crop kaise karein</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVideoCropMode('moveZoom')}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 ${videoCropMode === 'moveZoom' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                  >
                    <Maximize size={14} /> Zoom in/out
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoCropMode('select');
                      if (!videoSelectionCrop?.width && videoDimensions.width) {
                        setVideoSelectionCrop({ unit: '%', x: 25, y: 25, width: 50, height: 50 });
                      }
                    }}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 ${videoCropMode === 'select' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                  >
                    <MousePointer2 size={14} /> Select area
                  </button>
                </div>
                <p className="text-[10px] text-gray-500">
                  {videoCropMode === 'select' ? 'Bich se bhi crop kar sakte hain — drag karke area kahin bhi select karein, corners se resize.' : 'Video ko drag/zoom karke position karein, arrow keys se move. Bich se bhi crop kar sakte hain.'}
                </p>
              </div>
              {videoCropMode === 'moveZoom' && (
                <>
                  <p className="text-[10px] text-amber-400/90 bg-amber-500/10 px-2 py-1.5 rounded">Arrow se move: pehle <strong>preview par ek click</strong> karein, phir arrow keys dabayein.</p>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase flex justify-between">Zoom {videoZoom.toFixed(1)}x</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setVideoZoom(z => Math.max(VIDEO_CROP_MIN_ZOOM, z - 0.25))}
                        className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
                      >
                        <X size={16} className="rotate-45" />
                      </button>
                      <input
                        type="range"
                        min={VIDEO_CROP_MIN_ZOOM}
                        max={VIDEO_CROP_MAX_ZOOM}
                        step={0.1}
                        value={videoZoom}
                        onChange={(e) => setVideoZoom(parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-gray-600 rounded-lg cursor-pointer accent-red-500"
                      />
                      <button
                        type="button"
                        onClick={() => setVideoZoom(z => Math.min(VIDEO_CROP_MAX_ZOOM, z + 0.25))}
                        className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
                      >
                        <Maximize size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Crop aspect</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'free', label: 'Free' },
                        { value: '1:1', label: '1:1' },
                        { value: '9:16', label: '9:16' },
                        { value: '16:9', label: '16:9' }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setVideoCropAspect(opt.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${videoCropAspect === opt.value ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'filter' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase flex justify-between">Brightness</label>
                <input type="range" min="0" max="2" step="0.1" value={brightness} onChange={(e) => setBrightness(parseFloat(e.target.value))} className="w-full h-1 bg-gray-600 rounded-lg cursor-pointer accent-red-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase flex justify-between">Contrast</label>
                <input type="range" min="0" max="2" step="0.1" value={contrast} onChange={(e) => setContrast(parseFloat(e.target.value))} className="w-full h-1 bg-gray-600 rounded-lg cursor-pointer accent-red-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase flex justify-between">Saturation</label>
                <input type="range" min="0" max="2" step="0.1" value={saturation} onChange={(e) => setSaturation(parseFloat(e.target.value))} className="w-full h-1 bg-gray-600 rounded-lg cursor-pointer accent-red-500" />
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Language</label>
                <div className="flex gap-2">
                  {['Marathi', 'Hindi', 'English'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${language === lang
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                        }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Input Text (Multicolor)</label>
                  <span className="text-[10px] text-gray-400">Select text & pick color below</span>
                </div>
                <div
                  ref={textEditorRef}
                  contentEditable
                  onInput={(e) => {
                    setTextHtml(e.currentTarget.innerHTML);
                    setText(e.currentTarget.innerText || e.currentTarget.textContent);
                  }}
                  onMouseUp={() => {
                    const sel = window.getSelection();
                    if (sel.rangeCount > 0) selectedTextRangeRef.current = sel.getRangeAt(0);
                  }}
                  onKeyUp={() => {
                    const sel = window.getSelection();
                    if (sel.rangeCount > 0) selectedTextRangeRef.current = sel.getRangeAt(0);
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 min-h-[5rem] overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner"
                  style={{ textAlign: textAlign, outline: 'none' }}
                  data-placeholder={
                    language === 'Marathi' ? "येथे लिहा..." :
                      language === 'Hindi' ? "यहाँ लिखें..." :
                        "Type here..."
                  }
                />
                <style dangerouslySetInnerHTML={{
                  __html: `
                  div[contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    pointer-events: none;
                  }
                `}} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Text Size {textSize}%</label>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="0.5"
                  value={textSize}
                  onChange={(e) => setTextSize(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-600 rounded-lg cursor-pointer accent-red-500"
                />
              </div>

              <div className="space-y-3">
                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Text Color</label>
                    <div className="flex gap-3 flex-wrap items-center">
                      <input
                        type="color"
                        value={textColor.match(/^#[0-9a-f]{6}$/) ? textColor : '#ffffff'}
                        onChange={(e) => {
                          const newColor = e.target.value;
                          applyColorToSelection(newColor);
                        }}
                        onClick={() => {
                          const sel = window.getSelection();
                          if (sel.rangeCount > 0) selectedTextRangeRef.current = sel.getRangeAt(0);
                        }}
                        className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0 flex-shrink-0 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                      {['white', 'black', 'red', 'yellow', 'cyan', 'lime', 'magenta', 'orange'].map(color => (
                        <button
                          key={color}
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevents selection loss in contentEditable
                            applyColorToSelection(color);
                          }}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${textColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'} flex-shrink-0`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-gray-700/50 pt-3">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Alignment</label>
                  <div className="flex items-center gap-1 bg-gray-800 border border-gray-600 rounded p-1 w-full max-w-[200px]">
                    <button
                      onClick={() => setTextAlign('left')}
                      className={`p-1 rounded flex-1 flex justify-center ${textAlign === 'left' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}
                      title="Align Left"
                    >
                      <AlignLeft size={16} />
                    </button>
                    <button
                      onClick={() => setTextAlign('center')}
                      className={`p-1 rounded flex-1 flex justify-center ${textAlign === 'center' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}
                      title="Align Center"
                    >
                      <AlignCenter size={16} />
                    </button>
                    <button
                      onClick={() => setTextAlign('right')}
                      className={`p-1 rounded flex-1 flex justify-center ${textAlign === 'right' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}
                      title="Align Right"
                    >
                      <AlignRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logo' && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Upload Logo</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setLogoFile(file);
                        setLogoPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload" className="flex-1 py-8 border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-red-500 hover:text-red-400 transition-colors bg-gray-700/30">
                    <ImageIcon size={32} />
                    <span className="text-xs">{logoFile ? "Change Logo" : "Upload Image (PNG/JPG)"}</span>
                  </label>
                </div>
              </div>

              {logoFile && (
                <div className="space-y-4 pt-4 border-t border-gray-700">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase flex justify-between">
                      Size {logoSize}%
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={logoSize}
                      onChange={(e) => setLogoSize(parseInt(e.target.value))}
                      className="w-full h-1 bg-gray-600 rounded-lg cursor-pointer accent-red-500"
                    />
                  </div>
                  <div className="p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                    <p className="text-xs text-blue-200">
                      <strong>Tip:</strong> You can drag the logo directly on the video preview to position it.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'clips' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Add Clips (Video or Image)</label>
                <p className="text-[11px] text-gray-500">Add video clips or images to your project. You can add multiple files.</p>
                <input
                  ref={clipsInputRef}
                  type="file"
                  accept="video/*,image/*"
                  multiple
                  onChange={addClips}
                  className="hidden"
                  id="clips-upload"
                />
                <label
                  htmlFor="clips-upload"
                  className="flex py-6 border-2 border-dashed border-gray-600 rounded-xl flex-col items-center justify-center gap-2 cursor-pointer hover:border-red-500 hover:text-red-400 transition-colors bg-gray-700/30"
                >
                  <ImagePlus size={28} className="text-gray-400" />
                  <span className="text-xs font-medium">Video ya Image select karein</span>
                  <span className="text-[10px] text-gray-500">MP4, WebM, JPG, PNG, etc.</span>
                </label>
              </div>
              {clips.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Added Clips ({clips.length})</label>
                  <ul className="space-y-2 max-h-[280px] overflow-y-auto">
                    {clips.map((clip) => (
                      <li
                        key={clip.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-gray-700/50 border border-gray-600"
                      >
                        <div className="w-14 h-14 rounded overflow-hidden bg-black shrink-0 flex items-center justify-center">
                          {clip.type === 'video' ? (
                            <video src={clip.previewUrl} className="w-full h-full object-contain" muted preload="metadata" />
                          ) : (
                            <img src={clip.previewUrl} alt="" className="w-full h-full object-contain" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-white truncate" title={clip.file.name}>{clip.file.name}</p>
                          <span className={`inline-flex items-center gap-1 text-[10px] mt-0.5 ${clip.type === 'video' ? 'text-blue-400' : 'text-green-400'}`}>
                            {clip.type === 'video' ? <Video size={10} /> : <ImageIcon size={10} />}
                            {clip.type === 'video' ? 'Video' : 'Image'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeClip(clip.id)}
                          className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors shrink-0"
                          title="Remove clip"
                        >
                          <X size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'split' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Split Video</label>
                <p className="text-[11px] text-gray-500">Click timeline to seek. Double-click to add split. Click red markers to remove. Excluded segments (dark red) are skipped during playback.</p>
              </div>
              {duration > 0 && (
                <>
                  {/* Visual timeline: click to seek, markers show splits */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                      <span>{formatTime(0)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                    <div
                      ref={splitTimelineRef}
                      role="slider"
                      tabIndex={0}
                      aria-valuenow={played}
                      aria-valuemin={0}
                      aria-valuemax={duration}
                      onClick={handleSplitTimelineClick}
                      onDoubleClick={addSplitAtTimelinePosition}
                      onKeyDown={(e) => {
                        const step = e.shiftKey ? 5 : 1;
                        if (e.key === 'ArrowLeft') { e.preventDefault(); seekTo(played - step); }
                        if (e.key === 'ArrowRight') { e.preventDefault(); seekTo(played + step); }
                      }}
                      className="relative h-10 rounded-lg bg-gray-700 border border-gray-600 cursor-pointer overflow-hidden focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {/* Segment regions (alternating tint) */}
                      {getSegments().map((seg, i) => {
                        const excluded = isSegmentExcluded(seg.start, seg.end);
                        return (
                          <div
                            key={segmentKey(seg.start, seg.end)}
                            className={`absolute top-0 bottom-0 ${excluded ? 'bg-red-900/60 opacity-50' : 'bg-gray-600/40'}`}
                            style={{
                              left: `${(seg.start / duration) * 100}%`,
                              width: `${((seg.end - seg.start) / duration) * 100}%`,
                            }}
                            title={excluded ? `Excluded: ${formatTime(seg.start)} – ${formatTime(seg.end)}` : `Segment ${i + 1}: ${formatTime(seg.start)} – ${formatTime(seg.end)}`}
                          />
                        );
                      })}
                      {/* Split markers: vertical lines, click to remove */}
                      {sortedSplitPoints.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeSplitPoint(t); }}
                          className="absolute top-0 bottom-0 w-2 -ml-1 z-10 flex items-center justify-center group focus:outline-none"
                          style={{ left: `${(t / duration) * 100}%` }}
                          title={`Split at ${formatTime(t)} — click to remove`}
                        >
                          <span className="w-0.5 h-full bg-red-500 group-hover:bg-red-400 group-hover:w-1 transition-all rounded-full" />
                        </button>
                      ))}
                      {/* Playhead */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-20 pointer-events-none"
                        style={{ left: `${duration ? (played / duration) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      type="button"
                      onClick={addSplitAtCurrent}
                      disabled={splitExporting || played <= 0 || played >= duration}
                      className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 text-xs font-medium"
                    >
                      Add split at playhead
                    </button>
                    <span className="text-[11px] text-gray-500">or at time:</span>
                    <div className="flex items-center gap-2">
                      <input
                        ref={splitTimeInputRef}
                        type="number"
                        min="0"
                        max={duration}
                        step="0.1"
                        placeholder="Sec"
                        className="w-16 px-2 py-1.5 rounded bg-gray-700 border border-gray-600 text-xs text-white"
                        onKeyDown={(e) => { if (e.key === 'Enter') addSplitAtTime(e.target.value); }}
                      />
                      <button
                        type="button"
                        onClick={() => addSplitAtTime(splitTimeInputRef.current?.value)}
                        disabled={splitExporting}
                        className="px-2 py-1.5 rounded bg-gray-600 text-gray-200 hover:bg-gray-500 text-xs"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {sortedSplitPoints.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-400 uppercase">Split points — click marker on timeline or × to remove</label>
                      <div className="flex flex-wrap gap-2">
                        {sortedSplitPoints.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => removeSplitPoint(t)}
                            className="px-2 py-1 rounded bg-gray-600 text-gray-200 hover:bg-red-500/30 text-xs"
                          >
                            {formatTime(t)} ×
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Segments — Remove = exclude from export, Add back = include</label>
                    <ul className="space-y-2">
                      {getSegments().map((seg, i) => {
                        const excluded = isSegmentExcluded(seg.start, seg.end);
                        return (
                          <li
                            key={segmentKey(seg.start, seg.end)}
                            className={`flex items-center justify-between gap-2 p-2 rounded-lg border ${excluded ? 'bg-gray-800/60 border-gray-600 opacity-75' : 'bg-gray-700/50 border-gray-600'}`}
                          >
                            <span className="text-xs text-gray-300">
                              Segment {i + 1}: {formatTime(seg.start)} – {formatTime(seg.end)}
                              {excluded && <span className="ml-1 text-gray-500">(excluded)</span>}
                            </span>
                            <div className="flex items-center gap-1">
                              {excluded ? (
                                <button
                                  type="button"
                                  onClick={() => includeSegment(seg.start, seg.end)}
                                  disabled={splitExporting}
                                  className="px-2 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs disabled:opacity-50"
                                >
                                  Add back
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => exportSegmentAsFile(seg.start, seg.end, i)}
                                    disabled={splitExporting}
                                    className="px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs disabled:opacity-50"
                                  >
                                    Export
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => excludeSegment(seg.start, seg.end)}
                                    disabled={splitExporting}
                                    className="px-2 py-1 rounded bg-gray-600 text-gray-300 hover:bg-gray-500 text-xs disabled:opacity-50"
                                    title="Exclude from Export all"
                                  >
                                    Remove
                                  </button>
                                </>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  {getSegments().length > 0 && (
                    <button
                      type="button"
                      onClick={exportAllSegments}
                      disabled={splitExporting || includedSegmentCount === 0}
                      className="w-full py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {splitExporting ? <Loader2 size={18} className="animate-spin" /> : <Columns3 size={18} />}
                      Export all ({includedSegmentCount} segment{includedSegmentCount !== 1 ? 's' : ''})
                    </button>
                  )}
                  {getSegments().length > 0 && includedSegmentCount === 0 && (
                    <p className="text-[11px] text-amber-400">Sab segments remove ho chuke hain. Add back karein ya naye split add karein.</p>
                  )}
                </>
              )}
              {duration <= 0 && (
                <div className="text-center py-6 text-gray-500 text-sm">Load a video to use split.</div>
              )}
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Background Music</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files[0])}
                    className="hidden"
                    id="audio-upload"
                  />
                  <label htmlFor="audio-upload" className="flex-1 py-3 px-4 border-2 border-dashed border-gray-600 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:border-red-500 hover:text-red-400 transition-colors">
                    <Music size={18} /> {audioFile ? audioFile.name : "Select or Drop MP3"}
                  </label>
                  {audioFile && (
                    <button onClick={() => setAudioFile(null)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20">
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
              {audioFile && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-2">
                      <Volume2 size={14} /> Video Volume {(videoVolume * 100).toFixed(0)}%
                    </label>
                    <input type="range" min="0" max="1" step="0.1" value={videoVolume} onChange={(e) => setVideoVolume(parseFloat(e.target.value))} className="w-full h-1 bg-gray-600 rounded-lg cursor-pointer accent-red-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-2">
                      <Music size={14} /> Music Volume {(audioVolume * 100).toFixed(0)}%
                    </label>
                    <input type="range" min="0" max="1" step="0.1" value={audioVolume} onChange={(e) => setAudioVolume(parseFloat(e.target.value))} className="w-full h-1 bg-gray-600 rounded-lg cursor-pointer accent-red-500" />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Fixed Footer Buttons */}
        <div className="p-3 md:p-6 border-t border-gray-700 bg-gray-800 shadow-[0_-4px_10px_rgba(0,0,0,0.3)]">
          {processing ? (
            <div className="w-full py-4 bg-gray-700 rounded-xl flex flex-col items-center justify-center gap-2">
              <div className="flex items-center gap-2 text-red-400 font-medium animate-pulse">
                <Loader2 size={20} className="animate-spin" /> Processing Video...
              </div>
              <div className="w-full max-w-[200px] h-1 bg-gray-600 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="text-xs text-gray-400">{progress}% Complete</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Save as</span>
                {[
                  { value: 'original', label: 'Original', desc: 'As edited' },
                  { value: 'reel', label: 'Reel', desc: '9:16' },
                  { value: 'youtube', label: 'YouTube', desc: '16:9' },
                  { value: 'thumbnail', label: 'Thumbnail', desc: 'Image' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExportFormat(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${exportFormat === opt.value ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    title={opt.desc}
                  >
                    {opt.label}
                  </button>
                ))}

                <label className="ml-auto text-xs flex items-center gap-2 cursor-pointer bg-red-600/20 px-3 py-1.5 rounded-lg border border-red-500/50 hover:bg-red-600/30 transition-colors text-white">
                  <input
                    type="checkbox"
                    checked={useReelFrame}
                    onChange={e => {
                      setUseReelFrame(e.target.checked);
                      if (e.target.checked) setExportFormat('reel'); // Auto-select reel format when using frame
                    }}
                    className="accent-red-500"
                  />
                  Apply <span className="font-bold text-red-400">Pune Lok Frame</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleProcessVideo}
                  disabled={!loaded}
                  className={`flex-1 py-3 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg ${loaded ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                >
                  <Download size={18} />
                  {exportFormat === 'thumbnail' ? 'Export Thumbnail' : 'Export MP4'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div >
    </div >
  );
};
export default VideoEditor;
