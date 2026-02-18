import React, { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

import {
  Play, Pause, Scissors, Music, Download, Type, Sliders,
  Loader2, Check, X, Volume2, Image as ImageIcon, Maximize
} from 'lucide-react';

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
  const [textColor, setTextColor] = useState('white');
  const [textSize, setTextSize] = useState(5); // Percentage of video height
  const [language, setLanguage] = useState('Marathi');
  const [textPos, setTextPos] = useState({ x: 50, y: 80 }); // Percentage 0-100
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragTarget, setDragTarget] = useState(null); // 'text' or 'logo'

  // Logo Overlay
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoPos, setLogoPos] = useState({ x: 10, y: 10 }); // Percentage
  const [logoSize, setLogoSize] = useState(15); // Percentage of width

  const containerRef = useRef(null);

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

  // Drag Logic
  const handleDragStart = (e, target) => {
    e.preventDefault();
    setIsDragging(true);
    setDragTarget(target);
  };

  const handleDragMove = (e) => {
    if (!isDragging || !containerRef.current || !dragTarget) return;

    // Support mouse and touch
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const rect = containerRef.current.getBoundingClientRect();

    // Calculate percentage relative to container
    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;

    // Clamp to 0-100
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    if (dragTarget === 'text') {
      setTextPos({ x, y });
    } else if (dragTarget === 'logo') {
      setLogoPos({ x, y });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragTarget(null);
  };

  // Resize Logic
  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  const handleResizeMove = (e) => {
    if (!isResizing || !containerRef.current) return;

    // Support mouse and touch
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const rect = containerRef.current.getBoundingClientRect();

    // Calculate Center X of the logo in pixels relative to viewport
    // logoPos.x is percentage from left of container
    const relativeLeft = rect.width * (logoPos.x / 100);
    const centerX = rect.left + relativeLeft;

    // Distance from center
    const dist = clientX - centerX;

    // We assume resizing symmetrically or from center. 
    // Logo width = 2 * |dist|
    const newWidth = Math.abs(dist) * 2;

    // Convert to percentage
    const newSize = (newWidth / rect.width) * 100;

    // Clamp
    const clampedSize = Math.max(5, Math.min(90, newSize));
    setLogoSize(clampedSize);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
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
  }, [isDragging, isResizing, dragTarget, logoPos]); // Added logoPos dependency for resize calc

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

      // Let's reconstruct the command with complex filters more robustly
      const cmd = [];
      let filterComplex = [];
      let lastVideoStream = '0:v'; // Start with the main video input stream
      let currentInputIndex = 1; // For additional inputs (logo, audio)

      // Input seeking for trim (fast)
      if (trimStart > 0) cmd.push('-ss', trimStart.toString());
      if (trimEnd > 0 && trimEnd > trimStart) cmd.push('-to', trimEnd.toString());

      cmd.push('-i', 'input.mp4');

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

      if (text) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = videoDimensions.width;
          canvas.height = videoDimensions.height;
          const ctx = canvas.getContext('2d');

          if (!ctx) throw new Error("Could not create canvas context");

          // Calculate font size
          const fontSizePx = (videoDimensions.height * textSize) / 100;
          ctx.font = `bold ${fontSizePx}px Arial, sans-serif`;
          ctx.fillStyle = textColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Shadow
          ctx.shadowColor = 'black';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          // Text Wrapping Logic
          // Calculate max available width based on center position to avoid cutting
          const margin = videoDimensions.width * 0.05; // 5% margin
          const availableLeft = (videoDimensions.width * textPos.x) / 100 - margin;
          const availableRight = videoDimensions.width - ((videoDimensions.width * textPos.x) / 100) - margin;
          const maxWidth = Math.min(availableLeft, availableRight) * 2;

          // Split by manual newlines first
          const manualLines = text.split(/\r?\n/);
          let finalLines = [];

          manualLines.forEach(mLine => {
            const words = mLine.split(' ');
            if (words.length === 0 || (words.length === 1 && words[0] === '')) {
              finalLines.push('');
              return;
            }

            let currentLine = words[0];
            for (let i = 1; i < words.length; i++) {
              const testLine = currentLine + " " + words[i];
              if (ctx.measureText(testLine).width < maxWidth) {
                currentLine = testLine;
              } else {
                finalLines.push(currentLine);
                currentLine = words[i];
              }
            }
            finalLines.push(currentLine);
          });

          // Draw Text
          const centerX = (videoDimensions.width * textPos.x) / 100;
          const centerY = (videoDimensions.height * textPos.y) / 100;
          const lineHeight = fontSizePx * 1.2;

          finalLines.forEach((line, i) => {
            // Center block vertically around centerY
            const y = centerY + (i - (finalLines.length - 1) / 2) * lineHeight;
            ctx.fillText(line, centerX, y);
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
      if (trimStart > 0) cmd.push('-ss', trimStart.toString());
      if (trimEnd > 0 && trimEnd > trimStart) cmd.push('-to', trimEnd.toString());
      cmd.push('-i', 'input.mp4'); // 0

      if (logoWritten) {
        cmd.push('-i', 'logo.png');
        logoIdx = nextInputIdx++;
      }
      if (audioWritten) {
        cmd.push('-i', 'music.mp3');
        audioIdx = nextInputIdx++;
      }
      if (text) {
        cmd.push('-i', 'text_overlay.png');
        textIdx = nextInputIdx++;
      }

      // FILTER CHAIN
      // 1. EQ
      if (brightness !== 1 || contrast !== 1 || saturation !== 1) {
        let eqFilter = `eq=brightness=${brightness - 1}:contrast=${contrast}:saturation=${saturation}`;
        filterComplex.push(`[${lastVideoStream}]${eqFilter}[v_eq]`);
        lastVideoStream = 'v_eq';
      }

      // 2. Logo Overlay
      if (logoWritten) {
        const targetWidth = videoDimensions.width * (logoSize / 100);
        let w = Math.round(targetWidth);
        if (w % 2 !== 0) w += 1; // Even width

        filterComplex.push(`[${logoIdx}:v]scale=${w}:-1[logo]`);
        filterComplex.push(`[${lastVideoStream}][logo]overlay=x=(W*${logoPos.x}/100-w/2):y=(H*${logoPos.y}/100-h/2)[v_logo]`);
        lastVideoStream = 'v_logo';
      }

      // 3. Text Overlay (Image)
      if (text) {
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

      // Encoding
      cmd.push('-c:v', 'libx264');
      cmd.push('-preset', 'ultrafast');
      cmd.push('output.mp4');

      console.log('Running FFmpeg:', cmd.join(' '));

      // Debug: List files
      try {
        const files = await ffmpeg.listDir('/');
        console.log('FFmpeg FS Root:', files);
      } catch (e) { console.log("List dir failed", e); }

      ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg Log]:', message);
      });

      ffmpeg.on('progress', ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });

      const returnCode = await ffmpeg.exec(cmd);

      if (returnCode !== 0) {
        throw new Error(`FFmpeg exited with code ${returnCode}. Check console for details.`);
      }

      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const editedFile = new File([blob], 'edited_video.mp4', { type: 'video/mp4' });

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
              <div
                ref={containerRef}
                className="relative shadow-2xl rounded-xl overflow-hidden border border-gray-800 bg-black flex items-center justify-center max-h-[600px] max-w-full"
              >
                <video
                  ref={playerRef}
                  key={videoSrc}
                  src={videoSrc}
                  className="max-h-[600px] w-auto h-auto object-contain"
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
                  onTimeUpdate={(e) => setPlayed(e.target.currentTime)}
                  onEnded={() => setIsPlaying(false)}
                  onError={(e) => console.error("Video Tag Error:", e)}
                  style={{
                    filter: `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`
                  }}
                />

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
                    <h2
                      className="font-bold drop-shadow-lg leading-tight mx-auto inline-block relative whitespace-pre-wrap text-center pointer-events-auto"
                      style={{
                        color: textColor,
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
                    >
                      {text}
                    </h2>
                  </div>
                )}
                {logoPreview && (
                  <div
                    className="absolute z-20 select-none"
                    style={{
                      left: `${logoPos.x}%`,
                      top: `${logoPos.y}%`,
                      width: `${logoSize}%`,
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
                        className="absolute -bottom-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-2 border-white cursor-se-resize flex items-center justify-center shadow-md z-30"
                        onMouseDown={handleResizeStart}
                        onTouchStart={handleResizeStart}
                      >
                        <Maximize size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                )}
              </div>
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
        <div className="flex border-b border-gray-700 bg-gray-800 shrink-0">
          {['trim', 'filter', 'text', 'logo', 'audio'].map(tab => {
            const icons = { trim: Scissors, filter: Sliders, text: Type, logo: ImageIcon, audio: Music };
            const Icon = icons[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 md:py-3 flex flex-col items-center gap-1 text-[10px] sm:text-xs font-medium uppercase tracking-wider transition-all border-b-2 ${activeTab === tab ? 'border-red-500 text-red-500 bg-red-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
              >
                <Icon size={16} />
                <span>{tab}</span>
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
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase flex justify-between">Start Time <span>{trimStart.toFixed(1)}s</span></label>
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
                    <label className="text-xs font-semibold text-gray-400 uppercase flex justify-between">End Time <span>{trimEnd.toFixed(1)}s</span></label>
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
                    <p className="text-sm text-gray-300">New Duration: <span className="font-bold text-white">{((trimEnd || duration) - trimStart).toFixed(1)}s</span></p>
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
                <label className="text-xs font-semibold text-gray-400 uppercase">Input Text (multiline)</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    language === 'Marathi' ? "येथे लिहा..." :
                      language === 'Hindi' ? "यहाँ लिखें..." :
                        "Type here..."
                  }
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
                />
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

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Text Color</label>
                <div className="flex gap-3 flex-wrap">
                  {['white', 'black', 'red', 'yellow', 'cyan', 'lime', 'magenta', 'orange'].map(color => (
                    <button
                      key={color}
                      onClick={() => setTextColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${textColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
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
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors">
                Cancel
              </button>
              <button
                onClick={handleProcessVideo}
                disabled={!loaded}
                className={`flex-1 py-3 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg ${loaded ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
              >
                <Download size={18} /> Export MP4
              </button>
            </div>
          )}
        </div>
      </div >
    </div >
  );
};
export default VideoEditor;
