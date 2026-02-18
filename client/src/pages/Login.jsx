import { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, ArrowRight, Github, Twitter, Linkedin, Menu, X } from 'lucide-react';

const PublicNavbar = ({ onSelectLogin }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold shadow-red-200 shadow-lg">
              F
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">FieldWork</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-600 hover:text-red-600 font-medium transition-colors">Features</a>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => onSelectLogin('reporter')}
              className="text-gray-600 hover:text-red-600 font-medium transition-colors"
            >
              Reporter Login
            </button>
            <button
              onClick={() => onSelectLogin('admin')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
            >
              Admin Login
            </button>
          </div>
        </div>

        <div className="flex items-center md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600">
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {
        isOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-4 shadow-lg rounded-b-xl">
            <a href="#" className="block text-gray-600 hover:text-red-600 font-medium">Features</a>
            <button
              onClick={() => { onSelectLogin('reporter'); setIsOpen(false); }}
              className="block w-full text-left text-gray-600 hover:text-red-600 font-medium py-2"
            >
              Reporter Login
            </button>
            <button
              onClick={() => { onSelectLogin('admin'); setIsOpen(false); }}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg font-medium mt-2"
            >
              Admin Login
            </button>
          </div>
        )
      }
    </nav >
  );
};

const PublicFooter = () => (
  <footer className="bg-white border-t border-gray-100 py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-6 bg-red-600 rounded-md flex items-center justify-center text-white font-bold text-xs">
              F
            </div>
            <span className="font-bold text-lg text-gray-900">FieldWork</span>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed">
            Empowering field teams with real-time tools for better data and faster decisions.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><a href="#" className="hover:text-red-600 transition-colors">Features</a></li>
            <li><a href="#" className="hover:text-red-600 transition-colors">Integrations</a></li>
            <li><a href="#" className="hover:text-red-600 transition-colors">Security</a></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><a href="#" className="hover:text-red-600 transition-colors">About</a></li>
            <li><a href="#" className="hover:text-red-600 transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-red-600 transition-colors">Blog</a></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Connect</h3>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-400 hover:text-red-600 transition-colors"><Github className="h-5 w-5" /></a>
            <a href="#" className="text-gray-400 hover:text-red-600 transition-colors"><Twitter className="h-5 w-5" /></a>
            <a href="#" className="text-gray-400 hover:text-red-600 transition-colors"><Linkedin className="h-5 w-5" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
        <p>© 2024 FieldWork Inc. All rights reserved.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-red-600 transition-colors">Privacy</a>
          <a href="#" className="hover:text-red-600 transition-colors">Terms</a>
          <a href="#" className="hover:text-red-600 transition-colors">Cookies</a>
        </div>
      </div>
    </div>
  </footer>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSelect = (type) => {
    if (type === 'admin') {
      setEmail(import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@example.com');
      setPassword(import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'admin123');
    } else {
      setEmail(import.meta.env.VITE_DEMO_REPORTER_EMAIL || 'field@example.com');
      setPassword(import.meta.env.VITE_DEMO_REPORTER_PASSWORD || 'field123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <PublicNavbar onSelectLogin={handleLoginSelect} />

      <div className="flex-1 flex flex-col lg:flex-row h-full min-h-[calc(100vh-64px)]">
        {/* Left Side - Hero Section */}
        <div className="lg:w-1/2 w-full h-80 lg:h-auto shrink-0 relative overflow-hidden bg-slate-900">
          <div className="absolute inset-0 bg-gradient-to-tr from-red-900/90 via-slate-900/95 to-slate-900/90 z-10" />
          <img
            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1200"
            alt="Field Reporter"
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40 block"
          />
          <div className="relative z-20 flex flex-col justify-center px-8 lg:px-16 h-full text-white max-w-2xl mx-auto">
            <div className="mb-6 lg:mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-400/20 text-red-300 text-xs lg:text-sm font-medium mb-4 lg:mb-6">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                New: Offline Mode Available
              </div>
              <h1 className="text-3xl lg:text-5xl font-bold mb-4 lg:mb-6 leading-tight tracking-tight">
                Field Reporting, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-300">Reimagined.</span>
              </h1>
              <p className="text-slate-300 text-sm lg:text-lg font-light leading-relaxed hidden sm:block">
                The all-in-one platform for modern newsrooms and field operations. Sync stories, media, and location data securely in real-time.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs font-bold">
                    U{i}
                  </div>
                ))}
              </div>
              <div className="content-center">
                <p className="text-sm font-medium text-white">Trusted by 500+ teams</p>
                <p className="text-xs text-slate-400">Join the revolution today</p>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-900 to-transparent z-20"></div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-white relative">
          <div className="mx-auto w-full max-w-sm lg:w-96 py-12">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
              <p className="mt-2 text-sm text-gray-500">
                Please sign in to your dashboard.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 flex items-center gap-2 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>
                <div className="mt-2 text-right">
                  <a href="#" className="text-xs font-medium text-red-600 hover:text-red-500">
                    Forgot password?
                  </a>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-red-500/20 text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 disabled:grayscale transition-all transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-2">Sign in <ArrowRight className="h-4 w-4" /></span>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <p className="text-xs text-center text-gray-500 mb-4 uppercase tracking-wider font-semibold">Demo Accounts</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-600 cursor-pointer hover:bg-red-50 hover:border-red-100 transition-all hover:shadow-sm"
                  onClick={() => {
                    setEmail(import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@example.com');
                    setPassword(import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'admin123');
                  }}>
                  <span className="font-bold block text-gray-900 mb-1">Admin</span>
                  {import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@example.com'}
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-600 cursor-pointer hover:bg-red-50 hover:border-red-100 transition-all hover:shadow-sm"
                  onClick={() => {
                    setEmail(import.meta.env.VITE_DEMO_REPORTER_EMAIL || 'field@example.com');
                    setPassword(import.meta.env.VITE_DEMO_REPORTER_PASSWORD || 'field123');
                  }}>
                  <span className="font-bold block text-gray-900 mb-1">Reporter</span>
                  {import.meta.env.VITE_DEMO_REPORTER_EMAIL || 'field@example.com'}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Link */}
          <div className="absolute bottom-6 left-0 w-full text-center">
            <p className="text-xs text-gray-400">
              Don't have an account? <a href="#" className="text-red-600 hover:underline">Contact Sales</a>
            </p>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};

export default Login;
