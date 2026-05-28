"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [accessKey, setAccessKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Secure server-side verification request
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessKey }),
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
      
      {/* Premium Micro-Animations and Immersive Backdrops */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes driftGlow1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(30px, -40px) scale(1.15); opacity: 0.3; }
        }
        @keyframes driftGlow2 {
          0%, 100% { transform: translate(0px, 0px) scale(1.1); }
          50% { transform: translate(-40px, 30px) scale(0.9); opacity: 0.25; }
        }
        @keyframes subtlePan {
          0% { background-position: 0px 0px; }
          100% { background-position: 24px 24px; }
        }
        .anim-slide-up {
          animation: slideUp 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-drift-1 {
          animation: driftGlow1 12s ease-in-out infinite;
        }
        .anim-drift-2 {
          animation: driftGlow2 16s ease-in-out infinite alternate;
        }
        .grid-animated {
          animation: subtlePan 15s linear infinite;
        }
      `}</style>

      {/* Interactive Panning Background Matrix */}
      <div className="absolute inset-0 grid-animated pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.02) 1.2px, transparent 0)",
          backgroundSize: "24px 24px",
          opacity: 0.8
        }} />
      
      {/* Drifting Luxury Glowing Orbs */}
      <div className="absolute top-[10%] left-[20%] w-[450px] h-[450px] rounded-full bg-white/[0.04] blur-[130px] pointer-events-none anim-drift-1" />
      <div className="absolute bottom-[15%] right-[20%] w-[500px] h-[500px] rounded-full bg-white/[0.02] blur-[150px] pointer-events-none anim-drift-2" />

      {/* Main Centered Container */}
      <div className="w-full max-w-[390px] z-10 anim-slide-up flex flex-col gap-6">
        
        {/* Company Header Block: Logo at Left Side of the Name */}
        <div className="flex flex-col items-center gap-1.5">
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

        {/* Translucent Glassmorphic Form Card */}
        <div className="p-8 rounded-3xl relative overflow-hidden" 
          style={{ 
            background: "rgba(8, 8, 8, 0.75)", 
            border: "1px solid rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)"
          }}>
          
          {/* Subtle horizontal highlight line */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          
          <div className="mb-6">
            <h2 className="text-lg font-bold text-zinc-200">Welcome Back, Admin</h2>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium leading-relaxed">
              Verify the master authorization node key to start your staffing session.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5">
                Master Security Key
              </label>
              <input
                type="password"
                required
                value={accessKey}
                onChange={e => setAccessKey(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl text-sm px-4 py-3.5 outline-none transition-all placeholder:text-zinc-700 bg-zinc-950/40 border border-white/5 text-white focus:border-white/20 focus:bg-zinc-900/40"
              />
            </div>

            {error && (
              <div className="text-xs px-3 py-2.5 rounded-xl font-medium" style={{ color: "var(--red)", background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.15)" }}>
                {error}
              </div>
            )}

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
          </form>

          {/* Minimal Secure Demo Credentials Guide */}
          <div className="mt-6 p-4 rounded-xl bg-zinc-950/50 border border-white/[0.02]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs">🔑</span>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Access Node Keys</p>
            </div>
            <div className="flex justify-between items-center font-mono text-xs">
              <span className="text-zinc-600">Access Key:</span>
              <span className="text-zinc-400 select-all font-medium">TSP@2024</span>
            </div>
          </div>
        </div>

        {/* Minimal Private Node Footer */}
        <p className="text-center text-[10px] text-zinc-600 font-semibold tracking-widest uppercase">
          HIREDESK · PRIVATE STAFFING GATEWAY
        </p>
      </div>
    </div>
  );
}
