import * as THREE from 'three';
import { generateStarTexture } from '../utils/textureGenerator.js';

/**
 * SpaceDust Class
 * Creates a swarm of particles around the spacecraft to provide a sense of velocity.
 * Implements an "infinite volume" effect using wrap-around logic.
 */
export class SpaceDust {
    constructor(count = 2000, range = 400) {
        this.count = count;
        this.range = range;
        this.speedThreshold = 200; // Speed at which to switch to warp effect
        this.isWarpMode = false;
        this.currentSpeed = 0;
        this.createDust();
    }

    createDust() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.count * 3);
        const sizes = new Float32Array(this.count);

        // We'll use a local coordinate system relative to the camera for individual particles
        // but offset them based on world position to simulate movement

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
            sizeAttenuation: true,
            depthWrite: false // Don't write depth, semitransparent
        });

        this.mesh = new THREE.Points(geometry, material);
        this.mesh.frustumCulled = false; // Always render
        this.baseMaterial = material;

        // Store initial relative positions
        this.initialPositions = positions.slice();
    }

    /**
     * Update dust positions relative to spacecraft to keep them within range
     * Uses modulo arithmetic for seamless wrapping
     */
    update(spacecraftPosition, spacecraftSpeed = 0, spacecraftDirection = new THREE.Vector3(0, 0, -1)) {
        if (!this.mesh) return;

        this.currentSpeed = spacecraftSpeed;
        const positions = this.mesh.geometry.attributes.position.array;

        // Determine if we should be in warp mode
        const shouldBeWarpMode = spacecraftSpeed > this.speedThreshold;

        if (shouldBeWarpMode !== this.isWarpMode) {
            this.isWarpMode = shouldBeWarpMode;
        }

        // Warp Effect Logic
        if (this.isWarpMode) {
            this.updateWarpMode(positions, spacecraftPosition, spacecraftDirection, spacecraftSpeed);
        } else {
            this.updateNormalMode(positions, spacecraftPosition);
        }

        this.mesh.geometry.attributes.position.needsUpdate = true;
    }

    updateNormalMode(positions, spacecraftPosition) {
        // Wrap logic:
        // Position = (InitialPosition + SpacecraftPosition) % Range - Range/2
        // Wait, standard infinite grid:
        // Relative = (WorldPos + Offset) % Range.
        // Actually, we want the particles to stay fixed in world space until they go out of bounds.

        const halfRange = this.range / 2;

        for (let i = 0; i < this.count; i++) {
            const idx = i * 3;

            // Calculate relative position to camera
            let x = this.initialPositions[idx] - spacecraftPosition.x;
            let y = this.initialPositions[idx + 1] - spacecraftPosition.y;
            let z = this.initialPositions[idx + 2] - spacecraftPosition.z;

            // Efficient Wrap around using modulo (handles large distances without loops)
            // ((x + halfRange) % range + range) % range - halfRange
            // This maps any value to [-halfRange, halfRange]

            x = ((x + halfRange) % this.range + this.range) % this.range - halfRange;
            y = ((y + halfRange) % this.range + this.range) % this.range - halfRange;
            z = ((z + halfRange) % this.range + this.range) % this.range - halfRange;

            // Update actual mesh position (which is at 0,0,0 usually, but we move vertices)
            // Or we can move the mesh to spacecraftPosition and offset vertices. 
            // Better: Mesh is at 0,0,0 (world origin), vertices are at world coordinates.
            // But floating point precision issues at large distances?
            // The game uses a scene scale, but coordinates are still large.
            // Best approach for dust: Keep mesh attached to camera/spacecraft, update vertices.

            // Let's assume mesh is added to scene at 0,0,0.
            // We set vertices to absolute world positions near spacecraft? No, that causes jitter.
            // BEST: Add mesh to the spacecraft/camera group! Then vertices are local.
            // BUT: If particles are "world fixed", they must move opposite to spacecraft in local space.

            // Let's assume mesh is at world origin for now.

            positions[idx] = spacecraftPosition.x + x;
            positions[idx + 1] = spacecraftPosition.y + y;
            positions[idx + 2] = spacecraftPosition.z + z;
        }

        this.baseMaterial.opacity = 0.6;
        this.baseMaterial.size = 0.8;
        this.baseMaterial.sizeAttenuation = true;
    }

    updateWarpMode(positions, spacecraftPosition, direction, speed) {
        const halfRange = this.range / 2;

        // In warp mode, we stretch them and make them stream
        // This is purely visual, we don't care about "world fixed" accuracy as much

        const speedFactor = Math.min((speed - this.speedThreshold) / 500, 5.0);

        // Update opacity/size
        this.baseMaterial.opacity = Math.min(0.4 + speedFactor * 0.1, 0.8);
        this.baseMaterial.size = 0.8 + speedFactor * 0.5;
        this.baseMaterial.sizeAttenuation = false; // Make them look like streaks? No, keep it true but bigger.

        // Reuse normal mode logic for positioning, but maybe stretch them?
        // Stretching points requires shaders or lines. Points are always squares/circles.
        // We'll stick to just fast moving particles for now.

        this.updateNormalMode(positions, spacecraftPosition);
    }
}
