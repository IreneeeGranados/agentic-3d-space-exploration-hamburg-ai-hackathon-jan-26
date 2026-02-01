/**
 * PlanetDataService - Handles loading and managing NASA exoplanet cluster data
 * with position-based dynamic loading
 */
export class PlanetDataService {
    constructor() {
        this.clusters = new Map();
        this.allPlanets = [];
        this.isLoading = false;
        this.loadedClusters = new Set();
        this.clusterIndex = null;
        this.sceneScale = 10; // 1 light-year = 10 scene units
    }

    /**
     * Initialize - Load cluster index first
     */
    async initialize() {
        if (this.clusterIndex) {
            console.log('✓ Cluster index already loaded');
            return this.clusterIndex;
        }

        try {
            console.log('Loading cluster index...');
            const response = await fetch('nasa_data/clusters/cluster_index.json');

            if (!response.ok) {
                throw new Error(`Failed to load cluster index: ${response.status}`);
            }

            this.clusterIndex = await response.json();
            console.log(`✓ Cluster index loaded: ${this.clusterIndex.total_clusters} clusters, ${this.clusterIndex.total_planets} total planets`);

            return this.clusterIndex;
        } catch (error) {
            console.error('❌ Error loading cluster index:', error);
            throw error;
        }
    }

    /**
     * Enrich planet data with computed 3D coordinates if missing
     * Uses existing position field or computes from celestial coordinates
     */
    /**
     * Enrich planet data with computed 3D coordinates and visual assets
     * Uses existing position field or computes from celestial coordinates
     */
    enrichPlanetData(planet) {
        // 1. Compute 3D Coordinates (Existing Logic)
        this.computeCoordinates(planet);

        // 2. Classify Planet & Generate Visual Attributes (New Logic)
        // We only do this if it hasn't been done yet
        if (!planet.planetType) {
            const radius = planet.pl_rade || 1.0; // Default to Earth size if missing
            const temp = planet.pl_eqt || 288;   // Default to Earth temp if missing

            // A. Determine Type
            const classification = this.classifyPlanet(radius, temp);
            planet.planetType = classification.type;
            planet.planetSubType = classification.subType;

            // B. Visual Constraints based on Type
            planet.radius = this.getScaledRadius(radius); // Visual scale for scene

            // C. Generate Colors
            const colors = this.generatePlanetColors(classification, planet.pl_name);
            planet.color = colors.base;
            planet.detailColor = colors.detail;
            if (classification.type === 'gasGiant') {
                planet.gasColors = colors.gasColors;
            }

            // D. Atmosphere System
            planet.atmosphere = this.generateAtmosphere(classification, colors);

            // E. Ring System
            planet.rings = this.generateRings(classification, planet.pl_name);

            // F. Physics (Flattening & Mass)
            planet.flattening = this.calculateFlattening(classification, planet.pl_name);
            planet.mass = this.calculateMass(planet);

            // --- Solar System Overrides (Manual Polish) ---
            if (planet.hostname === 'Sun') {
                this.applySolarSystemOverrides(planet);
            }
        }

        return planet;
    }

    /**
     * Logic: Calculate oblateness (flattening) based on planet type and rotation
     */
    calculateFlattening(classification, name) {
        const { type } = classification;

        // Pseudo-random factor based on name for variation
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
        const rand = (hash % 100) / 100;

        if (type === 'gasGiant') {
            // Gas giants are highly oblate (Saturn is 0.09, Jupiter is 0.06)
            return 0.05 + (rand * 0.05);
        } else if (type === 'iceGiant') {
            // Ice giants have moderate oblateness (Neptune 0.017, Uranus 0.022)
            return 0.015 + (rand * 0.01);
        } else {
            // Rocky planets have very little oblateness (Earth is 0.003)
            return 0.002 + (rand * 0.003);
        }
    }

    /**
     * Logic: Calculate mass for gravitational effects
     */
    calculateMass(planet) {
        // Use NASA data if available (Earth Masses)
        if (planet.pl_masse) return planet.pl_masse;

        // Fallback: Volume-based estimation (Density approximation)
        const radius = planet.pl_rade || 1.0;
        const volume = Math.pow(radius, 3);

        // Densities: Rocky ~5, Ice ~1.5, Gas ~1
        let density = 1.0;
        if (planet.planetType === 'rocky') density = 5.0;
        else if (planet.planetType === 'iceGiant') density = 1.5;

        return volume * (density / 5.5); // Normalized to Earth density (5.5 g/cm3)
    }

    /**
     * Helper: Apply manual overrides for Solar System planets to ensure 
     * they look like their real-world counterparts.
     */
    applySolarSystemOverrides(planet) {
        const name = planet.pl_name;

        switch (name) {
            case 'Mercury':
                planet.color = 0xA5A5A5; // Grey
                planet.detailColor = 0x5C5C5C;
                planet.atmosphere.enabled = false;
                break;
            case 'Venus':
                planet.color = 0xE3BB76; // Yellowish-white
                planet.detailColor = 0xD4AF37;
                planet.atmosphere.enabled = true;
                planet.atmosphere.color = 0xC29547;
                planet.atmosphere.density = 0.9; // Very thick
                break;
            case 'Earth':
                planet.color = 0x228B22; // Green/Blue handled by 'habitable' usually, but force it
                planet.detailColor = 0x1E90FF;
                planet.atmosphere.enabled = true;
                planet.atmosphere.color = 0x4a90e2;
                planet.atmosphere.density = 0.2;
                break;
            case 'Mars':
                planet.color = 0xBC2732; // Rusty Red
                planet.detailColor = 0x8B4513;
                planet.atmosphere.enabled = true;
                planet.atmosphere.color = 0xBC2732;
                planet.atmosphere.density = 0.05; // Thin
                break;
            case 'Jupiter':
                planet.color = 0xD9A066; // Beige
                planet.detailColor = 0x8C471E; // Brown bands
                planet.rings.enabled = false; // Faint rings ignored for visual clarity
                break;
            case 'Saturn':
                planet.color = 0xEAD6B8; // Pale gold
                planet.detailColor = 0xA08F70;
                planet.rarings = true; // Typo fix in mind logic
                planet.rings.enabled = true;
                planet.rings.innerRadius = 1.2;
                planet.rings.outerRadius = 2.3;
                planet.rings.color1 = 0xCDBA96;
                planet.rings.color2 = 0x8B7D6B;
                break;
            case 'Uranus':
                planet.color = 0xD1E7E7; // Pale Cyan
                planet.detailColor = 0x88B0C3;
                planet.rings.enabled = true; // Yes, it has rings
                planet.rings.innerRadius = 1.6;
                planet.rings.outerRadius = 2.0;
                planet.rings.color1 = 0x555555; // Very dark
                planet.rings.color2 = 0x777777;
                planet.tilt = 97.77 * (Math.PI / 180); // Uranus is tilted on its side!
                break;
            case 'Neptune':
                planet.color = 0x5B5DDF; // Deep Blue
                planet.detailColor = 0x2E308E;
                planet.rings.enabled = true; // Very faint rings
                planet.rings.innerRadius = 1.5;
                planet.rings.outerRadius = 2.2;
                planet.rings.color1 = 0x3a3a3a; // Very dark, almost invisible
                planet.rings.color2 = 0x4a4a4a;
                break;
            case 'Pluto':
                planet.color = 0xE3CFB4; // Off-white/brown
                planet.detailColor = 0x5C4A42;
                planet.atmosphere.enabled = false;
                break;
        }
    }

    /**
     * Helper: Compute and assign 3D coordinates
     */
    computeCoordinates(planet) {
        // Skip if already has valid 3D coordinates in characteristics
        if (planet.characteristics?.coordinates_3d?.x_light_years !== null &&
            planet.characteristics?.coordinates_3d?.x_light_years !== undefined) {
            return;
        }

        // Ensure characteristics object exists
        if (!planet.characteristics) {
            planet.characteristics = {};
        }

        // First, check if planet has a position field (x, y, z) 
        if (planet.position && planet.position.x !== null && planet.position.x !== undefined) {
            const distParsecs = planet.sy_dist || 0;
            const distLightYears = distParsecs * 3.26156;
            const maxPos = Math.max(Math.abs(planet.position.x), Math.abs(planet.position.y), Math.abs(planet.position.z));

            let x, y, z;
            if (maxPos < 50 && distLightYears > 1) {
                const ra = planet.ra;
                const dec = planet.dec;
                if (ra != null && dec != null) {
                    const raRad = (ra * Math.PI) / 180;
                    const decRad = (dec * Math.PI) / 180;
                    x = distLightYears * Math.cos(decRad) * Math.cos(raRad);
                    y = distLightYears * Math.cos(decRad) * Math.sin(raRad);
                    z = distLightYears * Math.sin(decRad);
                } else {
                    x = planet.position.x;
                    y = planet.position.y;
                    z = planet.position.z;
                }
            } else {
                x = planet.position.x;
                y = planet.position.y;
                z = planet.position.z;
            }

            planet.characteristics.coordinates_3d = {
                x_light_years: x, y_light_years: y, z_light_years: z,
                system: 'Galactic (from position field)'
            };
            if (!planet.characteristics.distance_to_earth_ly && distLightYears > 0) {
                planet.characteristics.distance_to_earth_ly = distLightYears;
            }
            return;
        }

        // Fallback: Compute from celestial coordinates
        const ra = planet.ra;
        const dec = planet.dec;
        const distParsecs = planet.sy_dist;

        if (ra == null || dec == null || distParsecs == null) return;

        const distLightYears = distParsecs * 3.26156;
        const raRad = (ra * Math.PI) / 180;
        const decRad = (dec * Math.PI) / 180;

        planet.characteristics.coordinates_3d = {
            x_light_years: distLightYears * Math.cos(decRad) * Math.cos(raRad),
            y_light_years: distLightYears * Math.cos(decRad) * Math.sin(raRad),
            z_light_years: distLightYears * Math.sin(decRad),
            system: 'Galactic (computed from RA/Dec/Dist)'
        };
        if (!planet.characteristics.distance_to_earth_ly) {
            planet.characteristics.distance_to_earth_ly = distLightYears;
        }
    }

    /**
     * Logic: Classify planet based on Radius and Temp
     */
    classifyPlanet(radius, temp) {
        let type = 'rocky';
        let subType = 'terrestrial';

        // 1. Primary Classification by Radius (Earth Radii)
        // Gas Giant: > 6.0
        // Ice Giant: 3.0 - 6.0
        // Super-Earth: 1.5 - 3.0
        // Earth-Sized: 1.0 - 1.5
        // Sub-Earth: < 1.0

        if (radius > 6.0) {
            type = 'gasGiant';
            subType = 'gas_giant';
        } else if (radius >= 3.0) {
            type = 'iceGiant';
            subType = 'ice_giant';
        } else if (radius >= 1.5) {
            type = 'rocky'; // Use rocky shader but large
            subType = 'super_earth';
        } else if (radius >= 1.0) {
            type = 'rocky';
            subType = 'earth_sized';
        } else {
            type = 'rocky';
            subType = 'sub_earth';
        }

        // 2. Refine by Temperature (Kelvin)
        // Hot: > 1000 K
        // Warm: 350 - 1000 K
        // Temperate: 200 - 350 K
        // Cold: < 200 K

        if (temp > 1000) {
            subType = type === 'gasGiant' ? 'hot_jupiter' : 'lava_world';
        } else if (temp < 200) {
            subType = type === 'gasGiant' ? 'cold_giant' : 'ice_world';
        } else if (temp >= 200 && temp <= 350) {
            // Sweet spot
            if (type === 'rocky' && radius <= 2.0) {
                subType = 'habitable';
            }
        } else {
            // Warm range (350-1000)
            if (type === 'rocky') subType = 'desert_world';
        }

        return { type, subType };
    }

    /**
     * Logic: Scale radius for scene visualization
     */
    getScaledRadius(earthRadii) {
        // Earth reference = 0.5 scene units
        // We clamp slightly so Giants aren't TOO big to navigate around
        let scale = earthRadii * 0.5;
        return Math.min(scale, 15); // Cap at 15 scene units (30x Earth)
    }

    /**
     * Logic: Generate Colors based on scientific composition simulation
     * Uses Procedural Mixing to ensuring every planet is unique.
     */
    /**
     * Shared Chemical Palette
     */
    getCompounds() {
        return {
            IRON_OXIDE: 0xBC2732, // Rust Red (Mars-like)
            SILICATE: 0xA5A5A5,   // Grey (Moon-like)
            SULFUR: 0xE6C229,     // Yellow (Io-like)
            METHANE: 0x008080,    // Teal (Uranus-like)
            ICE: 0xF0F8FF,        // White/Blue
            WATER: 0x00008B,      // Deep Ocean
            CHLOROPHYLL: 0x228B22,// Forest Green (Life)
            CARBON: 0x2F2F2F,     // Dark Grey (Carbonaceous)
            HYDROGEN: 0xF5DEB3    // Beige/Tan (Jupiter-like)
        };
    }

    /**
     * Logic: Generate Colors based on scientific composition simulation
     * Uses Procedural Mixing to ensuring every planet is unique.
     */
    generatePlanetColors(classification, name) {
        // pseudo-random hash from name for procedural consistency
        let hash = 0;
        const str = name || 'default';
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        const rand = () => {
            const t = Math.sin(hash++) * 10000;
            return t - Math.floor(t);
        };

        const { type, subType } = classification;

        // Base Chemical Palettes (Hex) - Now using Shared Helper
        const COMPOUNDS = this.getCompounds();

        let baseColor = COMPOUNDS.SILICATE;
        let detailColor = COMPOUNDS.CARBON;
        let gasColors = [];

        // 1. Determine Likely Composition based on Type
        if (subType === 'lava_world') {
            // Hot Rocky: Iron Oxide + Sulfur + glowing heat
            baseColor = COMPOUNDS.IRON_OXIDE;
            detailColor = COMPOUNDS.SULFUR;
        } else if (subType === 'ice_world') {
            // Frozen Rocky: Ice + Silicates
            baseColor = COMPOUNDS.ICE;
            detailColor = COMPOUNDS.SILICATE;
        } else if (subType === 'habitable') {
            // Earth-like: Water + Silicates + Chance of Chlorophyll
            baseColor = COMPOUNDS.WATER;
            detailColor = COMPOUNDS.SILICATE;
            if (rand() > 0.5) detailColor = COMPOUNDS.CHLOROPHYLL; // 50% chance of life signs
        } else if (subType === 'desert_world') {
            // Warm Rocky: Silicates + Iron Oxide (Sand)
            baseColor = 0xD2B48C; // Tan
            detailColor = COMPOUNDS.IRON_OXIDE;
        } else if (subType === 'gas_giant' || subType === 'hot_jupiter') {
            // Gas Giants: Hydrogen/Helium + Compounds
            baseColor = COMPOUNDS.HYDROGEN;
            detailColor = (subType === 'hot_jupiter') ? 0x4B0082 : COMPOUNDS.SULFUR; // Hot gets exotic purples/darks
            // Complex banding colors
            gasColors = [baseColor, detailColor, (rand() > 0.5 ? COMPOUNDS.METHANE : COMPOUNDS.IRON_OXIDE)];
        } else if (subType === 'ice_giant') {
            // Ice Giants: Methane + Ice
            baseColor = COMPOUNDS.METHANE;
            detailColor = COMPOUNDS.ICE;
            gasColors = [baseColor, detailColor, 0x4682B4];
        }

        /**
         * Helper: Tweaks a hex color by a random factor to ensure uniqueness
         */
        const tweakColor = (hex, variance = 20) => {
            let r = (hex >> 16) & 0xFF;
            let g = (hex >> 8) & 0xFF;
            let b = hex & 0xFF;

            const change = (Math.floor(rand() * variance * 2) - variance);
            r = Math.min(255, Math.max(0, r + change));
            g = Math.min(255, Math.max(0, g + change));
            b = Math.min(255, Math.max(0, b + change));

            return (r << 16) + (g << 8) + b;
        };

        // 2. Apply Procedural Uniqueness (The "Different from each other" step)
        // Modulate every single planet by ±15% based on its unique name hash
        return {
            base: tweakColor(baseColor, 30),
            detail: tweakColor(detailColor, 30),
            gasColors: gasColors.map(c => tweakColor(c, 20))
        };
    }

    /**
     * Logic: Generate Atmosphere config
     */
    generateAtmosphere(classification, colors) {
        const { type, subType } = classification;
        const COMPOUNDS = this.getCompounds();

        // No atmosphere for small sub-earths (Merc-like) unless cold/icy
        if (subType === 'sub_earth' && subType !== 'ice_world') {
            return { enabled: false };
        }

        let enabled = true;
        let color = 0x87CEEB; // Sky Blue default
        let density = 0.2;
        let hasClouds = true;

        if (subType === 'lava_world') {
            color = COMPOUNDS.IRON_OXIDE; // Orange glow
            density = 0.4;
            hasClouds = false;
        } else if (subType === 'ice_world') {
            color = COMPOUNDS.ICE; // Light Cyan
            density = 0.15;
            hasClouds = true; // Thin clouds
        } else if (subType === 'desert_world') {
            color = 0xF4A460; // Sandy
            density = 0.3;
            hasClouds = true; // Dust storms?
        } else if (type === 'gasGiant') {
            color = colors.base; // Match planet
            density = 0.6; // Thick atmosphere
            hasClouds = true; // Bands are clouds
        } else if (type === 'iceGiant') {
            // Methane -> Teal
            color = COMPOUNDS.METHANE;
            density = 0.6;
            hasClouds = true;
        } else if (subType === 'habitable') {
            // Rayleigh Scattering -> Sky Blue
            color = 0x4a90e2;
            density = 0.2;
            hasClouds = true;
        }

        return { enabled, color, density, hasClouds };
    }

    /**
     * Logic: Generate Rings
     */
    generateRings(classification, name) {
        // Rings only on giants usually, or rare random chance on larger rocky
        const { type } = classification;

        let shouldHaveRings = false;
        if (type === 'gasGiant' || type === 'iceGiant') {
            // 50% chance for giants based on name hash
            let hash = 0;
            for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
            shouldHaveRings = (hash % 2 === 0);
        }

        if (!shouldHaveRings) return { enabled: false };

        return {
            enabled: true,
            innerRadius: 1.4,
            outerRadius: 2.2 + (Math.random()), // Varying width
            color1: 0x8c7853, // Dusty
            color2: 0x4a4a4a
        };
    }

    /**
     * Load solar system planets from cluster
     */
    async loadSolarSystem() {
        console.log('  🌍 Loading solar system from PlanetDataService...');
        const solarPlanets = await this.loadCluster('solar_system');

        if (solarPlanets && solarPlanets.length > 0) {
            // Tag them as solar so other components know (like Planet.js for textures)
            solarPlanets.forEach(p => p.isSolar = true);
            console.log(`  ✓ Loaded ${solarPlanets.length} solar system planets`);
        } else {
            console.warn('  ⚠️ No solar system planets loaded');
        }

        return solarPlanets;
    }

    /**
     * Load a specific cluster JSON file
     */
    async loadCluster(clusterName) {
        // Check if already loaded - return cached data WITHOUT adding to allPlanets again
        if (this.loadedClusters.has(clusterName)) {
            console.log(`  ↪ Cluster ${clusterName} already loaded (cached)`);
            return this.clusters.get(clusterName);
        }

        try {
            this.isLoading = true;
            console.log(`  ⬇ Loading cluster ${clusterName}...`);
            const response = await fetch(`nasa_data/clusters/${clusterName}.json`);

            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`  ⚠️ Cluster ${clusterName} not found (404) - skipping`);
                    this.loadedClusters.add(clusterName); // Mark as attempted to avoid retries
                    return [];
                }
                throw new Error(`Failed to load cluster: ${clusterName} (${response.status})`);
            }

            const data = await response.json();

            // Data is an array of planets directly
            if (Array.isArray(data)) {
                // Enrich planets with computed 3D coordinates if missing
                const enrichedData = data.map(planet => this.enrichPlanetData(planet));

                // IMPORTANT: Mark as loaded BEFORE adding to allPlanets to prevent race conditions
                this.clusters.set(clusterName, enrichedData);
                this.loadedClusters.add(clusterName);

                // Only add to allPlanets if not already added
                this.allPlanets.push(...enrichedData);

                console.log(`  ✓ Loaded ${clusterName}: ${enrichedData.length} planets (total: ${this.allPlanets.length})`);
                return enrichedData;
            } else {
                console.error(`  ❌ Invalid cluster format for ${clusterName}`);
                this.loadedClusters.add(clusterName); // Mark as attempted
                return [];
            }
        } catch (error) {
            console.error(`  ❌ Error loading cluster ${clusterName}:`, error);
            return [];
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Load multiple clusters progressively
     */
    async loadClusters(clusterNames) {
        const results = [];
        for (const name of clusterNames) {
            const data = await this.loadCluster(name);
            results.push(data);
        }
        return results;
    }

    /**
     * Load clusters based on camera position (position-based loading)
     */
    async loadClustersNearPosition(position, maxDistance = 500) {
        if (!this.clusterIndex) {
            await this.initialize();
        }

        // Determine which distance tier and quadrant based on position
        const distance = Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2);

        let tierToLoad = 'nearby';
        if (distance > 1000) tierToLoad = 'veryfar';
        else if (distance > 500) tierToLoad = 'far';
        else if (distance > 200) tierToLoad = 'medium';

        // Determine quadrant (1-4) based on angle
        const angle = Math.atan2(position.z, position.x);
        const quadrant = Math.floor((angle + Math.PI) / (Math.PI / 2)) % 4 + 1;

        console.log(`📍 Position-based loading: distance=${distance.toFixed(1)}, tier=${tierToLoad}, quad=${quadrant}`);

        // Load the relevant cluster and adjacent ones
        const clustersToLoad = [];

        // Primary cluster for current position
        const primaryCluster = `${tierToLoad}_quad${quadrant}`;
        if (this.clusterIndex.clusters[primaryCluster]) {
            clustersToLoad.push(primaryCluster);
        }

        // Also load adjacent quadrants
        const adjacentQuads = [
            (quadrant % 4) + 1,
            quadrant === 1 ? 4 : quadrant - 1
        ];

        for (const adjQuad of adjacentQuads) {
            const adjCluster = `${tierToLoad}_quad${adjQuad}`;
            if (this.clusterIndex.clusters[adjCluster]) {
                clustersToLoad.push(adjCluster);
            }
        }

        // Always ensure nearby clusters are loaded
        const nearbyClusters = ['nearby_quad1', 'nearby_quad2', 'nearby_quad3', 'nearby_quad4'];
        for (const nearby of nearbyClusters) {
            if (!clustersToLoad.includes(nearby)) {
                clustersToLoad.push(nearby);
            }
        }

        console.log(`  Loading clusters: ${clustersToLoad.join(', ')}`);
        await this.loadClusters(clustersToLoad);

        return this.allPlanets;
    }

    /**
     * Load nearby clusters first (optimized loading strategy)
     */
    async loadNearbyFirst() {
        if (!this.clusterIndex) {
            await this.initialize();
        }

        console.log('📦 Loading nearby quadrants...');
        const nearbyQuads = ['nearby_quad1', 'nearby_quad2', 'nearby_quad3', 'nearby_quad4'];
        await this.loadClusters(nearbyQuads);

        console.log(`✓ Loaded ${this.allPlanets.length} nearby planets`);
        return this.allPlanets;
    }

    /**
     * Load all available clusters (including all planets with and without positions)
     */
    async loadAllClusters() {
        if (!this.clusterIndex) {
            await this.initialize();
        }

        // Get ALL cluster names from index (including no_position for completeness)
        // Even though no_position planets can't be visualized, they can be searched/filtered
        const allClusterNames = Object.keys(this.clusterIndex.clusters);

        console.log(`📦 Loading all ${allClusterNames.length} clusters...`);

        await this.loadClusters(allClusterNames);

        console.log(`✓ Loaded all ${this.allPlanets.length} planets from ${this.loadedClusters.size} clusters`);
        return this.allPlanets;
    }

    /**
     * Get all loaded planets (only those with valid coordinates)
     * Deduplicates by planet name to prevent any duplicate entries
     */
    getAllPlanets() {
        // Filter for valid coordinates
        const validPlanets = this.allPlanets.filter(p => {
            const coords = p.characteristics?.coordinates_3d;
            return coords && coords.x_light_years !== null && coords.x_light_years !== undefined;
        });

        // Deduplicate by planet name (in case of any race conditions)
        const uniquePlanets = new Map();
        for (const planet of validPlanets) {
            if (!uniquePlanets.has(planet.pl_name)) {
                uniquePlanets.set(planet.pl_name, planet);
            }
        }

        const result = Array.from(uniquePlanets.values());

        // Log warning if deduplication removed planets
        if (result.length < validPlanets.length) {
            console.warn(`⚠️ Deduplicated planets: ${validPlanets.length} → ${result.length} (removed ${validPlanets.length - result.length} duplicates)`);
        }

        return result;
    }

    /**
     * Search planets by name
     */
    searchByName(query) {
        if (!query) return this.allPlanets;

        const lowerQuery = query.toLowerCase();
        return this.allPlanets.filter(planet =>
            planet.pl_name?.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Filter planets by habitability
     */
    filterByHabitability(minPercent = 0, maxPercent = 100) {
        return this.allPlanets.filter(planet => {
            const habitability = planet.characteristics?.habitability_percent || 0;
            return habitability >= minPercent && habitability <= maxPercent;
        });
    }

    /**
     * Filter planets by distance
     */
    filterByDistance(maxDistance) {
        return this.allPlanets.filter(planet => {
            const distance = planet.sy_dist || 0;
            return distance <= maxDistance;
        });
    }

    /**
     * Advanced filter with multiple criteria
     */
    filter(options = {}) {
        let results = [...this.allPlanets];

        // Always filter out planets without valid 3D coordinates
        results = results.filter(p => {
            const coords = p.characteristics?.coordinates_3d;
            return coords && coords.x_light_years !== null && coords.x_light_years !== undefined;
        });

        if (options.name) {
            const lowerQuery = options.name.toLowerCase();
            results = results.filter(p =>
                p.pl_name?.toLowerCase().includes(lowerQuery)
            );
        }

        if (options.minHabitability !== undefined) {
            results = results.filter(p =>
                (p.characteristics?.habitability_percent || 0) >= options.minHabitability
            );
        }

        if (options.maxToxicity !== undefined) {
            results = results.filter(p =>
                (p.characteristics?.toxicity_percent || 0) <= options.maxToxicity
            );
        }

        if (options.maxDistance !== undefined) {
            results = results.filter(p =>
                (p.sy_dist || 0) <= options.maxDistance
            );
        }

        if (options.planetType) {
            results = results.filter(p =>
                p.characteristics?.radius_position?.toLowerCase().includes(options.planetType.toLowerCase())
            );
        }

        return results;
    }

    /**
     * Get planet by name
     */
    getPlanetByName(name) {
        return this.allPlanets.find(p => p.pl_name === name);
    }

    /**
     * Get random planet
     */
    getRandomPlanet() {
        const validPlanets = this.getAllPlanets();
        if (validPlanets.length === 0) return null;
        const index = Math.floor(Math.random() * validPlanets.length);
        return validPlanets[index];
    }

    /**
     * Get statistics about loaded data
     */
    getStats() {
        const allPlanets = this.getAllPlanets();
        return {
            totalPlanets: allPlanets.length,
            totalRawEntries: this.allPlanets.length,
            clustersLoaded: this.loadedClusters.size,
            clusterNames: Array.from(this.loadedClusters)
        };
    }
}
