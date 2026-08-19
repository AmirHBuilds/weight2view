import { LENGTH_UNITS, type LengthUnit } from "../../lib/units";

interface Props {
  unit: LengthUnit;
  onChange: (unit: LengthUnit) => void;
}

export function DimensionUnitSelector({ unit, onChange }: Props) {
  return (
    <select
      value={unit}
      onChange={(e) => onChange(e.target.value as LengthUnit)}
      className="rounded-lg border border-line bg-ink-soft px-2 py-1 font-mono text-xs text-paper-dim outline-none transition-colors focus:border-teal-dim"
      aria-label="Dimension unit"
    >
      <optgroup label="Metric">
        {LENGTH_UNITS.filter((u) => ["mm", "cm", "m"].includes(u)).map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </optgroup>
      <optgroup label="Imperial">
        {LENGTH_UNITS.filter((u) => ["in", "ft"].includes(u)).map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </optgroup>
    </select>
  );
}
