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
        this.maxSpeed = 200000.0;
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
        // Engines removed per user request
        this.createNavLights();
    }

    loadModel() {
        const loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
        loader.setDRACOLoader(dracoLoader);

        // Load spacecraft textures
        const textureLoader = new THREE.TextureLoader();
        const diffuseTexture = textureLoader.load('textures/spacecraft/hull_diffuse.png');
        const normalTexture = textureLoader.load('textures/spacecraft/hull_normal.png');

        // Configure textures
        diffuseTexture.colorSpace = THREE.SRGBColorSpace;
        diffuseTexture.wrapS = THREE.RepeatWrapping;
        diffuseTexture.wrapT = THREE.RepeatWrapping;
        diffuseTexture.repeat.set(2, 2);

        normalTexture.wrapS = THREE.RepeatWrapping;
        normalTexture.wrapT = THREE.RepeatWrapping;
        normalTexture.repeat.set(2, 2);

        loader.load('assets/space_shuttle.glb', (gltf) => {
            console.log('Spacecraft Model Loaded');
            const model = gltf.scene;
            model.scale.set(1.5, 1.5, 1.5);
            model.rotation.y = 0;

            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = false; // Disable self-shadowing to prevent "square" artifacts

                    // Apply custom spacecraft material with textures
                    child.material = new THREE.MeshStandardMaterial({
                        map: diffuseTexture,
                        normalMap: normalTexture,
                        normalScale: new THREE.Vector2(0.8, 0.8),
                        metalness: 0.7,
                        roughness: 0.35,
                        envMapIntensity: 1.2,
                        color: new THREE.Color(0xe8e8e8) // Slight tint for spacecraft white
                    });
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
        // 1. Speed Control (W/S) - Exponential Acceleration
        // Scaling acceleration based on current speed allows reaching high speeds reasonably
        // Adjusted factor for smoother control at high speeds
        const acceleration = Math.max(50.0, this.forwardSpeed * 1.5);

        if (keys.speedUp) this.forwardSpeed += acceleration * deltaTime;
        if (keys.speedDown) this.forwardSpeed -= acceleration * deltaTime;

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

        // Dynamic camera catch-up based on speed AND distance
        const distance = camera.position.distanceTo(offset);
        let lerpFactor = 0.1;

        // Dynamic FOV Effect (Warp Speed Sensation)
        // Base FOV is usually 60 or 75. We widen it as speed increases.
        const baseFOV = 60;
        const maxFOV = 100;
        // Normalize speed for effect (0 to 1 range for speeds 0 to 5000)
        const effectIntensity = Math.min(this.forwardSpeed / 5000, 1.0);

        const targetFOV = THREE.MathUtils.lerp(baseFOV, maxFOV, effectIntensity);
        // Smoothly interpolate current FOV to target
        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV, 0.05);
        camera.updateProjectionMatrix();

        if (this.viewMode === 'COCKPIT') {
            // FIX: Hard lock for cockpit to prevent jitter/float
            lerpFactor = 1.0;
        } else {
            // Speed-based camera follow: faster ship = snappier camera
            // This prevents camera lag and clipping at high speeds
            const speedRatio = Math.min(this.forwardSpeed / 1000, 1.0); // Normalize to 0-1 for speeds up to 1000
            const baseMinLerp = 0.1;
            const baseMaxLerp = 0.8;

            // Higher speed = higher base lerp factor
            lerpFactor = THREE.MathUtils.lerp(baseMinLerp, baseMaxLerp, speedRatio);

            // Distance-based adjustments (tighter thresholds for responsiveness)
            const speedAdjustedThreshold = Math.max(50, 200 - speedRatio * 150);

            if (distance > speedAdjustedThreshold) {
                // Camera falling behind - increase lerp
                lerpFactor = Math.min(lerpFactor + 0.3, 0.95);
            }

            if (distance > speedAdjustedThreshold * 3) {
                // Camera way behind - snap harder
                lerpFactor = 0.98;
            }

            if (distance > speedAdjustedThreshold * 10 || this.forwardSpeed > 50000) {
                // Warp speed or extreme lag - hard teleport to prevent clipping
                camera.position.copy(offset);
                lerpFactor = 1.0;
            }
        }

        camera.position.lerp(offset, lerpFactor);

        // Camera Shake Effect at high speeds
        if (this.forwardSpeed > 500) {
            const shakeIntensity = Math.min((this.forwardSpeed - 500) / 5000, 1.0) * 0.5;
            camera.position.x += (Math.random() - 0.5) * shakeIntensity;
            camera.position.y += (Math.random() - 0.5) * shakeIntensity;
            camera.position.z += (Math.random() - 0.5) * shakeIntensity;
        }

        lookAhead.applyQuaternion(this.group.quaternion).add(this.group.position);
        camera.lookAt(lookAhead);
    }

    checkProximity(planets) {
        if (!planets) return;

        let nearestDist = Infinity;
        let nearestPlanetRadius = 1.0;

        for (const planet of planets) {
            // Planet position might be direct or in a group
            let planetPos = new THREE.Vector3();
            let radius = 1000.0; // Default

            if (planet.position) {
                // Check if it's a Vector3 (Solar system planet mesh/group)
                if (planet.position.isVector3) {
                    planetPos.copy(planet.position);
                    // Try to get radius from geometry or data
                    if (planet.geometry && planet.geometry.parameters) {
                        radius = planet.geometry.parameters.radius;
                    } else if (planet.userData && planet.userData.radius) {
                        radius = planet.userData.radius;
                    }
                }
            }

            const dist = this.group.position.distanceTo(planetPos);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestPlanetRadius = radius;
            }
        }

        // Safety Bubble Logic
        // If within 3x radius, enforce speed limit
        const safetyThreshold = nearestPlanetRadius * 4.0;

        if (nearestDist < safetyThreshold) {
            // Calculate safety speed based on how close we are
            // Closer = Slower
            // at 1x radius (surface) -> max speed 50
            // at 4x radius -> max speed 2000

            const factor = Math.max(0, (nearestDist - nearestPlanetRadius) / (safetyThreshold - nearestPlanetRadius));
            const safeMaxSpeed = THREE.MathUtils.lerp(50.0, 5000.0, factor);

            // Apply damping if current speed is too high
            if (this.forwardSpeed > safeMaxSpeed) {
                this.forwardSpeed = THREE.MathUtils.lerp(this.forwardSpeed, safeMaxSpeed, 0.05); // Rapid deceleration
            }
        }
    }

    update(deltaTime, nearbyPlanets = []) {
        this.animationTime += deltaTime;

        // Check proximity to nearby planets to adjust speed
        this.checkProximity(nearbyPlanets);


        // Pulse engine glow


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
