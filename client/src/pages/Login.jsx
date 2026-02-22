import { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { PublicLayout } from '../components/PublicShared';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      toast.success('Login successful');
      navigate('/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <PublicLayout>
      <div className="flex-1 flex flex-col lg:flex-row h-full min-h-[calc(100vh-80px)]">
        {/* Left Side - Hero Section */}
        <div className="lg:w-1/2 w-full h-80 lg:h-auto shrink-0 relative overflow-hidden bg-slate-900 border-r border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-tr from-red-900/90 via-slate-900/95 to-slate-900/90 z-10" />
          <img
            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1200"
            alt="Field Reporter"
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40 block"
          />
          <div className="relative z-20 flex flex-col justify-center px-8 lg:px-16 h-full text-white max-w-2xl mx-auto">
            <div className="mb-6 lg:mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-400/20 text-red-300 text-xs lg:text-sm font-medium mb-4 lg:mb-6 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                Secure Workspace Login
              </div>
              <h1 className="text-3xl lg:text-5xl font-bold mb-4 lg:mb-6 leading-tight tracking-tight">
                Your creative suite, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-300">anywhere.</span>
              </h1>
              <p className="text-slate-300 text-sm lg:text-lg font-light leading-relaxed hidden sm:block">
                The all-in-one platform for modern newsrooms and field operations. Sync stories, media, and location data securely in real-time.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs font-bold shadow-lg">
                    U{i}
                  </div>
                ))}
              </div>
              <div className="content-center">
                <p className="text-sm font-bold text-white">Trusted by 500+ teams</p>
                <p className="text-xs text-slate-400 font-medium">Join the revolution today</p>
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
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Welcome back</h2>
              <p className="mt-2 text-sm text-gray-500 font-medium">
                Please sign in to your reporting dashboard.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm font-bold text-red-600 flex items-center gap-2 animate-pulse shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-2">
                  Email address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-red-500 transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm shadow-sm hover:border-gray-300"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-900 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-red-500 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm shadow-sm hover:border-gray-300"
                    placeholder="••••••••"
                  />
                </div>
                <div className="mt-2 text-right">
                  <a href="#" className="text-xs font-bold text-red-600 hover:text-red-500 transition-colors">
                    Forgot password?
                  </a>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 flex justify-center items-center py-3 px-4 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.3)] text-sm font-bold text-white bg-red-600 hover:bg-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 disabled:grayscale transition-all transform hover:-translate-y-1"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  ) : (
                    <span className="flex items-center gap-2">Sign in <ArrowRight className="h-4 w-4" /></span>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <p className="text-[10px] text-center text-gray-400 mb-4 uppercase tracking-widest font-black">Demo Accounts</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-600 cursor-pointer hover:bg-red-50 hover:border-red-200 transition-all shadow-sm hover:shadow group"
                  onClick={() => {
                    setEmail(import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@example.com');
                    setPassword(import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'admin123');
                  }}>
                  <span className="font-bold flex items-center justify-between text-gray-900 mb-1 group-hover:text-red-600 transition-colors">Admin <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /></span>
                  {import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@example.com'}
                </div>
                <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-600 cursor-pointer hover:bg-red-50 hover:border-red-200 transition-all shadow-sm hover:shadow group"
                  onClick={() => {
                    setEmail(import.meta.env.VITE_DEMO_REPORTER_EMAIL || 'field@example.com');
                    setPassword(import.meta.env.VITE_DEMO_REPORTER_PASSWORD || 'field123');
                  }}>
                  <span className="font-bold flex items-center justify-between text-gray-900 mb-1 group-hover:text-red-600 transition-colors">Reporter <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /></span>
                  {import.meta.env.VITE_DEMO_REPORTER_EMAIL || 'field@example.com'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Login;
