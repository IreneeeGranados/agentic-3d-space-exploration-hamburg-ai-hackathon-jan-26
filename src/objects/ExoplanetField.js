import * as THREE from 'three';
import {
    generateRockyTexture,
    generateGasGiantTexture,
    generateIceGiantTexture,
    generateNormalMap,
    getColorByComposition
} from '../utils/textureGenerator.js';
import { generateEarthTexture } from '../utils/PlanetTextureGenerator.js';

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

        // Visual settings - UNIFIED LINEAR SCALE (1:1 ratio, no boosts)
        this.sceneScale = 10; // 1 light year = 10 scene units (ALL planets)
        this.earthRadiusScale = 0.5; // 1 Earth radius = 0.5 scene units (ALL planets, no exceptions)

        // For compatibility with old code
        this.mesh = this.meshGroup;

        // NEW: Texture loader for real photographic textures (Earth/Solar)
        this.textureLoader = new THREE.TextureLoader();
    }

    /**
     * Load and render NASA exoplanets incrementally
     */
    async load() {
        if (this.loaded) return;

        console.log('  📦 Loading planet data incrementally...');

        // 1. Load nearby planets first for quick display
        const nearby = await this.dataService.loadNearbyFirst();
        this.planets = nearby;
        this.create3DMeshes(nearby);
        this.loaded = true;

        // 2. Load remaining clusters one by one in background to prevent spikes
        const clusterIndex = await this.dataService.initialize();
        const otherClusters = Object.keys(clusterIndex.clusters)
            .filter(name => name !== 'no_position' && !name.startsWith('nearby'));

        console.log(`  📋 Loading ${otherClusters.length} additional clusters: ${otherClusters.join(', ')}`);

        // Load in background
        this.loadClustersProgressively(otherClusters);

        // APLICAR ESCALA x10000 DESPUÉS DE RENDERIZAR
        console.log('🔧 Applying x10000 scale to all planets...');
        this.meshGroup.scale.set(10000, 10000, 10000);
    }

    /**
     * Load clusters one by one and update visualization
     */
    async loadClustersProgressively(clusterNames) {
        let loadedCount = 0;
        const totalClusters = clusterNames.length;

        for (const name of clusterNames) {
            const clusterPlanets = await this.dataService.loadCluster(name);
            if (clusterPlanets && clusterPlanets.length > 0) {
                // Add new planets to local collection
                this.planets.push(...clusterPlanets);
                // Render only the new batch
                this.create3DMeshes(clusterPlanets);

                loadedCount++;
                console.log(`  📦 Progress: ${loadedCount}/${totalClusters} clusters loaded (${this.dataService.getAllPlanets().length} total planets)`);

                // Allow some breathing room between clusters
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        console.log(`✨ All ${totalClusters} clusters loaded! Total: ${this.dataService.getAllPlanets().length} planets rendered.`);
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

        // Solar system planet names - render them with special handling
        const solarSystemPlanets = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

        const processBatch = () => {
            const end = Math.min(index + batchSize, planetBatch.length);

            for (; index < end; index++) {
                const planet = planetBatch[index];

                // Check if this is a solar system planet
                const isSolarPlanet = planet.hostname === 'Sun' && solarSystemPlanets.includes(planet.pl_name);

                // Avoid rendering duplicates
                if (this.renderedPlanets.has(planet.pl_name)) continue;

                const coords = planet.characteristics?.coordinates_3d;

                // UNIFIED: All planets must have valid coordinates_3d
                if (!coords || coords.x_light_years === null) {
                    console.warn(`⚠️ Skipping ${planet.pl_name}: missing coordinates_3d`);
                    continue;
                }

                const distLY = planet.sy_dist * 3.26156 || Math.sqrt(
                    coords.x_light_years ** 2 +
                    coords.y_light_years ** 2 +
                    coords.z_light_years ** 2
                );
                const radiusInEarthRadii = planet.pl_rade || 1.0;

                // TRUE 1:1 SCALE: No boosts, no exceptions
                const radius = radiusInEarthRadii * this.earthRadiusScale;

                let tier = 3;
                if (distLY < 25) tier = 1;
                else if (distLY < 100) tier = 2;

                const temperature = planet.pl_eqt || 300;
                let material;

                // Use enriched planet type if available, otherwise estimate
                let planetType = planet.planetType;
                if (!planetType) {
                    const radPos = (planet.characteristics?.radius_position || '').toLowerCase();
                    planetType = 'rocky';
                    if (radPos.includes('jupiter') || radiusInEarthRadii > 6) planetType = 'gasGiant';
                    else if (radPos.includes('neptune') || radiusInEarthRadii > 2) planetType = 'iceGiant';
                }

                if (tier === 1) {
                    // Use enriched colors if available, otherwise generate
                    let colors;
                    if (planet.color && planet.detailColor) {
                        colors = { base: planet.color, detail: planet.detailColor };
                    } else {
                        colors = getColorByComposition(planet.characteristics?.principal_material || planetType, temperature);
                    }

                    // PBR Material Settings based on Planetary Composition
                    let roughness = 0.9;
                    let metalness = 0.0;
                    let emissive = 0x000000;
                    let emissiveIntensity = 0;

                    const subType = planet.planetSubType || '';

                    if (subType === 'habitable' || subType === 'ice_world') {
                        // Water/Ice: Specular highlights but not "wet plastic"
                        roughness = 0.5; // Increased from 0.2
                    } else if (subType === 'lava_world' || subType === 'hot_jupiter') {
                        // Lava: Emissive glow
                        roughness = 0.8;
                        emissive = 0xff0000;
                        emissiveIntensity = 0.3;
                    } else if (subType === 'gas_giant' || subType === 'ice_giant') {
                        // Giants: Dense atmosphere, slight sheen
                        roughness = 0.6;
                    }

                    let texture, specularMap, normalMap, emissiveMap;
                    let useRealTextures = false;

                    // SPECIAL HANDLING: Earth and Solar System
                    const planetName = planet.pl_name || planet.name;
                    const isEarth = planetName === 'Earth';

                    if (isSolarPlanet || planet.isSolar || isEarth) {
                        if (isEarth) {
                            console.log('🌎 RENDERING REALISTIC EARTH (Tier 1)');

                            // Load real photographic textures
                            texture = this.textureLoader.load('/textures/planets/earth/earth_day_2048.jpg');
                            specularMap = this.textureLoader.load('/textures/planets/earth/earth_specular_2048.jpg');
                            normalMap = this.textureLoader.load('/textures/planets/earth/earth_normal_2048.jpg');
                            emissiveMap = this.textureLoader.load('/textures/planets/earth/earth_lights_2048.png');

                            texture.colorSpace = THREE.SRGBColorSpace;
                            if (emissiveMap) emissiveMap.colorSpace = THREE.SRGBColorSpace;
                            useRealTextures = true;
                        }
                    }

                    if (!useRealTextures) {
                        if (isEarth) {
                            texture = generateEarthTexture(512);
                            normalMap = generateNormalMap(512, 1.0);
                        } else {
                            texture = (planetType === 'rocky') ? generateRockyTexture(colors.base, colors.detail, 128) :
                                (planetType === 'gasGiant') ? generateGasGiantTexture(planet.gasColors || [colors.base, colors.detail], 128) :
                                    generateIceGiantTexture(colors.base, 128);
                            normalMap = generateNormalMap(128, 1.0);
                        }
                    }

                    material = new THREE.MeshStandardMaterial({
                        map: texture,
                        normalMap: normalMap,
                        color: isEarth ? new THREE.Color(0xd4ffd4) : 0xffffff, // Subtle green tint for Earth
                        roughness: isEarth ? 0.35 : roughness,
                        metalness: isEarth ? 0.0 : metalness,
                        emissive: (isEarth && emissiveMap) ? new THREE.Color(0xffaa44) : emissive,
                        emissiveIntensity: isEarth ? 0.05 : emissiveIntensity
                    });

                    if (useRealTextures && isEarth && specularMap) {
                        material.metalnessMap = specularMap;
                        material.metalness = 0.5; // Enough for reflections, not enough to wash out colors
                        material.roughness = 0.2; // Smooth water for clearer colors
                    }

                } else {
                    // Use enriched color if available
                    let baseColor = planet.color;
                    if (!baseColor) {
                        const style = getColorByComposition(planetType, temperature);
                        baseColor = style.base;
                    }

                    // Cache key based on color value (efficient batching)
                    const colorKey = `mat_${baseColor}`;

                    if (distantMaterials.has(colorKey)) {
                        material = distantMaterials.get(colorKey);
                    } else {
                        material = new THREE.MeshStandardMaterial({
                            color: new THREE.Color(baseColor),
                            roughness: 0.9,
                            metalness: 0
                        });
                        distantMaterials.set(colorKey, material);
                    }
                }

                const geometry = (tier === 1) ? highPolyGeom.clone() : (tier === 2 ? midPolyGeom.clone() : lowPolyGeom.clone());
                geometry.scale(radius, radius, radius);

                const mesh = new THREE.Mesh(geometry, material);

                // Apply Oblateness (Flattening)
                if (planet.flattening) {
                    mesh.scale.set(1, 1.0 - planet.flattening, 1);
                }

                // UNIFIED POSITIONING: All planets use coordinates_3d (light-years → scene units)
                mesh.position.set(
                    coords.x_light_years * this.sceneScale,
                    coords.y_light_years * this.sceneScale,
                    coords.z_light_years * this.sceneScale
                );

                mesh.userData.planetData = planet;
                mesh.userData.planet = planet; // Compatibility
                mesh.userData.planetName = planet.pl_name; // Compatibility
                mesh.userData.isSolar = isSolarPlanet; // Mark solar system planets

                // PBR Shadows
                mesh.castShadow = true;
                mesh.receiveShadow = true;

                // --- Geometry Enhancements (Tier 1 Only) ---
                if (tier === 1) {
                    const isEarth = (planet.pl_name || planet.name) === 'Earth';

                    // 1. Earth Atmosphere & Clouds (New Realistic System)
                    if (isEarth) {
                        // A. Cloud Layer - Textured and volumetric-ish
                        const cloudGeom = new THREE.SphereGeometry(radius * 1.012, 64, 64);
                        const cloudTex = this.textureLoader.load('/textures/planets/earth/earth_clouds_2048.png');
                        cloudTex.colorSpace = THREE.SRGBColorSpace;

                        const cloudMat = new THREE.MeshStandardMaterial({
                            map: cloudTex,
                            transparent: true,
                            opacity: 0.7,
                            roughness: 1.0,
                            metalness: 0.0,
                            blending: THREE.NormalBlending,
                            depthWrite: false
                        });
                        const cloudMesh = new THREE.Mesh(cloudGeom, cloudMat);
                        cloudMesh.name = 'EarthClouds';
                        cloudMesh.userData.isClouds = true;
                        mesh.add(cloudMesh);

                        // B. Enhanced Atmosphere Glow for Earth
                        const atmoGeom = new THREE.SphereGeometry(radius * 1.05, 32, 32);
                        const atmoMat = new THREE.MeshBasicMaterial({
                            color: 0x93ccff,
                            transparent: true,
                            opacity: 0.25,
                            side: THREE.BackSide,
                            blending: THREE.AdditiveBlending
                        });
                        const atmoMesh = new THREE.Mesh(atmoGeom, atmoMat);
                        mesh.add(atmoMesh);
                        mesh.name = 'Earth'; // Ensure we can find Earth for rotation if needed
                    } else if (planet.atmosphere && planet.atmosphere.enabled) {
                        // Standard atmosphere for other planets
                        const atmoGeom = new THREE.SphereGeometry(1.2, 16, 16);
                        const atmoMat = new THREE.MeshBasicMaterial({
                            color: planet.atmosphere.color || 0x87CEEB,
                            transparent: true,
                            opacity: planet.atmosphere.density ? planet.atmosphere.density * 0.5 : 0.1,
                            side: THREE.BackSide,
                            blending: THREE.AdditiveBlending
                        });
                        const atmoMesh = new THREE.Mesh(atmoGeom, atmoMat);
                        atmoMesh.scale.set(1.1, 1.1, 1.1); // Slightly larger than planet
                        mesh.add(atmoMesh);
                    }

                    // 2. Ring System
                    if (planet.rings && planet.rings.enabled) {
                        const inner = planet.rings.innerRadius || 1.4;
                        const outer = planet.rings.outerRadius || 2.2;
                        const ringGeom = new THREE.RingGeometry(inner, outer, 32);
                        const ringMat = new THREE.MeshStandardMaterial({
                            color: planet.rings.color1 || 0x8c7853,
                            side: THREE.DoubleSide,
                            transparent: true,
                            opacity: 0.8,
                            roughness: 0.8,
                            metalness: 0.2
                        });

                        // Align texture UVs
                        const pos = ringGeom.attributes.position;
                        const v3 = new THREE.Vector3();
                        for (let i = 0; i < pos.count; i++) {
                            v3.fromBufferAttribute(pos, i);
                            ringGeom.attributes.uv.setXY(i, v3.length() < (inner + outer) / 2 ? 0 : 1, 1);
                        }

                        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
                        ringMesh.rotation.x = Math.PI / 2; // Flat relative to planet
                        ringMesh.receiveShadow = true;
                        ringMesh.castShadow = true;
                        mesh.add(ringMesh);
                    }
                }

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
        // High-fidelity animation for Earth
        const earthMesh = this.meshGroup.getObjectByName('Earth');
        if (earthMesh) {
            // Standard planetary rotation
            earthMesh.rotation.y += deltaTime * 0.1;

            // Dynamic clouds: rotating at a slightly different speed for realism
            const clouds = earthMesh.getObjectByName('EarthClouds');
            if (clouds) {
                clouds.rotation.y += deltaTime * 0.03;
            }
        }
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
