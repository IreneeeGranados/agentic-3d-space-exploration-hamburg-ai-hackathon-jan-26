import * as THREE from 'three';

// Texture cache to prevent redundant generation
const textureCache = new Map();

// --- Worker Setup ---

// Create worker instance using a relative path that works with Vite/Webpack
const workerURL = new URL('../workers/textureWorker.js', import.meta.url);
const worker = new Worker(workerURL, { type: 'module' });

// Promise map for worker responses
const workerPromises = new Map();
let nextMessageId = 0;

// Handle messages from the worker
worker.onmessage = function (e) {
    const { id, success, data, width, height, error } = e.data;

    if (workerPromises.has(id)) {
        const { resolve, reject } = workerPromises.get(id);
        workerPromises.delete(id);

        if (success) {
            // Create DataTexture from the raw buffer
            // format is RGBA (4 channels)
            const texture = new THREE.DataTexture(
                data,
                width,
                height,
                THREE.RGBAFormat,
                THREE.UnsignedByteType
            );

            texture.needsUpdate = true;
            resolve(texture);
        } else {
            console.error('Texture worker error:', error);
            reject(new Error(error));
        }
    }
};

/**
 * Send a task to the worker
 */
function runWorkerTask(type, params) {
    const id = nextMessageId++;
    return new Promise((resolve, reject) => {
        workerPromises.set(id, { resolve, reject });
        worker.postMessage({ id, type, params });
    });
}

// --- Helper Functions ---

/**
 * Helper to round colors for better cache hit rates
 */
function getCacheKey(type, params) {
    return `${type}_${JSON.stringify(params)}`;
}

/**
 * Helper to get color based on composition, temperature, radius and mass
 * This function ensures ALL planets get interesting, vibrant colors
 */
export function getColorByComposition(composition, temperature, radius = 1.0, mass = 1.0) {
    const comp = (composition || '').toLowerCase();
    const temp = temperature || 300; // Default to Earth-like temp

    // 1. Extreme Heat (Lava/Molten Worlds) - temp > 1200K
    if (temp > 1200) {
        if (comp.includes('gas') || comp.includes('hydrogen')) {
            // Hot Jupiter - ultra hot gas giant
            return { base: 0xf97316, detail: 0xfcd34d, atmosphere: 0xfbbf24 }; // Orange/Gold
        }
        // Lava worlds
        const lavaColors = [
            { base: 0x1f1f1f, detail: 0xff4500, atmosphere: 0xff6347 }, // Black with lava
            { base: 0x2d1810, detail: 0xff5722, atmosphere: 0xff7043 }, // Dark brown with orange
            { base: 0x1a0a0a, detail: 0xdc2626, atmosphere: 0xef4444 }, // Magma red
        ];
        return lavaColors[Math.floor(temp % lavaColors.length)];
    }

    // 2. Very Hot (700-1200K) - Scorched worlds
    if (temp > 700) {
        if (comp.includes('gas') || comp.includes('hydrogen')) {
            return { base: 0xea580c, detail: 0xfb923c, atmosphere: 0xfed7aa }; // Warm orange gas giant
        }
        // Scorched rocky
        const scorchedColors = [
            { base: 0x78350f, detail: 0xb45309, atmosphere: 0xd97706 }, // Brown scorched
            { base: 0x44403c, detail: 0x78716c, atmosphere: 0xa8a29e }, // Dark gray
            { base: 0x7c2d12, detail: 0xea580c, atmosphere: 0xf97316 }, // Rust orange
        ];
        return scorchedColors[Math.floor((temp + mass * 10) % scorchedColors.length)];
    }

    // 3. Warm Worlds (400-700K) - Venus-like
    if (temp > 400) {
        if (comp.includes('gas') || comp.includes('hydrogen')) {
            return { base: 0xd4a574, detail: 0xe6c89a, atmosphere: 0xf5e6d3 }; // Warm tan gas giant
        }
        const venusColors = [
            { base: 0xfcd34d, detail: 0xfef08a, atmosphere: 0xfef9c3 }, // Yellow/Sulfur
            { base: 0xd97706, detail: 0xfbbf24, atmosphere: 0xfde68a }, // Amber
            { base: 0xca8a04, detail: 0xeab308, atmosphere: 0xfacc15 }, // Gold
            { base: 0xdc8850, detail: 0xe8a472, atmosphere: 0xf4c494 }, // Peach/Tan
        ];
        return venusColors[Math.floor((temp * radius) % venusColors.length)];
    }

    // 4. Gas Giants (Large radius > 5 Earth radii) regardless of temp
    if (radius > 5 || comp.includes('gas') || comp.includes('hydrogen') || comp.includes('helium')) {
        if (temp < 100) {
            // Cold gas giant - blues and cyans
            const coldGasColors = [
                { base: 0x0891b2, detail: 0x22d3ee, atmosphere: 0x67e8f9 }, // Cyan
                { base: 0x0284c7, detail: 0x38bdf8, atmosphere: 0x7dd3fc }, // Sky blue
                { base: 0x4f46e5, detail: 0x818cf8, atmosphere: 0xa5b4fc }, // Indigo
            ];
            return coldGasColors[Math.floor((temp + mass) % coldGasColors.length)];
        }
        // Standard gas giants - Jupiter/Saturn style
        const gasColors = [
            { base: 0xc88b3a, detail: 0xe6a85c, atmosphere: 0xf4d7a8 }, // Jupiter tan
            { base: 0xd4a574, detail: 0xeecba8, atmosphere: 0xfef3e2 }, // Saturn cream
            { base: 0xb45309, detail: 0xd97706, atmosphere: 0xfbbf24 }, // Orange giant
            { base: 0x92400e, detail: 0xb45309, atmosphere: 0xd97706 }, // Brown giant
            { base: 0x9f7e5a, detail: 0xc4a77d, atmosphere: 0xe8d0a0 }, // Beige giant
        ];
        return gasColors[Math.floor((temp + radius * 3) % gasColors.length)];
    }

    // 5. Ice Giants / Neptune-like (medium-large with ice/methane)
    if (radius > 3 || comp.includes('ice') || comp.includes('methane') || comp.includes('ammonia')) {
        const iceColors = [
            { base: 0x06b6d4, detail: 0x22d3ee, atmosphere: 0x67e8f9 }, // Cyan/Turquoise
            { base: 0x0ea5e9, detail: 0x38bdf8, atmosphere: 0x7dd3fc }, // Light blue
            { base: 0x2563eb, detail: 0x60a5fa, atmosphere: 0x93c5fd }, // Blue
            { base: 0x7c3aed, detail: 0xa78bfa, atmosphere: 0xc4b5fd }, // Purple
            { base: 0x0891b2, detail: 0x14b8a6, atmosphere: 0x2dd4bf }, // Teal
        ];
        return iceColors[Math.floor((temp + radius * 5) % iceColors.length)];
    }

    // 6. Water Worlds / Ocean Planets
    if (comp.includes('water') || comp.includes('ocean') || comp.includes('liquid')) {
        const waterColors = [
            { base: 0x0369a1, detail: 0x0284c7, atmosphere: 0x38bdf8 }, // Deep ocean
            { base: 0x0e7490, detail: 0x06b6d4, atmosphere: 0x22d3ee }, // Teal ocean
            { base: 0x047857, detail: 0x059669, atmosphere: 0x34d399 }, // Emerald sea
            { base: 0x1e40af, detail: 0x3b82f6, atmosphere: 0x60a5fa }, // Blue ocean
        ];
        return waterColors[Math.floor((temp + mass * 7) % waterColors.length)];
    }

    // 7. Earth-like / Habitable Zone (250-350K)
    if (temp > 250 && temp < 350) {
        const habitableColors = [
            { base: 0x16a34a, detail: 0x22c55e, atmosphere: 0x4ade80 }, // Green/Forest
            { base: 0x0d9488, detail: 0x14b8a6, atmosphere: 0x2dd4bf }, // Teal/Tropical
            { base: 0x2563eb, detail: 0x22c55e, atmosphere: 0x60a5fa }, // Blue/Green
            { base: 0x059669, detail: 0x0891b2, atmosphere: 0x34d399 }, // Emerald
            { base: 0x65a30d, detail: 0x84cc16, atmosphere: 0xa3e635 }, // Lime/Grassland
        ];
        return habitableColors[Math.floor((temp + radius * 11) % habitableColors.length)];
    }

    // 8. Cold Rocky Worlds (temp < 200K)
    if (temp < 200) {
        const coldColors = [
            { base: 0x94a3b8, detail: 0xcbd5e1, atmosphere: 0xe2e8f0 }, // Silver/Gray
            { base: 0x6b7280, detail: 0x9ca3af, atmosphere: 0xd1d5db }, // Steel gray
            { base: 0xe0f2fe, detail: 0xbae6fd, atmosphere: 0x7dd3fc }, // Ice white-blue
            { base: 0xc7d2fe, detail: 0xa5b4fc, atmosphere: 0x818cf8 }, // Lavender ice
            { base: 0xddd6fe, detail: 0xc4b5fd, atmosphere: 0xa78bfa }, // Purple ice
        ];
        return coldColors[Math.floor((temp + radius * 13) % coldColors.length)];
    }

    // 9. Standard Rocky Planets (200-400K range we haven't covered)
    if (comp.includes('iron') || comp.includes('metal')) {
        return { base: 0x57534e, detail: 0x78716c, atmosphere: 0xa8a29e }; // Metallic gray
    }
    if (comp.includes('silicates') || comp.includes('rocky') || comp.includes('rock')) {
        const rockyColors = [
            { base: 0x78716c, detail: 0xa8a29e, atmosphere: 0xd6d3d1 }, // Gray rock
            { base: 0x8b5cf6, detail: 0xa78bfa, atmosphere: 0xc4b5fd }, // Purple mineral
            { base: 0xb45309, detail: 0xd97706, atmosphere: 0xfbbf24 }, // Orange/Mars-like
            { base: 0x92400e, detail: 0xb45309, atmosphere: 0xd97706 }, // Rust
            { base: 0x854d0e, detail: 0xa16207, atmosphere: 0xca8a04 }, // Brown rock
        ];
        return rockyColors[Math.floor((temp + radius * 17) % rockyColors.length)];
    }
    if (comp.includes('sulfur')) {
        return { base: 0xeab308, detail: 0xfacc15, atmosphere: 0xfef08a }; // Io-like yellow
    }
    if (comp.includes('carbon')) {
        return { base: 0x1c1917, detail: 0x44403c, atmosphere: 0x57534e }; // Dark carbon world
    }

    // 10. DEFAULT - Generate a unique color based on ALL parameters
    // This ensures NO planet gets a boring white/gray color
    const hue = ((temp * 0.5 + radius * 50 + mass * 30) % 360);
    const saturation = 0.5 + (radius % 5) * 0.1; // 50-100% saturation
    const lightness = 0.35 + (temp % 200) / 600; // 35-68% lightness

    // Convert HSL to colors
    const baseColor = new THREE.Color();
    baseColor.setHSL(hue / 360, saturation, lightness);
    const detailColor = new THREE.Color();
    detailColor.setHSL((hue + 30) / 360, saturation * 0.8, lightness + 0.15);
    const atmosphereColor = new THREE.Color();
    atmosphereColor.setHSL((hue + 15) / 360, saturation * 0.6, lightness + 0.25);

    return {
        base: baseColor.getHex(),
        detail: detailColor.getHex(),
        atmosphere: atmosphereColor.getHex()
    };
}


// --- Async Generators (Web Worker) ---

/**
 * Generate a rocky planet texture (Async)
 */
export async function generateRockyTextureAsync(baseColor, detailColor, size = 512) {
    const cacheKey = getCacheKey('rocky', { baseColor, detailColor, size });
    if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

    try {
        const texture = await runWorkerTask('rocky', { baseColor, detailColor, size });
        texture.colorSpace = THREE.SRGBColorSpace;
        textureCache.set(cacheKey, texture);
        return texture;
    } catch (e) {
        console.error('Worker failed, falling back to sync', e);
        // Fallback? Or just throw? For now let's hope it works.
        // If we needed fallback, we'd implemented sync generation here.
        throw e;
    }
}

/**
 * Generate a gas giant texture (Async)
 */
export async function generateGasGiantTextureAsync(colors, size = 512) {
    const cacheKey = getCacheKey('gas', { colors, size });
    if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

    const texture = await runWorkerTask('gas', { colors, size });
    texture.colorSpace = THREE.SRGBColorSpace;
    textureCache.set(cacheKey, texture);
    return texture;
}

/**
 * Generate an ice giant texture (Async)
 */
export async function generateIceGiantTextureAsync(baseColor, size = 512) {
    const cacheKey = getCacheKey('ice', { baseColor, size });
    if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

    const texture = await runWorkerTask('ice', { baseColor, size });
    texture.colorSpace = THREE.SRGBColorSpace;
    textureCache.set(cacheKey, texture);
    return texture;
}

/**
 * Generate a normal map (Async)
 */
export async function generateNormalMapAsync(size = 512, strength = 1.0) {
    const texture = await runWorkerTask('normal', { size, strength });
    // Normal maps are usually linear (non-sRGB)
    return texture;
}


// --- Legacy / Synchronous Generators (Keep for compatibility/small textures) ---

function noise2D(x, y) {
    const nx = x * 12.9898 + y * 78.233;
    const n = Math.sin(nx) * 43758.5453;
    return n - Math.floor(n);
}

function fbm(x, y, octaves = 6) {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;

    for (let i = 0; i < octaves; i++) {
        // Add domain warping for more organic patterns
        const ox = noise2D(x * frequency, y * frequency) * 0.1;
        const oy = noise2D(x * frequency + 1.2, y * frequency + 3.4) * 0.1;

        value += amplitude * noise2D(x * frequency + ox, y * frequency + oy);
        frequency *= 2.1;
        amplitude *= 0.5;
    }

    return value;
}

/**
 * Generate a rocky planet texture (Sync)
 */
export function generateRockyTexture(baseColor, detailColor, size = 512) {
    const cacheKey = getCacheKey('rocky_sync', { baseColor, detailColor, size });
    if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    const base = new THREE.Color(baseColor);
    const detail = new THREE.Color(detailColor);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size;
            const ny = y / size;

            const noiseValue = fbm(nx * 4, ny * 4, 5);
            const color = base.clone().lerp(detail, noiseValue);

            const index = (y * size + x) * 4;
            data[index] = color.r * 255;
            data[index + 1] = color.g * 255;
            data[index + 2] = color.b * 255;
            data[index + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    textureCache.set(cacheKey, texture);
    return texture;
}

/**
 * Generate a gas giant texture (Sync)
 */
export function generateGasGiantTexture(colors, size = 512) {
    const cacheKey = getCacheKey('gas_sync', { colors, size });
    if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    // Convert hex integers to Color objects
    const colorObjs = colors.map(c => new THREE.Color(c));

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size;
            const ny = y / size;

            // Horizontal bands
            const bandValue = Math.sin(ny * Math.PI * 8 + fbm(nx * 2, ny * 2, 3) * 2);
            const colorIndex = Math.floor((bandValue + 1) * 0.5 * (colorObjs.length - 1));
            const c = colorObjs[Math.min(colorIndex, colorObjs.length - 1)].clone();

            // Turbulence
            const turbulence = fbm(nx * 6, ny * 6, 4) * 0.3;
            c.multiplyScalar(0.7 + turbulence);

            const index = (y * size + x) * 4;
            data[index] = c.r * 255;
            data[index + 1] = c.g * 255;
            data[index + 2] = c.b * 255;
            data[index + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    textureCache.set(cacheKey, texture);
    return texture;
}

/**
 * Generate an ice giant texture (Sync)
 */
export function generateIceGiantTexture(baseColor, size = 512) {
    const cacheKey = getCacheKey('ice_sync', { baseColor, size });
    if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    const base = new THREE.Color(baseColor);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size;
            const ny = y / size;

            const bandValue = Math.sin(ny * Math.PI * 4 + fbm(nx, ny, 2) * 0.5);
            const cloudValue = fbm(nx * 3, ny * 3, 4);

            const c = base.clone();
            const brightness = 0.8 + (bandValue * 0.1) + (cloudValue * 0.1);
            c.multiplyScalar(brightness);

            const index = (y * size + x) * 4;
            data[index] = c.r * 255;
            data[index + 1] = c.g * 255;
            data[index + 2] = c.b * 255;
            data[index + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    textureCache.set(cacheKey, texture);
    return texture;
}

/**
 * Generate a normal map (Sync)
 */
export function generateNormalMap(size = 512, strength = 1.0) {
    // Normal maps don't cache well with strength param, but we can try
    const cacheKey = `normal_sync_${size}_${strength}`;
    if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

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

            const offset = 1 / size;
            const center = fbm(nx, ny, 5);
            const right = fbm(nx + offset, ny, 5);
            const up = fbm(nx, ny + offset, 5);

            const dx = (right - center) * strength;
            const dy = (up - center) * strength;

            const index = (y * size + x) * 4;
            data[index] = Math.floor(((dx + 1) * 0.5) * 255);
            data[index + 1] = Math.floor(((dy + 1) * 0.5) * 255);
            data[index + 2] = 255;
            data[index + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // Normal maps are linear data
    texture.colorSpace = THREE.LinearSRGBColorSpace;

    textureCache.set(cacheKey, texture);
    return texture;
}


/**
 * Generate a tech panel texture for spacecraft hulls (Sync)
 */
export function generatePanelTexture(size = 512, color = '#cccccc') {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);

    // Draw panels
    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;

    const gridSize = 64;
    for (let y = 0; y < size; y += gridSize) {
        for (let x = 0; x < size; x += gridSize) {
            // Random fluctuations to make it look less perfect
            if (Math.random() > 0.2) {
                ctx.strokeRect(x, y, gridSize, gridSize);

                // Add little details inside
                if (Math.random() > 0.5) {
                    ctx.fillStyle = '#999999';
                    const detSize = gridSize / 4;
                    ctx.fillRect(x + detSize, y + detSize, detSize, detSize);
                    ctx.fillStyle = color; // Reset
                }
            }
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    return texture;
}


/**
 * Generate a circular radial gradient texture for stars/dust (Sync)
 */
export function generateStarTexture(size = 64) {
    const cacheKey = `star_${size}`;
    if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Create radial gradient
    const center = size / 2;
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    textureCache.set(cacheKey, texture);
    return texture;
}

/**
 * Generate a cloud texture (Atmospheric layer) (Sync)
 */
export function generateCloudTexture(size = 512, cloudColor = 0xffffff) {
    const cacheKey = getCacheKey('clouds', { cloudColor, size });
    if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    const color = new THREE.Color(cloudColor);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size;
            const ny = y / size;

            // FBM for cloud-like noise
            const noise = fbm(nx * 3, ny * 3, 6);

            // Sharpen the clouds (alpha discard simulation)
            const alpha = Math.max(0, (noise - 0.4) * 2);

            const index = (y * size + x) * 4;
            data[index] = color.r * 255;
            data[index + 1] = color.g * 255;
            data[index + 2] = color.b * 255;
            data[index + 3] = alpha * 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    textureCache.set(cacheKey, texture);
    return texture;
}

/**
 * Generate a ring texture (Planetary rings) (Sync)
 */
export function generateRingTexture(size = 512, color1 = 0x8c7853, color2 = 0x4a4a4a) {
    const cacheKey = getCacheKey('rings', { color1, color2, size });
    if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = 1; // 1D texture for rings is efficient
    const ctx = canvas.getContext('2d');

    const imageData = ctx.createImageData(size, 1);
    const data = imageData.data;
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);

    for (let x = 0; x < size; x++) {
        const nx = x / size;

        // Use noise to create concentric variations
        const noise = (Math.sin(nx * 100) + 1) * 0.5 * fbm(nx * 10, 0, 3);
        const color = c1.clone().lerp(c2, noise);

        // Add "Cassini Division" style gaps
        const gap = (nx > 0.65 && nx < 0.67) ? 0 : 1;

        const index = x * 4;
        data[index] = color.r * 255;
        data[index + 1] = color.g * 255;
        data[index + 2] = color.b * 255;
        data[index + 3] = (0.3 + noise * 0.7) * gap * 255;
    }

    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    textureCache.set(cacheKey, texture);
    return texture;
}

/**
 * Generate a night lights texture (City lights) (Sync)
 */
export function generateNightLightsTexture(size = 512, density = 0.5) {
    const cacheKey = getCacheKey('nightLights', { density, size });
    if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

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

            // Sparse high-intensity noise for "cities"
            const noise = fbm(nx * 15, ny * 15, 4);
            const intensity = Math.pow(Math.max(0, noise - (1 - density * 0.5)), 4) * 10;

            const index = (y * size + x) * 4;
            // Warm yellow/orange city lights
            data[index] = Math.min(255, 255 * intensity);
            data[index + 1] = Math.min(255, 215 * intensity);
            data[index + 2] = Math.min(255, 120 * intensity);
            data[index + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    textureCache.set(cacheKey, texture);
    return texture;
}

/**
 * Generate a cratered texture for moons/airless worlds (Sync)
 */
export function generateCratersTexture(baseColor, detailColor, size = 512) {
    const cacheKey = getCacheKey('craters', { baseColor, detailColor, size });
    if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    const base = new THREE.Color(baseColor);
    const detail = new THREE.Color(detailColor);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size;
            const ny = y / size;

            // Simplified Voronoi-like craters
            const noise = fbm(nx * 5, ny * 5, 5);
            const crater = Math.pow(Math.abs(Math.sin(noise * Math.PI * 4)), 0.5);

            const color = base.clone().lerp(detail, noise * 0.7 + crater * 0.3);

            const index = (y * size + x) * 4;
            data[index] = color.r * 255;
            data[index + 1] = color.g * 255;
            data[index + 2] = color.b * 255;
            data[index + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    textureCache.set(cacheKey, texture);
    return texture;
}
