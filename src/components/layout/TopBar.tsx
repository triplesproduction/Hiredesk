"use client";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useStore } from "@/lib/store";

const NAV = [
  { label: "Dashboard", href: "/" },
  { label: "Candidates", href: "/candidates" },
  { label: "Upload", href: "/upload" },
  { label: "Contracts", href: "/contracts" },
  { label: "Roles", href: "/roles" },
];

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { candidates } = useStore();

  function handleLogout() {
    localStorage.removeItem("tsp_auth");
    router.push("/login");
  }

  return (
    <header className="h-[54px] flex items-center justify-between px-5 flex-shrink-0 z-40"
      style={{ background: "rgba(10,10,10,0.95)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(20px)" }}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
          <img src="/logo.png" alt="HireDesk Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight leading-tight">HireDesk</div>
          <div className="text-[10px] text-[var(--text-3)] font-medium leading-tight">Triple S Production</div>
        </div>
      </div>

      <nav className="flex gap-0.5">
        {NAV.map(n => (
          <button key={n.href} onClick={() => router.push(n.href)}
            className={clsx(
              "text-sm font-medium px-4 py-2 rounded-lg transition-all duration-150 border",
              pathname === n.href
                ? "text-white bg-[var(--glass-3)] border-[var(--border-2)]"
                : "text-[var(--text-2)] bg-transparent border-transparent hover:text-white hover:bg-[var(--glass-2)]"
            )}>
            {n.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <div className="text-xs text-[var(--text-3)] px-3 py-1.5 border border-[var(--border)] rounded-lg font-medium">
          {candidates.length} candidates
        </div>
        <button onClick={handleLogout}
          className="text-xs text-[var(--text-3)] hover:text-[var(--text)] px-3 py-1.5 border border-[var(--border)] rounded-lg transition-colors font-medium">
          Sign Out
        </button>
      </div>
    </header>
  );
}
