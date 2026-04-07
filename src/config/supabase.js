/**
 * Supabase Configuration & Client Initialization
 * Handles database connection setup and configuration
 */

// Configuration constants
export const CONFIG = {
    SUPABASE_URL: 'https://bwcrdcudpnxkmcyyhzhe.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y3JkY3VkcG54a21jeXloemhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDQxNDEsImV4cCI6MjA5MDcyMDE0MX0.Yz19f5HAHfPt2MH-ky56Ccfwb5BAV1eN8PAdmuE1BTY',
    EMAIL_ENDPOINT: 'https://script.google.com/macros/s/AKfycby5emGQI0R5T8sQls0oOSGL7PUa8AyK5Eya_gFIMo_qLu6ONCHxw0Ewt8Wo6h4N8O2d/exec',
    SESSION_DURATION: 24 * 60 * 60 * 1000,
    AUTO_REFRESH_INTERVAL: 300000,
};

let supabaseClient = null;

/**
 * Initialize Supabase client
 * @returns {boolean} Success status
 */
export function initSupabase() {
    try {
        supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
        console.log('✅ Supabase client initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Supabase initialization error:', error);
        return false;
    }
}

/**
 * Get Supabase client instance
 * @returns {Object} Supabase client
 */
export function getSupabase() {
    if (!supabaseClient) {
        throw new Error('Supabase client not initialized. Call initSupabase() first.');
    }
    return supabaseClient;
}
