export interface ItemSearchResult {
  id: string;
  name: string;
  slug: string;
  category: string;
  variant: string | null;
}

export interface ReferenceOption {
  id: string;
  name: string;
  category: string;
  volume_l: number;
  familiarity_score: number;
  score: number;
  multiple: number;
}

export interface VolumeShape {
  length_mm: number;
  width_mm: number;
  height_mm: number;
}

export interface CalculateResponse {
  item_id: string;
  item_name: string;
  amount: number;
  unit: string;
  mass_g: number;
  volume_l: number;
  strategy_used: string;
  confidence: "verified" | "estimated" | "demo";
  source: string | null;
  notes: string | null;
  shape: VolumeShape;
  best_reference: ReferenceOption | null;
  reference_alternatives: ReferenceOption[];
}

export interface ReferenceObjectRead {
  id: string;
  name: string;
  category: string;
  length_mm: number;
  width_mm: number;
  height_mm: number;
  volume_l: number;
  shape: "box" | "rounded_box" | "cylinder" | "phone" | "bottle" | "mug" | "shoe" | "backpack" | "fridge" | "washing_machine" | "car" | "motorcycle" | "bicycle";
  model_url: string | null;
  model_source: string | null;
  familiarity_score: number;
  active: boolean;
}

export interface ItemMeasurementRead {
  id: string;
  strategy: string;
  density_kg_m3: number | null;
  bulk_density_kg_m3: number | null;
  average_unit_weight_g: number | null;
  typical_length_mm: number | null;
  typical_width_mm: number | null;
  typical_height_mm: number | null;
  is_primary: boolean;
  source: string | null;
  confidence: string;
  notes: string | null;
}

export interface ItemRead {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  variant: string | null;
  active: boolean;
  measurements: ItemMeasurementRead[];
  aliases: string[];
}

export interface ItemRequestRead {
  id: string;
  query_text: string;
  status: "pending" | "approved" | "rejected" | "completed";
  resulting_item_id: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export const MASS_UNITS = ["mg", "g", "kg", "oz", "lb"] as const;
export type MassUnit = (typeof MASS_UNITS)[number];
