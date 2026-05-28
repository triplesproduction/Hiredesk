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
    <div className="min-h-screen flex text-white" style={{ background: "#050505" }}>
      {/* Left Column: Visual branding showcase (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden flex-col justify-between p-12"
        style={{
          borderRight: "1px solid rgba(255,255,255,0.06)",
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 0)",
          backgroundSize: "24px 24px"
        }}>
        
        {/* Decorative Blurred Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-white/[0.025] blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-white/[0.015] blur-[100px] pointer-events-none" />

        {/* Top bar: Product branding */}
        <div className="flex items-center gap-3.5 z-10">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center bg-black">
            <img src="/logo.png" alt="HireDesk Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">HireDesk</div>
            <div className="text-[10px] text-zinc-500 font-medium">Triple S Production</div>
          </div>
        </div>

        {/* Center: Interactive Marketing Headline & Tagline */}
        <div className="my-auto max-w-xl z-10 flex flex-col gap-6">
          <h2 className="text-4xl font-extrabold tracking-tight leading-[1.15] text-zinc-100">
            The intelligent candidate desk for high-growth agencies.
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed font-medium">
            Streamline your hiring process with automated OCR resume parsing, unified global brand asset management, and Satara-compliant smart contract generation.
          </p>
          
          {/* Feature Badge Grid */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all">
              <span className="text-lg">🤖</span>
              <div>
                <div className="text-xs font-semibold text-zinc-200">OCR Parsing</div>
                <div className="text-[10px] text-zinc-500">Automated skills detection</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all">
              <span className="text-lg">⚖️</span>
              <div>
                <div className="text-xs font-semibold text-zinc-200">Legal Compliance</div>
                <div className="text-[10px] text-zinc-500">Satara governing clauses</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all">
              <span className="text-lg">✍️</span>
              <div>
                <div className="text-xs font-semibold text-zinc-200">Unified Spacing</div>
                <div className="text-[10px] text-zinc-500">Symmetric print alignments</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all">
              <span className="text-lg">✨</span>
              <div>
                <div className="text-xs font-semibold text-zinc-200">Global Assets</div>
                <div className="text-[10px] text-zinc-500">Set logo and sign once</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: License and Metadata */}
        <div className="text-[11px] text-zinc-500 font-medium z-10 flex justify-between items-center">
          <div>HireDesk v1.1 · Made for Triple S Production</div>
          <div className="flex gap-4">
            <span className="hover:text-zinc-300 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-zinc-300 cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>

      {/* Right Column: High-end Login Form */}
      <div className="w-full lg:w-[42%] flex flex-col justify-center px-6 sm:px-12 md:px-20 relative">
        <div className="w-full max-w-[360px] mx-auto py-12">
          
          {/* Logo & Headline */}
          <div className="mb-8">
            <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center mb-4 bg-zinc-900 border border-white/10 shadow-xl">
              <img src="/logo.png" alt="HireDesk Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Welcome to HireDesk</h1>
            <p className="text-xs text-zinc-400 mt-1.5 font-medium leading-relaxed">
              Enter your administration credentials below to access candidate pipelines and contract generator systems.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Email Address</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@triplesproduction.com"
                className="w-full rounded-xl text-sm px-4 py-3 outline-none transition-all placeholder:text-zinc-600 bg-zinc-950/50 border border-white/10 text-white focus:border-white/30"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Password</label>
                <span className="text-[10px] text-zinc-500 font-semibold hover:text-zinc-300 cursor-pointer transition-colors">Forgot password?</span>
              </div>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl text-sm px-4 py-3 outline-none transition-all placeholder:text-zinc-600 bg-zinc-950/50 border border-white/10 text-white focus:border-white/30"
              />
            </div>

            {error && (
              <div className="text-xs px-3 py-2.5 rounded-xl font-medium" style={{ color: "var(--red)", background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)" }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-white hover:bg-zinc-200 text-black font-semibold text-sm py-3 rounded-xl transition-all duration-200 mt-1 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                "Sign In →"
              )}
            </button>
          </form>

          {/* Premium Default Credentials Panel */}
          <div className="mt-6 p-4 rounded-xl bg-zinc-950/60 border border-white/[0.04]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs">🔑</span>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Demo Credentials</p>
            </div>
            <div className="flex flex-col gap-1 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Email:</span>
                <span className="text-zinc-300 select-all">admin@triplesproduction.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Pass:</span>
                <span className="text-zinc-300 select-all">TSP@2024</span>
              </div>
            </div>
          </div>

          {/* Footer for Mobile view */}
          <div className="mt-8 text-center lg:hidden">
            <p className="text-[10px] text-zinc-500 font-medium">HireDesk v1.1 · Triple S Production</p>
          </div>
        </div>
      </div>
    </div>
  );
}
