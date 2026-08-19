/**
 * Length unit conversion - the frontend's single source of truth for
 * converting millimeters (the API's normalized unit) into a
 * user-selected display unit. Mirrors the conversion factors in
 * backend/app/services/units.py so the two stay consistent, but exists
 * client-side because dimension-unit switching must not trigger a
 * recalculation round-trip - it's a pure display conversion.
 *
 * Do NOT duplicate these factors elsewhere in components - import from here.
 */

export const LENGTH_UNITS = ["mm", "cm", "m", "in", "ft"] as const;
export type LengthUnit = (typeof LENGTH_UNITS)[number];

const LENGTH_TO_MM: Record<LengthUnit, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  in: 25.4,
  ft: 304.8,
};

export function mmToUnit(mm: number, unit: LengthUnit): number {
  return mm / LENGTH_TO_MM[unit];
}

export function unitToMm(value: number, unit: LengthUnit): number {
  return value * LENGTH_TO_MM[unit];
}

/** Format a millimeter value in the given unit with sensible precision. */
export function formatLength(mm: number, unit: LengthUnit): string {
  const value = mmToUnit(mm, unit);
  const decimals = unit === "mm" || unit === "in" || unit === "ft" ? 1 : unit === "cm" ? 1 : 2;
  return `${value.toFixed(decimals)}`;
}

export function formatDimensions(
  dims: { length_mm: number; width_mm: number; height_mm: number },
  unit: LengthUnit
): string {
  return `${formatLength(dims.length_mm, unit)} × ${formatLength(dims.width_mm, unit)} × ${formatLength(dims.height_mm, unit)} ${unit}`;
}
