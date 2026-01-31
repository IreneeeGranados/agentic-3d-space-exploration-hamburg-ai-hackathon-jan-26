import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function countPlanets() {
    const clusterDir = path.join(__dirname, 'nasa_data', 'clusters');

    let totalCount = 0;

    // Check main cluster index first
    const indexFile = path.join(clusterDir, 'cluster_index.json');
    if (fs.existsSync(indexFile)) {
        const index = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
        console.log(`Cluster Index says: ${index.total_planets} planets`);
    }

    // Iterate all files to get actual raw count
    const files = fs.readdirSync(clusterDir).filter(f => f.endsWith('.json') && f !== 'cluster_index.json');

    console.log(`\nChecking ${files.length} cluster files...`);

    for (const file of files) {
        const filePath = path.join(clusterDir, file);
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (Array.isArray(data)) {
                console.log(`- ${file}: ${data.length} planets`);
                totalCount += data.length;
            }
        } catch (err) {
            console.error(`- ${file}: ERROR ${err.message}`);
        }
    }

    // Add solar system (in parent dir usually, but check current location)
    const solFile = path.join(__dirname, 'nasa_data', 'solar_system.json');
    if (fs.existsSync(solFile)) {
        const sol = JSON.parse(fs.readFileSync(solFile, 'utf8'));
        console.log(`- solar_system.json: ${sol.length} planets`);
        totalCount += sol.length;
    }

    console.log(`\nTOTAL RAW PLANETS FOUND: ${totalCount}`);
}

countPlanets();
