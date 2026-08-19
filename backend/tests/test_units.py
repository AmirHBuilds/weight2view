import pytest

from app.services.units import (
    UnitError,
    grams_to_unit,
    length_to_mm,
    liters_to_unit,
    mass_to_grams,
    volume_to_liters,
)


def test_mass_to_grams_kg():
    assert mass_to_grams(1, "kg") == 1000


def test_mass_to_grams_lb():
    assert mass_to_grams(1, "lb") == pytest.approx(453.59237)


def test_mass_roundtrip():
    grams = mass_to_grams(2.5, "lb")
    back = grams_to_unit(grams, "lb")
    assert back == pytest.approx(2.5)


def test_unknown_mass_unit_raises():
    with pytest.raises(UnitError):
        mass_to_grams(1, "stone")


def test_length_to_mm():
    assert length_to_mm(1, "m") == 1000
    assert length_to_mm(1, "in") == pytest.approx(25.4)


def test_volume_to_liters_and_back():
    liters = volume_to_liters(1, "ft3")
    assert liters == pytest.approx(28.316846592)
    back = liters_to_unit(liters, "ft3")
    assert back == pytest.approx(1)


def test_unknown_volume_unit_raises():
    with pytest.raises(UnitError):
        volume_to_liters(1, "barrel")
