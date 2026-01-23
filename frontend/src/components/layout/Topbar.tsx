"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";

export default function Topbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur md:hidden">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-3">
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            Menu
          </button>

          <div className="text-sm font-semibold">StockDash</div>

          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            Search
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[82%] max-w-sm bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="text-sm font-semibold">Menu</div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                Close
              </button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}
    </>
  );
}
