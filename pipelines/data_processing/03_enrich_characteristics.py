"""
NASA Exoplanet Cluster Update Script
Adds planet characteristics to existing cluster files:
- Planet Radius Position
- Atmosphere Type  
- Principal Material
- %Toxicity
- % Habitability
- Distance To Earth
- Satellites (if it has satellites)
- Orbit Type
"""

import json
import os
import math
import random

print("🔄 NASA Exoplanet Cluster Update Script")
print("=" * 70)

CLUSTERS_DIR = 'nasa_data/clusters'

def calculate_radius_position(planet):
    """
    Calculate radius position category based on planetary radius.
    Categories: Super-Earth, Neptune-like, Jupiter-like, Sub-Earth
    """
    # Try to get radius in Earth radii
    radius_earth = planet.get('pl_rade')
    
    if radius_earth is None or (isinstance(radius_earth, float) and math.isnan(radius_earth)):
        # Try Jupiter radii conversion
        radius_jupiter = planet.get('pl_radj')
        if radius_jupiter and not (isinstance(radius_jupiter, float) and math.isnan(radius_jupiter)):
            radius_earth = radius_jupiter * 11.2  # Jupiter = ~11.2 Earth radii
    
    if radius_earth is None or (isinstance(radius_earth, float) and math.isnan(radius_earth)):
        return "Unknown"
    
    # Categorize by size
    if radius_earth < 1.0:
        return "Sub-Earth"
    elif radius_earth < 2.0:
        return "Super-Earth"
    elif radius_earth < 6.0:
        return "Neptune-like"
    else:
        return "Jupiter-like"


def infer_atmosphere_type(planet, radius_pos):
    """
    Infer atmosphere type based on planet characteristics.
    """
    # Get mass and radius
    mass_earth = planet.get('pl_masse')
    radius_earth = planet.get('pl_rade')
    
    # Get temperature if available
    temp = planet.get('pl_eqt')
    
    # Basic inference logic
    if radius_pos == "Jupiter-like":
        if temp and temp > 1000:
            return "Hydrogen-Helium (Hot)"
        return "Hydrogen-Helium"
    
    elif radius_pos == "Neptune-like":
        return "Hydrogen-Helium-Methane"
    
    elif radius_pos == "Super-Earth" or radius_pos == "Sub-Earth":
        if temp and temp > 500:
            return "Thin/None (Hot)"
        elif temp and temp < 200:
            return "Nitrogen-Oxygen (Cold)"
        else:
            # Could be rocky with atmosphere
            if mass_earth and mass_earth > 5:
                return "Thick CO2/N2"
            return "Thin N2/CO2"
    
    return "Unknown"


def infer_principal_material(planet, radius_pos):
    """
    Infer principal material based on planet characteristics.
    """
    density = planet.get('pl_dens')  # g/cm³
    
    if radius_pos == "Jupiter-like":
        return "Gaseous (H/He)"
    
    elif radius_pos == "Neptune-like":
        if density and density > 1.5:
            return "Ice Giant (H2O/CH4)"
        return "Gas (H/He/CH4)"
    
    elif radius_pos == "Super-Earth":
        if density:
            if density > 5.0:
                return "Rocky (Silicate/Iron)"
            elif density > 2.0:
                return "Rocky-Ice Mix"
            else:
                return "Gaseous/Ice"
        return "Rocky/Ice (estimated)"
    
    elif radius_pos == "Sub-Earth":
        return "Rocky (Silicate)"
    
    return "Unknown"


def calculate_toxicity(planet, atmosphere):
    """
    Calculate toxicity percentage (0-100%) for human habitability.
    Based on atmosphere, temperature, and radiation.
    """
    toxicity = 0
    
    # Atmosphere toxicity
    if "Unknown" in atmosphere:
        toxicity += 50  # Unknown = assume dangerous
    elif "Hydrogen-Helium" in atmosphere:
        toxicity += 80  # No oxygen, high pressure
    elif "Methane" in atmosphere:
        toxicity += 70  # Toxic gases
    elif "Hot" in atmosphere or "Thin/None" in atmosphere:
        toxicity += 85  # Extreme temperature or no atmosphere
    elif "CO2" in atmosphere:
        toxicity += 40  # CO2 dominant = needs processing
    elif "Nitrogen-Oxygen" in atmosphere:
        toxicity += 10  # Most Earth-like
    
    # Temperature factor
    temp = planet.get('pl_eqt')
    if temp:
        if temp > 350 or temp < 200:
            toxicity += 20  # Extreme temps
    
    # Ensure 0-100 range
    return min(100, max(0, toxicity))


def calculate_habitability(planet, radius_pos, atmosphere, toxicity):
    """
    Calculate habitability percentage (0-100%) for human colonization potential.
    """
    habitability = 100
    
    # Size factor
    if radius_pos == "Sub-Earth":
        habitability -= 20  # Too small, weak gravity
    elif radius_pos == "Jupiter-like":
        habitability -= 70  # Gas giant, no surface
    elif radius_pos == "Neptune-like":
        habitability -= 60  # Ice giant
    elif radius_pos == "Super-Earth":
        habitability -= 10  # A bit large but okay
    
    # Subtract toxicity
    habitability -= toxicity * 0.8
    
    # Temperature factor
    temp = planet.get('pl_eqt')
    if temp:
        # Ideal range: 250-300K (Earth is ~288K)
        if 250 <= temp <= 320:
            habitability += 10
        elif temp > 400 or temp < 180:
            habitability -= 30
    
    # Distance factor - closer = easier to reach
    distance_ly = get_distance_ly(planet)
    if distance_ly:
        if distance_ly < 50:
            habitability += 5
        elif distance_ly > 1000:
            habitability -= 10
    
    # Ensure 0-100 range
    return min(100, max(0, int(habitability)))


def get_distance_ly(planet):
    """Get distance in light years."""
    if 'sy_dist' in planet:
        dist_pc = planet['sy_dist']
        if dist_pc and not (isinstance(dist_pc, float) and math.isnan(dist_pc)):
            return round(dist_pc * 3.26156, 2)  # Parsecs to light years
    return None


def check_satellites(planet):
    """
    Check if planet has known satellites/moons.
    Note: NASA archive doesn't typically have moon data, so this is estimated.
    """
    # Large planets more likely to have moons
    radius_earth = planet.get('pl_rade')
    if radius_earth and radius_earth > 6:
        # Gas giants likely have moons
        return {"has_satellites": True, "count": "Unknown (likely multiple)", "type": "Estimated"}
    
    return {"has_satellites": False, "count": 0, "type": "Estimated"}


def determine_orbit_type(planet):
    """
    Determine orbit type based on orbital parameters.
    """
    # Get orbital eccentricity
    eccentricity = planet.get('pl_orbeccen')
    
    # Get semi-major axis (AU)
    semi_major = planet.get('pl_orbsmax')
    
    # Get orbital period (days)
    period = planet.get('pl_orbper')
    
    orbit_type = "Unknown"
    
    if eccentricity is not None:
        if eccentricity < 0.1:
            orbit_type = "Circular"
        elif eccentricity < 0.3:
            orbit_type = "Slightly Eccentric"
        elif eccentricity < 0.6:
            orbit_type = "Eccentric"
        else:
            orbit_type = "Highly Eccentric"
    
    # Add orbital zone info
    if semi_major:
        if semi_major < 0.1:
            orbit_type += " - Hot Zone"
        elif semi_major < 2.0:
            orbit_type += " - Habitable Zone"
        elif semi_major < 5.0:
            orbit_type += " - Temperate Zone"
        else:
            orbit_type += " - Cold Zone"
    
    return orbit_type


def get_icrs_coordinates(planet):
    """
    Get ICRS (International Celestial Reference System) coordinates.
    This is the standard celestial coordinate system used in astronomy.
    """
    ra_deg = planet.get('ra')  # Right Ascension in degrees
    dec_deg = planet.get('dec')  # Declination in degrees
    ra_str = planet.get('rastr')  # RA in HMS format
    dec_str = planet.get('decstr')  # Dec in DMS format
    distance_pc = planet.get('sy_dist')  # Distance in parsecs
    parallax_mas = planet.get('sy_plx')  # Parallax in milliarcseconds
    pmra = planet.get('sy_pmra')  # Proper motion in RA (mas/yr)
    pmdec = planet.get('sy_pmdec')  # Proper motion in Dec (mas/yr)
    
    icrs_data = {
        'right_ascension': {
            'degrees': round(ra_deg, 7) if ra_deg is not None else None,
            'hours_format': ra_str,
            'unit': 'degrees'
        },
        'declination': {
            'degrees': round(dec_deg, 7) if dec_deg is not None else None,
            'dms_format': dec_str,
            'unit': 'degrees'
        },
        'distance': {
            'parsecs': round(distance_pc, 4) if distance_pc and not (isinstance(distance_pc, float) and math.isnan(distance_pc)) else None,
            'light_years': round(distance_pc * 3.26156, 4) if distance_pc and not (isinstance(distance_pc, float) and math.isnan(distance_pc)) else None,
            'unit': 'parsecs/light-years'
        },
        'parallax': {
            'value': round(parallax_mas, 4) if parallax_mas and not (isinstance(parallax_mas, float) and math.isnan(parallax_mas)) else None,
            'unit': 'milliarcseconds (mas)'
        },
        'proper_motion': {
            'ra': round(pmra, 4) if pmra and not (isinstance(pmra, float) and math.isnan(pmra)) else None,
            'dec': round(pmdec, 4) if pmdec and not (isinstance(pmdec, float) and math.isnan(pmdec)) else None,
            'unit': 'milliarcseconds/year (mas/yr)'
        },
        'epoch': 'J2000.0',
        'reference_frame': 'ICRS (International Celestial Reference System)',
        'note': 'ICRS is the current standard celestial coordinate system'
    }
    
    return icrs_data


def get_3d_coordinates(planet):
    """
    Get 3D coordinates of the planet in space.
    Returns coordinates in parsecs from Earth (Sun).
    """
    # Check if x, y, z coordinates exist at root level
    x = planet.get('x')
    y = planet.get('y')
    z = planet.get('z')
    
    # If coordinates exist and are valid
    if x is not None and y is not None and z is not None:
        # These are normalized coordinates, multiply by distance to get actual position
        distance_pc = planet.get('sy_dist')
        if distance_pc and not (isinstance(distance_pc, float) and math.isnan(distance_pc)):
            return {
                'x_parsecs': round(x * distance_pc, 4),
                'y_parsecs': round(y * distance_pc, 4),
                'z_parsecs': round(z * distance_pc, 4),
                'x_light_years': round(x * distance_pc * 3.26156, 4),
                'y_light_years': round(y * distance_pc * 3.26156, 4),
                'z_light_years': round(z * distance_pc * 3.26156, 4),
                'system': 'Galactic (Earth/Sun centered)',
                'note': 'Coordinates are in a galactic coordinate system with Earth at origin'
            }
    
    # Try to calculate from ra, dec, distance if coordinates not available
    ra = planet.get('ra')
    dec = planet.get('dec')
    distance_pc = planet.get('sy_dist')
    
    if ra is not None and dec is not None and distance_pc and not (isinstance(distance_pc, float) and math.isnan(distance_pc)):
        # Convert RA/Dec (degrees) and distance to Cartesian coordinates
        ra_rad = math.radians(ra)
        dec_rad = math.radians(dec)
        
        # Standard astronomical conversion
        x = distance_pc * math.cos(dec_rad) * math.cos(ra_rad)
        y = distance_pc * math.cos(dec_rad) * math.sin(ra_rad)
        z = distance_pc * math.sin(dec_rad)
        
        return {
            'x_parsecs': round(x, 4),
            'y_parsecs': round(y, 4),
            'z_parsecs': round(z, 4),
            'x_light_years': round(x * 3.26156, 4),
            'y_light_years': round(y * 3.26156, 4),
            'z_light_years': round(z * 3.26156, 4),
            'system': 'Equatorial (Earth/Sun centered)',
            'note': 'Calculated from RA, Dec, and distance'
        }
    
    return {
        'x_parsecs': None,
        'y_parsecs': None,
        'z_parsecs': None,
        'x_light_years': None,
        'y_light_years': None,
        'z_light_years': None,
        'system': 'Unknown',
        'note': 'Coordinates unavailable'
    }


def add_characteristics_to_planet(planet):
    """
    Add all new characteristics to a planet object.
    Returns updated planet dict.
    """
    # Calculate new characteristics
    radius_position = calculate_radius_position(planet)
    atmosphere_type = infer_atmosphere_type(planet, radius_position)
    principal_material = infer_principal_material(planet, radius_position)
    toxicity = calculate_toxicity(planet, atmosphere_type)
    habitability = calculate_habitability(planet, radius_position, atmosphere_type, toxicity)
    distance_to_earth = get_distance_ly(planet)
    satellites = check_satellites(planet)
    orbit_type = determine_orbit_type(planet)
    coordinates = get_3d_coordinates(planet)
    icrs_coords = get_icrs_coordinates(planet)
    
    # Add new fields to planet
    planet['characteristics'] = {
        'radius_position': radius_position,
        'atmosphere_type': atmosphere_type,
        'principal_material': principal_material,
        'toxicity_percent': toxicity,
        'habitability_percent': habitability,
        'distance_to_earth_ly': distance_to_earth,
        'satellites': satellites,
        'orbit_type': orbit_type,
        'coordinates_3d': coordinates,
        'icrs_coordinates': icrs_coords
    }
    
    return planet


def update_cluster_file(filename):
    """
    Update a single cluster file with new characteristics.
    """
    filepath = os.path.join(CLUSTERS_DIR, filename)
    
    if not os.path.exists(filepath):
        print(f"  ⚠️  File not found: {filename}")
        return 0
    
    # Load cluster
    with open(filepath, 'r') as f:
        planets = json.load(f)
    
    # Update each planet
    updated_count = 0
    for planet in planets:
        add_characteristics_to_planet(planet)
        updated_count += 1
    
    # Save updated cluster
    with open(filepath, 'w') as f:
        json.dump(planets, f, indent=2)
    
    return updated_count


def main():
    """Main update process."""
    
    if not os.path.exists(CLUSTERS_DIR):
        print(f"❌ Error: Clusters directory not found: {CLUSTERS_DIR}")
        print("   Please run cluster_planets.py first to create the clusters.")
        return
    
    # Get all cluster files
    cluster_files = [f for f in os.listdir(CLUSTERS_DIR) if f.endswith('.json') and f != 'cluster_index.json']
    
    if not cluster_files:
        print(f"❌ Error: No cluster files found in {CLUSTERS_DIR}")
        return
    
    print(f"\n📂 Found {len(cluster_files)} cluster files to update")
    print(f"   Location: {CLUSTERS_DIR}\n")
    
    total_planets = 0
    
    # Update each cluster file
    for i, filename in enumerate(sorted(cluster_files), 1):
        print(f"  [{i:2d}/{len(cluster_files)}] Updating {filename:25s}...", end=' ')
        count = update_cluster_file(filename)
        total_planets += count
        print(f"✅ {count:5d} planets updated")
    
    # Update the cluster index to reflect changes
    index_path = os.path.join(CLUSTERS_DIR, 'cluster_index.json')
    if os.path.exists(index_path):
        with open(index_path, 'r') as f:
            index = json.load(f)
        
        # Add update info
        index['last_updated'] = "2026-01-31"
        index['characteristics_added'] = [
            "radius_position",
            "atmosphere_type",
            "principal_material",
            "toxicity_percent",
            "habitability_percent",
            "distance_to_earth_ly",
            "satellites",
            "orbit_type",
            "coordinates_3d",
            "icrs_coordinates"
        ]
        
        with open(index_path, 'w') as f:
            json.dump(index, f, indent=2)
        
        print(f"\n  ✅ cluster_index.json updated with new metadata")
    
    # Print summary
    print("\n" + "=" * 70)
    print("✨ UPDATE COMPLETE!")
    print("=" * 70)
    print(f"\n📊 Summary:")
    print(f"   • Total cluster files updated: {len(cluster_files)}")
    print(f"   • Total planets updated: {total_planets}")
    print(f"\n🎯 New characteristics added to each planet:")
    print(f"   • Radius Position (Sub-Earth, Super-Earth, Neptune-like, Jupiter-like)")
    print(f"   • Atmosphere Type (inferred from physical properties)")
    print(f"   • Principal Material (Rocky, Gaseous, Ice, etc.)")
    print(f"   • Toxicity % (0-100, for human habitability)")
    print(f"   • Habitability % (0-100, colonization potential)")
    print(f"   • Distance to Earth (in light years)")
    print(f"   • Satellites (estimated moon presence)")
    print(f"   • Orbit Type (eccentricity and zone)")
    print(f"   • 3D Coordinates (x, y, z in parsecs and light-years)")
    print(f"   • ICRS Coordinates (RA, Dec, proper motion, parallax)")
    print(f"\n📁 All original data preserved in each planet object")
    print(f"💡 Access new data via: planet['characteristics']['field_name']")
    print()


if __name__ == "__main__":
    main()
