import { useState } from "react";
import { api } from "../../lib/api";

export function RequestItemForm() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setStatus("submitting");
    try {
      await api.submitRequest(query.trim());
      setStatus("done");
      setQuery("");
    } catch {
      setStatus("error");
    }
  }

  if (!open) {
    return (
      <div className="text-center">
        <p className="mb-2 text-sm text-paper-dim">Can't find what you're looking for?</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-mono text-sm text-teal underline decoration-teal-dim/40 underline-offset-4 hover:text-teal-dim"
        >
          Request an item →
        </button>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-teal-dim/30 bg-teal-dim/10 p-5 text-center">
        <p className="text-paper">Thanks — your request is in.</p>
        <p className="mt-1 text-sm text-paper-dim">
          We'll research the data and add it to Weight2View.
        </p>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setStatus("idle");
          }}
          className="mt-3 font-mono text-xs text-teal underline underline-offset-4"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md">
      <label className="mb-2 block text-center text-sm text-paper-dim">
        What would you like to see?
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Pumpkin seeds"
          className="flex-1 rounded-xl border border-line bg-ink-soft px-4 py-3 text-paper outline-none focus:border-teal-dim"
          autoFocus
        />
        <button
          type="submit"
          disabled={status === "submitting" || !query.trim()}
          className="rounded-xl bg-teal px-5 py-3 font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Submit
        </button>
      </div>
      {status === "error" && (
        <p className="mt-2 text-center text-sm text-clay">Something went wrong — try again.</p>
      )}
    </form>
  );
}
