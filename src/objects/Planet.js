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
import {
    generateEarthTexture,
    generateEarthSpecularMap,
    generateMarsTexture,
    generateJupiterTexture,
    generateSaturnTexture,
    generateSaturnRingTexture,
    generateNeptuneTexture,
    generateUranusTexture,
    generateVenusTexture
} from '../utils/PlanetTextureGenerator.js';

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
        this.textureLoader = new THREE.TextureLoader();
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
        let texture, normalMap, emissiveMap, specularMap;
        const isAirless = !this.config.atmosphere || !this.config.atmosphere.enabled;
        const isSolarPlanet = this.config.isSolar;

        // Use specialized textures for solar system planets
        const planetName = this.config.name || this.config.pl_name;
        const isEarth = planetName === 'Earth';

        // Use specialized textures for solar system planets
        if (isSolarPlanet || isEarth) {
            switch (planetName) {
                case 'Earth':
                    // Use real photographic textures for Earth
                    texture = this.textureLoader.load('/textures/planets/earth/earth_day_2048.jpg');
                    specularMap = this.textureLoader.load('/textures/planets/earth/earth_specular_2048.jpg');
                    normalMap = this.textureLoader.load('/textures/planets/earth/earth_normal_2048.jpg');
                    emissiveMap = this.textureLoader.load('/textures/planets/earth/earth_lights_2048.png');

                    // Set texture properties for better quality
                    texture.colorSpace = THREE.SRGBColorSpace;
                    emissiveMap.colorSpace = THREE.SRGBColorSpace;
                    break;
                case 'Mars':
                    texture = generateMarsTexture(2048);
                    normalMap = generateNormalMap(1024, 2.5);
                    break;
                case 'Jupiter':
                    texture = generateJupiterTexture(2048);
                    normalMap = generateNormalMap(512, 0.5);
                    break;
                case 'Saturn':
                    texture = generateSaturnTexture(2048);
                    normalMap = generateNormalMap(512, 0.3);
                    break;
                case 'Neptune':
                    texture = generateNeptuneTexture(1024);
                    normalMap = generateNormalMap(512, 0.4);
                    break;
                case 'Uranus':
                    texture = generateUranusTexture(1024);
                    normalMap = generateNormalMap(512, 0.2);
                    break;
                case 'Venus':
                    texture = generateVenusTexture(1024);
                    normalMap = generateNormalMap(512, 0.1);
                    break;
                case 'Mercury':
                    texture = generateCratersTexture(baseColor, detailColor, 1024);
                    normalMap = generateNormalMap(1024, 3.0);
                    break;
                default:
                    // Fallback for any other solar planets
                    if (this.config.planetType === 'rocky') {
                        texture = generateRockyTexture(baseColor, detailColor);
                        normalMap = generateNormalMap(512, 2.0);
                    } else if (this.config.planetType === 'gasGiant') {
                        const gasColors = this.config.gasColors || [baseColor, detailColor, 0xffffff];
                        texture = generateGasGiantTexture(gasColors);
                        normalMap = generateNormalMap(512, 0.5);
                    } else {
                        texture = generateIceGiantTexture(baseColor);
                        normalMap = generateNormalMap(512, 0.3);
                    }
            }
        } else {
            // Exoplanets use standard procedural textures
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
        }

        // Create material with realistic lighting
        // isEarth is already defined above

        const materialOptions = {
            map: texture,
            normalMap: normalMap,
            roughness: isEarth ? 0.8 : (this.config.planetType === 'iceGiant' ? 0.4 : 0.9),
            metalness: isEarth ? 0.0 : 0.1,
            emissive: emissiveMap ? new THREE.Color(0xffffff) : new THREE.Color(baseColor),
            emissiveIntensity: (this.config.isSolar || isEarth) ? 0.3 : (emissiveMap ? 1.0 : (parseFloat(this.config.temperature) > 1000 ? 0.1 : 0.0))
        };

        // Add emissive map if exists
        if (emissiveMap) {
            materialOptions.emissiveMap = emissiveMap;
        }

        // Add surface map for Earth
        if (specularMap && isEarth) {
            // earth_specular has Water = White (shiny), Land = Black (rough)
            // In Three.js StandardMaterial, we can use this as a metalnessMap 
            // to make water reflective like a metal (specular), 
            // and keep land non-reflective.
            materialOptions.metalnessMap = specularMap;
            materialOptions.metalness = 1.0;

            // For roughness, we'd want water to be 0 and land 1.
            // Since the map is inverted (Water=1, Land=0), we don't use it as roughnessMap directly
            // unless we want matte water. We'll stick to a high base roughness for land.
            materialOptions.roughness = 0.7;
        } else if (specularMap) {
            materialOptions.metalnessMap = specularMap;
            materialOptions.roughnessMap = specularMap;
            materialOptions.metalness = 0.5;
            materialOptions.roughness = 0.1;
        }

        const material = new THREE.MeshStandardMaterial(materialOptions);

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.rotation.z = this.config.tilt;

        // Add planet data to userData for click detection
        this.mesh.userData.planetData = {
            pl_name: this.config.pl_name || this.config.name,
            name: this.config.name,
            isSolar: this.config.isSolar || false,
            characteristics: this.config.characteristics || {},
            // Include all NASA data fields
            pl_rade: this.config.pl_rade,
            pl_masse: this.config.pl_masse,
            pl_orbper: this.config.pl_orbper,
            pl_eqt: this.config.pl_eqt,
            hostname: this.config.hostname,
            sy_dist: this.config.sy_dist,
            discoverymethod: this.config.discoverymethod,
            disc_year: this.config.disc_year,
            position: this.config.position
        };

        // Positioning
        if (this.config.orbitRadius > 0) {
            this.group.add(this.mesh);
        } else {
            this.mesh.position.set(this.config.position.x, this.config.position.y, this.config.position.z);
            this.group.add(this.mesh);
        }

        // Apply Oblateness (Flattening)
        if (this.config.flattening) {
            this.mesh.scale.y = 1.0 - this.config.flattening;

            // Atmospheric shells must also be oblate to match
            if (this.atmosphereMesh) {
                this.atmosphereMesh.scale.y = 1.0 - this.config.flattening;
            }
            if (this.cloudMesh) {
                this.cloudMesh.scale.y = 1.0 - this.config.flattening;
            }
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

    createClouds() {
        const radius = this.config.radius * 1.02;
        const geometry = new THREE.SphereGeometry(radius, 64, 64);

        let texture;
        if (this.config.isSolar && (this.config.name === 'Earth' || this.config.pl_name === 'Earth')) {
            texture = this.textureLoader.load('/textures/planets/earth/earth_clouds_2048.png');
        } else {
            texture = generateCloudTexture(512);
        }

        const material = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            opacity: (this.config.name === 'Earth' || this.config.pl_name === 'Earth') ? 0.4 : 0.8,
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

        // Use enhanced Saturn ring texture if this is Saturn
        let texture;
        const isSaturn = this.config.isSolar && (this.config.name === 'Saturn' || this.config.pl_name === 'Saturn');
        if (isSaturn) {
            texture = generateSaturnRingTexture(2048);
        } else {
            texture = generateRingTexture(512, ringConfig.color1, ringConfig.color2);
        }

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
            opacity: isSaturn ? 0.95 : 0.8,
            roughness: 0.8,
            metalness: 0,
            depthWrite: false,
            alphaTest: 0.01
        });

        this.ringMesh = new THREE.Mesh(geometry, material);
        this.ringMesh.rotation.x = Math.PI / 2;
        this.ringMesh.castShadow = true;
        this.ringMesh.receiveShadow = true;
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
