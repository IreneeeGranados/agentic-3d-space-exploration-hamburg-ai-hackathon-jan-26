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
    enrichPlanetData(planet) {
        // Skip if already has valid 3D coordinates in characteristics
        if (planet.characteristics?.coordinates_3d?.x_light_years !== null &&
            planet.characteristics?.coordinates_3d?.x_light_years !== undefined) {
            return planet;
        }

        // Ensure characteristics object exists
        if (!planet.characteristics) {
            planet.characteristics = {};
        }

        // First, check if planet has a position field (x, y, z) 
        // Position is usually in light-years or AU depending on source
        if (planet.position && planet.position.x !== null && planet.position.x !== undefined) {
            // Get distance for scaling - position is usually relative
            const distParsecs = planet.sy_dist || 0;
            const distLightYears = distParsecs * 3.26156;

            // If position values are very small (< 50), they're likely in AU/relative coords
            // Scale them using the distance to place in galactic coordinates
            const maxPos = Math.max(
                Math.abs(planet.position.x || 0),
                Math.abs(planet.position.y || 0),
                Math.abs(planet.position.z || 0)
            );

            let x, y, z;
            if (maxPos < 50 && distLightYears > 1) {
                // Small position values = use distance-based scaling
                // Use ra/dec to determine direction, position for shape
                const ra = planet.ra;
                const dec = planet.dec;
                if (ra !== null && ra !== undefined && dec !== null && dec !== undefined) {
                    const raRad = (ra * Math.PI) / 180;
                    const decRad = (dec * Math.PI) / 180;
                    x = distLightYears * Math.cos(decRad) * Math.cos(raRad);
                    y = distLightYears * Math.cos(decRad) * Math.sin(raRad);
                    z = distLightYears * Math.sin(decRad);
                } else {
                    // Use position directly if no ra/dec
                    x = planet.position.x;
                    y = planet.position.y;
                    z = planet.position.z;
                }
            } else {
                // Position values are already in good scale
                x = planet.position.x;
                y = planet.position.y;
                z = planet.position.z;
            }

            planet.characteristics.coordinates_3d = {
                x_light_years: x,
                y_light_years: y,
                z_light_years: z,
                system: 'Galactic (from position field)'
            };

            if (!planet.characteristics.distance_to_earth_ly && distLightYears > 0) {
                planet.characteristics.distance_to_earth_ly = distLightYears;
            }

            return planet;
        }

        // Fallback: Compute from celestial coordinates (ra, dec, sy_dist)
        const ra = planet.ra;
        const dec = planet.dec;
        const distParsecs = planet.sy_dist;

        if (ra === null || ra === undefined ||
            dec === null || dec === undefined ||
            distParsecs === null || distParsecs === undefined || distParsecs <= 0) {
            return planet;
        }

        const distLightYears = distParsecs * 3.26156;
        const raRad = (ra * Math.PI) / 180;
        const decRad = (dec * Math.PI) / 180;

        const x = distLightYears * Math.cos(decRad) * Math.cos(raRad);
        const y = distLightYears * Math.cos(decRad) * Math.sin(raRad);
        const z = distLightYears * Math.sin(decRad);

        planet.characteristics.coordinates_3d = {
            x_light_years: x,
            y_light_years: y,
            z_light_years: z,
            system: 'Galactic (computed from RA/Dec/Dist)'
        };

        if (!planet.characteristics.distance_to_earth_ly) {
            planet.characteristics.distance_to_earth_ly = distLightYears;
        }

        return planet;
    }

    /**
     * Load a specific cluster JSON file
     */
    async loadCluster(clusterName) {
        if (this.loadedClusters.has(clusterName)) {
            console.log(`  ↪ Cluster ${clusterName} already loaded`);
            return this.clusters.get(clusterName);
        }

        try {
            this.isLoading = true;
            console.log(`  ⬇ Loading cluster ${clusterName}...`);
            const response = await fetch(`nasa_data/clusters/${clusterName}.json`);

            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`  ⚠️ Cluster ${clusterName} not found (404) - skipping`);
                    return [];
                }
                throw new Error(`Failed to load cluster: ${clusterName} (${response.status})`);
            }

            const data = await response.json();

            // Data is an array of planets directly
            if (Array.isArray(data)) {
                // Enrich planets with computed 3D coordinates if missing
                const enrichedData = data.map(planet => this.enrichPlanetData(planet));

                this.clusters.set(clusterName, enrichedData);
                this.loadedClusters.add(clusterName);
                this.allPlanets.push(...enrichedData);

                console.log(`  ✓ Loaded ${clusterName}: ${enrichedData.length} planets`);
                return enrichedData;
            } else {
                console.error(`  ❌ Invalid cluster format for ${clusterName}`);
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
     * Load all available clusters
     */
    async loadAllClusters() {
        if (!this.clusterIndex) {
            await this.initialize();
        }

        // Get cluster names from index, excluding 'no_position' cluster
        const allClusterNames = Object.keys(this.clusterIndex.clusters)
            .filter(name => name !== 'no_position'); // Skip planets without coordinates

        console.log(`📦 Loading all ${allClusterNames.length} clusters...`);

        await this.loadClusters(allClusterNames);

        console.log(`✓ Loaded all ${this.allPlanets.length} planets from ${this.loadedClusters.size} clusters`);
        return this.allPlanets;
    }

    /**
     * Get all loaded planets (only those with valid coordinates)
     */
    getAllPlanets() {
        return this.allPlanets.filter(p => {
            const coords = p.characteristics?.coordinates_3d;
            return coords && coords.x_light_years !== null && coords.x_light_years !== undefined;
        });
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
        if (this.allPlanets.length === 0) return null;
        const index = Math.floor(Math.random() * this.allPlanets.length);
        return this.allPlanets[index];
    }
}
