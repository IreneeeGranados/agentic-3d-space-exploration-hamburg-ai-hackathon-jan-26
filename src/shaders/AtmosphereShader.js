/**
 * Advanced Atmosphere Shader with Rayleigh Scattering
 * Creates realistic atmospheric effects with soft cloud-like appearance
 */

import * as THREE from 'three';

export const AtmosphereShader = {
    uniforms: {
        atmosphereColor: { value: new THREE.Color(0x4a90e2) },
        sunDirection: { value: new THREE.Vector3(1, 0, 0) },
        intensity: { value: 1.0 },
        falloff: { value: 5.0 },
        rimPower: { value: 3.0 },
        scatterStrength: { value: 0.5 }
    },
    
    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vPosition = mvPosition.xyz;
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    
    fragmentShader: `
        uniform vec3 atmosphereColor;
        uniform vec3 sunDirection;
        uniform float intensity;
        uniform float falloff;
        uniform float rimPower;
        uniform float scatterStrength;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        
        void main() {
            // View direction
            vec3 viewDirection = normalize(-vPosition);
            
            // Fresnel effect (rim lighting)
            float fresnel = 1.0 - max(0.0, dot(vNormal, viewDirection));
            fresnel = pow(fresnel, rimPower) * intensity;
            
            // Atmospheric scattering (Rayleigh approximation)
            vec3 lightDir = normalize(sunDirection);
            float scatter = max(0.0, dot(vNormal, lightDir));
            scatter = pow(scatter, 2.0) * scatterStrength;
            
            // Combine effects
            float alpha = fresnel + scatter * 0.3;
            alpha = smoothstep(0.0, 1.0, alpha);
            
            // Color variation based on angle
            vec3 finalColor = atmosphereColor;
            finalColor = mix(finalColor, vec3(1.0, 0.9, 0.8), scatter * 0.5);
            
            // Soft falloff
            alpha *= exp(-falloff * (1.0 - fresnel));
            
            gl_FragColor = vec4(finalColor, alpha);
        }
    `
};

export const CloudShader = {
    uniforms: {
        cloudTexture: { value: null },
        cloudColor: { value: new THREE.Color(0xffffff) },
        time: { value: 0.0 },
        cloudSpeed: { value: 0.01 },
        cloudOpacity: { value: 0.6 },
        cloudCoverage: { value: 0.5 }
    },
    
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vPosition = mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    
    fragmentShader: `
        uniform sampler2D cloudTexture;
        uniform vec3 cloudColor;
        uniform float time;
        uniform float cloudSpeed;
        uniform float cloudOpacity;
        uniform float cloudCoverage;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        // Procedural noise function
        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        
        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }
        
        float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 2.0;
            
            for (int i = 0; i < 5; i++) {
                value += amplitude * noise(p * frequency);
                amplitude *= 0.5;
                frequency *= 2.0;
            }
            
            return value;
        }
        
        void main() {
            // Animate UV coordinates
            vec2 animatedUv = vUv;
            animatedUv.x += time * cloudSpeed;
            
            // Generate cloud pattern
            float cloudPattern;
            if (cloudTexture != null) {
                cloudPattern = texture2D(cloudTexture, animatedUv).r;
            } else {
                cloudPattern = fbm(animatedUv * 8.0 + time * 0.1);
            }
            
            // Apply coverage threshold
            cloudPattern = smoothstep(1.0 - cloudCoverage, 1.0, cloudPattern);
            
            // View direction for edge fade
            vec3 viewDirection = normalize(-vPosition);
            float edgeFade = pow(max(0.0, dot(vNormal, viewDirection)), 0.5);
            
            // Calculate final alpha
            float alpha = cloudPattern * cloudOpacity * edgeFade;
            
            // Soft cloud color
            vec3 finalColor = cloudColor;
            
            gl_FragColor = vec4(finalColor, alpha);
        }
    `
};

/**
 * Creates a multi-layer atmosphere effect
 */
export function createAtmosphere(planetRadius, atmosphereConfig) {
    const layers = [];
    
    // Inner glow layer
    const innerRadius = planetRadius * 1.03;
    const innerGeometry = new THREE.SphereGeometry(innerRadius, 64, 64);
    const innerMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone(AtmosphereShader.uniforms),
        vertexShader: AtmosphereShader.vertexShader,
        fragmentShader: AtmosphereShader.fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false
    });
    
    innerMaterial.uniforms.atmosphereColor.value = new THREE.Color(atmosphereConfig.color || 0x4a90e2);
    innerMaterial.uniforms.intensity.value = 0.8;
    innerMaterial.uniforms.rimPower.value = 2.5;
    innerMaterial.uniforms.falloff.value = 3.0;
    
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    layers.push(innerMesh);
    
    // Outer scatter layer
    const outerRadius = planetRadius * 1.08;
    const outerGeometry = new THREE.SphereGeometry(outerRadius, 64, 64);
    const outerMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone(AtmosphereShader.uniforms),
        vertexShader: AtmosphereShader.vertexShader,
        fragmentShader: AtmosphereShader.fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false
    });
    
    outerMaterial.uniforms.atmosphereColor.value = new THREE.Color(atmosphereConfig.color || 0x4a90e2);
    outerMaterial.uniforms.intensity.value = 0.4;
    outerMaterial.uniforms.rimPower.value = 4.0;
    outerMaterial.uniforms.falloff.value = 5.0;
    outerMaterial.uniforms.scatterStrength.value = 0.7;
    
    const outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);
    layers.push(outerMesh);
    
    return layers;
}

/**
 * Creates a realistic cloud layer
 */
export function createCloudLayer(planetRadius, cloudTexture = null) {
    const cloudRadius = planetRadius * 1.02;
    const geometry = new THREE.SphereGeometry(cloudRadius, 64, 64);
    
    const material = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone(CloudShader.uniforms),
        vertexShader: CloudShader.vertexShader,
        fragmentShader: CloudShader.fragmentShader,
        transparent: true,
        depthWrite: false,
        side: THREE.FrontSide
    });
    
    if (cloudTexture) {
        material.uniforms.cloudTexture.value = cloudTexture;
    }
    
    material.uniforms.cloudOpacity.value = 0.5;
    material.uniforms.cloudCoverage.value = 0.6;
    material.uniforms.cloudSpeed.value = 0.005;
    
    return new THREE.Mesh(geometry, material);
}

/**
 * Updates atmosphere animation
 */
export function updateAtmosphere(atmosphereLayers, cloudLayer, deltaTime) {
    // Update cloud animation
    if (cloudLayer && cloudLayer.material.uniforms) {
        cloudLayer.material.uniforms.time.value += deltaTime;
    }
    
    // Could add subtle atmosphere pulsing here if desired
    // atmosphereLayers.forEach(layer => {
    //     layer.material.uniforms.intensity.value = 0.8 + Math.sin(time) * 0.1;
    // });
}
