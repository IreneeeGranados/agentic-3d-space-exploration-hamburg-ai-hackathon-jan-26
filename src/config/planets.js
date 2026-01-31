/**
 * Solar System Planets configuration and data loader
 */

/**
 * Loads solar system planets from the local JSON dataset
 * @returns {Promise<Array>} Array of planet configuration objects
 */
export async function loadSolarSystemPlanets() {
    try {
        const response = await fetch('nasa_data/clusters/solar_system.json');
        if (!response.ok) {
            throw new Error(`Failed to load solar system planets: ${response.status}`);
        }

        const data = await response.json();

        // Map the dataset format to the internal Planet class format
        return data.map(p => ({
            name: p.pl_name,
            planetType: p.characteristics?.principal_material?.toLowerCase().includes('gas') ? 'gasGiant' :
                p.characteristics?.principal_material?.toLowerCase().includes('ice') ? 'iceGiant' : 'rocky',
            radius: p.pl_rade * 5, // Scale for visibility
            color: p.pl_name === 'Mars' ? 0xff4400 :
                p.pl_name === 'Jupiter' ? 0xccaa88 :
                    p.pl_name === 'Saturn' ? 0xeedd88 :
                        p.pl_name === 'Uranus' ? 0x88ddff :
                            p.pl_name === 'Neptune' ? 0x4444ff :
                                p.pl_name === 'Venus' ? 0xffcc88 :
                                    p.pl_name === 'Mercury' ? 0xaaaaaa : 0x0088ff,
            position: {
                x: p.position.x * 200, // Scale orbit distance
                y: p.position.y * 200,
                z: p.position.z * 200
            },
            atmosphere: {
                enabled: p.characteristics?.atmosphere_type !== 'None',
                color: p.pl_name === 'Earth' ? 0x4a90e2 : (p.pl_name === 'Mars' ? 0xaa4422 : 0xaaaaaa),
                density: 0.1,
                hasClouds: ['Earth', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Venus'].includes(p.pl_name)
            },
            rings: {
                enabled: p.pl_name === 'Saturn',
                innerRadius: 1.4,
                outerRadius: 2.4,
                color1: 0x8c7853,
                color2: 0x4a4a4a
            },
            aiData: {
                habitability: p.pl_name === 'Earth' ? 100 : 0
            },
            isSolar: true,
            pl_name: p.pl_name,
            characteristics: p.characteristics
        }));
    } catch (error) {
        console.error('Error loading solar system planets:', error);
        return [];
    }
}
