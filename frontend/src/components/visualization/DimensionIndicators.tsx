import { Html, Line } from "@react-three/drei";
import { formatLength, type LengthUnit } from "../../lib/units";

interface Props {
  l: number; // scene units
  h: number;
  w: number;
  dimsMm: { length_mm: number; width_mm: number; height_mm: number };
  unit: LengthUnit;
}

const LINE_COLOR = "#5fa696";
const TICK = 0.06;

/**
 * Bracket-style dimension indicators (length along the front-bottom edge,
 * height along the front-left edge) rendered as thin lines + small Html
 * labels. Labels use `distanceFactor` so text stays a readable, roughly
 * constant screen size while orbiting/zooming rather than shrinking to
 * nothing or overwhelming the scene up close.
 */
export function DimensionIndicators({ l, h, w, dimsMm, unit }: Props) {
  const frontZ = w / 2 + Math.max(l, h, w) * 0.12;
  const leftX = -l / 2 - Math.max(l, h, w) * 0.12;

  const lengthLabel = `${formatLength(dimsMm.length_mm, unit)} ${unit}`;
  const heightLabel = `${formatLength(dimsMm.height_mm, unit)} ${unit}`;

  return (
    <group>
      {/* length bracket (front, along X) */}
      <Line points={[[-l / 2, 0, frontZ], [l / 2, 0, frontZ]]} color={LINE_COLOR} lineWidth={1} />
      <Line points={[[-l / 2, 0, frontZ - TICK], [-l / 2, 0, frontZ + TICK]]} color={LINE_COLOR} lineWidth={1} />
      <Line points={[[l / 2, 0, frontZ - TICK], [l / 2, 0, frontZ + TICK]]} color={LINE_COLOR} lineWidth={1} />
      <Html position={[0, 0, frontZ]} center occlude={false}>
        <div className="pointer-events-none whitespace-nowrap rounded bg-ink-soft/90 px-1.5 py-0.5 font-mono text-[10px] text-teal-dim border border-line">
          {lengthLabel}
        </div>
      </Html>

      {/* height bracket (left, along Y) */}
      <Line points={[[leftX, 0, 0], [leftX, h, 0]]} color={LINE_COLOR} lineWidth={1} />
      <Line points={[[leftX - TICK, 0, 0], [leftX + TICK, 0, 0]]} color={LINE_COLOR} lineWidth={1} />
      <Line points={[[leftX - TICK, h, 0], [leftX + TICK, h, 0]]} color={LINE_COLOR} lineWidth={1} />
      <Html position={[leftX, h / 2, 0]} center occlude={false}>
        <div className="pointer-events-none whitespace-nowrap rounded bg-ink-soft/90 px-1.5 py-0.5 font-mono text-[10px] text-teal-dim border border-line">
          {heightLabel}
        </div>
      </Html>
    </group>
  );
}
