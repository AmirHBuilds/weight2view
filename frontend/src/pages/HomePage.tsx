import { useEffect, useMemo, useState } from "react";
import { ItemSearch } from "../components/search/ItemSearch";
import { AmountInput } from "../components/search/AmountInput";
import { RequestItemForm } from "../components/search/RequestItemForm";
import { VolumeScene, type SceneReference } from "../components/visualization/VolumeScene";
import { ReferencePicker, describeMultiple, formatMultiple } from "../components/visualization/ReferencePicker";
import { ConfidenceBadge } from "../components/ui/ConfidenceBadge";
import { DimensionUnitSelector } from "../components/ui/DimensionUnitSelector";
import { api, ApiError } from "../lib/api";
import { formatDimensions, type LengthUnit } from "../lib/units";
import type {
  CalculateResponse,
  ItemSearchResult,
  MassUnit,
  ReferenceObjectRead,
  ReferenceOption,
} from "../types/api";

export function HomePage() {
  const [selectedItem, setSelectedItem] = useState<ItemSearchResult | null>(null);
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState<MassUnit>("kg");
  const [result, setResult] = useState<CalculateResponse | null>(null);
  const [dimensionUnit, setDimensionUnit] = useState<LengthUnit>("cm");
  const [selectedReferenceIds, setSelectedReferenceIds] = useState<Set<string>>(new Set());
  const [referenceCatalog, setReferenceCatalog] = useState<Map<string, ReferenceObjectRead>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reference catalog is needed for the "add another reference" picker and
  // for shape/dimension lookups - fetch once up front rather than only
  // after the first calculation.
  useEffect(() => {
    api
      .listReferences()
      .then((refs) => setReferenceCatalog(new Map(refs.map((r) => [r.id, r]))))
      .catch(() => {
        /* non-fatal - comparison picker just won't offer extra options */
      });
  }, []);

  async function handleVisualize() {
    if (!selectedItem || amount <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const calcResult = await api.calculate(selectedItem.id, amount, unit);
      setResult(calcResult);
      setSelectedReferenceIds(calcResult.best_reference ? new Set([calcResult.best_reference.id]) : new Set());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function toggleAlternative(option: ReferenceOption) {
    setSelectedReferenceIds((prev) => {
      const next = new Set(prev);
      if (next.has(option.id)) next.delete(option.id);
      else next.add(option.id);
      return next;
    });
  }

  function addReference(ref: ReferenceObjectRead) {
    setSelectedReferenceIds((prev) => new Set(prev).add(ref.id));
  }

  function removeReference(id: string) {
    setSelectedReferenceIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  const sceneReferences: SceneReference[] = useMemo(() => {
    if (!result) return [];
    const list: SceneReference[] = [];
    for (const id of selectedReferenceIds) {
      const catalogRef = referenceCatalog.get(id);
      if (!catalogRef) continue;
      const alt = result.reference_alternatives.find((a) => a.id === id);
      const multiple = alt ? alt.multiple : result.volume_l / catalogRef.volume_l;
      list.push({
        id,
        name: catalogRef.name,
        shape: catalogRef.shape,
        length_mm: catalogRef.length_mm,
        width_mm: catalogRef.width_mm,
        height_mm: catalogRef.height_mm,
        multiple,
        modelUrl: catalogRef.model_url,
      });
    }
    return list;
  }, [result, selectedReferenceIds, referenceCatalog]);

  const extraSelected = useMemo(() => {
    if (!result) return [];
    return sceneReferences
      .filter((r) => !result.reference_alternatives.some((a) => a.id === r.id))
      .map((r) => ({ id: r.id, name: r.name }));
  }, [sceneReferences, result]);

  const headline = sceneReferences[0] ?? null;

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-6 py-16 sm:py-24">
      <header className="mb-12 text-center">
        <h1 className="font-display text-4xl font-medium tracking-tight text-paper sm:text-5xl">
          Weight<span className="text-teal">2</span>View
        </h1>
        <p className="mt-3 text-paper-dim">See what a weight actually looks like.</p>
      </header>

      <section className="space-y-4 rounded-2xl border border-line bg-ink-soft/40 p-6 sm:p-8">
        <div>
          <label className="mb-2 block font-mono text-xs uppercase tracking-widest text-paper-dim">
            What do you want to visualize?
          </label>
          <ItemSearch
            selected={selectedItem}
            onSelect={(item) => {
              setSelectedItem(item);
              setResult(null);
            }}
          />
        </div>

        <AmountInput amount={amount} unit={unit} onAmountChange={setAmount} onUnitChange={setUnit} />

        <button
          type="button"
          onClick={handleVisualize}
          disabled={!selectedItem || amount <= 0 || loading}
          className="w-full rounded-xl bg-teal py-4 text-lg font-medium text-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {loading ? "Calculating…" : "Visualize"}
        </button>

        {error && (
          <p className="rounded-lg border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">{error}</p>
        )}
      </section>

      {result && (
        <section className="mt-10 animate-[fadeIn_0.4s_ease-out]">
          <div className="mb-6 text-center">
            <p className="text-paper-dim">
              {result.amount} {result.unit} of {result.item_name}
            </p>
            <p className="caliper mt-2 font-mono text-4xl font-medium text-teal sm:text-5xl">
              ≈ {result.volume_l < 1 ? (result.volume_l * 1000).toFixed(0) : result.volume_l.toFixed(2)}{" "}
              {result.volume_l < 1 ? "mL" : "L"}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <ConfidenceBadge confidence={result.confidence} />
            </div>
            {result.source && (
              <p className="mx-auto mt-2 max-w-md text-xs text-paper-dim/70">{result.source}</p>
            )}

            <div className="mx-auto mt-6 inline-flex flex-col items-center gap-1.5 rounded-xl border border-line bg-ink-soft/60 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-widest text-paper-dim">
                  Estimated dimensions
                </span>
                <DimensionUnitSelector unit={dimensionUnit} onChange={setDimensionUnit} />
              </div>
              <p className="font-mono text-lg text-paper">{formatDimensions(result.shape, dimensionUnit)}</p>
              <p className="max-w-xs text-center text-[11px] leading-snug text-paper-dim/70">
                A visualization aid representing the estimated volume as a simple shape — not necessarily
                the item's real physical form.
              </p>
            </div>
          </div>

          <VolumeScene targetDims={result.shape} references={sceneReferences} dimensionUnit={dimensionUnit} />

          {headline && (
            <p className="mt-4 text-center text-paper">
              This is {describeMultiple(headline.multiple, headline.name)}.
            </p>
          )}

          <div className="mt-6">
            <p className="mb-3 text-center font-mono text-xs uppercase tracking-widest text-paper-dim">
              Compare with
            </p>
            <ReferencePicker
              alternatives={result.reference_alternatives}
              catalog={Array.from(referenceCatalog.values())}
              selectedIds={selectedReferenceIds}
              onToggle={toggleAlternative}
              onAdd={addReference}
              onRemove={removeReference}
              extraSelected={extraSelected}
            />
          </div>

          {sceneReferences.length > 1 && (
            <ul className="mx-auto mt-4 max-w-md space-y-1 text-center text-sm text-paper-dim">
              {sceneReferences.map((r) => (
                <li key={r.id}>
                  <span className="text-paper">{r.name}</span>: {formatMultiple(r.multiple)} the volume
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <footer className="mt-16 border-t border-line pt-10">
        <RequestItemForm />
      </footer>
    </div>
  );
}
