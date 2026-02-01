/**
 * StarField Class
 * Creates a background field of stars
 */

import * as THREE from 'three';
import { generateStarTexture } from '../utils/textureGenerator.js';

export class StarField {
    constructor(count = 10000, radius = 1000) {
        this.count = count;
        this.radius = radius;
        this.createStarField();
    }

    createStarField() {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const sizes = [];

        // Color palettes for different star types (Kelvin approximations)
        const starColors = [
            new THREE.Color(0x9bb2ff), // O-type (Blue)
            new THREE.Color(0xbbccff), // B-type (Blue-white)
            new THREE.Color(0xfbf8ff), // A-type (White)
            new THREE.Color(0xfff5f2), // F-type (Yellow-white)
            new THREE.Color(0xfff2a1), // G-type (Yellow - like our Sun)
            new THREE.Color(0xffd2a1), // K-type (Orange)
            new THREE.Color(0xffcc6f)  // M-type (Red)
        ];

        // Generate random star positions
        for (let i = 0; i < this.count; i++) {
            // Random position in sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const r = this.radius * (0.9 + Math.random() * 0.1); // Keep them in a shell

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            positions.push(x, y, z);

            // Choose a random star color
            const color = starColors[Math.floor(Math.random() * starColors.length)].clone();

            // Add slight brightness variation
            const brightness = 0.5 + Math.random() * 0.5;
            color.multiplyScalar(brightness);

            colors.push(color.r, color.g, color.b);

            // Random sizes
            sizes.push(Math.random() * 2.5);
        }

        geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(positions, 3)
        );
        geometry.setAttribute(
            'color',
            new THREE.Float32BufferAttribute(colors, 3)
        );
        geometry.setAttribute(
            'size',
            new THREE.Float32BufferAttribute(sizes, 1)
        );

        // Create points material with circular texture
        const material = new THREE.PointsMaterial({
            size: 1.5,
            map: generateStarTexture(64),
            vertexColors: true,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.9,
            alphaTest: 0.05,
            blending: THREE.NormalBlending,
            depthWrite: false, // Stars don't write depth (so planets always occlude them)
            depthTest: true     // Stars DO read depth buffer
        });

        this.mesh = new THREE.Points(geometry, material);
        this.mesh.renderOrder = -999; // Render stars FIRST (background layer)
    }

    dispose() {
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}
