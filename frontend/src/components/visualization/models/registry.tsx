import type { ComponentType } from "react";
import {
  BackpackModel,
  BicycleModel,
  BottleModel,
  CarModel,
  FridgeModel,
  MotorcycleModel,
  MugModel,
  PhoneModel,
  ShoeModel,
  WashingMachineModel,
} from "./StylizedModels";
import type { ModelProps } from "./StylizedModels";
import { GenericBoxModel, GenericCylinderModel, GenericRoundedBoxModel } from "./GenericModels";

/**
 * Single place that maps a reference object's `shape` field (from the
 * database) to the component that renders it. To add a new stylized
 * reference model: build the component in StylizedModels.tsx, register it
 * here, and add the shape value to the backend's REFERENCE_SHAPES +
 * migration check constraint. Nothing else needs to change.
 */
const REGISTRY: Record<string, ComponentType<ModelProps>> = {
  box: GenericBoxModel,
  rounded_box: GenericRoundedBoxModel,
  cylinder: GenericCylinderModel,
  phone: PhoneModel,
  bottle: BottleModel,
  mug: MugModel,
  shoe: ShoeModel,
  backpack: BackpackModel,
  fridge: FridgeModel,
  washing_machine: WashingMachineModel,
  car: CarModel,
  motorcycle: MotorcycleModel,
  bicycle: BicycleModel,
};

export function renderReferenceModel(shape: string): ComponentType<ModelProps> {
  return REGISTRY[shape] ?? GenericRoundedBoxModel;
}

export type { ModelProps };
