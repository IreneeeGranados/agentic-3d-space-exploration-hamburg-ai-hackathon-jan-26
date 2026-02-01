import * as THREE from 'three';
import { generateStarTexture } from '../utils/textureGenerator.js';

/**
 * SpaceDust Class
 * Creates a swarm of particles around the spacecraft to provide a sense of velocity.
 * Transforms into warp speed effect above 200 u/s.
 */
export class SpaceDust {
    constructor(count = 1000, range = 200) {
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
        const velocities = new Float32Array(this.count * 3); // For warp effect

        for (let i = 0; i < this.count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * this.range;
            positions[i * 3 + 1] = (Math.random() - 0.5) * this.range;
            positions[i * 3 + 2] = (Math.random() - 0.5) * this.range;
            sizes[i] = Math.random() * 2;
            
            // Initialize velocities
            velocities[i * 3] = 0;
            velocities[i * 3 + 1] = 0;
            velocities[i * 3 + 2] = 0;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

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
        this.baseMaterial = material;
    }

    /**
     * Update dust positions relative to spacecraft to keep them within range
     */
    update(spacecraftPosition, spacecraftSpeed = 0, spacecraftDirection = new THREE.Vector3(1, 0, 0)) {
        if (!this.mesh) return;

        this.currentSpeed = spacecraftSpeed;
        const positions = this.mesh.geometry.attributes.position.array;
        const sizes = this.mesh.geometry.attributes.size.array;
        
        // Determine if we should be in warp mode
        const shouldBeWarpMode = spacecraftSpeed > this.speedThreshold;
        
        // Transition to/from warp mode
        if (shouldBeWarpMode !== this.isWarpMode) {
            this.isWarpMode = shouldBeWarpMode;
            console.log(`🌟 Speed effect mode: ${this.isWarpMode ? 'WARP' : 'NORMAL'} (${spacecraftSpeed.toFixed(0)} u/s)`);
        }

        if (this.isWarpMode) {
            // WARP SPEED EFFECT - Particles streak backwards
            this.updateWarpMode(positions, sizes, spacecraftPosition, spacecraftDirection, spacecraftSpeed);
        } else {
            // NORMAL MODE - Particles float around
            this.updateNormalMode(positions, spacecraftPosition);
        }

        this.mesh.geometry.attributes.position.needsUpdate = true;
        this.mesh.geometry.attributes.size.needsUpdate = true;
    }
    
    updateNormalMode(positions, spacecraftPosition) {
        // Normal floating particles
        for (let i = 0; i < this.count; i++) {
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            const z = positions[i * 3 + 2];

            // If a particle gets too far from spacecraft, wrap it around
            if (Math.abs(x - spacecraftPosition.x) > this.range / 2) {
                positions[i * 3] = spacecraftPosition.x + (Math.random() - 0.5) * this.range;
            }
            if (Math.abs(y - spacecraftPosition.y) > this.range / 2) {
                positions[i * 3 + 1] = spacecraftPosition.y + (Math.random() - 0.5) * this.range;
            }
            if (Math.abs(z - spacecraftPosition.z) > this.range / 2) {
                positions[i * 3 + 2] = spacecraftPosition.z + (Math.random() - 0.5) * this.range;
            }
        }
        
        // Reset visual properties for normal mode
        this.baseMaterial.opacity = 0.6;
        this.baseMaterial.size = 0.8;
    }
    
    updateWarpMode(positions, sizes, spacecraftPosition, direction, speed) {
        // Warp speed effect - particles stream past
        const speedFactor = Math.min((speed - this.speedThreshold) / 500, 5.0); // Scale effect
        const streamSpeed = 2.0 + speedFactor * 3.0; // How fast particles stream backwards
        
        // Direction opposite to movement (particles come from ahead, stream past)
        const moveDir = direction.clone().normalize().multiplyScalar(-streamSpeed);
        
        for (let i = 0; i < this.count; i++) {
            const idx = i * 3;
            
            // Move particles backwards relative to spacecraft direction
            positions[idx] += moveDir.x;
            positions[idx + 1] += moveDir.y;
            positions[idx + 2] += moveDir.z;
            
            // Calculate distance from spacecraft
            const dx = positions[idx] - spacecraftPosition.x;
            const dy = positions[idx + 1] - spacecraftPosition.y;
            const dz = positions[idx + 2] - spacecraftPosition.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // If particle has streamed too far behind, respawn it ahead
            if (distance > this.range / 2) {
                // Spawn ahead in a cone in front of spacecraft
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * this.range * 0.4;
                const ahead = Math.random() * this.range * 0.3 + 50; // Spawn ahead
                
                // Position ahead of spacecraft in a cone
                const right = new THREE.Vector3(-direction.y, direction.x, 0).normalize();
                const up = new THREE.Vector3().crossVectors(direction, right).normalize();
                
                const offset = right.multiplyScalar(Math.cos(angle) * radius)
                    .add(up.multiplyScalar(Math.sin(angle) * radius))
                    .add(direction.clone().multiplyScalar(ahead));
                
                positions[idx] = spacecraftPosition.x + offset.x;
                positions[idx + 1] = spacecraftPosition.y + offset.y;
                positions[idx + 2] = spacecraftPosition.z + offset.z;
            }
            
            // Make particles bigger and brighter at high speed
            sizes[i] = 1.5 + speedFactor * 2.0;
        }
        
        // Enhance visual properties for warp mode
        this.baseMaterial.opacity = Math.min(0.8 + speedFactor * 0.15, 0.95);
        this.baseMaterial.size = 1.2 + speedFactor * 0.5;
    }
}
