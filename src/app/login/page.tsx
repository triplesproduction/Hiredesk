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
    
    try {
      // Secure server-side Supabase verification request
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem("tsp_auth", "1");
        router.push("/");
      } else {
        setError(data.error || "Authentication failed.");
      }
    } catch (err) {
      setError("Unable to connect to security gateway.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#020202]">
      
      {/* Premium Micro-Animations & Dynamic Glowing Layouts */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes driftGlow1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(40px, -30px) scale(1.15); opacity: 0.25; }
        }
        @keyframes driftGlow2 {
          0%, 100% { transform: translate(0px, 0px) scale(1.1); }
          50% { transform: translate(-30px, 40px) scale(0.9); opacity: 0.2; }
        }
        @keyframes subtlePan {
          0% { background-position: 0px 0px; }
          100% { background-position: 24px 24px; }
        }
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(255,255,255,0.04); box-shadow: 0 0 30px rgba(0,0,0,0.8); }
          50% { border-color: rgba(255,255,255,0.14); box-shadow: 0 0 45px rgba(255,255,255,0.05); }
        }
        @keyframes meshDrift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .anim-drift-1 {
          animation: driftGlow1 14s ease-in-out infinite;
        }
        .anim-drift-2 {
          animation: driftGlow2 18s ease-in-out infinite alternate;
        }
        .grid-animated {
          animation: subtlePan 18s linear infinite;
        }
        .cool-form-card {
          position: relative;
          background: rgba(8, 8, 8, 0.72) !important;
          border: 1.5px solid rgba(255, 255, 255, 0.05);
          animation: borderGlow 6s ease-in-out infinite;
          overflow: hidden;
        }
        .cool-form-card::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          background: linear-gradient(135deg, rgba(255,255,255,0.015) 0%, rgba(255,255,255,0.045) 50%, rgba(255,255,255,0.015) 100%);
          background-size: 200% 200%;
          animation: meshDrift 8s ease infinite;
          opacity: 0.9;
        }
        .anim-stagger-logo { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0s forwards; opacity: 0; }
        .anim-stagger-header { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.08s forwards; opacity: 0; }
        .anim-stagger-email { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.16s forwards; opacity: 0; }
        .anim-stagger-pass { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.24s forwards; opacity: 0; }
        .anim-stagger-btn { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.32s forwards; opacity: 0; }
        .anim-stagger-demo { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.40s forwards; opacity: 0; }
      `}</style>

      {/* Background Interactive Panning Matrix */}
      <div className="absolute inset-0 grid-animated pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.02) 1.2px, transparent 0)",
          backgroundSize: "24px 24px",
          opacity: 0.8
        }} />
      
      {/* Drifting Ambient Background Glowing Meshes */}
      <div className="absolute top-[8%] left-[22%] w-[450px] h-[450px] rounded-full bg-white/[0.035] blur-[130px] pointer-events-none anim-drift-1" />
      <div className="absolute bottom-[12%] right-[22%] w-[500px] h-[500px] rounded-full bg-white/[0.015] blur-[160px] pointer-events-none anim-drift-2" />

      {/* Main Centered Container */}
      <div className="w-full max-w-[390px] z-10 flex flex-col gap-6">
        
        {/* Company Header Block: Logo at Left Side of the Name */}
        <div className="flex flex-col items-center gap-1.5 anim-stagger-logo">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center bg-black transition-transform hover:rotate-12 duration-300">
              <img src="/logo.png" alt="HireDesk Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white leading-none">HireDesk</h1>
          </div>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
            Triple S Production · Private Gateway
          </p>
        </div>

        {/* Translucent Glassmorphic Form Card with Pulsing Glowing Border & drifting interior mesh */}
        <div className="p-8 rounded-3xl cool-form-card" 
          style={{ 
            backdropFilter: "blur(24px)",
          }}>
          
          {/* Subtle horizontal highlight line */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          
          <div className="mb-6 anim-stagger-header">
            <h2 className="text-lg font-bold text-zinc-200">Welcome Back, Admin</h2>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium leading-relaxed">
              Verify your staffing node credentials securely via Supabase Auth.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* Work Email Field */}
            <div className="anim-stagger-email">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                Work Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@triplesproduction.com"
                className="w-full rounded-xl text-sm px-4 py-3.5 outline-none transition-all placeholder:text-zinc-700 bg-zinc-950/40 border border-white/5 text-white focus:border-white/20 focus:bg-zinc-900/40"
              />
            </div>

            {/* Password Field */}
            <div className="anim-stagger-pass">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                Security Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl text-sm px-4 py-3.5 outline-none transition-all placeholder:text-zinc-700 bg-zinc-950/40 border border-white/5 text-white focus:border-white/20 focus:bg-zinc-900/40"
              />
            </div>

            {error && (
              <div className="text-xs px-3 py-2.5 rounded-xl font-medium" style={{ color: "var(--red)", background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.15)" }}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="anim-stagger-btn">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white hover:bg-zinc-200 text-black font-bold text-sm py-3.5 rounded-xl transition-all duration-300 mt-2 disabled:opacity-60 flex items-center justify-center gap-2 shadow-xl active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Authorize session →"
                )}
              </button>
            </div>
          </form>

          {/* Secure Admin Demo Credentials Guide */}
          <div className="mt-6 p-4 rounded-xl bg-zinc-950/50 border border-white/[0.02] anim-stagger-demo">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs">🔑</span>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Access Node Keys</p>
            </div>
            <div className="flex flex-col gap-1 font-mono text-xs text-zinc-400">
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="select-all text-zinc-300">admin@triplesproduction.com</span>
              </div>
              <div className="flex justify-between">
                <span>Password:</span>
                <span className="select-all text-zinc-300">TSP@2024</span>
              </div>
            </div>
          </div>
        </div>

        {/* Private Node Footer */}
        <p className="text-center text-[10px] text-zinc-600 font-semibold tracking-widest uppercase">
          HIREDESK · PRIVATE STAFFING GATEWAY
        </p>
      </div>
    </div>
  );
}
