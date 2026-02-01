/**
 * Camera Manager
 * Handles camera setup and configuration
 */

import * as THREE from 'three';

export class CameraManager {
    constructor(canvas) {
        this.camera = this.createCamera(canvas);
        this.setupCameraPosition();
    }

    createCamera(canvas) {
        const aspect = canvas.clientWidth / canvas.clientHeight;
        const fov = 75;
        const near = 1; // Ajustado para escala x10000
        const far = 100000000; // 100 millones de unidades para escala x10000

        return new THREE.PerspectiveCamera(fov, aspect, near, far);
    }

    setupCameraPosition() {
        // Position camera for good initial view
        this.camera.position.set(0, 50, 150);
        this.camera.lookAt(0, 0, 0);
    }

    updateAspect(canvas) {
        const aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }

    getCamera() {
        return this.camera;
    }
}
