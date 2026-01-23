import type { ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Topbar />

      <div className="mx-auto flex w-full max-w-[1400px] gap-0">
        <aside className="hidden md:block md:w-72 md:shrink-0">
          <div className="sticky top-0 h-screen border-r border-slate-200 bg-white">
            <Sidebar />
          </div>
        </aside>

        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
