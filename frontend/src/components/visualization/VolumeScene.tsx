import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls, Html, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { CalculateResponse, ReferenceOption } from "../../types/api";

interface Props {
  result: CalculateResponse;
  referenceShape: "box" | "rounded_box" | "cylinder";
  referenceDims: { length_mm: number; width_mm: number; height_mm: number } | null;
  reference: ReferenceOption | null;
}

// Scale factor: mm -> scene units. Scene units are meters-ish for
// comfortable camera distances.
const SCALE = 1 / 300;

function VolumeShape({ shape }: { shape: Props["result"]["shape"] }) {
  const l = shape.length_mm * SCALE;
  const w = shape.width_mm * SCALE;
  const h = shape.height_mm * SCALE;
  const edges = useMemo(() => new THREE.BoxGeometry(l, h, w), [l, w, h]);
  return (
    <group position={[0, h / 2, 0]}>
      <RoundedBox args={[l, h, w]} radius={Math.min(l, w, h) * 0.06} smoothness={4}>
        <meshStandardMaterial color="#8fd8c7" roughness={0.35} metalness={0.05} transparent opacity={0.88} />
      </RoundedBox>
      <lineSegments>
        <edgesGeometry args={[edges]} />
        <lineBasicMaterial color="#5fa696" />
      </lineSegments>
      <Html position={[0, h / 2 + 0.15, 0]} center distanceFactor={6}>
        <div className="rounded-md bg-ink-soft/90 px-2 py-1 font-mono text-[10px] text-teal whitespace-nowrap border border-line">
          calculated volume
        </div>
      </Html>
    </group>
  );
}

function ReferenceShape({
  shape,
  dims,
  offsetX,
}: {
  shape: "box" | "rounded_box" | "cylinder";
  dims: { length_mm: number; width_mm: number; height_mm: number };
  offsetX: number;
}) {
  const l = dims.length_mm * SCALE;
  const w = dims.width_mm * SCALE;
  const h = dims.height_mm * SCALE;

  return (
    <group position={[offsetX, h / 2, 0]}>
      {shape === "cylinder" ? (
        <mesh>
          <cylinderGeometry args={[l / 2, l / 2, h, 32]} />
          <meshStandardMaterial color="#c97b5d" roughness={0.5} transparent opacity={0.85} />
        </mesh>
      ) : (
        <RoundedBox
          args={[l, h, w]}
          radius={shape === "rounded_box" ? Math.min(l, w, h) * 0.12 : 0.001}
          smoothness={4}
        >
          <meshStandardMaterial color="#c97b5d" roughness={0.5} transparent opacity={0.85} />
        </RoundedBox>
      )}
    </group>
  );
}

export function VolumeScene({ result, referenceShape, referenceDims, reference }: Props) {
  const refOffsetX = referenceDims
    ? (result.shape.length_mm * SCALE) / 2 + (referenceDims.length_mm * SCALE) / 2 + 0.6
    : 0;

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-2xl border border-line bg-ink-soft sm:h-[480px]">
      <Canvas camera={{ position: [3.2, 2.2, 3.6], fov: 42 }} dpr={[1, 2]}>
        <color attach="background" args={["#12141a"]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 3]} intensity={1.1} castShadow />
        <directionalLight position={[-4, 3, -3]} intensity={0.3} />

        <Suspense fallback={null}>
          <VolumeShape shape={result.shape} />
          {referenceDims && (
            <ReferenceShape shape={referenceShape} dims={referenceDims} offsetX={refOffsetX} />
          )}
        </Suspense>

        <Grid
          position={[0, 0, 0]}
          args={[20, 20]}
          cellSize={0.2}
          cellThickness={0.5}
          cellColor="#2b2e37"
          sectionSize={1}
          sectionThickness={1}
          sectionColor="#3a3e4a"
          fadeDistance={12}
          fadeStrength={1}
          infiniteGrid
        />

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={1.5}
          maxDistance={12}
          maxPolarAngle={Math.PI / 2 - 0.02}
        />
      </Canvas>
      {reference && (
        <div className="pointer-events-none -mt-10 flex justify-end pr-4 pb-2">
          <span className="font-mono text-xs text-clay/80">■ {reference.name}</span>
        </div>
      )}
    </div>
  );
}
