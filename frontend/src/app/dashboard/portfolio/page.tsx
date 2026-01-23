"use client";

import { useEffect, useMemo, useState } from "react";

type Holding = {
  id: string;
  code: string;
  name: string;
  currency: string;
  last_price: string;
  day_gain_amount: string;
  day_gain_pct: string;
  quantity: string;
  value: string;
  day_gain_value: string;
};

type Lot = {
  id: string;
  holding_id: string;
  buy_date: string;
  buy_price: string;
  quantity: string;
  total_cost: string;
  current_value: string;
  total_gain_value: string;
  total_gain_pct: string;
};

function fmtEUR(n: string | number) {
  const v = typeof n === "string" ? Number(n) : n;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v);
}
function fmtPct(n: string | number) {
  const v = typeof n === "string" ? Number(n) : n;
  return `${v.toFixed(2).replace(".", ",")} %`;
}

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [lots, setLots] = useState<Record<string, Lot[]>>({});
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  // create holding
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [lastPrice, setLastPrice] = useState<number>(0);
  const [dayGainAmount, setDayGainAmount] = useState<number>(0);
  const [dayGainPct, setDayGainPct] = useState<number>(0);

  const [msg, setMsg] = useState<string | null>(null);

  async function fetchLots(holdingId: string) {
  const res = await fetch(`/api/portfolio/${holdingId}/lots`, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Erreur lots");

  setLots((p) => ({ ...p, [holdingId]: data }));
  return data as Lot[];
}


  async function refresh() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/portfolio", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erreur API");
      setHoldings(data);
    } catch (e: any) {
      setMsg(e?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function toggleRow(h: Holding) {
  const next = !expanded[h.id];
  setExpanded((p) => ({ ...p, [h.id]: next }));
  if (!next) return;

  // fetch lots if not loaded yet
  if (!lots[h.id]) {
    try {
      await fetchLots(h.id);
    } catch (e: any) {
      setMsg(e?.message ?? "Erreur lots");
    }
  }
}

  async function createHolding() {
    setMsg(null);
    const c = code.trim().toUpperCase();
    const n = name.trim();
    if (!c || !n) return;

    setLoading(true);
    try {
      const res = await fetch("/api/portfolio/holdings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: c,
          name: n,
          currency: "EUR",
          last_price: Number(lastPrice) || 0,
          day_gain_amount: Number(dayGainAmount) || 0,
          day_gain_pct: Number(dayGainPct) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erreur création");
      setCode("");
      setName("");
      setLastPrice(0);
      setDayGainAmount(0);
      setDayGainPct(0);
      await refresh();
      setMsg("✅ Position créée");
    } catch (e: any) {
      setMsg(e?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function deleteHolding(id: string) {
    if (!confirm("Supprimer cette ligne (et ses achats) ?")) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/portfolio/holdings/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Erreur suppression");
      }
      // cleanup
      setExpanded((p) => {
        const cp = { ...p };
        delete cp[id];
        return cp;
      });
      setLots((p) => {
        const cp = { ...p };
        delete cp[id];
        return cp;
      });
      await refresh();
      setMsg("🗑️ Position supprimée");
    } catch (e: any) {
      setMsg(e?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function addLot(holdingId: string) {
  const buy_date = prompt("Date d'achat (YYYY-MM-DD) ?");
  if (!buy_date) return;

  const buy_price = prompt("Prix d'achat ?");
  if (!buy_price) return;

  const quantity = prompt("Quantité ?");
  if (!quantity) return;

  setLoading(true);
  setMsg(null);

  try {
    const res = await fetch(`/api/portfolio/holdings/${holdingId}/lots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buy_date,
        buy_price: Number(buy_price),
        quantity: Number(quantity),
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "Erreur ajout achat");

    // 1) refresh holdings (quantité/valeur)
    await refresh();

    // 2) ensure row expanded
    setExpanded((p) => ({ ...p, [holdingId]: true }));

    // 3) refetch lots (affichage immédiat)
    await fetchLots(holdingId);

    setMsg("➕ Achat ajouté");
  } catch (e: any) {
    setMsg(e?.message ?? "Erreur");
  } finally {
    setLoading(false);
  }
}


  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return holdings;
    return holdings.filter((h) => (h.code + " " + h.name).toLowerCase().includes(qq));
  }, [holdings, q]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
          <p className="mt-1 text-sm text-slate-600">Table type Google Finance (positions + lots).</p>
        </div>

        <button
          onClick={refresh}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
          disabled={loading}
        >
          Rafraîchir
        </button>
      </div>

      {msg && <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm">{msg}</div>}

      {/* Create holding */}
      {/* Create holding */}
<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  {/* Header */}
  <div className="mb-4">
    <h2 className="text-lg font-semibold">Ajouter une position</h2>
    <p className="text-sm text-slate-500">
      Crée une nouvelle ligne d’investissement dans ton portefeuille.
    </p>
  </div>

  {/* Form */}
  <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
    {/* Code */}
    <div className="md:col-span-2">
      <label className="mb-1 block text-xs font-medium text-slate-600">
        Code
      </label>
      <input
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        placeholder="ENGI"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
    </div>

    {/* Name */}
    <div className="md:col-span-4">
      <label className="mb-1 block text-xs font-medium text-slate-600">
        Nom de l’actif
      </label>
      <input
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        placeholder="Engie"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    </div>

    {/* Last price */}
    <div className="md:col-span-2">
      <label className="mb-1 block text-xs font-medium text-slate-600">
        Prix actuel (€)
      </label>
      <input
        type="number"
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        value={lastPrice}
        onChange={(e) => setLastPrice(Number(e.target.value))}
      />
    </div>

    {/* Day gain € */}
    <div className="md:col-span-2">
      <label className="mb-1 block text-xs font-medium text-slate-600">
        Gain jour (€)
      </label>
      <input
        type="number"
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        value={dayGainAmount}
        onChange={(e) => setDayGainAmount(Number(e.target.value))}
      />
    </div>

    {/* Day gain % */}
    <div className="md:col-span-2">
      <label className="mb-1 block text-xs font-medium text-slate-600">
        Gain jour (%)
      </label>
      <input
        type="number"
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        value={dayGainPct}
        onChange={(e) => setDayGainPct(Number(e.target.value))}
      />
    </div>
  </div>

  {/* Actions */}
  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
    <button
      onClick={createHolding}
      disabled={loading || !code.trim() || !name.trim()}
      className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
    >
      + Ajouter la position
    </button>

    <div className="text-xs text-slate-500">
      Devise : EUR
    </div>
  </div>

  {/* Search */}
  <div className="mt-5">
    <label className="mb-1 block text-xs font-medium text-slate-600">
      Rechercher une position
    </label>
    <input
      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
      placeholder="Code ou nom…"
      value={q}
      onChange={(e) => setQ(e.target.value)}
    />
  </div>
</div>


      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-3 border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <div className="col-span-3">Code / Nom</div>
          <div className="col-span-2 text-right">Prix</div>
          <div className="col-span-2 text-right">Quantité</div>
          <div className="col-span-3 text-right">Gain du jour</div>
          <div className="col-span-2 text-right">Valeur</div>
        </div>

        {filtered.map((h) => {
          const dayAmount = Number(h.day_gain_value);
          const dayPct = Number(h.day_gain_pct);
          const up = dayPct >= 0;

          return (
            <div key={h.id} className="border-b border-slate-100 last:border-b-0">
              {/* Main row */}
              <button
                onClick={() => toggleRow(h)}
                className="grid w-full grid-cols-12 gap-3 px-4 py-4 text-left hover:bg-slate-50"
              >
                <div className="col-span-3 flex items-center gap-3">
                  <span className="rounded-xl bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{h.code}</span>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{h.name}</div>
                    <div className="text-xs text-slate-500">Cliquer pour détails</div>
                  </div>
                </div>

                <div className="col-span-2 text-right font-semibold">{fmtEUR(h.last_price)}</div>
                <div className="col-span-2 text-right">{Number(h.quantity).toFixed(2).replace(".", ",")}</div>

                <div className="col-span-3 flex items-center justify-end gap-3">
                  <span className={up ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
                    {dayAmount >= 0 ? "+" : ""}{fmtEUR(dayAmount)}
                  </span>
                  <span className={[
                    "rounded-xl px-3 py-1 text-sm font-semibold",
                    up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
                  ].join(" ")}>
                    {up ? "↑" : "↓"} {fmtPct(dayPct)}
                  </span>
                </div>

                <div className="col-span-2 text-right font-semibold">{fmtEUR(h.value)}</div>
              </button>

              {/* Expanded lots */}
              {expanded[h.id] && (
                <div className="bg-slate-50 px-4 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-semibold">Achats</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addLot(h.id)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                        disabled={loading}
                      >
                        + Enregistrer un autre achat
                      </button>
                      <button
                        onClick={() => deleteHolding(h.id)}
                        className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                        disabled={loading}
                      >
                        Supprimer la ligne
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-3 border-b border-slate-200 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <div className="col-span-3">Date d'achat</div>
                    <div className="col-span-2 text-right">Prix d'achat</div>
                    <div className="col-span-2 text-right">Quantité</div>
                    <div className="col-span-3 text-right">Gain total</div>
                    <div className="col-span-2 text-right">Valeur</div>
                  </div>

                  <LotsBlock holdingId={h.id} lots={lots[h.id]} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function LotsBlock({ holdingId, lots }: { holdingId: string; lots?: Lot[] }) {
  if (!lots) return <div className="py-4 text-sm text-slate-600">Chargement…</div>;
  if (lots.length === 0) return <div className="py-4 text-sm text-slate-600">Aucun achat.</div>;

  return (
    <div className="divide-y divide-slate-100">
      {lots.map((l) => {
        const up = Number(l.total_gain_pct) >= 0;
        return (
          <div key={l.id} className="grid grid-cols-12 gap-3 py-3 text-sm">
            <div className="col-span-3">{new Date(l.buy_date).toLocaleDateString("fr-FR")}</div>
            <div className="col-span-2 text-right">{fmtEUR(l.buy_price)}</div>
            <div className="col-span-2 text-right">{Number(l.quantity).toFixed(2).replace(".", ",")}</div>

            <div className="col-span-3 text-right">
              <span className={up ? "text-emerald-700 font-semibold" : "text-red-700 font-semibold"}>
                {Number(l.total_gain_value) >= 0 ? "+" : ""}{fmtEUR(l.total_gain_value)}
              </span>
              <span className={[
                "ml-3 rounded-xl px-2 py-1 text-xs font-semibold",
                up ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800",
              ].join(" ")}>
                {up ? "↑" : "↓"} {fmtPct(l.total_gain_pct)}
              </span>
            </div>

            <div className="col-span-2 text-right font-semibold">{fmtEUR(l.current_value)}</div>
          </div>
        );
      })}
    </div>
  );
}
