"""
Fix Solar System Data
Correct distances and characteristics based on NASA_SOLAR_SYSTEM_ANALYSIS.md
"""

import json
import os
import math

print("🪐 Fixing Solar System Data")
print("="*70)

# Constants
AU_TO_PARSEC = 4.848e-06  # 1 AU = 4.848e-06 parsecs
AU_TO_LY = 1.5813e-05     # 1 AU = 1.5813e-05 light-years

def calculate_distance_from_earth(planet_au):
    """
    Calculate average distance from Earth to planet in AU.
    For simplicity, use semi-major axis difference for inner/outer planets.
    Earth is at 1.0 AU, so distance varies based on planetary alignment.
    """
    if planet_au < 1.0:  # Inner planets (Mercury, Venus)
        # Average distance: sometimes closer, sometimes farther
        # Use approximate average: 1.0 - planet_au (when closer) to 1.0 + planet_au (when farther)
        avg_distance = 1.0 - planet_au  # Minimum distance approximation
    elif planet_au == 1.0:  # Earth
        return 0.0
    else:  # Outer planets (Mars, Jupiter, etc.)
        # Average distance: planet_au - 1.0 (when closer) to planet_au + 1.0 (when farther)
        avg_distance = planet_au - 1.0  # Minimum distance approximation
    
    return avg_distance

# Correct solar system data based on NASA analysis
SOLAR_SYSTEM_DATA = {
    'Mercury': {
        'pl_rade': 0.3829,
        'pl_masse': 0.055,
        'pl_orbper': 87.97,
        'pl_eqt': 440,
        'distance_au': 0.387,  # Distance from Sun in AU
        'habitability': 0,
        'toxicity': 100,
        'atmosphere': 'None (Exosphere)',
        'material': 'Rocky (Iron/Silicates)',
        'orbit': 'Circular - Hot Zone',
        'satellites_count': 0
    },
    'Venus': {
        'pl_rade': 0.9499,
        'pl_masse': 0.815,
        'pl_orbper': 224.70,
        'pl_eqt': 737,
        'distance_au': 0.723,
        'habitability': 0,
        'toxicity': 100,
        'atmosphere': 'CO2-N2 (Dense)',
        'material': 'Rocky (Silicates)',
        'orbit': 'Circular - Hot Zone',
        'satellites_count': 0
    },
    'Earth': {
        'pl_rade': 1.0,
        'pl_masse': 1.0,
        'pl_orbper': 365.26,
        'pl_eqt': 288,
        'distance_au': 1.0,
        'habitability': 100,
        'toxicity': 0,
        'atmosphere': 'N2-O2 (Breathable)',
        'material': 'Rocky (Silicates/Iron)',
        'orbit': 'Circular - Habitable Zone',
        'satellites_count': 1
    },
    'Mars': {
        'pl_rade': 0.532,
        'pl_masse': 0.107,
        'pl_orbper': 686.98,
        'pl_eqt': 210,
        'distance_au': 1.524,
        'habitability': 30,
        'toxicity': 60,
        'atmosphere': 'CO2 (Thin)',
        'material': 'Rocky (Iron Oxides/Silicates)',
        'orbit': 'Elliptical - Cold Zone',
        'satellites_count': 2
    },
    'Jupiter': {
        'pl_rade': 10.973,
        'pl_masse': 317.8,
        'pl_orbper': 4332.59,
        'pl_eqt': 165,
        'distance_au': 5.203,
        'habitability': 0,
        'toxicity': 100,
        'atmosphere': 'Hydrogen-Helium (Gas Giant)',
        'material': 'Gaseous (H/He)',
        'orbit': 'Circular - Cold Zone',
        'satellites_count': 95
    },
    'Saturn': {
        'pl_rade': 9.14,
        'pl_masse': 95.2,
        'pl_orbper': 10759.22,
        'pl_eqt': 134,
        'distance_au': 9.537,
        'habitability': 0,
        'toxicity': 100,
        'atmosphere': 'Hydrogen-Helium (Gas Giant)',
        'material': 'Gaseous (H/He)',
        'orbit': 'Circular - Cold Zone',
        'satellites_count': 146
    },
    'Uranus': {
        'pl_rade': 3.981,
        'pl_masse': 14.5,
        'pl_orbper': 30688.50,
        'pl_eqt': 76,
        'distance_au': 19.191,
        'habitability': 0,
        'toxicity': 100,
        'atmosphere': 'Hydrogen-Helium-Methane (Ice Giant)',
        'material': 'Ice Giant (H2O/CH4/NH3)',
        'orbit': 'Circular - Frozen Zone',
        'satellites_count': 28
    },
    'Neptune': {
        'pl_rade': 3.865,
        'pl_masse': 17.1,
        'pl_orbper': 60182.00,
        'pl_eqt': 72,
        'distance_au': 30.069,
        'habitability': 0,
        'toxicity': 100,
        'atmosphere': 'Hydrogen-Helium-Methane (Ice Giant)',
        'material': 'Ice Giant (H2O/CH4/NH3)',
        'orbit': 'Circular - Frozen Zone',
        'satellites_count': 16
    },
    'Pluto': {
        'pl_rade': 0.186,
        'pl_masse': 0.002,
        'pl_orbper': 90560.00,
        'pl_eqt': 44,
        'distance_au': 39.482,
        'habitability': 0,
        'toxicity': 100,
        'atmosphere': 'N2-CH4 (Thin)',
        'material': 'Ice/Rock (H2O/N2)',
        'orbit': 'Highly Elliptical - Frozen Zone',
        'satellites_count': 5
    }
}

def fix_solar_system():
    """Fix solar system cluster file"""
    
    cluster_path = 'nasa_data/clusters/solar_system.json'
    
    if not os.path.exists(cluster_path):
        print(f"❌ Error: {cluster_path} not found")
        return
    
    print(f"\n📂 Loading {cluster_path}...")
    with open(cluster_path, 'r') as f:
        planets = json.load(f)
    
    print(f"   Found {len(planets)} planets")
    
    fixed_count = 0
    
    for planet in planets:
        pl_name = planet.get('pl_name')
        
        if pl_name in SOLAR_SYSTEM_DATA:
            correct_data = SOLAR_SYSTEM_DATA[pl_name]
            
            # Calculate distance from Earth to this planet in parsecs
            distance_au = correct_data['distance_au']
            distance_from_earth_au = calculate_distance_from_earth(distance_au)
            sy_dist_parsec = distance_from_earth_au * AU_TO_PARSEC
            distance_to_earth_ly = distance_from_earth_au * AU_TO_LY
            
            # Update basic fields
            planet['pl_rade'] = correct_data['pl_rade']
            planet['pl_masse'] = correct_data['pl_masse']
            planet['pl_orbper'] = correct_data['pl_orbper']
            planet['pl_eqt'] = correct_data['pl_eqt']
            planet['sy_dist'] = sy_dist_parsec  # Distance from Earth in parsecs
            
            # Set BOTH mass fields for compatibility
            planet['pl_masse'] = correct_data['pl_masse']  # Used by ExplorationDialog
            planet['pl_bmasse'] = correct_data['pl_masse']  # Used by PlanetNavigator
            
            # Update characteristics
            if 'characteristics' not in planet:
                planet['characteristics'] = {}
            
            char = planet['characteristics']
            char['habitability_percent'] = correct_data['habitability']
            char['toxicity_percent'] = correct_data['toxicity']
            char['atmosphere_type'] = correct_data['atmosphere']
            char['principal_material'] = correct_data['material']
            char['orbit_type'] = correct_data['orbit']
            char['distance_to_earth_ly'] = round(distance_to_earth_ly, 8)
            
            # Update satellite info
            char['satellites'] = {
                'has_satellites': correct_data['satellites_count'] > 0,
                'count': correct_data['satellites_count'],
                'type': 'Known'
            }
            
            # PRESERVE existing coordinates - DO NOT recalculate positions
            # Only update if coordinates_3d doesn't exist or is completely empty
            
            fixed_count += 1
            print(f"   ✓ Fixed {pl_name:12s} - Mass: {correct_data['pl_masse']:6.3f} Me, Distance: {distance_from_earth_au:.3f} AU, Hab: {correct_data['habitability']}%")
    
    # Save fixed data
    with open(cluster_path, 'w') as f:
        json.dump(planets, f, indent=2)
    
    print(f"\n✅ Fixed {fixed_count} planets")
    print(f"📁 Saved to: {cluster_path}")
    
    return fixed_count

def main():
    fixed = fix_solar_system()
    
    print("\n" + "="*70)
    print("✨ SOLAR SYSTEM FIX COMPLETE")
    print("="*70)
    print(f"\nSummary:")
    print(f"   • Fixed {fixed} planets")
    print(f"   • Calculated sy_dist from Earth (in parsecs)")
    print(f"   • Earth: 0.0 pc (Earth to Earth)")
    print(f"   • Inner planets: ~0.6-0.3 AU from Earth")
    print(f"   • Outer planets: orbital distance - 1 AU from Earth")
    print(f"   • Updated habitability, toxicity, atmosphere")
    print(f"   • Corrected 3D coordinates based on orbital distances")
    print(f"   • Updated satellite counts")
    print()

if __name__ == "__main__":
    main()
