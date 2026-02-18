import { Facebook, Youtube, Instagram, AtSign, Check, Share2, ChevronDown, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';


const SocialShare = ({ reportId, caption, hashtags }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [platforms, setPlatforms] = useState({
    facebook: false,
    youtube: false,
    instagram: false,
    threads: false
  });
  const [shared, setShared] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const dropdownRef = useRef(null);

  const allSelected = Object.values(platforms).every(Boolean);
  const someSelected = Object.values(platforms).some(Boolean);

  const formatCaption = (text) => {
    if (!text) return null;
    return text.split(/(\s+)/).map((part, i) => {
      if (part.startsWith('#')) {
        return <span key={i} className="text-red-500 font-bold">{part}</span>;
      }
      return part;
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const togglePlatform = (p) => {
    setPlatforms(prev => ({ ...prev, [p]: !prev[p] }));
  };

  const toggleAll = () => {
    const newValue = !allSelected;
    setPlatforms({
      facebook: newValue,
      youtube: newValue,
      instagram: newValue,
      threads: newValue
    });
  };

  const handleShare = async () => {
    if (!reportId) {
      console.error("No report ID provided");
      return;
    }

    setIsSharing(true);
    const API_URL = import.meta.env.VITE_API_URL;

    try {
      console.log(`Sharing report ${reportId} to`, platforms);

      const response = await axios.post(`${API_URL}/api/reports/${reportId}/share`, {
        platforms
      });

      console.log('Share result:', JSON.stringify(response.data, null, 2));

      const { results, errors } = response.data;
      const successCount = results ? Object.keys(results).length : 0;
      const errorCount = errors ? Object.keys(errors).length : 0;

      if (errorCount > 0) {
        let errorMsg = "Detailed Status:\n";

        if (results && successCount > 0) {
          errorMsg += "✅ Success:\n";
          Object.keys(results).forEach(p => errorMsg += `- ${p}\n`);
          errorMsg += "\n";
        }

        errorMsg += "❌ Failed:\n";
        Object.entries(errors).forEach(([platform, err]) => {
          let msg = "Unknown error";
          if (typeof err === 'string') {
            msg = err;
          } else if (err?.message) {
            msg = err.message;
          } else if (err?.error?.message) {
            msg = err.error.message;
          } else {
            // Try to stringify if it's an object we don't recognize
            try {
              msg = JSON.stringify(err);
            } catch (e) {
              msg = "Error details unavailable";
            }
          }
          errorMsg += `- ${platform}: ${msg}\n`;
        });

        alert(errorMsg);
      }

      if (successCount > 0) {
        setShared(true);
        setTimeout(() => {
          setShared(false);
          setIsOpen(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Error sharing report:", error);
      alert("Failed to share report. Check console for details.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 text-sm font-bold rounded-full shadow-sm transition-all duration-300 ${isOpen
          ? 'bg-red-600 text-white ring-4 ring-red-100'
          : 'bg-white text-gray-700 border border-gray-200 hover:border-red-500 hover:text-red-600'
          }`}
      >
        <Share2 size={16} />
        <span className="hidden sm:inline">Publish</span>
        <ChevronDown size={14} className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-4 w-72 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 z-50 p-5 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Select Platforms</h4>
              <p className="text-[10px] text-gray-400 font-medium">Choose where to post</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-900 p-1.5 rounded-full hover:bg-gray-50 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Caption Preview */}
          {caption && (
            <div className="mb-4 p-3 bg-red-50/50 rounded-xl border border-red-100/30 italic text-[11px] text-gray-700 leading-relaxed">
              <span className="text-red-500 font-bold not-italic mr-1">Caption:</span> "{formatCaption(caption)}"
            </div>
          )}

          {/* Hashtags Preview */}
          {hashtags && hashtags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1">
              {hashtags.map((tag, idx) => (
                <span key={idx} className="text-[9px] font-black text-red-500 bg-red-50/50 px-2 py-0.5 rounded uppercase border border-red-100/20">
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          )}

          {/* Select All Toggle */}
          <button
            onClick={toggleAll}
            className="w-full mb-4 py-1.5 px-3 rounded-lg border border-gray-100 bg-gray-50/50 flex items-center justify-between group hover:bg-red-50 hover:border-red-100 transition-all duration-200"
          >
            <span className="text-xs font-bold text-gray-500 group-hover:text-red-600">
              {allSelected ? 'Deselect All' : 'Select All Platforms'}
            </span>
            <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${allSelected ? 'bg-red-600 border-red-600' : 'bg-white border-gray-300'}`}>
              {allSelected && <Check size={10} className="text-white" strokeWidth={4} />}
            </div>
          </button>

          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'blue', hover: 'hover:border-blue-500 hover:bg-blue-50' },
              { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'pink', hover: 'hover:border-pink-500 hover:bg-pink-50' },
              { id: 'threads', label: 'Threads', icon: AtSign, color: 'black', hover: 'hover:border-black hover:bg-gray-50' },
              { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'red', hover: 'hover:border-red-500 hover:bg-red-50' },
            ].map((platform) => {
              const Icon = platform.icon;
              const isSelected = platforms[platform.id];
              const colorClasses = {
                blue: isSelected ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' : 'border-gray-100 text-gray-400',
                pink: isSelected ? 'bg-pink-50 border-pink-500 text-pink-600 shadow-sm' : 'border-gray-100 text-gray-400',
                black: isSelected ? 'bg-gray-50 border-black text-black shadow-sm' : 'border-gray-100 text-gray-400',
                red: isSelected ? 'bg-red-50 border-red-500 text-red-600 shadow-sm' : 'border-gray-100 text-gray-400',
              };

              return (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-300 ${colorClasses[platform.color]} ${platform.hover}`}
                >
                  <Icon size={24} className="mb-1.5" />
                  <span className="text-[11px] font-bold">{platform.label}</span>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <div className={`w-3 h-3 rounded-full flex items-center justify-center ${platform.color === 'blue' ? 'bg-blue-500' : platform.color === 'pink' ? 'bg-pink-500' : platform.color === 'red' ? 'bg-red-500' : 'bg-black'}`}>
                        <Check size={8} className="text-white" strokeWidth={4} />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleShare}
            disabled={!someSelected || isSharing}
            className={`w-full py-3.5 rounded-xl font-black text-sm text-white shadow-xl transition-all duration-300 transform active:scale-95 ${someSelected && !isSharing
              ? 'bg-gradient-to-r from-red-600 via-red-500 to-purple-600 hover:shadow-red-500/30'
              : 'bg-gray-200 cursor-not-allowed text-gray-400 shadow-none'
              }`}
          >
            {shared ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <Check size={14} />
                </div>
                PUBLISHED!
              </div>
            ) : isSharing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                PUBLISHING...
              </div>
            ) : (
              `PUBLISH TO ${Object.values(platforms).filter(Boolean).length || ''} PLATFORMS`
            )}
          </button>

          {/* Arrow */}
          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-b border-r border-gray-100 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
};


export default SocialShare;
