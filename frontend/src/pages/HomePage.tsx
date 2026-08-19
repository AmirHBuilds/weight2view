import { useState } from "react";
import { ItemSearch } from "../components/search/ItemSearch";
import { AmountInput } from "../components/search/AmountInput";
import { RequestItemForm } from "../components/search/RequestItemForm";
import { VolumeScene } from "../components/visualization/VolumeScene";
import { ReferencePicker, formatMultiple } from "../components/visualization/ReferencePicker";
import { ConfidenceBadge } from "../components/ui/ConfidenceBadge";
import { api, ApiError } from "../lib/api";
import type { CalculateResponse, ItemSearchResult, MassUnit, ReferenceOption, ReferenceObjectRead } from "../types/api";

export function HomePage() {
  const [selectedItem, setSelectedItem] = useState<ItemSearchResult | null>(null);
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState<MassUnit>("kg");
  const [result, setResult] = useState<CalculateResponse | null>(null);
  const [activeReference, setActiveReference] = useState<ReferenceOption | null>(null);
  const [referenceCatalog, setReferenceCatalog] = useState<Map<string, ReferenceObjectRead>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVisualize() {
    if (!selectedItem || amount <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const [calcResult, refs] = await Promise.all([
        api.calculate(selectedItem.id, amount, unit),
        referenceCatalog.size === 0 ? api.listReferences() : Promise.resolve(null),
      ]);
      if (refs) {
        setReferenceCatalog(new Map(refs.map((r) => [r.id, r])));
      }
      setResult(calcResult);
      setActiveReference(calcResult.best_reference);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const activeRefFull = activeReference ? referenceCatalog.get(activeReference.id) ?? null : null;

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
          <ItemSearch selected={selectedItem} onSelect={(item) => {
            setSelectedItem(item);
            setResult(null);
          }} />
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
          </div>

          <VolumeScene
            result={result}
            referenceShape={activeRefFull?.shape ?? "box"}
            referenceDims={activeRefFull}
            reference={activeReference}
          />

          {activeReference && (
            <p className="mt-4 text-center text-paper">
              About the size of{" "}
              <span className="font-medium text-clay">{activeReference.name.toLowerCase()}</span>
              {activeReference.multiple !== 1 && (
                <span className="ml-1 text-paper-dim">({formatMultiple(activeReference.multiple)})</span>
              )}
            </p>
          )}

          {result.reference_alternatives.length > 1 && (
            <div className="mt-6">
              <p className="mb-3 text-center font-mono text-xs uppercase tracking-widest text-paper-dim">
                Compare against
              </p>
              <div className="flex justify-center">
                <ReferencePicker
                  options={result.reference_alternatives}
                  selectedId={activeReference?.id ?? null}
                  onSelect={setActiveReference}
                />
              </div>
            </div>
          )}
        </section>
      )}

      <footer className="mt-16 border-t border-line pt-10">
        <RequestItemForm />
      </footer>
    </div>
  );
}
