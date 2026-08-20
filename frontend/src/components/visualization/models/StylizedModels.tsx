import { RoundedBox } from "@react-three/drei";
import { Box, Cone, Disc, Ring } from "./primitives";

/**
 * Each model is a compact, self-contained procedural shape. The goal is
 * immediate recognition at a glance - a clean stylized 3D-product-
 * illustration look, not photorealism - achieved through correct
 * silhouette proportions (tapers, two-tone wheels, visible openings,
 * bezels) rather than raw detail count. All models are laid out in local
 * space with the base sitting on y=0 and the overall silhouette matching
 * the (l, h, w) bounding box passed in, so true relative scale between
 * references is always preserved - only internal proportions are
 * stylized for recognition.
 */
export interface ModelProps {
  l: number; // length (local X)
  h: number; // height (local Y)
  w: number; // width/depth (local Z)
  color: string;
  accent?: string;
}

export function PhoneModel({ l, h, w, color, accent = "#0d0e12" }: ModelProps) {
  // Phone thickness (h) is tiny relative to l/w, so the screen/bezel must
  // be thin flush decals sized off the phone's length - not fractions of
  // its own thickness - or stacking them produces a tall stepped "cavity"
  // instead of a flat marking.
  const decalT = l * 0.012;
  return (
    <group>
      <RoundedBox args={[l, h, w]} position={[0, h / 2, 0]} radius={Math.min(l, w) * 0.22} smoothness={4}>
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.55} />
      </RoundedBox>
      <RoundedBox args={[l * 0.88, decalT, w * 0.9]} position={[0, h + decalT / 2 - 0.001, 0]} radius={l * 0.05} smoothness={3}>
        <meshStandardMaterial color="#1c2530" roughness={0.1} metalness={0.15} />
      </RoundedBox>
      <Disc radius={l * 0.018} position={[0, h + decalT + 0.001, -w * 0.36]} color={accent} roughness={0.15} metalness={0.3} />
    </group>
  );
}

export function BottleModel({ l, h, w, color, accent = "#20242c" }: ModelProps) {
  const bodyH = h * 0.6;
  const shoulderH = h * 0.16;
  const neckH = h * 0.14;
  const capH = h * 0.1;
  const bodyR = Math.min(l, w) / 2;
  const neckR = bodyR * 0.34;
  return (
    <group>
      <Cone radiusTop={bodyR} radiusBottom={bodyR * 0.9} height={bodyH} position={[0, bodyH / 2, 0]} color={color} opacity={0.5} roughness={0.1} metalness={0.05} />
      <Cone radiusTop={neckR} radiusBottom={bodyR} height={shoulderH} position={[0, bodyH + shoulderH / 2, 0]} color={color} opacity={0.5} roughness={0.1} metalness={0.05} />
      <Cone radiusTop={neckR} radiusBottom={neckR} height={neckH} position={[0, bodyH + shoulderH + neckH / 2, 0]} color={color} opacity={0.5} roughness={0.1} metalness={0.05} />
      <Cone
        radiusTop={neckR * 1.12}
        radiusBottom={neckR * 1.12}
        height={capH}
        position={[0, bodyH + shoulderH + neckH + capH / 2, 0]}
        color={accent}
        roughness={0.35}
      />
    </group>
  );
}

export function MugModel({ l, h, w, color, accent = "#20242c" }: ModelProps) {
  const bodyH = h * 0.88;
  const topR = Math.min(l, w) / 2;
  const bottomR = topR * 0.86;
  return (
    <group>
      <Cone radiusTop={topR} radiusBottom={bottomR} height={bodyH} position={[0, bodyH / 2, 0]} color={color} roughness={0.35} />
      <Ring size={[topR * 2 * 1.02, topR * 2 * 1.02, topR * 0.14]} position={[0, bodyH, 0]} rotation={[Math.PI / 2, 0, 0]} color={color} roughness={0.3} />
      <Disc radius={topR * 0.86} thickness={0.006} position={[0, bodyH - 0.003, 0]} color={accent} roughness={0.6} metalness={0} />
      <Ring size={[w * 0.7, bodyH * 0.62, w * 0.16]} position={[l * 0.56, bodyH * 0.52, 0]} rotation={[0, Math.PI / 2, 0]} color={color} roughness={0.4} />
    </group>
  );
}

export function ShoeModel({ l, h, w, color, accent = "#20242c" }: ModelProps) {
  return (
    <group>
      {/* sole - wider than the upper, clearly visible band at the base */}
      <RoundedBox args={[l * 1.04, h * 0.2, w * 1.06]} position={[0, h * 0.1, 0]} radius={h * 0.08} smoothness={3}>
        <meshStandardMaterial color={accent} roughness={0.8} />
      </RoundedBox>
      {/* heel - taller, narrower block at the back */}
      <RoundedBox args={[l * 0.24, h * 0.62, w * 0.8]} position={[-l * 0.36, h * 0.52, 0]} radius={w * 0.2} smoothness={3}>
        <meshStandardMaterial color={color} roughness={0.55} />
      </RoundedBox>
      {/* vamp - mid-upper body */}
      <RoundedBox args={[l * 0.5, h * 0.5, w * 0.86]} position={[-l * 0.06, h * 0.46, 0]} radius={w * 0.24} smoothness={3}>
        <meshStandardMaterial color={color} roughness={0.55} />
      </RoundedBox>
      {/* tapered toe box - shorter and narrower, angled down toward the tip */}
      <RoundedBox
        args={[l * 0.34, h * 0.32, w * 0.62]}
        position={[l * 0.36, h * 0.28, 0]}
        radius={w * 0.2}
        smoothness={3}
        rotation={[0, 0, -0.22]}
      >
        <meshStandardMaterial color={color} roughness={0.55} />
      </RoundedBox>
      {/* tongue / lace strip - raised, higher contrast */}
      <RoundedBox args={[l * 0.28, h * 0.14, w * 0.34]} position={[l * 0.02, h * 0.76, 0]} radius={h * 0.04} smoothness={2}>
        <meshStandardMaterial color={accent} roughness={0.6} />
      </RoundedBox>
    </group>
  );
}

export function BackpackModel({ l, h, w, color, accent = "#20242c" }: ModelProps) {
  return (
    <group>
      <RoundedBox args={[l, h * 0.82, w]} position={[0, h * 0.45, 0]} radius={Math.min(l, w) * 0.3} smoothness={4}>
        <meshStandardMaterial color={color} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[l * 0.94, h * 0.22, w * 0.98]} position={[0, h * 0.86, 0]} radius={Math.min(l, w) * 0.32} smoothness={4}>
        <meshStandardMaterial color={color} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[l * 0.62, h * 0.36, w * 0.2]} position={[0, h * 0.32, w * 0.48]} radius={l * 0.1} smoothness={3}>
        <meshStandardMaterial color={accent} roughness={0.65} />
      </RoundedBox>
      <Box size={[l * 0.5, h * 0.015, w * 0.02]} position={[0, h * 0.46, w * 0.58]} color="#0d0e12" roughness={0.5} />
      <Box size={[l * 0.11, h * 0.72, w * 0.1]} position={[-l * 0.27, h * 0.46, -w * 0.44]} color={accent} roughness={0.7} rotation={[0.08, 0, 0]} />
      <Box size={[l * 0.11, h * 0.72, w * 0.1]} position={[l * 0.27, h * 0.46, -w * 0.44]} color={accent} roughness={0.7} rotation={[0.08, 0, 0]} />
      <Ring size={[l * 0.22, w * 0.3, w * 0.06]} position={[0, h * 1.0, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]} color={accent} roughness={0.6} />
    </group>
  );
}

export function FridgeModel({ l, h, w, color, accent = "#0d0e12" }: ModelProps) {
  const doorSplit = h * 0.32;
  const handleR = Math.min(l, w) * 0.02;
  return (
    <group>
      <RoundedBox args={[l, h * 0.98, w]} position={[0, h * 0.5, 0]} radius={Math.min(l, w) * 0.08} smoothness={4}>
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.35} />
      </RoundedBox>
      <Box size={[l * 0.98, h * 0.03, w * 0.98]} position={[0, h * 0.015, 0]} color={accent} roughness={0.6} />
      <Box size={[l * 1.001, h * 0.008, w * 1.001]} position={[0, h - doorSplit, 0]} color={accent} />
      <RoundedBox args={[l * 0.03, h * 0.24, w * 0.05]} position={[l * 0.44, h - doorSplit / 2, w / 2 + handleR]} radius={l * 0.012} smoothness={2}>
        <meshStandardMaterial color={accent} metalness={0.65} roughness={0.2} />
      </RoundedBox>
      <RoundedBox args={[l * 0.03, h * 0.5, w * 0.05]} position={[l * 0.44, doorSplit * 0.85, w / 2 + handleR]} radius={l * 0.012} smoothness={2}>
        <meshStandardMaterial color={accent} metalness={0.65} roughness={0.2} />
      </RoundedBox>
    </group>
  );
}

export function WashingMachineModel({ l, h, w, color, accent = "#20242c" }: ModelProps) {
  const doorRadius = Math.min(l, h) * 0.3;
  return (
    <group>
      <RoundedBox args={[l, h, w]} position={[0, h / 2, 0]} radius={Math.min(l, w) * 0.07} smoothness={4}>
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.15} />
      </RoundedBox>
      <Ring size={[doorRadius * 2.15, doorRadius * 2.15, doorRadius * 0.3]} position={[0, h * 0.4, w / 2]} rotation={[Math.PI / 2, 0, 0]} color={accent} roughness={0.3} metalness={0.4} />
      <Disc radius={doorRadius * 0.86} thickness={0.008} position={[0, h * 0.4, w / 2 + 0.004]} rotation={[Math.PI / 2, 0, 0]} color="#05060a" roughness={0.1} metalness={0.5} />
      <Box size={[l * 0.86, h * 0.07, w * 0.02]} position={[0, h * 0.88, w / 2]} color={accent} roughness={0.5} />
      <Disc radius={l * 0.025} position={[-l * 0.28, h * 0.88 + 0.001, w / 2]} rotation={[Math.PI / 2, 0, 0]} color="#3a3e4a" />
      <Disc radius={l * 0.025} position={[-l * 0.18, h * 0.88 + 0.001, w / 2]} rotation={[Math.PI / 2, 0, 0]} color="#3a3e4a" />
    </group>
  );
}

function Wheel({ radius, thickness, position, color, hubColor }: { radius: number; thickness: number; position: [number, number, number]; color: string; hubColor: string }) {
  return (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      <Ring size={[radius * 2, radius * 2, thickness]} color={color} roughness={0.85} />
      <Disc radius={radius * 0.55} thickness={thickness * 0.7} color={hubColor} roughness={0.3} metalness={0.5} />
    </group>
  );
}

export function CarModel({ l, h, w, color, accent = "#0d0e12" }: ModelProps) {
  const wheelR = h * 0.19;
  const wheelXOff = l * 0.31;
  const wheelZOff = w / 2 - wheelR * 0.35;
  return (
    <group>
      <RoundedBox args={[l, h * 0.4, w]} position={[0, h * 0.3, 0]} radius={h * 0.14} smoothness={3}>
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.35} />
      </RoundedBox>
      <RoundedBox args={[l * 0.52, h * 0.42, w * 0.86]} position={[-l * 0.06, h * 0.66, 0]} radius={h * 0.18} smoothness={4}>
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.35} />
      </RoundedBox>
      <RoundedBox args={[l * 0.16, h * 0.32, w * 0.78]} position={[l * 0.2, h * 0.64, 0]} radius={h * 0.05} smoothness={2} rotation={[0, 0, 0.55]}>
        <meshStandardMaterial color="#1c2530" roughness={0.1} metalness={0.3} transparent opacity={0.85} />
      </RoundedBox>
      <Box size={[l * 0.5, h * 0.12, w * 0.9]} position={[-l * 0.06, h * 0.78, 0]} color="#1c2530" opacity={0.85} roughness={0.15} metalness={0.2} />
      <Disc radius={h * 0.05} position={[l * 0.49, h * 0.34, w * 0.32]} rotation={[0, Math.PI / 2, 0]} color="#eef1e8" roughness={0.2} metalness={0.4} />
      <Disc radius={h * 0.05} position={[l * 0.49, h * 0.34, -w * 0.32]} rotation={[0, Math.PI / 2, 0]} color="#eef1e8" roughness={0.2} metalness={0.4} />
      <Disc radius={h * 0.04} position={[-l * 0.49, h * 0.34, w * 0.32]} rotation={[0, Math.PI / 2, 0]} color="#7a2a20" roughness={0.2} metalness={0.4} />
      <Disc radius={h * 0.04} position={[-l * 0.49, h * 0.34, -w * 0.32]} rotation={[0, Math.PI / 2, 0]} color="#7a2a20" roughness={0.2} metalness={0.4} />
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <Wheel key={`${sx}-${sz}`} radius={wheelR} thickness={w * 0.09} position={[sx * wheelXOff, wheelR, sz * wheelZOff]} color={accent} hubColor="#8a8f9a" />
        ))
      )}
    </group>
  );
}

export function MotorcycleModel({ l, h, w, color, accent = "#0d0e12" }: ModelProps) {
  const wheelR = h * 0.27;
  const frontX = l * 0.36;
  const rearX = -l * 0.36;
  return (
    <group>
      <Wheel radius={wheelR} thickness={w * 0.16} position={[rearX, wheelR, 0]} color={accent} hubColor="#8a8f9a" />
      <Wheel radius={wheelR} thickness={w * 0.16} position={[frontX, wheelR, 0]} color={accent} hubColor="#8a8f9a" />
      {/* fuel tank / main body - the dominant colored mass so the silhouette reads clearly against the dark wheels */}
      <RoundedBox args={[l * 0.34, h * 0.22, w * 0.32]} position={[-l * 0.08, h * 0.62, 0]} radius={h * 0.08} smoothness={3}>
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.5} />
      </RoundedBox>
      {/* seat, extending back from the tank */}
      <RoundedBox args={[l * 0.36, h * 0.1, w * 0.28]} position={[-l * 0.28, h * 0.62, 0]} radius={h * 0.03} smoothness={2}>
        <meshStandardMaterial color={accent} roughness={0.6} />
      </RoundedBox>
      {/* engine block, low and central between the wheels */}
      <RoundedBox args={[l * 0.22, h * 0.28, w * 0.3]} position={[-l * 0.04, h * 0.32, 0]} radius={h * 0.06} smoothness={2}>
        <meshStandardMaterial color={accent} roughness={0.4} metalness={0.4} />
      </RoundedBox>
      {/* front fork connecting tank area down to the front wheel */}
      <Box size={[l * 0.05, h * 0.5, w * 0.05]} position={[frontX * 0.9, h * 0.46, 0]} color={accent} metalness={0.6} roughness={0.25} rotation={[0, 0, -0.4]} />
      {/* handlebar */}
      <Box size={[l * 0.03, w * 0.05, w * 0.46]} position={[frontX * 1.06, h * 0.74, 0]} color={accent} metalness={0.5} roughness={0.3} />
      {/* headlight */}
      <Disc radius={h * 0.11} position={[frontX * 1.12, h * 0.56, 0]} rotation={[0, Math.PI / 2, 0]} color="#eef1e8" roughness={0.15} metalness={0.3} />
      {/* exhaust pipe */}
      <Box size={[l * 0.32, h * 0.06, w * 0.06]} position={[-l * 0.12, h * 0.2, w * 0.22]} color="#8a8f9a" metalness={0.6} roughness={0.3} />
    </group>
  );
}

function FrameTube({ from, to, radius, color }: { from: [number, number, number]; to: [number, number, number]; radius: number; color: string }) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const midpoint: [number, number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
  const pitch = Math.atan2(Math.sqrt(dx * dx + dz * dz), dy);
  const yaw = Math.atan2(dx, dz);
  return (
    <Cone
      radiusTop={radius}
      radiusBottom={radius}
      height={length}
      position={midpoint}
      rotation={[pitch, yaw, 0]}
      color={color}
      roughness={0.4}
      metalness={0.4}
    />
  );
}

export function BicycleModel({ l, h, w, color, accent = "#3a3e4a" }: ModelProps) {
  const wheelR = h * 0.4;
  const frontX = l * 0.38;
  const rearX = -l * 0.38;
  const hubY = wheelR;
  const seatX = -l * 0.12;
  const seatY = wheelR * 1.85;
  return (
    <group>
      <Ring size={[wheelR * 2, wheelR * 2, wheelR * 0.16]} position={[rearX, hubY, 0]} rotation={[0, 0, Math.PI / 2]} color={accent} roughness={0.6} />
      <Ring size={[wheelR * 2, wheelR * 2, wheelR * 0.16]} position={[frontX, hubY, 0]} rotation={[0, 0, Math.PI / 2]} color={accent} roughness={0.6} />
      <Disc radius={wheelR * 0.12} position={[rearX, hubY, 0]} rotation={[0, Math.PI / 2, 0]} color="#8a8f9a" metalness={0.5} roughness={0.3} />
      <Disc radius={wheelR * 0.12} position={[frontX, hubY, 0]} rotation={[0, Math.PI / 2, 0]} color="#8a8f9a" metalness={0.5} roughness={0.3} />
      <FrameTube from={[rearX, hubY, 0]} to={[seatX, wheelR * 0.9, 0]} radius={h * 0.035} color={color} />
      <FrameTube from={[seatX, wheelR * 0.9, 0]} to={[seatX, seatY, 0]} radius={h * 0.035} color={color} />
      <FrameTube from={[seatX, seatY, 0]} to={[frontX, hubY * 1.7, 0]} radius={h * 0.035} color={color} />
      <FrameTube from={[frontX, hubY * 1.7, 0]} to={[frontX, hubY, 0]} radius={h * 0.03} color={color} />
      <FrameTube from={[seatX, wheelR * 0.9, 0]} to={[rearX, hubY, 0]} radius={h * 0.028} color={color} />
      <RoundedBox args={[l * 0.12, h * 0.04, w * 0.3]} position={[seatX - l * 0.02, seatY + h * 0.03, 0]} radius={h * 0.015} smoothness={2}>
        <meshStandardMaterial color={accent} roughness={0.6} />
      </RoundedBox>
      <Box size={[l * 0.03, w * 0.04, w * 0.42]} position={[frontX, hubY * 1.72, 0]} color={accent} metalness={0.4} roughness={0.3} />
      <Disc radius={h * 0.06} position={[seatX, wheelR * 0.9, 0]} rotation={[0, Math.PI / 2, 0]} color={accent} roughness={0.4} metalness={0.3} />
    </group>
  );
}
