/**
 * textureWorker.js
 * Handles procedural texture generation off the main thread.
 * Returns raw pixel buffers (Uint8ClampedArray) to be used with THREE.DataTexture.
 */

// --- Noise Functions ---

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
        // Add domain warping
        const ox = noise2D(x * frequency, y * frequency) * 0.1;
        const oy = noise2D(x * frequency + 1.2, y * frequency + 3.4) * 0.1;

        value += amplitude * noise2D(x * frequency + ox, y * frequency + oy);
        frequency *= 2.1;
        amplitude *= 0.5;
    }

    return value;
}

// --- Color Helpers ---

// Simple Color class to mimic THREE.Color functionality used in generator
class Color {
    constructor(hex) {
        if (typeof hex === 'string') {
            this.setHex(parseInt(hex.replace('#', ''), 16));
        } else {
            this.setHex(hex);
        }
    }

    setHex(hex) {
        this.r = ((hex >> 16) & 255) / 255;
        this.g = ((hex >> 8) & 255) / 255;
        this.b = (hex & 255) / 255;
    }

    clone() {
        const c = new Color(0);
        c.r = this.r;
        c.g = this.g;
        c.b = this.b;
        return c;
    }

    lerp(color, alpha) {
        this.r += (color.r - this.r) * alpha;
        this.g += (color.g - this.g) * alpha;
        this.b += (color.b - this.b) * alpha;
        return this;
    }

    multiplyScalar(s) {
        this.r *= s;
        this.g *= s;
        this.b *= s;
        return this;
    }
}

// --- Generators ---

function generateRockyTexture(params) {
    const { baseColor, detailColor, size = 512 } = params;
    const data = new Uint8Array(size * size * 4);

    const base = new Color(baseColor);
    const detail = new Color(detailColor);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size;
            const ny = y / size;

            const noiseValue = fbm(nx * 4, ny * 4, 5);
            const c = base.clone().lerp(detail, noiseValue);

            const index = (y * size + x) * 4;
            data[index] = Math.min(255, Math.floor(c.r * 255));
            data[index + 1] = Math.min(255, Math.floor(c.g * 255));
            data[index + 2] = Math.min(255, Math.floor(c.b * 255));
            data[index + 3] = 255;
        }
    }
    return { data, width: size, height: size };
}

function generateGasGiantTexture(params) {
    const { colors, size = 512 } = params;
    const data = new Uint8Array(size * size * 4);

    // Convert hex integers to Color objects
    const colorObjs = colors.map(c => new Color(c));

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
            data[index] = Math.min(255, Math.floor(c.r * 255));
            data[index + 1] = Math.min(255, Math.floor(c.g * 255));
            data[index + 2] = Math.min(255, Math.floor(c.b * 255));
            data[index + 3] = 255;
        }
    }
    return { data, width: size, height: size };
}

function generateIceGiantTexture(params) {
    const { baseColor, size = 512 } = params;
    const data = new Uint8Array(size * size * 4);

    const base = new Color(baseColor);

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
            data[index] = Math.min(255, Math.floor(c.r * 255));
            data[index + 1] = Math.min(255, Math.floor(c.g * 255));
            data[index + 2] = Math.min(255, Math.floor(c.b * 255));
            data[index + 3] = 255;
        }
    }
    return { data, width: size, height: size };
}

function generateNormalMap(params) {
    const { size = 512, strength = 1.0 } = params;
    const data = new Uint8Array(size * size * 4);

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
    return { data, width: size, height: size };
}

// --- Message Handler ---

self.onmessage = function (e) {
    const { id, type, params } = e.data;

    try {
        let result;
        switch (type) {
            case 'rocky':
                result = generateRockyTexture(params);
                break;
            case 'gas':
                result = generateGasGiantTexture(params);
                break;
            case 'ice':
                result = generateIceGiantTexture(params);
                break;
            case 'normal':
                result = generateNormalMap(params);
                break;
            default:
                throw new Error(`Unknown generator type: ${type}`);
        }

        // Send back result with transfer of buffer
        self.postMessage(
            { id, success: true, ...result },
            [result.data.buffer]
        );

    } catch (error) {
        self.postMessage({ id, success: false, error: error.message });
    }
};
