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
        const near = 1;
        const far = 1000000000; // 1 billion units - prevents distant planet clipping

        return new THREE.PerspectiveCamera(fov, aspect, near, far);
    }

    setupCameraPosition() {
        // Position camera for good initial view
        this.camera.position.set(0, 50, 150);
        this.camera.lookAt(0, 0, 0);
        
        // Add light that follows camera for better visibility
        this.cameraLight = new THREE.PointLight(0xffffff, 2.5, 2000);
        this.cameraLight.position.set(0, 0, 0); // Will follow camera
        this.camera.add(this.cameraLight);
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
