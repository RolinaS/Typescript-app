"use client";

import { useEffect, useMemo, useState } from "react";

type Holding = {
  id: string;
  code: string;          // ex: ESE
  symbol?: string;       // ex: ESE.PA
  name: string;          // BNP Paribas Easy S&P 500...
  currency: string;      // EUR

  quantity: string;          // total lots qty
  invested_value?: string;   // somme(qty * buy_price) (renvoyé par l'API)

  market_price?: string;     // prix du marché (table market_quotes)
  previous_close?: string;   // optionnel (plus utilisé ici)
};

function n(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function fmtEUR(v: string | number | null | undefined) {
  const num = typeof v === "string" ? Number(v) : v ?? 0;
  const safe = Number.isFinite(num) ? num : 0;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(safe);
}

function fmtPct(v: number) {
  const safe = Number.isFinite(v) ? v : 0;
  return `${safe.toFixed(2).replace(".", ",")} %`;
}

function WatchCard({
  title,
  subtitle,
  price,
  totalGain,
  totalGainPct,
  value,
  invested,
  updatedAtLabel,
}: {
  title: string;
  subtitle?: string;
  price: number;
  totalGain: number;
  totalGainPct: number;
  value: number;
  invested: number;
  updatedAtLabel?: string;
}) {
  const up = totalGain >= 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suivi temps réel</div>
          <div className="mt-1 truncate text-lg font-semibold">{title}</div>
          {subtitle && <div className="mt-1 truncate text-sm text-slate-600">{subtitle}</div>}
        </div>

        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prix</div>
          <div className="mt-1 text-2xl font-semibold">{fmtEUR(price)}</div>
        </div>
      </div>

      {/* 🔥 ICI : on affiche le GAIN TOTAL (au lieu du gain du jour) */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={up ? "text-emerald-700 font-semibold" : "text-red-700 font-semibold"}>
            {up ? "+" : ""}
            {fmtEUR(totalGain)}
          </div>

          <span
            className={[
              "rounded-xl px-3 py-1 text-sm font-semibold",
              up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
            ].join(" ")}
          >
            {up ? "↑" : "↓"} {fmtPct(totalGainPct)}
          </span>
        </div>

        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Valeur</div>
          <div className="mt-1 font-semibold">{fmtEUR(value)}</div>
          <div className="mt-1 text-xs text-slate-500">Investi : {fmtEUR(invested)}</div>
        </div>
      </div>

      {updatedAtLabel && <div className="mt-3 text-xs text-slate-500">Dernière mise à jour : {updatedAtLabel}</div>}
    </div>
  );
}

export default function OverviewPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/portfolio", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erreur API /api/portfolio");
      setHoldings(data);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 10_000);
    return () => clearInterval(t);
  }, []);

  // Carte dédiée ESE
  const ese = useMemo(
    () => holdings.find((h) => h.code === "ESE" || h.symbol === "ESE.PA"),
    [holdings]
  );

  const price = n(ese?.market_price);
  const qty = n(ese?.quantity);
  const value = price * qty;

  const invested = n(ese?.invested_value);
  const totalGain = value - invested;
  const totalGainPct = invested === 0 ? 0 : (totalGain / invested) * 100;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-slate-600">Suivi en temps réel des valeurs que tu surveilles (polling).</p>
        </div>

        <button
          onClick={refresh}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
          disabled={loading}
        >
          Rafraîchir
        </button>
      </div>

      {ese ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <WatchCard
            title="ESE"
            subtitle={ese.name}
            price={price}
            totalGain={totalGain}
            totalGainPct={totalGainPct}
            value={value}
            invested={invested}
            updatedAtLabel={lastRefresh ? lastRefresh.toLocaleString("fr-FR") : undefined}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          Aucune position <b>ESE</b> trouvée dans le portfolio. Ajoute-la d’abord dans “Portfolio”.
        </div>
      )}
    </section>
  );
}
