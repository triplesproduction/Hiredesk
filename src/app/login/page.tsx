"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    await new Promise(r => setTimeout(r, 600));
    if (email === "admin@triplesproduction.com" && password === "TSP@2024") {
      localStorage.setItem("tsp_auth", "1");
      router.push("/");
    } else {
      setError("Invalid credentials. Please check your email and password.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex text-white overflow-hidden bg-[#030303]">
      
      {/* Premium Keyframes for Smooth Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.1); }
        }
        @keyframes subtlePan {
          0% { background-position: 0px 0px; }
          100% { background-position: 24px 24px; }
        }
        .anim-fade-in {
          animation: fadeIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-slide-up-1 {
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
          opacity: 0;
        }
        .anim-slide-up-2 {
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.25s forwards;
          opacity: 0;
        }
        .anim-slide-up-3 {
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
          opacity: 0;
        }
        .anim-pulse-glow-1 {
          animation: pulseGlow 12s ease-in-out infinite;
        }
        .anim-pulse-glow-2 {
          animation: pulseGlow 16s ease-in-out infinite alternate;
        }
        .grid-animated {
          animation: subtlePan 20s linear infinite;
        }
      `}</style>

      {/* Left Column: Visual branding showcase (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden flex-col justify-between p-12 grid-animated"
        style={{
          borderRight: "1px solid rgba(255,255,255,0.06)",
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 0)",
          backgroundSize: "24px 24px"
        }}>
        
        {/* Decorative Pulsing Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-white/10 blur-[140px] pointer-events-none anim-pulse-glow-1" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-white/5 blur-[120px] pointer-events-none anim-pulse-glow-2" />

        {/* Top bar: Product branding */}
        <div className="flex items-center gap-3.5 z-10 anim-slide-up-1">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center bg-black">
            <img src="/logo.png" alt="HireDesk Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">HireDesk</div>
            <div className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">Triple S Production</div>
          </div>
        </div>

        {/* Center: Interactive Marketing Headline & Tagline */}
        <div className="my-auto max-w-xl z-10 flex flex-col gap-6 anim-slide-up-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/[0.04] border border-white/[0.08] text-zinc-300 w-fit">
            🔒 Private Staffing Node
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight leading-[1.15] text-zinc-100">
            The private applicant desk & smart contract engine.
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed font-medium">
            Triple S Production's internal gateway for managing applicant channels, reviewing parsing evaluations, and generating localized Satara contract deliverables.
          </p>
          
          {/* Feature Badge Grid */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.04] transition-all duration-300 group">
              <span className="text-lg group-hover:scale-110 transition-transform">🤖</span>
              <div>
                <div className="text-xs font-semibold text-zinc-200">Advanced ATS Engine</div>
                <div className="text-[10px] text-zinc-500">Private OCR resume ingestion</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.04] transition-all duration-300 group">
              <span className="text-lg group-hover:scale-110 transition-transform">💼</span>
              <div>
                <div className="text-xs font-semibold text-zinc-200">SATARA Compliance</div>
                <div className="text-[10px] text-zinc-500">Standardized agency templates</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.04] transition-all duration-300 group">
              <span className="text-lg group-hover:scale-110 transition-transform">✍️</span>
              <div>
                <div className="text-xs font-semibold text-zinc-200">High-Fidelity Print</div>
                <div className="text-[10px] text-zinc-500">Symmetric signature grids</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.04] transition-all duration-300 group">
              <span className="text-lg group-hover:scale-110 transition-transform">🔐</span>
              <div>
                <div className="text-xs font-semibold text-zinc-200">Secured Node</div>
                <div className="text-[10px] text-zinc-500">Internal admin auth channel</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: License and Metadata */}
        <div className="text-[11px] text-zinc-500 font-medium z-10 flex justify-between items-center anim-slide-up-3">
          <div>HireDesk v1.2 · Internal Use Only</div>
          <div className="flex gap-4">
            <span>Triple S Production © {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>

      {/* Right Column: High-end Login Form */}
      <div className="w-full lg:w-[42%] flex flex-col justify-center px-6 sm:px-12 md:px-20 relative bg-[#050505]">
        
        {/* Subtle top horizontal accent gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        <div className="w-full max-w-[360px] mx-auto py-12 anim-slide-up-2">
          
          {/* Logo & Headline */}
          <div className="mb-8">
            <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center mb-4 bg-zinc-900 border border-white/10 shadow-2xl transition-transform hover:rotate-6 duration-300">
              <img src="/logo.png" alt="HireDesk Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Welcome Back, Admin</h1>
            <p className="text-xs text-zinc-400 mt-1.5 font-medium leading-relaxed">
              Internal recruitment engine & candidate pipelines for Triple S Production. Please authenticate to gain entry.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Internal Email</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@triplesproduction.com"
                className="w-full rounded-xl text-sm px-4 py-3 outline-none transition-all placeholder:text-zinc-600 bg-zinc-950/50 border border-white/10 text-white focus:border-white/30 focus:bg-zinc-900/50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Password</label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl text-sm px-4 py-3 outline-none transition-all placeholder:text-zinc-600 bg-zinc-950/50 border border-white/10 text-white focus:border-white/30 focus:bg-zinc-900/50"
              />
            </div>

            {error && (
              <div className="text-xs px-3 py-2.5 rounded-xl font-medium" style={{ color: "var(--red)", background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)" }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-white hover:bg-zinc-200 text-black font-bold text-sm py-3 rounded-xl transition-all duration-300 mt-1 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                "Authorize Session →"
              )}
            </button>
          </form>

          {/* Premium Default Credentials Panel */}
          <div className="mt-6 p-4 rounded-xl bg-zinc-950/60 border border-white/[0.04] relative overflow-hidden group">
            {/* Animated accent gradient flash */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs">🔑</span>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Internal Access Keys</p>
            </div>
            <div className="flex flex-col gap-1.5 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Node ID:</span>
                <span className="text-zinc-300 select-all font-semibold">admin@triplesproduction.com</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Access:</span>
                <span className="text-zinc-300 select-all font-semibold">TSP@2024</span>
              </div>
            </div>
          </div>

          {/* Footer for Mobile view */}
          <div className="mt-8 text-center lg:hidden">
            <p className="text-[10px] text-zinc-500 font-medium">HireDesk v1.2 · Triple S Production</p>
          </div>
        </div>
      </div>
    </div>
  );
}
