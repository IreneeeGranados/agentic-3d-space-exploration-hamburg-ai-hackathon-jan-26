import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Classification rules
function classifyPlanet(radius) {
    if (!radius) return 'Unknown';
    if (radius > 6) return 'Gas Giant';
    if (radius >= 3 && radius <= 6) return 'Ice Giant';
    if (radius >= 1.5 && radius < 3) return 'Super-Earth';
    if (radius < 1.0) return 'Sub-Earth';
    return 'Earth-sized';
}

async function analyze() {
    const clusterDir = path.join(__dirname, 'nasa_data', 'clusters');

    // Get all JSON files in the clusters directory
    let files = [];
    if (fs.existsSync(clusterDir)) {
        files = fs.readdirSync(clusterDir).filter(file =>
            file.endsWith('.json') &&
            file !== 'cluster_index.json' // Skip index, read raw data
        );
    }

    console.log(`Found ${files.length} data files to analyze...`);

    const planetsByUserCategory = {
        'Gas Giant': [],
        'Ice Giant': [],
        'Super-Earth': [],
        'Sub-Earth': [],
        'Earth-sized': [],
        'Unknown': []
    };

    let totalCount = 0;

    for (const file of files) {
        const filePath = path.join(clusterDir, file);
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (Array.isArray(data)) {
                data.forEach(p => {
                    const cat = classifyPlanet(p.pl_rade);

                    // Only store if we have minimal valid data (radius is key here)
                    if (p.pl_rade !== null && p.pl_rade !== undefined) {
                        planetsByUserCategory[cat].push({
                            name: p.pl_name,
                            radius: p.pl_rade,
                            temp: p.pl_eqt || 'N/A'
                        });
                        totalCount++;
                    } else {
                        planetsByUserCategory['Unknown'].push({
                            name: p.pl_name,
                            radius: 'N/A',
                            temp: p.pl_eqt || 'N/A'
                        });
                        totalCount++;
                    }
                });
            }
        } catch (err) {
            console.error(`Error reading ${file}: ${err.message}`);
        }
    }

    console.log(`\nAnalyzed ${totalCount} planets across all files.\n`);

    for (const [category, list] of Object.entries(planetsByUserCategory)) {
        console.log(`### ${category} (${list.length})`);

        // Pick better examples if possible (prioritize ones with temp)
        const examples = list.filter(p => p.temp !== 'N/A').slice(0, 5);
        if (examples.length < 5) {
            examples.push(...list.filter(p => p.temp === 'N/A').slice(0, 5 - examples.length));
        }

        examples.forEach(p => {
            console.log(`- ${p.name}: Radius ${p.radius} R⊕, Temp ${p.temp} K`);
        });
        if (list.length > 5) console.log(`... and ${list.length - 5} more`);
        console.log('');
    }
}

analyze();
