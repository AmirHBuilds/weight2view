"""
Seed reference object data.

`length_mm/width_mm/height_mm` are a simple bounding-box approximation used
for the procedural 3D shape - not a precision measurement. `volume_l` is set
directly to a realistic real-world figure (it does not always exactly equal
length*width*height, e.g. for cylindrical or irregular objects like a
bicycle) so volume comparisons stay meaningful even though the MVP's 3D
rendering is a simplified/stylized shape.

`shape` selects which procedural model renders this reference (Phase 2.4).
Stylized shapes (phone, bottle, mug, fridge, shoe, backpack, car,
motorcycle, bicycle, washing_machine) map to dedicated model components on
the frontend; anything else falls back to a generic box/rounded_box/cylinder.
"""

REFERENCES = [
    {"name": "Cupped Hand", "category": "human", "length_mm": 100, "width_mm": 80, "height_mm": 50, "volume_l": 0.3, "shape": "rounded_box", "familiarity_score": 7},
    {"name": "Fist", "category": "human", "length_mm": 90, "width_mm": 90, "height_mm": 90, "volume_l": 0.5, "shape": "rounded_box", "familiarity_score": 8},
    {"name": "Foot", "category": "human", "length_mm": 260, "width_mm": 100, "height_mm": 90, "volume_l": 1.2, "shape": "rounded_box", "familiarity_score": 5},
    {"name": "Smartphone", "category": "everyday", "length_mm": 160, "width_mm": 76, "height_mm": 8, "volume_l": 0.095, "shape": "phone", "familiarity_score": 10},
    {"name": "Coffee Mug", "category": "everyday", "length_mm": 95, "width_mm": 95, "height_mm": 110, "volume_l": 0.35, "shape": "mug", "familiarity_score": 9},
    {"name": "Water Bottle", "category": "everyday", "length_mm": 75, "width_mm": 75, "height_mm": 220, "volume_l": 0.75, "shape": "bottle", "familiarity_score": 10},
    {"name": "Shoe", "category": "everyday", "length_mm": 300, "width_mm": 110, "height_mm": 120, "volume_l": 3.5, "shape": "shoe", "familiarity_score": 8},
    {"name": "Basketball", "category": "everyday", "length_mm": 240, "width_mm": 240, "height_mm": 240, "volume_l": 7.5, "shape": "rounded_box", "familiarity_score": 6},
    {"name": "Shoebox", "category": "everyday", "length_mm": 330, "width_mm": 200, "height_mm": 150, "volume_l": 9.0, "shape": "box", "familiarity_score": 6},
    {"name": "Backpack", "category": "everyday", "length_mm": 480, "width_mm": 300, "height_mm": 150, "volume_l": 20.0, "shape": "backpack", "familiarity_score": 8},
    {"name": "Suitcase (carry-on)", "category": "everyday", "length_mm": 550, "width_mm": 350, "height_mm": 230, "volume_l": 40.0, "shape": "box", "familiarity_score": 7},
    {"name": "Microwave Oven", "category": "everyday", "length_mm": 480, "width_mm": 380, "height_mm": 300, "volume_l": 42.0, "shape": "box", "familiarity_score": 7},
    {"name": "Bathtub", "category": "large", "length_mm": 1500, "width_mm": 700, "height_mm": 400, "volume_l": 150.0, "shape": "box", "familiarity_score": 7},
    {"name": "Oil Barrel (55 gal)", "category": "large", "length_mm": 590, "width_mm": 590, "height_mm": 880, "volume_l": 208.0, "shape": "cylinder", "familiarity_score": 5},
    {"name": "Washing Machine", "category": "large", "length_mm": 600, "width_mm": 600, "height_mm": 850, "volume_l": 150.0, "shape": "washing_machine", "familiarity_score": 8},
    {"name": "Bicycle", "category": "large", "length_mm": 1750, "width_mm": 600, "height_mm": 300, "volume_l": 300.0, "shape": "bicycle", "familiarity_score": 6},
    {"name": "Refrigerator", "category": "large", "length_mm": 700, "width_mm": 700, "height_mm": 1800, "volume_l": 500.0, "shape": "fridge", "familiarity_score": 9},
    {"name": "Motorcycle", "category": "large", "length_mm": 2100, "width_mm": 800, "height_mm": 1200, "volume_l": 1200.0, "shape": "motorcycle", "familiarity_score": 5},
    {"name": "Car (compact)", "category": "large", "length_mm": 4500, "width_mm": 1800, "height_mm": 1500, "volume_l": 9000.0, "shape": "car", "familiarity_score": 9},
]

