import { useContext, useEffect, useState } from 'react';
import AuthContext from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axios from 'axios';
import {
  Plus, LogOut, MapPin, Image as ImageIcon, Video,
  UserCheck, UserCog, User, Search, Bell, ChevronDown, Edit2, Trash2, Edit, Calendar, Github, Twitter, Linkedin, FileText, X,
  LayoutDashboard, Users, Settings, Menu, CheckCircle, Clock, Wand2, Download
} from 'lucide-react';
import MediaEditor from '../components/MediaEditor';
import { AnalyticsPanel } from '../components/DashboardWidgets';
import SocialShare from '../components/SocialShare';
import UserManagement from '../components/UserManagement';
import AIPosterGenerator from '../components/AIPosterGenerator';
// Import removed unused imports from offlineStorage

const compressImage = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
        }, 'image/jpeg', 0.85); // Compress 85% quality
      };
    };
  });
};

// Quick Stat Card Component for Users
const StatCard = ({ title, count, icon: IconComponent, color }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex items-center justify-between transition-transform hover:scale-105 duration-200">
    <div>
      <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{count}</p>
    </div>
    <div className={`p-3 rounded-full ${color.bg} ${color.text}`}>
      <IconComponent className="h-6 w-6" />
    </div>
  </div>
);

const UserStatsWidget = ({ stats }) => {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <StatCard
        title="Total Users"
        count={stats.total}
        icon={Users}
        color={{ bg: 'bg-red-100', text: 'text-red-700' }}
      />
      <StatCard
        title="Admins"
        count={stats.admin}
        icon={UserCog}
        color={{ bg: 'bg-purple-100', text: 'text-purple-700' }}
      />
      <StatCard
        title="Field Reporters"
        count={stats.fieldWork}
        icon={User}
        color={{ bg: 'bg-emerald-100', text: 'text-emerald-700' }}
      />
    </div>
  );
};

// Stats for Field Reporters
const ReporterStatsWidget = ({ reports }) => {
  const stats = {
    total: reports.length,
    video: reports.filter(r => r.media?.some(m => m.type === 'video')).length,
    image: reports.filter(r => r.media?.some(m => m.type === 'image')).length,
    published: reports.filter(r => r.status === 'published').length,
    unpublished: reports.filter(r => r.status !== 'published').length
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <StatCard
        title="Total Posts"
        count={stats.total}
        icon={FileText}
        color={{ bg: 'bg-blue-100', text: 'text-blue-700' }}
      />
      <StatCard
        title="Videos"
        count={stats.video}
        icon={Video}
        color={{ bg: 'bg-purple-100', text: 'text-purple-700' }}
      />
      <StatCard
        title="Images"
        count={stats.image}
        icon={ImageIcon}
        color={{ bg: 'bg-indigo-100', text: 'text-indigo-700' }}
      />
      <StatCard
        title="Published"
        count={stats.published}
        icon={CheckCircle}
        color={{ bg: 'bg-green-100', text: 'text-green-700' }}
      />
      <StatCard
        title="Pending"
        count={stats.unpublished}
        icon={Clock}
        color={{ bg: 'bg-yellow-100', text: 'text-yellow-700' }}
      />
    </div>
  );
};

// Professional Top Navbar
const TopNavbar = ({ user, setSidebarOpen, logout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-30 sticky top-0 transition-all duration-200">
      <div className="flex items-center flex-1">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 -ml-2 mr-2 text-gray-500 hover:bg-gray-100 rounded-md focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Search Bar - Modernized */}
        <div className="hidden sm:flex relative max-w-md w-full ml-4 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400 group-focus-within:text-red-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-full leading-5 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 sm:text-sm transition-all duration-200"
            placeholder="Search reports, locations..."
          />
        </div>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4">
        <button className="p-2 text-gray-400 hover:text-red-600 relative rounded-full hover:bg-red-50 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
        </button>

        <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center cursor-pointer hover:bg-gray-50 p-1.5 pr-3 rounded-full border border-transparent hover:border-gray-100 transition-all focus:outline-none"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-red-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:flex flex-col items-start ml-3">
              <span className="text-sm font-semibold text-gray-800 leading-tight">{user?.name}</span>
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                {user?.role === 'field_work' ? 'Field Reporter' : user?.role}
              </span>
            </div>
            <ChevronDown className={`ml-2 h-3 w-3 text-gray-400 hidden md:block transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setIsDropdownOpen(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                <div className="px-4 py-3 border-b border-gray-50 mb-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Signed in as</p>
                  <p className="text-sm font-medium text-gray-900 truncate mt-1">{user?.email || user?.name}</p>
                </div>

                <div className="px-2">
                  <button
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <UserCog size={16} /> Profile Settings
                  </button>
                </div>

                <div className="border-t border-gray-100 my-2"></div>

                <div className="px-2">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

const Sidebar = ({ user, activeTab, setActiveTab, isOpen, setIsOpen, logout }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reports', label: 'All Reports', icon: FileText },
    { id: 'ai_studio', label: 'AI Studio', icon: Wand2 },
    ...(user?.role === 'admin' ? [{ id: 'users', label: 'User Management', icon: Users }] : []),
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0f172a] text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0 shadow-2xl lg:shadow-none border-r border-slate-800 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Header / Logo - Aligned Height with Navbar (h-16) */}
        <div className="flex items-center h-16 px-6 border-b border-slate-800 bg-[#0f172a]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gradient-to-tr from-red-600 to-red-500 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20">
              <span className="text-white font-black text-lg">F</span>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white leading-none">FieldWork</h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">Enterprise</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative ${isActive
                  ? 'bg-red-600/10 text-red-500'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <Icon className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-red-500' : 'text-slate-500 group-hover:text-white'}`} />
                {item.label}
                {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-500 rounded-l-full" />}
              </button>
            );
          })}
        </div>

        {/* Footer Section */}
        <div className="p-4 border-t border-slate-800 bg-[#0f172a]">
          <div className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3 mb-3 border border-slate-700/50">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-inner">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate uppercase mt-0.5">
                {user?.role === 'field_work' ? 'Field Reporter' : user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const Dashboard = () => {
  const { user, logout, token } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [keywords, setKeywords] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [location, setLocation] = useState(null);

  // Separate states for Image and Video
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageCaption, setImageCaption] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoCaption, setVideoCaption] = useState('');
  const [mediaType, setMediaType] = useState('image');

  // Media Editor State
  const [editingFile, setEditingFile] = useState(null);
  const [videoMetadata, setVideoMetadata] = useState(null);

  const [editingReportId, setEditingReportId] = useState(null);

  // Optimization State
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [visibleCount, setVisibleCount] = useState(3);

  const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  const isAdmin = user?.role === 'admin';
  const toast = useToast();

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/reports`);
      setReports(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/stats`);
      setUserStats(res.data);
    } catch (err) {
      console.error("Failed to fetch user stats", err);
    }
  };

  const handleEditReport = (report) => {
    setEditingReportId(report._id);
    setTitle(report.title);
    setDesc(report.description);
    // For location and media, we might need to handle existing data differently or let user overwrite
    if (report.location) {
      setLocation(report.location);
    }
    if (report.keywords) {
      setKeywords(report.keywords.join(', '));
    }
    if (report.hashtags) {
      setHashtags(report.hashtags.join(', '));
    }
    // Set captions from existing media
    if (report.media) {
      const imgMedia = report.media.find(m => m.type === 'image');
      const vidMedia = report.media.find(m => m.type === 'video');
      if (imgMedia) setImageCaption(imgMedia.caption || '');
      if (vidMedia) setVideoCaption(vidMedia.caption || '');
    }
    setShowForm(true);
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;

    try {
      await axios.delete(`${API_URL}/api/reports/${reportId}`);
      setReports(reports.filter(r => r._id !== reportId));
    } catch (err) {
      console.error("Failed to delete report", err);
      alert("Failed to delete report");
    }
  };

  const handleDownload = async (url, filename) => {
    try {
      // If it's a Cloudinary URL, we can use the fl_attachment flag to force the browser to download it directly
      if (url.includes('cloudinary.com')) {
        const parts = url.split('/upload/');
        if (parts.length === 2) {
          const downloadUrl = parts[0] + '/upload/fl_attachment/' + parts[1];
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        }
      }

      // Fallback for non-Cloudinary URLs or if the above logic somehow bypasses
      const response = await fetch(url, {
        mode: 'cors', // Ensure CORS is handled
      });
      if (!response.ok) throw new Error('Network response was not ok');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Direct download failed. Opening file in new tab...");
      window.open(url, '_blank');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Offline Handling
    if (isOffline) {
      alert('Offline mode currently supports basic data only. Please connect to internet to upload media.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title || `Report - ${new Date().toLocaleString()}`);
      formData.append('description', desc);
      formData.append('keywords', keywords);
      formData.append('hashtags', hashtags);
      if (location) {
        formData.append('latitude', location.latitude);
        formData.append('longitude', location.longitude);
      }

      // ---------------------------------------------------------
      // OPTIMIZED UPLOAD START
      // ---------------------------------------------------------
      setIsUploading(true);
      setUploadProgress(10);

      const mediaItems = [];
      const filesToUpload = [];

      // Identify files
      if (selectedImage) filesToUpload.push({ file: selectedImage, type: 'image', caption: imageCaption });
      if (selectedVideo) filesToUpload.push({ file: selectedVideo, type: 'video', caption: videoCaption });

      // If we have files, try client-side upload first
      if (filesToUpload.length > 0) {
        try {
          // 1. Get Signature
          const signRes = await axios.get(`${API_URL}/api/reports/upload-signature`);
          const { signature, timestamp, cloudName, apiKey } = signRes.data;

          setUploadProgress(30);

          // 2. Upload Files in Parallel
          const uploadPromises = filesToUpload.map(async (item, idx) => {
            let fileToUpload = item.file;
            // Compress Image Before Upload for Much Quicker Times
            if (item.type === 'image' && fileToUpload.type && !fileToUpload.type.includes('gif')) {
              try { fileToUpload = await compressImage(fileToUpload); } catch (e) { console.error("Compression", e); }
            }

            const data = new FormData();
            data.append("file", fileToUpload);
            data.append("api_key", apiKey);
            data.append("timestamp", timestamp);
            data.append("signature", signature);
            data.append("folder", "field_reports"); // Must match server folder

            const cloudinaryRes = await axios.post(
              `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
              data,
              {
                onUploadProgress: (p) => {
                  const percent = Math.round((p.loaded * 100) / p.total);
                  // Rough progress estimation for combined files
                  setUploadProgress(30 + (percent * 0.5));
                }
              }
            );

            return {
              url: cloudinaryRes.data.secure_url,
              publicId: cloudinaryRes.data.public_id,
              type: item.type, // 'image' or 'video'
              caption: item.caption
            };
          });

          const uploadedMedia = await Promise.all(uploadPromises);
          mediaItems.push(...uploadedMedia);

          // Add these to formData as JSON
          formData.append('mediaItems', JSON.stringify(mediaItems));

          // Clear file appends from original logic (we uploaded them manually)
          // We don't append 'media' files anymore if client upload succeeded

        } catch (uploadErr) {
          console.error("Client-side upload failed, falling back to server upload:", uploadErr);
          // Fallback: Append files normally if client upload fails
          if (selectedImage) formData.append('media', selectedImage);
          if (selectedVideo) formData.append('media', selectedVideo);

          // Append captions for fallback logic
          if (mediaType === 'image') {
            formData.append('captions', imageCaption);
            if (videoCaption) formData.append('captions', videoCaption);
          } else {
            formData.append('captions', videoCaption);
            if (imageCaption) formData.append('captions', imageCaption);
          }
        }
      }
      // ---------------------------------------------------------
      // OPTIMIZED UPLOAD END
      // ---------------------------------------------------------

      if (editingReportId) {
        await axios.put(`${API_URL}/api/reports/${editingReportId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-auth-token': token
          }
        });
      } else {
        await axios.post(`${API_URL}/api/reports`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-auth-token': token
          }
        });
      }

      setUploadProgress(100);
      toast.success(editingReportId ? 'Report updated successfully' : 'Uploaded successfully');
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setShowForm(false);
        resetForm();
        fetchReports();
      }, 500);
    } catch (err) {
      console.error(err);
      alert('Error saving report: ' + (err.response?.data?.msg || err.message));
      setIsUploading(false);
    }
  };
  const resetForm = () => {
    setTitle('Field Report');
    setDesc('');
    setKeywords('');
    setHashtags('');
    setSelectedImage(null);
    setImagePreview(null);
    setImageCaption('');
    setSelectedVideo(null);
    setVideoPreview(null);
    setVideoCaption('');
    setVideoMetadata(null);
    setLocation(null);
    setEditingReportId(null);
    setMediaType('image');
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    fetchReports();
    if (isAdmin) {
      fetchUserStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const captureLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        let addressStr = "Location Tagged";

        try {
          // Using OpenStreetMap Nominatim for Reverse Geocoding
          const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (response.data && response.data.display_name) {
            // Formatting the address to be shorter
            const addr = response.data.address;
            addressStr = [addr.road, addr.suburb, addr.city, addr.state_district].filter(Boolean).join(', ') || response.data.display_name;
          }
        } catch (error) {
          console.error("Error fetching address:", error);
          // Fallback if API fails
          addressStr = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }

        setLocation({
          latitude,
          longitude,
          address: addressStr
        });
        alert("Location captured");
      }, (error) => {
        console.error("Error getting location", error);
        alert("Unable to retrieve your location");
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image')) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    } else if (file) {
      alert("Please select a valid image file.");
    }
  };

  const handleSaveMedia = (file, metadata) => {
    // If it's a video (metadata present), we update video preview styles and metadata
    // If it's an image (no metadata or different structure), we update the file content
    if (file.type.startsWith('video')) {
      if (metadata) {
        setVideoMetadata(metadata);
      }
      setSelectedVideo(file);
      // We don't change video preview URL as it's the same file, just with CSS filters applied
    } else {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
    setEditingFile(null);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video')) {
      setSelectedVideo(file);
      setVideoPreview(URL.createObjectURL(file));
    } else if (file) {
      alert("Please select a valid video file.");
    }
  };

  const fetchTransliteration = async (text, lang) => {
    const langCode = lang === 'marathi' ? 'mr-t-i0-und' : 'hi-t-i0-und';
    try {
      const res = await axios.get(`https://inputtools.google.com/request?text=${text}&itc=${langCode}&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8`);
      if (res.data[0] === 'SUCCESS') {
        return res.data[1][0][1][0];
      }
      return text;
    } catch (e) {
      return text;
    }
  };

  const handleCaptionChange = async (val, type) => {
    const lastChar = val.slice(-1);
    const setFn = type === 'image' ? setImageCaption : setVideoCaption;

    // Simple transliteration check - if space is pressed and we detect native language context
    // For simplicity, we could toggle this with a state, but let's try to be smart
    if (lastChar === ' ') {
      const words = val.trim().split(' ');
      const lastWord = words[words.length - 1];
      if (lastWord && /[a-zA-Z]/.test(lastWord)) {
        // This is a rough check, ideally we'd have a toggle like in ImageEditor
        // But for "WOW" factor, let's just do it if it looks like a word
        // To be safe, I'll only add it if the user specifically wants it.
        // For now, let's just make the field better.
      }
    }
    setFn(val);
  };


  const formatCaption = (text) => {
    if (!text) return null;
    return text.split(/(\s+)/).map((part, i) => {
      if (part.startsWith('#')) {
        return <span key={i} className="text-red-600 font-bold">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden w-full">
      <div className="flex flex-1 items-start w-full relative">
        {/* Sidebar */}
        <Sidebar
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          logout={logout}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Navbar */}
          <TopNavbar user={user} setSidebarOpen={setSidebarOpen} logout={logout} />

          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
            <div className="max-w-7xl mx-auto">

              {isOffline && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-md flex items-start">
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      You are currently offline. Reports will be saved locally.
                    </p>
                  </div>
                </div>
              )}

              {/* Stats Section */}
              {isAdmin && activeTab === 'dashboard' && (
                <>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Overview</h2>
                  <UserStatsWidget stats={userStats} />
                  <AnalyticsPanel reports={reports} />
                </>
              )}

              {/* NEW: Stats Section for Reporters */}
              {!isAdmin && activeTab === 'dashboard' && (
                <>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">My Performance</h2>
                  <ReporterStatsWidget reports={reports} />
                </>
              )}

              {/* Reports Section */}
              {/* User Management Section */}
              {isAdmin && activeTab === 'users' && (
                <UserManagement token={token} />
              )}

              {/* AI Studio Section */}
              {activeTab === 'ai_studio' && (
                <AIPosterGenerator />
              )}

              {/* Reports Section */}
              {(activeTab === 'dashboard' || activeTab === 'reports') && (
                <>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 mt-8 gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {isAdmin ? 'All Field Reports' : 'My Reports'}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Manage and track field data submissions in real-time.
                      </p>
                    </div>

                    <div className="flex space-x-3 w-full sm:w-auto">

                      <button
                        type="button"
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      >
                        <Plus className="mr-2 h-5 w-5" />
                        New Report
                      </button>
                    </div>
                  </div>

                  {/* Recent Reports Grid */}
                  {/* News Feed List */}
                  {/* News Feed - 3 Columns Plain Format */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-24 px-2">
                    {reports.length > 0 ? (
                      reports.slice(0, visibleCount).map((report) => (
                        <article key={report._id} className="bg-white border-b border-gray-100 flex flex-col h-full">

                          {/* Plain Header */}
                          <div className="py-4 px-5 flex items-center justify-between border-b border-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-red-500/20">
                                {report.reporterId?.name?.[0]?.toUpperCase() || "R"}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 leading-tight">{report.reporterId?.name || "Field Reporter"}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                  {new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className={`text-[9px] font-black tracking-[0.1em] px-2 py-1 rounded-full uppercase ${report.status === 'published' ? 'bg-green-100 text-green-600' :
                                report.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                                }`}>
                                {report.status}
                              </span>
                            </div>
                          </div>

                          {/* Media Section - Plane Format (Full Height) */}
                          <div className="relative bg-white flex items-center justify-center overflow-hidden" onClick={() => handleEditReport(report)}>
                            {report.media && report.media.length > 0 ? (
                              report.media.some(m => m.type === 'video') ? (() => {
                                const vidMedia = report.media.find(m => m.type === 'video');
                                const videoUrl = vidMedia?.url?.startsWith('http') ? vidMedia.url : `${API_URL}${vidMedia?.url?.startsWith('/') ? '' : '/'}${vidMedia?.url || ''}`;
                                return (
                                  <video
                                    src={videoUrl}
                                    className="w-full h-auto object-contain"
                                    controls
                                    playsInline
                                    crossOrigin="anonymous"
                                    preload="metadata"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                );
                              })() : (
                                <img
                                  src={report.media[0].url?.startsWith('http') ? report.media[0].url : `${API_URL}${report.media[0].url.startsWith('/') ? '' : '/'}${report.media[0].url}`}
                                  alt={report.title}
                                  className="w-full h-auto object-contain"
                                  crossOrigin="anonymous"
                                />
                              )
                            ) : (
                              <div className="w-full h-48 flex flex-col items-center justify-center text-slate-600 bg-slate-100">
                                <ImageIcon size={32} className="mb-2 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-slate-400">No Visual Content</p>
                              </div>
                            )}

                            {/* Improved Title Overlay - Only visible if media exists */}
                            {report.title && report.media && report.media.length > 0 && (
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-5 pt-12 opacity-0 group-hover/media:opacity-100 transition-opacity duration-300">
                                <h3 className="text-white font-bold text-sm leading-tight drop-shadow-md line-clamp-2">
                                  {report.title}
                                </h3>
                              </div>
                            )}
                          </div>

                          {/* Content Section - Plain */}
                          <div className="py-6 px-5 flex-1 flex flex-col">

                            {/* Caption Section */}
                            {report.media?.[0]?.caption && (
                              <div className="mb-5 p-3.5 bg-red-50/50 rounded-2xl border-l-4 border-red-500 italic text-[11px] text-slate-700 leading-relaxed font-medium">
                                "{formatCaption(report.media.find(m => m.type === 'video')?.caption || report.media[0]?.caption)}"
                              </div>
                            )}

                            {/* Tags / Meta Section */}
                            <div className="mt-auto pt-4 border-t border-slate-50 flex flex-col gap-3">
                              {/* Hashtags */}
                              {report.hashtags?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {report.hashtags.map((tag, idx) => (
                                    <span key={idx} className="text-[9px] font-black text-red-600 bg-red-50/80 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                      {tag.startsWith('#') ? tag : `#${tag}`}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* SEO Keywords */}
                              {report.keywords?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {report.keywords.map((tag, idx) => (
                                    <span key={idx} className="text-[8px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded uppercase tracking-[0.1em]">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card Footer Actions - Plain */}
                          <div className="py-4 px-5 border-t border-gray-50 flex flex-wrap items-center justify-between gap-y-3">
                            <div className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${report.status === 'published' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                {report.status === 'published' ? 'Live Now' : 'Processing'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {(isAdmin || user?._id === report.user || user?._id === report.reporterId?._id) && (
                                <div className="flex gap-1 pr-3 border-r border-slate-200">
                                  <button onClick={() => handleEditReport(report)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Edit">
                                    <Edit size={16} />
                                  </button>
                                  <button onClick={() => handleDeleteReport(report._id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Delete">
                                    <Trash2 size={16} />
                                  </button>
                                  {isAdmin && report.media && report.media.length > 0 && (
                                    <button
                                      onClick={() => {
                                        const mediaItem = report.media.find(m => m.type === 'video') || report.media[0];
                                        if (mediaItem) {
                                          const url = mediaItem.url.startsWith('http') ? mediaItem.url : `${API_URL}${mediaItem.url.startsWith('/') ? '' : '/'}${mediaItem.url}`;
                                          const extension = mediaItem.url.split('.').pop().split(/[?#]/)[0] || (mediaItem.type === 'video' ? 'mp4' : 'jpg');
                                          handleDownload(url, `report-${report._id}.${extension}`);
                                        }
                                      }}
                                      className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                      title="Download Media"
                                    >
                                      <Download size={16} />
                                    </button>
                                  )}
                                </div>
                              )}
                              {isAdmin && (
                                <div className="pl-1">
                                  <SocialShare
                                    reportId={report._id}
                                    caption={report.media?.length > 0 ? (report.media.find(m => m.type === 'video')?.caption || report.media[0].caption) : ''}
                                    hashtags={report.hashtags}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="py-16 text-center bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="mx-auto h-12 w-12 text-gray-400 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <FileText className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No reports found</h3>
                        <p className="text-gray-500 mt-1 mb-6 text-sm">Get started by creating a new report.</p>
                        <button
                          onClick={() => { resetForm(); setShowForm(true); }}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create Report
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {reports.length > 0 && (
                    <div className="flex justify-center gap-4 mt-6 pb-20">
                      {visibleCount < reports.length && (
                        <button
                          onClick={() => setVisibleCount(prev => prev + 3)}
                          className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-full shadow-md hover:bg-red-700 focus:outline-none transition-all hover:scale-105 active:scale-95"
                        >
                          Load More
                        </button>
                      )}
                      {visibleCount > 3 && (
                        <button
                          onClick={() => setVisibleCount(3)}
                          className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-full shadow-sm hover:bg-gray-50 focus:outline-none transition-all hover:scale-105 active:scale-95"
                        >
                          Show Less
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div >

      {/* Dashboard Footer - Full Width Bottom */}
      {/* Dashboard Footer - Elegant */}
      <footer className="w-full bg-white/80 backdrop-blur-md border-t border-gray-200/60 py-8 px-4 sm:px-6 lg:px-8 z-10 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="h-6 w-6 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">F</span>
            </div>
            <p className="font-medium text-gray-700">© 2024 FieldWork Inc.</p>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="flex items-center gap-2 hover:text-red-600 transition-colors duration-200">
              Privacy
            </a>
            <a href="#" className="flex items-center gap-2 hover:text-red-600 transition-colors duration-200">
              Terms
            </a>

            <div className="h-4 w-px bg-gray-300 mx-2 hidden md:block"></div>

            <a href="#" className="hover:text-red-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-full">
              <Github className="h-4 w-4" />
            </a>
            <a href="#" className="hover:text-red-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-full">
              <Twitter className="h-4 w-4" />
            </a>
            <a href="#" className="hover:text-red-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-full">
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>
      </footer>

      {/* Right Drawer Form */}
      {/* Overlay */}
      {
        showForm && (
          <div
            className="fixed inset-0 z-[100] bg-gray-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowForm(false)}
          ></div>
        )
      }

      {/* Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-[101] w-full sm:w-[500px] bg-white shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${showForm ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="h-full flex flex-col bg-white">
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingReportId ? 'Edit News' : 'Global Dispatch'}</h3>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                Real-time Reporting
              </div>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-500 hover:bg-gray-50 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form id="report-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Report Title */}
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2">
                  News Headline
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What happened? (e.g. Water Logging in Deccan)"
                  className="block w-full px-4 py-4 border-2 border-slate-100 rounded-2xl text-sm bg-slate-50/10 focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all shadow-sm"
                  required
                />
              </div>



              <div className="h-px bg-slate-100 my-6"></div>              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Media Upload</label>

                {/* Media Selection with Dropdown */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Attachment Type</label>
                    <div className="relative">
                      <select
                        value={mediaType}
                        onChange={(e) => setMediaType(e.target.value)}
                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm transition duration-150 ease-in-out appearance-none shadow-sm cursor-pointer"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {mediaType === 'image' ? (
                          <ImageIcon className="h-5 w-5 text-red-500" />
                        ) : (
                          <Video className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Upload Area */}
                  <div className="relative h-56 w-full transition-all duration-300">
                    {mediaType === 'video' ? (
                      /* Video Upload Box */
                      <div className="absolute inset-0 w-full h-full animate-in fade-in zoom-in-95 duration-200">
                        <input
                          type="file"
                          id="video-upload"
                          className="sr-only"
                          onChange={handleVideoChange}
                          accept="video/*"
                        />
                        {videoPreview ? (
                          <div className="relative w-full h-full rounded-xl overflow-hidden group border-2 border-red-500 shadow-md bg-black">
                            <video
                              src={videoPreview}
                              className="w-full h-full object-contain bg-black"
                              controls
                              playsInline
                              style={videoMetadata ? {
                                filter: `brightness(${videoMetadata.brightness}%) contrast(${videoMetadata.contrast}%)`
                              } : {}}
                            />
                            {/* Text Overlay Preview */}
                            {videoMetadata?.textOverlay && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                <h4 className="text-white font-bold text-lg drop-shadow-md">{videoMetadata.textOverlay}</h4>
                              </div>
                            )}

                            {/* Action Buttons (Top Right) */}
                            <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20">
                              <button
                                type="button"
                                onClick={() => setEditingFile(selectedVideo)}
                                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                                title="Edit Video"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => document.getElementById('video-upload').click()}
                                className="p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-colors shadow-lg border border-white/30"
                                title="Replace Video"
                              >
                                <Video size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => { setSelectedVideo(null); setVideoPreview(null); setVideoMetadata(null); }}
                                className="p-2 bg-red-500/90 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                title="Remove Video"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label
                            htmlFor="video-upload"
                            className="w-full h-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-red-500 hover:bg-red-50 transition-all group bg-gray-50"
                          >
                            <div className="p-4 rounded-full mb-3 bg-white shadow-sm text-red-100 group-hover:text-red-600 group-hover:scale-110 transition-all ring-8 ring-red-50">
                              <Video className="h-8 w-8 text-red-500" />
                            </div>
                            <span className="text-sm font-semibold text-gray-900 mb-1">Upload Video</span>
                            <span className="text-xs text-gray-500">MP4, WebM up to 50MB</span>
                          </label>
                        )}
                      </div>
                    ) : (
                      /* Image Upload Box */
                      <div className="absolute inset-0 w-full h-full animate-in fade-in zoom-in-95 duration-200">
                        <input
                          type="file"
                          id="image-upload"
                          className="sr-only"
                          onChange={handleImageChange}
                          accept="image/*"
                        />
                        {imagePreview ? (
                          <div className="relative w-full h-full rounded-xl overflow-hidden group border-2 border-red-500 shadow-md">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-2 pointer-events-auto">
                              <button
                                type="button"
                                onClick={() => setEditingFile(selectedImage)}
                                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-full hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg"
                              >
                                <Edit2 size={14} /> Edit Image
                              </button>
                              <button
                                type="button"
                                onClick={() => document.getElementById('image-upload').click()}
                                className="px-4 py-2 bg-white/20 backdrop-blur-md text-white text-sm font-medium rounded-full hover:bg-white/30 transition-colors"
                              >
                                Replace
                              </button>
                              <button
                                type="button"
                                onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                                className="p-2 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors"
                                title="Remove Image"
                              >
                                <X size={20} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label
                            htmlFor="image-upload"
                            className="w-full h-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-red-500 hover:bg-red-50 transition-all group bg-gray-50"
                          >
                            <div className="p-4 rounded-full mb-3 bg-white shadow-sm text-red-100 group-hover:text-red-600 group-hover:scale-110 transition-all ring-8 ring-red-50">
                              <ImageIcon className="h-8 w-8 text-red-500" />
                            </div>
                            <span className="text-sm font-semibold text-gray-900 mb-1">Upload Image</span>
                            <span className="text-xs text-gray-500">JPG, PNG, GIF up to 10MB</span>
                          </label>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Media Caption Input */}
                  {((mediaType === 'image' && imagePreview) || (mediaType === 'video' && videoPreview) || editingReportId) && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-black text-slate-900 uppercase tracking-[0.15em]">
                          {mediaType === 'image' ? 'Image' : 'Video'} Captioning
                        </label>
                        <div className="flex gap-2">
                          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full uppercase">Professional</span>
                        </div>
                      </div>
                      <textarea
                        value={mediaType === 'image' ? imageCaption : videoCaption}
                        onChange={(e) => mediaType === 'image' ? setImageCaption(e.target.value) : setVideoCaption(e.target.value)}
                        placeholder={`Write a compelling caption for this ${mediaType}...`}
                        rows="3"
                        className="block w-full px-4 py-4 border-2 border-slate-100 rounded-2xl text-sm bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all resize-none shadow-sm"
                      />
                      <p className="mt-2 text-[10px] text-slate-400 font-medium italic">
                        * This caption will appear on social platforms when you publish.
                      </p>
                    </div>
                  )}

                  {/* Dedicated Hashtags Box */}
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-6 h-6 bg-red-600 text-white rounded-md flex items-center justify-center text-sm">#</span>
                        Social Hashtags
                      </label>
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full uppercase">Trending</span>
                    </div>

                    <div className="group relative mb-4">
                      <input
                        type="text"
                        value={hashtags}
                        onChange={(e) => setHashtags(e.target.value)}
                        placeholder="Add tags separated by commas..."
                        className="block w-full px-4 py-4 border-2 border-slate-100 rounded-2xl text-sm bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all shadow-sm font-bold text-red-600"
                      />
                    </div>

                    {/* Quick Selection Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {['FieldReport', 'Breaking', 'PuneNews', 'LiveUpdate', 'Verified'].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (!hashtags.includes(tag)) {
                              setHashtags(prev => `${prev}${prev ? ', ' : ''}${tag}`);
                            }
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition-all shadow-sm flex items-center gap-1"
                        >
                          <Plus size={10} /> #{tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SEO & Keywords Input */}
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-xs font-black text-slate-900 uppercase tracking-[0.15em] flex items-center gap-2">
                        <Search size={16} className="text-slate-400" />
                        SEO & Meta Content
                      </label>
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full uppercase italic">Indexing</span>
                    </div>
                    <div className="group relative">
                      <input
                        type="text"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="Internal keywords (comma separated)..."
                        className="block w-full px-4 py-4 border-2 border-slate-100 rounded-2xl text-sm bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                    <p className="mt-3 text-[10px] text-slate-400 font-medium leading-relaxed">
                      Keywords help search engines and admins categorize your report. Separate with commas.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end bg-gray-50 px-6 py-4 border-t border-gray-100 z-20">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2.5 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="report-form"
              disabled={isUploading}
              className="inline-flex justify-center items-center py-2.5 px-8 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:grayscale w-full sm:w-auto"
            >
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </div>
              ) : (
                editingReportId ? 'Update Report' : 'Submit Report'
              )}
            </button>
          </div>

          {/* Full Screen Loading Overlay */}
          {isUploading && (
            <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <div className="w-14 h-14 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-600 font-medium">Uploading…</p>
              <div className="mt-4 w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">{Math.round(uploadProgress)}%</p>
            </div>
          )}        </div>
      </div>
      {/* Media Editor Modal */}
      {
        editingFile && (
          <MediaEditor
            file={editingFile}
            onSave={handleSaveMedia}
            onCancel={() => setEditingFile(null)}
          />
        )
      }
    </div >
  );
};

export default Dashboard;
