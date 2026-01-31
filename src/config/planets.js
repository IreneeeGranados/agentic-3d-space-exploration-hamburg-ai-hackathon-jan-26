/**
 * Planet Configuration Data
 * Loads planet data dynamically from the solar_system.json dataset
 * Sizes are in Earth radii (Earth = 1.0)
 */

// Scale factor for visibility (Earth = 0.5 scene units)
const EARTH_SCALE = 0.5;

// Visual configuration for planets (colors, orbit positions, etc.)
const PLANET_VISUALS = {
    Mercury: {
        color: 0x8c7853,
        detailColor: 0x6b5d4f,
        orbitRadius: 40,
        orbitSpeed: 0.02,
        planetType: 'rocky'
    },
    Venus: {
        color: 0xffc649,
        detailColor: 0xe6b85c,
        orbitRadius: 60,
        orbitSpeed: 0.015,
        planetType: 'rocky'
    },
    Earth: {
        color: 0x4a90e2,
        detailColor: 0x2d5aa8,
        orbitRadius: 80,
        orbitSpeed: 0.01,
        planetType: 'rocky'
    },
    Mars: {
        color: 0xcd5c5c,
        detailColor: 0x8b3a3a,
        orbitRadius: 100,
        orbitSpeed: 0.008,
        planetType: 'rocky'
    },
    Jupiter: {
        color: 0xc88b3a,
        gasColors: [0xc88b3a, 0xe6a85c, 0xf4d7a8, 0xd4a05a],
        orbitRadius: 140,
        orbitSpeed: 0.005,
        planetType: 'gasGiant'
    },
    Saturn: {
        color: 0xfad5a5,
        gasColors: [0xfad5a5, 0xf4c78a, 0xe8b975, 0xd4a05a],
        orbitRadius: 180,
        orbitSpeed: 0.003,
        planetType: 'gasGiant'
    },
    Uranus: {
        color: 0x4fd0e7,
        orbitRadius: 220,
        orbitSpeed: 0.002,
        planetType: 'iceGiant'
    },
    Neptune: {
        color: 0x4169e1,
        orbitRadius: 260,
        orbitSpeed: 0.001,
        planetType: 'iceGiant'
    }
};

/**
 * Load solar system planets from the JSON dataset
 * @returns {Promise<Array>} Array of planet configurations
 */
export async function loadSolarSystemPlanets() {
    try {
        const response = await fetch('nasa_data/solar_system.json');
        if (!response.ok) {
            throw new Error(`Failed to load solar_system.json: ${response.status}`);
        }

        const solarSystemData = await response.json();
        console.log(`✓ Loaded ${solarSystemData.length} planets from solar_system.json`);

        // Filter to only include the 8 main planets (exclude Pluto for now)
        const mainPlanets = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];

        const planetsData = solarSystemData
            .filter(planet => mainPlanets.includes(planet.pl_name))
            .map(planet => transformPlanetData(planet));

        console.log(`✓ Transformed ${planetsData.length} solar system planets with dataset dimensions`);
        return planetsData;
    } catch (error) {
        console.error('❌ Error loading solar system data:', error);
        console.log('⚠️ Falling back to static planet data');
        return PLANETS_DATA;
    }
}

/**
 * Transform raw JSON planet data into the format needed by Planet class
 * @param {Object} rawPlanet - Raw planet data from solar_system.json
 * @returns {Object} Transformed planet configuration
 */
function transformPlanetData(rawPlanet) {
    const name = rawPlanet.pl_name;
    const visuals = PLANET_VISUALS[name] || {};
    const characteristics = rawPlanet.characteristics || {};

    // Calculate radius from pl_rade (Earth radii) using scale factor
    const radiusInEarthRadii = rawPlanet.pl_rade || 1.0;
    const radius = radiusInEarthRadii * EARTH_SCALE;

    // Determine rotation speed based on orbital period
    const orbPeriod = rawPlanet.pl_orbper || 365;
    const rotationSpeed = 0.02 * (365 / orbPeriod); // Relative to Earth

    // Calculate tilt from orbital inclination
    const tilt = (rawPlanet.pl_orbincl || 0) * (Math.PI / 180);

    return {
        name: name,
        planetType: visuals.planetType || 'rocky',
        radius: radius,
        color: visuals.color || 0x888888,
        detailColor: visuals.detailColor || visuals.color || 0x666666,
        gasColors: visuals.gasColors,
        orbitRadius: visuals.orbitRadius || 100,
        orbitSpeed: visuals.orbitSpeed || 0.01,
        rotationSpeed: Math.max(0.003, Math.min(0.04, rotationSpeed)),
        tilt: tilt,
        description: getDescription(name, characteristics),
        // Include raw dataset values for reference
        datasetValues: {
            pl_rade: rawPlanet.pl_rade,
            pl_masse: rawPlanet.pl_masse,
            pl_eqt: rawPlanet.pl_eqt,
            pl_orbper: rawPlanet.pl_orbper,
            pl_orbsmax: rawPlanet.pl_orbsmax
        },
        aiData: {
            composition: characteristics.principal_material || 'Unknown',
            atmosphere: characteristics.atmosphere_type || 'Unknown',
            surfaceTemp: rawPlanet.pl_eqt ? `${rawPlanet.pl_eqt}K` : 'Unknown',
            realRadius: radiusInEarthRadii,
            habitability: characteristics.habitability_percent || 0,
            toxicity: characteristics.toxicity_percent || 0
        }
    };
}

/**
 * Generate description from characteristics
 */
function getDescription(name, characteristics) {
    const descriptions = {
        Mercury: 'The smallest planet in our solar system and closest to the Sun.',
        Venus: 'Second planet from the Sun, known for its thick toxic atmosphere.',
        Earth: 'Our home planet, the only known planet with life.',
        Mars: 'The Red Planet, target for future human exploration.',
        Jupiter: 'The largest planet in our solar system, a gas giant.',
        Saturn: 'Famous for its spectacular ring system.',
        Uranus: 'An ice giant that rotates on its side.',
        Neptune: 'The furthest planet from the Sun, a deep blue ice giant.'
    };
    return descriptions[name] || `Planet ${name}`;
}

// Fallback static data (used if JSON loading fails)
const PLANETS_DATA = [
    { name: 'Mercury', planetType: 'rocky', radius: 0.1915 * 0.5, color: 0x8c7853, detailColor: 0x6b5d4f, orbitRadius: 40, orbitSpeed: 0.02, rotationSpeed: 0.005, tilt: 0.034, description: 'The smallest planet in our solar system.', aiData: { composition: 'Rocky', atmosphere: 'Minimal', surfaceTemp: '440K', realRadius: 0.3829 } },
    { name: 'Venus', planetType: 'rocky', radius: 0.475 * 0.5, color: 0xffc649, detailColor: 0xe6b85c, orbitRadius: 60, orbitSpeed: 0.015, rotationSpeed: 0.003, tilt: 3.1, description: 'Second planet from the Sun.', aiData: { composition: 'Rocky', atmosphere: 'Thick CO2', surfaceTemp: '737K', realRadius: 0.9499 } },
    { name: 'Earth', planetType: 'rocky', radius: 0.5, color: 0x4a90e2, detailColor: 0x2d5aa8, orbitRadius: 80, orbitSpeed: 0.01, rotationSpeed: 0.02, tilt: 0.408, description: 'Our home planet.', aiData: { composition: 'Rocky', atmosphere: 'N2, O2', surfaceTemp: '288K', realRadius: 1.0 } },
    { name: 'Mars', planetType: 'rocky', radius: 0.266 * 0.5, color: 0xcd5c5c, detailColor: 0x8b3a3a, orbitRadius: 100, orbitSpeed: 0.008, rotationSpeed: 0.018, tilt: 0.440, description: 'The Red Planet.', aiData: { composition: 'Rocky', atmosphere: 'Thin CO2', surfaceTemp: '210K', realRadius: 0.532 } },
    { name: 'Jupiter', planetType: 'gasGiant', radius: 5.487, color: 0xc88b3a, gasColors: [0xc88b3a, 0xe6a85c, 0xf4d7a8, 0xd4a05a], orbitRadius: 140, orbitSpeed: 0.005, rotationSpeed: 0.04, tilt: 0.054, description: 'The largest planet.', aiData: { composition: 'Gas Giant', atmosphere: 'H, He', surfaceTemp: '165K', realRadius: 10.973 } },
    { name: 'Saturn', planetType: 'gasGiant', radius: 4.57, color: 0xfad5a5, gasColors: [0xfad5a5, 0xf4c78a, 0xe8b975, 0xd4a05a], orbitRadius: 180, orbitSpeed: 0.003, rotationSpeed: 0.038, tilt: 0.466, description: 'Famous for its rings.', aiData: { composition: 'Gas Giant', atmosphere: 'H, He', surfaceTemp: '134K', realRadius: 9.140 } },
    { name: 'Uranus', planetType: 'iceGiant', radius: 1.991, color: 0x4fd0e7, orbitRadius: 220, orbitSpeed: 0.002, rotationSpeed: 0.03, tilt: 1.706, description: 'An ice giant.', aiData: { composition: 'Ice Giant', atmosphere: 'H, He, CH4', surfaceTemp: '76K', realRadius: 3.981 } },
    { name: 'Neptune', planetType: 'iceGiant', radius: 1.933, color: 0x4169e1, orbitRadius: 260, orbitSpeed: 0.001, rotationSpeed: 0.032, tilt: 0.494, description: 'The furthest planet.', aiData: { composition: 'Ice Giant', atmosphere: 'H, He, CH4', surfaceTemp: '72K', realRadius: 3.865 } }
];

// Export both the loader function and fallback data
export { PLANETS_DATA };

/**
 * Example structure for exoplanet data integration
 */
export const EXOPLANET_TEMPLATE = {
    name: '',
    radius: 5,
    color: 0xffffff,
    orbitRadius: 100,
    orbitSpeed: 0.01,
    rotationSpeed: 0.01,
    tilt: 0,
    description: '',
    astronomicalData: {
        rightAscension: '',
        declination: '',
        distance: 0,
        hostStar: '',
        discoveryMethod: '',
        discoveryYear: null
    },
    aiData: {
        composition: '',
        atmosphere: '',
        surfaceTemp: '',
        habitability: '',
        mass: '',
        radius: ''
    }
};
