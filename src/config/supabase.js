/**
 * Supabase Configuration & Client Initialization
 * Handles database connection setup and configuration
 * @version 4.5.0
 */

// ============================================================
// CONFIGURATION CONSTANTS
// ============================================================
export const CONFIG = {
    // Supabase Connection
    SUPABASE_URL: 'https://bwcrdcudpnxkmcyyhzhe.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y3JkY3VkcG54a21jeXloemhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDQxNDEsImV4cCI6MjA5MDcyMDE0MX0.Yz19f5HAHfPt2MH-ky56Ccfwb5BAV1eN8PAdmuE1BTY',
    
    // Email Endpoint (Google Apps Script)
    EMAIL_ENDPOINT: 'https://script.google.com/macros/s/AKfycby5emGQI0R5T8sQls0oOSGL7PUa8AyK5Eya_gFIMo_qLu6ONCHxw0Ewt8Wo6h4N8O2d/exec',
    
    // Session Settings
    SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
    
    // Auto-refresh interval (5 minutes)
    AUTO_REFRESH_INTERVAL: 300000,
    
    // AI Configuration (prepared for future integration)
    AI_CONFIG: {
        // Set to true to enable AI features
        ENABLED: true,
        // AI endpoint URL (leave empty to use rules engine)
        ENDPOINT_URL: '',
        // API Key (leave empty for rules-only mode)
        API_KEY: '',
        // Model name (for OpenAI/Ollama)
        MODEL: '',
        // Maximum tokens for response
        MAX_TOKENS: 500
    },
    
    // Application Settings
    APP_NAME: 'Axentro System',
    APP_VERSION: '4.5.0',
    PASSWORD: 'admin123' // Default password (should be environment variable in production)
};

// ============================================================
// SUPABASE CLIENT INSTANCE
// ============================================================
let supabaseClient = null;

/**
 * Initialize Supabase client connection
 * @returns {boolean} Success status
 * @throws {Error} If initialization fails critically
 */
export function initSupabase() {
    try {
        if (!window.supabase) {
            console.error('❌ Supabase SDK not loaded');
            return false;
        }
        
        supabaseClient = window.supabase.createClient(
            CONFIG.SUPABASE_URL, 
            CONFIG.SUPABASE_KEY
        );
        
        console.log('✅ Supabase client initialized successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Supabase initialization error:', error.message);
        return false;
    }
}

/**
 * Get Supabase client instance
 * Must call initSupabase() first
 * @returns {Object} Supabase client instance
 * @throws {Error} If client not initialized
 */
export function getSupabase() {
    if (!supabaseClient) {
        throw new Error('Supabase client not initialized. Call initSupabase() first.');
    }
    return supabaseClient;
}

/**
 * Check if Supabase client is ready
 * @returns {boolean} Ready status
 */
export function isSupabaseReady() {
    return supabaseClient !== null;
}

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
export async function testConnection() {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase.from('merchants').select('count', { count: 'exact', head: true }).limit(1);
        return !error;
    } catch (error) {
        console.error('Connection test failed:', error.message);
        return false;
    }
}
