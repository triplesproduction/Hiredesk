"use client";
import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { useSearchParams, useRouter } from "next/navigation";
import ContractEditor from "./ContractEditor";
import GenerateContractModal from "./GenerateContractModal";
import type { Contract } from "@/types";
import { clsx } from "clsx";

const CONTRACT_META: Record<string, { color: string; roles: string[] }> = {
  "emp-ft":    { color: "#4ade80", roles: ["All Full-time roles"] },
  "intern":    { color: "#facc15", roles: ["Dev Intern", "Any Intern"] },
  "freelance": { color: "#60a5fa", roles: ["Model", "Cameraman", "Freelance"] },
  "nda":       { color: "#c084fc", roles: ["All roles — recommended"] },
  "ip":        { color: "#fb923c", roles: ["Dev", "Designer", "Content", "Marketing"] },
  "model":     { color: "#f472b6", roles: ["Model (Male)", "Model (Female)"] },
};

export default function ContractsList() {
  const { contracts } = useStore();
  const [editing, setEditing] = useState<Contract | null>(null);
  const [generating, setGenerating] = useState<Contract | null>(null);
  const [preselectedCandidateId, setPreselectedCandidateId] = useState<string>("");
  const [hasLogo, setHasLogo] = useState(false);
  const [hasSign, setHasSign] = useState(false);

  const logoRef = useRef<HTMLInputElement>(null);
  const signRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File, key: string, setter: (b: boolean) => void) {
    try {
      const { compressImage } = await import("@/lib/utils/image");
      const compressed = await compressImage(file, 400, 150);
      localStorage.setItem(key, compressed);
      setter(true);
    } catch (err) {
      console.error("Compression failed, falling back to raw data URL", err);
      const reader = new FileReader();
      reader.onload = e => {
        const url = e.target?.result as string;
        localStorage.setItem(key, url);
        setter(true);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleClear(key: string, setter: (b: boolean) => void) {
    localStorage.removeItem(key);
    setter(false);
  }

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Read saved brand assets from localStorage on initial mount
    setHasLogo(!!localStorage.getItem("tsp_logo"));
    setHasSign(!!localStorage.getItem("tsp_sign"));
  }, []);

  // Auto-open the Generate modal when arriving from "Generate Contract" on a candidate
  useEffect(() => {
    const candidateId = searchParams.get("candidateId");
    if (candidateId && contracts.length > 0) {
      setPreselectedCandidateId(candidateId);
      // Default to first contract template (Employment Agreement)
      setGenerating(contracts[0]);
      // Clean the URL so refresh doesn't re-trigger
      router.replace("/contracts");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contracts]);

  if (editing) {
    return (
      <div className="h-full animate-fade-in">
        <ContractEditor contract={editing} onBack={() => setEditing(null)} />
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Contract templates list */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {contracts.map(c => {
            const meta = CONTRACT_META[c.id] ?? { color: "#a0a0a0", roles: [] };
            return (
              <div key={c.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-4 py-4 sm:px-5 sm:py-4 rounded-2xl transition-all duration-200 hover:bg-[var(--glass-2)]"
                style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>

                {/* Icon */}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "var(--glass-3)", border: "1px solid var(--border-2)" }}>
                  {c.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold tracking-tight">{c.name}</div>
                  <div className="text-xs text-[var(--text-3)] mt-0.5 font-medium">{c.desc}</div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {meta.roles.map(r => (
                      <span key={r} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: meta.color + "18", color: meta.color, border: `1px solid ${meta.color}30` }}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 w-full sm:w-auto flex-shrink-0 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t border-white/[0.03] sm:border-t-0 justify-end">
                  <button
                    onClick={() => { setPreselectedCandidateId(""); setGenerating(c); }}
                    className="text-sm font-semibold px-4 py-2 rounded-xl transition-all flex-1 sm:flex-none text-center"
                    style={{ background: "white", color: "black" }}>
                    Generate
                  </button>
                  <button onClick={() => setEditing(c)}
                    className="text-sm font-medium px-4 py-2 rounded-xl transition-all flex-1 sm:flex-none text-center"
                    style={{ background: "var(--glass-2)", border: "1px solid var(--border-2)", color: "var(--text)" }}>
                    Edit Template
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Legal Disclaimer and Active configuration assets */}
        <div className="flex flex-col gap-4">
          {/* Legal Note */}
          <div className="p-5 rounded-2xl flex flex-col" style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">⚖️</span>
              <div>
                <div className="text-sm font-semibold mb-1.5">Legal Disclaimer</div>
                <div className="text-xs text-[var(--text-3)] leading-relaxed">
                  These templates are tailored for an Indian agency under standard Indian employment and commercial law.
                  All fields in <strong className="text-[var(--text-2)]">[BRACKETS]</strong> must be filled before use.
                  We recommend having these reviewed by a qualified legal professional before signing.
                </div>
              </div>
            </div>
          </div>

          {/* Configuration status cards */}
          <div className="p-5 rounded-2xl flex flex-col" style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
            <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-3">Global Brand Assets</div>
            
            <div className="flex flex-col gap-4">
              {/* Logo Card */}
              <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-2)]">Company Logo</span>
                  <span className={clsx("font-semibold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded",
                    hasLogo ? "bg-[var(--green)]/10 text-[var(--green)]" : "bg-[var(--yellow)]/10 text-[var(--yellow)]"
                  )}>
                    {hasLogo ? "Active" : "Missing"}
                  </span>
                </div>
                {hasLogo ? (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 rounded bg-white p-1 text-center border border-[var(--border)] overflow-hidden">
                      <img src={localStorage.getItem("tsp_logo") ?? ""} alt="Logo" className="h-8 object-contain mx-auto" />
                    </div>
                    <button onClick={() => handleClear("tsp_logo", setHasLogo)} className="text-xs text-[var(--red)] hover:text-red-400 font-medium px-2 py-1 flex-shrink-0">
                      Clear
                    </button>
                  </div>
                ) : (
                  <button onClick={() => logoRef.current?.click()} className="w-full mt-1 text-center py-2 border border-dashed border-[var(--border-2)] rounded-lg text-xs text-[var(--text-3)] hover:text-[var(--text-2)] hover:border-[var(--border-3)] transition-all">
                    + Upload Logo
                  </button>
                )}
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], "tsp_logo", setHasLogo)} />
              </div>

              {/* Signature Card */}
              <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-2)]">Authorized Signature</span>
                  <span className={clsx("font-semibold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded",
                    hasSign ? "bg-[var(--green)]/10 text-[var(--green)]" : "bg-[var(--yellow)]/10 text-[var(--yellow)]"
                  )}>
                    {hasSign ? "Active" : "Missing"}
                  </span>
                </div>
                {hasSign ? (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 rounded bg-white p-1 text-center border border-[var(--border)] overflow-hidden">
                      <img src={localStorage.getItem("tsp_sign") ?? ""} alt="Sign" className="h-8 object-contain mx-auto" />
                    </div>
                    <button onClick={() => handleClear("tsp_sign", setHasSign)} className="text-xs text-[var(--red)] hover:text-red-400 font-medium px-2 py-1 flex-shrink-0">
                      Clear
                    </button>
                  </div>
                ) : (
                  <button onClick={() => signRef.current?.click()} className="w-full mt-1 text-center py-2 border border-dashed border-[var(--border-2)] rounded-lg text-xs text-[var(--text-3)] hover:text-[var(--text-2)] hover:border-[var(--border-3)] transition-all">
                    + Upload Signature
                  </button>
                )}
                <input ref={signRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], "tsp_sign", setHasSign)} />
              </div>
            </div>
            <div className="text-[10px] text-[var(--text-3)] mt-3.5 leading-relaxed">
              * Uploading assets here automatically configures the brand design across all legal templates and contracts.
            </div>
          </div>
        </div>
      </div>

      {/* Generate modal */}
      {generating && (
        <GenerateContractModal
          contract={generating}
          preselectedCandidateId={preselectedCandidateId}
          onClose={() => { setGenerating(null); setPreselectedCandidateId(""); }}
          onEdit={(c) => { setGenerating(null); setPreselectedCandidateId(""); setEditing(c); }}
        />
      )}
    </div>
  );
}
