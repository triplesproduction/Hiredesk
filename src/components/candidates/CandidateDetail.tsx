"use client";
import { useStore } from "@/lib/store";
import { ScoreBadge, StatusBadge, SkillTag } from "@/components/ui";
import type { Candidate } from "@/types";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Props { candidate: Candidate; onClose: () => void; }

const STATUSES: Candidate["status"][] = ["new", "review", "approved", "rejected"];

interface InfoField {
  key: keyof Candidate;
  label: string;
  icon: string;
  suffix?: string;
}

const INFO_FIELDS: InfoField[] = [
  { key: "email", label: "Email", icon: "✉" },
  { key: "phone", label: "Phone", icon: "📞" },
  { key: "city", label: "City", icon: "📍" },
  { key: "gender", label: "Gender", icon: "👤" },
  { key: "age", label: "Age", icon: "🎂", suffix: " yrs" },
  { key: "exp", label: "Experience", icon: "💼" },
  { key: "education", label: "Education", icon: "🎓" },
  { key: "appliedAt", label: "Applied", icon: "📅" },
];

export default function CandidateDetail({ candidate: c, onClose }: Props) {
  const { updateCandidate, deleteCandidate } = useStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "score" | "resume">("profile");
  const [resumeMode, setResumeMode] = useState<"pdf" | "text">(c.resumeUrl ? "pdf" : "text");

  // Inline Editing States
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState<Partial<Candidate>>({});

  // Initialize/sync editState with candidate changes
  useEffect(() => {
    setEditState({
      name: c.name,
      email: c.email,
      phone: c.phone,
      city: c.city,
      gender: c.gender,
      age: c.age,
      exp: c.exp,
      education: c.education,
      note: c.note,
    });
  }, [c]);

  function handleSave() {
    updateCandidate(c.id, editState);
    setIsEditing(false);
  }

  function handleDelete() {
    if (confirm(`Delete ${c.name}'s profile? This cannot be undone.`)) {
      deleteCandidate(c.id);
      onClose();
    }
  }

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(12px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      {/* Card */}
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl animate-scale-up"
        style={{ background: "#0a0a0a", border: "1px solid var(--border-2)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>

        {/* Top strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 pb-4 gap-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-4 flex-1">
            {/* Avatar */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0"
              style={{ background: "var(--glass-3)", border: "1px solid var(--border-2)", color: "var(--text)" }}>
              {(editState.name?.[0] ?? c.name?.[0] ?? "?").toUpperCase()}
            </div>
            
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editState.name || ""}
                  onChange={e => setEditState(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full max-w-sm bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-base font-bold text-white outline-none focus:border-white/30"
                  placeholder="Candidate Name"
                />
              ) : (
                <div className="text-lg sm:text-xl font-bold tracking-tight text-white truncate">
                  {c.name || "Unknown Candidate"}
                </div>
              )}
              
              <div className="text-xs sm:text-sm text-[var(--text-3)] font-medium mt-1">
                {c.roleName} {c.city ? `· ${c.city}` : ""}
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={c.status} />
                <ScoreBadge score={c.score.total} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-start">
            {isEditing ? (
              <button
                onClick={handleSave}
                className="text-xs font-semibold px-4 py-2 rounded-lg transition-all text-black bg-white hover:bg-zinc-200 active:scale-95 shadow-lg"
              >
                💾 Save
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-semibold px-4 py-2 rounded-lg transition-all text-white bg-[var(--glass-2)] hover:bg-[var(--glass-3)] border border-[var(--border)] active:scale-95"
              >
                ✍️ Edit Profile
              </button>
            )}

            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-3)] hover:text-white transition-colors"
              style={{ background: "var(--glass-2)", border: "1px solid var(--border)" }}>
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar px-5 sm:px-6 pt-4 pb-1">
          {(["profile", "score", "resume"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={clsx("text-sm font-medium px-4 py-2 rounded-lg transition-all capitalize border flex-shrink-0",
                activeTab === tab
                  ? "text-white border-[var(--border-2)] bg-[var(--glass-3)]"
                  : "text-[var(--text-3)] border-transparent hover:text-[var(--text-2)]"
              )}>{tab}</button>
          ))}
        </div>

        <div className="p-5 sm:p-6 pt-4">
          {activeTab === "profile" && (
            <div className="flex flex-col gap-5">

              {/* Extraction Confidence Indicators */}
              {c.extractionConfidence !== undefined && (
                <div className="flex flex-col gap-3">
                  {/* Alert panel for Low Confidence */}
                  {c.extractionConfidence < 70 && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl text-xs font-semibold leading-relaxed border"
                      style={{ background: "rgba(255,140,0,0.06)", borderColor: "rgba(255,140,0,0.25)", color: "#ff8c00" }}>
                      <span className="text-lg leading-none mt-0.5">⚠️</span>
                      <div className="flex-1">
                        <div className="font-extrabold text-[13px]">Low Confidence Name Detection ({c.extractionConfidence}%)</div>
                        <div className="text-zinc-400 mt-1 leading-normal font-medium">
                          The parser extracted this candidate name via <strong>{c.extractionSource}</strong> with low confidence. Please verify or manually correct the name if it is wrong.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Diagnostic Badge Strip */}
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium"
                    style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
                    <span className="text-[var(--text-3)] font-semibold flex items-center gap-1.5">
                      🔍 Extraction Method: <strong className="text-zinc-300 font-bold">{c.extractionSource}</strong>
                    </span>
                    <span className={clsx(
                      "px-2.5 py-0.5 rounded font-bold tracking-wide",
                      c.extractionConfidence >= 75 ? "text-[var(--green)] bg-[var(--green)]/10" : "text-[var(--yellow)] bg-[var(--yellow)]/10"
                    )}>
                      {c.extractionConfidence}% Confidence
                    </span>
                  </div>
                </div>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {INFO_FIELDS.map(({ key, label, icon, suffix = "" }) => {
                  const val = isEditing ? editState[key as keyof Candidate] : c[key as keyof Candidate];
                  const display = val ? `${val}${suffix}` : "—";
                  
                  return (
                    <div key={key} className="flex items-start gap-3 p-3.5 rounded-xl transition-all"
                      style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
                      <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-[var(--text-3)] font-semibold mb-1">{label}</div>
                        {isEditing && key !== "appliedAt" ? (
                          <input
                            type={key === "age" ? "number" : "text"}
                            value={val === undefined ? "" : String(val)}
                            onChange={e => setEditState(prev => ({ ...prev, [key]: key === "age" ? Number(e.target.value) : e.target.value }))}
                            className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-white/20"
                            placeholder={`Enter ${label}`}
                          />
                        ) : (
                          <div className="text-sm font-bold text-white truncate" title={String(val)}>{display}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Skills */}
              <div>
                <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-2">Detected Skills</div>
                <div className="flex flex-wrap gap-1.5">
                  {c.skills.length > 0
                    ? c.skills.map(s => <SkillTag key={s} label={s} />)
                    : <span className="text-sm text-[var(--text-3)]">No skills detected</span>}
                </div>
              </div>

              {/* Resume file */}
              <div>
                <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-2">Resume File</div>
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
                  <span>📄</span> {c.resumeFile || "Not uploaded"}
                </div>
              </div>

              {/* Note */}
              <div>
                <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-2">Admin Note</div>
                <textarea rows={2} placeholder="Add a private note…" 
                  value={isEditing ? (editState.note || "") : (c.note || "")}
                  onChange={e => {
                    if (isEditing) {
                      setEditState(prev => ({ ...prev, note: e.target.value }));
                    } else {
                      updateCandidate(c.id, { note: e.target.value });
                    }
                  }}
                  onBlur={e => {
                    if (!isEditing) {
                      updateCandidate(c.id, { note: e.target.value });
                    }
                  }}
                  className="w-full rounded-xl text-sm px-4 py-3 resize-none outline-none transition-colors"
                  style={{ background: "var(--glass)", border: "1px solid var(--border)", color: "var(--text)" }}
                  onFocus={e => e.target.style.borderColor = "var(--border-3)"}
                />
              </div>

              {/* Collapsible Diagnostic Panel */}
              {c.extractionMetadata && (
                <details className="group rounded-xl border border-white/5 bg-zinc-950/40 p-4 transition-all mt-1">
                  <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-bold uppercase tracking-wider text-[var(--text-3)] hover:text-white select-none">
                    <span>🛠️ Parser Diagnostic Metadata</span>
                    <span className="transition-transform group-open:rotate-180 text-xs">▼</span>
                  </summary>
                  
                  <div className="mt-4 flex flex-col gap-3.5 text-xs leading-relaxed border-t border-white/5 pt-4">
                    <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg border border-white/5">
                      <span className="text-[var(--text-3)] font-medium">OCR Fallback Engine:</span>
                      <span className={clsx("font-bold px-2 py-0.5 rounded", c.extractionMetadata.ocrUsed ? "text-[var(--yellow)] bg-[var(--yellow)]/10" : "text-zinc-500 bg-zinc-900")}>
                        {c.extractionMetadata.ocrUsed ? "Active (Scanned PDF)" : "Inactive (Native PDF Text)"}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-[var(--text-3)] font-bold block mb-2.5 uppercase tracking-wide text-[10px]">Multi-Source Name Rankings:</span>
                      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                        {c.extractionMetadata.sourceRankings && c.extractionMetadata.sourceRankings.length > 0 ? (
                          c.extractionMetadata.sourceRankings.map((rank, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-white text-[13px]">{rank.name}</span>
                                <span className="text-[10px] text-[var(--text-3)] font-medium">{rank.source}</span>
                              </div>
                              <span className={clsx(
                                "font-bold text-xs px-2 py-0.5 rounded",
                                rank.confidence >= 70 ? "text-[var(--green)] bg-[var(--green)]/10" : rank.confidence >= 40 ? "text-[var(--yellow)] bg-[var(--yellow)]/10" : "text-[var(--red)] bg-[var(--red)]/10"
                              )}>
                                {rank.confidence}% Score
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[var(--text-3)] italic text-center py-4 bg-black/20 rounded-xl border border-dashed border-white/5">No candidates extracted</div>
                        )}
                      </div>
                    </div>
                  </div>
                </details>
              )}
            </div>
          )}

          {activeTab === "score" && (
            <div className="flex flex-col gap-4 animate-fade-in">
              {/* Big score */}
              <div className="flex items-center gap-6 p-5 rounded-2xl" style={{ background: "var(--glass-2)", border: "1px solid var(--border)" }}>
                <div className="text-center">
                  <div className={clsx("text-6xl font-extrabold tracking-tighter leading-none",
                    c.score.total >= 70 ? "text-[var(--green)]" : c.score.total >= 45 ? "text-[var(--yellow)]" : "text-[var(--red)]"
                  )}>{c.score.total}</div>
                  <div className="text-xs text-[var(--text-3)] mt-1.5 font-semibold uppercase tracking-widest">Overall</div>
                </div>
                <div className="flex-1">
                  {([
                    ["Skills Match", c.score.skills, "40%"],
                    ["Experience", c.score.exp, "25%"],
                    ["Education", c.score.edu, "20%"],
                    ["Completeness", c.score.completeness, "15%"],
                  ] as [string, number, string][]).map(([label, val, wt]) => (
                    <div key={label} className="flex items-center gap-3 mb-3 last:mb-0">
                      <div className="text-xs text-[var(--text-3)] w-28 font-medium">{label}</div>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--glass-3)" }}>
                        <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${val}%` }} />
                      </div>
                      <div className="text-xs font-bold w-7 text-right">{val}</div>
                      <div className="text-xs text-[var(--text-3)] w-8">{wt}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Score legend */}
              <div className="grid grid-cols-3 gap-2">
                {[["🟢 Strong", "70–100", "var(--green)"], ["🟡 Decent", "45–69", "var(--yellow)"], ["🔴 Weak", "0–44", "var(--red)"]].map(([label, range, color]) => (
                  <div key={label} className="p-3 rounded-xl text-center" style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
                    <div className="text-sm font-semibold" style={{ color }}>{label}</div>
                    <div className="text-xs text-[var(--text-3)] mt-0.5 font-medium">{range}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "resume" && (
            c.resumeUrl ? (
              <div className="flex flex-col gap-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest">
                    {resumeMode === "pdf" ? "Original PDF Resume" : "Extracted Resume Text"}
                  </div>
                  {c.resumeText && (
                    <div className="flex p-0.5 rounded-lg border border-[var(--border)] bg-[#0c0c0c] text-xs font-semibold select-none">
                      <button
                        onClick={() => setResumeMode("pdf")}
                        className={clsx(
                          "px-3 py-1 rounded-md transition-all duration-150",
                          resumeMode === "pdf"
                            ? "bg-[var(--glass-3)] text-white shadow-sm"
                            : "text-[var(--text-3)] hover:text-[var(--text-2)]"
                        )}
                      >
                        📄 PDF View
                      </button>
                      <button
                        onClick={() => setResumeMode("text")}
                        className={clsx(
                          "px-3 py-1 rounded-md transition-all duration-150",
                          resumeMode === "text"
                            ? "bg-[var(--glass-3)] text-white shadow-sm"
                            : "text-[var(--text-3)] hover:text-[var(--text-2)]"
                        )}
                      >
                        📝 Text View
                      </button>
                    </div>
                  )}
                </div>

                {resumeMode === "pdf" ? (
                  <iframe
                    src={`${c.resumeUrl}#toolbar=0`}
                    className="w-full h-[55vh] rounded-xl border border-[var(--border)] bg-[#080808] animate-fade-in"
                  />
                ) : (
                  <div className="w-full rounded-xl text-xs font-mono p-5 overflow-y-auto max-h-[50vh] whitespace-pre-wrap leading-relaxed select-text animate-fade-in"
                    style={{ background: "#080808", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                    {c.resumeText}
                  </div>
                )}
              </div>
            ) : c.resumeText ? (
              <div className="flex flex-col gap-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest">
                    Original Extracted Resume Content
                  </div>
                  <div className="text-xs text-[var(--text-3)] bg-[var(--glass-2)] px-2.5 py-1 rounded border border-[var(--border)]">
                    PDF Document Text
                  </div>
                </div>
                <div className="w-full rounded-xl text-xs font-mono p-5 overflow-y-auto max-h-[50vh] whitespace-pre-wrap leading-relaxed select-text"
                  style={{ background: "#080808", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                  {c.resumeText}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl animate-fade-in"
                style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
                <span className="text-4xl mb-3">📄</span>
                <div className="text-sm font-semibold mb-1">No original resume text available</div>
                <div className="text-xs text-[var(--text-3)] max-w-sm">
                  This candidate was seed-generated. Real parsed resumes uploaded via the PDF uploader will display their full original text here.
                </div>
              </div>
            )
          )}

          {/* Status row */}
          <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-2.5">Update Status</div>
            <div className="flex gap-2 flex-wrap">
              {STATUSES.map(s => (
                <button key={s} onClick={() => updateCandidate(c.id, { status: s })}
                  className={clsx("text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-lg border transition-all",
                    c.status === s ? `status-${s}` : "text-[var(--text-3)] border-[var(--border)] hover:text-[var(--text-2)] hover:border-[var(--border-2)]"
                  )}>{s}</button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <button onClick={() => { onClose(); router.push(`/contracts?candidateId=${c.id}`); }}
              className="flex-1 text-sm font-semibold py-2.5 rounded-xl transition-all"
              style={{ background: "var(--glass-2)", border: "1px solid var(--border-2)", color: "var(--text)" }}>
              📄 Generate Contract
            </button>
            <button onClick={handleDelete}
              className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
              style={{ background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)", color: "var(--red)" }}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
