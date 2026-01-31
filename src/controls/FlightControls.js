/**
 * Flight Controls
 * Handles keyboard and mouse input for spacecraft flight
 */

export class FlightControls {
    constructor(canvas) {
        this.canvas = canvas;
        this.enabled = false;

        // Input state
        this.keys = {
            forward: false,      // W or Up
            backward: false,     // S or Down
            rollLeft: false,     // A or Left
            rollRight: false,    // D or Right
            yawLeft: false,      // Q
            yawRight: false,     // E
            boost: false,        // Space
            slowMode: false      // Shift
        };

        // Mouse control
        this.mouseSensitivity = 0.002;
        this.mouseMovement = { x: 0, y: 0 };
        this.isMouseLocked = false;

        // Bind methods
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onPointerLockChange = this.onPointerLockChange.bind(this);
        this.onCanvasClick = this.onCanvasClick.bind(this);
    }

    /**
     * Enable flight controls
     */
    enable() {
        if (this.enabled) return;
        this.enabled = true;

        // Keyboard listeners
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);

        // Mouse movement listener
        document.addEventListener('mousemove', this.onMouseMove);

        // Pointer lock listeners (for immersive mouse control)
        document.addEventListener('pointerlockchange', this.onPointerLockChange);
        this.canvas.addEventListener('click', this.onCanvasClick);

        console.log('Flight controls enabled');
    }

    /**
     * Disable flight controls
     */
    disable() {
        if (!this.enabled) return;
        this.enabled = false;

        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('pointerlockchange', this.onPointerLockChange);
        this.canvas.removeEventListener('click', this.onCanvasClick);

        // Reset all keys
        Object.keys(this.keys).forEach(key => this.keys[key] = false);

        console.log('Flight controls disabled');
    }

    /**
     * Key down handler
     */
    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.rollLeft = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.rollRight = true;
                break;
            case 'KeyQ':
                this.keys.yawLeft = true;
                break;
            case 'KeyE':
                this.keys.yawRight = true;
                break;
            case 'Space':
                this.keys.boost = true;
                event.preventDefault(); // Prevent page scroll
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.slowMode = true;
                break;
        }
    }

    /**
     * Key up handler
     */
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.rollLeft = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.rollRight = false;
                break;
            case 'KeyQ':
                this.keys.yawLeft = false;
                break;
            case 'KeyE':
                this.keys.yawRight = false;
                break;
            case 'Space':
                this.keys.boost = false;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.slowMode = false;
                break;
        }
    }

    /**
     * Mouse movement handler
     */
    onMouseMove(event) {
        if (this.isMouseLocked) {
            // Pointer lock mode - direct movement deltas
            this.mouseMovement.x = event.movementX * this.mouseSensitivity;
            this.mouseMovement.y = event.movementY * this.mouseSensitivity;
        } else {
            // Regular mode - calculate from screen center
            const rect = this.canvas.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            // Normalize to -1 to 1 range
            this.mouseMovement.x = ((mouseX - centerX) / centerX) * this.mouseSensitivity * 10;
            this.mouseMovement.y = ((mouseY - centerY) / centerY) * this.mouseSensitivity * 10;
        }
    }

    /**
     * Canvas click - request pointer lock for immersive control
     */
    onCanvasClick() {
        if (!this.isMouseLocked) {
            this.canvas.requestPointerLock();
        }
    }

    /**
     * Pointer lock change handler
     */
    onPointerLockChange() {
        this.isMouseLocked = document.pointerLockElement === this.canvas;
        if (this.isMouseLocked) {
            console.log('Mouse locked - immersive flight mode');
        } else {
            console.log('Mouse unlocked - press ESC to exit, click canvas to re-lock');
            this.mouseMovement.x = 0;
            this.mouseMovement.y = 0;
        }
    }

    /**
     * Get current control inputs (called every frame)
     */
    getControlInputs() {
        // Calculate thrust (-1 to 1)
        let thrust = 0;
        if (this.keys.forward) thrust += 1;
        if (this.keys.backward) thrust -= 1;

        // Calculate roll (-1 to 1)
        let roll = 0;
        if (this.keys.rollLeft) roll -= 1;
        if (this.keys.rollRight) roll += 1;

        // Calculate yaw from keys (-1 to 1)
        let yawKeys = 0;
        if (this.keys.yawLeft) yawKeys -= 1;
        if (this.keys.yawRight) yawKeys += 1;

        // Combine mouse and keyboard yaw
        const yaw = yawKeys + this.mouseMovement.x;

        // Pitch from mouse
        const pitch = this.mouseMovement.y;

        // Boost
        const boost = this.keys.boost;

        // Slow mode modifier
        const slowMode = this.keys.slowMode;

        // Reset mouse movement (consumed this frame)
        if (!this.isMouseLocked) {
            // In non-locked mode, gradually decay mouse input
            this.mouseMovement.x *= 0.9;
            this.mouseMovement.y *= 0.9;
        } else {
            // In locked mode, reset immediately
            this.mouseMovement.x = 0;
            this.mouseMovement.y = 0;
        }

        return {
            thrust,
            pitch,
            yaw,
            roll,
            boost,
            slowMode
        };
    }

    /**
     * Update (called every frame if needed)
     */
    update(deltaTime) {
        // Currently no per-frame updates needed
        // This method exists for future enhancements
    }

    /**
     * Cleanup
     */
    dispose() {
        this.disable();
    }
}
