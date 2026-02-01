import * as THREE from 'three';

/**
 * PlanetTargetingSquare - Visual indicator for selected/targeted planets
 * Creates a square highlight that scales with the planet and scaleGroup
 */
export class PlanetTargetingSquare {
    constructor(scene) {
        this.scene = scene;
        this.targetSquare = null;
        this.targetedPlanet = null;
        this.animationPhase = 0;
        this.createSquare();
    }

    createSquare() {
        // Create a spacecraft targeting reticle
        this.targetSquare = new THREE.Group();
        this.targetSquare.visible = false;
        this.targetSquare.name = 'PlanetTargetingSquare'; // Add name for debugging
        
        const size = 1; // Will be scaled relative to planet
        const cornerSize = 0.3; // Length of corner brackets
        
        // Glowing cyan material for targeting reticle
        const material = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            linewidth: 3, // Thicker lines
            transparent: true,
            opacity: 1.0, // Full opacity initially
            depthTest: false, // Don't hide behind planets
            depthWrite: false
        });

        // Create corner brackets (L-shaped corners)
        const cornerGeometry = new THREE.BufferGeometry();
        const corners = new Float32Array([
            // Top-left corner
            -size, size - cornerSize, 0,  -size, size, 0,
            -size, size, 0,  -size + cornerSize, size, 0,
            
            // Top-right corner
            size - cornerSize, size, 0,  size, size, 0,
            size, size, 0,  size, size - cornerSize, 0,
            
            // Bottom-right corner
            size, -size + cornerSize, 0,  size, -size, 0,
            size, -size, 0,  size - cornerSize, -size, 0,
            
            // Bottom-left corner
            -size + cornerSize, -size, 0,  -size, -size, 0,
            -size, -size, 0,  -size, -size + cornerSize, 0
        ]);
        
        cornerGeometry.setAttribute('position', new THREE.BufferAttribute(corners, 3));
        this.cornerBrackets = new THREE.LineSegments(cornerGeometry, material);
        this.targetSquare.add(this.cornerBrackets);

        // Create outer ring
        const ringGeometry = new THREE.RingGeometry(size * 1.1, size * 1.15, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            depthTest: true,
            depthWrite: false
        });
        this.outerRing = new THREE.Mesh(ringGeometry, ringMaterial);
        this.targetSquare.add(this.outerRing);

        // Create center crosshair
        const crosshairGeometry = new THREE.BufferGeometry();
        const crossSize = 0.15;
        const crosshair = new Float32Array([
            // Horizontal line
            -crossSize, 0, 0,  crossSize, 0, 0,
            // Vertical line
            0, -crossSize, 0,  0, crossSize, 0
        ]);
        crosshairGeometry.setAttribute('position', new THREE.BufferAttribute(crosshair, 3));
        this.centerCross = new THREE.LineSegments(crosshairGeometry, material.clone());
        this.centerCross.material.linewidth = 3;
        this.targetSquare.add(this.centerCross);

        // Create scanning lines (animated)
        const scanLineGeometry = new THREE.BufferGeometry();
        const scanLines = new Float32Array([
            // Horizontal scan lines
            -size * 0.8, size * 0.5, 0,  size * 0.8, size * 0.5, 0,
            -size * 0.8, 0, 0,  size * 0.8, 0, 0,
            -size * 0.8, -size * 0.5, 0,  size * 0.8, -size * 0.5, 0
        ]);
        scanLineGeometry.setAttribute('position', new THREE.BufferAttribute(scanLines, 3));
        this.scanLines = new THREE.LineSegments(scanLineGeometry, material.clone());
        this.scanLines.material.opacity = 0.4;
        this.targetSquare.add(this.scanLines);

        // Add to scene (not as a child of anything specific)
        this.scene.add(this.targetSquare);
    }

    /**
     * Target a planet mesh
     * @param {THREE.Object3D} planetMesh - The planet mesh to target
     * @param {Object} planetData - Planet data for reference
     * @param {THREE.Group} parentGroup - The parent group (like exoplanetField.meshGroup)
     */
    target(planetMesh, planetData = null, parentGroup = null) {
        console.log('🎯 target() called with:', {
            mesh: planetMesh?.type,
            planetName: planetData?.pl_name,
            hasParentGroup: !!parentGroup
        });
        
        if (!planetMesh) {
            console.warn('⚠️ No planetMesh provided to target()');
            this.hide();
            return;
        }

        this.targetedPlanet = planetMesh;
        this.planetData = planetData;
        this.parentGroup = parentGroup;

        // Calculate the scale needed for the square
        // We want it to be about 2x the planet's rendered size
        const planetRadius = this.getPlanetRadius(planetMesh);
        const squareSize = planetRadius * 3.0; // Increased from 2.5 to 3.0

        // Get world position of the planet
        const worldPos = new THREE.Vector3();
        planetMesh.getWorldPosition(worldPos);

        // Position the square at the planet
        this.targetSquare.position.copy(worldPos);
        
        console.log('🎯 Positioning square at:', worldPos);
        console.log('🎯 Planet radius:', planetRadius, 'Square size:', squareSize);
        
        // Scale the square to fit the planet
        // The square needs to account for the parent group's scale
        if (parentGroup && parentGroup.scale) {
            // If the planet is in a scaled group, we need to counteract that scale
            // because the square is in world space
            const groupScale = parentGroup.scale.x; // Assume uniform scale
            this.targetSquare.scale.setScalar(squareSize * groupScale);
            console.log('🎯 Using parent group scale:', groupScale, 'Final scale:', squareSize * groupScale);
        } else {
            this.targetSquare.scale.setScalar(squareSize);
            console.log('🎯 No parent group, scale:', squareSize);
        }

        // Make visible
        this.targetSquare.visible = true;
        this.animationPhase = 0;

        console.log('✅ Target square now visible:', this.targetSquare.visible);
        console.log('✅ Target square in scene:', this.scene.children.includes(this.targetSquare));
    }

    /**
     * Get the visual radius of a planet mesh
     */
    getPlanetRadius(mesh) {
        // Try to get the geometry bounding sphere
        if (mesh.geometry && mesh.geometry.boundingSphere) {
            if (!mesh.geometry.boundingSphere) {
                mesh.geometry.computeBoundingSphere();
            }
            return mesh.geometry.boundingSphere.radius * mesh.scale.x;
        }
        
        // Fallback: use scale
        return mesh.scale.x || 1;
    }

    /**
     * Update animation - call this in the render loop
     * @param {THREE.Camera} camera - Camera to face towards
     */
    update(camera) {
        if (!this.targetSquare.visible || !this.targetedPlanet) return;

        // Update position to follow the planet
        const worldPos = new THREE.Vector3();
        this.targetedPlanet.getWorldPosition(worldPos);
        this.targetSquare.position.copy(worldPos);

        // Make reticle face the camera (billboard effect)
        if (camera) {
            this.targetSquare.quaternion.copy(camera.quaternion);
        }

        // Animation phase
        this.animationPhase += 0.05;
        const pulse = Math.sin(this.animationPhase) * 0.5 + 0.5;

        // Pulse corner brackets
        if (this.cornerBrackets) {
            this.cornerBrackets.material.opacity = 0.7 + pulse * 0.3;
        }

        // Rotate outer ring slowly
        if (this.outerRing) {
            this.outerRing.rotation.z += 0.01;
            this.outerRing.material.opacity = 0.2 + pulse * 0.2;
        }

        // Pulse center crosshair
        if (this.centerCross) {
            this.centerCross.material.opacity = 0.8 + pulse * 0.2;
            this.centerCross.scale.setScalar(0.9 + pulse * 0.2);
        }

        // Animate scan lines
        if (this.scanLines) {
            this.scanLines.material.opacity = 0.3 + pulse * 0.3;
            this.scanLines.position.y = Math.sin(this.animationPhase * 2) * 0.1;
        }

        // Slow rotation of corner brackets for lock-on effect
        if (this.cornerBrackets) {
            this.cornerBrackets.rotation.z += 0.005;
        }
    }

    /**
     * Hide the targeting square
     */
    hide() {
        if (this.targetSquare) {
            this.targetSquare.visible = false;
        }
        this.targetedPlanet = null;
        this.planetData = null;
    }

    /**
     * Check if currently targeting
     */
    isTargeting() {
        return this.targetSquare && this.targetSquare.visible;
    }

    /**
     * Dispose of resources
     */
    dispose() {
        if (this.targetSquare) {
            // Dispose all child geometries and materials
            this.targetSquare.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            this.scene.remove(this.targetSquare);
        }
    }
}
