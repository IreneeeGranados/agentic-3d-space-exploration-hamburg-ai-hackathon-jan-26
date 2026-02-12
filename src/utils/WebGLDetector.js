/**
 * WebGL Detection Utility
 * Detects WebGL support and provides diagnostic information
 */

export class WebGLDetector {
    /**
     * Detect WebGL support and return detailed diagnostic information
     * @returns {Object} Detection result with support status and error details
     */
    static detectWebGL() {
        const result = {
            supported: false,
            webgl2: false,
            webgl1: false,
            errorType: null,
            errorMessage: null,
            diagnostics: this.getDiagnosticInfo()
        };

        // Check if canvas is supported
        const canvas = document.createElement('canvas');
        if (!canvas) {
            result.errorType = 'NO_CANVAS';
            result.errorMessage = 'HTML5 Canvas is not supported by your browser.';
            return result;
        }

        // Try WebGL2 first
        try {
            const gl2 = canvas.getContext('webgl2');
            if (gl2) {
                result.webgl2 = true;
                result.supported = true;
                return result;
            }
        } catch (e) {
            console.warn('WebGL2 context creation failed:', e);
        }

        // Try WebGL1
        try {
            const gl1 = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl1) {
                result.webgl1 = true;
                result.supported = true;
                return result;
            }
        } catch (e) {
            console.warn('WebGL1 context creation failed:', e);
        }

        // If we get here, WebGL is not supported
        result.errorType = this.identifyErrorType();
        result.errorMessage = this.getErrorMessage(result.errorType);

        return result;
    }

    /**
     * Identify the specific reason why WebGL is not available
     * @returns {string} Error type identifier
     */
    static identifyErrorType() {
        // Check if browser is known to not support WebGL
        const ua = navigator.userAgent.toLowerCase();

        // Very old browsers
        if (ua.indexOf('msie') !== -1 || ua.indexOf('trident') !== -1) {
            return 'OLD_BROWSER';
        }

        // Check if hardware acceleration might be disabled
        // This is a heuristic - we can't directly detect this
        if (typeof WebGLRenderingContext === 'undefined') {
            return 'NO_WEBGL_SUPPORT';
        }

        // If WebGLRenderingContext exists but we can't create a context,
        // it's likely a hardware/driver issue
        return 'HARDWARE_ISSUE';
    }

    /**
     * Get user-friendly error message with troubleshooting steps
     * @param {string} errorType - Error type identifier
     * @returns {Object} Error message and troubleshooting steps
     */
    static getErrorMessage(errorType) {
        const messages = {
            'NO_CANVAS': {
                title: 'Canvas Not Supported',
                description: 'Your browser does not support HTML5 Canvas, which is required for this application.',
                steps: [
                    'Update your browser to the latest version',
                    'Try using a modern browser (Chrome, Firefox, Edge, or Safari)',
                    'Check if your browser has Canvas support disabled'
                ]
            },
            'OLD_BROWSER': {
                title: 'Browser Too Old',
                description: 'Your browser version is too old and does not support WebGL.',
                steps: [
                    'Update to the latest version of your browser',
                    'Consider switching to a modern browser like Chrome, Firefox, or Edge',
                    'Ensure your operating system is up to date'
                ]
            },
            'NO_WEBGL_SUPPORT': {
                title: 'WebGL Not Supported',
                description: 'Your browser does not support WebGL technology.',
                steps: [
                    'Update your browser to the latest version',
                    'Try a different browser (Chrome, Firefox, Edge, or Safari)',
                    'Check if WebGL is disabled in your browser settings'
                ]
            },
            'HARDWARE_ISSUE': {
                title: 'Graphics Hardware Issue',
                description: 'WebGL is available but cannot initialize. This is usually due to graphics driver or hardware acceleration issues.',
                steps: [
                    'Enable hardware acceleration in your browser settings',
                    'Update your graphics drivers to the latest version',
                    'Try restarting your browser',
                    'Check if your GPU is blacklisted by visiting chrome://gpu or about:support',
                    'Try disabling browser extensions that might interfere with graphics'
                ]
            }
        };

        return messages[errorType] || {
            title: 'WebGL Unavailable',
            description: 'WebGL could not be initialized for an unknown reason.',
            steps: [
                'Update your browser to the latest version',
                'Enable hardware acceleration in browser settings',
                'Update your graphics drivers',
                'Try a different browser'
            ]
        };
    }

    /**
     * Get diagnostic information about the browser and system
     * @returns {Object} Diagnostic information
     */
    static getDiagnosticInfo() {
        const info = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            vendor: navigator.vendor,
            language: navigator.language,
            hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
            deviceMemory: navigator.deviceMemory || 'Unknown',
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            colorDepth: window.screen.colorDepth,
            pixelRatio: window.devicePixelRatio || 1
        };

        // Try to get GPU info if WebGL is partially available
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    info.gpu = {
                        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
                        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
                    };
                }
            }
        } catch (e) {
            info.gpu = 'Unable to detect';
        }

        return info;
    }

    /**
     * Get a simple browser name from user agent
     * @returns {string} Browser name
     */
    static getBrowserName() {
        const ua = navigator.userAgent;
        if (ua.indexOf('Firefox') > -1) return 'Firefox';
        if (ua.indexOf('Edg') > -1) return 'Edge';
        if (ua.indexOf('Chrome') > -1) return 'Chrome';
        if (ua.indexOf('Safari') > -1) return 'Safari';
        if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) return 'Internet Explorer';
        return 'Unknown Browser';
    }
}
