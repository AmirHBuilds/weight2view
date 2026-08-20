import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { ReferenceObjectRead } from "../types/api";

const EMPTY_FORM = {
  name: "",
  category: "everyday",
  length_mm: "",
  width_mm: "",
  height_mm: "",
  shape: "box" as
    | "box"
    | "rounded_box"
    | "cylinder"
    | "phone"
    | "bottle"
    | "mug"
    | "shoe"
    | "backpack"
    | "fridge"
    | "washing_machine"
    | "car"
    | "motorcycle"
    | "bicycle",
  familiarity_score: "5",
  model_url: "",
  model_source: "",
};

const SHAPE_OPTIONS: { value: typeof EMPTY_FORM.shape; label: string }[] = [
  { value: "box", label: "box (generic)" },
  { value: "rounded_box", label: "rounded_box (generic)" },
  { value: "cylinder", label: "cylinder (generic)" },
  { value: "phone", label: "phone (stylized)" },
  { value: "bottle", label: "bottle (stylized)" },
  { value: "mug", label: "mug (stylized)" },
  { value: "shoe", label: "shoe (stylized)" },
  { value: "backpack", label: "backpack (stylized)" },
  { value: "fridge", label: "fridge (stylized)" },
  { value: "washing_machine", label: "washing_machine (stylized)" },
  { value: "car", label: "car (stylized)" },
  { value: "motorcycle", label: "motorcycle (stylized)" },
  { value: "bicycle", label: "bicycle (stylized)" },
];

export function AdminReferencesPage() {
  const [refs, setRefs] = useState<ReferenceObjectRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setRefs(await api.admin.listReferences(true));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.admin.createReference({
        name: form.name,
        category: form.category,
        length_mm: Number(form.length_mm),
        width_mm: Number(form.width_mm),
        height_mm: Number(form.height_mm),
        shape: form.shape,
        familiarity_score: Number(form.familiarity_score),
        model_url: form.model_url.trim() || null,
        model_source: form.model_source.trim() || null,
        active: true,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: string) {
    await api.admin.deactivateReference(id);
    load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-paper">Reference objects</h1>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-ink hover:opacity-90"
        >
          {showForm ? "Cancel" : "+ New reference"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 space-y-4 rounded-xl border border-line bg-ink-soft/40 p-6">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            </Field>
            <Field label="Category">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input">
                <option value="human">human</option>
                <option value="everyday">everyday</option>
                <option value="large">large</option>
              </select>
            </Field>
            <Field label="Shape">
              <select value={form.shape} onChange={(e) => setForm({ ...form, shape: e.target.value as typeof form.shape })} className="input">
                {SHAPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Familiarity (1-10)">
              <input required type="number" min={1} max={10} value={form.familiarity_score} onChange={(e) => setForm({ ...form, familiarity_score: e.target.value })} onFocus={(e) => e.target.select()} className="input" />
            </Field>
            <Field label="Length (mm)">
              <input required type="number" step="any" value={form.length_mm} onChange={(e) => setForm({ ...form, length_mm: e.target.value })} onFocus={(e) => e.target.select()} className="input" />
            </Field>
            <Field label="Width (mm)">
              <input required type="number" step="any" value={form.width_mm} onChange={(e) => setForm({ ...form, width_mm: e.target.value })} onFocus={(e) => e.target.select()} className="input" />
            </Field>
            <Field label="Height (mm)">
              <input required type="number" step="any" value={form.height_mm} onChange={(e) => setForm({ ...form, height_mm: e.target.value })} onFocus={(e) => e.target.select()} className="input" />
            </Field>
          </div>
          <p className="text-xs text-paper-dim">
            Volume is derived automatically from length × width × height.
          </p>
          <div className="grid grid-cols-2 gap-4 border-t border-line pt-4">
            <Field label="GLB model URL (optional)">
              <input
                value={form.model_url}
                onChange={(e) => setForm({ ...form, model_url: e.target.value })}
                className="input"
                placeholder="/models/refrigerator.glb"
              />
            </Field>
            <Field label="Model source / attribution (optional)">
              <input
                value={form.model_source}
                onChange={(e) => setForm({ ...form, model_source: e.target.value })}
                className="input"
                placeholder="e.g. Kenney.nl, CC0"
              />
            </Field>
          </div>
          <p className="text-xs text-paper-dim">
            If a GLB URL is set, the app tries to load and normalize it to the physical dimensions
            above; on any failure it falls back to the stylized "{form.shape}" procedural model
            automatically — leave blank to always use the procedural model.
          </p>
          <button type="submit" disabled={saving} className="rounded-lg bg-teal px-5 py-2.5 font-medium text-ink hover:opacity-90 disabled:opacity-40">
            {saving ? "Saving…" : "Create reference"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-paper-dim">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-soft text-paper-dim">
              <tr>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide">Volume</th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide">Familiarity</th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide">Model</th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {refs.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-4 py-3 text-paper">{r.name}</td>
                  <td className="px-4 py-3 text-paper-dim">{r.category}</td>
                  <td className="px-4 py-3 font-mono text-xs text-paper-dim">{r.volume_l.toFixed(2)} L</td>
                  <td className="px-4 py-3 font-mono text-xs text-paper-dim">{r.familiarity_score}/10</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {r.model_url ? (
                      <span className="text-teal" title={r.model_source ?? undefined}>
                        GLB
                      </span>
                    ) : (
                      <span className="text-paper-dim">procedural</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 font-mono text-xs ${r.active ? "text-teal" : "text-paper-dim"}`}>
                      {r.active ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.active && (
                      <button onClick={() => handleDeactivate(r.id)} className="font-mono text-xs text-clay hover:underline">
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
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
