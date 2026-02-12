import { PartyLoadingScene } from '../ui/PartyLoadingScene.js';

/**
 * LoadingManager - Controls the loading screen with progress tracking and 3D party scene
 */
export class LoadingManager {
    constructor() {
        this.screen = document.getElementById('loading-screen');
        this.statusElement = document.getElementById('loading-status');
        this.detailElement = document.getElementById('loading-detail');
        this.progressBar = document.querySelector('.loading-progress-bar');
        this.startButton = document.getElementById('start-exploring-btn');

        this.totalSteps = 0;
        this.completedSteps = 0;
        this.startTime = Date.now();

        // Minimum loading time (10 seconds for better experience)
        this.minimumLoadTime = 10000;
        this.actualProgress = 0;
        this.displayedProgress = 0;
        this.isReadyToFinish = false;

        // Slideshow control
        this.currentSlide = 0;
        this.totalSlides = 4;
        this.slideInterval = null;

        // Initialize 3D party scene
        this.partyScene = null;
        this.initPartyScene();

        // Start slideshow
        this.startSlideshow();

        // Start smooth progress animation
        this.startProgressAnimation();

        // Setup start button
        this.setupStartButton();
    }

    /**
     * Setup start button click handler
     */
    setupStartButton() {
        if (this.startButton) {
            this.startButton.addEventListener('click', () => {
                this.hideLoadingScreen();
            });
        }
    }

    /**
     * Hide the loading screen
     */
    hideLoadingScreen() {
        // Stop slideshow
        this.stopSlideshow();

        if (this.screen) {
            this.screen.classList.add('hidden');
        }

        // Dispose party scene
        if (this.partyScene) {
            this.partyScene.dispose();
            this.partyScene = null;
        }

        // Remove from DOM after transition
        setTimeout(() => {
            if (this.screen && this.screen.parentNode) {
                this.screen.parentNode.removeChild(this.screen);
            }
        }, 500);
    }

    initPartyScene() {
        if (this.screen) {
            try {
                this.partyScene = new PartyLoadingScene(this.screen);
                console.log('🎉 Party loading scene initialized!');
            } catch (error) {
                console.warn('Could not initialize party scene:', error);
            }
        }
    }

    /**
     * Start slideshow with manual control only
     */
    startSlideshow() {
        // Setup click handlers for indicators (manual navigation only)
        const indicators = document.querySelectorAll('.indicator');
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                this.goToSlide(index);
            });
        });
        // No auto-advance - user must click to change slides
    }

    /**
     * Go to specific slide
     */
    goToSlide(index) {
        const slides = document.querySelectorAll('.loading-slide');
        const indicators = document.querySelectorAll('.indicator');

        if (index < 0 || index >= this.totalSlides) return;

        // Remove active from current
        slides[this.currentSlide]?.classList.remove('active');
        slides[this.currentSlide]?.classList.add('exiting');
        indicators[this.currentSlide]?.classList.remove('active');

        // Clean up exiting class after animation
        setTimeout(() => {
            slides[this.currentSlide]?.classList.remove('exiting');
        }, 600);

        // Set new slide
        this.currentSlide = index;
        slides[this.currentSlide]?.classList.add('active');
        indicators[this.currentSlide]?.classList.add('active');
    }

    /**
     * Advance to next slide
     */
    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.totalSlides;
        this.goToSlide(nextIndex);
    }

    /**
     * Reset slide interval (useful when user manually changes slides)
     */
    resetSlideInterval() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
        }
        this.slideInterval = setInterval(() => {
            this.nextSlide();
        }, this.SLIDE_DURATION);
    }

    /**
     * Stop slideshow
     */
    stopSlideshow() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
            this.slideInterval = null;
        }
    }

    /**
     * Initialize loading with total steps
     */
    start(totalSteps = 5) {
        this.totalSteps = totalSteps;
        this.completedSteps = 0;
        this.startTime = Date.now();
        this.updateProgress();
    }

    /**
     * Update status message
     */
    updateStatus(status, detail = '') {
        if (this.statusElement) {
            this.statusElement.textContent = status;
        }
        if (this.detailElement && detail) {
            this.detailElement.textContent = detail;
        }
        console.log(`📦 Loading: ${status}${detail ? ' - ' + detail : ''}`);
    }

    /**
     * Complete a loading step
     */
    completeStep(stepName) {
        this.completedSteps++;
        this.actualProgress = (this.completedSteps / this.totalSteps) * 100;
        console.log(`✓ Completed: ${stepName} (${this.completedSteps}/${this.totalSteps})`);
    }

    /**
     * Start smooth progress animation based on time
     */
    startProgressAnimation() {
        this.progressAnimationId = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const timeProgress = Math.min((elapsed / this.minimumLoadTime) * 100, 100);

            // Use the greater of time-based progress or actual progress (capped at 95% until minimum time)
            let targetProgress;
            if (elapsed < this.minimumLoadTime) {
                // During minimum time, progress is time-based but never exceeds 95%
                targetProgress = Math.min(timeProgress, 95);
            } else {
                // After minimum time, allow progress to reach actual value
                targetProgress = Math.max(this.actualProgress, timeProgress);
            }

            // Smooth lerp to target
            this.displayedProgress += (targetProgress - this.displayedProgress) * 0.05;

            if (this.progressBar) {
                this.progressBar.style.width = `${this.displayedProgress}%`;
            }

            // Check if we can finish
            if (this.isReadyToFinish && elapsed >= this.minimumLoadTime) {
                this.displayedProgress = 100;
                if (this.progressBar) {
                    this.progressBar.style.width = '100%';
                }
                this.stopProgressAnimation();
                this.showStartButton();
            }
        }, 50);
    }

    /**
     * Stop progress animation
     */
    stopProgressAnimation() {
        if (this.progressAnimationId) {
            clearInterval(this.progressAnimationId);
            this.progressAnimationId = null;
        }
    }

    /**
     * Show start button after loading
     */
    showStartButton() {
        const loadTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
        this.updateStatus('Ready for Launch! 🚀', `Loaded in ${loadTime}s`);

        if (this.startButton) {
            setTimeout(() => {
                this.startButton.classList.remove('hidden');
            }, 300);
        }
    }

    /**
     * Update progress bar (legacy support)
     */
    updateProgress() {
        // Progress is now time-based, this is kept for compatibility
        this.actualProgress = (this.completedSteps / this.totalSteps) * 100;
    }

    /**
     * Set custom progress percentage
     */
    setProgress(percent) {
        this.actualProgress = percent;
    }

    /**
     * Finish loading and hide screen
     */
    finish() {
        this.actualProgress = 100;
        this.isReadyToFinish = true;

        const elapsed = Date.now() - this.startTime;
        const remainingTime = Math.max(0, this.minimumLoadTime - elapsed);

        console.log(`✓ Loading complete. Waiting ${(remainingTime / 1000).toFixed(1)}s to reach minimum load time...`);

        // If minimum time already passed, show button immediately
        if (remainingTime <= 0) {
            this.stopProgressAnimation();
            this.setProgress(100);
            if (this.progressBar) {
                this.progressBar.style.width = '100%';
            }
            this.showStartButton();
        }
        // Otherwise, the animation loop will handle it
    }

    /**
     * Show WebGL-specific error with diagnostic information
     */
    showWebGLError(webglError) {
        this.stopSlideshow();
        this.stopProgressAnimation();

        const errorInfo = webglError.errorMessage || {
            title: 'WebGL Unavailable',
            description: 'WebGL could not be initialized.',
            steps: ['Update your browser', 'Enable hardware acceleration', 'Update graphics drivers']
        };

        // Update status
        this.updateStatus('⚠️ ' + errorInfo.title, errorInfo.description);

        // Change progress bar to error state
        if (this.progressBar) {
            this.progressBar.style.background = 'linear-gradient(90deg, #ff6b00, #ff0000)';
            this.progressBar.style.width = '100%';
        }

        // Create detailed error content
        const detailHTML = `
            <div class="webgl-error-content">
                <div class="error-icon">⚠️</div>
                <h2 class="error-title">${errorInfo.title}</h2>
                <p class="error-description">${errorInfo.description}</p>
                
                <div class="error-section">
                    <h3>Troubleshooting Steps:</h3>
                    <ol class="error-steps">
                        ${errorInfo.steps.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                </div>

                <div class="error-section">
                    <h3>Helpful Resources:</h3>
                    <ul class="error-links">
                        <li><a href="https://get.webgl.org/" target="_blank">Check WebGL Support</a></li>
                        <li><a href="https://www.khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" target="_blank">WebGL Setup Guide</a></li>
                    </ul>
                </div>

                ${webglError.diagnostics ? `
                <details class="error-diagnostics">
                    <summary>Diagnostic Information (for support)</summary>
                    <div class="diagnostic-info">
                        <p><strong>Browser:</strong> ${webglError.diagnostics.userAgent || 'Unknown'}</p>
                        <p><strong>Platform:</strong> ${webglError.diagnostics.platform || 'Unknown'}</p>
                        ${webglError.diagnostics.gpu ? `
                            <p><strong>GPU Vendor:</strong> ${webglError.diagnostics.gpu.vendor || 'Unknown'}</p>
                            <p><strong>GPU Renderer:</strong> ${webglError.diagnostics.gpu.renderer || 'Unknown'}</p>
                        ` : ''}
                        <p><strong>Screen:</strong> ${webglError.diagnostics.screenResolution || 'Unknown'}</p>
                        <p><strong>Pixel Ratio:</strong> ${webglError.diagnostics.pixelRatio || 'Unknown'}</p>
                    </div>
                </details>
                ` : ''}
            </div>
        `;

        // Replace detail element with error content
        if (this.detailElement) {
            this.detailElement.innerHTML = detailHTML;
            this.detailElement.style.maxWidth = '600px';
            this.detailElement.style.margin = '0 auto';
            this.detailElement.style.textAlign = 'left';
        }

        console.error('❌ WebGL Error:', errorInfo.title, errorInfo.description);
        console.error('Diagnostics:', webglError.diagnostics);
    }

    /**
     * Show error state
     */
    error(message) {
        this.updateStatus('Error Loading', message);
        if (this.progressBar) {
            this.progressBar.style.background = 'linear-gradient(90deg, #ff0000, #ff6b00)';
        }
        this.stopSlideshow();
        this.stopProgressAnimation();
        console.error('❌ Loading error:', message);
    }
}
