/**
 * Renderer Manager
 * Handles WebGL renderer setup and configuration
 */

import * as THREE from 'three';
import { PostProcessingManager } from './PostProcessing.js';

export class RendererManager {
    constructor(canvas) {
        this.renderer = this.createRenderer(canvas);
        this.configureRenderer();
        this.composer = null; // Lazy init via setScene
    }

    createRenderer(canvas) {
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: false, // FXAA/SMAA handled by composer usually, or disabled for performance
            alpha: false,
            powerPreference: "high-performance"
        });

        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        return renderer;
    }

    configureRenderer() {
        this.renderer.physicallyCorrectLights = true;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
    }

    /**
     * Initialize Post-Processing with Scene usage
     */
    initPostProcessing(scene, camera) {
        if (!this.composer) {
            this.composer = new PostProcessingManager(this.renderer, scene, camera);
        }
    }

    render(scene, camera) {
        // Init composer on first frame if needed
        if (!this.composer) {
            this.initPostProcessing(scene, camera);
        }

        // Use Composer if available, otherwise standard
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(scene, camera);
        }
    }

    updateSize(canvas) {
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        if (this.composer) {
            this.composer.setSize(canvas.clientWidth, canvas.clientHeight);
        }
    }

    dispose() {
        if (this.composer) this.composer.dispose();
        this.renderer.dispose();
    }

    getRenderer() {
        return this.renderer;
    }
}
