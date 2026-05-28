"use client";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useStore } from "@/lib/store";
import { Menu } from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/" },
  { label: "Candidates", href: "/candidates" },
  { label: "Upload", href: "/upload" },
  { label: "Contracts", href: "/contracts" },
  { label: "Roles", href: "/roles" },
];

export default function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { candidates } = useStore();

  function handleLogout() {
    localStorage.removeItem("tsp_auth");
    router.push("/login");
  }

  return (
    <header className="h-[54px] flex items-center justify-between px-4 sm:px-5 flex-shrink-0 z-40"
      style={{ background: "rgba(10,10,10,0.95)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(20px)" }}>
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuClick}
          className="flex lg:hidden w-8 h-8 rounded-lg items-center justify-center text-[var(--text-2)] hover:text-white hover:bg-[var(--glass-2)] transition-colors border border-[var(--border)]"
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
          <img src="/logo.png" alt="HireDesk Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="text-xs sm:text-sm font-bold tracking-tight leading-tight">HireDesk</div>
          <div className="text-[9px] sm:text-[10px] text-[var(--text-3)] font-medium leading-tight">Triple S Production</div>
        </div>
      </div>

      <nav className="hidden lg:flex gap-0.5">
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

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="text-[10px] sm:text-xs text-[var(--text-3)] px-2.5 py-1 sm:px-3 sm:py-1.5 border border-[var(--border)] rounded-lg font-medium">
          {candidates.length} <span className="hidden xs:inline">candidates</span><span className="xs:hidden">cand.</span>
        </div>
        <button onClick={handleLogout}
          className="hidden sm:block text-xs text-[var(--text-3)] hover:text-[var(--text)] px-3 py-1.5 border border-[var(--border)] rounded-lg transition-colors font-medium">
          Sign Out
        </button>
      </div>
    </header>
  );
}
