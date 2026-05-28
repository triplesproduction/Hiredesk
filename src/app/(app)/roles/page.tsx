import RolesGrid from "@/components/roles/RolesGrid";

export default function RolesPage() {
  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight">Roles</h1>
          <div className="font-mono text-[10px] text-[var(--text-3)] mt-1 uppercase tracking-widest">
            Manage hiring roles · Keywords · Scoring config
          </div>
        </div>
      </div>
      <RolesGrid />
    </div>
  );
}
