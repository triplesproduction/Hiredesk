"use client";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { useSearchParams, useRouter } from "next/navigation";
import ContractEditor from "./ContractEditor";
import GenerateContractModal from "./GenerateContractModal";
import type { Contract } from "@/types";

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

  const searchParams = useSearchParams();
  const router = useRouter();

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
    <div className="max-w-3xl animate-fade-in">
      <div className="flex flex-col gap-3">
        {contracts.map(c => {
          const meta = CONTRACT_META[c.id] ?? { color: "#a0a0a0", roles: [] };
          return (
            <div key={c.id}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 hover:bg-[var(--glass-2)]"
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
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => { setPreselectedCandidateId(""); setGenerating(c); }}
                  className="text-sm font-semibold px-4 py-2 rounded-xl transition-all"
                  style={{ background: "white", color: "black" }}>
                  Generate
                </button>
                <button onClick={() => setEditing(c)}
                  className="text-sm font-medium px-4 py-2 rounded-xl transition-all"
                  style={{ background: "var(--glass-2)", border: "1px solid var(--border-2)", color: "var(--text)" }}>
                  Edit Template
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legal note */}
      <div className="mt-6 p-5 rounded-2xl" style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0">⚖️</span>
          <div>
            <div className="text-sm font-semibold mb-1">Legal Disclaimer</div>
            <div className="text-xs text-[var(--text-3)] leading-relaxed">
              These templates are tailored for an Indian agency under standard Indian employment and commercial law.
              All fields in <strong className="text-[var(--text-2)]">[BRACKETS]</strong> must be filled before use.
              We recommend having these reviewed by a qualified legal professional before signing.
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
