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
        this.minSpeed = 15.0;
        this.maxSpeed = 200.0;
        this.forwardSpeed = 30.0;
        this.autopilotSpeed = 100.0;

        // Arcade flight parameters
        this.turnSpeed = 1.5; // Faster turns
        this.pitchSpeed = 1.2; // Faster pitch
        this.bankLimit = 0.6;
        this.strafeFactor = 30.0; // More drift
        this.autoLevelSpeed = 4.0; // Snappier auto-leveling
        this.strafeDecay = 4.0; // Snappier strafe decay

        this.steeringForce = 8;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.lateralVelocity = 0; // Strafe speed component

        // Autopilot State
        this.autopilot = {
            enabled: false,
            target: null,
            minDistance: 30
        };

        // Animation
        this.animationTime = 0;

        // View Mode
        this.viewMode = 'CHASE';

        this.createSpacecraft();
    }

    createSpacecraft() {
        this.mesh = new THREE.Group();
        this.group.add(this.mesh);

        this.loadModel();

        // Add FX
        this.createEngines();
        this.createNavLights();
    }

    loadModel() {
        const loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
        loader.setDRACOLoader(dracoLoader);

        loader.load('assets/space_shuttle.glb', (gltf) => {
            console.log('Spacecraft Model Loaded');
            const model = gltf.scene;
            model.scale.set(1.5, 1.5, 1.5);
            model.rotation.y = 0;

            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        child.material.metalness = 0.6;
                        child.material.roughness = 0.4;
                    }
                }
            });

            this.mesh.add(model);
            // Re-orient model: GLB standard is usually -Z forward. 
            // We want nose to point towards +X (Forward).
            // Rotating +90 deg (Math.PI/2) on Y makes -Z point to +X? 
            // -Z -> +X is a 270 deg (or -90) rotation if we look from top.
            // Let's use Math.PI (180 deg) to flip it if it was flying backwards.
            // The user said it was flying backwards when it was at Math.PI/2. 
            // So we flip it to -Math.PI/2.
            this.mesh.rotation.y = -Math.PI / 2;
        }, undefined, (error) => {
            console.error('An error occurred loading the spacecraft:', error);
        });
    }

    createEngines() {
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8
        });

        // Main Glow - position at rear (-X)
        this.mainGlow = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2, 32), glowMat);
        this.mainGlow.rotation.z = -Math.PI / 2; // Point cone backwards (-X)
        this.mainGlow.position.set(-6.5, 0, 0);
        this.mesh.add(this.mainGlow);

        this.secondaryGlows = [];
        const leftOMS = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1, 16), glowMat);
        leftOMS.rotation.z = -Math.PI / 2;
        leftOMS.position.set(-6, 1.5, 1.5);
        this.mesh.add(leftOMS);
        this.secondaryGlows.push(leftOMS);

        const rightOMS = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1, 16), glowMat);
        rightOMS.rotation.z = -Math.PI / 2;
        rightOMS.position.set(-6, 1.5, -1.5);
        this.mesh.add(rightOMS);
        this.secondaryGlows.push(rightOMS);
    }

    createNavLights() {
        const portLight = new THREE.PointLight(0xff0000, 1, 5);
        portLight.position.set(2, -0.5, 4); // +Z is Left
        this.mesh.add(portLight);

        const starboardLight = new THREE.PointLight(0x00ff00, 1, 5);
        starboardLight.position.set(2, -0.5, -4); // -Z is Right
        this.mesh.add(starboardLight);

        this.portLight = portLight;
        this.starboardLight = starboardLight;
    }

    engageAutopilot(targetVector) {
        this.autopilot.enabled = true;
        this.autopilot.target = targetVector;
        this.forwardSpeed = this.autopilotSpeed;
    }

    disengageAutopilot() {
        if (this.autopilot.enabled) {
            this.autopilot.enabled = false;
            this.autopilot.target = null;
            this.forwardSpeed = this.defaultSpeed;
        }
    }

    toggleView() {
        this.viewMode = (this.viewMode === 'CHASE') ? 'COCKPIT' : 'CHASE';
    }

    steer(keys, deltaTime, mouseInput = { x: 0, y: 0 }) {
        const isSteering = keys.left || keys.right || keys.up || keys.down || keys.speedUp || keys.speedDown || keys.boost || keys.brake;
        if (isSteering) this.disengageAutopilot();

        if (this.autopilot.enabled && this.autopilot.target) {
            this.updateAutopilot(deltaTime);
        } else {
            this.updateManualControl(keys, deltaTime);
        }

        // Apply constant forward motion
        const forward = new THREE.Vector3(1, 0, 0);
        forward.applyQuaternion(this.group.quaternion);
        this.velocity.copy(forward).multiplyScalar(this.forwardSpeed);

        // Apply lateral strafe (drift) - side vector is +Z (Right)
        // Multiplying by lateralVelocity (negative on Left turn) moves us towards -Z (Left)
        const side = new THREE.Vector3(0, 0, 1);
        side.applyQuaternion(this.group.quaternion);
        this.velocity.add(side.multiplyScalar(this.lateralVelocity));

        // Update position
        this.group.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    }

    updateAutopilot(deltaTime) {
        if (!this.autopilot.target) return;
        const direction = new THREE.Vector3().subVectors(this.autopilot.target, this.group.position);
        if (direction.length() < this.autopilot.minDistance) {
            this.disengageAutopilot();
            this.forwardSpeed = 0;
            return;
        }
        const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(1, 0, 0),
            direction.normalize()
        );
        this.group.quaternion.slerp(targetQuaternion, 2.0 * deltaTime);
    }

    updateManualControl(keys, deltaTime) {
        // 1. Speed Control (W/S)
        if (keys.speedUp) this.forwardSpeed += 50.0 * deltaTime;
        if (keys.speedDown) this.forwardSpeed -= 50.0 * deltaTime;

        // Ensure perpetual motion within range
        this.forwardSpeed = THREE.MathUtils.clamp(this.forwardSpeed, this.minSpeed, this.maxSpeed);

        // 2. Turning (Arrows Left/Right)
        // turnInput: 1 for Left, -1 for Right
        let turnInput = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);

        if (Math.abs(turnInput) > 0.01) {
            // Local Yaw Rotation (around local Y axis)
            // Positive rotateY is CCW (Left) when nose is +X
            this.group.rotateY(turnInput * this.turnSpeed * deltaTime);

            // Lateral Strafe (Drift effect)
            // +Z is Left, so positive lateralVelocity = Drift Left
            const targetStrafe = turnInput * this.strafeFactor;
            this.lateralVelocity = THREE.MathUtils.lerp(this.lateralVelocity, targetStrafe, deltaTime * 5);
        } else {
            // Decay strafe when not turning
            this.lateralVelocity = THREE.MathUtils.lerp(this.lateralVelocity, 0, deltaTime * this.strafeDecay);
        }

        // 3. Pitching (Arrows Up/Down)
        let pitchInput = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);
        if (Math.abs(pitchInput) > 0.01) {
            // Local Pitch (around local Z axis)
            // Positive rotateZ is Pitch Up
            this.group.rotateZ(pitchInput * this.pitchSpeed * deltaTime);
        }

        // 4. Auto-Banking (Roll)
        // Tilting left around +X axis... 
        // In Three.js, Positive X rotation usually banks Right if looking down +X.
        // So targetBank = -turnInput * bankLimit.
        const targetBank = -turnInput * this.bankLimit;
        this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, targetBank, deltaTime * this.autoLevelSpeed);
    }

    updateCamera(camera) {
        let offset = (this.viewMode === 'COCKPIT')
            ? new THREE.Vector3(15, 3, 0)
            : new THREE.Vector3(-120, 35, 0);
        let lookAhead = (this.viewMode === 'COCKPIT')
            ? new THREE.Vector3(60, 0, 0)
            : new THREE.Vector3(20, 0, 0);

        offset.applyQuaternion(this.group.quaternion).add(this.group.position);
        camera.position.lerp(offset, (this.viewMode === 'COCKPIT') ? 0.5 : 0.1);

        lookAhead.applyQuaternion(this.group.quaternion).add(this.group.position);
        camera.lookAt(lookAhead);
    }

    update(deltaTime) {
        this.animationTime += deltaTime;

        // Pulse engine glow
        if (this.mainGlow) {
            const flicker = 0.8 + Math.random() * 0.2;
            const thrustScale = this.forwardSpeed > 0 ? 1 : 0.2;
            this.mainGlow.material.opacity = flicker * thrustScale;
            this.mainGlow.scale.setScalar(0.8 + (this.forwardSpeed / this.autopilotSpeed) * 0.5);
            this.secondaryGlows.forEach(glow => glow.material.opacity = flicker * 0.8 * thrustScale);
        }

        if (this.portLight && this.starboardLight) {
            const blink = Math.floor(this.animationTime * 2) % 2 === 0;
            this.portLight.intensity = blink ? 1 : 0.1;
            this.starboardLight.intensity = blink ? 1 : 0.1;
        }
    }

    getPosition() { return this.group.position.clone(); }
    getSpeed() { return this.forwardSpeed; }

    dispose() {
        this.group.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach(mat => mat.dispose());
                else child.material.dispose();
            }
        });
    }
}
