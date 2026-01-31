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
        if (!planetData) return false;

        let targetPosition;
        let planetName = planetData.pl_name || planetData.name || 'Unknown Planet';

        // Case 1: Exoplanet with coordinates_3d
        if (planetData.characteristics?.coordinates_3d) {
            const coords = planetData.characteristics.coordinates_3d;
            if (coords.x_light_years !== null && coords.x_light_years !== undefined) {
                const sceneScale = 10;
                targetPosition = new THREE.Vector3(
                    coords.x_light_years * sceneScale,
                    coords.y_light_years * sceneScale,
                    coords.z_light_years * sceneScale
                );
            }
        }

        // Case 2: Generic object/Solar system planet (already has position)
        if (!targetPosition && planetData.position) {
            targetPosition = planetData.position.clone ? planetData.position.clone() : new THREE.Vector3(planetData.position.x, planetData.position.y, planetData.position.z);
        }

        if (!targetPosition) {
            console.error('Invalid planet data for teleportation:', planetData);
            alert(`Cannot teleport to ${planetName}: No coordinates available`);
            return false;
        }

        return this.executeTeleport(targetPosition, planetName);
    }

    /**
     * Teleport to a specific Object3D or Vector3
     */
    teleportToObject(object, name = 'Target') {
        let targetPosition = new THREE.Vector3();

        if (object instanceof THREE.Vector3) {
            targetPosition.copy(object);
        } else if (object.getWorldPosition) {
            object.getWorldPosition(targetPosition);
        } else if (object.position) {
            targetPosition.copy(object.position);
        } else {
            console.error('Invalid object for teleportation:', object);
            return false;
        }

        return this.executeTeleport(targetPosition, name);
    }

    /**
     * Internal teleport execution logic
     */
    executeTeleport(targetPosition, planetName) {
        console.log(`Teleporting to ${planetName} at ${targetPosition.x}, ${targetPosition.y}, ${targetPosition.z}`);

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

        console.log(`✓ Teleported to ${planetName}`);
        return true;
    }

    /**
     * Teleport to specific 3D coordinates
     */
    teleportToCoordinates(x, y, z) {
        const position = new THREE.Vector3(x, y, z);
        return this.executeTeleport(position, 'Coordinates');
    }

    /**
     * Teleport with visual effect (flash)
     */
    teleportWithEffect(planetOrObject, onComplete) {
        // Create flash effect
        const flash = document.createElement('div');
        flash.id = 'teleport-flash';
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,0,110,0.8) 30%, rgba(0,212,255,0.4) 70%, transparent 100%);
            pointer-events: none;
            z-index: 9999;
            opacity: 0;
            mix-blend-mode: screen;
            animation: teleportFlashCinematic 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        `;

        // Add flash animation
        if (!document.getElementById('teleport-flash-style')) {
            const style = document.createElement('style');
            style.id = 'teleport-flash-style';
            style.textContent = `
                @keyframes teleportFlashCinematic {
                    0% { opacity: 0; transform: scale(0.8); filter: brightness(1); }
                    10% { opacity: 1; transform: scale(1.1); filter: brightness(2); }
                    50% { opacity: 1; transform: scale(1.2); filter: brightness(5); }
                    100% { opacity: 0; transform: scale(1); filter: brightness(1); }
                }
                .shake-camera {
                    animation: screenShake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                }
                @keyframes screenShake {
                    10%, 90% { transform: translate3d(-2px, 0, 0); }
                    20%, 80% { transform: translate3d(4px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-8px, 0, 0); }
                    40%, 60% { transform: translate3d(8px, 0, 0); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(flash);

        // Play sound effect
        this.playTeleportSound();

        // Apply screen shake to canvas
        const canvas = document.getElementById('canvas');
        if (canvas) {
            canvas.classList.add('shake-camera');
            setTimeout(() => canvas.classList.remove('shake-camera'), 400);
        }

        // Perform teleport during flash peak
        setTimeout(() => {
            let success = false;
            if (planetOrObject instanceof THREE.Object3D || planetOrObject instanceof THREE.Vector3) {
                success = this.teleportToObject(planetOrObject);
            } else {
                success = this.teleportToPlanet(planetOrObject);
            }

            if (success && onComplete) {
                onComplete();
            }
        }, 200);

        // Remove flash effect
        setTimeout(() => {
            flash.remove();
        }, 600);

        return true;
    }

    /**
     * Teleport with a percentage-based approximation progress bar
     */
    teleportWithProgress(planetOrObject, onComplete) {
        const hud = document.getElementById('warp-hud');
        const progressBar = document.getElementById('warp-progress-bar');
        const percentageText = document.getElementById('warp-percentage');
        const statusText = document.getElementById('warp-status');

        if (!hud || !progressBar || !percentageText || !statusText) {
            console.error('[DEBUG] Warp HUD elements not found', { hud, progressBar, percentageText, statusText });
            return this.teleportWithEffect(planetOrObject, onComplete);
        }
        console.log('[DEBUG] Warp HUD elements found, starting progress sequence');

        // Reset HUD
        hud.classList.remove('hidden');
        progressBar.style.width = '0%';
        percentageText.textContent = '0%';
        statusText.textContent = 'CALCULATING VECTOR...';

        let progress = 0;
        const duration = 2500; // 2.5 seconds total
        const startTime = Date.now();

        // Play initial sound
        this.playTeleportSound();

        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            progress = Math.min(100, Math.floor((elapsed / duration) * 100));

            progressBar.style.width = `${progress}%`;
            percentageText.textContent = `${progress}%`;

            // Update status messages
            if (progress < 20) {
                statusText.textContent = 'CALCULATING VECTOR...';
            } else if (progress < 40) {
                statusText.textContent = 'INITIATING FOLD...';
            } else if (progress < 70) {
                statusText.textContent = 'APPROXIMATING DESTINATION...';
            } else if (progress < 90) {
                statusText.textContent = 'SYNCHRONIZING ORBIT...';
            } else {
                statusText.textContent = 'WARP COMPLETE';
            }

            if (progress < 100) {
                requestAnimationFrame(updateProgress);
            } else {
                // Done!
                setTimeout(() => {
                    hud.classList.add('hidden');

                    // Perform the actual teleport at the very end
                    let success = false;

                    // Robust check for Three.js objects or data objects
                    const isThreeObject = planetOrObject && (planetOrObject.isObject3D || planetOrObject.isVector3 || typeof planetOrObject.getWorldPosition === 'function');

                    if (isThreeObject) {
                        success = this.teleportToObject(planetOrObject);
                    } else {
                        success = this.teleportToPlanet(planetOrObject);
                    }

                    if (success && onComplete) {
                        onComplete();
                    }
                }, 300);
            }
        };

        requestAnimationFrame(updateProgress);
        return true;
    }

    /**
     * Synthesize a "warp" sound effect using Web Audio API
     */
    playTeleportSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const masterGain = ctx.createGain();
            masterGain.connect(ctx.destination);

            // Low sweep
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(40, ctx.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
            osc1.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);

            gain1.gain.setValueAtTime(0, ctx.currentTime);
            gain1.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
            gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

            osc1.connect(gain1);
            gain1.connect(masterGain);

            // High chime/shimmer
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1200, ctx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.4);

            gain2.gain.setValueAtTime(0, ctx.currentTime);
            gain2.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1);
            gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

            osc2.connect(gain2);
            gain2.connect(masterGain);

            osc1.start();
            osc2.start();
            osc1.stop(ctx.currentTime + 0.6);
            osc2.stop(ctx.currentTime + 0.6);

            masterGain.gain.setValueAtTime(0.5, ctx.currentTime);
            masterGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

        } catch (e) {
            console.warn('Web Audio API not supported or blocked:', e);
        }
    }

    /**
     * Set teleport offset distance
     */
    setOffset(distance) {
        this.teleportOffset = distance;
    }
}
