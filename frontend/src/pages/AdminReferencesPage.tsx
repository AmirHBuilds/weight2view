import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { ReferencePreview } from "../components/admin/ReferencePreview";
import type { ReferenceObjectRead } from "../types/api";

type ShapeValue =
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
  | "bicycle";

const SHAPE_OPTIONS: { value: ShapeValue; label: string }[] = [
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

interface FormState {
  name: string;
  category: string;
  length_mm: string;
  width_mm: string;
  height_mm: string;
  shape: ShapeValue;
  model_url: string;
  model_source: string;
  familiarity_score: string;
  active: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  category: "everyday",
  length_mm: "",
  width_mm: "",
  height_mm: "",
  shape: "box",
  model_url: "",
  model_source: "",
  familiarity_score: "5",
  active: true,
};

function toForm(r: ReferenceObjectRead): FormState {
  return {
    name: r.name,
    category: r.category,
    length_mm: String(r.length_mm),
    width_mm: String(r.width_mm),
    height_mm: String(r.height_mm),
    shape: r.shape as ShapeValue,
    model_url: r.model_url ?? "",
    model_source: r.model_source ?? "",
    familiarity_score: String(r.familiarity_score),
    active: r.active,
  };
}

function validate(form: FormState): string | null {
  if (!form.name.trim()) return "Name is required.";
  if (!form.category.trim()) return "Category is required.";
  const l = Number(form.length_mm);
  const w = Number(form.width_mm);
  const h = Number(form.height_mm);
  if (!(l > 0) || !(w > 0) || !(h > 0)) return "Length, width, and height must all be positive numbers.";
  const fam = Number(form.familiarity_score);
  if (!Number.isFinite(fam) || fam < 1 || fam > 10) return "Familiarity score must be between 1 and 10.";
  if (form.model_url.trim() && !form.model_url.trim().match(/\.(glb|gltf)$/i)) {
    return "Model URL should point to a .glb or .gltf file (e.g. /models/car.glb).";
  }
  return null;
}

export function AdminReferencesPage() {
  const [refs, setRefs] = useState<ReferenceObjectRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [sort, setSort] = useState<"name" | "status">("name");

  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ReferenceObjectRead | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setListError(null);
    try {
      const data = await api.admin.listReferences({
        q: q || undefined,
        category: category || undefined,
        status,
        sort,
      });
      setRefs(data);
    } catch (e) {
      setListError(e instanceof ApiError ? e.message : "Failed to load references");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const handle = setTimeout(load, 200); // debounce search typing
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, category, status, sort]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setEditingId("new");
  }

  function openEdit(r: ReferenceObjectRead) {
    setForm(toForm(r));
    setFormError(null);
    setEditingId(r.id);
  }

  function closeForm() {
    setEditingId(null);
    setFormError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      length_mm: Number(form.length_mm),
      width_mm: Number(form.width_mm),
      height_mm: Number(form.height_mm),
      shape: form.shape,
      model_url: form.model_url.trim() || null,
      model_source: form.model_source.trim() || null,
      familiarity_score: Number(form.familiarity_score),
      active: form.active,
    };
    try {
      if (editingId === "new") {
        await api.admin.createReference(payload);
      } else if (editingId) {
        await api.admin.updateReference(editingId, payload);
      }
      closeForm();
      load();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Failed to save reference");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(r: ReferenceObjectRead) {
    setListError(null);
    try {
      if (r.active) {
        await api.admin.deactivateReference(r.id);
      } else {
        await api.admin.activateReference(r.id);
      }
      load();
    } catch (e) {
      setListError(e instanceof ApiError ? e.message : "Failed to update status");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await api.admin.deleteReference(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e.message : "Failed to delete reference");
    }
  }

  const isEditing = editingId !== null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-paper">Reference objects</h1>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-ink hover:opacity-90"
        >
          + New reference
        </button>
      </div>

      {/* Search / filter / sort bar */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name…"
          className="input max-w-xs"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input w-40">
          <option value="">All categories</option>
          <option value="human">human</option>
          <option value="everyday">everyday</option>
          <option value="large">large</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="input w-36">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="input w-36">
          <option value="name">Sort: name</option>
          <option value="status">Sort: status</option>
        </select>
      </div>

      {listError && (
        <p className="mb-4 rounded-lg border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">{listError}</p>
      )}

      {isEditing && (
        <form onSubmit={handleSave} className="mb-8 space-y-6 rounded-xl border border-line bg-ink-soft/40 p-6">
          <h2 className="font-display text-lg text-paper">
            {editingId === "new" ? "New reference" : `Edit "${form.name}"`}
          </h2>

          <FormSection title="Basic Information">
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
            </div>
          </FormSection>

          <FormSection title="Physical Dimensions">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Length (mm)">
                <input required type="number" step="any" min={0} value={form.length_mm} onChange={(e) => setForm({ ...form, length_mm: e.target.value })} onFocus={(e) => e.target.select()} className="input" />
              </Field>
              <Field label="Width (mm)">
                <input required type="number" step="any" min={0} value={form.width_mm} onChange={(e) => setForm({ ...form, width_mm: e.target.value })} onFocus={(e) => e.target.select()} className="input" />
              </Field>
              <Field label="Height (mm)">
                <input required type="number" step="any" min={0} value={form.height_mm} onChange={(e) => setForm({ ...form, height_mm: e.target.value })} onFocus={(e) => e.target.select()} className="input" />
              </Field>
            </div>
            <p className="mt-2 text-xs text-paper-dim">
              Volume is derived automatically: {" "}
              {(((Number(form.length_mm) || 0) * (Number(form.width_mm) || 0) * (Number(form.height_mm) || 0)) / 1_000_000).toFixed(3)} L
            </p>
          </FormSection>

          <FormSection title="Visualization">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Shape / procedural fallback">
                <select value={form.shape} onChange={(e) => setForm({ ...form, shape: e.target.value as ShapeValue })} className="input">
                  {SHAPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>
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
            <p className="mt-2 text-xs text-paper-dim">
              If a GLB URL is set, the app tries to load and normalize it to the physical dimensions
              above; on any failure it falls back to the "{form.shape}" procedural model automatically.
            </p>
            <div className="mt-3">
              <span className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-paper-dim">
                Live preview
              </span>
              <ReferencePreview
                shape={form.shape}
                modelUrl={form.model_url.trim() || null}
                lengthMm={Number(form.length_mm) || 100}
                widthMm={Number(form.width_mm) || 100}
                heightMm={Number(form.height_mm) || 100}
              />
            </div>
          </FormSection>

          <FormSection title="Comparison">
            <Field label="Familiarity score (1-10)">
              <input
                required
                type="number"
                min={1}
                max={10}
                value={form.familiarity_score}
                onChange={(e) => setForm({ ...form, familiarity_score: e.target.value })}
                onFocus={(e) => e.target.select()}
                className="input w-32"
              />
            </Field>
          </FormSection>

          <FormSection title="Status">
            <label className="flex items-center gap-2 text-sm text-paper">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Active (appears in the public app and reference-selection algorithm)
            </label>
          </FormSection>

          {formError && (
            <p className="rounded-lg border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">{formError}</p>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="rounded-lg bg-teal px-5 py-2.5 font-medium text-ink hover:opacity-90 disabled:opacity-40">
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={closeForm} className="rounded-lg border border-line px-5 py-2.5 text-paper-dim hover:text-paper">
              Cancel
            </button>
          </div>
        </form>
      )}

      {deleteTarget && (
        <div className="mb-8 space-y-3 rounded-xl border border-clay/40 bg-clay/10 p-6">
          <p className="text-paper">
            Delete <span className="font-medium">{deleteTarget.name}</span>? This cannot be undone.
          </p>
          {deleteError && <p className="text-sm text-clay">{deleteError}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg bg-clay px-4 py-2 text-sm font-medium text-ink hover:opacity-90"
            >
              Yes, delete permanently
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteError(null);
              }}
              className="rounded-lg border border-line px-4 py-2 text-sm text-paper-dim hover:text-paper"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-paper-dim">Loading…</p>
      ) : refs.length === 0 ? (
        <div className="rounded-xl border border-line bg-ink-soft/40 p-10 text-center text-paper-dim">
          No references match these filters.
        </div>
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
                    <div className="flex gap-3">
                      <button type="button" onClick={() => openEdit(r)} className="font-mono text-xs text-teal hover:underline">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleToggleActive(r)} className="font-mono text-xs text-paper-dim hover:underline">
                        {r.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        disabled={r.active}
                        title={r.active ? "Deactivate before deleting" : undefined}
                        onClick={() => setDeleteTarget(r)}
                        className="font-mono text-xs text-clay hover:underline disabled:opacity-30 disabled:no-underline"
                      >
                        Delete
                      </button>
                    </div>
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

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line pt-4 first:border-t-0 first:pt-0">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-paper-dim">{title}</p>
      {children}
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
