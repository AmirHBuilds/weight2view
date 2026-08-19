import type { ReferenceOption } from "../../types/api";

interface Props {
  options: ReferenceOption[];
  selectedId: string | null;
  onSelect: (option: ReferenceOption) => void;
}

function formatMultiple(multiple: number): string {
  if (multiple >= 1) {
    return `≈ ${multiple.toFixed(multiple < 10 ? 1 : 0)}×`;
  }
  return `≈ ${(1 / multiple).toFixed(1)}× smaller than`;
}

export function ReferencePicker({ options, selectedId, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt.id === selectedId;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              active
                ? "border-teal-dim bg-teal-dim/15 text-teal"
                : "border-line bg-ink-soft text-paper-dim hover:border-paper-dim/50 hover:text-paper"
            }`}
            title={`${formatMultiple(opt.multiple)} the volume`}
          >
            {opt.name}
          </button>
        );
      })}
    </div>
  );
}

export { formatMultiple };
