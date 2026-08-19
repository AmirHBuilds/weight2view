import { RoundedBox } from "@react-three/drei";
import { Cyl } from "./primitives";
import type { ModelProps } from "./StylizedModels";

export function GenericBoxModel({ l, h, w, color }: ModelProps) {
  return (
    <mesh position={[0, h / 2, 0]} scale={[l, h, w]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.5} transparent opacity={0.85} />
    </mesh>
  );
}

export function GenericRoundedBoxModel({ l, h, w, color }: ModelProps) {
  return (
    <RoundedBox args={[l, h, w]} position={[0, h / 2, 0]} radius={Math.min(l, w, h) * 0.12} smoothness={4}>
      <meshStandardMaterial color={color} roughness={0.5} transparent opacity={0.85} />
    </RoundedBox>
  );
}

export function GenericCylinderModel({ l, h, w, color }: ModelProps) {
  return <Cyl size={[l, h, w]} position={[0, h / 2, 0]} color={color} opacity={0.85} roughness={0.5} />;
}
