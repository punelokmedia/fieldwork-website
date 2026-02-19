import React, { useState, useRef, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import * as fabric from 'fabric';

import { X, Check, Type as TypeIcon, Crop as CropIcon, Image as ImageIcon, RotateCcw, Download, Plus, Upload, LayoutTemplate, Languages, AlignHorizontalJustifyStart, AlignHorizontalJustifyEnd, AlignVerticalJustifyStart, AlignVerticalJustifyEnd, ZoomIn, ZoomOut, MousePointer2 } from 'lucide-react';

const CROP_MIN_ZOOM = 1;
const CROP_MAX_ZOOM = 4;

const ImageEditor = ({ file, onSave, onCancel }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedAreaPercent, setCroppedAreaPercent] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropAspectOption, setCropAspectOption] = useState('free');
  const [imageNaturalAspect, setImageNaturalAspect] = useState(null);
  const [cropMode, setCropMode] = useState('moveZoom');
  const [selectionCrop, setSelectionCrop] = useState(undefined);
  const [selectionImgSize, setSelectionImgSize] = useState({ naturalWidth: 0, naturalHeight: 0, displayWidth: 0, displayHeight: 0 });

  // Refs
  const containerRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const cropperRef = useRef(null);
  const selectionImgRef = useRef(null);

  // Filters
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [blur, setBlur] = useState(0);

  // Text & Logo State
  const [selectedObject, setSelectedObject] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('marathi');
  const [logoObject, setLogoObject] = useState(null);

  // UI State for inputs to ensure they update immediately
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(40);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result));
      reader.readAsDataURL(file);
    }
  }, [file]);

  // Focus cropper so arrow keys work when entering crop mode
  useEffect(() => {
    if (!showCropper) return;
    const t = setTimeout(() => {
      const el = cropperRef.current?.current ?? cropperRef.current;
      if (el && typeof el.focus === 'function') {
        el.focus({ preventScroll: true });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [showCropper]);

  // Initialize Fabric Canvas with ResizeObserver
  useEffect(() => {
    let active = true;
    let resizeObserver = null;

    if (!showCropper && imageSrc && containerRef.current) {
      const initCanvas = async () => {
        if (!containerRef.current) return;

        try {
          const parent = containerRef.current.parentElement;
          if (!parent) return;

          containerRef.current.innerHTML = '';
          const canvasEl = document.createElement('canvas');
          containerRef.current.appendChild(canvasEl);

          const fabricLib = fabric;

          if (fabricCanvasRef.current) {
            fabricCanvasRef.current.dispose();
            fabricCanvasRef.current = null;
          }

          const imgElement = await createImage(imageSrc);
          if (!active) return;
          if (!containerRef.current) return; // double check after await

          // Dimensions - Responsive to container
          // Use getBoundingClientRect for more accurate sub-pixel values
          const rect = parent.getBoundingClientRect();
          const maxWidth = rect.width;
          const maxHeight = rect.height;

          if (maxWidth <= 0 || maxHeight <= 0) return;

          const scale = Math.min(maxWidth / imgElement.width, maxHeight / imgElement.height);
          const canvasWidth = imgElement.width * scale;
          const canvasHeight = imgElement.height * scale;

          const fCanvas = new fabricLib.Canvas(canvasEl, {
            width: canvasWidth,
            height: canvasHeight,
            backgroundColor: '#000',
            selection: true
          });
          fabricCanvasRef.current = fCanvas;

          const fImg = new fabricLib.Image(imgElement, {
            scaleX: scale,
            scaleY: scale,
            left: canvasWidth / 2,
            top: canvasHeight / 2,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
          });

          fCanvas.add(fImg);
          fCanvas.renderAll();

          // Event Listeners for Selection
          const updateSelectionState = (e) => {
            if (e.selected && e.selected.length > 0) {
              const obj = e.selected[0];
              setSelectedObject(obj);

              if (['i-text', 'text', 'textbox'].includes(obj.type)) {
                setTextInput(obj.text);
                setTextColor(obj.fill);
                setFontSize(obj.fontSize);
              }
            }
          };

          fCanvas.on('selection:created', updateSelectionState);
          fCanvas.on('selection:updated', updateSelectionState);

          fCanvas.on('selection:cleared', () => {
            setSelectedObject(null);
            setTextInput('');
          });

        } catch (err) {
          console.error("Fabric init error:", err);
        }
      };

      // Initial load
      initCanvas();

      // Watch for resize
      resizeObserver = new ResizeObserver(() => {
        // Simple visual resize: re-init context to fit new bounds
        // We verify if dimensions actually changed significantly to avoid loops
        initCanvas();
      });

      if (containerRef.current && containerRef.current.parentElement) {
        resizeObserver.observe(containerRef.current.parentElement);
      }

      return () => {
        active = false;
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.dispose();
          fabricCanvasRef.current = null;
        }
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      };
    }
  }, [showCropper, imageSrc]);

  // Apply Filters
  useEffect(() => {
    if (fabricCanvasRef.current) {
      const fabricLib = fabric;
      const canvas = fabricCanvasRef.current;
      const objects = canvas.getObjects();
      // Assume the first object is always the background image
      const bgImage = objects[0];

      if (bgImage && bgImage.type === 'image') {
        bgImage.filters = [];
        const getFilter = (name) => fabricLib.filters?.[name] || fabricLib.Image?.filters?.[name];
        const Brightness = getFilter('Brightness');
        const Contrast = getFilter('Contrast');
        const Blur = getFilter('Blur');

        if (brightness !== 100 && Brightness) {
          const b = (brightness - 100) / 100;
          bgImage.filters.push(new Brightness({ brightness: b }));
        }
        if (contrast !== 100 && Contrast) {
          const c = (contrast - 100) / 100;
          bgImage.filters.push(new Contrast({ contrast: c }));
        }
        if (blur > 0 && Blur) {
          bgImage.filters.push(new Blur({ blur: blur / 50 }));
        }
        bgImage.applyFilters();
        canvas.requestRenderAll();
      }
    }
  }, [brightness, contrast, blur]);

  const onCropAreaChange = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPercent(croppedArea);
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApplyCrop = async () => {
    try {
      if (cropMode === 'select' && selectionCrop?.width && selectionCrop?.height) {
        const img = selectionImgRef.current;
        if (!img) return;
        const naturalWidth = img.naturalWidth || selectionImgSize.naturalWidth;
        const naturalHeight = img.naturalHeight || selectionImgSize.naturalHeight;
        let pixelCrop;
        if (selectionCrop.unit === '%') {
          pixelCrop = {
            x: (selectionCrop.x / 100) * naturalWidth,
            y: (selectionCrop.y / 100) * naturalHeight,
            width: (selectionCrop.width / 100) * naturalWidth,
            height: (selectionCrop.height / 100) * naturalHeight
          };
        } else {
          const displayWidth = img.offsetWidth || selectionImgSize.displayWidth;
          const displayHeight = img.offsetHeight || selectionImgSize.displayHeight;
          if (displayWidth <= 0 || displayHeight <= 0 || naturalWidth <= 0 || naturalHeight <= 0) return;
          const scaleX = naturalWidth / displayWidth;
          const scaleY = naturalHeight / displayHeight;
          pixelCrop = {
            x: selectionCrop.x * scaleX,
            y: selectionCrop.y * scaleY,
            width: selectionCrop.width * scaleX,
            height: selectionCrop.height * scaleY
          };
        }
        const croppedImage = await getCroppedImg(imageSrc, null, pixelCrop, file?.type);
        if (!croppedImage) return;
        const prevSrc = imageSrc;
        setImageSrc(croppedImage);
        setSelectionCrop(undefined);
        setShowCropper(false);
        if (prevSrc && prevSrc.startsWith('blob:')) URL.revokeObjectURL(prevSrc);
        return;
      }
      if (!croppedAreaPercent && !croppedAreaPixels) return;
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPercent, croppedAreaPixels, file?.type);
      if (!croppedImage) return;
      const prevSrc = imageSrc;
      setImageSrc(croppedImage);
      setCroppedAreaPercent(null);
      setCroppedAreaPixels(null);
      setShowCropper(false);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      if (prevSrc && prevSrc.startsWith('blob:')) URL.revokeObjectURL(prevSrc);
    } catch (e) {
      console.error("Crop error:", e);
    }
  };

  // --- Text & Transliteration ---
  const fetchTransliteration = async (text, langCode) => {
    try {
      const res = await fetch(`https://inputtools.google.com/request?text=${text}&itc=${langCode}&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8`);
      const data = await res.json();
      if (data[0] === 'SUCCESS') {
        return data[1][0][1][0];
      }
      return text;
    } catch (e) {
      console.error("Transliteration failed", e);
      return text;
    }
  };

  const handleTextChange = async (e) => {
    const rawText = e.target.value;
    const lastChar = rawText.slice(-1);

    // If space is pressed, try to transliterate the last word
    if (lastChar === ' ' && (targetLanguage === 'marathi' || targetLanguage === 'hindi')) {
      const words = rawText.split(' ');
      const lastWord = words[words.length - 2]; // -1 is empty string after space, -2 is the word

      if (lastWord) {
        const langCode = targetLanguage === 'marathi' ? 'mr-t-i0-und' : 'hi-t-i0-und';
        const transliteratedWord = await fetchTransliteration(lastWord, langCode);

        // Replace last word
        words[words.length - 2] = transliteratedWord;
        const newText = words.join(' ');
        setTextInput(newText);
        updateCanvasText(newText);
        return;
      }
    }

    setTextInput(rawText);
    updateCanvasText(rawText);
  };

  const updateCanvasText = (text) => {
    if (selectedObject && (['i-text', 'text', 'textbox'].includes(selectedObject.type))) {
      selectedObject.set({ text: text });
      fabricCanvasRef.current.requestRenderAll();
    }
  };


  const addText = () => {
    if (fabricCanvasRef.current) {
      const fabricLib = fabric;
      const canvas = fabricCanvasRef.current;

      // Responsive Initial Width & Font Size
      const initialWidth = canvas.width * 0.6; // 60% of canvas width
      const initialFontSize = Math.max(20, canvas.width * 0.05); // Min 20px, or 5% of width

      // Use Textbox instead of IText for wrapping support
      const text = new fabricLib.Textbox('New Text', {
        left: (canvas.width - initialWidth) / 2, // Center horizontally
        top: canvas.height * 0.2,
        width: initialWidth,
        splitByGrapheme: true,
        fontFamily: 'Arial',
        fill: '#ffffff',
        fontSize: initialFontSize,
        textAlign: 'center', // Center align text by default
        paintFirst: 'fill',
        shadow: new fabricLib.Shadow({ color: 'black', blur: 5, offsetX: 2, offsetY: 2 }),
        // Enhanced Selection Controls
        transparentCorners: false,
        cornerColor: 'white',
        cornerStrokeColor: 'gray',
        borderColor: 'white',
        cornerSize: 12,
        padding: 10,
        borderDashArray: [4, 4]
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.requestRenderAll();
      setSelectedObject(text);
      setTextInput('New Text');
      setTextColor('#ffffff');
      setFontSize(initialFontSize);
    }
  };

  // --- Logo Handling ---
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (f) => {
      try {
        const fabricLib = fabric;
        // Create an HTML Image element first for reliability
        const imgElement = document.createElement('img');
        imgElement.src = f.target.result;

        imgElement.onload = () => {
          const fabricImg = new fabricLib.Image(imgElement);

          const canvas = fabricCanvasRef.current;
          // Scale logo to a reasonable size (e.g. 15% of canvas width)
          const targetWidth = canvas.width * 0.15;
          const scale = targetWidth / fabricImg.width;

          fabricImg.set({
            scaleX: scale,
            scaleY: scale,
            left: 50,
            top: 50
          });

          canvas.add(fabricImg);
          canvas.setActiveObject(fabricImg);
          fabricImg.setCoords();

          setLogoObject(fabricImg);
          setSelectedObject(fabricImg);
          canvas.requestRenderAll();
        };

        imgElement.onerror = (err) => {
          console.error("Error loading logo image", err);
        };

      } catch (err) {
        console.error("Error adding logo", err);
      }
    };
    reader.readAsDataURL(file);
    // Reset input value to allow re-uploading same file
    e.target.value = '';
  };

  const positionLogo = (pos) => {
    // Use either the currently selected object (if it's an image that isn't the background) or the last uploaded logo
    const obj = (selectedObject && selectedObject.type === 'image' && selectedObject !== fabricCanvasRef.current.getObjects()[0])
      ? selectedObject
      : logoObject;

    if (!obj) return;

    const canvas = fabricCanvasRef.current;
    const padding = 20;
    const objWidth = obj.getScaledWidth();
    const objHeight = obj.getScaledHeight();

    switch (pos) {
      case 'tl':
        obj.set({ left: padding, top: padding });
        break;
      case 'tr':
        obj.set({ left: canvas.width - objWidth - padding, top: padding });
        break;
      case 'bl':
        obj.set({ left: padding, top: canvas.height - objHeight - padding });
        break;
      case 'br':
        obj.set({ left: canvas.width - objWidth - padding, top: canvas.height - objHeight - padding });
        break;
      default: break;
    }
    obj.setCoords();
    canvas.requestRenderAll();
  };


  const handleSaveImage = () => {
    if (fabricCanvasRef.current) {
      // De-select everything before saving so selection box doesn't show
      fabricCanvasRef.current.discardActiveObject();
      fabricCanvasRef.current.requestRenderAll();

      // Standardize Output Resolution (e.g. 1080px width)
      // This ensures mobile (small screen) and laptop (large screen) exports have equal quality and size
      const targetWidth = 1080;
      const originalWidth = fabricCanvasRef.current.getWidth();
      const multiplier = targetWidth / originalWidth;

      const dataURL = fabricCanvasRef.current.toDataURL({
        format: 'jpeg',
        quality: 0.9,
        multiplier: multiplier
      });

      fetch(dataURL)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "edited_image.jpg", { type: "image/jpeg" });
          onSave(file);
        });
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full max-w-full overflow-x-hidden bg-gray-900 text-white min-h-0">
      {/* Sidebar Controls - 35% height on mobile, full height on desktop. Order 2 mobile, 1 desktop */}
      <div className="w-full max-w-full md:w-80 shrink-0 h-[35%] md:h-full bg-gray-800 border-r border-gray-700 flex flex-col order-2 md:order-1 relative z-10 shadow-xl md:shadow-none min-h-0 overflow-x-hidden">

        <h3 className="text-xl font-bold p-6 hidden md:block border-b border-gray-700">Image Editor</h3>

        {/* Scrollable Content Area - Flex 1 to take remaining space */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 min-w-0">
          {/* Crop Toggle */}
          <div className="flex md:block">
            <button
              onClick={() => setShowCropper(!showCropper)}
              className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors ${showCropper ? 'bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              <CropIcon size={18} /> {showCropper ? 'Apply / Cancel Crop' : 'Crop & Rotate'}
            </button>
          </div>

          {/* Crop mode: Zoom in/out vs Crop (handles) */}
          {showCropper && (
            <div className="space-y-6">
              <div className="space-y-2 p-3 bg-gray-700/50 rounded-xl border border-gray-600">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Crop kaise karein</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCropMode('moveZoom')}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${cropMode === 'moveZoom' ? 'bg-red-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}
                  >
                    <ZoomIn size={16} /> Zoom in / out
                  </button>
                  <button
                    type="button"
                    onClick={() => setCropMode('select')}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${cropMode === 'select' ? 'bg-red-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}
                  >
                    <MousePointer2 size={16} /> Crop
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  {cropMode === 'select' ? 'Drag karke area select karein, corners/handles se resize karein.' : 'Image ko drag/zoom karke position karein.'}
                </p>
              </div>
              {cropMode === 'moveZoom' && (
                <div className="space-y-6">
                  <div className="space-y-2 p-3 bg-gray-700/50 rounded-xl border border-gray-600">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Crop shape</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { value: 'free', label: 'Free', title: 'Image ratio – crop from any corner' },
                        { value: '1:1', label: '1:1', title: 'Square' },
                        { value: '9:16', label: '9:16', title: 'Portrait' },
                        { value: '16:9', label: '16:9', title: 'Landscape' },
                        { value: '4:3', label: '4:3', title: '4:3' },
                      ].map(({ value, label, title }) => (
                        <button
                          key={value}
                          type="button"
                          title={title}
                          onClick={() => setCropAspectOption(value)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${cropAspectOption === value ? 'bg-red-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">Free = image ratio. Drag image to position crop from any side.</p>
                    <p className="text-xs text-amber-200/90 mt-1">← ↑ → ↓ Arrow keys se crop area move karein (pehle crop area par click karein).</p>
                  </div>
                  <div className="space-y-3 p-3 bg-gray-700/50 rounded-xl border border-gray-600">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                      <ZoomIn size={14} /> Zoom
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setZoom((z) => Math.max(CROP_MIN_ZOOM, z - 0.25))}
                        className="p-2 bg-gray-600 hover:bg-gray-500 rounded-lg"
                        aria-label="Zoom out"
                      >
                        <ZoomOut size={18} />
                      </button>
                      <input
                        type="range"
                        min={CROP_MIN_ZOOM}
                        max={CROP_MAX_ZOOM}
                        step={0.1}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500"
                      />
                      <button
                        type="button"
                        onClick={() => setZoom((z) => Math.min(CROP_MAX_ZOOM, z + 0.25))}
                        className="p-2 bg-gray-600 hover:bg-gray-500 rounded-lg"
                        aria-label="Zoom in"
                      >
                        <ZoomIn size={18} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">Drag image to position • Use slider or buttons to zoom</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!showCropper && (
            <>
              {/* Text Editor Panel (If text selected) */}
              {selectedObject && (['i-text', 'text', 'textbox'].includes(selectedObject.type)) && (
                <div className="bg-gray-700/50 p-3 rounded-xl border border-gray-600 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Edit Text</h4>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Language (Typing)</label>
                    <select
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-red-500"
                    >
                      <option value="marathi">Marathi (मराठी)</option>
                      <option value="hindi">Hindi (हिंदी)</option>
                      <option value="english">English</option>
                    </select>
                  </div>

                  {/* Text Input */}
                  <textarea
                    value={textInput}
                    onChange={handleTextChange}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm focus:outline-none focus:border-red-500 min-h-[80px]"
                    placeholder="Type here..."
                  />
                  <p className="text-[10px] text-gray-500 text-right">Space to transliterate</p>

                  {/* Color & Size Controls */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-600/50">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => {
                            const newColor = e.target.value;
                            setTextColor(newColor);

                            const activeObj = fabricCanvasRef.current?.getActiveObject();
                            if (activeObj) {
                              activeObj.set('fill', newColor);
                              fabricCanvasRef.current.requestRenderAll();
                              // Force update state to reflect change
                              setSelectedObject(activeObj);
                            }
                          }}
                          className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                        <span className="text-xs text-gray-400">{textColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Size</label>
                      <input
                        type="number"
                        value={fontSize}
                        onChange={(e) => {
                          const size = parseInt(e.target.value, 10);
                          setFontSize(size);
                          selectedObject.set('fontSize', size);
                          fabricCanvasRef.current.requestRenderAll();
                        }}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Logo Controls */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <LayoutTemplate size={14} /> Branding / Logo
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 rounded-lg p-2 flex flex-col items-center justify-center gap-1 border border-gray-600 border-dashed transition-all">
                    <Upload size={16} className="text-gray-400" />
                    <span className="text-xs font-medium">Upload Logo</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>

                {/* Position Controls - Enabled if logo/image selected */}
                <div className="grid grid-cols-4 gap-2">
                  <button onClick={() => positionLogo('tl')} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center" title="Top Left">
                    <AlignHorizontalJustifyStart size={16} className="rotate-0" />
                  </button>
                  <button onClick={() => positionLogo('tr')} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center" title="Top Right">
                    <AlignHorizontalJustifyEnd size={16} />
                  </button>
                  <button onClick={() => positionLogo('bl')} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center" title="Bottom Left">
                    <AlignVerticalJustifyStart size={16} />
                  </button>
                  <button onClick={() => positionLogo('br')} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center" title="Bottom Right">
                    <AlignVerticalJustifyEnd size={16} />
                  </button>
                </div>
              </div>


              {/* Filters */}
              <div className="space-y-4 pt-4 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Adjustments</h4>

                <div className="space-y-2">
                  <label className="text-xs flex justify-between">Brightness <span>{brightness}%</span></label>
                  <input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs flex justify-between">Contrast <span>{contrast}%</span></label>
                  <input type="range" min="0" max="200" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs flex justify-between">Blur <span>{blur}px</span></label>
                  <input type="range" min="0" max="50" value={blur} onChange={(e) => setBlur(Number(e.target.value))} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500" />
                </div>
              </div>

              {/* Overlays */}
              <div className="space-y-4 pt-4 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Overlays</h4>
                <button onClick={addText} className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center gap-2">
                  <TypeIcon size={16} /> Add Text
                </button>
              </div>
            </>
          )}

        </div>

        {/* Fixed Footer Buttons */}
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <div className="flex flex-col gap-2">
            {showCropper && cropMode === 'select' && (!selectionCrop?.width || !selectionCrop?.height) && (
              <p className="text-xs text-amber-200/90 text-center">Pehle image par drag karke area select karein, phir handles se resize karein.</p>
            )}
            <div className="flex gap-2">
              <button onClick={onCancel} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium">Cancel</button>
              <button
                onClick={showCropper ? handleApplyCrop : handleSaveImage}
                disabled={showCropper && cropMode === 'select' && (!selectionCrop?.width || !selectionCrop?.height)}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showCropper ? <Check size={18} /> : <Download size={18} />}
                {showCropper ? 'Done' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Preview Area - Order 1 on mobile (top), Order 2 on Desktop (right) */}
      <div className={`w-full min-w-0 flex-1 bg-black relative flex items-center justify-center order-1 md:order-2 min-h-[300px] ${showCropper && cropMode === 'select' ? 'min-h-[50vh] overflow-auto overflow-x-hidden' : 'overflow-hidden'}`}>
        {imageSrc && (
          showCropper ? (
            cropMode === 'select' ? (
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                <div className="absolute inset-0 p-4 box-border flex items-center justify-center overflow-hidden">
                  {/* Wrapper sizes to the image only so ReactCrop crop is always relative to image, not black area */}
                  <div className="inline-block max-w-full max-h-full min-w-0 flex items-center justify-center">
                    <ReactCrop
                      crop={selectionCrop}
                      onChange={(pixelCrop, percentCrop) => {
                        if (!percentCrop || (percentCrop.width <= 0 || percentCrop.height <= 0)) {
                          setSelectionCrop(percentCrop || pixelCrop);
                          return;
                        }
                        // Clamp to 0–100% so crop never includes black (always image only)
                        const x = Math.max(0, Math.min(100, percentCrop.x));
                        const y = Math.max(0, Math.min(100, percentCrop.y));
                        const w = Math.max(1, Math.min(100 - x, percentCrop.width));
                        const h = Math.max(1, Math.min(100 - y, percentCrop.height));
                        setSelectionCrop({ ...percentCrop, unit: '%', x, y, width: w, height: h });
                      }}
                      style={{ lineHeight: 0, display: 'block', width: '100%', height: '100%' }}
                      className="[&_.ReactCrop__child-wrapper]:!block"
                    >
                      <img
                        ref={selectionImgRef}
                        src={imageSrc}
                        alt="Crop"
                        decoding="async"
                        loading="eager"
                        className="!block !visible !opacity-100 !max-w-full !max-h-full !w-auto !h-auto object-contain"
                        style={{ minHeight: 180 }}
                        onLoad={(e) => {
                          const img = e.currentTarget;
                          setSelectionImgSize({
                            naturalWidth: img.naturalWidth,
                            naturalHeight: img.naturalHeight,
                            displayWidth: img.offsetWidth,
                            displayHeight: img.offsetHeight
                          });
                        }}
                        onError={() => {
                          setSelectionImgSize({ naturalWidth: 0, naturalHeight: 0, displayWidth: 0, displayHeight: 0 });
                        }}
                      />
                    </ReactCrop>
                  </div>
                </div>
              </div>
            ) : (
            <div className="absolute inset-0 w-full h-full" title="Click here then use arrow keys to move crop">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                minZoom={CROP_MIN_ZOOM}
                maxZoom={CROP_MAX_ZOOM}
                aspect={
                  cropAspectOption === 'free'
                    ? (imageNaturalAspect != null ? imageNaturalAspect : 4 / 3)
                    : cropAspectOption === '1:1'
                      ? 1
                      : cropAspectOption === '9:16'
                        ? 9 / 16
                        : cropAspectOption === '16:9'
                          ? 16 / 9
                          : 4 / 3
                }
                onCropChange={setCrop}
                onCropComplete={onCropAreaChange}
                onCropAreaChange={onCropAreaChange}
                onZoomChange={setZoom}
                onMediaLoaded={(mediaSize) => {
                  if (mediaSize?.naturalWidth && mediaSize?.naturalHeight) {
                    setImageNaturalAspect(mediaSize.naturalWidth / mediaSize.naturalHeight);
                  }
                }}
                objectFit="contain"
                roundCropAreaPixels
                keyboardStep={12}
                cropperProps={{ tabIndex: 0, 'aria-label': 'Crop area – use arrow keys to move' }}
                setCropperRef={(ref) => { cropperRef.current = ref?.current ?? ref; }}
              />
            </div>
            )
          ) : (
            <div className="shadow-2xl border border-gray-800" ref={containerRef}>
              {/* Canvas created programmatically */}
            </div>
          )
        )}
      </div>
    </div>
  );
};

// Helper: crop image using percentage area (from react-easy-crop) so crop matches loaded image exactly
async function getCroppedImg(imageSrc, croppedAreaPercent, croppedAreaPixels, mimeType = 'image/jpeg') {
  try {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    const imgW = image.naturalWidth || image.width;
    const imgH = image.naturalHeight || image.height;

    if (imgW <= 0 || imgH <= 0) return null;

    let x, y, w, h;

    if (croppedAreaPercent && typeof croppedAreaPercent.x === 'number') {
      // Use percentages so crop is computed from this image's dimensions (most reliable)
      x = (croppedAreaPercent.x / 100) * imgW;
      y = (croppedAreaPercent.y / 100) * imgH;
      w = (croppedAreaPercent.width / 100) * imgW;
      h = (croppedAreaPercent.height / 100) * imgH;
    } else if (croppedAreaPixels && typeof croppedAreaPixels.width === 'number') {
      x = croppedAreaPixels.x;
      y = croppedAreaPixels.y;
      w = croppedAreaPixels.width;
      h = croppedAreaPixels.height;
    } else {
      return null;
    }

    x = Math.round(x);
    y = Math.round(y);
    w = Math.round(w);
    h = Math.round(h);

    x = Math.max(0, Math.min(x, imgW - 1));
    y = Math.max(0, Math.min(y, imgH - 1));
    w = Math.max(1, Math.min(w, imgW - x));
    h = Math.max(1, Math.min(h, imgH - y));

    if (w <= 0 || h <= 0) {
      w = imgW;
      h = imgH;
      x = 0;
      y = 0;
    }

    canvas.width = w;
    canvas.height = h;

    ctx.drawImage(image, x, y, w, h, 0, 0, w, h);

    const outputMime = mimeType && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(URL.createObjectURL(blob));
      }, outputMime, 1.0);
    });
  } catch (e) {
    console.error("Crop helper error:", e);
    return null;
  }
}

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    if (!url) {
      reject(new Error('createImage: no url'));
      return;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      image.setAttribute('crossOrigin', 'anonymous');
    }
    image.src = url;
  });

export default ImageEditor;
