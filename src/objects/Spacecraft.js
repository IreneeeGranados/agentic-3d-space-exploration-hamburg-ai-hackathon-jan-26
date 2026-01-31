/**
 * Spacecraft Class
 * Auto-pilot forward with steering controls
 */

import * as THREE from 'three';

export class Spacecraft {
    constructor() {
        this.group = new THREE.Group();

        // Start in space
        this.group.position.set(0, 0, 150);

        // Constant forward speed
        this.forwardSpeed = 15; // Slowed down for easier control

        // Steering
        this.steeringForce = 8;
        this.velocity = new THREE.Vector3(0, 0, 0);

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
            opacity: 0.9
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
     * Steer spacecraft with arrow keys/WASD and mouse
     */
    steer(keys, deltaTime, mouseInput = { x: 0, y: 0 }) {
        // Calculate steering direction from keys
        let steerX = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
        let steerY = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);

        // Add mouse influence (FIXED DIRECTION)
        // Mouse Right (+X) -> Positive SteerX -> rotateY negative (Right Turn)
        if (Math.abs(mouseInput.x) > 0.1) steerX += mouseInput.x * 2;

        // Mouse Up (-Y) -> Negative MouseY -> Positive SteerY -> rotateZ positive (Pitch Up)
        // "Non-inverted" flight control: Mouse Up on screen = Nose Up
        if (Math.abs(mouseInput.y) > 0.1) steerY -= mouseInput.y * 2;

        // Apply steering rotation
        const rotSpeed = 1.2 * deltaTime;

        // Pitch (up/down)
        // If steerY is positive (Up key/Mouse Up), we pitch UP
        if (Math.abs(steerY) > 0.01) {
            this.group.rotateZ(steerY * rotSpeed);
        }

        // Yaw (left/right)
        // If steerX is positive (Right key/Mouse Right), we turn RIGHT
        if (Math.abs(steerX) > 0.01) {
            this.group.rotateY(-steerX * rotSpeed);
        }

        // Always move forward in the direction we're facing
        const forward = new THREE.Vector3(1, 0, 0); // X-axis is forward
        forward.applyQuaternion(this.group.quaternion);

        // Set velocity to forward direction
        this.velocity.copy(forward).multiplyScalar(this.forwardSpeed);

        // Update position
        this.group.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    }

    /**
     * Update camera to follow spacecraft (behind view)
     */
    updateCamera(camera) {
        // Camera position: behind and slightly above
        const offset = new THREE.Vector3(-25, 8, 0);
        offset.applyQuaternion(this.group.quaternion);
        offset.add(this.group.position);

        // Smooth camera movement
        camera.position.lerp(offset, 0.1);

        // Look slightly ahead of spacecraft
        const lookAhead = new THREE.Vector3(10, 0, 0);
        lookAhead.applyQuaternion(this.group.quaternion);
        lookAhead.add(this.group.position);

        camera.lookAt(lookAhead);
    }

    update(deltaTime) {
        this.animationTime += deltaTime;

        // Pulse engine glow
        if (this.leftGlow && this.rightGlow) {
            const pulse = 0.8 + Math.sin(this.animationTime * 8) * 0.2;
            this.leftGlow.material.opacity = pulse;
            this.rightGlow.material.opacity = pulse;
        }
    }

    getPosition() {
        return this.group.position.clone();
    }

    getSpeed() {
        return this.forwardSpeed;
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
