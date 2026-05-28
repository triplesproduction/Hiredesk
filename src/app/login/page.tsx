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
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-black font-black text-xl tracking-tighter">TSP</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">TSP HireDesk</h1>
          <p className="text-sm text-[var(--text-3)] mt-1 font-medium">Triple S Production · Admin Portal</p>
        </div>

        {/* Form card */}
        <div className="p-7 rounded-2xl" style={{ background: "var(--glass-2)", border: "1px solid var(--border-2)" }}>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-2">Email Address</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@triplesproduction.com"
                className="w-full rounded-xl text-sm px-4 py-3 outline-none transition-colors placeholder:text-[var(--text-3)]"
                style={{ background: "var(--glass)", border: "1px solid var(--border)", color: "var(--text)" }}
                onFocus={e => e.target.style.borderColor = "var(--border-3)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-2">Password</label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl text-sm px-4 py-3 outline-none transition-colors placeholder:text-[var(--text-3)]"
                style={{ background: "var(--glass)", border: "1px solid var(--border)", color: "var(--text)" }}
                onFocus={e => e.target.style.borderColor = "var(--border-3)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            {error && (
              <div className="text-xs px-3 py-2.5 rounded-lg font-medium" style={{ color: "var(--red)", background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)" }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-white text-black font-semibold text-sm py-3 rounded-xl transition-all duration-200 mt-1 disabled:opacity-60 hover:bg-white/90"
            >
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>

          <div className="mt-5 p-3 rounded-lg" style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
            <p className="text-xs text-[var(--text-3)] font-semibold mb-1.5">Default credentials</p>
            <p className="text-xs font-mono text-[var(--text-2)]">admin@triplesproduction.com</p>
            <p className="text-xs font-mono text-[var(--text-2)]">TSP@2024</p>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--text-3)] mt-5">TSP HireDesk v1.0 · Triple S Production</p>
      </div>
    </div>
  );
}
