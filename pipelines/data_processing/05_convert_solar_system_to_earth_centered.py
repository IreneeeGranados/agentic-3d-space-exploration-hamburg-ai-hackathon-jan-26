
#!/usr/bin/env python3
"""
Convert Solar System coordinates from Sun-centered to Earth-centered.
This makes Solar System planets use the same coordinate system as exoplanets.
"""

import json
import os
import math

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))
NASA_DATA_DIR = os.path.join(PROJECT_ROOT, 'nasa_data')
SOLAR_SYSTEM_FILE = os.path.join(NASA_DATA_DIR, 'solar_system.json')
CLUSTERS_DIR = os.path.join(NASA_DATA_DIR, 'clusters')
SOLAR_SYSTEM_CLUSTER_FILE = os.path.join(CLUSTERS_DIR, 'solar_system.json')

# Constants
AU_TO_PARSECS = 0.000004848  # 1 AU in parsecs
PARSECS_TO_LY = 3.26156  # parsecs to light-years conversion


def convert_to_earth_centered(planet, earth_position):
    """
    Convert a planet's heliocentric position to Earth-centered position.

    Args:
        planet: Planet dict with 'position' (x, y, z in AU from Sun)
        earth_position: Earth's position dict (x, y, z in AU from Sun)

    Returns:
        Updated planet dict with Earth-centered coordinates
    """
    # Get heliocentric position in AU
    sun_x = planet['position']['x']
    sun_y = planet['position']['y']
    sun_z = planet['position']['z']

    # Convert to Earth-centered (subtract Earth's position)
    earth_x = sun_x - earth_position['x']
    earth_y = sun_y - earth_position['y']
    earth_z = sun_z - earth_position['z']

    # Convert to parsecs
    x_pc = earth_x * AU_TO_PARSECS
    y_pc = earth_y * AU_TO_PARSECS
    z_pc = earth_z * AU_TO_PARSECS

    # Convert to light-years
    x_ly = x_pc * PARSECS_TO_LY
    y_ly = y_pc * PARSECS_TO_LY
    z_ly = z_pc * PARSECS_TO_LY

    # Calculate distance from Earth
    distance_ly = math.sqrt(x_ly**2 + y_ly**2 + z_ly**2)

    # Update characteristics
    if 'characteristics' not in planet:
        planet['characteristics'] = {}

    planet['characteristics']['coordinates_3d'] = {
        'x_parsecs': round(x_pc, 10),
        'y_parsecs': round(y_pc, 10),
        'z_parsecs': round(z_pc, 10),
        'x_light_years': round(x_ly, 10),
        'y_light_years': round(y_ly, 10),
        'z_light_years': round(z_ly, 10),
        'system': 'Galactic (Earth/Sun centered)',
        'note': 'Solar System coordinates converted to Earth-centered reference frame'
    }

    planet['characteristics']['distance_to_earth_ly'] = round(distance_ly, 10)

    # Update ICRS coordinates to reflect Earth-centered system
    if 'icrs_coordinates' not in planet['characteristics']:
        planet['characteristics']['icrs_coordinates'] = {}

    planet['characteristics']['icrs_coordinates'].update({
        'distance': {
            'parsecs': round(math.sqrt(x_pc**2 + y_pc**2 + z_pc**2), 10),
            'light_years': round(distance_ly, 10),
            'unit': 'parsecs/light-years'
        },
        'epoch': 'J2000.0',
        'reference_frame': 'Geocentric (Earth centered)',
        'note': 'Solar System coordinates in Earth-centered reference frame'
    })

    return planet


def convert_solar_system():
    """
    Convert Solar System from Sun-centered to Earth-centered coordinates.
    """
    print("=" * 70)
    print("CONVERTING SOLAR SYSTEM TO EARTH-CENTERED COORDINATES")
    print("=" * 70)

    # Load solar system data
    print(f"\n📂 Loading: {SOLAR_SYSTEM_FILE}")
    with open(SOLAR_SYSTEM_FILE, 'r') as f:
        planets = json.load(f)

    print(f"✓ Loaded {len(planets)} planets")

    # Find Earth's position (will be our origin)
    earth = next((p for p in planets if p['pl_name'] == 'Earth'), None)
    if not earth:
        raise ValueError("Earth not found in solar system data!")

    earth_position = earth['position']
    print(f"\n🌍 Earth position (heliocentric): x={earth_position['x']}, y={earth_position['y']}, z={earth_position['z']} AU")

    # Convert all planets
    print("\n🔄 Converting to Earth-centered coordinates...")
    for planet in planets:
        planet_name = planet['pl_name']
        old_pos = planet['position'].copy()

        planet = convert_to_earth_centered(planet, earth_position)
        new_coords = planet['characteristics']['coordinates_3d']

        print(f"  • {planet_name:12s}: ({old_pos['x']:8.3f}, {old_pos['y']:8.3f}, {old_pos['z']:8.3f}) AU (Sun) → "
              f"({new_coords['x_light_years']:12.9f}, {new_coords['y_light_years']:12.9f}, {new_coords['z_light_years']:12.9f}) ly (Earth)")

    # Save updated data
    print(f"\n💾 Saving to: {SOLAR_SYSTEM_FILE}")
    with open(SOLAR_SYSTEM_FILE, 'w') as f:
        json.dump(planets, f, indent=2)

    print(f"✓ Saved main solar system file")

    # Update cluster file
    if os.path.exists(SOLAR_SYSTEM_CLUSTER_FILE):
        print(f"\n💾 Updating cluster file: {SOLAR_SYSTEM_CLUSTER_FILE}")
        with open(SOLAR_SYSTEM_CLUSTER_FILE, 'w') as f:
            json.dump(planets, f, indent=2)
        print(f"✓ Saved cluster file")

    print("\n" + "=" * 70)
    print("✅ CONVERSION COMPLETE!")
    print("=" * 70)
    print("\n📋 Summary:")
    print(f"  • Coordinate system: Galactic (Earth/Sun centered)")
    print(f"  • Reference point: Earth at (0, 0, 0)")
    print(f"  • Units: light-years and parsecs")
    print(f"  • Planets converted: {len(planets)}")
    print("\n🎯 Solar System now uses same coordinate system as exoplanets!")

    # Show verification
    print("\n🔍 Verification:")
    earth = next((p for p in planets if p['pl_name'] == 'Earth'), None)
    earth_coords = earth['characteristics']['coordinates_3d']
    print(f"  Earth position: ({earth_coords['x_light_years']}, {earth_coords['y_light_years']}, {earth_coords['z_light_years']}) ly")
    print(f"  Earth distance: {earth['characteristics']['distance_to_earth_ly']} ly ✓")


if __name__ == '__main__':
    convert_solar_system()
