/**
 * NarratorDialog - Bottom UI for displaying planet narrations with chat
 * Like a tour guide speaking to you + Q&A capability
 */
export class NarratorDialog {
    constructor(narrationService = null) {
        this.narrationService = narrationService;
        this.isVisible = false;
        this.audioElement = null;
        this.currentPlanet = null;
        this.typewriterInterval = null;
        this.chatHistory = [];
        
        this.createDialog();
        this.attachEventListeners();
    }

    createDialog() {
        // Create overlay container
        this.container = document.createElement('div');
        this.container.id = 'narrator-dialog';
        this.container.className = 'narrator-dialog';
        
        this.container.innerHTML = `
            <div class="narrator-content">
                <!-- Loading Screen -->
                <div class="spaice-loading-overlay" id="spaice-loading">
                    <div class="spaice-loading-content">
                        <div class="chatbot-face-large">
                            <div class="face-inner">
                                <div class="eye eye-left">
                                    <div class="pupil"></div>
                                </div>
                                <div class="eye eye-right">
                                    <div class="pupil"></div>
                                </div>
                                <div class="mouth mouth-closed">
                                    <div class="mouth-line-closed"></div>
                                </div>
                                <div class="antenna">
                                    <div class="antenna-tip"></div>
                                </div>
                            </div>
                        </div>
                        <div class="loading-text">SpAIce is thinking...</div>
                        <div class="loading-dots">
                            <span>.</span><span>.</span><span>.</span>
                        </div>
                    </div>
                </div>
                
                <div class="narrator-header">
                    <div class="chatbot-face-container">
                        <div class="chatbot-face" id="chatbot-face">
                            <div class="face-inner">
                                <div class="eye eye-left">
                                    <div class="pupil"></div>
                                </div>
                                <div class="eye eye-right">
                                    <div class="pupil"></div>
                                </div>
                                <div class="mouth">
                                    <div class="mouth-line"></div>
                                </div>
                                <div class="antenna">
                                    <div class="antenna-tip"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="narrator-info">
                        <div class="narrator-planet-name" id="narrator-planet-name">Planet Name</div>
                        <div class="narrator-subtitle">SpAIce - Your AI Guide</div>
                    </div>
                    <button class="narrator-close" id="narrator-close" title="Close (Esc)">×</button>
                </div>
                
                <div class="narrator-body">
                    <div class="narrator-narration-section">
                        <div class="narrator-text" id="narrator-text">
                            Loading narration...
                        </div>
                        
                        <div class="narrator-audio-indicator" id="narrator-audio-indicator">
                            <div class="audio-wave">
                                <span></span><span></span><span></span><span></span><span></span>
                            </div>
                            <span class="audio-status">🔊 SpAIce is speaking...</span>
                        </div>
                    </div>
                    
                    <!-- Chat Section -->
                    <div class="narrator-chat-section" id="narrator-chat-section">
                        <div class="narrator-chat-header">
                            <span class="chat-header-icon">💬</span>
                            <span>Ask SpAIce about this planet</span>
                        </div>
                        <div class="narrator-chat-messages" id="narrator-chat-messages">
                            <!-- Messages appear here -->
                        </div>
                        <div class="narrator-chat-input-wrapper">
                            <input 
                                type="text" 
                                id="narrator-chat-input" 
                                class="narrator-chat-input" 
                                placeholder="Ask SpAIce anything..."
                                maxlength="200"
                            />
                            <button class="narrator-chat-send" id="narrator-chat-send" title="Send (Enter)">
                                <span class="send-icon">➤</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="narrator-footer">
                    <button class="narrator-action-btn" id="narrator-skip">Skip Audio</button>
                    <button class="narrator-action-btn secondary" id="narrator-minimize">Minimize</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);
        
        // Cache element references
        this.elements = {
            planetName: document.getElementById('narrator-planet-name'),
            text: document.getElementById('narrator-text'),
            audioIndicator: document.getElementById('narrator-audio-indicator'),
            closeBtn: document.getElementById('narrator-close'),
            skipBtn: document.getElementById('narrator-skip'),
            minimizeBtn: document.getElementById('narrator-minimize'),
            chatSection: document.getElementById('narrator-chat-section'),
            chatMessages: document.getElementById('narrator-chat-messages'),
            chatInput: document.getElementById('narrator-chat-input'),
            chatSend: document.getElementById('narrator-chat-send'),
            chatbotFace: document.getElementById('chatbot-face'),
            loadingOverlay: document.getElementById('spaice-loading')
        };
    }

    attachEventListeners() {
        // Close button
        this.elements.closeBtn.addEventListener('click', () => {
            console.log('❌ Close button clicked');
            this.hide();
        });
        
        // Skip button
        this.elements.skipBtn.addEventListener('click', () => {
            console.log('⏭️ Skip button clicked');
            this.skip();
        });
        
        // Minimize button
        this.elements.minimizeBtn.addEventListener('click', () => {
            console.log('🔽 Minimize button clicked');
            this.minimize();
        });
        
        // Chat send button
        this.elements.chatSend.addEventListener('click', () => this.handleChatSend());
        
        // Chat input - Enter key
        this.elements.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                this.handleChatSend();
            }
        });
        
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                console.log('⌨️ ESC pressed - closing dialog');
                this.hide();
            }
            
            // Prevent other keyboard shortcuts when dialog is open and user is typing
            if (this.isVisible && document.activeElement === this.elements.chatInput) {
                // Only allow ESC, Enter, and normal typing
                if (e.key !== 'Escape' && e.key !== 'Enter') {
                    e.stopPropagation();
                }
            }
        });
        
        console.log('✅ NarratorDialog event listeners attached');
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.elements.loadingOverlay.style.display = 'flex';
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        this.elements.loadingOverlay.style.display = 'none';
    }

    /**
     * Show narrator dialog with narration
     * @param {Object} planet - Planet data
     * @param {string} text - Narration text
     * @param {Blob|null} audioBlob - Audio data
     */
    async show(planet, text, audioBlob = null) {
        console.log('🎬 NarratorDialog.show() called with:', {
            planet: planet?.pl_name,
            textLength: text?.length,
            hasAudio: !!audioBlob
        });
        
        this.currentPlanet = planet;
        
        // Clear chat history for new planet
        this.chatHistory = [];
        this.elements.chatMessages.innerHTML = '';
        
        // Enable chat input if AI is available
        if (this.narrationService && this.narrationService.openAIService) {
            this.elements.chatInput.disabled = false;
            this.elements.chatSend.disabled = false;
        } else {
            this.elements.chatInput.disabled = true;
            this.elements.chatSend.disabled = true;
            this.elements.chatInput.placeholder = 'AI not configured';
        }
        
        // Update content
        this.elements.planetName.textContent = planet.pl_name || 'Unknown Planet';
        console.log('✅ Planet name set to:', this.elements.planetName.textContent);
        
        // Clear previous text
        this.elements.text.textContent = '';
        
        // Show dialog
        console.log('👁️ Adding visible class to container...');
        this.container.classList.add('visible');
        this.container.classList.remove('minimized');
        this.isVisible = true;
        
        // Hide loading overlay (if it was showing)
        this.hideLoading();
        
        console.log('📝 Container classes:', this.container.className);
        console.log('📏 Container computed display:', window.getComputedStyle(this.container).display);
        
        // Start typewriter effect for text
        this.typewriterEffect(text);
        
        // Play audio if available (with delay to let text start appearing)
        if (audioBlob) {
            setTimeout(() => {
                this.playAudio(audioBlob);
            }, 500);
        } else {
            this.elements.audioIndicator.style.display = 'none';
        }
        
        console.log('✅ show() method completed');
    }
    
    /**
     * Typewriter effect for text display
     */
    typewriterEffect(text, speed = 30) {
        let index = 0;
        this.elements.text.textContent = '';
        
        // Clear any existing typewriter interval
        if (this.typewriterInterval) {
            clearInterval(this.typewriterInterval);
        }
        
        this.typewriterInterval = setInterval(() => {
            if (index < text.length) {
                this.elements.text.textContent += text.charAt(index);
                index++;
            } else {
                clearInterval(this.typewriterInterval);
                this.typewriterInterval = null;
            }
        }, speed);
    }

    /**
     * Play audio narration
     */
    async playAudio(audioBlob) {
        // Stop any existing audio
        this.stopAudio();
        
        // Show audio indicator
        this.elements.audioIndicator.style.display = 'flex';
        
        // Animate chatbot face (talking)
        if (this.elements.chatbotFace) {
            this.elements.chatbotFace.classList.add('talking');
        }
        
        // Create audio element
        this.audioElement = new Audio();
        this.audioElement.src = URL.createObjectURL(audioBlob);
        
        // Handle audio events
        this.audioElement.addEventListener('ended', () => {
            console.log('🎙️ Audio finished');
            this.elements.audioIndicator.style.display = 'none';
            
            // Stop chatbot face animation
            if (this.elements.chatbotFace) {
                this.elements.chatbotFace.classList.remove('talking');
            }
            
            // Auto-hide after audio ends
            setTimeout(() => {
                if (this.isVisible) {
                    this.hide();
                }
            }, 2000); // Stay visible 2 seconds after audio ends
        });
        
        this.audioElement.addEventListener('error', (e) => {
            console.error('❌ Audio playback error:', e);
            this.elements.audioIndicator.style.display = 'none';
        });
        
        // Play audio
        try {
            await this.audioElement.play();
            console.log('🔊 Audio playing');
        } catch (error) {
            console.error('❌ Failed to play audio:', error);
            this.elements.audioIndicator.style.display = 'none';
        }
    }

    /**
     * Stop audio playback
     */
    stopAudio() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
            
            // Clean up blob URL
            if (this.audioElement.src) {
                URL.revokeObjectURL(this.audioElement.src);
            }
            
            this.audioElement = null;
        }
    }

    /**
     * Skip current narration
     */
    skip() {
        // Stop typewriter effect
        if (this.typewriterInterval) {
            clearInterval(this.typewriterInterval);
            this.typewriterInterval = null;
        }
        
        this.stopAudio();
        this.hide();
    }

    /**
     * Hide narrator dialog completely
     */
    hide() {
        this.container.classList.remove('visible');
        this.container.classList.remove('minimized');
        this.isVisible = false;
        
        // Stop typewriter effect
        if (this.typewriterInterval) {
            clearInterval(this.typewriterInterval);
            this.typewriterInterval = null;
        }
        
        // Stop and clean up audio
        this.stopAudio();
        
        // Hide loading overlay
        this.hideLoading();
        
        // Clear current planet
        this.currentPlanet = null;
        
        // Clear chat history
        this.chatHistory = [];
        this.elements.chatMessages.innerHTML = '';
        
        // Reset input
        this.elements.chatInput.value = '';
        
        console.log('✅ NarratorDialog closed and cleaned up');
    }

    /**
     * Minimize dialog (show compact version)
     */
    minimize() {
        this.container.classList.toggle('minimized');
    }

    /**
     * Handle chat message send
     */
    async handleChatSend() {
        const input = this.elements.chatInput;
        const message = input.value.trim();
        
        if (!message || !this.currentPlanet) return;
        
        // Clear input
        input.value = '';
        
        // Add user message to chat
        this.addChatMessage('user', message);
        
        // Show loading overlay
        this.showLoading();
        
        // Disable input while processing
        this.elements.chatInput.disabled = true;
        this.elements.chatSend.disabled = true;
        
        try {
            // Generate response using AI
            const response = await this.askQuestion(message);
            
            // Hide loading overlay
            this.hideLoading();
            
            // Re-enable input
            this.elements.chatInput.disabled = false;
            this.elements.chatSend.disabled = false;
            
            // Add AI response
            this.addChatMessage('assistant', response);
            
        } catch (error) {
            console.error('❌ Chat error:', error);
            this.hideLoading();
            
            // Re-enable input
            this.elements.chatInput.disabled = false;
            this.elements.chatSend.disabled = false;
            
            this.addChatMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        }
        
        // Focus back on input
        this.elements.chatInput.focus();
    }

    /**
     * Ask AI a question about the current planet
     */
    async askQuestion(question) {
        if (!this.narrationService || !this.narrationService.openAIService) {
            return 'AI service is not available.';
        }

        const planet = this.currentPlanet;
        const characteristics = planet.characteristics || {};
        
        const context = `You are SpAIce, an enthusiastic AI space guide. Answer this question about ${planet.pl_name}:

Question: ${question}

Planet Information:
- Type: ${characteristics.radius_position || 'Unknown'}
- Distance: ${planet.sy_dist ? (planet.sy_dist * 3.26156).toFixed(2) + ' light years' : 'Unknown'}
- Habitability: ${characteristics.habitability_percent || 0}%
- Atmosphere: ${characteristics.atmosphere_type || 'Unknown'}
- Composition: ${characteristics.principal_material || 'Unknown'}
- Radius: ${planet.pl_rade || 'Unknown'} Earth radii
- Mass: ${planet.pl_bmasse || 'Unknown'} Earth masses

Provide a concise, friendly answer (2-3 sentences). Be enthusiastic and educational.`;

        try {
            const response = await this.narrationService.openAIService.generateCompletion(context);
            return response.trim();
        } catch (error) {
            console.error('❌ OpenAI error:', error);
            throw error;
        }
    }

    /**
     * Add message to chat
     */
    addChatMessage(role, text, isLoading = false) {
        const messageId = `msg-${Date.now()}-${Math.random()}`;
        const messageEl = document.createElement('div');
        messageEl.className = `narrator-chat-message ${role}`;
        messageEl.id = messageId;
        
        if (isLoading) {
            messageEl.classList.add('loading');
        }
        
        const icon = role === 'user' ? '👤' : '🤖';
        
        messageEl.innerHTML = `
            <div class="message-icon">${icon}</div>
            <div class="message-text">${text}</div>
        `;
        
        this.elements.chatMessages.appendChild(messageEl);
        
        // Scroll to bottom
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        
        return messageId;
    }

    /**
     * Remove message from chat
     */
    removeChatMessage(messageId) {
        const messageEl = document.getElementById(messageId);
        if (messageEl) {
            messageEl.remove();
        }
    }

    /**
     * Check if dialog is visible
     */
    isShowing() {
        return this.isVisible;
    }
}
