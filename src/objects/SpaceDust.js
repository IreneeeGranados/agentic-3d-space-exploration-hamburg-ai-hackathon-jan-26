import * as THREE from 'three';
import { generateStarTexture } from '../utils/textureGenerator.js';

/**
 * SpaceDust Class
 * Creates a swarm of particles around the spacecraft to provide a sense of velocity.
 */
export class SpaceDust {
    constructor(count = 1000, range = 200) {
        this.count = count;
        this.range = range;
        this.createDust();
    }

    createDust() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.count * 3);
        const sizes = new Float32Array(this.count);

        for (let i = 0; i < this.count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * this.range;
            positions[i * 3 + 1] = (Math.random() - 0.5) * this.range;
            positions[i * 3 + 2] = (Math.random() - 0.5) * this.range;
            sizes[i] = Math.random() * 2;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.8,
            map: generateStarTexture(32),
            transparent: true,
            opacity: 0.6,
            alphaTest: 0.05,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        this.mesh = new THREE.Points(geometry, material);
    }

    /**
     * Update dust positions relative to spacecraft to keep them within range
     */
    update(spacecraftPosition) {
        if (!this.mesh) return;

        const positions = this.mesh.geometry.attributes.position.array;

        for (let i = 0; i < this.count; i++) {
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            const z = positions[i * 3 + 2];

            // If a particle gets too far from spacecraft, wrap it around
            if (Math.abs(x - spacecraftPosition.x) > this.range / 2) {
                positions[i * 3] = spacecraftPosition.x - (Math.sign(x - spacecraftPosition.x) * this.range / 2);
            }
            if (Math.abs(y - spacecraftPosition.y) > this.range / 2) {
                positions[i * 3 + 1] = spacecraftPosition.y - (Math.sign(y - spacecraftPosition.y) * this.range / 2);
            }
            if (Math.abs(z - spacecraftPosition.z) > this.range / 2) {
                positions[i * 3 + 2] = spacecraftPosition.z - (Math.sign(z - spacecraftPosition.z) * this.range / 2);
            }
        }

        this.mesh.geometry.attributes.position.needsUpdate = true;
    }
}
