/**
 * Sound Manager System
 * Handles all audio playback with proper error handling
 * and autoplay restriction management
 * @version 1.0.0
 */

// ============================================================
// SOUND CONFIGURATION
// ============================================================

const SOUND_MAP = {
    'loginSuccess': 'soundLoginSuccess',
    'loginError': 'soundLoginError',
    'logoutSuccess': 'soundLogoutSuccess',
    'done': 'soundDone',
    'scan': 'soundScan'
};

// Track if user has interacted with page (needed for autoplay)
let userHasInteracted = false;

// Cache for preloaded sounds
const soundCache = new Map();

// ============================================================
// INITIALIZATION
// ============================================================

/**
 * Initialize sound manager
 * Sets up event listeners for user interaction tracking
 */
export function initSoundManager() {
    // Track first user interaction to enable audio
    const enableAudio = () => {
        if (!userHasInteracted) {
            userHasInteracted = true;
            console.log('🔊 Audio enabled after user interaction');
            
            // Preload all sounds
            preloadSounds();
        }
    };
    
    // Listen for various user interactions
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
        document.addEventListener(event, enableAudio, { once: true });
    });
    
    console.log('✅ Sound manager initialized');
}

/**
 * Preload all sound files into cache
 */
function preloadSounds() {
    Object.entries(SOUND_MAP).forEach(([name, elementId]) => {
        const audio = document.getElementById(elementId);
        if (audio) {
            soundCache.set(name, audio);
            audio.load(); // Preload the audio file
        } else {
            console.warn(`⚠️ Sound element not found: ${elementId}`);
        }
    });
}

// ============================================================
// SOUND PLAYBACK
// ============================================================

/**
 * Play a sound effect
 * @param {string} soundName - Sound identifier (loginSuccess, loginError, logoutSuccess, done, scan)
 * @param {Object} options - Playback options
 * @param {number} options.volume - Volume level (0-1), default 1
 * @param {boolean} options.forcePlay - Force play even without interaction
 * @returns {Promise<boolean>} Whether sound played successfully
 */
export async function playSound(soundName, options = {}) {
    const { volume = 1, forcePlay = false } = options;
    
    try {
        // Validate sound name
        const audioId = SOUND_MAP[soundName];
        if (!audioId) {
            console.warn(`⚠️ Sound not found: ${soundName}`);
            return false;
        }
        
        // Get audio element
        let audio = soundCache.get(soundName);
        if (!audio) {
            audio = document.getElementById(audioId);
            if (!audio) {
                console.warn(`⚠️ Audio element not found: ${audioId}`);
                return false;
            }
            soundCache.set(soundName, audio);
        }
        
        // Check autoplay restrictions
        if (!userHasInteracted && !forcePlay) {
            console.log(`🔇 Sound blocked (no user interaction): ${soundName}`);
            return false;
        }
        
        // Reset and configure audio
        audio.currentTime = 0;
        audio.volume = Math.max(0, Math.min(1, volume)); // Clamp volume
        
        // Attempt playback
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            await playPromise;
            console.log(`🔊 Playing: ${soundName}`);
            return true;
        }
        
        return true;
        
    } catch (error) {
        // Handle autoplay restrictions gracefully
        if (error.name === 'NotAllowedError') {
            console.log(`🔇 Autoplay blocked for: ${soundName}`);
        } else {
            console.error(`❌ Error playing sound "${soundName}":`, error.message);
        }
        return false;
    }
}

/**
 * Play sound with forced playback (bypasses interaction check)
 * Use sparingly - only for critical feedback
 * @param {string} soundName - Sound identifier
 * @returns {Promise<boolean>}
 */
export function playSoundForce(soundName) {
    return playSound(soundName, { forcePlay: true });
}

/**
 * Check if audio is enabled
 * @returns {boolean}
 */
export function isAudioEnabled() {
    return userHasInteracted;
}

/**
 * Get list of available sounds
 * @returns {string[]}
 */
export function getAvailableSounds() {
    return Object.keys(SOUND_MAP);
}

// Initialize on import
initSoundManager();
