import * as THREE from 'three';

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
        
        // Visual settings
        this.sceneScale = 10; // 1 light year = 10 scene units
        this.earthRadiusScale = 0.5; // Earth = 0.5 scene units (for visibility)
        
        // For compatibility with old code
        this.mesh = this.meshGroup;
    }

    /**
     * Load and render NASA exoplanets
     */
    async load() {
        if (this.loaded) return;
        
        console.log('Loading NASA exoplanets for 3D visualization...');
        
        // Load nearby planets first for quick display
        await this.dataService.loadNearbyFirst();
        this.planets = this.dataService.getAllPlanets();
        
        console.log(`Creating 3D meshes for ${this.planets.length} exoplanets`);
        
        this.create3DMeshes();
        this.loaded = true;
        
        // Load remaining planets in background
        this.dataService.loadAllClusters().then(() => {
            this.planets = this.dataService.getAllPlanets();
            console.log(`Updated visualization with ${this.planets.length} total exoplanets`);
            this.update3DMeshes();
        });
    }

    /**
     * Create 3D sphere meshes for all planets (realistic sizes)
     */
    create3DMeshes() {
        // Clear existing meshes
        while(this.meshGroup.children.length > 0) {
            const child = this.meshGroup.children[0];
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
            this.meshGroup.remove(child);
        }

        // Use low-poly spheres for performance (8x8 segments)
        const baseGeometry = new THREE.SphereGeometry(1, 8, 8);
        
        let createdCount = 0;

        this.planets.forEach(planet => {
            const coords = planet.characteristics?.coordinates_3d;
            if (!coords || coords.x_light_years === null) return;

            // Get planet radius in Earth radii (pl_rade)
            const radiusInEarthRadii = planet.pl_rade || 1.0; // Default to Earth-size if unknown
            
            // Calculate realistic size: Earth = earthRadiusScale
            const radius = radiusInEarthRadii * this.earthRadiusScale;
            
            // Get color based on habitability
            const habitability = planet.characteristics?.habitability_percent || 0;
            const color = this.getColorByHabitability(habitability);

            // Create material
            const material = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.8,
                metalness: 0.1,
                emissive: color,
                emissiveIntensity: 0.1
            });

            // Clone geometry and scale to planet size
            const geometry = baseGeometry.clone();
            geometry.scale(radius, radius, radius);

            // Create mesh
            const mesh = new THREE.Mesh(geometry, material);
            
            // Position in 3D space using coordinates
            mesh.position.set(
                coords.x_light_years * this.sceneScale,
                coords.y_light_years * this.sceneScale,
                coords.z_light_years * this.sceneScale
            );

            // Store planet data reference
            mesh.userData.planetData = planet; // For teleport click handler
            mesh.userData.planet = planet; // For compatibility
            mesh.userData.planetName = planet.pl_name;

            this.meshGroup.add(mesh);
            createdCount++;
        });

        baseGeometry.dispose();
        
        console.log(`✓ Created ${createdCount} 3D exoplanet meshes`);
    }

    /**
     * Update 3D meshes with new data
     */
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
        // Planets are static - no rotation needed for thousands of meshes
        // Could add subtle rotation if needed for specific planets
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
        while(this.meshGroup.children.length > 0) {
            const child = this.meshGroup.children[0];
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
            this.meshGroup.remove(child);
        }
    }
}
