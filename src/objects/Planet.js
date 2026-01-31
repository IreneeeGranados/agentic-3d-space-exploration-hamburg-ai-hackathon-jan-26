/**
 * Planet Class
 * Reusable class for creating and managing planet objects
 */

import * as THREE from 'three';
import {
    generateRockyTexture,
    generateGasGiantTexture,
    generateIceGiantTexture,
    generateNormalMap,
    getColorByComposition
} from '../utils/textureGenerator.js';

export class Planet {
    constructor(config) {
        this.config = {
            name: config.name || 'Unknown Planet',
            planetType: config.planetType || 'rocky',
            radius: config.radius || 5,
            color: config.color || 0x888888,
            detailColor: config.detailColor || 0x666666,
            gasColors: config.gasColors || [0x888888],
            texture: config.texture || null,
            position: config.position || { x: 0, y: 0, z: 0 },
            orbitRadius: config.orbitRadius || 0,
            orbitSpeed: config.orbitSpeed || 0,
            rotationSpeed: config.rotationSpeed || 0.01,
            tilt: config.tilt || 0,
            atmosphere: config.atmosphere || {
                enabled: false,
                color: 0x4a90e2,
                density: 0.1
            },
            composition: config.aiData?.composition || config.characteristics?.principal_material || 'rocky',
            temperature: (config.aiData?.surfaceTemp || config.pl_eqt || '300').toString(),
            ...config
        };

        this.angle = Math.random() * Math.PI * 2; // Random starting position in orbit
        this.group = new THREE.Group();
        this.createPlanet();
    }

    createPlanet() {
        // Create planet geometry
        const geometry = new THREE.SphereGeometry(
            this.config.radius,
            64,
            64
        );

        // Generate procedural texture based on planet type/composition
        let texture, normalMap;

        // Get colors from composition
        const colors = getColorByComposition(this.config.composition, parseFloat(this.config.temperature));
        const baseColor = this.config.color || colors.base;
        const detailColor = this.config.detailColor || colors.detail;

        if (this.config.planetType === 'rocky') {
            texture = generateRockyTexture(baseColor, detailColor);
            normalMap = generateNormalMap(512, 2.0);
        } else if (this.config.planetType === 'gasGiant') {
            const gasColors = this.config.gasColors || [new THREE.Color(baseColor).getHex(), new THREE.Color(detailColor).getHex(), 0xffffff];
            texture = generateGasGiantTexture(gasColors);
            normalMap = generateNormalMap(512, 0.5);
        } else if (this.config.planetType === 'iceGiant') {
            texture = generateIceGiantTexture(baseColor);
            normalMap = generateNormalMap(512, 0.3);
        }

        // Create material with realistic lighting
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            normalMap: normalMap,
            roughness: this.config.planetType === 'iceGiant' ? 0.4 : 0.9,
            metalness: 0.1,
            emissive: new THREE.Color(baseColor),
            emissiveIntensity: parseFloat(this.config.temperature) > 1000 ? 0.1 : 0.0
        });

        this.mesh = new THREE.Mesh(geometry, material);

        // Enable shadows
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // Apply axial tilt
        this.mesh.rotation.z = this.config.tilt;

        // Add atmosphere if enabled
        if (this.config.atmosphere && this.config.atmosphere.enabled) {
            this.createAtmosphere();
        }

        // Position the planet
        if (this.config.orbitRadius > 0) {
            // Planet will orbit, so position is calculated in update()
            this.group.add(this.mesh);
        } else {
            // Static position
            this.mesh.position.set(
                this.config.position.x,
                this.config.position.y,
                this.config.position.z
            );
            this.group.add(this.mesh);
        }

        // Store reference for potential AI/data integration
        this.mesh.userData = {
            type: 'planet',
            name: this.config.name,
            data: this.config
        };
    }

    createAtmosphere() {
        const atmosphereConfig = this.config.atmosphere;
        const radius = this.config.radius * 1.05; // Slightly larger than planet

        const geometry = new THREE.SphereGeometry(radius, 64, 64);

        // Fresnel-like Shader Material for atmospheric glow
        const material = new THREE.ShaderMaterial({
            uniforms: {
                atmosphereColor: { value: new THREE.Color(atmosphereConfig.color || 0x4a90e2) },
                coefficient: { value: 0.1 },
                power: { value: 4.0 }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = vec3(modelViewMatrix * vec4(position, 1.0));
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 atmosphereColor;
                uniform float coefficient;
                uniform float power;
                varying vec3 vNormal;
                varying vec3 vPosition;
                void main() {
                    vec3 viewDirection = normalize(-vPosition);
                    float intensity = pow(coefficient + dot(vNormal, viewDirection), power);
                    gl_FragColor = vec4(atmosphereColor, intensity);
                }
            `,
            side: THREE.BackSide,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        this.atmosphereMesh = new THREE.Mesh(geometry, material);
        this.group.add(this.atmosphereMesh);
    }


    update() {
        // Rotate planet on its axis
        this.mesh.rotation.y += this.config.rotationSpeed;

        // Update orbital position if applicable
        if (this.config.orbitRadius > 0 && this.config.orbitSpeed > 0) {
            this.angle += this.config.orbitSpeed;
            this.mesh.position.x = Math.cos(this.angle) * this.config.orbitRadius;
            this.mesh.position.z = Math.sin(this.angle) * this.config.orbitRadius;
        }
    }

    dispose() {
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        if (this.mesh.material.map) {
            this.mesh.material.map.dispose();
        }
    }
}
