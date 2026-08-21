import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAdminAuth } from "../components/admin/AdminAuthContext";
import type { AdminUserRead } from "../types/api";

export function AdminAdminsPage() {
  const { admin: currentAdmin } = useAdminAuth();
  const [admins, setAdmins] = useState<AdminUserRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", role: "admin" });
  const [saving, setSaving] = useState(false);

  const [resetTarget, setResetTarget] = useState<AdminUserRead | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  async function load() {
    setLoading(true);
    try {
      setAdmins(await api.admin.listAdmins());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.admin.createAdmin(form);
      setForm({ email: "", password: "", role: "admin" });
      setShowCreate(false);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to create admin");
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(a: AdminUserRead, role: string) {
    setError(null);
    try {
      await api.admin.updateAdmin(a.id, { role });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to update role");
    }
  }

  async function handleToggleActive(a: AdminUserRead) {
    setError(null);
    try {
      await api.admin.updateAdmin(a.id, { is_active: !a.is_active });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to update status");
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    setError(null);
    try {
      await api.admin.resetAdminPassword(resetTarget.id, resetPassword);
      setResetTarget(null);
      setResetPassword("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to reset password");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-paper">Admins</h1>
        <button
          type="button"
          onClick={() => setShowCreate((s) => !s)}
          className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-ink hover:opacity-90"
        >
          {showCreate ? "Cancel" : "+ New admin"}
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">
          {error}
        </p>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-8 space-y-4 rounded-xl border border-line bg-ink-soft/40 p-6">
          <div className="grid grid-cols-3 gap-4">
            <label className="block">
              <span className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-paper-dim">Email</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-paper-dim">
                Password
              </span>
              <input
                required
                minLength={8}
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-paper-dim">Role</span>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input">
                <option value="admin">admin</option>
                <option value="super_admin">super_admin</option>
              </select>
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-teal px-5 py-2.5 font-medium text-ink hover:opacity-90 disabled:opacity-40"
          >
            {saving ? "Creating…" : "Create admin"}
          </button>
        </form>
      )}

      {resetTarget && (
        <form
          onSubmit={handleResetPassword}
          className="mb-8 space-y-3 rounded-xl border border-clay/30 bg-clay/5 p-6"
        >
          <p className="text-sm text-paper">
            Reset password for <span className="font-medium">{resetTarget.email}</span>
          </p>
          <div className="flex gap-2">
            <input
              required
              minLength={8}
              type="password"
              placeholder="New password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              className="input flex-1"
            />
            <button type="submit" className="rounded-lg bg-clay px-4 py-2 text-sm font-medium text-ink hover:opacity-90">
              Reset
            </button>
            <button
              type="button"
              onClick={() => {
                setResetTarget(null);
                setResetPassword("");
              }}
              className="rounded-lg border border-line px-4 py-2 text-sm text-paper-dim hover:text-paper"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-paper-dim">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-soft text-paper-dim">
              <tr>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide">Email</th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide">Role</th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide">Last login</th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => {
                const isSelf = a.id === currentAdmin?.id;
                return (
                  <tr key={a.id} className="border-t border-line">
                    <td className="px-4 py-3 text-paper">{a.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={a.role}
                        disabled={isSelf}
                        onChange={(e) => handleRoleChange(a, e.target.value)}
                        className="rounded-lg border border-line bg-ink px-2 py-1 text-xs text-paper disabled:opacity-40"
                      >
                        <option value="admin">admin</option>
                        <option value="super_admin">super_admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-xs ${a.is_active ? "text-teal" : "text-paper-dim"}`}>
                        {a.is_active ? "active" : "inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-paper-dim">
                      {a.last_login_at ? new Date(a.last_login_at).toLocaleString() : "never"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setResetTarget(a)}
                          className="font-mono text-xs text-teal hover:underline"
                        >
                          Reset password
                        </button>
                        <button
                          type="button"
                          disabled={isSelf}
                          onClick={() => handleToggleActive(a)}
                          className="font-mono text-xs text-clay hover:underline disabled:opacity-40"
                        >
                          {a.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
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
