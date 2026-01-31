/**
 * Spacecraft Class
 * Auto-pilot forward with steering controls
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export class Spacecraft {
    constructor() {
        this.group = new THREE.Group();

        // Start in space
        this.group.position.set(0, 0, 0);

        // Constant forward speed
        this.forwardSpeed = 10.0; // Increased base speed significantly for better sensation
        this.defaultSpeed = 10.0;
        this.boostSpeed = 50;
        this.brakeSpeed = 0;  // Stop
        this.autopilotSpeed = 80; // Faster autopilot

        // Steering
        this.steeringForce = 8;
        this.velocity = new THREE.Vector3(0, 0, 0);

        // Autopilot State
        this.autopilot = {
            enabled: false,
            target: null,
            minDistance: 30 // Stop 30 units away
        };

        // Animation
        this.animationTime = 0;

        // View Mode
        this.viewMode = 'CHASE'; // 'CHASE' or 'COCKPIT'

        this.createSpacecraft();
    }

    createSpacecraft() {
        // Group to hold all parts
        this.mesh = new THREE.Group();
        this.group.add(this.mesh);

        this.loadModel();

        // Add FX immediately (will be attached to mesh, so they move with it)
        this.createEngines();
        this.createNavLights();
    }

    loadModel() {
        const loader = new GLTFLoader();

        // Setup Draco Loader for compressed meshes
        const dracoLoader = new DRACOLoader();
        // Use CDN for Draco decoders to avoid needing local files
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
        loader.setDRACOLoader(dracoLoader);

        loader.load('assets/space_shuttle.glb', (gltf) => {
            console.log('Spacecraft Model Loaded');
            const model = gltf.scene;

            // Adjust Scale - Shuttles are big, but we need to fit the scene scale
            model.scale.set(1.5, 1.5, 1.5);

            // Rotate to point forward
            // The model likely faces +Z. We want it to align with our local +Z (which then gets rotated to +X)
            // Removing the 180 flip should fix the "flying backwards" issue.
            model.rotation.y = 0;

            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    // Ensure materials look good
                    if (child.material) {
                        child.material.metalness = 0.6;
                        child.material.roughness = 0.4;
                    }
                }
            });

            this.mesh.add(model);

            // Adjust orientation of container if needed
            this.mesh.rotation.y = -Math.PI / 2; // Face +X global

        }, undefined, (error) => {
            console.error('An error occurred loading the spacecraft:', error);
        });
    }

    createEngines() {
        // Adjust engine glow positions for the shuttle
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8
        });

        // Main Engines (3 main engines on shuttle)
        this.mainGlow = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2, 32), glowMat);
        this.mainGlow.rotation.x = Math.PI / 2;
        this.mainGlow.position.set(0, 0, -6.5); // Rear
        this.mesh.add(this.mainGlow);

        this.secondaryGlows = [];
        // Two OMS pods
        const leftOMS = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1, 16), glowMat);
        leftOMS.rotation.x = Math.PI / 2;
        leftOMS.position.set(1.5, 1.5, -6);
        this.mesh.add(leftOMS);
        this.secondaryGlows.push(leftOMS);

        const rightOMS = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1, 16), glowMat);
        rightOMS.rotation.x = Math.PI / 2;
        rightOMS.position.set(-1.5, 1.5, -6);
        this.mesh.add(rightOMS);
        this.secondaryGlows.push(rightOMS);
    }

    createNavLights() {
        // Port (Red) - Left Wingtip
        const portLight = new THREE.PointLight(0xff0000, 1, 5);
        portLight.position.set(4, -0.5, 2);
        this.mesh.add(portLight);

        // Starboard (Green) - Right Wingtip
        const starboardLight = new THREE.PointLight(0x00ff00, 1, 5);
        starboardLight.position.set(-4, -0.5, 2);
        this.mesh.add(starboardLight);

        const bulbGeo = new THREE.SphereGeometry(0.1);
        const redMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const greenMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

        this.portBulb = new THREE.Mesh(bulbGeo, redMat);
        this.portBulb.position.copy(portLight.position);
        this.mesh.add(this.portBulb);

        this.starboardBulb = new THREE.Mesh(bulbGeo, greenMat);
        this.starboardBulb.position.copy(starboardLight.position);
        this.mesh.add(this.starboardBulb);
    }

    engageAutopilot(targetVector) {
        console.log('Engaging Autopilot towards:', targetVector);
        this.autopilot.enabled = true;
        this.autopilot.target = targetVector;
        this.forwardSpeed = this.autopilotSpeed;
    }

    disengageAutopilot() {
        if (this.autopilot.enabled) {
            console.log('Autopilot Disengaged');
            this.autopilot.enabled = false;
            this.autopilot.target = null;
            this.forwardSpeed = this.defaultSpeed;
        }
    }

    toggleView() {
        if (this.viewMode === 'CHASE') {
            this.viewMode = 'COCKPIT';
            console.log('Switched to Cockpit View');
        } else {
            this.viewMode = 'CHASE';
            console.log('Switched to Chase View');
        }
    }

    /**
     * Steer spacecraft with arrow keys/WASD and mouse
     */
    steer(keys, deltaTime, mouseInput = { x: 0, y: 0 }) {
        // Check for manual override
        const isMouseMoving = Math.abs(mouseInput.x) > 0.1 || Math.abs(mouseInput.y) > 0.1;
        const isSteering = keys.left || keys.right || keys.up || keys.down || keys.boost || keys.brake;

        // Only disengage on mouse move if in Chase mode. In Cockpit, mouse is for selection only.
        const shouldDisengage = isSteering || (this.viewMode === 'CHASE' && isMouseMoving);

        if (shouldDisengage) {
            this.disengageAutopilot();
        }

        if (this.autopilot.enabled && this.autopilot.target) {
            this.updateAutopilot(deltaTime);
        } else {
            this.updateManualControl(keys, deltaTime, mouseInput);
        }

        // Always move forward in the direction we're facing
        const forward = new THREE.Vector3(1, 0, 0); // X-axis is forward
        forward.applyQuaternion(this.group.quaternion);

        // Set velocity to forward direction
        this.velocity.copy(forward).multiplyScalar(this.forwardSpeed);

        // Update position
        this.group.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    }

    updateAutopilot(deltaTime) {
        if (!this.autopilot.target) return;

        // Calculate direction to target
        const direction = new THREE.Vector3().subVectors(this.autopilot.target, this.group.position);

        // Check distance
        const distance = direction.length();
        if (distance < this.autopilot.minDistance) {
            console.log('Destination Reached');
            this.disengageAutopilot();
            this.forwardSpeed = 0; // Stop
            return;
        }

        // Rotate towards target smoothly
        const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(1, 0, 0), // Current forward is +X
            direction.normalize()
        );

        this.group.quaternion.slerp(targetQuaternion, 2.0 * deltaTime);
    }

    updateManualControl(keys, deltaTime, mouseInput) {
        // Speed Control
        if (keys.boost) {
            this.forwardSpeed = this.defaultSpeed * 4.0; // Boost is 4x current speed
        } else if (keys.brake) {
            this.forwardSpeed = 0;
        } else {
            this.forwardSpeed = this.defaultSpeed;
        }

        // Calculate steering direction from keys
        let steerX = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
        let steerY = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);

        // Mouse Influence (DISABLED per user request for keyboard-only navigation)
        /*
        if (this.viewMode === 'CHASE') {
            if (Math.abs(mouseInput.x) > 0.15) steerX += mouseInput.x * 2;
            if (Math.abs(mouseInput.y) > 0.15) steerY -= mouseInput.y * 2;
        }
        */

        // Apply steering rotation
        // Reduced rotation speed for smoother handling at low speeds
        const rotSpeed = 0.6 * deltaTime;

        // Pitch (up/down)
        if (Math.abs(steerY) > 0.01) {
            this.group.rotateZ(steerY * rotSpeed);
        }

        // Yaw (left/right)
        if (Math.abs(steerX) > 0.01) {
            this.group.rotateY(-steerX * rotSpeed);
        }

        // Visual Banking (Roll)
        // Bank the mesh into the turn. Steer Right (+steerX) -> Bank Right (Rotate -X local to mesh?).
        // Mesh X axis is perpendicular to Forward (+X global).
        // Let's rotate the mesh around its local X axis to bank.
        const targetBank = -steerX * 0.5; // Max 0.5 rad bank
        this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, targetBank, deltaTime * 2);
    }

    /**
     * Update camera to follow spacecraft (behind view)
     */
    updateCamera(camera) {
        let offset;
        let lookAhead;

        if (this.viewMode === 'COCKPIT') {
            // First Person: Position slightly in front of the nose
            offset = new THREE.Vector3(15, 3, 0);
            lookAhead = new THREE.Vector3(60, 0, 0); // Look far ahead
        } else {
            // Chase View (Far away)
            // User requested "far away", placing camera significantly behind
            offset = new THREE.Vector3(-120, 35, 0);
            lookAhead = new THREE.Vector3(20, 0, 0);
        }

        offset.applyQuaternion(this.group.quaternion);
        offset.add(this.group.position);

        // Smooth camera movement
        // Increase lerp speed for cockpit for snappier feel? Or keep smooth.
        const lerpFactor = this.viewMode === 'COCKPIT' ? 0.5 : 0.1;
        camera.position.lerp(offset, lerpFactor);

        // Look target
        lookAhead.applyQuaternion(this.group.quaternion);
        lookAhead.add(this.group.position);

        camera.lookAt(lookAhead);
    }

    update(deltaTime) {
        this.animationTime += deltaTime;

        // Pulse engine glow
        if (this.mainGlow) {
            // Flicker effect
            const flicker = 0.8 + Math.random() * 0.2;
            const thrustScale = this.forwardSpeed > 0 ? 1 : 0.2;
            this.mainGlow.material.opacity = flicker * thrustScale;
            this.mainGlow.scale.setScalar(0.8 + (this.forwardSpeed / this.autopilotSpeed) * 0.5);

            this.secondaryGlows.forEach(glow => {
                glow.material.opacity = flicker * 0.8 * thrustScale;
            });
        }

        // Blink Nav Lights
        if (this.portBulb && this.starboardBulb) {
            const blink = Math.floor(this.animationTime * 2) % 2 === 0;
            this.portBulb.material.color.setHex(blink ? 0xff0000 : 0x330000);
            this.starboardBulb.material.color.setHex(blink ? 0x00ff00 : 0x003300);
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
