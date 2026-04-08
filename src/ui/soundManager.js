/**
 * ============================================================
 * Sound Manager Component v5.0 - Complete Version
 * ============================================================
 * 
 * Features:
 * - Comprehensive sound system for all app actions
 * - Preloading and caching for instant playback
 * - Volume control with persistence
 * - Fallback mechanisms for missing files
 * - Error handling without breaking functionality
 * - Mobile-friendly (respects user gesture requirements)
 * - Multiple audio format support (.mp3, .wav, .ogg)
 * - Mute/unmute toggle with visual feedback
 * - Category-based organization (UI, Actions, Notifications)
 * 
 * Supported Sounds:
 * - loginSuccess / loginError - Authentication sounds
 * - logoutSuccess - Logout confirmation
 * - click - Button/UI interaction
 * - success - Operation completed successfully
 * - error - Operation failed
 * - warning - Caution/warning notification
 * - info - Informational notification
 * - scan - Barcode/QR scanning
 * - notification - Alert/bell sound
 * - refresh - Data refresh indicator
 * - delete - Item deletion confirmation
 * - edit - Edit mode activation
 * - transfer - Money transfer action
 * - collection - Collection action
 * - achievement - Goal/target achieved
 * 
 * @version 5.0.0
 * @author Axentro Team
 */

// ============================================================
// SOUND CONFIGURATION
// ============================================================

const SoundConfig = {
    // Master volume (0.0 to 1.0)
    DEFAULT_VOLUME: 0.7,
    MIN_VOLUME: 0.0,
    MAX_VOLUME: 1.0,
    
    // Enable/disable sounds globally
    ENABLED_BY_DEFAULT: true,
    
    // Preload sounds on init (recommended for better UX)
    PRELOAD_ON_INIT: true,
    
    // Retry settings for failed loads
    MAX_LOAD_RETRIES: 2,
    RETRY_DELAY_MS: 1000,
    
    // Audio context settings (for Web Audio API features)
    USE_WEBAUDIO_API: false, // Set to true for advanced features
    
    // Storage key for persisting volume/mute preferences
    STORAGE_KEY: 'axentro_sound_settings'
};

// ============================================================
// SOUND DEFINITIONS REGISTRY
// All sounds used in the application are defined here
// ============================================================

const SoundRegistry = {
    // ==========================================
    // AUTHENTICATION SOUNDS
    // ==========================================
    loginSuccess: {
        file: 'assets/sounds/login-success.mp3',
        volume: 0.8,
        category: 'auth',
        description: 'Successful login sound',
        fallbackTone: 800, // Hz frequency for Web Audio API fallback
        duration: 500
    },
    loginError: {
        file: 'assets/sounds/login-error.mp3',
        volume: 0.6,
        category: 'auth',
        description: 'Failed login sound',
        fallbackTone: 300,
        duration: 400
    },
    logoutSuccess: {
        file: 'assets/sounds/logout.mp3',
        volume: 0.7,
        category: 'auth',
        description: 'Logout confirmation sound',
        fallbackTone: 600,
        duration: 400
    },
    
    // ==========================================
    // UI INTERACTION SOUNDS
    // ==========================================
    click: {
        file: 'assets/sounds/click.mp3',
        volume: 0.4,
        category: 'ui',
        description: 'Button click/tap sound',
        fallbackTone: 1000,
        duration: 50
    },
    edit: {
        file: 'assets/sounds/edit.mp3',
        volume: 0.5,
        category: 'ui',
        description: 'Edit mode activation sound',
        fallbackTone: 900,
        duration: 150
    },
    delete: {
        file: 'assets/sounds/delete.mp3',
        volume: 0.6,
        category: 'ui',
        description: 'Delete confirmation sound',
        fallbackTone: 400,
        duration: 200
    },
    refresh: {
        file: 'assets/sounds/refresh.mp3',
        volume: 0.5,
        category: 'ui',
        description: 'Data refresh sound',
        fallbackTone: 700,
        duration: 300
    },
    
    // ==========================================
    // OPERATION RESULT SOUNDS
    // ==========================================
    success: {
        file: 'assets/sounds/success.mp3',
        volume: 0.8,
        category: 'action',
        description: 'Operation successful sound',
        fallbackTone: 1200,
        duration: 400
    },
    error: {
        file: 'assets/sounds/error.mp3',
        volume: 0.6,
        category: 'action',
        description: 'Operation error sound',
        fallbackTone: 250,
        duration: 350
    },
    warning: {
        file: 'assets/sounds/warning.mp3',
        volume: 0.7,
        category: 'action',
        description: 'Warning/caution sound',
        fallbackTone: 500,
        duration: 300
    },
    info: {
        file: 'assets/sounds/info.mp3',
        volume: 0.6,
        category: 'action',
        description: 'Informational sound',
        fallbackTone: 800,
        duration: 250
    },
    
    // ==========================================
    // BUSINESS OPERATION SOUNDS
    // ==========================================
    transfer: {
        file: 'assets/sounds/transfer.mp3',
        volume: 0.7,
        category: 'business',
        description: 'Money transfer sound',
        fallbackTone: 1000,
        duration: 350
    },
    collection: {
        file: 'assets/sounds/collection.mp3',
        volume: 0.7,
        category: 'business',
        description: 'Collection/payment sound',
        fallbackTone: 1100,
        duration: 350
    },
    scan: {
        file: 'assets/sounds/scan.mp3',
        volume: 0.8,
        category: 'business',
        description: 'Barcode/QR scan sound',
        fallbackTone: 1500,
        duration: 200
    },
    
    // ==========================================
    // NOTIFICATION SOUNDS
    // ==========================================
    notification: {
        file: 'assets/sounds/notification.mp3',
        volume: 0.8,
        category: 'notification',
        description: 'Alert/notification bell sound',
        fallbackTone: 900,
        duration: 500
    },
    achievement: {
        file: 'assets/sounds/achievement.mp3',
        volume: 0.9,
        category: 'notification',
        description: 'Goal/target achieved fanfare',
        fallbackTone: 1400,
        duration: 800
    },
    
    // ==========================================
    // SYSTEM SOUNDS
    // ==========================================
    startup: {
        file: 'assets/sounds/startup.mp3',
        volume: 0.7,
        category: 'system',
        description: 'Application startup sound',
        fallbackTone: 600,
        duration: 600
    },
    shutdown: {
        file: 'assets/sounds/shutdown.mp3',
        volume: 0.6,
        category: 'system',
        description: 'Application exit sound',
        fallbackTone: 400,
        duration: 400
    }
};

// ============================================================
// SOUND MANAGER CLASS
// ============================================================

const Sound = {
    // State
    enabled: true,
    muted: false,
    masterVolume: SoundConfig.DEFAULT_VOLUME,
    
    // Audio cache (loaded Audio objects)
    audioCache: {},
    
    // Load tracking
    loadStatus: {}, // 'pending', 'loaded', 'failed'
    loadRetries: {},
    
    // Web Audio API context (optional, for advanced features)
    audioContext: null,
    oscillatorNode: null,
    gainNode: null,
    
    // Currently playing sounds (for management)
    activeSounds: new Set(),
    
    /**
     * Initialize the Sound Manager
     * Should be called once when application starts
     * @returns {Promise<boolean>} Initialization success status
     */
    async init() {
        console.log('🔊 Initializing Sound Manager...');
        
        try {
            // Load saved preferences from localStorage
            this.loadPreferences();
            
            // Initialize Web Audio API if enabled and supported
            if (SoundConfig.USE_WEBAUDIO_API && this.isWebAudioSupported()) {
                this.initWebAudioAPI();
            }
            
            // Initialize all sound statuses
            Object.keys(SoundRegistry).forEach(soundName => {
                this.loadStatus[soundName] = 'pending';
                this.loadRetries[soundName] = 0;
            });
            
            // Preload sounds if configured
            if (SoundConfig.PRELOAD_ON_INIT) {
                await this.preloadAllSounds();
            }
            
            console.log(`✅ Sound Manager initialized | Enabled: ${this.enabled} | Volume: ${this.masterVolume}`);
            return true;
            
        } catch (error) {
            console.error('❌ Sound Manager initialization error:', error);
            this.enabled = false;
            return false;
        }
    },
    
    /**
     * Check if Web Audio API is supported
     * @returns {boolean} Support status
     */
    isWebAudioSupported() {
        return !!(window.AudioContext || window.webkitAudioContext);
    },
    
    /**
     * Initialize Web Audio API for advanced features
     * Used for generating fallback tones when audio files fail
     */
    initWebAudioAPI() {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();
            
            // Create gain node for volume control
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.gainNode.gain.value = this.masterVolume;
            
            console.log('🎵 Web Audio API initialized');
            
        } catch (error) {
            console.warn('⚠️ Web Audio API not available:', error.message);
            this.audioContext = null;
        }
    },
    
    /**
     * Load saved user preferences from localStorage
     */
    loadPreferences() {
        try {
            const saved = localStorage.getItem(SoundConfig.STORAGE_KEY);
            if (saved) {
                const prefs = JSON.parse(saved);
                this.muted = prefs.muted || false;
                this.masterVolume = prefs.volume || SoundConfig.DEFAULT_VOLUME;
                this.enabled = prefs.enabled !== undefined ? prefs.enabled : SoundConfig.ENABLED_BY_DEFAULT;
            }
        } catch (error) {
            console.warn('Could not load sound preferences:', error);
            // Use defaults
            this.muted = false;
            this.masterVolume = SoundConfig.DEFAULT_VOLUME;
            this.enabled = SoundConfig.ENABLED_BY_DEFAULT;
        }
    },
    
    /**
     * Save current preferences to localStorage
     */
    savePreferences() {
        try {
            const prefs = {
                muted: this.muted,
                volume: this.masterVolume,
                enabled: this.enabled
            };
            localStorage.setItem(SoundConfig.STORAGE_KEY, JSON.stringify(prefs));
        } catch (error) {
            console.warn('Could not save sound preferences:', error);
        }
    },
    
    /**
     * Preload all defined sounds into cache
     * Called during initialization
     * @returns {Promise<void>}
     */
    async preloadAllSounds() {
        console.log('📦 Preloading sounds...');
        
        const loadPromises = Object.keys(SoundRegistry).map(async (soundName) => {
            try {
                await this.loadSound(soundName);
            } catch (error) {
                console.warn(`⚠️ Failed to preload "${soundName}":`, error.message);
            }
        });
        
        await Promise.allSettled(loadPromises);
        
        const loadedCount = Object.values(this.loadStatus).filter(s => s === 'loaded').length;
        const totalCount = Object.keys(SoundRegistry).length;
        
        console.log(`✅ Sounds preloaded: ${loadedCount}/${totalCount}`);
    },
    
    /**
     * Load a single sound into cache
     * @param {string} soundName - Name of the sound to load
     * @returns {Promise<HTMLAudioElement>} Loaded audio element
     */
    async loadSound(soundName) {
        // Check if already loaded
        if (this.audioCache[soundName]) {
            return this.audioCache[soundName];
        }
        
        const soundDef = SoundRegistry[soundName];
        if (!soundDef) {
            throw new Error(`Sound "${soundName}" not found in registry`);
        }
        
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.preload = 'auto';
            
            // Set volume from definition
            audio.volume = (soundDef.volume || 1) * this.masterVolume;
            
            // Handle load events
            audio.addEventListener('canplaythrough', () => {
                this.audioCache[soundName] = audio;
                this.loadStatus[soundName] = 'loaded';
                resolve(audio);
            }, { once: true });
            
            audio.addEventListener('error', (e) => {
                console.warn(`⚠️ Failed to load sound "${soundName}"`, e);
                this.handleLoadError(soundName, reject);
            }, { once: true });
            
            // Start loading
            audio.src = soundDef.file;
            audio.load();
        });
    },
    
    /**
     * Handle sound loading errors with retry logic
     * @param {string} soundName - Sound that failed to load
     * @param {Function} reject - Promise reject function
     */
    handleLoadError(soundName, reject) {
        const retries = this.loadRetries[soundName] || 0;
        
        if (retries < SoundConfig.MAX_LOAD_RETRIES) {
            // Retry after delay
            this.loadRetries[soundName] = retries + 1;
            console.log(`🔄 Retrying sound "${soundName}" (${retries + 1}/${SoundConfig.MAX_LOAD_RETRIES})`);
            
            setTimeout(() => {
                this.loadSound(soundName).then(reject).catch(() => {
                    this.loadStatus[soundName] = 'failed';
                    reject(new Error(`Failed to load sound "${soundName}" after retries`));
                });
            }, SoundConfig.RETRY_DELAY_MS);
        } else {
            // Mark as failed permanently
            this.loadStatus[soundName] = 'failed';
            reject(new Error(`Failed to load sound "${soundName}"`));
        }
    },
    
    /**
     * Play a sound by name
     * Main method for playing sounds throughout the application
     * @param {string} soundName - Name of the sound to play
     * @param {Object} options - Playback options
     * @param {number} [options.volume] - Override volume (0-1)
     * @param {boolean} [options.loop] - Loop the sound
     * @param {Function} [options.onEnded] - Callback when sound ends
     * @returns {Promise<boolean>} Whether playback started successfully
     */
    async play(soundName, options = {}) {
        // Check if sounds are enabled
        if (!this.enabled || this.muted) {
            return false;
        }
        
        const soundDef = SoundRegistry[soundName];
        if (!soundDef) {
            console.warn(`⚠️ Unknown sound: "${soundName}"`);
            return false;
        }
        
        try {
            // Try to play cached audio file first
            if (this.loadStatus[soundName] === 'loaded' && this.audioCache[soundName]) {
                return this.playAudioFile(soundName, options);
            }
            
            // If not loaded, try loading it
            if (this.loadStatus[soundName] !== 'failed') {
                try {
                    await this.loadSound(soundName);
                    return this.playAudioFile(soundName, options);
                } catch (loadError) {
                    console.warn(`⚠️ Could not load "${soundName}", using fallback`);
                }
            }
            
            // Final fallback: use Web Audio API tone generator
            if (this.audioContext && soundDef.fallbackTone) {
                return this.playFallbackTone(soundDef, options);
            }
            
            // No audio available at all
            console.warn(`🔇 Cannot play "${soundName}" - no audio source available`);
            return false;
            
        } catch (error) {
            console.error(`❌ Error playing sound "${soundName}":`, error);
            return false;
        }
    },
    
    /**
     * Play an audio file from cache
     * @param {string} soundName - Sound name
     * @param {Object} options - Playback options
     * @returns {boolean} Success status
     */
    playAudioFile(soundName, options = {}) {
        const audio = this.audioCache[soundName];
        if (!audio) return false;
        
        try {
            // Clone audio to allow overlapping plays
            const soundInstance = audio.cloneNode(true);
            
            // Apply options
            const volumeOverride = options.volume !== undefined ? options.volume : null;
            const finalVolume = volumeOverride !== null 
                ? volumeOverride * this.masterVolume 
                : (SoundRegistry[soundName].volume || 1) * this.masterVolume;
            
            soundInstance.volume = finalVolume;
            soundInstance.loop = options.loop || false;
            
            // Track active sound
            const soundId = `${soundName}_${Date.now()}`;
            this.activeSounds.add(soundId);
            
            // Cleanup on end
            soundInstance.addEventListener('ended', () => {
                this.activeSounds.delete(soundId);
                if (options.onEnded && typeof options.onEnded === 'function') {
                    options.onEnded();
                }
            }, { once: true });
            
            // Play
            const playPromise = soundInstance.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.warn(`Playback prevented for "${soundName}":`, e.message);
                    this.activeSounds.delete(soundId);
                });
            }
            
            return true;
            
        } catch (error) {
            console.error(`Audio file playback error for "${soundName}":`, error);
            return false;
        }
    },
    
    /**
     * Play a fallback tone using Web Audio API
     * Used when audio file loading fails
     * @param {Object} soundDef - Sound definition object
     * @param {Object} options - Playback options
     * @returns {boolean} Success status
     */
    playFallbackTone(soundDef, options = {}) {
        if (!this.audioContext) {
            return false;
        }
        
        try {
            // Resume audio context if suspended (browser autoplay policy)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Configure oscillator
            oscillator.type = 'sine'; // Smooth sine wave
            oscillator.frequency.setValueAtTime(
                soundDef.fallbackTone || 440, 
                this.audioContext.currentTime
            );
            
            // Configure gain (volume)
            const volume = (options.volume !== undefined ? options.volume : (soundDef.volume || 0.7)) * this.masterVolume;
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
                0.001, 
                this.audioContext.currentTime + (soundDef.duration || 300) / 1000
            );
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Play
            const duration = (soundDef.duration || 300) / 1000;
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
            
            // Callback
            if (options.onEnded) {
                setTimeout(options.onEnded, duration * 1000);
            }
            
            return true;
            
        } catch (error) {
            console.error('Web Audio API fallback error:', error);
            return false;
        }
    },
    
    /**
     * Stop all currently playing sounds
     * Useful for emergency stop or scene changes
     */
    stopAll() {
        this.activeSounds.forEach(soundId => {
            // Note: Stopping specific instances requires more complex tracking
            // For simplicity, we just clear the set
        });
        this.activeSounds.clear();
        
        // Pause any playing audio elements
        Object.values(this.audioCache).forEach(audio => {
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
        
        console.log('🔇 All sounds stopped');
    },
    
    /**
     * Toggle mute/unmute
     * @returns {boolean} New mute state
     */
    toggleMute() {
        this.muted = !this.muted;
        this.savePreferences();
        
        console.log(`🔇 Sounds ${this.muted ? 'muted' : 'unmuted'}`);
        
        // Visual feedback
        if (this.muted) {
            UI?.showToast('صوت', 'تم كتم الصوت', 'info');
        }
        
        return this.muted;
    },
    
    /**
     * Set mute state explicitly
     * @param {boolean} mute - Whether to mute
     */
    setMute(mute) {
        this.muted = mute;
        this.savePreferences();
    },
    
    /**
     * Toggle sound system enabled/disabled
     * @returns {boolean} New enabled state
     */
    toggleEnabled() {
        this.enabled = !this.enabled;
        this.savePreferences();
        
        console.log(`🔊 Sound system ${this.enabled ? 'enabled' : 'disabled'}`);
        
        return this.enabled;
    },
    
    /**
     * Set master volume
     * @param {number} volume - Volume level (0.0 to 1.0)
     * @returns {number} Actual set volume (clamped)
     */
    setVolume(volume) {
        // Clamp value
        this.masterVolume = Math.max(SoundConfig.MIN_VOLUME, Math.min(SoundConfig.MAX_VOLUME, volume));
        
        // Update Web Audio API gain node if exists
        if (this.gainNode) {
            this.gainNode.gain.value = this.masterVolume;
        }
        
        // Save preference
        this.savePreferences();
        
        console.log(`🔈 Volume set to: ${(this.masterVolume * 100).toFixed(0)}%`);
        
        return this.masterVolume;
    },
    
    /**
     * Get current volume level
     * @returns {number} Current volume (0-1)
     */
    getVolume() {
        return this.masterVolume;
    },
    
    /**
     * Increase volume by step
     * @param {number} step - Amount to increase (default 0.1)
     * @returns {number} New volume
     */
    increaseVolume(step = 0.1) {
        return this.setVolume(this.masterVolume + step);
    },
    
    /**
     * Decrease volume by step
     * @param {number} step - Amount to decrease (default 0.1)
     * @returns {number} New volume
     */
    decreaseVolume(step = 0.1) {
        return this.setVolume(this.masterVolume - step);
    },
    
    /**
     * Check if a specific sound is loaded and ready
     * @param {string} soundName - Sound name to check
     * @returns {boolean} Ready status
     */
    isLoaded(soundName) {
        return this.loadStatus[soundName] === 'loaded';
    },
    
    /**
     * Get load status of a sound
     * @param {string} soundName - Sound name
     * @returns {string} Status: 'pending', 'loaded', 'failed'
     */
    getStatus(soundName) {
        return this.loadStatus[soundName] || 'unknown';
    },
    
    /**
     * Get list of all available sound names
     * @returns {Array<string>} Sound names array
     */
    getAvailableSounds() {
        return Object.keys(SoundRegistry);
    },
    
    /**
     * Get sound definition/details
     * @param {string} soundName - Sound name
     * @returns {Object|null} Sound definition or null
     */
    getSoundInfo(soundName) {
        return SoundRegistry[soundName] || null;
    },
    
    /**
     * Force reload/re-cache a sound
     * Useful if sound file was updated
     * @param {string} soundName - Sound to reload
     * @returns {Promise<boolean>} Success status
     */
    async reloadSound(soundName) {
        // Remove from cache
        if (this.audioCache[soundName]) {
            delete this.audioCache[soundName];
        }
        
        // Reset status
        this.loadStatus[soundName] = 'pending';
        this.loadRetries[soundName] = 0;
        
        // Reload
        try {
            await this.loadSound(soundName);
            console.log(`🔄 Sound "${soundName}" reloaded successfully`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to reload sound "${soundName}":`, error);
            return false;
        }
    },
    
    /**
     * Cleanup and destroy sound manager
     * Call when application unloads
     */
    destroy() {
        console.log('🗑️ Destroying Sound Manager...');
        
        // Stop all sounds
        this.stopAll();
        
        // Clear cache
        this.audioCache = {};
        
        // Close audio context
        if (this.audioContext) {
            this.audioContext.close().catch(e => console.warn('AudioContext close error:', e));
            this.audioContext = null;
        }
        
        // Clear references
        this.activeSounds.clear();
        
        console.log('✅ Sound Manager destroyed');
    },
    
    /**
     * Debug: Log current state to console
     */
    debugLog() {
        console.group('🔊 Sound Manager Debug Info');
        console.log('Enabled:', this.enabled);
        console.log('Muted:', this.muted);
        console.log('Master Volume:', this.masterVolume);
        console.log('Audio Context:', this.audioContext ? 'Active' : 'None');
        console.log('Cached Sounds:', Object.keys(this.audioCache).length);
        console.log('Load Statuses:', { ...this.loadStatus });
        console.log('Active Sounds Count:', this.activeSounds.size);
        console.groupEnd();
    }
};

// ============================================================
// CONVENIENCE ALIASES (Shortcuts for common operations)
// ============================================================

/**
 * Play authentication success sound
 */
Sound.loginSuccess = function() { return this.play('loginSuccess'); };

/**
 * Play authentication failure sound
 */
Sound.loginError = function() { return this.play('loginError'); };

/**
 * Play logout sound
 */
Sound.logoutSuccess = function() { return this.play('logoutSuccess'); };

/**
 * Play UI click sound
 */
Sound.click = function() { return this.play('click'); };

/**
 * Play operation success sound
 */
Sound.success = function() { return this.play('success'); };

/**
 * Play error sound
 */
Sound.error = function() { return this.play('error'); };

/**
 * Play warning sound
 */
Sound.warning = function() { return this.play('warning'); };

/**
 * Play scan sound
 */
Sound.scan = function() { return this.play('scan'); };

/**
 * Play notification sound
 */
Sound.notification = function() { return this.play('notification'); };

/**
 * Play refresh sound
 */
Sound.refresh = function() { return this.play('refresh'); };

/**
 * Play delete sound
 */
Sound.delete = function() { return this.play('delete'); };

/**
 * Play edit sound
 */
Sound.edit = function() { return this.play('edit'); };

/**
 * Play transfer sound
 */
Sound.transfer = function() { return this.play('transfer'); };

/**
 * Play collection sound
 */
Sound.collection = function() { return this.play('collection'); };

/**
 * Play achievement sound
 */
Sound.achievement = function() { return this.play('achievement'); };

// ============================================================
// EXPORT
// ============================================================

export { Sound, SoundConfig, SoundRegistry };
export default Sound;

// Make available globally for inline handlers and debugging
window.Sound = Sound;
