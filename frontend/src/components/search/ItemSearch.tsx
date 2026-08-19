import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import type { ItemSearchResult } from "../../types/api";

interface Props {
  onSelect: (item: ItemSearchResult) => void;
  selected: ItemSearchResult | null;
}

export function ItemSearch({ onSelect, selected }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ItemSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) {
      setQuery(selected.name);
      setOpen(false);
      return;
    }
  }, [selected]);

  useEffect(() => {
    if (!query || (selected && query === selected.name)) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const items = await api.searchItems(query);
        setResults(items);
        setOpen(true);
      } catch {
        setResults([]);
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

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
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
    </div>
  );
}
