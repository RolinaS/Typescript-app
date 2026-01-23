export default function DashboardHomePage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-slate-600">
          Stock Market Dashboard Template — base layout (sidebar + header).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-600">Widget</div>
          <div className="mt-2 text-lg font-medium">KPI Card</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-600">Widget</div>
          <div className="mt-2 text-lg font-medium">Chart</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-600">Widget</div>
          <div className="mt-2 text-lg font-medium">Watchlist</div>
        </div>
      </div>
    </section>
  );
}
