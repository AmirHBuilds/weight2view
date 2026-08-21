import { useEffect, useState } from "react";
import { MASS_UNITS, type MassUnit } from "../../types/api";

interface Props {
  amount: number;
  unit: MassUnit;
  onAmountChange: (v: number) => void;
  onUnitChange: (u: MassUnit) => void;
}

export function AmountInput({ amount, unit, onAmountChange, onUnitChange }: Props) {
  // The displayed text is tracked locally rather than derived straight from
  // `amount` on every render. Binding the input's value directly to a
  // number forces React to overwrite the DOM value on every keystroke
  // (typing into an empty/cleared field parses to 0, which immediately
  // redisplays as "0" mid-edit and fights the cursor/selection - typing
  // "2" next lands next to that forced "0" instead of replacing it). Local
  // string state lets the field hold exactly what the user typed,
  // including transient states like "" or "1." that aren't valid numbers
  // yet, while still reporting a parsed number up to the parent whenever
  // one is available.
  const [rawValue, setRawValue] = useState(String(amount));

  // Re-sync only when `amount` changes from OUTSIDE this component (e.g. a
  // fresh calculation resetting the form) - not on every render, and not
  // in a way that clobbers what's currently being typed.
  useEffect(() => {
    if (Number(rawValue) !== amount) {
      setRawValue(String(amount));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    // Only allow characters that can form a valid (possibly incomplete) number.
    if (next !== "" && !/^\d*\.?\d*$/.test(next)) return;
    setRawValue(next);
    if (next === "") {
      // Field is empty - report 0 so "Visualize" correctly disables, but
      // keep the displayed text genuinely empty rather than forcing it to
      // show "0" (which is what caused the original bug).
      onAmountChange(0);
      return;
    }
    const parsed = Number(next);
    if (!Number.isNaN(parsed)) {
      onAmountChange(parsed);
    }
  }

  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <label className="mb-2 block font-mono text-xs uppercase tracking-widest text-paper-dim">
          Amount
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={rawValue}
          onChange={handleChange}
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
