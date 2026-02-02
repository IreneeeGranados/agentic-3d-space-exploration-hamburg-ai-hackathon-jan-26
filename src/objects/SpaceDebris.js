import * as THREE from 'three';
import { generateRockyTexture, generateNormalMap } from '../utils/textureGenerator.js';

/**
 * SpaceDebris Class
 * Manages random spawning of asteroids and space junk to make the void feel less empty.
 */
export class SpaceDebris {
    constructor(scene, count = 50, range = 2000) {
        this.scene = scene;
        this.maxDebris = count;
        this.spawnRange = range;
        this.debris = [];
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Pre-generate a few asteroid materials
        this.materials = [];
        const colors = [0x888888, 0x665544, 0x555555, 0x776655];

        colors.forEach(color => {
            const texture = generateRockyTexture(color, 0x333333, 256);
            const normal = generateNormalMap(256);

            const mat = new THREE.MeshStandardMaterial({
                map: texture,
                normalMap: normal,
                roughness: 0.9,
                metalness: 0.1,
                color: color
            });
            this.materials.push(mat);
        });

        // Use a single geometry for efficiency, or a few variations
        this.geometries = [
            new THREE.DodecahedronGeometry(1, 0), // Low poly rock
            new THREE.IcosahedronGeometry(1, 0),
            new THREE.TetrahedronGeometry(1, 2)
        ];

        // Randomly distort geometries to make them look like rocks
        this.geometries.forEach(geom => {
            const pos = geom.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                pos.setXYZ(
                    i,
                    pos.getX(i) * (0.8 + Math.random() * 0.4),
                    pos.getY(i) * (0.8 + Math.random() * 0.4),
                    pos.getZ(i) * (0.8 + Math.random() * 0.4)
                );
            }
            geom.computeVertexNormals();
        });
    }

    spawnDebris(cameraPosition) {
        if (this.debris.length >= this.maxDebris) return;

        const geom = this.geometries[Math.floor(Math.random() * this.geometries.length)];
        const mat = this.materials[Math.floor(Math.random() * this.materials.length)];

        const mesh = new THREE.Mesh(geom, mat);

        // Random position around camera, but not too close using spherical coords
        const angle = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const dist = 200 + Math.random() * this.spawnRange; // Minimum 200 away

        const x = dist * Math.sin(phi) * Math.cos(angle);
        const y = dist * Math.sin(phi) * Math.sin(angle);
        const z = dist * Math.cos(phi);

        mesh.position.set(
            cameraPosition.x + x,
            cameraPosition.y + y,
            cameraPosition.z + z
        );

        // Random rotation
        mesh.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );

        // Random scale (Asteroid sizes)
        const scale = 5 + Math.random() * 20;
        mesh.scale.set(scale, scale, scale);

        // Motion vector (slow drift)
        mesh.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5
        );

        // Spin
        mesh.userData.spin = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
        );

        this.group.add(mesh);
        this.debris.push(mesh);
    }

    update(deltaTime, cameraPosition) {
        // Spawn chance
        if (Math.random() < 0.1) {
            this.spawnDebris(cameraPosition);
        }

        for (let i = this.debris.length - 1; i >= 0; i--) {
            const mesh = this.debris[i];

            // Move
            mesh.position.add(mesh.userData.velocity.clone().multiplyScalar(deltaTime));
            mesh.rotation.x += mesh.userData.spin.x * deltaTime;
            mesh.rotation.y += mesh.userData.spin.y * deltaTime;
            mesh.rotation.z += mesh.userData.spin.z * deltaTime;

            // Despawn if too far
            const dist = mesh.position.distanceTo(cameraPosition);
            if (dist > this.spawnRange * 1.5) {
                this.group.remove(mesh);
                this.debris.splice(i, 1);
            }
        }
    }
}
