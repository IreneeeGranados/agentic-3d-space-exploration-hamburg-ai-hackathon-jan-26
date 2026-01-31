/**
 * Planet Class
 * Reusable class for creating and managing planet objects
 */

import * as THREE from 'three';
import {
    generateIceGiantTexture,
    generateGasGiantTexture,
    generateRockyTexture,
    generateNormalMap,
    generateCloudTexture,
    generateRingTexture,
    generateNightLightsTexture,
    generateCratersTexture,
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
                density: 0.1,
                hasClouds: false
            },
            rings: config.rings || {
                enabled: false,
                innerRadius: 1.5,
                outerRadius: 2.5,
                color1: 0x8c7853,
                color2: 0x4a4a4a
            },
            habitability: config.aiData?.habitability || config.characteristics?.habitability_percent || 0,
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

        // Get colors from composition
        const colors = getColorByComposition(this.config.composition, parseFloat(this.config.temperature));
        const baseColor = this.config.color || colors.base;
        const detailColor = this.config.detailColor || colors.detail;

        // Generate procedural texture based on planet type/composition
        let texture, normalMap, emissiveMap;
        const isAirless = !this.config.atmosphere || !this.config.atmosphere.enabled;

        if (this.config.planetType === 'rocky') {
            if (isAirless && this.config.name !== 'Earth') {
                texture = generateCratersTexture(baseColor, detailColor);
            } else {
                texture = generateRockyTexture(baseColor, detailColor);
            }
            normalMap = generateNormalMap(512, 2.0);

            // Add night lights for habitable planets
            if (parseFloat(this.config.habitability) > 50) {
                emissiveMap = generateNightLightsTexture(512, parseFloat(this.config.habitability) / 100);
            }
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
            emissiveMap: emissiveMap,
            roughness: this.config.planetType === 'iceGiant' ? 0.4 : 0.9,
            metalness: 0.1,
            emissive: emissiveMap ? new THREE.Color(0xffffff) : new THREE.Color(baseColor),
            emissiveIntensity: emissiveMap ? 1.0 : (parseFloat(this.config.temperature) > 1000 ? 0.1 : 0.0)
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.rotation.z = this.config.tilt;

        // Positioning
        if (this.config.orbitRadius > 0) {
            this.group.add(this.mesh);
        } else {
            this.mesh.position.set(this.config.position.x, this.config.position.y, this.config.position.z);
            this.group.add(this.mesh);
        }

        // Add enhancements
        if (this.config.atmosphere && this.config.atmosphere.enabled) {
            this.createAtmosphere();
            if (this.config.atmosphere.hasClouds) {
                this.createClouds();
            }
        }

        if (this.config.rings && this.config.rings.enabled) {
            this.createRings();
        }

        this.mesh.userData = { type: 'planet', name: this.config.name, data: this.config };
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
                    vNormal = normalize(normalViewMatrix * normal); // Fixed normal matrix
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

    createClouds() {
        const radius = this.config.radius * 1.02;
        const geometry = new THREE.SphereGeometry(radius, 64, 64);
        const texture = generateCloudTexture(512);

        const material = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            opacity: 0.8,
            depthWrite: false
        });

        this.cloudMesh = new THREE.Mesh(geometry, material);
        this.group.add(this.cloudMesh);
    }

    createRings() {
        const ringConfig = this.config.rings;
        const innerRadius = this.config.radius * (ringConfig.innerRadius || 1.5);
        const outerRadius = this.config.radius * (ringConfig.outerRadius || 2.5);

        const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 128);
        const texture = generateRingTexture(512, ringConfig.color1, ringConfig.color2);

        // Proper UV mapping for rings
        const pos = geometry.attributes.position;
        const v3 = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++) {
            v3.fromBufferAttribute(pos, i);
            geometry.attributes.uv.setXY(i, (v3.length() - innerRadius) / (outerRadius - innerRadius), 0);
        }

        const material = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
            roughness: 0.5,
            metalness: 0
        });

        this.ringMesh = new THREE.Mesh(geometry, material);
        this.ringMesh.rotation.x = Math.PI / 2;
        this.group.add(this.ringMesh);
    }


    update() {
        // Rotate planet on its axis
        this.mesh.rotation.y += this.config.rotationSpeed;

        // Rotate clouds at a different speed
        if (this.cloudMesh) {
            this.cloudMesh.rotation.y += this.config.rotationSpeed * 1.2;
            this.cloudMesh.rotation.x += 0.0001;
        }

        // Update orbital position if applicable
        if (this.config.orbitRadius > 0 && this.config.orbitSpeed > 0) {
            this.angle += this.config.orbitSpeed;
            this.mesh.position.x = Math.cos(this.angle) * this.config.orbitRadius;
            this.mesh.position.z = Math.sin(this.angle) * this.config.orbitRadius;

            // Move atmospheric layer and clouds with planet
            if (this.atmosphereMesh) {
                this.atmosphereMesh.position.copy(this.mesh.position);
            }
            if (this.cloudMesh) {
                this.cloudMesh.position.copy(this.mesh.position);
            }
            if (this.ringMesh) {
                this.ringMesh.position.copy(this.mesh.position);
            }
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
