/**
 * Star Class
 * Creates a sun/star object with emissive material
 */

import * as THREE from 'three';

export class Star {
    constructor(config = {}) {
        this.config = {
            radius: config.radius || 10,
            color: config.color || 0xffff00,
            emissiveIntensity: config.emissiveIntensity || 1.5,
            position: config.position || { x: 0, y: 0, z: 0 }
        };

        this.createStar();
    }

    createStar() {
        // Create star geometry
        const geometry = new THREE.SphereGeometry(
            this.config.radius,
            64,
            64
        );

        // Create emissive material (self-illuminated)
        const material = new THREE.MeshStandardMaterial({
            color: this.config.color,
            emissive: this.config.color,
            emissiveIntensity: this.config.emissiveIntensity
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(
            this.config.position.x,
            this.config.position.y,
            this.config.position.z
        );

        // Add glow effect with sprite
        this.addGlow();

        // Store metadata
        this.mesh.userData = {
            type: 'star',
            name: 'Sun'
        };
    }

    addGlow() {
        // Create a glow sprite for nice visual effect
        const glowGeometry = new THREE.SphereGeometry(
            this.config.radius * 1.2,
            32,
            32
        );

        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.config.color,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });

        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(glow);
    }

    dispose() {
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();

        // Dispose glow if it exists
        if (this.mesh.children.length > 0) {
            this.mesh.children.forEach(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
    }
}
