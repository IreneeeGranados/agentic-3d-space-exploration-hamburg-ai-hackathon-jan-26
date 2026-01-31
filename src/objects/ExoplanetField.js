import * as THREE from 'three';
import {
    generateRockyTexture,
    generateGasGiantTexture,
    generateIceGiantTexture,
    generateNormalMap,
    getColorByComposition
} from '../utils/textureGenerator.js';

/**
 * ExoplanetField - Renders thousands of NASA exoplanets as realistic 3D spheres
 * Uses instanced rendering for performance with astronomically accurate sizes
 */
export class ExoplanetField {
    constructor(planetDataService) {
        this.dataService = planetDataService;
        this.meshGroup = new THREE.Group();
        this.meshGroup.name = 'NASA_Exoplanets_3D';
        this.planets = [];
        this.loaded = false;
        this.renderedPlanets = new Set(); // Track rendered planet IDs

        // Visual settings
        this.sceneScale = 10; // 1 light year = 10 scene units
        this.earthRadiusScale = 0.5; // Earth = 0.5 scene units (for visibility)

        // For compatibility with old code
        this.mesh = this.meshGroup;
    }

    /**
     * Load and render NASA exoplanets incrementally
     */
    async load() {
        if (this.loaded) return;

        console.log('Loading NASA exoplanets incrementally...');

        // 1. Load nearby planets first for quick display
        const nearby = await this.dataService.loadNearbyFirst();
        this.planets = nearby;
        this.create3DMeshes(nearby);
        this.loaded = true;

        // 2. Load remaining clusters one by one in background to prevent spikes
        const clusterIndex = await this.dataService.initialize();
        const otherClusters = Object.keys(clusterIndex.clusters)
            .filter(name => name !== 'no_position' && !name.startsWith('nearby'));

        // Load in background
        this.loadClustersProgressively(otherClusters);
    }

    /**
     * Load clusters one by one and update visualization
     */
    async loadClustersProgressively(clusterNames) {
        for (const name of clusterNames) {
            const clusterPlanets = await this.dataService.loadCluster(name);
            if (clusterPlanets && clusterPlanets.length > 0) {
                // Add new planets to local collection
                this.planets.push(...clusterPlanets);
                // Render only the new batch
                this.create3DMeshes(clusterPlanets);

                // Allow some breathing room between clusters
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        console.log('✨ All exoplanet clusters loaded and rendered.');
    }

    /**
     * Create 3D sphere meshes for a batch of planets
     */
    async create3DMeshes(planetBatch = this.planets) {
        if (!planetBatch || planetBatch.length === 0) return;

        // Shared geometries
        const lowPolyGeom = new THREE.SphereGeometry(1, 6, 6); // Even lower for Tier 3
        const midPolyGeom = new THREE.SphereGeometry(1, 12, 12);
        const highPolyGeom = new THREE.SphereGeometry(1, 24, 24);

        const distantMaterials = new Map();
        const batchSize = 30; // Smaller batches for smoother execution
        let index = 0;

        const processBatch = () => {
            const end = Math.min(index + batchSize, planetBatch.length);

            for (; index < end; index++) {
                const planet = planetBatch[index];

                // Avoid rendering duplicates
                if (this.renderedPlanets.has(planet.pl_name)) continue;

                const coords = planet.characteristics?.coordinates_3d;
                if (!coords || coords.x_light_years === null) continue;

                const distLY = planet.sy_dist * 3.26156 || coords.x_light_years;
                const radiusInEarthRadii = planet.pl_rade || 1.0;
                const radius = radiusInEarthRadii * this.earthRadiusScale;

                let tier = 3;
                if (distLY < 25) tier = 1;
                else if (distLY < 100) tier = 2;

                const temperature = planet.pl_eqt || 300;
                let material;

                // (Logic for composition estimation remains similar but optimized)
                const radPos = (planet.characteristics?.radius_position || '').toLowerCase();
                let planetType = 'rocky';
                if (radPos.includes('jupiter') || radiusInEarthRadii > 6) planetType = 'gasGiant';
                else if (radPos.includes('neptune') || radiusInEarthRadii > 2) planetType = 'iceGiant';

                if (tier === 1) {
                    const colors = getColorByComposition(planet.characteristics?.principal_material || planetType, temperature);
                    let texture = (planetType === 'rocky') ? generateRockyTexture(colors.base, colors.detail, 128) :
                        (planetType === 'gasGiant') ? generateGasGiantTexture([colors.base, colors.detail], 128) :
                            generateIceGiantTexture(colors.base, 128);

                    material = new THREE.MeshStandardMaterial({
                        map: texture,
                        roughness: 0.8,
                        metalness: 0
                    });
                } else {
                    const colors = getColorByComposition(planetType, temperature);
                    const colorKey = `${planetType}_${Math.round(temperature / 100)}`;

                    if (distantMaterials.has(colorKey)) {
                        material = distantMaterials.get(colorKey);
                    } else {
                        material = new THREE.MeshStandardMaterial({
                            color: new THREE.Color(colors.base),
                            roughness: 0.9,
                            metalness: 0
                        });
                        distantMaterials.set(colorKey, material);
                    }
                }

                const geometry = (tier === 1) ? highPolyGeom.clone() : (tier === 2 ? midPolyGeom.clone() : lowPolyGeom.clone());
                geometry.scale(radius, radius, radius);

                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(
                    coords.x_light_years * this.sceneScale,
                    coords.y_light_years * this.sceneScale,
                    coords.z_light_years * this.sceneScale
                );

                mesh.userData.planetData = planet;
                mesh.userData.planet = planet; // Compatibility
                mesh.userData.planetName = planet.pl_name; // Compatibility

                this.meshGroup.add(mesh);
                this.renderedPlanets.add(planet.pl_name);
            }

            if (index < planetBatch.length) {
                if (window.requestIdleCallback) window.requestIdleCallback(processBatch);
                else setTimeout(processBatch, 16);
            }
        };

        processBatch();
    }

    /** No longer clearing everything by default */
    update3DMeshes() {
        this.create3DMeshes();
    }

    /**
     * Get color based on habitability score
     */
    getColorByHabitability(habitability) {
        // Green for high, yellow for medium, red for low
        if (habitability > 70) {
            return new THREE.Color(0x39ff14); // Bright green
        } else if (habitability > 40) {
            return new THREE.Color(0xff6b00); // Orange
        } else if (habitability > 20) {
            return new THREE.Color(0xff006e); // Pink
        } else {
            return new THREE.Color(0x8b00ff); // Purple
        }
    }

    /**
     * Update animation
     */
    update(deltaTime) {
        // Option: could implement frustum culling or distance-based visibility here
    }

    /**
     * Get planet at position (for interaction)
     */
    getPlanetAtPosition(position, radius = 5) {
        return this.planets.find(planet => {
            const coords = planet.characteristics?.coordinates_3d;
            if (!coords) return false;

            const planetPos = new THREE.Vector3(
                coords.x_light_years * this.sceneScale,
                coords.y_light_years * this.sceneScale,
                coords.z_light_years * this.sceneScale
            );

            return planetPos.distanceTo(position) < radius;
        });
    }

    /**
     * Dispose of resources
     */
    dispose() {
        while (this.meshGroup.children.length > 0) {
            const child = this.meshGroup.children[0];
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
            this.meshGroup.remove(child);
        }
        this.renderedPlanets.clear();
    }
}
