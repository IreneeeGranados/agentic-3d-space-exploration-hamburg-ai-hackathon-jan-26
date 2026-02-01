/**
 * DynamicStarField Class
 * Creates a dynamic star field that follows the camera through infinite space
 * Stars continuously regenerate around the camera position for seamless exploration
 */

import * as THREE from 'three';
import { generateStarTexture } from '../utils/textureGenerator.js';

export class DynamicStarField {
    constructor(count = 20000, spread = 2000) {
        this.count = count;
        this.spread = spread; // How far stars spread from camera
        this.geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(this.count * 3);
        this.colors = new Float32Array(this.count * 3);
        this.sizes = new Float32Array(this.count);
        this.velocities = new Float32Array(this.count * 3);
        
        // Star color palette
        this.starColors = [
            new THREE.Color(0x9bb2ff), // O-type (Blue)
            new THREE.Color(0xbbccff), // B-type (Blue-white)
            new THREE.Color(0xfbf8ff), // A-type (White)
            new THREE.Color(0xfff5f2), // F-type (Yellow-white)
            new THREE.Color(0xfff2a1), // G-type (Yellow)
            new THREE.Color(0xffd2a1), // K-type (Orange)
            new THREE.Color(0xffcc6f)  // M-type (Red)
        ];
        
        this.lastCameraPosition = new THREE.Vector3();
        this.createStarField();
    }

    createStarField() {
        // Initialize all stars randomly in space
        for (let i = 0; i < this.count; i++) {
            this.resetStar(i);
        }

        this.geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(this.positions, 3)
        );
        this.geometry.setAttribute(
            'color',
            new THREE.BufferAttribute(this.colors, 3)
        );
        this.geometry.setAttribute(
            'size',
            new THREE.BufferAttribute(this.sizes, 1)
        );

        const material = new THREE.PointsMaterial({
            size: 1.5,
            map: generateStarTexture(64),
            vertexColors: true,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.9,
            alphaTest: 0.05,
            blending: THREE.NormalBlending,
            depthWrite: false, // Stars don't write depth (so planets always occlude them)
            depthTest: true     // Stars DO read depth buffer
        });

        this.mesh = new THREE.Points(this.geometry, material);
        this.mesh.renderOrder = -999; // Render stars FIRST (background layer)
    }

    resetStar(index) {
        const i3 = index * 3;
        
        // Random position in a cube around origin
        this.positions[i3] = (Math.random() - 0.5) * this.spread * 2;
        this.positions[i3 + 1] = (Math.random() - 0.5) * this.spread * 2;
        this.positions[i3 + 2] = (Math.random() - 0.5) * this.spread * 2;

        // Random color
        const color = this.starColors[Math.floor(Math.random() * this.starColors.length)].clone();
        const brightness = 0.5 + Math.random() * 0.5;
        color.multiplyScalar(brightness);
        
        this.colors[i3] = color.r;
        this.colors[i3 + 1] = color.g;
        this.colors[i3 + 2] = color.b;

        // Random size
        this.sizes[index] = Math.random() * 2.5 + 0.5;

        // Slow drift velocity for dynamic movement
        this.velocities[i3] = (Math.random() - 0.5) * 0.1;
        this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
        this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
    }

    update(cameraPosition) {
        // Move stars slightly for parallax effect
        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;
            
            // Apply velocity for slow drift
            this.positions[i3] += this.velocities[i3];
            this.positions[i3 + 1] += this.velocities[i3 + 1];
            this.positions[i3 + 2] += this.velocities[i3 + 2];
            
            // Calculate star position relative to camera
            const dx = this.positions[i3] + this.lastCameraPosition.x - cameraPosition.x;
            const dy = this.positions[i3 + 1] + this.lastCameraPosition.y - cameraPosition.y;
            const dz = this.positions[i3 + 2] + this.lastCameraPosition.z - cameraPosition.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // If star is too far from camera, respawn it closer
            if (distance > this.spread * 1.2) {
                // Reset star in front/around camera direction
                const angle1 = Math.random() * Math.PI * 2;
                const angle2 = Math.random() * Math.PI * 2;
                const radius = this.spread * (0.3 + Math.random() * 0.4);
                
                this.positions[i3] = cameraPosition.x + Math.cos(angle1) * Math.sin(angle2) * radius - this.lastCameraPosition.x;
                this.positions[i3 + 1] = cameraPosition.y + Math.sin(angle1) * Math.sin(angle2) * radius - this.lastCameraPosition.y;
                this.positions[i3 + 2] = cameraPosition.z + Math.cos(angle2) * radius - this.lastCameraPosition.z;
            }
        }

        // Update camera tracking position for relative positioning
        this.lastCameraPosition.copy(cameraPosition);
        this.mesh.position.copy(cameraPosition);

        // Mark position attribute as needing update
        this.geometry.attributes.position.needsUpdate = true;
    }

    dispose() {
        this.geometry.dispose();
        this.mesh.material.dispose();
    }
}
