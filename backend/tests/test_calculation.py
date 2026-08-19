import pytest

from app.services.calculation import (
    CalculationError,
    MeasurementData,
    calculate_mass_to_volume,
    cuboid_dimensions_mm_for_volume,
)


def make_measurement(**overrides) -> MeasurementData:
    defaults = dict(
        strategy="density",
        density_kg_m3=1000.0,  # water
        bulk_density_kg_m3=None,
        confidence="verified",
        source="demo",
        notes=None,
    )
    defaults.update(overrides)
    return MeasurementData(**defaults)


def test_density_strategy_water_1kg_is_1_liter():
    result = calculate_mass_to_volume(1, "kg", make_measurement(density_kg_m3=1000.0))
    assert result.volume_l == pytest.approx(1.0)
    assert result.strategy_used == "density"


def test_bulk_density_strategy_rice():
    # Rice bulk density ~ 850 kg/m3 (demo value)
    measurement = make_measurement(strategy="bulk_density", density_kg_m3=None, bulk_density_kg_m3=850.0)
    result = calculate_mass_to_volume(1, "kg", measurement)
    assert result.volume_l == pytest.approx(1000 / 850)


def test_unit_normalization_lb_to_volume():
    measurement = make_measurement(density_kg_m3=1000.0)
    result = calculate_mass_to_volume(1, "lb", measurement)
    assert result.volume_l == pytest.approx(0.45359237)


def test_missing_density_raises():
    measurement = make_measurement(density_kg_m3=None)
    with pytest.raises(CalculationError):
        calculate_mass_to_volume(1, "kg", measurement)


def test_missing_bulk_density_raises():
    measurement = make_measurement(strategy="bulk_density", density_kg_m3=None, bulk_density_kg_m3=None)
    with pytest.raises(CalculationError):
        calculate_mass_to_volume(1, "kg", measurement)


def test_zero_amount_raises():
    with pytest.raises(CalculationError):
        calculate_mass_to_volume(0, "kg", make_measurement())


def test_negative_amount_raises():
    with pytest.raises(CalculationError):
        calculate_mass_to_volume(-5, "kg", make_measurement())


def test_unsupported_strategy_raises():
    measurement = make_measurement(strategy="unit_count")
    with pytest.raises(CalculationError):
        calculate_mass_to_volume(1, "kg", measurement)


def test_confidence_and_source_passed_through():
    measurement = make_measurement(confidence="demo", source="illustrative only")
    result = calculate_mass_to_volume(1, "kg", measurement)
    assert result.confidence == "demo"
    assert result.source == "illustrative only"


def test_cuboid_dimensions_reproduce_volume():
    volume_l = 1.2
    l, w, h = cuboid_dimensions_mm_for_volume(volume_l)
    computed_l = (l * w * h) / 1_000_000
    assert computed_l == pytest.approx(volume_l)


def test_cuboid_dimensions_zero_raises():
    with pytest.raises(CalculationError):
        cuboid_dimensions_mm_for_volume(0)
