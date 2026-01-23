import SidebarNav from "./SidebarNav";

const NAV = [
  { label: "Overview", href: "/dashboard" },
  { label: "Portfolio", href: "/dashboard/portfolio" },
  { label: "Watchlist", href: "/dashboard/watchlist" },
  { label: "Screener", href: "/dashboard/screener" },
  { label: "Settings", href: "/dashboard/settings" },
];


export default function Sidebar() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="h-9 w-9 rounded-2xl bg-slate-900" />
        <div className="leading-tight">
          <div className="text-sm font-semibold">StockDash</div>
          <div className="text-xs text-slate-500">Template</div>
        </div>
      </div>

      <div className="px-3">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-xs font-medium text-slate-500">Workspace</div>
          <div className="mt-1 text-sm font-semibold">Personal</div>
        </div>
      </div>

      <div className="mt-4 flex-1 overflow-auto px-3">
        <SidebarNav />
      </div>

      <div className="border-t border-slate-200 p-4">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Logged in as</div>
          <div className="mt-1 text-sm font-semibold">Sami</div>
        </div>
      </div>
    </div>
  );
}
