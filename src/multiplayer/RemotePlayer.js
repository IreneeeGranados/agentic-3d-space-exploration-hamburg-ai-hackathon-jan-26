/**
 * RemotePlayer Class
 * Represents other players in the multiplayer session
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export class RemotePlayer {
    constructor(playerId, playerData) {
        this.playerId = playerId;
        this.nickname = playerData.nickname || `Player ${playerId.slice(0, 6)}`;
        this.group = new THREE.Group();
        
        // Network interpolation for smooth movement
        this.targetPosition = new THREE.Vector3();
        this.targetRotation = new THREE.Euler();
        this.targetQuaternion = null; // For accurate rotation sync
        this.currentSpeed = 0;
        this.viewMode = playerData.viewMode || 'CHASE';
        this.lastLogTime = 0; // For debug logging
        
        if (playerData.position) {
            this.targetPosition.copy(playerData.position);
            this.group.position.copy(playerData.position);
        }
        
        if (playerData.rotation) {
            this.targetRotation.copy(playerData.rotation);
            this.group.rotation.copy(playerData.rotation);
        }
        
        this.mesh = null;
        this.loadModel();
        this.createNameTag();
        this.createTrailEffect();
    }
    
    loadModel() {
        const loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
        loader.setDRACOLoader(dracoLoader);
        
        loader.load('assets/space_shuttle.glb', (gltf) => {
            this.mesh = gltf.scene;
            this.mesh.scale.set(1.5, 1.5, 1.5);
            
            // Apply semi-transparent material to distinguish from local player
            this.mesh.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = false;
                    if (child.material) {
                        child.material = child.material.clone();
                        child.material.opacity = 0.85;
                        child.material.transparent = true;
                        child.material.emissive = new THREE.Color(0x00ff88);
                        child.material.emissiveIntensity = 0.2;
                    }
                }
            });
            
            this.mesh.rotation.y = -Math.PI / 2;
            this.group.add(this.mesh);
        }, undefined, (error) => {
            console.error('Failed to load remote player model:', error);
        });
    }
    
    createNameTag() {
        // Create canvas for name tag
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        
        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw border
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
        
        // Draw text
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.nickname, canvas.width / 2, canvas.height / 2);
        
        // Create sprite
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            depthTest: false
        });
        
        this.nameTag = new THREE.Sprite(material);
        this.nameTag.scale.set(100, 25, 1);
        this.nameTag.position.y = 35;
        this.group.add(this.nameTag);
    }
    
    createTrailEffect() {
        // Create a simple trail effect
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(100 * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.LineBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.3
        });
        
        this.trail = new THREE.Line(geometry, material);
        this.trailPositions = [];
        this.group.add(this.trail);
    }
    
    updateFromNetwork(data) {
        // Update target position
        if (data.position) {
            this.targetPosition.set(data.position.x, data.position.y, data.position.z);
        }
        
        // Update target rotation
        if (data.rotation) {
            this.targetRotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
        }
        
        // Use quaternion if available (more accurate)
        if (data.quaternion) {
            this.targetQuaternion = new THREE.Quaternion(
                data.quaternion.x,
                data.quaternion.y,
                data.quaternion.z,
                data.quaternion.w
            );
        }
        
        if (data.speed !== undefined) {
            this.currentSpeed = data.speed;
        }
        if (data.viewMode) {
            this.viewMode = data.viewMode;
        }
        
        // Debug log occasionally
        const now = Date.now();
        if (!this.lastLogTime || now - this.lastLogTime > 3000) {
            console.log(`🎮 Remote player "${this.nickname}" at (${data.position.x.toFixed(1)}, ${data.position.y.toFixed(1)}, ${data.position.z.toFixed(1)})`);
            this.lastLogTime = now;
        }
    }
    
    updateNickname(nickname) {
        this.nickname = nickname;
        // Recreate name tag with new nickname
        this.group.remove(this.nameTag);
        this.createNameTag();
    }
    
    update(deltaTime) {
        // Smooth interpolation for position (lerp)
        const lerpFactor = Math.min(deltaTime * 10, 1); // Adjust for smoothness
        this.group.position.lerp(this.targetPosition, lerpFactor);
        
        // Use quaternion for rotation if available (more accurate)
        if (this.targetQuaternion) {
            this.group.quaternion.slerp(this.targetQuaternion, lerpFactor);
        } else {
            // Fallback to Euler rotation
            this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, this.targetRotation.x, lerpFactor);
            this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, this.targetRotation.y, lerpFactor);
            this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, this.targetRotation.z, lerpFactor);
        }
        
        // Update trail effect
        this.updateTrail();
        
        // Make name tag always face camera (billboard effect)
        if (this.nameTag) {
            this.nameTag.quaternion.copy(this.group.quaternion);
        }
    }
    
    updateTrail() {
        // Add current position to trail
        this.trailPositions.push(this.group.position.clone());
        if (this.trailPositions.length > 30) {
            this.trailPositions.shift();
        }
        
        // Update trail geometry
        if (this.trail && this.trailPositions.length > 1) {
            const positions = this.trail.geometry.attributes.position.array;
            for (let i = 0; i < this.trailPositions.length; i++) {
                const pos = this.trailPositions[i];
                positions[i * 3] = pos.x;
                positions[i * 3 + 1] = pos.y;
                positions[i * 3 + 2] = pos.z;
            }
            this.trail.geometry.attributes.position.needsUpdate = true;
            this.trail.geometry.setDrawRange(0, this.trailPositions.length);
        }
    }
    
    dispose() {
        // Clean up resources
        if (this.mesh) {
            this.mesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
        }
        
        if (this.nameTag) {
            this.nameTag.material.map.dispose();
            this.nameTag.material.dispose();
        }
        
        if (this.trail) {
            this.trail.geometry.dispose();
            this.trail.material.dispose();
        }
    }
}
