/**
 * Spacecraft Class
 * Camera-relative spacecraft with navigation capabilities
 */

import * as THREE from 'three';

export class Spacecraft {
    constructor() {
        this.group = new THREE.Group();

        // Set initial position (will be overridden when camera attached)
        this.group.position.set(-30, -15, 80);

        // Camera-relative positioning
        this.camera = null;
        this.cameraOffset = new THREE.Vector3(-15, -5, -40); // left, down, in front

        // Navigation state
        this.navigationState = 'idle'; // 'idle', 'traveling', 'arriving'
        this.targetPosition = null;
        this.travelDuration = 0;
        this.travelElapsed = 0;

        // Animation
        this.animationTime = 0;
        this.baseRotation = { x: 0, y: 0, z: 0 };
        this.currentBankAngle = 0;

        this.createSpacecraft();
    }

    createSpacecraft() {
        // Main fuselage
        const fuselageGeometry = new THREE.CylinderGeometry(1.5, 2, 10, 16);
        const fuselageMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.8,
            roughness: 0.2
        });
        const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
        fuselage.rotation.z = Math.PI / 2;
        fuselage.castShadow = true;
        this.group.add(fuselage);

        // Cockpit (front)
        const cockpitGeometry = new THREE.SphereGeometry(2, 16, 16, 0, Math.PI);
        const cockpitMaterial = new THREE.MeshStandardMaterial({
            color: 0x3399ff,
            metalness: 0.5,
            roughness: 0.1,
            transparent: true,
            opacity: 0.7
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.x = 5;
        cockpit.rotation.z = -Math.PI / 2;
        cockpit.castShadow = true;
        this.group.add(cockpit);

        // Wings (left and right)
        const wingGeometry = new THREE.BoxGeometry(12, 0.3, 4);
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.7,
            roughness: 0.3
        });

        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(0, 0, -6);
        leftWing.castShadow = true;
        this.group.add(leftWing);

        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(0, 0, 6);
        rightWing.castShadow = true;
        this.group.add(rightWing);

        // Engine nacelles (left and right)
        const engineGeometry = new THREE.CylinderGeometry(0.8, 1.2, 4, 12);
        const engineMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.9,
            roughness: 0.1
        });

        const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
        leftEngine.position.set(-3, 0, -6);
        leftEngine.rotation.z = Math.PI / 2;
        leftEngine.castShadow = true;
        this.group.add(leftEngine);

        const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
        rightEngine.position.set(-3, 0, 6);
        rightEngine.rotation.z = Math.PI / 2;
        rightEngine.castShadow = true;
        this.group.add(rightEngine);

        // Engine glow (emissive)
        const glowGeometry = new THREE.CylinderGeometry(0.6, 0.9, 1.5, 12);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8
        });

        const leftGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        leftGlow.position.set(-5, 0, -6);
        leftGlow.rotation.z = Math.PI / 2;
        this.group.add(leftGlow);
        this.leftGlow = leftGlow;

        const rightGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        rightGlow.position.set(-5, 0, 6);
        rightGlow.rotation.z = Math.PI / 2;
        this.group.add(rightGlow);
        this.rightGlow = rightGlow;

        // Store metadata
        this.group.userData = { type: 'spacecraft' };
    }

    /**
     * Attach spacecraft to camera
     */
    attachToCamera(camera) {
        this.camera = camera;
    }

    /**
     * Set navigation target (planet position)
     */
    setNavigationTarget(targetPosition, duration = 2.5) {
        this.targetPosition = targetPosition.clone();
        this.navigationState = 'traveling';
        this.travelDuration = duration;
        this.travelElapsed = 0;
        console.log('Spacecraft navigating to:', targetPosition);
    }

    /**
     * Clear navigation target
     */
    clearNavigationTarget() {
        this.navigationState = 'arriving';
        this.targetPosition = null;
        console.log('Spacecraft arrived at destination');
    }

    /**
     * Update camera-relative position
     */
    updateCameraRelativePosition(deltaTime) {
        if (!this.camera) return;

        // Get camera's direction vectors
        const forward = new THREE.Vector3(0, 0, -1);
        const right = new THREE.Vector3(1, 0, 0);
        const up = new THREE.Vector3(0, 1, 0);

        forward.applyQuaternion(this.camera.quaternion);
        right.applyQuaternion(this.camera.quaternion);
        up.applyQuaternion(this.camera.quaternion);

        // Calculate target position in camera space
        const targetPosition = this.camera.position.clone();
        targetPosition.add(forward.multiplyScalar(this.cameraOffset.z));
        targetPosition.add(right.multiplyScalar(this.cameraOffset.x));
        targetPosition.add(up.multiplyScalar(this.cameraOffset.y));

        // Smooth interpolation to avoid jitter
        this.group.position.lerp(targetPosition, 0.1);
    }

    /**
     * Update spacecraft rotation to bank toward target
     */
    updateNavigationRotation(deltaTime) {
        if (this.navigationState === 'traveling' && this.targetPosition) {
            // Calculate direction to target
            const direction = new THREE.Vector3()
                .subVectors(this.targetPosition, this.group.position)
                .normalize();

            // Create target look-at quaternion
            const targetQuaternion = new THREE.Quaternion();
            const lookAtMatrix = new THREE.Matrix4();
            lookAtMatrix.lookAt(this.group.position, this.targetPosition, new THREE.Vector3(0, 1, 0));
            targetQuaternion.setFromRotationMatrix(lookAtMatrix);

            // Apply banking based on navigation
            const bankAngle = 0.2; // Max bank angle in radians
            this.currentBankAngle = THREE.MathUtils.lerp(this.currentBankAngle, bankAngle, deltaTime * 2);

            // Smoothly rotate toward target
            this.group.quaternion.slerp(targetQuaternion, deltaTime * 1.5);

            // Add roll/bank
            this.group.rotation.z += this.currentBankAngle * Math.sin(this.animationTime * 2);

            // Track travel progress
            this.travelElapsed += deltaTime;

        } else if (this.navigationState === 'arriving' || this.navigationState === 'idle') {
            // Level out
            this.currentBankAngle = THREE.MathUtils.lerp(this.currentBankAngle, 0, deltaTime * 3);

            // Return to idle rotation
            const idleQuaternion = new THREE.Quaternion();
            this.group.quaternion.slerp(idleQuaternion, deltaTime * 2);

            if (this.navigationState === 'arriving' && this.currentBankAngle < 0.01) {
                this.navigationState = 'idle';
            }
        }
    }

    /**
     * Update idle animations
     */
    updateIdleAnimation(deltaTime) {
        this.animationTime += deltaTime;

        // Gentle bobbing (only in idle state)
        if (this.navigationState === 'idle') {
            const bobAmount = 0.2;
            const bobOffset = Math.sin(this.animationTime * 2) * bobAmount;
            // Apply bob as local offset
            this.group.position.y += bobOffset * deltaTime;
        }

        // Pulse engine glow (always active, more intense during travel)
        const baseIntensity = this.navigationState === 'traveling' ? 0.9 : 0.6;
        const pulseRange = this.navigationState === 'traveling' ? 0.1 : 0.2;
        const glowIntensity = baseIntensity + Math.sin(this.animationTime * 5) * pulseRange;

        if (this.leftGlow && this.rightGlow) {
            this.leftGlow.material.opacity = glowIntensity;
            this.rightGlow.material.opacity = glowIntensity;
        }
    }

    /**
     * Main update method
     */
    update(deltaTime = 0.016, camera = null) {
        if (camera) {
            this.camera = camera;
        }

        // Update position relative to camera
        this.updateCameraRelativePosition(deltaTime);

        // Update rotation based on navigation state
        this.updateNavigationRotation(deltaTime);

        // Update idle animations
        this.updateIdleAnimation(deltaTime);
    }

    dispose() {
        this.group.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }
}
