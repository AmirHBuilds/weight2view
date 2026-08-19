import { RoundedBox } from "@react-three/drei";
import { Box, Cyl, sharedTorusGeometry } from "./primitives";

/**
 * Each model is a small, self-contained procedural shape built from a
 * handful of primitives (Box/Cyl reuse shared geometries - see
 * primitives.tsx - so polygon counts stay low even with several models on
 * screen). All models are laid out in local space with the base sitting on
 * y=0 and the overall silhouette matching the (l, h, w) bounding box
 * passed in, so true relative scale between references is always
 * preserved - only the internal proportions are stylized for recognition.
 */
export interface ModelProps {
  l: number; // length (local X)
  h: number; // height (local Y)
  w: number; // width/depth (local Z)
  color: string;
  accent?: string;
}

export function PhoneModel({ l, h, w, color, accent = "#1a1c22" }: ModelProps) {
  return (
    <group>
      <RoundedBox args={[l, h, w]} position={[0, h / 2, 0]} radius={Math.min(l, w) * 0.12} smoothness={3}>
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} />
      </RoundedBox>
      {/* screen */}
      <RoundedBox
        args={[l * 0.86, h * 0.5, w * 0.9]}
        position={[0, h / 2, w * 0.02]}
        radius={l * 0.03}
        smoothness={2}
      >
        <meshStandardMaterial color={accent} roughness={0.15} metalness={0.1} />
      </RoundedBox>
      {/* camera bump */}
      <Box size={[l * 0.14, h * 0.06, w * 0.14]} position={[l * 0.32, h * 0.97, -w * 0.32]} color={accent} />
    </group>
  );
}

export function BottleModel({ l, h, w, color, accent = "#2b2e37" }: ModelProps) {
  const bodyH = h * 0.78;
  const neckH = h * 0.14;
  const capH = h * 0.08;
  return (
    <group>
      <Cyl size={[l, bodyH, w]} position={[0, bodyH / 2, 0]} color={color} opacity={0.55} roughness={0.15} metalness={0.05} />
      <Cyl size={[l * 0.4, neckH, w * 0.4]} position={[0, bodyH + neckH / 2, 0]} color={color} opacity={0.55} roughness={0.15} />
      <Cyl size={[l * 0.45, capH, w * 0.45]} position={[0, bodyH + neckH + capH / 2, 0]} color={accent} roughness={0.4} />
    </group>
  );
}

export function MugModel({ l, h, w, color, accent = "#2b2e37" }: ModelProps) {
  const bodyH = h * 0.92;
  return (
    <group>
      <Cyl size={[l, bodyH, w]} position={[0, bodyH / 2, 0]} color={color} roughness={0.35} />
      {/* handle */}
      <mesh geometry={sharedTorusGeometry()} position={[l * 0.58, bodyH * 0.55, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[w * 0.6, w * 0.6, 1]}>
        <meshStandardMaterial color={accent} roughness={0.4} />
      </mesh>
    </group>
  );
}

export function ShoeModel({ l, h, w, color, accent = "#2b2e37" }: ModelProps) {
  return (
    <group>
      {/* sole */}
      <RoundedBox args={[l, h * 0.28, w]} position={[0, h * 0.14, 0]} radius={h * 0.08} smoothness={2}>
        <meshStandardMaterial color={accent} roughness={0.6} />
      </RoundedBox>
      {/* upper body, tapered toward toe using two overlapping rounded boxes */}
      <RoundedBox args={[l * 0.75, h * 0.62, w * 0.92]} position={[-l * 0.06, h * 0.55, 0]} radius={w * 0.22} smoothness={3}>
        <meshStandardMaterial color={color} roughness={0.5} />
      </RoundedBox>
      <RoundedBox args={[l * 0.4, h * 0.42, w * 0.7]} position={[l * 0.32, h * 0.42, 0]} radius={w * 0.18} smoothness={3}>
        <meshStandardMaterial color={color} roughness={0.5} />
      </RoundedBox>
    </group>
  );
}

export function BackpackModel({ l, h, w, color, accent = "#2b2e37" }: ModelProps) {
  return (
    <group>
      <RoundedBox args={[l, h * 0.85, w]} position={[0, h * 0.46, 0]} radius={Math.min(l, w) * 0.18} smoothness={3}>
        <meshStandardMaterial color={color} roughness={0.65} />
      </RoundedBox>
      {/* front pocket */}
      <RoundedBox args={[l * 0.7, h * 0.32, w * 0.22]} position={[0, h * 0.3, w * 0.5]} radius={l * 0.08} smoothness={2}>
        <meshStandardMaterial color={accent} roughness={0.65} />
      </RoundedBox>
      {/* straps */}
      <Box size={[l * 0.1, h * 0.7, w * 0.12]} position={[-l * 0.28, h * 0.5, -w * 0.42]} color={accent} roughness={0.7} />
      <Box size={[l * 0.1, h * 0.7, w * 0.12]} position={[l * 0.28, h * 0.5, -w * 0.42]} color={accent} roughness={0.7} />
    </group>
  );
}

export function FridgeModel({ l, h, w, color, accent = "#1a1c22" }: ModelProps) {
  const doorSplit = h * 0.32;
  return (
    <group>
      <RoundedBox args={[l, h, w]} position={[0, h / 2, 0]} radius={Math.min(l, w) * 0.06} smoothness={2}>
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.3} />
      </RoundedBox>
      {/* door seam */}
      <Box size={[l * 1.001, h * 0.01, w * 1.001]} position={[0, h - doorSplit, 0]} color={accent} />
      {/* handles */}
      <Box size={[l * 0.04, h * 0.22, w * 0.04]} position={[l * 0.42, h - doorSplit / 2, w / 2 + 0.01]} color={accent} metalness={0.6} roughness={0.2} />
      <Box size={[l * 0.04, h * 0.5, w * 0.04]} position={[l * 0.42, doorSplit * 0.9, w / 2 + 0.01]} color={accent} metalness={0.6} roughness={0.2} />
    </group>
  );
}

export function WashingMachineModel({ l, h, w, color, accent = "#2b2e37" }: ModelProps) {
  const doorRadius = Math.min(l, h) * 0.32;
  return (
    <group>
      <RoundedBox args={[l, h, w]} position={[0, h / 2, 0]} radius={Math.min(l, w) * 0.05} smoothness={2}>
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.15} />
      </RoundedBox>
      {/* door ring */}
      <mesh position={[0, h * 0.42, w / 2 + 0.005]} rotation={[0, 0, 0]}>
        <ringGeometry args={[doorRadius * 0.75, doorRadius, 24]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.4} side={2} />
      </mesh>
      <mesh position={[0, h * 0.42, w / 2 + 0.001]}>
        <circleGeometry args={[doorRadius * 0.72, 24]} />
        <meshStandardMaterial color="#0d0e12" roughness={0.1} metalness={0.6} />
      </mesh>
      {/* control panel strip */}
      <Box size={[l * 0.9, h * 0.06, w * 0.02]} position={[0, h * 0.9, w / 2 + 0.01]} color={accent} />
    </group>
  );
}

export function CarModel({ l, h, w, color, accent = "#1a1c22" }: ModelProps) {
  const wheelR = h * 0.16;
  const wheelY = wheelR;
  const wheelXOff = l * 0.32;
  const wheelZOff = w / 2 - wheelR * 0.4;
  return (
    <group>
      {/* lower body */}
      <RoundedBox args={[l, h * 0.42, w]} position={[0, h * 0.32, 0]} radius={h * 0.08} smoothness={2}>
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
      </RoundedBox>
      {/* cabin */}
      <RoundedBox args={[l * 0.55, h * 0.4, w * 0.88]} position={[-l * 0.03, h * 0.68, 0]} radius={h * 0.12} smoothness={3}>
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.3} transparent opacity={0.92} />
      </RoundedBox>
      {/* wheels */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <Cyl
            key={`${sx}-${sz}`}
            size={[wheelR * 2, w * 0.08, wheelR * 2]}
            position={[sx * wheelXOff, wheelY, sz * wheelZOff]}
            rotation={[0, 0, Math.PI / 2]}
            color={accent}
            roughness={0.8}
          />
        ))
      )}
    </group>
  );
}

export function MotorcycleModel({ l, h, w, color, accent = "#1a1c22" }: ModelProps) {
  const wheelR = h * 0.28;
  return (
    <group>
      {/* two wheels */}
      <Cyl size={[wheelR * 2, w * 0.18, wheelR * 2]} position={[-l * 0.34, wheelR, 0]} rotation={[0, 0, Math.PI / 2]} color={accent} roughness={0.8} />
      <Cyl size={[wheelR * 2, w * 0.18, wheelR * 2]} position={[l * 0.34, wheelR, 0]} rotation={[0, 0, Math.PI / 2]} color={accent} roughness={0.8} />
      {/* body / frame */}
      <RoundedBox args={[l * 0.55, h * 0.22, w * 0.35]} position={[0, h * 0.42, 0]} radius={h * 0.06} smoothness={2}>
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.4} />
      </RoundedBox>
      {/* seat */}
      <Box size={[l * 0.34, h * 0.08, w * 0.3]} position={[-l * 0.05, h * 0.55, 0]} color={accent} roughness={0.6} />
      {/* handlebar post */}
      <Box size={[l * 0.05, h * 0.4, w * 0.05]} position={[l * 0.3, h * 0.62, 0]} color={accent} metalness={0.5} roughness={0.3} />
    </group>
  );
}

export function BicycleModel({ l, h, w, color, accent = "#2b2e37" }: ModelProps) {
  const wheelR = h * 0.42;
  return (
    <group>
      <Cyl size={[wheelR * 2, w * 0.06, wheelR * 2]} position={[-l * 0.36, wheelR, 0]} rotation={[0, 0, Math.PI / 2]} color={accent} roughness={0.8} />
      <Cyl size={[wheelR * 2, w * 0.06, wheelR * 2]} position={[l * 0.36, wheelR, 0]} rotation={[0, 0, Math.PI / 2]} color={accent} roughness={0.8} />
      {/* frame - simple diagonal using a rotated box */}
      <Box size={[l * 0.5, h * 0.06, w * 0.04]} position={[0, wheelR * 1.4, 0]} color={color} roughness={0.4} metalness={0.3} />
      <Box size={[h * 0.5, h * 0.06, w * 0.04]} position={[-l * 0.1, wheelR * 1.1, 0]} color={color} rotation={[0, 0, Math.PI / 2.6]} roughness={0.4} metalness={0.3} />
      {/* seat + handlebar posts */}
      <Box size={[h * 0.05, h * 0.3, w * 0.04]} position={[-l * 0.32, wheelR * 1.9, 0]} color={accent} />
      <Box size={[h * 0.05, h * 0.35, w * 0.04]} position={[l * 0.34, wheelR * 1.9, 0]} color={accent} />
    </group>
  );
}
