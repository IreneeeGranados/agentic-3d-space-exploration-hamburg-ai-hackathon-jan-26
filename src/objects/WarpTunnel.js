import * as THREE from 'three';

export class WarpTunnel {
    constructor() {
        this.group = new THREE.Group();
        this.isActive = false;
        this.uniforms = {
            time: { value: 0 },
            opacity: { value: 0 },
            speed: { value: 0 },
            color: { value: new THREE.Color(0xffffff) } // White for stars
        };

        this.createTunnel();
    }

    createTunnel() {
        // Huge cylinder that surrounds the camera
        // Radius: 50, Height: 1000, Segments: 32, OpenEnded
        const geometry = new THREE.CylinderGeometry(50, 50, 1000, 32, 1, true);

        // Rotate to align with Z axis (Three.js cylinder is Y-up)
        geometry.rotateX(-Math.PI / 2);

        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float opacity;
                uniform float speed;
                uniform vec3 color;
                varying vec2 vUv;

                // Simple pseudo-random
                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }

                void main() {
                    // Create star streak effect
                    
                    // Scroll speed based on ship speed
                    float scrollSpeed = speed * time * 5.0; // Faster scroll for streaks
                    
                    // Distort UVs to stretch stars
                    vec2 uv = vUv;
                    
                    // Create grid for stars
                    vec2 grid = vec2(uv.x * 40.0, (uv.y - scrollSpeed) * 10.0);
                    vec2 ipos = floor(grid);
                    vec2 fpos = fract(grid);
                    
                    // Random brightness for each cell
                    float rnd = random(ipos);
                    
                    // Threshold to keep only few "stars"
                    float star = smoothstep(0.9, 1.0, rnd);
                    
                    // Fade out at ends of cylinder
                    float fade = smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.7, uv.y);
                    
                    // Final intensity
                    float intensity = star * fade * opacity;
                    
                    gl_FragColor = vec4(color, intensity);
                }
            `,
            transparent: true,
            side: THREE.BackSide, // Render inside
            depthWrite: false, // Don't block other transparent objects
            blending: THREE.AdditiveBlending // Glow effect
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.group.add(this.mesh);
    }

    update(deltaTime, currentSpeed, cameraPosition, cameraQuaternion) {
        // Activation threshold
        const threshold = 2000.0;

        // Calculate targeted opacity based on speed
        let targetOpacity = 0;
        if (currentSpeed > threshold) {
            // Fade in from 0 to 1 as speed goes from 2000 to ~20000
            targetOpacity = Math.min(0.8, (currentSpeed - threshold) / 5000.0);
        }

        // Smoothly interpolate opacity
        this.uniforms.opacity.value += (targetOpacity - this.uniforms.opacity.value) * deltaTime * 2.0;

        // Update effect only if visible
        if (this.uniforms.opacity.value > 0.01) {
            this.isActive = true;
            this.group.visible = true;

            // Update shader uniforms
            this.uniforms.time.value += deltaTime;
            this.uniforms.speed.value = currentSpeed / 10000.0; // Normalize speed for shader

            // Keep tunnel centered and aligned with camera
            this.group.position.copy(cameraPosition);
            this.group.quaternion.copy(cameraQuaternion);

        } else {
            this.isActive = false;
            this.group.visible = false;
        }
    }
}
