/**
 * Procedural Texture Generator
 * Creates realistic planet textures using canvas and noise algorithms
 */

import * as THREE from 'three';

/**
 * Simple noise function (approximation)
 * For production, consider using a proper noise library
 */
function noise2D(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
}

/**
 * Fractal Brownian Motion for natural-looking noise
 */
function fbm(x, y, octaves = 4) {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;

    for (let i = 0; i < octaves; i++) {
        value += amplitude * noise2D(x * frequency, y * frequency);
        frequency *= 2;
        amplitude *= 0.5;
    }

    return value;
}

/**
 * Generate a rocky planet texture (Earth, Mars, Mercury, Venus type)
 */
export function generateRockyTexture(baseColor, detailColor, size = 512) {
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

    return texture;
}

/**
 * Generate a gas giant texture (Jupiter, Saturn type)
 */
export function generateGasGiantTexture(colors, size = 512) {
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

    return texture;
}

/**
 * Generate an ice giant texture (Uranus, Neptune type)
 */
export function generateIceGiantTexture(baseColor, size = 512) {
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
