/**
 * Specialized texture generator for Solar System planets
 * Generates high-quality procedural textures with iconic features
 */

import * as THREE from 'three';

// Improved noise functions with interpolation for smoother textures
function noise2D(x, y) {
    const nx = x * 12.9898 + y * 78.233;
    const n = Math.sin(nx) * 43758.5453;
    return n - Math.floor(n);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function smoothStep(t) {
    return t * t * (3 - 2 * t);
}

function valueNoise(x, y) {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const f = x - i;
    const g = y - j;

    const u = smoothStep(f);
    const v = smoothStep(g);

    return lerp(
        lerp(noise2D(i, j), noise2D(i + 1, j), u),
        lerp(noise2D(i, j + 1), noise2D(i + 1, j + 1), u),
        v
    );
}

function fbm(x, y, octaves = 6) {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;

    for (let i = 0; i < octaves; i++) {
        value += amplitude * valueNoise(x * frequency, y * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }

    return value;
}

/**
 * Generate Earth texture with continents and oceans
 */
export function generateEarthTexture(size = 2048) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    // EXTREME CONTRAST & DETAIL: Realistic Earth-like terrain
    const deepOcean = new THREE.Color(0x000033);    // Almost black navy
    const shallowOcean = new THREE.Color(0x004488); // Deep blue
    const forestGreen = new THREE.Color(0x1a4d1a);  // Dark forest
    const grassland = new THREE.Color(0x3a7d3a);    // Vibrant green
    const desert = new THREE.Color(0xc2b280);       // Desert sand
    const mountain = new THREE.Color(0x4d3319);     // Rocky brown
    const tundra = new THREE.Color(0x7a8c7a);       // Grey-green tundra
    const iceColor = new THREE.Color(0xffffff);     // Pure white

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size;
            const ny = y / size;

            // Latitude (0 = equator, 1 = pole)
            const lat = Math.abs(ny - 0.5) * 2;

            // Continent shape - Medium frequency, high octaves for detail
            const continentNoise = fbm(nx * 3.5, ny * 3.5, 6);
            const isLand = continentNoise > 0.52;

            let color;

            // Polar ice caps
            if (lat > 0.86) {
                color = iceColor.clone().multiplyScalar(0.9 + fbm(nx * 10, ny * 10, 2) * 0.1);
            }
            // LAND
            else if (isLand) {
                const terrainNoise = fbm(nx * 12, ny * 12, 5);
                const elevationNoise = fbm(nx * 6, ny * 6, 4);

                // Mountains
                if (elevationNoise > 0.72) {
                    color = mountain.clone().lerp(iceColor, Math.max(0, (elevationNoise - 0.8) * 5));
                }
                // Deserts (near equator and in rain shadows)
                else if ((lat < 0.4 && terrainNoise > 0.6) || (lat < 0.25)) {
                    color = desert.clone().multiplyScalar(0.9 + terrainNoise * 0.2);
                }
                // Tundra/Boreal (high latitudes)
                else if (lat > 0.6) {
                    color = tundra.clone().lerp(forestGreen, 1.0 - (lat - 0.6) * 2.5);
                }
                // Grassland/Forest
                else {
                    color = forestGreen.clone().lerp(grassland, terrainNoise);
                }

                // Subtle shading based on terrain
                color.multiplyScalar(0.8 + terrainNoise * 0.3);
            }
            // OCEAN
            else {
                const depthNoise = fbm(nx * 5, ny * 5, 3);

                // Shallow water near coasts
                const distToCoast = Math.abs(continentNoise - 0.52) * 10;
                if (distToCoast < 1.0) {
                    color = shallowOcean.clone().lerp(new THREE.Color(0x4488aa), 1.0 - distToCoast);
                } else {
                    color = deepOcean.clone().lerp(shallowOcean, depthNoise * 0.5);
                }
            }

            const index = (y * size + x) * 4;
            data[index] = color.r * 255;
            data[index + 1] = color.g * 255;
            data[index + 2] = color.b * 255;
            data[index + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

/**
 * Generate Earth specular map (for ocean reflections)
 */
export function generateEarthSpecularMap(size = 2048) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size;
            const ny = y / size;

            const lat = Math.abs(ny - 0.5) * 2;
            const continentNoise = fbm(nx * 3.5, ny * 3.5, 6);
            const isLand = continentNoise > 0.52;
            const isPole = lat > 0.86;

            // PBR Map Logic:
            // Roughness: Land = HIGH, Ocean = LOW
            // Metalness: All = low (or water slightly higher for sky reflections)
            const roughness = (isLand || isPole) ? 255 : 40; // High for land/ice, low for water
            const metalness = (isLand || isPole) ? 0 : 50;   // No metal for land, some for water reflectivity

            const index = (y * size + x) * 4;
            data[index] = 0;              // R = Unused (AO)
            data[index + 1] = roughness;  // G = Roughness
            data[index + 2] = metalness;  // B = Metalness
            data[index + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return new THREE.CanvasTexture(canvas);
}

/**
 * Generate Mars texture with polar ice caps
 */
export function generateMarsTexture(size = 2048) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    const baseRed = new THREE.Color(0xbc2732);
    const darkRed = new THREE.Color(0x8b4513);
    const iceColor = new THREE.Color(0xffffff);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size;
            const ny = y / size;

            const lat = Math.abs(ny - 0.5) * 2;

            let color;
            if (lat > 0.88) {
                // Polar ice caps
                color = iceColor.clone();
                // Add some red dust mixed in
                color.lerp(baseRed, 0.1 + fbm(nx * 20, ny * 20, 2) * 0.2);
            } else {
                // Mars surface with variation
                const noise = fbm(nx * 8, ny * 8, 5);
                color = baseRed.clone().lerp(darkRed, noise);
                // Dark albedo features (ancient valleys)
                const darkFeature = fbm(nx * 4, ny * 4, 3);
                if (darkFeature > 0.7) {
                    color.multiplyScalar(0.6);
                }
            }

            const index = (y * size + x) * 4;
            data[index] = color.r * 255;
            data[index + 1] = color.g * 255;
            data[index + 2] = color.b * 255;
            data[index + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

/**
 * Generate Jupiter texture with Great Red Spot and banding
 */
export function generateJupiterTexture(size = 2048) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    const cream = new THREE.Color(0xf4e4c1);
    const orange = new THREE.Color(0xe8a854);
    const brown = new THREE.Color(0x8c471e);
    const red = new THREE.Color(0xbc2732);

    // Great Red Spot position (southern hemisphere, around 22°S)
    const grsX = 0.4; // Longitude
    const grsY = 0.61; // Latitude (slightly south of equator)
    const grsWidth = 0.12;
    const grsHeight = 0.08;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size;
            const ny = y / size;

            // Horizontal banding
            const bandValue = Math.sin(ny * Math.PI * 12 + fbm(nx * 2, ny * 2, 3) * 3);
            const turbulence = fbm(nx * 8, ny * 8, 4);

            // Base color from bands
            let color;
            if (bandValue > 0.6) {
                color = cream.clone();
            } else if (bandValue > 0.2) {
                color = orange.clone();
            } else if (bandValue > -0.3) {
                color = cream.clone().lerp(brown, 0.3);
            } else {
                color = brown.clone();
            }

            // Add turbulence
            color.multiplyScalar(0.75 + turbulence * 0.5);

            // Great Red Spot
            const dx = (nx - grsX) / grsWidth;
            const dy = (ny - grsY) / grsHeight;
            const distToSpot = Math.sqrt(dx * dx + dy * dy);

            if (distToSpot < 1.0) {
                const spotIntensity = 1.0 - distToSpot;
                const spotNoise = fbm(nx * 20, ny * 20, 3);
                const spotColor = red.clone().lerp(orange, 0.3 + spotNoise * 0.3);
                color.lerp(spotColor, spotIntensity * 0.9);
            }

            const index = (y * size + x) * 4;
            data[index] = color.r * 255;
            data[index + 1] = color.g * 255;
            data[index + 2] = color.b * 255;
            data[index + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

/**
 * Generate Saturn texture with subtle banding
 */
export function generateSaturnTexture(size = 2048) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    const paleYellow = new THREE.Color(0xead6b8);
    const cream = new THREE.Color(0xf5deb3);
    const tan = new THREE.Color(0xa08f70);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size;
            const ny = y / size;

            // Subtle horizontal banding (less dramatic than Jupiter)
            const bandValue = Math.sin(ny * Math.PI * 8 + fbm(nx * 1.5, ny * 1.5, 2) * 1.5);

            let color;
            if (bandValue > 0.3) {
                color = cream.clone();
            } else if (bandValue > -0.3) {
                color = paleYellow.clone();
            } else {
                color = tan.clone();
            }

            // Very subtle texture
            const texture = fbm(nx * 6, ny * 6, 3);
            color.multiplyScalar(0.85 + texture * 0.3);

            const index = (y * size + x) * 4;
            data[index] = color.r * 255;
            data[index + 1] = color.g * 255;
            data[index + 2] = color.b * 255;
            data[index + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

/**
 * Generate enhanced Saturn ring texture with divisions
 */
export function generateSaturnRingTexture(size = 2048) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = 1; // 1D texture
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(size, 1);
    const data = imageData.data;

    const dustyGold = new THREE.Color(0xcdba96);
    const brownGrey = new THREE.Color(0x8b7d6b);
    const darkGap = new THREE.Color(0x2a2a2a);

    for (let x = 0; x < size; x++) {
        const nx = x / size; // 0 to 1 from inner to outer edge

        let color;
        let alpha = 0.8;

        // Ring structure:
        // D Ring: 0.0 - 0.12 (very faint)
        // C Ring: 0.12 - 0.25 (translucent)
        // Cassini Division: 0.25 - 0.28 (gap)
        // B Ring: 0.28 - 0.60 (brightest, densest)
        // A Ring: 0.60 - 0.85 (bright)
        // Encke Gap: 0.73 - 0.75 (small gap in A ring)
        // F Ring: 0.90 - 0.92 (thin, faint)

        if (nx < 0.12) {
            // D Ring - very faint
            color = darkGap.clone().lerp(dustyGold, 0.2);
            alpha = 0.15;
        } else if (nx < 0.25) {
            // C Ring - translucent
            color = brownGrey.clone();
            alpha = 0.3 + noise2D(nx * 50, 0) * 0.2;
        } else if (nx >= 0.25 && nx < 0.28) {
            // Cassini Division - major gap
            color = darkGap.clone();
            alpha = 0.05;
        } else if (nx >= 0.28 && nx < 0.60) {
            // B Ring - brightest and densest
            color = dustyGold.clone().lerp(brownGrey, noise2D(nx * 100, 0) * 0.4);
            alpha = 0.95;
        } else if (nx >= 0.60 && nx < 0.85) {
            // A Ring - bright
            // Encke Gap at 0.73-0.75
            if (nx >= 0.73 && nx < 0.75) {
                color = darkGap.clone();
                alpha = 0.1;
            } else {
                color = dustyGold.clone();
                alpha = 0.7 + noise2D(nx * 80, 0) * 0.2;
            }
        } else if (nx >= 0.90 && nx < 0.92) {
            // F Ring - thin outer ring
            color = dustyGold.clone();
            alpha = 0.4;
        } else {
            // Empty space
            color = darkGap.clone();
            alpha = 0;
        }

        // Add fine variations
        const variation = noise2D(nx * 200, 0);
        color.multiplyScalar(0.8 + variation * 0.4);

        const index = x * 4;
        data[index] = color.r * 255;
        data[index + 1] = color.g * 255;
        data[index + 2] = color.b * 255;
        data[index + 3] = alpha * 255;
    }

    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

/**
 * Generate Neptune texture with dark spots
 */
export function generateNeptuneTexture(size = 1024) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    const deepBlue = new THREE.Color(0x2e308e);
    const azureBlue = new THREE.Color(0x5b5ddf);
    const darkSpot = new THREE.Color(0x1a1a3a);

    // Great Dark Spot position
    const spotX = 0.35;
    const spotY = 0.4;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size;
            const ny = y / size;

            // Subtle banding
            const bandValue = Math.sin(ny * Math.PI * 6 + fbm(nx * 2, ny * 2, 2) * 2);
            let color = deepBlue.clone().lerp(azureBlue, (bandValue + 1) * 0.5);

            // Add cloud variation
            const clouds = fbm(nx * 10, ny * 10, 4);
            color.multiplyScalar(0.8 + clouds * 0.4);

            // Great Dark Spot
            const dx = (nx - spotX) * 2;
            const dy = (ny - spotY) * 3;
            const distToSpot = Math.sqrt(dx * dx + dy * dy);
            if (distToSpot < 0.3) {
                const spotIntensity = (0.3 - distToSpot) / 0.3;
                color.lerp(darkSpot, spotIntensity * 0.6);
            }

            const index = (y * size + x) * 4;
            data[index] = color.r * 255;
            data[index + 1] = color.g * 255;
            data[index + 2] = color.b * 255;
            data[index + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

/**
 * Generate Uranus texture (nearly featureless pale cyan)
 */
export function generateUranusTexture(size = 1024) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    const paleCyan = new THREE.Color(0xd1e7e7);
    const cyan = new THREE.Color(0x88b0c3);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size;
            const ny = y / size;

            // Very subtle variation
            const variation = fbm(nx * 3, ny * 3, 3);
            const color = paleCyan.clone().lerp(cyan, variation * 0.15);

            const index = (y * size + x) * 4;
            data[index] = color.r * 255;
            data[index + 1] = color.g * 255;
            data[index + 2] = color.b * 255;
            data[index + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

/**
 * Generate Venus texture (uniform yellow-white clouds)
 */
export function generateVenusTexture(size = 1024) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    const yellowWhite = new THREE.Color(0xe3bb76);
    const gold = new THREE.Color(0xd4af37);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size;
            const ny = y / size;

            // Y-shaped cloud pattern (subtle)
            const yPattern = Math.abs(Math.sin((nx - ny) * Math.PI * 4));
            const clouds = fbm(nx * 4, ny * 4, 4);

            let color = yellowWhite.clone().lerp(gold, clouds * 0.3);
            color.multiplyScalar(0.85 + yPattern * 0.15);

            const index = (y * size + x) * 4;
            data[index] = color.r * 255;
            data[index + 1] = color.g * 255;
            data[index + 2] = color.b * 255;
            data[index + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}
