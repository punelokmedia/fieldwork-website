import React, { useState } from 'react';
import axios from 'axios';
import {
  Sparkles, Download, Loader2, Image as ImageIcon,
  Wand2, X, Maximize2, RefreshCw, Check,
  Rocket, Palette, Target, Info, Share2, Plus, ArrowRight
} from 'lucide-react';
import SocialShare from './SocialShare';

const AIPosterGenerator = () => {
  const [prompt, setPrompt] = useState('Futuristic anti-gravity technology scene, premium tech gadget levitating in mid air, soft shadow below, energy particles and light streaks, dark gradient studio background, neon rim lighting, cinematic contrast, ultra realistic, sharp focus, professional product photography, modern advertisement poster layout, 4k, marketing banner design.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [rawImageUrl, setRawImageUrl] = useState(null);
  const [error, setError] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);
  const [activePreset, setActivePreset] = useState('Futuristic');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

  const presets = [
    { name: 'Futuristic', icon: Rocket, prompt: 'Futuristic anti-gravity technology scene, premium tech gadget levitating in mid air, soft shadow below, energy particles and light streaks, dark gradient studio background, neon rim lighting, cinematic contrast, ultra realistic, sharp focus, professional product photography, modern advertisement poster layout, 4k.' },
    { name: 'Abstract', icon: Palette, prompt: 'Abstract fluid energy art, vibrant procedural generation, flowing liquid metal, neon colors, cinematic lighting, 8k resolution, mathematical beauty.' },
    { name: 'Corporate', icon: Target, prompt: 'Minimalist corporate branding poster, clean lines, professional typography space, soft blue gradients, tech architecture background, high-end photography style.' }
  ];

  const handleGenerate = async () => {
    if (!prompt) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    setSaveSuccess(false);

    try {
      const token = localStorage.getItem('token');

      // 1. Neural Enhancement (Gemini Brain)
      let finalPrompt = prompt;
      try {
        const enhanceRes = await axios.post(`${API_URL}/api/ai/enhance-prompt`,
          { prompt },
          { headers: { 'x-auth-token': token } }
        );
        finalPrompt = enhanceRes.data.enhancedPrompt;
      } catch (err) {
        console.warn('Neural Enhancement bypassed');
      }

      // 2. Ultra-Reliable Synthesis Visualization
      const seed = Math.floor(Math.random() * 9999999);
      // Switching to the most universally compatible endpoint
      const cleanPrompt = finalPrompt.replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
      const visualUrl = `https://pollinations.ai/p/${encodeURIComponent(cleanPrompt)}?width=1024&height=1024&seed=${seed}&nologo=true`;

      // 3. Materialize via Secure Server Tunnel (Bypass COEP/CORS)
      const proxyUrl = `${API_URL}/api/ai/proxy-image?url=${encodeURIComponent(visualUrl)}`;

      console.log('Neural Bridge: Materializing Neural canvas via Secure Tunnel...');
      setRawImageUrl(visualUrl);
      setGeneratedImage(proxyUrl);
    } catch (err) {
      console.error('Neural Bridge Error:', err);
      setError('Neural Bridge failed. The AI engine might be busy.');
      setErrorDetail(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const convertToDataUrl = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // CRITICAL: Fix Canvas Tainted Error
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/webp'));
      };
      img.onerror = () => reject(new Error('Neural synthesis handshake failed. Please try again.'));
      img.src = url;
    });
  };

  const handleSaveToReports = async () => {
    if (!rawImageUrl || isSaving) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Publishing visual to neural feed...');

      // We send the RAW image URL to the server
      // The server will handle the download (bypassing CORS) and upload to Cloudinary
      const saveRes = await axios.post(`${API_URL}/api/ai/save-poster`,
        { imageUrl: rawImageUrl },
        { headers: { 'x-auth-token': token } }
      );

      setSaveSuccess(true);
      alert('SUCCESS: Visual materialized and published to feed!');
    } catch (err) {
      console.error(err);
      alert('Neural bridge failed during publishing. Try again.');
    } finally {
      setIsGenerating(false);
      setIsSaving(false);
    }
  };

  const triggerDownload = (url) => {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = `Punlok_Poster_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const applyPreset = (p) => {
    setActivePreset(p.name);
    setPrompt(p.prompt);
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in duration-700">

      {/* Hero Branding Section */}
      <div className="bg-slate-900 rounded-[2rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/20 blur-[100px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 blur-[100px] -ml-48 -mb-48"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-red-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              <Sparkles size={12} className="fill-red-400" />
              Neural Generation v3.0
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 leading-none">
              PUNELOK <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-500 italic">STUDIO</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl font-medium max-w-xl mx-auto md:mx-0 leading-tight">
              Materialize professional marketing posters and high-fidelity visuals using integrated AI synthesis.
            </p>
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl">
              <p className="text-3xl font-black text-white">4K</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Resolution</p>
            </div>
            <div className="p-4 bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl">
              <p className="text-3xl font-black text-white">D3</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Engine</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Control Panel - 5 cols */}
        <div className="lg:col-span-5 space-y-8 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-slate-200/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 italic">
              <ArrowRight size={20} className="text-red-500" />
              CREATIVE PARAMETERS
            </h3>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Synthesis Instructions</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your vision..."
                  className="w-full h-48 bg-slate-50 border-2 border-transparent focus:border-red-500/30 focus:bg-white rounded-[1.5rem] p-5 text-sm font-medium leading-relaxed transition-all outline-none resize-none shadow-inner"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Style Direction</label>
                <div className="grid grid-cols-1 gap-2">
                  {presets.map(p => {
                    const Icon = p.icon;
                    const isActive = activePreset === p.name;
                    return (
                      <button
                        key={p.name}
                        onClick={() => applyPreset(p)}
                        className={`flex items-center gap-4 px-6 py-4 rounded-2xl border-2 transition-all duration-300 ${isActive
                          ? 'bg-slate-950 border-slate-950 text-white shadow-xl transform -translate-y-1'
                          : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                          }`}
                      >
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <Icon size={18} />
                        </div>
                        <span className="text-sm font-black uppercase tracking-tight">{p.name} Style</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt}
            className={`w-full py-5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 shadow-2xl transform active:scale-95 group ${isGenerating || !prompt
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-red-500/40'
              }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={20} strokeWidth={3} />
                <span className="tracking-widest">MATERIALIZING...</span>
              </>
            ) : (
              <>
                <Wand2 size={20} className="group-hover:rotate-12 transition-transform" />
                <span className="tracking-widest">GENERATE VISUAL</span>
              </>
            )}
          </button>
        </div>

        {/* Right Preview Panel - 7 cols */}
        <div className="lg:col-span-7 bg-white p-6 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-slate-200/50 min-h-[600px] flex flex-col items-center justify-center relative overflow-hidden group">

          {/* Background Texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: '24px 24px' }}></div>

          {!generatedImage && !isGenerating && (
            <div className="text-center relative z-10 animate-in fade-in zoom-in-95 duration-700">
              <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
                <ImageIcon className="text-slate-200" size={48} strokeWidth={1} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2 italic">DREAM SPACE VACANT</h2>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">Describe your vision on the left to activate the neural canvas</p>
            </div>
          )}

          {isGenerating && (
            <div className="w-full max-w-lg space-y-10 relative z-10 text-center animate-pulse">
              <div className="aspect-square bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-x-0 h-1 bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-scan"></div>
                <Loader2 size={64} className="text-red-500 animate-spin" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 italic uppercase">Synthesizing Pixels</p>
                <p className="text-xs text-slate-400 font-black uppercase tracking-[0.3em] mt-2">DALL·E 3 Intelligence Engine Active</p>
              </div>
            </div>
          )}

          {generatedImage && (
            <div className="w-full h-full flex flex-col items-center animate-in zoom-in-95 duration-1000 relative z-10">
              <div className="relative group/canvas w-full max-w-[500px]">
                <div className="bg-slate-50 p-4 rounded-[3rem] shadow-2xl border border-slate-100 transition-all duration-700 group-hover/canvas:shadow-red-500/10 active:scale-[0.99] overflow-hidden">
                  <img
                    src={generatedImage}
                    alt="AI Generation"
                    className="w-full h-auto max-h-[70vh] object-contain rounded-[2rem] shadow-sm transform transition-transform duration-700 group-hover/canvas:scale-[1.01]"
                  />

                  {/* Pro Overlay Controls */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/canvas:opacity-100 transition-all rounded-[3rem] backdrop-blur-[4px] flex flex-col items-center justify-center gap-6">
                    <div className="flex gap-4">
                      <button
                        onClick={() => triggerDownload(generatedImage)}
                        className="p-5 bg-white text-slate-900 rounded-3xl shadow-2xl hover:bg-black hover:text-white transition-all transform hover:scale-110 active:scale-90"
                        title="Download to Device"
                      >
                        <Download size={28} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => window.open(generatedImage)}
                        className="p-5 bg-white/20 text-white rounded-3xl shadow-2xl hover:bg-white hover:text-black backdrop-blur-md transition-all transform hover:scale-110 active:scale-90"
                      >
                        <Maximize2 size={28} strokeWidth={2.5} />
                      </button>
                    </div>

                    {/* NEW PUBLISH BUTTON OVERLAY */}
                    <button
                      onClick={handleSaveToReports}
                      disabled={isSaving || saveSuccess}
                      className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${saveSuccess
                        ? 'bg-green-500 text-white cursor-default'
                        : 'bg-red-600 text-white hover:bg-white hover:text-red-600 shadow-2xl'
                        }`}
                    >
                      {isSaving ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : saveSuccess ? (
                        <Check size={16} />
                      ) : (
                        <Plus size={16} />
                      )}
                      {saveSuccess ? 'Published to Feed' : 'Publish to Feed'}
                    </button>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="absolute -top-4 -left-4 bg-white px-4 py-2 rounded-full shadow-xl border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Neural Link Stable
                </div>
              </div>

              <div className="mt-12 flex items-center justify-between w-full max-w-[400px] border-t border-slate-100 pt-8">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest italic">Live Synthesis Ready</span>
                </div>
                <button
                  onClick={handleGenerate}
                  className="bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all flex items-center gap-2 border border-slate-100"
                >
                  <RefreshCw size={12} /> Variant
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="relative z-20 text-center animate-in slide-in-from-top-4 duration-500">
              <div className="px-8 py-6 bg-red-50 border-2 border-red-100 rounded-[2rem] shadow-2xl">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-600">
                  <X size={24} strokeWidth={3} />
                </div>
                <h4 className="text-xl font-black text-red-900 uppercase italic mb-1">Synthesis Offline</h4>
                <p className="text-red-600/60 text-sm font-bold uppercase tracking-tighter">{error}</p>
                {errorDetail && (
                  <p className="mt-2 text-[10px] text-red-400 font-mono bg-red-100/30 p-2 rounded-lg break-all">
                    Detail: {errorDetail}
                  </p>
                )}
                <button
                  onClick={() => setError(null)}
                  className="mt-6 px-8 py-3 bg-red-600 text-white text-xs font-black rounded-full uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-200"
                >
                  Retry Materialization
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; 
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

export default AIPosterGenerator;
