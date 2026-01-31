import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Classification rules
function classifyPlanet(radius) {
    if (radius === null || radius === undefined) return 'Unknown'; // Keep unknowns separate
    if (radius > 6) return 'Gas Giant';
    if (radius >= 3 && radius <= 6) return 'Ice Giant';
    if (radius >= 1.5 && radius < 3) return 'Super-Earth';
    if (radius >= 1.0 && radius < 1.5) return 'Earth-Sized';
    if (radius < 1.0) return 'Sub-Earth';
    return 'Unknown';
}

function getTempCategory(k) {
    if (!k) return 'Unknown Temp';
    if (k > 1000) return 'Hot';
    if (k >= 350) return 'Warm';
    if (k >= 200) return 'Temperate';
    return 'Cold';
}

async function generateList() {
    const clusterDir = path.join(__dirname, 'nasa_data', 'clusters');

    // Get all JSON files
    let files = [];
    if (fs.existsSync(clusterDir)) {
        files = fs.readdirSync(clusterDir).filter(file =>
            file.endsWith('.json') && file !== 'cluster_index.json'
        );
    }

    const planetsByUserCategory = {
        'Gas Giant': [],
        'Ice Giant': [],
        'Super-Earth': [],
        'Earth-Sized': [],
        'Sub-Earth': [],
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
                    planetsByUserCategory[cat].push({
                        name: p.pl_name,
                        radius: p.pl_rade,
                        temp: p.pl_eqt,
                        tempCat: getTempCategory(p.pl_eqt)
                    });
                    totalCount++;
                });
            }
        } catch (err) {
            console.error(`Error reading ${file}`);
        }
    }

    // Also include Solar System
    const solPath = path.join(__dirname, 'nasa_data', 'solar_system.json');
    if (fs.existsSync(solPath)) {
        const sol = JSON.parse(fs.readFileSync(solPath, 'utf8'));
        sol.forEach(p => {
            const cat = classifyPlanet(p.pl_rade);
            planetsByUserCategory[cat].push({
                name: p.pl_name,
                radius: p.pl_rade,
                temp: p.pl_eqt,
                tempCat: getTempCategory(p.pl_eqt)
            });
            totalCount++;
        });
    }

    // Sort lists by name
    for (const key in planetsByUserCategory) {
        planetsByUserCategory[key].sort((a, b) => a.name.localeCompare(b.name));
    }

    // Generate Markdown Content
    let mdContent = `# Planet Classification List 🪐\n\n`;
    mdContent += `**Total Planets Analyzed:** ${totalCount}\n\n`;

    mdContent += `## Classification Rules used:\n`;
    mdContent += `- **Gas Giant:** > 6.0 Earth Radii (R⊕)\n`;
    mdContent += `- **Ice Giant:** 3.0 - 6.0 R⊕\n`;
    mdContent += `- **Super-Earth:** 1.5 - 3.0 R⊕\n`;
    mdContent += `- **Earth-Sized:** 1.0 - 1.5 R⊕\n`;
    mdContent += `- **Sub-Earth:** < 1.0 R⊕\n\n`;

    mdContent += `---\n\n`;

    for (const [category, list] of Object.entries(planetsByUserCategory)) {
        mdContent += `## ${category} (${list.length})\n\n`;
        if (list.length === 0) {
            mdContent += `*No planets found in this category.*\n\n`;
            continue;
        }

        mdContent += `| Planet Name | Radius (R⊕) | Temp (K) | Temp Category |\n`;
        mdContent += `|-------------|-------------|----------|---------------|\n`;

        // Limit to 500 per category to keep file size reasonable? 
        // User asked for "complete list", but 2200 lines might be big. 
        // Let's do ALL of them. Markdown handles 10k lines fine.

        list.forEach(p => {
            const rad = p.radius !== undefined && p.radius !== null ? p.radius + ' R⊕' : 'N/A';
            const t = p.temp ? p.temp + ' K' : 'N/A';
            mdContent += `| ${p.name} | ${rad} | ${t} | ${p.tempCat} |\n`;
        });
        mdContent += `\n`;
    }

    fs.writeFileSync('PLANET_CLASSIFICATION_LIST.md', mdContent);
    console.log('PLANET_CLASSIFICATION_LIST.md generated successfully.');
}

generateList();
