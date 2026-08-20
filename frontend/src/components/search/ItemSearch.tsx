import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import type { ItemSearchResult } from "../../types/api";

interface Props {
  onSelect: (item: ItemSearchResult) => void;
  selected: ItemSearchResult | null;
}

type RequestStatus = "idle" | "submitting" | "done" | "error";

export function ItemSearch({ onSelect, selected }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ItemSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("idle");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) {
      setQuery(selected.name);
      setOpen(false);
      return;
    }
  }, [selected]);

  useEffect(() => {
    setRequestStatus("idle");
    if (!query || (selected && query === selected.name)) {
      setResults([]);
      setSearched(false);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const items = await api.searchItems(query);
        setResults(items);
        setSearched(true);
        setOpen(true);
      } catch {
        setResults([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(handle);
  }, [query, selected]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleRequestItem() {
    const queryText = query.trim();
    if (!queryText) return;
    setRequestStatus("submitting");
    try {
      await api.submitRequest(queryText);
      setRequestStatus("done");
    } catch {
      setRequestStatus("error");
    }
  }

  const noResults = searched && !loading && results.length === 0 && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => (results.length > 0 || noResults) && setOpen(true)}
        placeholder="Search an item… e.g. sunflower seeds"
        className="w-full rounded-xl border border-line bg-ink-soft px-5 py-4 text-lg text-paper placeholder:text-paper-dim/60 outline-none transition-colors focus:border-teal-dim"
        autoComplete="off"
      />
      {loading && (
        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-paper-dim text-sm font-mono">…</div>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-line bg-ink-soft shadow-2xl">
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(item);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-ink"
              >
                <span className="text-paper">
                  {item.name}
                  {item.variant && <span className="ml-2 text-sm text-paper-dim">({item.variant})</span>}
                </span>
                <span className="font-mono text-xs uppercase tracking-wide text-teal-dim">{item.category}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && noResults && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-line bg-ink-soft p-5 text-center shadow-2xl">
          {requestStatus === "done" ? (
            <>
              <p className="text-paper">Thanks — your request for "{query.trim()}" is in.</p>
              <p className="mt-1 text-sm text-paper-dim">We'll research the data and add it to Weight2View.</p>
            </>
          ) : (
            <>
              <p className="text-paper-dim">No items found for "{query.trim()}".</p>
              <p className="mt-1 mb-3 text-sm text-paper-dim">Don't see what you're looking for?</p>
              <button
                type="button"
                onClick={handleRequestItem}
                disabled={requestStatus === "submitting"}
                className="font-mono text-sm text-teal underline decoration-teal-dim/40 underline-offset-4 hover:text-teal-dim disabled:opacity-50"
              >
                {requestStatus === "submitting" ? "Submitting…" : "Request an item →"}
              </button>
              {requestStatus === "error" && (
                <p className="mt-2 text-sm text-clay">Something went wrong — try again.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
