"""
Calculation service: mass -> volume (and the seam for volume -> mass later).

This module is intentionally framework-free (no FastAPI, no SQLAlchemy
Session queries) so it can be unit tested in isolation and reused by any
future entry point (API, CLI, batch job, reverse calculation, etc).

Design note on API shape for future volume->mass:
This module exposes `calculate_mass_to_volume(...)`. A future
`calculate_volume_to_mass(...)` function would live right beside it, share
the same `MeasurementData` input and `CalculationResult`-shaped output
(mirrored as a mass result), and the API layer would simply add a new route
that calls it - no changes needed to this function or its callers.
"""
from dataclasses import dataclass

from app.services.units import mass_to_grams, volume_to_liters


class CalculationError(ValueError):
    """Raised when a volume cannot be calculated from the given data."""


@dataclass(frozen=True)
class MeasurementData:
    """
    Minimal, ORM-independent view of an item's primary measurement.
    Built from `ItemMeasurement` at the API boundary so this service never
    depends on SQLAlchemy models directly.
    """

    strategy: str  # "density" | "bulk_density"
    density_kg_m3: float | None
    bulk_density_kg_m3: float | None
    confidence: str  # "verified" | "estimated" | "demo"
    source: str | None
    notes: str | None


@dataclass(frozen=True)
class CalculationResult:
    volume_l: float
    strategy_used: str
    confidence: str
    source: str | None
    notes: str | None
    mass_g: float  # normalized input, useful for the API response/debugging


def calculate_mass_to_volume(
    amount: float,
    unit: str,
    measurement: MeasurementData,
) -> CalculationResult:
    """
    Convert a mass amount (in an arbitrary supported unit) to an estimated
    volume in liters, using the item's explicitly configured measurement
    strategy.

    Raises CalculationError if the amount is invalid or the measurement data
    required by the configured strategy is missing.
    """
    if amount <= 0:
        raise CalculationError("Amount must be greater than zero.")

    mass_g = mass_to_grams(amount, unit)

    if measurement.strategy == "density":
        if not measurement.density_kg_m3:
            raise CalculationError(
                "Item is configured to use 'density' but no density value is set."
            )
        # density_kg_m3 [kg/m3] == [g/L] numerically (1 m3 = 1000 L, 1 kg = 1000 g)
        volume_l = mass_g / measurement.density_kg_m3

    elif measurement.strategy == "bulk_density":
        if not measurement.bulk_density_kg_m3:
            raise CalculationError(
                "Item is configured to use 'bulk_density' but no bulk density value is set."
            )
        volume_l = mass_g / measurement.bulk_density_kg_m3

    else:
        raise CalculationError(f"Unsupported measurement strategy: {measurement.strategy!r}")

    return CalculationResult(
        volume_l=volume_l,
        strategy_used=measurement.strategy,
        confidence=measurement.confidence,
        source=measurement.source,
        notes=measurement.notes,
        mass_g=mass_g,
    )


def cuboid_dimensions_mm_for_volume(volume_l: float, aspect: tuple[float, float, float] = (1.0, 1.0, 1.2)) -> tuple[float, float, float]:
    """
    Derive simple cuboid dimensions (length, width, height in mm) that
    produce the given volume, using a fixed aspect ratio so the shape isn't
    a perfect (visually boring) cube. Used by the 3D visualization layer -
    NOT meant to represent the item's real shape.
    """
    if volume_l <= 0:
        raise CalculationError("Volume must be greater than zero.")

    volume_mm3 = volume_l * 1_000_000  # 1 L = 1,000,000 mm3
    ax, ay, az = aspect
    # volume = (k*ax) * (k*ay) * (k*az) => k = cube_root(volume / (ax*ay*az))
    k = (volume_mm3 / (ax * ay * az)) ** (1 / 3)
    return (k * ax, k * ay, k * az)
