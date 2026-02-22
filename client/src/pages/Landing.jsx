import { ArrowRight, PlayCircle, Layers, Zap, PenTool } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 pt-32 pb-24 lg:pt-48 lg:pb-32">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-red-600 opacity-20 blur-[100px]"></div>
          <div className="absolute bottom-0 right-0 -z-10 m-auto h-[400px] w-[400px] rounded-full bg-blue-600 opacity-20 blur-[120px]"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-sm md:text-md text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.2)] mb-8 animate-pulse">
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-500"></span>
            Pune Lok Framework V2 Live
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-black tracking-tight text-white sm:text-7xl leading-tight mb-8">
            Create Studio-Quality <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-orange-500 drop-shadow-sm">
              News & Videos Instantly
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-slate-300 mb-12 font-light leading-relaxed">
            The ultimate workstation for field reporters. Edit videos, generate AI posters, apply Pune Lok branding, and publish your breaking news on-the-go without a sweat.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-8">
            <Link to="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-red-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-red-500/30 hover:bg-red-500 hover:shadow-red-500/50 transition-all hover:-translate-y-1">
              Start Creating <ArrowRight size={20} />
            </Link>
            <Link to="/features" className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-slate-800/80 backdrop-blur-sm border border-slate-700 px-8 py-4 text-base font-bold text-white shadow-lg hover:bg-slate-700 hover:border-slate-600 transition-all">
              <PlayCircle size={20} className="text-red-400" /> Watch Demo
            </Link>
          </div>
        </div>

        {/* Dashboard Mockup Component */}
        <div className="relative mx-auto mt-20 max-w-6xl px-4 sm:px-6 lg:px-8 z-20">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-2 shadow-2xl backdrop-blur-sm ring-1 ring-white/10 overflow-hidden transform transition-all hover:scale-[1.02] duration-500">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2000"
              alt="Dashboard Preview"
              className="rounded-xl object-cover h-[500px] w-full opacity-80"
              style={{ objectPosition: "center 20%" }}
            />
            {/* Fake UI Overlay Layer */}
            <div className="absolute inset-0 m-2 rounded-xl bg-gradient-to-b from-slate-900/50 via-transparent to-slate-900/90 pointer-events-none border border-slate-700"></div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold tracking-widest text-red-600 uppercase mb-3">Powerful Capabilities</h2>
            <h3 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">Everything you need to report.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:border-red-100 group">
              <div className="h-14 w-14 rounded-2xl bg-red-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-red-600 transition-all duration-300">
                <Layers className="h-7 w-7 text-red-600 group-hover:text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Pune Lok Framework</h4>
              <p className="text-gray-500 leading-relaxed font-medium">Apply premium branded reels and overlays automatically, ensuring your video fits perfectly inside the red Pune Lok frame.</p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:border-blue-100 group">
              <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300">
                <PenTool className="h-7 w-7 text-blue-600 group-hover:text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Advanced Editing Tool</h4>
              <p className="text-gray-500 leading-relaxed font-medium">Crop, trim, filter, add watermark logos natively inside your browser. Powered by cutting-edge WebAssembly technology.</p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:border-purple-100 group">
              <div className="h-14 w-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-600 transition-all duration-300">
                <Zap className="h-7 w-7 text-purple-600 group-hover:text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Instant Cloud Sync</h4>
              <p className="text-gray-500 leading-relaxed font-medium">Capture directly from your mobile phone, auto-tag location coordinates, and push instantly to your master publishing dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-red-600 py-24 relative overflow-hidden mt-12">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-red-500 blur-3xl opacity-50"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6 leading-tight">Ready to elevate your news feed?</h2>
          <p className="text-xl text-red-100 mb-10 font-medium">Join the thousands of reporters streaming local insights faster than ever.</p>
          <Link to="/login" className="inline-flex rounded-xl bg-white px-8 py-4 text-lg font-bold text-red-600 shadow-xl hover:bg-slate-50 hover:shadow-2xl hover:scale-105 transition-all">
            Access Reporter Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;
