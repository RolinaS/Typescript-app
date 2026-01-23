"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { label: string; href: string };

const NAV: NavItem[] = [
  { label: "Overview", href: "/" },
  { label: "Portfolio", href: "/dashboard/portfolio" },
  { label: "Watchlist", href: "/watchlist" },
  { label: "Screener", href: "/screener" },
  { label: "Settings", href: "/settings" },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex items-center justify-between rounded-2xl px-3 py-2 text-sm",
              active
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-slate-100",
            ].join(" ")}
          >
            <span className="font-medium">{item.label}</span>
            {active && (
              <span className="text-xs opacity-80">•</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
