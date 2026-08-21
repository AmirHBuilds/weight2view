import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import { ReferenceVisual } from "../visualization/models/ReferenceVisual";

interface Props {
  shape: string;
  modelUrl: string | null;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
}

const SCALE = 1 / 300;

/**
 * A small, self-contained preview so an admin can see whether a GLB loads
 * and looks right (or that the procedural fallback is what will actually
 * render) before saving - Part 14 of the admin upgrade requirements.
 * ReferenceVisual already wraps its own Suspense/ErrorBoundary (see
 * models/ReferenceVisual.tsx), so this uses the exact same
 * loading/fallback pipeline as the public scene - "looks right here"
 * reliably means "looks right in the app."
 */
export function ReferencePreview({ shape, modelUrl, lengthMm, widthMm, heightMm }: Props) {
  const l = Math.max(lengthMm, 1) * SCALE;
  const h = Math.max(heightMm, 1) * SCALE;
  const w = Math.max(widthMm, 1) * SCALE;
  const radius = Math.max(l, h, w);

  return (
    <div className="h-56 w-full overflow-hidden rounded-xl border border-line bg-ink">
      <Canvas camera={{ position: [radius * 2.2, radius * 1.6, radius * 2.2], fov: 42 }}>
        <color attach="background" args={["#12141a"]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 3]} intensity={1} />
        <ReferenceVisual modelUrl={modelUrl} shape={shape} l={l} h={h} w={w} color="#c97b5d" />
        <Grid
          args={[20, 20]}
          cellSize={0.15}
          cellColor="#2b2e37"
          sectionSize={1}
          sectionColor="#3a3e4a"
          fadeDistance={10}
          infiniteGrid
        />
        <OrbitControls enablePan={false} minDistance={radius * 0.5} maxDistance={radius * 6} />
      </Canvas>
    </div>
  );
}
