import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { ItemRequestRead } from "../types/api";

const STATUSES = ["pending", "approved", "rejected", "completed"] as const;

export function AdminRequestsPage() {
  const [requests, setRequests] = useState<ItemRequestRead[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api.admin.listRequests(filter || undefined);
      setRequests(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function updateStatus(id: string, status: string) {
    await api.admin.updateRequest(id, { status });
    load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-paper">Item requests</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-line bg-ink-soft px-3 py-2 text-sm text-paper"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-paper-dim">Loading…</p>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-line bg-ink-soft/40 p-10 text-center text-paper-dim">
          No requests yet. When users can't find an item, their requests will show up here.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-soft text-paper-dim">
              <tr>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide">Requested</th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide">Submitted</th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-4 py-3 text-paper">{r.query_text}</td>
                  <td className="px-4 py-3 text-paper-dim">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-line px-2 py-0.5 font-mono text-xs text-paper-dim">
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      className="rounded-lg border border-line bg-ink px-2 py-1 text-xs text-paper"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
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
