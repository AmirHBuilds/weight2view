import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { ItemRead } from "../types/api";

const EMPTY_FORM = {
  name: "",
  category: "",
  description: "",
  variant: "",
  aliases: "",
  strategy: "bulk_density" as "density" | "bulk_density",
  density_kg_m3: "",
  bulk_density_kg_m3: "",
  confidence: "estimated" as "verified" | "estimated" | "demo",
  source: "",
  notes: "",
};

export function AdminItemsPage() {
  const [items, setItems] = useState<ItemRead[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setItems(await api.admin.listItems(q || undefined, true));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.admin.createItem({
        name: form.name,
        category: form.category,
        description: form.description || null,
        variant: form.variant || null,
        aliases: form.aliases.split(",").map((a) => a.trim()).filter(Boolean),
        measurement: {
          strategy: form.strategy,
          density_kg_m3: form.strategy === "density" ? Number(form.density_kg_m3) : null,
          bulk_density_kg_m3: form.strategy === "bulk_density" ? Number(form.bulk_density_kg_m3) : null,
          is_primary: true,
          confidence: form.confidence,
          source: form.source || null,
          notes: form.notes || null,
        },
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: string) {
    await api.admin.deactivateItem(id);
    load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-paper">Items</h1>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-ink hover:opacity-90"
        >
          {showForm ? "Cancel" : "+ New item"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 space-y-4 rounded-xl border border-line bg-ink-soft/40 p-6">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            </Field>
            <Field label="Category">
              <input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input" placeholder="grain, seed, liquid…" />
            </Field>
            <Field label="Variant (optional)">
              <input value={form.variant} onChange={(e) => setForm({ ...form, variant: e.target.value })} className="input" />
            </Field>
            <Field label="Aliases (comma separated)">
              <input value={form.aliases} onChange={(e) => setForm({ ...form, aliases: e.target.value })} className="input" />
            </Field>
          </div>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={2} />
          </Field>

          <div className="border-t border-line pt-4">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-paper-dim">Measurement (required)</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Strategy">
                <select
                  value={form.strategy}
                  onChange={(e) => setForm({ ...form, strategy: e.target.value as "density" | "bulk_density" })}
                  className="input"
                >
                  <option value="density">density (solids/liquids)</option>
                  <option value="bulk_density">bulk_density (loose/granular)</option>
                </select>
              </Field>
              <Field label="Confidence">
                <select value={form.confidence} onChange={(e) => setForm({ ...form, confidence: e.target.value as typeof form.confidence })} className="input">
                  <option value="verified">verified</option>
                  <option value="estimated">estimated</option>
                  <option value="demo">demo</option>
                </select>
              </Field>
              {form.strategy === "density" ? (
                <Field label="Density (kg/m³)">
                  <input required type="number" step="any" value={form.density_kg_m3} onChange={(e) => setForm({ ...form, density_kg_m3: e.target.value })} className="input" />
                </Field>
              ) : (
                <Field label="Bulk density (kg/m³)">
                  <input required type="number" step="any" value={form.bulk_density_kg_m3} onChange={(e) => setForm({ ...form, bulk_density_kg_m3: e.target.value })} className="input" />
                </Field>
              )}
              <Field label="Source">
                <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="input" placeholder="citation / URL / 'illustrative'" />
              </Field>
            </div>
            <Field label="Notes">
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input mt-4" rows={2} />
            </Field>
          </div>

          <button type="submit" disabled={saving} className="rounded-lg bg-teal px-5 py-2.5 font-medium text-ink hover:opacity-90 disabled:opacity-40">
            {saving ? "Saving…" : "Create item"}
          </button>
        </form>
      )}

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search items…"
        className="input mb-4"
      />

      {loading ? (
        <p className="text-paper-dim">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-soft text-paper-dim">
              <tr>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide">Strategy</th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide">Confidence</th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const m = item.measurements.find((x: typeof item.measurements[number]) => x.is_primary) ?? item.measurements[0];
                return (
                  <tr key={item.id} className="border-t border-line">
                    <td className="px-4 py-3 text-paper">{item.name}</td>
                    <td className="px-4 py-3 text-paper-dim">{item.category}</td>
                    <td className="px-4 py-3 font-mono text-xs text-paper-dim">{m?.strategy ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-paper-dim">{m?.confidence ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 font-mono text-xs ${item.active ? "text-teal" : "text-paper-dim"}`}>
                        {item.active ? "active" : "inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.active && (
                        <button onClick={() => handleDeactivate(item.id)} className="font-mono text-xs text-clay hover:underline">
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-paper-dim">{label}</span>
      {children}
    </label>
  );
}
