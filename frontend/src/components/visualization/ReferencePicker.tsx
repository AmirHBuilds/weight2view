import type { ReferenceObjectRead, ReferenceOption } from "../../types/api";

export function formatMultiple(multiple: number): string {
  if (!isFinite(multiple) || multiple <= 0) return "";
  if (multiple >= 1) {
    return `≈ ${multiple.toFixed(multiple < 10 ? 1 : 0)}×`;
  }
  return `≈ ${(1 / multiple).toFixed(1)}× smaller than`;
}

/** Longer sentence form used in the "about the size of" summary line. */
export function describeMultiple(multiple: number, name: string): string {
  if (!isFinite(multiple) || multiple <= 0) return name.toLowerCase();
  if (multiple >= 0.85 && multiple <= 1.18) {
    return `about the size of ${prefixArticle(name)}`;
  }
  if (multiple > 1) {
    const n = multiple.toFixed(multiple < 10 ? 1 : 0);
    return `about ${n}× the volume of ${prefixArticle(name)}`;
  }
  const n = (1 / multiple).toFixed(1);
  return `about 1/${n} the volume of ${prefixArticle(name)} (≈${n}× smaller)`;
}

function prefixArticle(name: string): string {
  const lower = name.toLowerCase();
  const article = /^[aeiou]/.test(lower) ? "an" : "a";
  return `${article} ${lower}`;
}

interface Props {
  /** Top-ranked alternatives from the calculate response - shown as quick toggle chips. */
  alternatives: ReferenceOption[];
  /** Full active reference catalog, for the "add another" picker. */
  catalog: ReferenceObjectRead[];
  selectedIds: Set<string>;
  onToggle: (option: ReferenceOption) => void;
  onAdd: (ref: ReferenceObjectRead) => void;
  onRemove: (id: string) => void;
  /** Any selected references that aren't in `alternatives` (manually added from the catalog), rendered as removable chips too. */
  extraSelected: { id: string; name: string }[];
}

export function ReferencePicker({
  alternatives,
  catalog,
  selectedIds,
  onToggle,
  onAdd,
  onRemove,
  extraSelected,
}: Props) {
  const addableCatalog = catalog.filter(
    (c) => !selectedIds.has(c.id) && !alternatives.some((a) => a.id === c.id)
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {alternatives.map((opt) => {
          const active = selectedIds.has(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onToggle(opt)}
              aria-pressed={active}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                active
                  ? "border-teal-dim bg-teal-dim/15 text-teal"
                  : "border-line bg-ink-soft text-paper-dim hover:border-paper-dim/50 hover:text-paper"
              }`}
              title={`${formatMultiple(opt.multiple)} the volume`}
            >
              {active ? "✓ " : ""}
              {opt.name}
            </button>
          );
        })}

        {extraSelected.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onRemove(opt.id)}
            className="rounded-full border border-teal-dim bg-teal-dim/15 px-4 py-2 text-sm text-teal transition-colors hover:opacity-80"
          >
            ✓ {opt.name}
          </button>
        ))}

        {addableCatalog.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              const ref = catalog.find((c) => c.id === e.target.value);
              if (ref) onAdd(ref);
              e.target.value = "";
            }}
            className="rounded-full border border-dashed border-line bg-ink-soft px-4 py-2 text-sm text-paper-dim outline-none hover:border-paper-dim/50"
          >
            <option value="" disabled>
              + Add another…
            </option>
            {addableCatalog.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
