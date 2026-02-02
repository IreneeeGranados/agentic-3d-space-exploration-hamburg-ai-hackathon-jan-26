import * as THREE from 'three';

/**
 * GalaxyField
 * Renders distant galaxies as sprites on a very large sphere background.
 * Adds depth and cosmetic beauty to the deep space environment.
 */
export class GalaxyField {
    constructor(radius = 5000000, count = 500) {
        this.radius = radius;
        this.count = count;
        this.group = new THREE.Group();
        this.group.name = 'GalaxyField';
        this.createGalaxies();
    }

    createGalaxies() {
        // Generate a few variations of galaxy textures
        const spiralTex = this.generateGalaxyTexture('spiral');
        const ellipticalTex = this.generateGalaxyTexture('elliptical');
        const irregularTex = this.generateGalaxyTexture('irregular');

        const textures = [spiralTex, ellipticalTex, irregularTex];

        // Colors for variety
        const colors = [
            0xaaddff, // Blue-white
            0xffeedd, // Yellow-white
            0xffccaa, // Orange-ish
            0xddaaff, // Purple-ish
        ];

        // Create sprites
        for (let i = 0; i < this.count; i++) {
            const texture = textures[Math.floor(Math.random() * textures.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];

            const material = new THREE.SpriteMaterial({
                map: texture,
                color: color,
                transparent: true,
                opacity: 0.6 + Math.random() * 0.4, // Varies
                blending: THREE.AdditiveBlending,
                depthWrite: false // Don't occlude stars
            });

            const sprite = new THREE.Sprite(material);

            // Random position on sphere
            const phi = Math.acos(-1 + (2 * i) / this.count);
            const theta = Math.sqrt(this.count * Math.PI) * phi;

            const r = this.radius * (0.8 + Math.random() * 0.4); // Vary depth slightly

            sprite.position.setFromSphericalCoords(r, phi, theta);

            // Scale sprites according to distance so they are visible but not huge
            // Size should be massive in world units
            const scale = (20000 + Math.random() * 30000);
            sprite.scale.set(scale, scale, 1);

            // Random rotation (Sprites always face camera, but we can rotate the texture)
            material.rotation = Math.random() * Math.PI * 2;

            this.group.add(sprite);
        }
    }

    generateGalaxyTexture(type) {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const center = size / 2;

        const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);

        if (type === 'spiral') {
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.2, 'rgba(255, 240, 220, 0.8)');
            gradient.addColorStop(0.5, 'rgba(200, 200, 255, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, size, size);

            // Draw arms
            ctx.save();
            ctx.translate(center, center);
            ctx.strokeStyle = 'rgba(220, 230, 255, 0.5)';
            ctx.lineWidth = 20;
            ctx.filter = 'blur(10px)';

            for (let i = 0; i < 2; i++) {
                ctx.beginPath();
                for (let angle = 0; angle < Math.PI * 3; angle += 0.1) {
                    const r = 10 + angle * 30;
                    if (r > center) break;
                    const x = r * Math.cos(angle + i * Math.PI);
                    const y = r * Math.sin(angle + i * Math.PI);
                    if (angle === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            ctx.restore();

        } else if (type === 'elliptical') {
            gradient.addColorStop(0, 'rgba(255, 250, 220, 1)');
            gradient.addColorStop(0.4, 'rgba(255, 220, 180, 0.6)');
            gradient.addColorStop(0.8, 'rgba(255, 200, 150, 0.1)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.save();
            ctx.scale(1, 0.6); // Flatten
            ctx.translate(0, center * 0.6); // Re-center Y after scale
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(center, center, center, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else {
            // Irregular/Cloud
            gradient.addColorStop(0, 'rgba(240, 240, 255, 0.9)');
            gradient.addColorStop(0.5, 'rgba(100, 100, 200, 0.4)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = gradient;

            // Draw random blobs
            for (let i = 0; i < 10; i++) {
                const x = center + (Math.random() - 0.5) * size * 0.6;
                const y = center + (Math.random() - 0.5) * size * 0.6;
                const r = size * 0.2 * Math.random();

                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }
}
