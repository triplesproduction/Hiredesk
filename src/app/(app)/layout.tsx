"use client";
import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import Sidebar from "@/components/layout/Sidebar";
import AuthGuard from "@/components/layout/AuthGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(prev => !prev)} />
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
