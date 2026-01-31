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
        this.forwardSpeed = 1.0; // Increased base speed for better visibility
        this.defaultSpeed = 1.0;
        this.boostSpeed = 20; // Reduced boost slightly to match scale
        this.brakeSpeed = 0;  // Stop
        this.autopilotSpeed = 50; // Autopilot superspeed

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

        this.createSpacecraft();
    }

    createSpacecraft() {
        // Group to hold all parts
        this.mesh = new THREE.Group();
        this.group.add(this.mesh);

        // Generate textures
        this.panelTexture = this.generatePanelTexture(512, '#cfcfcf');

        // Create Modules
        this.createHull();
        this.createSolarPanels();
        this.createEngines();
        this.createAntenna();
        this.createRadiators();
        this.createNavLights();

        // Rotate entire ship to face +X
        this.mesh.rotation.y = -Math.PI / 2;
    }

    createHull() {
        // Materials
        const hullMat = new THREE.MeshStandardMaterial({
            map: this.panelTexture,
            roughness: 0.4,
            metalness: 0.8,
            bumpMap: this.panelTexture,
            bumpScale: 0.02
        });

        const darkMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.6,
            metalness: 0.5
        });

        const windowMat = new THREE.MeshPhysicalMaterial({
            color: 0x88ccff,
            metalness: 0.9,
            roughness: 0.1,
            transmission: 0.5,
            thickness: 0.5
        });

        // 1. Command Module (Front)
        const cmdGeo = new THREE.ConeGeometry(1.5, 3, 32);
        const cmdMod = new THREE.Mesh(cmdGeo, hullMat);
        cmdMod.rotation.x = -Math.PI / 2;
        cmdMod.position.z = 6; // Front
        this.mesh.add(cmdMod);

        // Cockpit Windows
        const winGeo = new THREE.SphereGeometry(0.8, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.3);
        const window = new THREE.Mesh(winGeo, windowMat);
        window.rotation.x = -Math.PI / 2;
        window.position.set(0, 0.8, 6.5);
        this.mesh.add(window);

        // 2. Service Module (Center)
        const svcGeo = new THREE.CylinderGeometry(1.8, 1.8, 5, 32);
        const svcMod = new THREE.Mesh(svcGeo, hullMat);
        svcMod.rotation.x = -Math.PI / 2;
        svcMod.position.z = 2;
        this.mesh.add(svcMod);

        // 3. Propulsion Link (Neck)
        const neckGeo = new THREE.CylinderGeometry(1.2, 1.2, 2, 16);
        const neck = new THREE.Mesh(neckGeo, darkMat);
        neck.rotation.x = -Math.PI / 2;
        neck.position.z = -1.5;
        this.mesh.add(neck);

        // 4. Engineering Module (Rear)
        const engGeo = new THREE.CylinderGeometry(2, 1.5, 4, 32);
        const engMod = new THREE.Mesh(engGeo, hullMat);
        engMod.rotation.x = -Math.PI / 2;
        engMod.position.z = -4.5;
        this.mesh.add(engMod);
    }

    createSolarPanels() {
        const panelMat = new THREE.MeshStandardMaterial({
            color: 0x112244,
            roughness: 0.2,
            metalness: 0.9,
            emissive: 0x001133,
            emissiveIntensity: 0.2,
            side: THREE.DoubleSide
        });

        const rodMat = new THREE.MeshStandardMaterial({ color: 0x888888 });

        // Array geometry
        const panelGeo = new THREE.BoxGeometry(12, 0.1, 3);

        // Left Array
        const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4), rodMat);
        leftArm.position.set(-3.5, 0, 2);
        leftArm.rotation.z = Math.PI / 2;
        this.mesh.add(leftArm);

        const leftPanel = new THREE.Mesh(panelGeo, panelMat);
        leftPanel.position.set(-0, 0, 0); // Relative to pivot

        // Pivot for rotation
        this.leftPanelPivot = new THREE.Group();
        this.leftPanelPivot.position.set(-6, 0, 2);
        this.leftPanelPivot.add(leftPanel);
        this.mesh.add(this.leftPanelPivot);

        // Right Array
        const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4), rodMat);
        rightArm.position.set(3.5, 0, 2);
        rightArm.rotation.z = Math.PI / 2;
        this.mesh.add(rightArm);

        const rightPanel = new THREE.Mesh(panelGeo, panelMat);
        rightPanel.position.set(0, 0, 0);

        this.rightPanelPivot = new THREE.Group();
        this.rightPanelPivot.position.set(6, 0, 2);
        this.rightPanelPivot.add(rightPanel);
        this.mesh.add(this.rightPanelPivot);
    }

    createEngines() {
        const engineMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.5,
            metalness: 0.7
        });

        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8
        });

        // Main Thruster
        const mainNozzle = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.5, 32, 1, true), engineMat);
        mainNozzle.rotation.x = Math.PI / 2; // Point back
        mainNozzle.position.z = -7;
        this.mesh.add(mainNozzle);

        // Glow
        const mainGlow = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.4, 32), glowMat);
        mainGlow.rotation.x = Math.PI / 2;
        mainGlow.position.z = -7.2;
        this.mesh.add(mainGlow);
        this.mainGlow = mainGlow;

        // 4x Secondary Thrusters
        this.secondaryGlows = [];
        const pos = [
            { x: 1.2, y: 1.2 }, { x: -1.2, y: 1.2 },
            { x: 1.2, y: -1.2 }, { x: -1.2, y: -1.2 }
        ];

        pos.forEach(p => {
            const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.8, 16, 1, true), engineMat);
            nozzle.rotation.x = Math.PI / 2;
            nozzle.position.set(p.x, p.y, -6.5);
            this.mesh.add(nozzle);

            const glow = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.7, 16), glowMat);
            glow.rotation.x = Math.PI / 2;
            glow.position.set(p.x, p.y, -6.6);
            this.mesh.add(glow);
            this.secondaryGlows.push(glow);
        });
    }

    createAntenna() {
        // Dish
        const dishGeo = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, 0.6);
        const dishMat = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            roughness: 0.5,
            metalness: 0.2,
            side: THREE.DoubleSide
        });
        const dish = new THREE.Mesh(dishGeo, dishMat);
        dish.position.set(0, 1.8, 2);
        dish.rotation.x = -Math.PI / 4;
        this.mesh.add(dish);

        // Feed
        const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1), dishMat);
        feed.rotation.x = Math.PI / 2;
        feed.position.set(0, 0, 0.5);
        dish.add(feed);
    }

    createRadiators() {
        const radMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.3,
            metalness: 0.1,
            emissive: 0xffffff,
            emissiveIntensity: 0.1
        });

        // Vertical radiator fins on Engineering module
        const finGeo = new THREE.BoxGeometry(0.2, 4, 3);

        const topFin = new THREE.Mesh(finGeo, radMat);
        topFin.position.set(0, 2.5, -4.5);
        this.mesh.add(topFin);

        const bottomFin = new THREE.Mesh(finGeo, radMat);
        bottomFin.position.set(0, -2.5, -4.5);
        this.mesh.add(bottomFin);
    }

    createNavLights() {
        // Navigation Lights (Red=Port/Left, Green=Starboard/Right)
        // Since mesh is rotated -90 Y:
        // Local +Z is Ship Front
        // Local +Y is Ship Top
        // Local +X is Ship Right (Starboard)
        // Local -X is Ship Left (Port)

        // Wait, I rotated mesh -PI/2 Y.
        // So global X+ is Forward.
        // Mesh local Z+ was Front. 
        // Let's stick to module coordinates: 
        // Command Module is at Z=6 (Front).
        // Left is X+? No.

        // Let's visualize: 
        // Mesh Z axis: Eng(-4.5) -> Cmd(6)
        // Mesh Y axis: Up
        // Mesh X axis: Side

        // Port (Left) -> Red. If looking forward (Z+), Left is X+.
        const portLight = new THREE.PointLight(0xff0000, 1, 5);
        portLight.position.set(2, 0, 3); // Left side
        this.mesh.add(portLight);

        // Starboard (Right) -> Green.
        const starboardLight = new THREE.PointLight(0x00ff00, 1, 5);
        starboardLight.position.set(-2, 0, 3); // Right side
        this.mesh.add(starboardLight);

        // Blinking mesh for visibility
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

    /**
     * Steer spacecraft with arrow keys/WASD and mouse
     */
    steer(keys, deltaTime, mouseInput = { x: 0, y: 0 }) {
        // Check for manual override
        if (keys.left || keys.right || keys.up || keys.down || Math.abs(mouseInput.x) > 0.1 || Math.abs(mouseInput.y) > 0.1 || keys.boost || keys.brake) {
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

        // Add mouse influence (FIXED DIRECTION)
        // Increased deadzone to prevent accidental drift
        if (Math.abs(mouseInput.x) > 0.15) steerX += mouseInput.x * 2;
        if (Math.abs(mouseInput.y) > 0.15) steerY -= mouseInput.y * 2;

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

        // Rotate solar panels slowly
        if (this.leftPanelPivot) this.leftPanelPivot.rotation.x = Math.sin(this.animationTime * 0.2) * 0.2;
        if (this.rightPanelPivot) this.rightPanelPivot.rotation.x = -Math.sin(this.animationTime * 0.2) * 0.2;

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

    generatePanelTexture(size = 512, color = '#cccccc') {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Fill background
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, size, size);

        // Draw panels
        ctx.strokeStyle = '#aaaaaa';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;

        const gridSize = 64;
        for (let y = 0; y < size; y += gridSize) {
            for (let x = 0; x < size; x += gridSize) {
                // Random fluctuations to make it look less perfect
                if (Math.random() > 0.2) {
                    ctx.strokeRect(x, y, gridSize, gridSize);

                    // Add little details inside
                    if (Math.random() > 0.5) {
                        ctx.fillStyle = '#999999';
                        const detSize = gridSize / 4;
                        ctx.fillRect(x + detSize, y + detSize, detSize, detSize);
                        ctx.fillStyle = color; // Reset
                    }
                }
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        return texture;
    }
}
