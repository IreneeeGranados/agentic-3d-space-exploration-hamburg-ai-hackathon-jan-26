"""
Example: 3D Visualization and Distance Calculations with Updated NASA Data
This script demonstrates how to use the new 3D coordinates in the cluster data.
"""

import json
import math

print("🌌 3D Space Visualization Example")
print("=" * 70)

# Load a cluster
print("\n📂 Loading nearby_quad1 cluster...")
with open('nasa_data/clusters/nearby_quad1.json', 'r') as f:
    planets = json.load(f)

print(f"✅ Loaded {len(planets)} planets\n")

# Function to calculate distance between two points in 3D space
def calculate_distance_3d(coords1, coords2):
    """Calculate Euclidean distance between two 3D coordinates."""
    dx = coords1['x_light_years'] - coords2['x_light_years']
    dy = coords1['y_light_years'] - coords2['y_light_years']
    dz = coords1['z_light_years'] - coords2['z_light_years']
    return math.sqrt(dx**2 + dy**2 + dz**2)

# Function to calculate distance from Earth
def distance_from_earth(coords):
    """Calculate distance from Earth (origin)."""
    return math.sqrt(
        coords['x_light_years']**2 + 
        coords['y_light_years']**2 + 
        coords['z_light_years']**2
    )

# Example 1: Show planets with their 3D coordinates
print("🌍 Example 1: First 5 planets with 3D coordinates\n")
for i, planet in enumerate(planets[:5], 1):
    coords = planet['characteristics']['coordinates_3d']
    distance = distance_from_earth(coords)
    
    print(f"{i}. {planet['pl_name']}")
    print(f"   Position (ly): ({coords['x_light_years']:.2f}, {coords['y_light_years']:.2f}, {coords['z_light_years']:.2f})")
    print(f"   Distance from Earth: {distance:.2f} ly")
    print(f"   Habitability: {planet['characteristics']['habitability_percent']}%")
    print()

# Example 2: Find closest neighbors to a planet
print("\n🔍 Example 2: Finding closest neighbors to a planet\n")
target_planet = planets[0]
target_coords = target_planet['characteristics']['coordinates_3d']

print(f"Target Planet: {target_planet['pl_name']}")
print(f"Position: ({target_coords['x_light_years']:.2f}, {target_coords['y_light_years']:.2f}, {target_coords['z_light_years']:.2f}) ly\n")

# Calculate distances to all other planets
neighbors = []
for planet in planets[1:]:
    if planet['characteristics']['coordinates_3d']['x_light_years'] is not None:
        distance = calculate_distance_3d(
            target_coords, 
            planet['characteristics']['coordinates_3d']
        )
        neighbors.append({
            'name': planet['pl_name'],
            'distance': distance,
            'habitability': planet['characteristics']['habitability_percent']
        })

# Sort by distance
neighbors.sort(key=lambda x: x['distance'])

print("Top 5 Nearest Neighbors:")
for i, neighbor in enumerate(neighbors[:5], 1):
    print(f"  {i}. {neighbor['name']}")
    print(f"     Distance: {neighbor['distance']:.2f} ly")
    print(f"     Habitability: {neighbor['habitability']}%")

# Example 3: Find most habitable planets within a certain radius
print("\n\n🏠 Example 3: Most habitable planets within 50 light-years\n")

habitable_nearby = []
for planet in planets:
    coords = planet['characteristics']['coordinates_3d']
    if coords['x_light_years'] is not None:
        dist = distance_from_earth(coords)
        if dist <= 50:
            habitable_nearby.append({
                'name': planet['pl_name'],
                'distance': dist,
                'habitability': planet['characteristics']['habitability_percent'],
                'toxicity': planet['characteristics']['toxicity_percent'],
                'type': planet['characteristics']['radius_position']
            })

# Sort by habitability
habitable_nearby.sort(key=lambda x: x['habitability'], reverse=True)

print(f"Found {len(habitable_nearby)} planets within 50 light-years")
print("\nTop 5 Most Habitable:")
for i, planet in enumerate(habitable_nearby[:5], 1):
    print(f"  {i}. {planet['name']}")
    print(f"     Distance: {planet['distance']:.2f} ly")
    print(f"     Habitability: {planet['habitability']}%")
    print(f"     Toxicity: {planet['toxicity']}%")
    print(f"     Type: {planet['type']}")

# Example 4: Calculate bounding box of all planets
print("\n\n📦 Example 4: Spatial distribution analysis\n")

min_x = min_y = min_z = float('inf')
max_x = max_y = max_z = float('-inf')

for planet in planets:
    coords = planet['characteristics']['coordinates_3d']
    if coords['x_light_years'] is not None:
        min_x = min(min_x, coords['x_light_years'])
        max_x = max(max_x, coords['x_light_years'])
        min_y = min(min_y, coords['y_light_years'])
        max_y = max(max_y, coords['y_light_years'])
        min_z = min(min_z, coords['z_light_years'])
        max_z = max(max_z, coords['z_light_years'])

print("Bounding Box (Light-Years):")
print(f"  X range: {min_x:.2f} to {max_x:.2f} (span: {max_x - min_x:.2f} ly)")
print(f"  Y range: {min_y:.2f} to {max_y:.2f} (span: {max_y - min_y:.2f} ly)")
print(f"  Z range: {min_z:.2f} to {max_z:.2f} (span: {max_z - min_z:.2f} ly)")

# Calculate average distance
avg_distance = sum(distance_from_earth(p['characteristics']['coordinates_3d']) 
                   for p in planets 
                   if p['characteristics']['coordinates_3d']['x_light_years'] is not None) / len(planets)

print(f"\nAverage distance from Earth: {avg_distance:.2f} ly")

print("\n" + "=" * 70)
print("✨ 3D Coordinate Features:")
print("  • Calculate distances between any two planets")
print("  • Find nearest neighbors for route planning")
print("  • Filter by spatial regions")
print("  • Create 3D visualizations")
print("  • Analyze galactic distribution")
print("  • Plan multi-stop missions")
print("=" * 70)
