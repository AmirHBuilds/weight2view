"""
Unit normalization.

All internal calculation uses SI-ish base units:
  - mass   -> grams (g)
  - length -> millimeters (mm)
  - volume -> liters (L)

Adding a new unit later is a one-line addition to the relevant dict below -
nothing else in the app should hardcode conversion factors.
"""
from enum import Enum


class UnitError(ValueError):
    """Raised when an unknown or mismatched unit is used."""


MASS_TO_G: dict[str, float] = {
    "mg": 0.001,
    "g": 1.0,
    "kg": 1000.0,
    "oz": 28.349523125,
    "lb": 453.59237,
}

LENGTH_TO_MM: dict[str, float] = {
    "mm": 1.0,
    "cm": 10.0,
    "m": 1000.0,
    "in": 25.4,
    "ft": 304.8,
}

# 1 L = 1000 cm3 = 1,000,000 mm3
VOLUME_TO_L: dict[str, float] = {
    "ml": 0.001,
    "l": 1.0,
    "in3": 0.0163871,
    "ft3": 28.316846592,
}


class MassUnit(str, Enum):
    mg = "mg"
    g = "g"
    kg = "kg"
    oz = "oz"
    lb = "lb"


class LengthUnit(str, Enum):
    mm = "mm"
    cm = "cm"
    m = "m"
    in_ = "in"
    ft = "ft"


class VolumeUnit(str, Enum):
    ml = "ml"
    l = "l"
    in3 = "in3"
    ft3 = "ft3"


def mass_to_grams(value: float, unit: str) -> float:
    unit = unit.lower()
    if unit not in MASS_TO_G:
        raise UnitError(f"Unknown mass unit: {unit!r}")
    return value * MASS_TO_G[unit]


def grams_to_unit(grams: float, unit: str) -> float:
    unit = unit.lower()
    if unit not in MASS_TO_G:
        raise UnitError(f"Unknown mass unit: {unit!r}")
    return grams / MASS_TO_G[unit]


def length_to_mm(value: float, unit: str) -> float:
    unit = unit.lower()
    if unit not in LENGTH_TO_MM:
        raise UnitError(f"Unknown length unit: {unit!r}")
    return value * LENGTH_TO_MM[unit]


def volume_to_liters(value: float, unit: str) -> float:
    unit = unit.lower()
    if unit not in VOLUME_TO_L:
        raise UnitError(f"Unknown volume unit: {unit!r}")
    return value * VOLUME_TO_L[unit]


def liters_to_unit(liters: float, unit: str) -> float:
    unit = unit.lower()
    if unit not in VOLUME_TO_L:
        raise UnitError(f"Unknown volume unit: {unit!r}")
    return liters / VOLUME_TO_L[unit]
