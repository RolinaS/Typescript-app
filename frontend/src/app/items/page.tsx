"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/items", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erreur API");
      setItems(data);
    } catch (e: any) {
      setMsg(e?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function createItem() {
    const name = newName.trim();
    if (!name) return;

    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erreur création");
      setNewName("");
      await refresh();
      setMsg("✅ Item créé");
    } catch (e: any) {
      setMsg(e?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function startEdit(item: Item) {
    setEditId(item.id);
    setEditName(item.name);
    setMsg(null);
  }

  async function cancelEdit() {
    setEditId(null);
    setEditName("");
  }

  async function saveEdit() {
    if (!editId) return;
    const name = editName.trim();
    if (!name) return;

    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/items/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erreur modification");

      setEditId(null);
      setEditName("");
      await refresh();
      setMsg("✏️ Item modifié");
    } catch (e: any) {
      setMsg(e?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("Supprimer cet item ?")) return;

    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Erreur suppression");
      }
      await refresh();
      setMsg("🗑️ Item supprimé");
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
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.name.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif", maxWidth: 900, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Gestion des Items</h1>
          <p style={{ marginTop: 8, opacity: 0.8 }}>
            CRUD via <code>/api/items</code>
          </p>
        </div>

        <button
          onClick={refresh}
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: "white",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Rafraîchir
        </button>
      </header>

      {msg && (
        <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "#f5f5f5" }}>
          {msg}
        </div>
      )}

      {/* Create */}
      <section style={{ marginTop: 18, padding: 16, border: "1px solid #eee", borderRadius: 14 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Ajouter un item</h2>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom de l’item"
            style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          />
          <button
            onClick={createItem}
            disabled={loading || !newName.trim()}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #ddd",
              background: "white",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Créer
          </button>
        </div>
      </section>

      {/* Search */}
      <section style={{ marginTop: 14, padding: 16, border: "1px solid #eee", borderRadius: 14 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Rechercher</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrer par nom…"
          style={{ width: "100%", marginTop: 12, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
        />
      </section>

      {/* List */}
      <section style={{ marginTop: 14 }}>
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>
          Items ({filtered.length}/{items.length})
        </h2>

        {loading && <p>Chargement…</p>}
        {!loading && filtered.length === 0 && <p>Aucun résultat.</p>}

        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
          {filtered.map((it) => {
            const isEditing = editId === it.id;

            return (
              <li
                key={it.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 14,
                  padding: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  {!isEditing ? (
                    <>
                      <div style={{ fontWeight: 700, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {it.name}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                        id: <code>{it.id}</code>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                        />
                        <button
                          onClick={saveEdit}
                          disabled={loading || !editName.trim()}
                          style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", background: "white" }}
                        >
                          Enregistrer
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={loading}
                          style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", background: "white" }}
                        >
                          Annuler
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {!isEditing && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => startEdit(it)}
                      disabled={loading}
                      style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", background: "white" }}
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => deleteItem(it.id)}
                      disabled={loading}
                      style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", background: "white" }}
                    >
                      Supprimer
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
