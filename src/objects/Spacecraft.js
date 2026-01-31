/**
 * Spacecraft Class
 * Simple player-controlled spacecraft
 */

import * as THREE from 'three';

export class Spacecraft {
    constructor() {
        this.group = new THREE.Group();

        // Start in space
        this.group.position.set(0, 0, 150);

        // Simple physics
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.speed = 0;
        this.maxSpeed = 30;
        this.acceleration = 15;
        this.friction = 0.95;

        // Animation
        this.animationTime = 0;

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

        // Cockpit
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

        // Wings
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

        // Engine glow
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
    }

    /**
     * Move spacecraft based on keyboard input
     */
    move(keys, deltaTime) {
        // Forward/backward
        if (keys.forward) {
            this.speed = Math.min(this.speed + this.acceleration * deltaTime, this.maxSpeed);
        } else if (keys.backward) {
            this.speed = Math.max(this.speed - this.acceleration * deltaTime, -this.maxSpeed * 0.5);
        } else {
            // Apply friction when no input
            this.speed *= this.friction;
            if (Math.abs(this.speed) < 0.1) this.speed = 0;
        }

        // Get forward direction
        const forward = new THREE.Vector3(1, 0, 0);
        forward.applyQuaternion(this.group.quaternion);

        // Update velocity
        this.velocity.copy(forward).multiplyScalar(this.speed);

        // Update position
        this.group.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // Update engine glow based on speed
        if (this.leftGlow && this.rightGlow) {
            const intensity = 0.5 + (Math.abs(this.speed) / this.maxSpeed) * 0.5;
            this.leftGlow.material.opacity = intensity;
            this.rightGlow.material.opacity = intensity;
        }
    }

    /**
     * Rotate spacecraft based on mouse/keys
     */
    rotate(rotation, deltaTime) {
        const rotSpeed = 1.5 * deltaTime;

        // Pitch (up/down)
        if (rotation.pitch !== 0) {
            this.group.rotateZ(-rotation.pitch * rotSpeed);
        }

        // Yaw (left/right)
        if (rotation.yaw !== 0) {
            this.group.rotateY(-rotation.yaw * rotSpeed);
        }

        // Roll
        if (rotation.roll !== 0) {
            this.group.rotateX(rotation.roll * rotSpeed);
        }
    }

    /**
     * Update camera to follow spacecraft (third-person view)
     */
    updateCamera(camera) {
        // Camera position behind and above spacecraft
        const offset = new THREE.Vector3(-20, 5, 0);
        offset.applyQuaternion(this.group.quaternion);
        offset.add(this.group.position);

        // Smooth camera movement
        camera.position.lerp(offset, 0.1);

        // Look at spacecraft
        camera.lookAt(this.group.position);
    }

    update(deltaTime) {
        this.animationTime += deltaTime;

        // Pulse engine glow
        if (this.leftGlow && this.rightGlow) {
            const pulse = Math.sin(this.animationTime * 5) * 0.1;
            this.leftGlow.material.opacity = Math.min(this.leftGlow.material.opacity + pulse * deltaTime, 1.0);
            this.rightGlow.material.opacity = Math.min(this.rightGlow.material.opacity + pulse * deltaTime, 1.0);
        }
    }

    getPosition() {
        return this.group.position.clone();
    }

    getSpeed() {
        return Math.abs(this.speed);
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
