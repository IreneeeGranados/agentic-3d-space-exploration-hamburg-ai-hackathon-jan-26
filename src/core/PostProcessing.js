/**
 * Post-Processing Manager
 * Handles advanced visual effects (Bloom, Grain, Tone Mapping)
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export class PostProcessingManager {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        this.composer = null;
        this.bloomPass = null;

        this.initComposer();
    }

    initComposer() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // 1. Core Composer
        this.composer = new EffectComposer(this.renderer);

        // 2. Base Render Pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // 3. Unreal Bloom (Glow for Stars/Atmosphere)
        // Resoln, Strength, Radius, Threshold
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(width, height),
            0.6, // Strength (Lowered from 1.5 to reduce glare)
            0.4, // Radius
            0.92 // Threshold (Only EXTREMELY bright things glow, preventing planet burnout)
        );
        this.composer.addPass(this.bloomPass);

        // 4. Film Grain (Cinematic Feel)
        // Noise, Scanlines, ScanlineCount, Grayscale
        const filmPass = new FilmPass(0.35, 0.0, 0, false);
        this.composer.addPass(filmPass);

        // 5. Output Pass (Tone Mapping & Color Correction)
        const outputPass = new OutputPass();
        this.composer.addPass(outputPass);
    }

    setSize(width, height) {
        this.composer.setSize(width, height);
    }

    render() {
        this.composer.render();
    }

    dispose() {
        this.composer.dispose();
    }
}
