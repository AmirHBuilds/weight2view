import { Suspense } from "react";
import { GLBModel } from "./GLBModel";
import { ModelErrorBoundary } from "./ModelErrorBoundary";
import { renderReferenceModel } from "./registry";
import type { ModelProps } from "./StylizedModels";

interface Props {
  /** Absolute or root-relative URL to a .glb file, or null/undefined if this reference has no model yet. */
  modelUrl: string | null | undefined;
  /** Which procedural family to fall back to - the database's `shape` field. */
  shape: string;
  l: number;
  h: number;
  w: number;
  color: string;
}

/**
 * The single place that decides "GLB or procedural" for a reference
 * object, per Part 1/7/8/19 of the GLB requirements:
 *
 *   model_url present  -> attempt to load & normalize the GLB
 *     - while loading   -> render the procedural model (dimmed) so there's
 *                          never an empty gap during the network request
 *     - on load success -> swap to the normalized GLB
 *     - on load failure -> fall back to the procedural model permanently
 *                          for this mount (never a blank scene, never an
 *                          uncaught error)
 *   model_url absent   -> render the procedural model directly, no
 *                         network request attempted at all
 *
 * GLB and procedural both ultimately render as an Object3D sized to
 * exactly the same [l, h, w] scene-unit target, so everything downstream
 * (layout, camera fit, labels) is completely agnostic to which path was
 * used - "the dimension system should not care where the model came
 * from."
 */
export function ReferenceVisual({ modelUrl, shape, l, h, w, color }: Props) {
  const Procedural = renderReferenceModel(shape);
  const proceduralProps: ModelProps = { l, h, w, color };

  if (!modelUrl) {
    return <Procedural {...proceduralProps} />;
  }

  return (
    <ModelErrorBoundary fallback={<Procedural {...proceduralProps} />}>
      <Suspense fallback={<Procedural {...proceduralProps} color={color} />}>
        <GLBModel url={modelUrl} target={[l, h, w]} />
      </Suspense>
    </ModelErrorBoundary>
  );
}
