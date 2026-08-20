import { MASS_UNITS, type MassUnit } from "../../types/api";

interface Props {
  amount: number;
  unit: MassUnit;
  onAmountChange: (v: number) => void;
  onUnitChange: (u: MassUnit) => void;
}

export function AmountInput({ amount, unit, onAmountChange, onUnitChange }: Props) {
  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <label className="mb-2 block font-mono text-xs uppercase tracking-widest text-paper-dim">
          Amount
        </label>
        <input
          type="number"
          min={0}
          step="any"
          value={amount}
          onChange={(e) => onAmountChange(Number(e.target.value))}
          onFocus={(e) => e.target.select()}
          className="w-full rounded-xl border border-line bg-ink-soft px-4 py-3 font-mono text-lg text-paper outline-none transition-colors focus:border-teal-dim"
        />
      </div>
      <div className="w-28">
        <label className="mb-2 block font-mono text-xs uppercase tracking-widest text-paper-dim">
          Unit
        </label>
        <select
          value={unit}
          onChange={(e) => onUnitChange(e.target.value as MassUnit)}
          className="w-full rounded-xl border border-line bg-ink-soft px-3 py-3 font-mono text-lg text-paper outline-none transition-colors focus:border-teal-dim"
        >
          {MASS_UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
