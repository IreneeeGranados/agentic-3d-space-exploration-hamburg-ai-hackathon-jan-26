/**
 * Camera Controller
 * Handles smooth camera animations and transitions
 */

import * as THREE from 'three';
import { gsap } from 'https://cdn.skypack.dev/gsap@3.12.2';

export class CameraController {
    constructor(camera, controls, spacecraft = null) {
        this.camera = camera;
        this.controls = controls;
        this.spacecraft = spacecraft;
        this.isAnimating = false;
    }

    /**
     * Smoothly travel to a planet
     * @param {Object} planet - The planet object to travel to
     * @param {number} duration - Animation duration in seconds
     */
    travelToPlanet(planet, duration = 2.5) {
        if (this.isAnimating) return;

        this.isAnimating = true;

        // Calculate optimal camera position
        const planetPosition = new THREE.Vector3();
        planet.mesh.getWorldPosition(planetPosition);

        // Distance based on planet size (maintain good viewing angle)
        const distance = planet.config.radius * 3.5;

        // Calculate camera position (offset from planet)
        const cameraOffset = new THREE.Vector3(
            distance * 0.8,
            distance * 0.4,
            distance * 0.8
        );

        const targetCameraPosition = planetPosition.clone().add(cameraOffset);

        // Notify spacecraft of navigation target
        if (this.spacecraft) {
            this.spacecraft.setNavigationTarget(planetPosition, duration);
        }

        // Animate camera position
        gsap.to(this.camera.position, {
            x: targetCameraPosition.x,
            y: targetCameraPosition.y,
            z: targetCameraPosition.z,
            duration: duration,
            ease: 'power2.inOut',
            onComplete: () => {
                // Notify spacecraft of arrival
                if (this.spacecraft) {
                    this.spacecraft.clearNavigationTarget();
                }
                this.isAnimating = false;
            }
        });

        // Animate controls target (where camera looks)
        gsap.to(this.controls.target, {
            x: planetPosition.x,
            y: planetPosition.y,
            z: planetPosition.z,
            duration: duration,
            ease: 'power2.inOut'
        });
    }

    /**
     * Return to home view (solar system overview)
     */
    returnToOverview(duration = 2.0) {
        if (this.isAnimating) return;

        this.isAnimating = true;

        // Default overview position
        const overviewPosition = { x: 0, y: 50, z: 150 };
        const overviewTarget = { x: 0, y: 0, z: 0 };

        // Notify spacecraft
        if (this.spacecraft) {
            this.spacecraft.clearNavigationTarget();
        }

        gsap.to(this.camera.position, {
            x: overviewPosition.x,
            y: overviewPosition.y,
            z: overviewPosition.z,
            duration: duration,
            ease: 'power2.inOut',
            onComplete: () => {
                this.isAnimating = false;
            }
        });

        gsap.to(this.controls.target, {
            x: overviewTarget.x,
            y: overviewTarget.y,
            z: overviewTarget.z,
            duration: duration,
            ease: 'power2.inOut'
        });
    }

    /**
     * Check if currently animating
     */
    isCurrentlyAnimating() {
        return this.isAnimating;
    }
}
