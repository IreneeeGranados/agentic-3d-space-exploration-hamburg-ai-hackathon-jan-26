/**
 * LoadingManager - Controls the loading screen with progress tracking
 */
export class LoadingManager {
    constructor() {
        this.screen = document.getElementById('loading-screen');
        this.statusElement = document.getElementById('loading-status');
        this.detailElement = document.getElementById('loading-detail');
        this.progressBar = document.querySelector('.loading-progress-bar');
        
        this.totalSteps = 0;
        this.completedSteps = 0;
        this.startTime = Date.now();
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
        this.updateProgress();
        console.log(`✓ Completed: ${stepName} (${this.completedSteps}/${this.totalSteps})`);
    }

    /**
     * Update progress bar
     */
    updateProgress() {
        if (!this.progressBar) return;
        
        const progress = (this.completedSteps / this.totalSteps) * 100;
        this.progressBar.style.width = `${Math.min(progress, 100)}%`;
    }

    /**
     * Set custom progress percentage
     */
    setProgress(percent) {
        if (!this.progressBar) return;
        this.progressBar.style.width = `${Math.min(percent, 100)}%`;
    }

    /**
     * Finish loading and hide screen
     */
    finish() {
        const loadTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
        this.updateStatus('Ready for Launch! 🚀', `Loaded in ${loadTime}s`);
        this.setProgress(100);
        
        console.log(`✓ Loading complete in ${loadTime}s`);
        
        // Wait a moment then fade out
        setTimeout(() => {
            if (this.screen) {
                this.screen.classList.add('hidden');
            }
            
            // Remove from DOM after transition
            setTimeout(() => {
                if (this.screen && this.screen.parentNode) {
                    this.screen.parentNode.removeChild(this.screen);
                }
            }, 500);
        }, 800);
    }

    /**
     * Show error state
     */
    error(message) {
        this.updateStatus('Error Loading', message);
        if (this.progressBar) {
            this.progressBar.style.background = 'linear-gradient(90deg, #ff0000, #ff6b00)';
        }
        console.error('❌ Loading error:', message);
    }
}
