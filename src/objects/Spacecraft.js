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
        this.forwardSpeed = 10.0;
        this.defaultSpeed = 10.0;
        this.boostSpeed = 50;
        this.brakeSpeed = 0;
        this.autopilotSpeed = 80;

        // Steering
        this.steeringForce = 8;
        this.velocity = new THREE.Vector3(0, 0, 0);

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

        // Main Glow
        this.mainGlow = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2, 32), glowMat);
        this.mainGlow.rotation.x = Math.PI / 2;
        this.mainGlow.position.set(0, 0, -6.5);
        this.mesh.add(this.mainGlow);

        this.secondaryGlows = [];
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
        const portLight = new THREE.PointLight(0xff0000, 1, 5);
        portLight.position.set(4, -0.5, 2);
        this.mesh.add(portLight);

        const starboardLight = new THREE.PointLight(0x00ff00, 1, 5);
        starboardLight.position.set(-4, -0.5, 2);
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
        const isSteering = keys.left || keys.right || keys.up || keys.down || keys.boost || keys.brake;
        if (isSteering) this.disengageAutopilot();

        if (this.autopilot.enabled && this.autopilot.target) {
            this.updateAutopilot(deltaTime);
        } else {
            this.updateManualControl(keys, deltaTime, mouseInput);
        }

        const forward = new THREE.Vector3(1, 0, 0);
        forward.applyQuaternion(this.group.quaternion);
        this.velocity.copy(forward).multiplyScalar(this.forwardSpeed);
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

    updateManualControl(keys, deltaTime, mouseInput) {
        if (keys.speedUp) this.forwardSpeed += 20.0 * deltaTime;
        if (keys.speedDown) this.forwardSpeed -= 20.0 * deltaTime;
        if (keys.brake) this.forwardSpeed = 0;

        this.forwardSpeed = THREE.MathUtils.clamp(this.forwardSpeed, 0, 200);

        let steerX = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
        let steerY = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);

        const rotSpeed = 0.6 * deltaTime;
        if (Math.abs(steerY) > 0.01) this.group.rotateZ(steerY * rotSpeed);
        if (Math.abs(steerX) > 0.01) this.group.rotateY(-steerX * rotSpeed);

        const targetBank = -steerX * 0.5;
        this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, targetBank, deltaTime * 2);
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
