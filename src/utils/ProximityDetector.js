/**
 * ProximityDetector - Detects closest planet to spacecraft
 * Handles scaled coordinate system (x10000)
 */
import * as THREE from 'three';

export class ProximityDetector {
    constructor(planetDataService, exoplanetField) {
        this.dataService = planetDataService;
        this.exoplanetField = exoplanetField;
        this.lastClosestPlanet = null;
        this.updateThrottle = 500; // ms between updates
        this.lastUpdateTime = 0;
        this.searchRadius = 5000000; // Search within 5M units (scaled)
    }

    /**
     * Get the closest planet to a given position
     * @param {THREE.Vector3} position - Spacecraft position
     * @returns {Object|null} - { planet, distance, worldPosition, mesh }
     */
    getClosestPlanet(position) {
        const now = Date.now();
        
        // Throttle updates
        if (now - this.lastUpdateTime < this.updateThrottle) {
            return this.lastClosestPlanet;
        }
        
        this.lastUpdateTime = now;

        const allPlanets = this.dataService.getAllPlanets();
        
        if (!allPlanets || allPlanets.length === 0) {
            return null;
        }

        let closestPlanet = null;
        let closestDistance = Infinity;
        let closestWorldPos = null;
        let closestMesh = null;

        const globalScale = 10000;

        for (const planet of allPlanets) {
            // Get planet position in world coordinates
            let planetWorldPos;
            
            // TRY BOTH COORDINATE SYSTEMS with logging
            const isSolarPlanet = planet.hostname === 'Sun';
            
            if (planet.characteristics?.coordinates_3d) {
                // NEW UNIFIED SYSTEM: All enriched planets have this
                const coords = planet.characteristics.coordinates_3d;
                planetWorldPos = new THREE.Vector3(
                    coords.x_light_years * 10 * globalScale,
                    coords.y_light_years * 10 * globalScale,
                    coords.z_light_years * 10 * globalScale
                );
                console.log(`📍 ${planet.pl_name} using coordinates_3d:`, coords.x_light_years, coords.y_light_years, coords.z_light_years);
            } else if (isSolarPlanet && planet.position) {
                // FALLBACK FOR SOLAR SYSTEM: Old position system
                planetWorldPos = new THREE.Vector3(
                    planet.position.x * 10 * globalScale,
                    planet.position.y * 10 * globalScale,
                    planet.position.z * 10 * globalScale
                );
                console.log(`📍 ${planet.pl_name} using position (fallback):`, planet.position.x, planet.position.y, planet.position.z);
            } else {
                // No valid coordinates at all
                console.warn('⚠️ Planet missing both coordinates_3d AND position:', planet.pl_name);
                continue;
            }

            const distance = position.distanceTo(planetWorldPos);

            // Only consider planets within search radius
            if (distance < this.searchRadius && distance < closestDistance) {
                closestDistance = distance;
                closestPlanet = planet;
                closestWorldPos = planetWorldPos;
                
                // Reset mesh for each new closest planet
                let foundMesh = null;
                
                // Try to find the mesh for this planet in the exoplanet field
                if (this.exoplanetField && this.exoplanetField.meshGroup) {
                    // Search through ALL meshes in the group (includes Solar System)
                    this.exoplanetField.meshGroup.traverse((child) => {
                        if (child.isMesh && child.userData && child.userData.planetData) {
                            const childPlanetName = child.userData.planetData.pl_name;
                            if (childPlanetName === planet.pl_name) {
                                foundMesh = child;
                            }
                        }
                    });
                    
                    if (foundMesh) {
                        console.log(`✅ Found mesh for ${planet.pl_name}`);
                    } else {
                        console.warn(`❌ Mesh NOT found for ${planet.pl_name}`);
                    }
                }
                
                closestMesh = foundMesh;
            }
        }

        if (closestPlanet) {
            console.log(`🎯 Closest planet: ${closestPlanet.pl_name} (${(closestDistance / 10000).toFixed(2)} scaled units) - hasMesh: ${!!closestMesh}`);
            
            this.lastClosestPlanet = {
                planet: closestPlanet,
                distance: closestDistance,
                worldPosition: closestWorldPos,
                mesh: closestMesh
            };
            
            return this.lastClosestPlanet;
        }

        this.lastClosestPlanet = null;
        return null;
    }

    /**
     * Check if closest planet has changed
     */
    hasClosestPlanetChanged(currentClosest) {
        if (!this.lastClosestPlanet && !currentClosest) return false;
        if (!this.lastClosestPlanet || !currentClosest) return true;
        
        return this.lastClosestPlanet.planet.pl_name !== currentClosest.planet.pl_name;
    }

    /**
     * Reset state
     */
    reset() {
        this.lastClosestPlanet = null;
    }
}
