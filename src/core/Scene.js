/**
 * Scene Manager
 * Handles Three.js scene setup and configuration
 */

import * as THREE from 'three';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.setupScene();
    }

    setupScene() {
        // Set background to dark space
        this.scene.background = new THREE.Color(0x000000);

        // Add ambient light for subtle illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);

        // Add directional light (simulating sunlight) with shadows
        const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;

        // Configure shadow properties for better quality
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 1000;

        // Increase shadow camera frustum to cover all planets
        const shadowSize = 400;
        directionalLight.shadow.camera.left = -shadowSize;
        directionalLight.shadow.camera.right = shadowSize;
        directionalLight.shadow.camera.top = shadowSize;
        directionalLight.shadow.camera.bottom = -shadowSize;

        // Reduce shadow acne
        directionalLight.shadow.bias = -0.0001;

        this.scene.add(directionalLight);

        // Add point light at center - REMOVED per user request (Sun removal)
        /*
        const pointLight = new THREE.PointLight(0xffffff, 2, 1000);
        pointLight.position.set(0, 0, 0);
        pointLight.castShadow = false; // Sun doesn't need to cast shadows
        this.scene.add(pointLight);
        */
    }

    add(object) {
        this.scene.add(object);
    }

    remove(object) {
        this.scene.remove(object);
    }

    getScene() {
        return this.scene;
    }
}
