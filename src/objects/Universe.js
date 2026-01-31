/**
 * Universe Class
 * Creates a vast sphere with a high-resolution space texture (nebulae, galaxies)
 */

import * as THREE from 'three';

export class Universe {
    constructor(radius = 5000) {
        this.radius = radius;
        this.createUniverse();
    }

    createUniverse() {
        // Create a large sphere geometry
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);

        // Invert the geometry so the texture is visible from the inside
        geometry.scale(-1, 1, 1);

        // Load the space background texture
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('assets/space_background.png');

        // Use sRGB encoding for better color accuracy
        texture.colorSpace = THREE.SRGBColorSpace;

        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide, // Just in case, though we inverted geometry
            transparent: true,
            opacity: 1.0
        });

        this.mesh = new THREE.Mesh(geometry, material);

        // Store metadata
        this.mesh.userData = { type: 'universe' };
    }

    update() {
        // Disabled rotation for "Straight Deep Space Navigation" experience
        // this.mesh.rotation.y += 0.0001;
        // this.mesh.rotation.x += 0.00005;
    }

    dispose() {
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        if (this.mesh.material.map) {
            this.mesh.material.map.dispose();
        }
    }
}
