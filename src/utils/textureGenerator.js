import * as THREE from 'three';

// Texture cache to prevent redundant generation
const textureCache = new Map();

/**
 * Helper to round colors for better cache hit rates
 */
function getCacheKey(type, params) {
    return `${type}_${JSON.stringify(params)}`;
}

/**
 * Simple noise function (approximation)
 * For production, consider using a proper noise library
 */
function noise2D(x, y) {
    const nx = x * 12.9898 + y * 78.233;
    const n = Math.sin(nx) * 43758.5453;
    return n - Math.floor(n);
}

/**
 * Fractal Brownian Motion for natural-looking noise
 */
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
 * Helper to get color based on composition and temperature
 */
export function getColorByComposition(composition, temperature) {
    const comp = (composition || '').toLowerCase();
    const temp = temperature || 300; // Default to Earth-like temp

    // 1. Extreme Heat (Lava/Molten Worlds)
    if (temp > 1200 && (comp.includes('rocky') || comp.includes('silicates') || comp.includes('iron'))) {
        return { base: 0x1a1a1a, detail: 0xff4500, atmosphere: 0xff6347 }; // Charred black with lava orange
    }

    // 2. Gas Giants & Hot Jupiters
    if (comp.includes('gas') || comp.includes('hydrogen') || comp.includes('helium')) {
        if (temp > 1000) return { base: 0xff8c00, detail: 0xffd700, atmosphere: 0xffd700 }; // Hot Jupiter
        if (temp < 150) return { base: 0xa0c4ff, detail: 0x1a75ff, atmosphere: 0x87ceeb };  // Cold Gas Giant
        return { base: 0xc88b3a, detail: 0xe6a85c, atmosphere: 0xf4d7a8 }; // Jupiter-like
    }

    // 3. Ice Giants & Water Worlds
    if (comp.includes('ice') || comp.includes('methane') || comp.includes('ammonia') || comp.includes('water')) {
        if (comp.includes('water') || comp.includes('ocean')) {
            return { base: 0x00416a, detail: 0x0077be, atmosphere: 0xadd8e6 }; // Deep Ocean
        }
        if (temp < 100) return { base: 0x4169e1, detail: 0x00008b, atmosphere: 0xadd8e6 }; // Deep Blue Ice
        return { base: 0x4fd0e7, detail: 0x00ced1, atmosphere: 0x00ced1 }; // Cyan/Turquoise
    }

    // 4. Rocky / Terrestrial Planets
    if (comp.includes('rocky') || comp.includes('silicates') || comp.includes('iron') || comp.includes('metal')) {
        if (temp < 200) return { base: 0xf0f8ff, detail: 0xb0c4de, atmosphere: 0xffffff }; // Frozen/White
        if (comp.includes('iron') || comp.includes('metal')) return { base: 0x4a4a4a, detail: 0x708090, atmosphere: 0x000000 };
        if (comp.includes('sulfur')) return { base: 0xefdfbb, detail: 0xe1ad21, atmosphere: 0xffff00 };
        if (comp.includes('oxide') || comp.includes('rust')) return { base: 0xcd5c5c, detail: 0x8b3a3a, atmosphere: 0xff4500 };
        return { base: 0x8c7853, detail: 0x6b5d4f, atmosphere: 0x8c7853 };
    }

    // 5. Special Case: Earth-like default
    if (comp.includes('habitabl') || comp.includes('vegetation') || comp.includes('earth')) {
        return { base: 0x228b22, detail: 0x1e90ff, atmosphere: 0x4a90e2 }; // Forest Green / Sea Blue
    }

    // Default
    return { base: 0x888888, detail: 0x666666, atmosphere: 0x4a90e2 };
}


/**
 * Generate a rocky planet texture (Earth, Mars, Mercury, Venus type)
 */
export function generateRockyTexture(baseColor, detailColor, size = 512) {
    // Check cache first
    const cacheKey = getCacheKey('rocky', { baseColor, detailColor, size });
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

            // Generate noise value
            const noiseValue = fbm(nx * 4, ny * 4, 5);

            // Interpolate between base and detail colors
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
 * Generate a gas giant texture (Jupiter, Saturn type)
 */
export function generateGasGiantTexture(colors, size = 512) {
    // Check cache first
    const cacheKey = getCacheKey('gas', { colors, size });
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

            // Horizontal bands
            const bandValue = Math.sin(ny * Math.PI * 8 + fbm(nx * 2, ny * 2, 3) * 2);
            const colorIndex = Math.floor((bandValue + 1) * 0.5 * (colors.length - 1));
            const color = new THREE.Color(colors[Math.min(colorIndex, colors.length - 1)]);

            // Add turbulence
            const turbulence = fbm(nx * 6, ny * 6, 4) * 0.3;
            color.multiplyScalar(0.7 + turbulence);

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
 * Generate an ice giant texture (Uranus, Neptune type)
 */
export function generateIceGiantTexture(baseColor, size = 512) {
    // Check cache first
    const cacheKey = getCacheKey('ice', { baseColor, size });
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

            // Subtle horizontal bands
            const bandValue = Math.sin(ny * Math.PI * 4 + fbm(nx, ny, 2) * 0.5);

            // Cloud patterns
            const cloudValue = fbm(nx * 3, ny * 3, 4);

            const color = base.clone();
            const brightness = 0.8 + (bandValue * 0.1) + (cloudValue * 0.1);
            color.multiplyScalar(brightness);

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
 * Generate a normal map for surface detail
 */
export function generateNormalMap(size = 512, strength = 1.0) {
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

            // Sample nearby points for gradient
            const offset = 1 / size;
            const center = fbm(nx, ny, 5);
            const right = fbm(nx + offset, ny, 5);
            const up = fbm(nx, ny + offset, 5);

            // Calculate normal
            const dx = (right - center) * strength;
            const dy = (up - center) * strength;

            // Convert to normal map color (RGB = XYZ)
            const index = (y * size + x) * 4;
            data[index] = ((dx + 1) * 0.5) * 255;      // R = X
            data[index + 1] = ((dy + 1) * 0.5) * 255;  // G = Y
            data[index + 2] = 255;                      // B = Z (pointing up)
            data[index + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    return texture;
}

/**
 * Generate a tech panel texture for spacecraft hulls
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
 * Generate a circular radial gradient texture for stars/dust
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
 * Generate a cloud texture (Atmospheric layer)
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
 * Generate a ring texture (Planetary rings)
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
 * Generate a night lights texture (City lights)
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
 * Generate a cratered texture for moons/airless worlds
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
