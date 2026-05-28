"use client";
import { useStore } from "@/lib/store";
import { ScoreBadge, StatusBadge, SkillTag } from "@/components/ui";
import type { Candidate } from "@/types";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

  function handleDelete() {
    if (confirm(`Delete ${c.name}'s profile? This cannot be undone.`)) {
      deleteCandidate(c.id); onClose();
    }
  }

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      {/* Card */}
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl animate-fade-in"
        style={{ background: "#131313", border: "1px solid var(--border-2)" }}>

        {/* Top strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 pb-4 gap-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0"
              style={{ background: "var(--glass-3)", border: "1px solid var(--border-2)" }}>
              {c.name?.[0] ?? "?"}
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold tracking-tight">{c.name || "Unknown Candidate"}</div>
              <div className="text-xs sm:text-sm text-[var(--text-3)] font-medium mt-0.5">{c.roleName} · {c.city}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <StatusBadge status={c.status} />
                <ScoreBadge score={c.score.total} />
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-3)] hover:text-white transition-colors self-end sm:self-start"
            style={{ background: "var(--glass-2)", border: "1px solid var(--border)" }}>
            ✕
          </button>
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
              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {INFO_FIELDS.map(({ key, label, icon, suffix = "" }) => {
                  const val = c[key as keyof Candidate];
                  const display = val ? `${val}${suffix}` : "—";
                  return (
                    <div key={key} className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
                      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs text-[var(--text-3)] font-medium mb-0.5">{label}</div>
                        <div className="text-sm font-semibold truncate" title={String(val)}>{display}</div>
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
                <textarea rows={2} placeholder="Add a private note…" defaultValue={c.note}
                  onBlur={e => updateCandidate(c.id, { note: e.target.value })}
                  className="w-full rounded-xl text-sm px-4 py-3 resize-none outline-none transition-colors"
                  style={{ background: "var(--glass)", border: "1px solid var(--border)", color: "var(--text)" }}
                  onFocus={e => e.target.style.borderColor = "var(--border-3)"}
                />
              </div>
            </div>
          )}

          {activeTab === "score" && (
            <div className="flex flex-col gap-4">
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
                  <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest animate-fade-in">
                    {resumeMode === "pdf" ? "Original PDF Resume" : "Extracted Resume Text"}
                  </div>
                  {c.resumeText && (
                    <div className="flex p-0.5 rounded-lg border border-[var(--border)] bg-[#0c0c0c] text-xs font-semibold select-none animate-fade-in">
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
                  <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest animate-fade-in">
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
