"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function Sidebar() {
  const router = useRouter();
  const { candidates, roles, setFilters, exportCSV } = useStore();
  
  const counts = useMemo(() => {
    const res = { new: 0, review: 0, approved: 0, rejected: 0 };
    candidates.forEach(c => {
      if (c.status === "new" || c.status === "review" || c.status === "approved" || c.status === "rejected") {
        res[c.status]++;
      }
    });
    return res;
  }, [candidates]);

  function go(status: string) { setFilters({ status }); router.push("/candidates"); }
  function goRole(id: string) { setFilters({ roleId: id }); router.push("/candidates"); }

  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col gap-0.5 p-3 overflow-y-auto"
      style={{ borderRight: "1px solid var(--border)" }}>
      <SLabel>All Roles</SLabel>
      <SItem label="All Candidates" badge={candidates.length} onClick={() => { setFilters({ roleId:"all" }); router.push("/candidates"); }} />
      {roles.map(r => (
        <SItem key={r.id} label={r.name} badge={r.count} onClick={() => goRole(r.id)} small />
      ))}
      <div className="h-px bg-[var(--border)] my-2" />
      <SLabel>Status Filter</SLabel>
      <SItem label="New"       badge={counts.new}      onClick={() => go("new")} />
      <SItem label="In Review" badge={counts.review}   onClick={() => go("review")} />
      <SItem label="Approved"  badge={counts.approved} onClick={() => go("approved")} accent="var(--green)" />
      <SItem label="Rejected"  badge={counts.rejected} onClick={() => go("rejected")} accent="var(--red)" />
      <div className="h-px bg-[var(--border)] my-2" />
      <SLabel>Tools</SLabel>
      <SItem label="Export CSV" onClick={exportCSV} />
    </aside>
  );
}

function SLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-widest px-2.5 pt-2 pb-1">{children}</div>;
}

function SItem({ label, badge, onClick, small, accent }: {
  label: string; badge?: number; onClick: () => void; small?: boolean; accent?: string;
}) {
  return (
    <button onClick={onClick} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl w-full text-left transition-all duration-150 border border-transparent hover:bg-[var(--glass-2)] hover:border-[var(--border)]">
      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left"
        style={{ fontSize: small ? "12px" : "13px", fontWeight: 500, color: accent ?? "var(--text-2)" }}>
        {label}
      </span>
      {badge !== undefined && (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-lg flex-shrink-0"
          style={{ background: "var(--glass-3)", border: "1px solid var(--border)", color: "var(--text-3)" }}>
          {badge}
        </span>
      )}
    </button>
  );
}
