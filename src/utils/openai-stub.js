/**
 * OpenAI Stub for Static Builds
 * This file provides a dummy implementation for environments where the openai package is not available
 * (e.g., GitHub Pages, static hosting)
 */

console.warn('OpenAI stub loaded - AI features disabled in static build');

export default class OpenAI {
    constructor() {
        console.warn('OpenAI stub constructor called');
        return null;
    }
}
