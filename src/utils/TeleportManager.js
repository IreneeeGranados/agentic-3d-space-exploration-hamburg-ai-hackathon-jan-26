import * as THREE from 'three';

/**
 * TeleportManager - Handles instant teleportation to planet coordinates
 */
export class TeleportManager {
    constructor(spacecraft, camera) {
        this.spacecraft = spacecraft;
        this.camera = camera;
        this.teleportOffset = 100; // Distance from planet to position spacecraft
    }

    /**
     * Instantly teleport to a planet using its coordinates_3d
     */
    teleportToPlanet(planetData) {
        if (!planetData || !planetData.characteristics?.coordinates_3d) {
            console.error('Invalid planet data for teleportation:', planetData);
            console.log('Planet data:', planetData);
            return false;
        }

        const coords = planetData.characteristics.coordinates_3d;

        // Check if coordinates are valid (use proper null check, not falsy - 0 is valid)
        if (coords.x_light_years === null || coords.x_light_years === undefined) {
            console.error('Planet has no valid coordinates:', planetData.pl_name);
            alert(`Cannot teleport to ${planetData.pl_name}: No coordinates available`);
            return false;
        }

        // Convert light years to scene units (1 light year = 10 scene units)
        const sceneScale = 10;
        const targetPosition = new THREE.Vector3(
            coords.x_light_years * sceneScale,
            coords.y_light_years * sceneScale,
            coords.z_light_years * sceneScale
        );

        console.log(`Teleporting to ${planetData.pl_name}`);
        console.log('Target coordinates (ly):', coords.x_light_years, coords.y_light_years, coords.z_light_years);
        console.log('Target position (scene units):', targetPosition);

        // Calculate offset position (approach from a distance)
        // Direction FROM origin TO target
        const directionFromOrigin = targetPosition.clone().normalize();
        const approachPosition = targetPosition.clone().sub(
            directionFromOrigin.multiplyScalar(this.teleportOffset)
        );

        console.log('Approach position:', approachPosition);

        // Instantly set spacecraft position
        this.spacecraft.group.position.copy(approachPosition);

        // Reset velocity to zero
        if (this.spacecraft.velocity) {
            this.spacecraft.velocity.set(0, 0, 0);
        }

        // Disengage autopilot first to reset state
        if (this.spacecraft.disengageAutopilot) {
            this.spacecraft.disengageAutopilot();
        }

        // Reset speed to default
        this.spacecraft.forwardSpeed = this.spacecraft.defaultSpeed || 1.0;

        // Point spacecraft towards planet
        this.spacecraft.group.lookAt(targetPosition);

        // Engage autopilot to fly to the planet
        if (this.spacecraft.engageAutopilot) {
            setTimeout(() => {
                this.spacecraft.engageAutopilot(targetPosition);
            }, 100);
        }

        console.log(`✓ Teleported to ${planetData.pl_name} at distance ${coords.x_light_years?.toFixed(1)} light-years`);
        return true;
    }

    /**
     * Teleport to specific 3D coordinates
     */
    teleportToCoordinates(x, y, z) {
        const position = new THREE.Vector3(x, y, z);
        this.spacecraft.group.position.copy(position);
        this.spacecraft.velocity.set(0, 0, 0);

        console.log(`Teleported to coordinates:`, position);
        return true;
    }

    /**
     * Teleport with visual effect (flash)
     */
    teleportWithEffect(planetData, onComplete) {
        // Validate first (use proper null checks)
        if (!planetData || !planetData.characteristics?.coordinates_3d ||
            planetData.characteristics.coordinates_3d.x_light_years === null ||
            planetData.characteristics.coordinates_3d.x_light_years === undefined) {
            console.error('Cannot teleport: Invalid planet data');
            return false;
        }

        // Create flash effect
        const flash = document.createElement('div');
        flash.id = 'teleport-flash';
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: radial-gradient(circle, rgba(255,0,110,0.8) 0%, rgba(0,212,255,0.6) 50%, transparent 100%);
            pointer-events: none;
            z-index: 9999;
            animation: teleportFlash 0.5s ease-out;
        `;

        // Add flash animation
        if (!document.getElementById('teleport-flash-style')) {
            const style = document.createElement('style');
            style.id = 'teleport-flash-style';
            style.textContent = `
                @keyframes teleportFlash {
                    0% { opacity: 0; transform: scale(0.5); }
                    50% { opacity: 1; transform: scale(1.2); }
                    100% { opacity: 0; transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(flash);

        // Perform teleport during flash peak
        setTimeout(() => {
            const success = this.teleportToPlanet(planetData);
            if (success && onComplete) {
                onComplete();
            }
        }, 250);

        // Remove flash effect
        setTimeout(() => {
            flash.remove();
        }, 500);

        return true;
    }

    /**
     * Set teleport offset distance
     */
    setOffset(distance) {
        this.teleportOffset = distance;
    }
}
