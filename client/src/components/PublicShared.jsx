import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Github, Twitter, Linkedin, Menu, X, Video } from 'lucide-react';

export const PublicNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-red-600 to-red-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-red-200 shadow-xl transform transition-transform hover:scale-105">
              F
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-2xl tracking-tight text-gray-900 leading-none">FieldWork</span>
              <span className="text-[10px] text-red-600 font-bold uppercase tracking-widest mt-0.5">Media Engine</span>
            </div>
          </Link>

          {/* Nav Links - Center/Left Aligned */}
          <div className="hidden md:flex items-center space-x-10">
            <Link to="/features" className="text-gray-600 hover:text-red-600 font-semibold transition-colors text-sm">Features</Link>
            <Link to="/about" className="text-gray-600 hover:text-red-600 font-semibold transition-colors text-sm">About Us</Link>
            <Link to="/contact" className="text-gray-600 hover:text-red-600 font-semibold transition-colors text-sm">Contact</Link>
          </div>

          {/* Action Buttons - Right Aligned */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/login"
              className="text-gray-700 hover:text-red-600 font-bold transition-all text-sm px-4 py-2.5 rounded-xl hover:bg-red-50"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-200 hover:shadow-red-300 transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              Get Started <Video size={16} />
            </Link>
          </div>

          <div className="flex items-center md:hidden gap-4">
            <Link
              to="/login"
              className="text-xs font-bold text-red-600 px-3 py-1.5 bg-red-50 rounded-lg"
            >
              Sign In
            </Link>
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 p-4 space-y-4 shadow-2xl rounded-b-2xl absolute w-full left-0 z-50 animate-in slide-in-from-top-2">
          <Link to="/" onClick={() => setIsOpen(false)} className="block text-gray-800 hover:text-red-600 hover:bg-red-50 p-3 rounded-xl font-bold">Home</Link>
          <Link to="/features" onClick={() => setIsOpen(false)} className="block text-gray-800 hover:text-red-600 hover:bg-red-50 p-3 rounded-xl font-bold">Features</Link>
          <Link to="/about" onClick={() => setIsOpen(false)} className="block text-gray-800 hover:text-red-600 hover:bg-red-50 p-3 rounded-xl font-bold">About Us</Link>
          <Link to="/contact" onClick={() => setIsOpen(false)} className="block text-gray-800 hover:text-red-600 hover:bg-red-50 p-3 rounded-xl font-bold">Contact</Link>
          <div className="h-px bg-gray-100 my-2"></div>
          <Link
            to="/login"
            onClick={() => setIsOpen(false)}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-3.5 rounded-xl font-bold mt-2 shadow-lg shadow-red-200 flex justify-center items-center gap-2"
          >
            Access Portal
          </Link>
        </div>
      )}
    </nav>
  );
};

export const PublicFooter = () => (
  <footer className="bg-slate-900 border-t border-gray-800 pt-16 pb-8 overflow-hidden relative">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="col-span-1 md:col-span-1">
          <Link to="/" className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 bg-gradient-to-br from-red-600 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-red-500/20">
              F
            </div>
            <span className="font-extrabold text-xl text-white tracking-tight">FieldWork</span>
          </Link>
          <p className="text-gray-400 text-sm leading-relaxed">
            Empowering modern newsrooms and dynamic field teams with powerful, real-time media editing and reporting tools.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Product</h3>
          <ul className="space-y-3 text-sm text-gray-400">
            <li><Link to="/features" className="hover:text-red-400 transition-colors">Video Editor</Link></li>
            <li><Link to="/features" className="hover:text-red-400 transition-colors">AI Posters</Link></li>
            <li><Link to="/features" className="hover:text-red-400 transition-colors">Pune Lok Integration</Link></li>
            <li><Link to="/login" className="hover:text-red-400 transition-colors">Reporting Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Company</h3>
          <ul className="space-y-3 text-sm text-gray-400">
            <li><Link to="/about" className="hover:text-red-400 transition-colors">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-red-400 transition-colors">Contact</Link></li>
            <li><Link to="/contact" className="hover:text-red-400 transition-colors">Partnerships</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Connect</h3>
          <div className="flex space-x-4 mb-6">
            <a href="#" className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-all"><Github className="h-4 w-4" /></a>
            <a href="#" className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-gray-400 hover:bg-blue-500 hover:text-white transition-all"><Twitter className="h-4 w-4" /></a>
            <a href="#" className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-gray-400 hover:bg-blue-700 hover:text-white transition-all"><Linkedin className="h-4 w-4" /></a>
          </div>
          <p className="text-xs text-slate-500">Subscribe for updates directly to your inbox.</p>
        </div>
      </div>
      <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} FieldWork Media. All rights reserved.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </div>
  </footer>
);

export const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 selection:bg-red-500 selection:text-white">
      <PublicNavbar />
      <main className="flex-1 w-full flex flex-col">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
};
