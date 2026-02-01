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
        this.scene.background = new THREE.Color(0x000011);

        // Add exponential fog for depth (ajustado para escala x10000)
        // DISABLED - fog was causing transparency issues
        // this.scene.fog = new THREE.FogExp2(0x000011, 0.00000002);

        // Add strong ambient light for equal illumination from all sides
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
        this.scene.add(ambientLight);

        // Add Hemisphere light for better 3D depth (simulates galactic glow)
        const hemiLight = new THREE.HemisphereLight(0x445566, 0x222222, 0.8);
        this.scene.add(hemiLight);

        // Add directional light (simulating local star/sun) - Reduced intensity since we have strong ambient
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(2000, 500, 2000); // Placed further away
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
