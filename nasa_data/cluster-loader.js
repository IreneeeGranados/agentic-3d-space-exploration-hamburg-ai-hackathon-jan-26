/**
 * NASA Exoplanet Cluster Loader
 * Progressive loading system for 3D space exploration
 * 
 * Usage:
 *   import { ClusterLoader } from './cluster-loader.js';
 *   const loader = new ClusterLoader('nasa_data/clusters');
 *   await loader.loadNearby();
 */

export class ClusterLoader {
  constructor(clustersPath = 'nasa_data/clusters') {
    this.clustersPath = clustersPath;
    this.loadedClusters = new Map();
    this.index = null;
    this.loading = new Set();
  }

  /**
   * Initialize - Load the cluster index
   */
  async init() {
    if (this.index) return this.index;
    
    const indexPath = `${this.clustersPath}/cluster_index.json`;
    const response = await fetch(indexPath);
    this.index = await response.json();
    
    console.log(`📇 Cluster index loaded: ${this.index.total_clusters} clusters, ${this.index.total_planets} planets`);
    return this.index;
  }

  /**
   * Load a specific cluster by name
   * @param {string} clusterName - e.g., 'nearby_quad1'
   * @returns {Promise<Array>} Array of planet objects
   */
  async loadCluster(clusterName) {
    // Return if already loaded
    if (this.loadedClusters.has(clusterName)) {
      return this.loadedClusters.get(clusterName);
    }

    // Wait if currently loading
    if (this.loading.has(clusterName)) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.loadedClusters.has(clusterName)) {
            clearInterval(checkInterval);
            resolve(this.loadedClusters.get(clusterName));
          }
        }, 100);
      });
    }

    // Load the cluster
    this.loading.add(clusterName);
    
    try {
      const clusterPath = `${this.clustersPath}/${clusterName}.json`;
      console.log(`⬇️  Loading cluster: ${clusterName}...`);
      
      const response = await fetch(clusterPath);
      const planets = await response.json();
      
      this.loadedClusters.set(clusterName, planets);
      this.loading.delete(clusterName);
      
      console.log(`✅ Loaded ${clusterName}: ${planets.length} planets`);
      return planets;
      
    } catch (error) {
      this.loading.delete(clusterName);
      console.error(`❌ Failed to load cluster ${clusterName}:`, error);
      throw error;
    }
  }

  /**
   * Load multiple clusters in parallel
   * @param {Array<string>} clusterNames
   * @returns {Promise<Map>} Map of clusterName => planets
   */
  async loadClusters(clusterNames) {
    const promises = clusterNames.map(name => this.loadCluster(name));
    const results = await Promise.all(promises);
    
    const map = new Map();
    clusterNames.forEach((name, index) => {
      map.set(name, results[index]);
    });
    
    return map;
  }

  /**
   * Load all nearby clusters (0-100 ly) - Best for initial load
   * @returns {Promise<Array>} All planets from nearby clusters
   */
  async loadNearby() {
    const nearbyNames = ['nearby_quad1', 'nearby_quad2', 'nearby_quad3', 'nearby_quad4'];
    const clustersMap = await this.loadClusters(nearbyNames);
    
    // Flatten into single array
    const allPlanets = [];
    clustersMap.forEach(planets => allPlanets.push(...planets));
    
    console.log(`🌟 Loaded all nearby planets: ${allPlanets.length} total`);
    return allPlanets;
  }

  /**
   * Preload clusters in the background (non-blocking)
   * @param {Array<string>} clusterNames
   */
  preloadClusters(clusterNames) {
    clusterNames.forEach(name => {
      if (!this.loadedClusters.has(name) && !this.loading.has(name)) {
        this.loadCluster(name).catch(err => {
          console.warn(`Preload failed for ${name}:`, err);
        });
      }
    });
  }

  /**
   * Find which cluster contains a specific planet
   * @param {string} planetName
   * @returns {string|null} Cluster name or null
   */
  async findPlanetCluster(planetName) {
    await this.init();
    
    for (const [clusterName, clusterInfo] of Object.entries(this.index.clusters)) {
      if (clusterInfo.planet_names.includes(planetName)) {
        return clusterName;
      }
    }
    
    return null;
  }

  /**
   * Search for a planet and load its cluster
   * @param {string} planetName
   * @returns {Promise<Object>} Planet object or null
   */
  async searchAndLoadPlanet(planetName) {
    const clusterName = await this.findPlanetCluster(planetName);
    
    if (!clusterName) {
      console.warn(`Planet "${planetName}" not found in any cluster`);
      return null;
    }
    
    const planets = await this.loadCluster(clusterName);
    return planets.find(p => p.name === planetName);
  }

  /**
   * Get clusters based on camera position
   * @param {Object} cameraPosition - {x, y, z} in AU
   * @param {number} viewRadius - View distance in light years
   * @returns {Array<string>} Cluster names to load
   */
  getClustersForView(cameraPosition, viewRadius = 100) {
    // Simple strategy: determine distance shell and load relevant quadrants
    const distanceLY = Math.sqrt(
      cameraPosition.x ** 2 + 
      cameraPosition.y ** 2 + 
      cameraPosition.z ** 2
    ) * 0.0000158; // AU to LY
    
    let shell;
    if (distanceLY < 100) shell = 'nearby';
    else if (distanceLY < 500) shell = 'medium';
    else if (distanceLY < 2000) shell = 'far';
    else shell = 'veryfar';
    
    // Load current shell + adjacent
    const shells = ['nearby', 'medium', 'far', 'veryfar'];
    const currentIndex = shells.indexOf(shell);
    const shellsToLoad = [
      shells[Math.max(0, currentIndex - 1)],
      shell,
      shells[Math.min(shells.length - 1, currentIndex + 1)]
    ];
    
    // All quadrants for these shells
    const clusters = [];
    shellsToLoad.forEach(s => {
      ['quad1', 'quad2', 'quad3', 'quad4'].forEach(q => {
        clusters.push(`${s}_${q}`);
      });
    });
    
    return clusters;
  }

  /**
   * Smart loading based on camera position and movement
   * @param {Object} cameraPosition - {x, y, z} in AU
   * @param {Object} cameraVelocity - {x, y, z} movement direction
   * @returns {Promise<Array>} Loaded planets for current view
   */
  async loadForCamera(cameraPosition, cameraVelocity = {x: 0, y: 0, z: 0}) {
    const primaryClusters = this.getClustersForView(cameraPosition);
    
    // Load first 2 immediately
    const immediate = primaryClusters.slice(0, 2);
    const clustersMap = await this.loadClusters(immediate);
    
    // Preload rest in background
    const preload = primaryClusters.slice(2);
    this.preloadClusters(preload);
    
    // Flatten results
    const allPlanets = [];
    clustersMap.forEach(planets => allPlanets.push(...planets));
    
    return allPlanets;
  }

  /**
   * Unload distant clusters to free memory
   * @param {Array<string>} clustersToKeep
   */
  unloadDistantClusters(clustersToKeep) {
    const toUnload = [];
    
    this.loadedClusters.forEach((planets, clusterName) => {
      if (!clustersToKeep.includes(clusterName)) {
        toUnload.push(clusterName);
      }
    });
    
    toUnload.forEach(clusterName => {
      this.loadedClusters.delete(clusterName);
      console.log(`🗑️  Unloaded cluster: ${clusterName}`);
    });
    
    return toUnload.length;
  }

  /**
   * Get memory usage statistics
   * @returns {Object} Stats about loaded data
   */
  getStats() {
    let totalPlanets = 0;
    let totalSize = 0;
    
    this.loadedClusters.forEach((planets, name) => {
      totalPlanets += planets.length;
      totalSize += JSON.stringify(planets).length;
    });
    
    return {
      loadedClusters: this.loadedClusters.size,
      totalPlanets,
      estimatedSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      loadingClusters: this.loading.size
    };
  }
}

// Example usage for Three.js
export class ThreeJSPlanetRenderer {
  constructor(scene, clusterLoader) {
    this.scene = scene;
    this.loader = clusterLoader;
    this.planetMeshes = new Map();
  }

  async renderPlanets(planets) {
    planets.forEach(planet => {
      if (this.planetMeshes.has(planet.name)) return;
      
      const mesh = this.createPlanetMesh(planet);
      this.scene.add(mesh);
      this.planetMeshes.set(planet.name, mesh);
    });
  }

  createPlanetMesh(planet) {
    // Example planet mesh creation
    const radius = (planet.radius?.earth_radii || 1) * 0.01; // Scale for visibility
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    
    const material = new THREE.MeshStandardMaterial({
      color: planet.visual_properties?.base_color_hex || '#808080',
      emissive: planet.visual_properties?.emissive ? planet.visual_properties.base_color_hex : 0x000000,
      emissiveIntensity: planet.visual_properties?.emissive ? 0.3 : 0
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Position
    if (planet.position_3d?.current_position_au) {
      const pos = planet.position_3d.current_position_au;
      mesh.position.set(pos.x, pos.y, pos.z);
    }
    
    mesh.userData.planet = planet;
    return mesh;
  }

  removePlanet(planetName) {
    const mesh = this.planetMeshes.get(planetName);
    if (mesh) {
      this.scene.remove(mesh);
      this.planetMeshes.delete(planetName);
    }
  }
}

// Export singleton for convenience
export const createClusterLoader = (path) => new ClusterLoader(path);
