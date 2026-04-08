/**
 * Supabase Configuration & Client Initialization
 * Enhanced version with better error handling and security
 * @version 5.0.0
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
    
    // Request check interval (5 minutes)
    REQUEST_CHECK_INTERVAL: 300000,
    
    // AI Configuration (Hybrid System)
    AI_CONFIG: {
        ENABLED: true,
        ENDPOINT_URL: '', // Leave empty for rules-only mode
        API_KEY: '',      // Leave empty for rules-only mode
        MODEL: '',
        MAX_TOKENS: 500
    },
    
    // Application Settings
    APP_NAME: 'Axentro System',
    APP_VERSION: '5.0.0',
    
    // Reference Number Generation
    REFERENCE_PREFIX: {
        MERCHANT: 'MR',
        MACHINE: 'MC',
        TRANSFER: 'TR',
        COLLECTION: 'CL',
        REQUEST: 'RQ'
    },
    
    // Date/Time Format
    DATE_FORMAT: 'DD/MM/YYYY',
    TIME_FORMAT: 'hh:mm A' // 12-hour format with AM/PM
};

// ============================================================
// SUPABASE CLIENT INSTANCE (Singleton Pattern)
// ============================================================
let supabaseClient = null;

/**
 * Initialize Supabase client connection
 * @returns {boolean} Success status
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
        const { data, error } = await supabase
            .from('settings')
            .select('id')
            .limit(1);
        
        return !error;
    } catch (error) {
        console.error('Connection test failed:', error.message);
        return false;
    }
}

/**
 * Generate professional reference number
 * @param {string} prefix - Prefix for the reference (MR, MC, TR, CL, RQ)
 * @returns {string} Generated reference number
 */
export function generateReferenceNumber(prefix) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

/**
 * Format date to Arabic format (DD/MM/YYYY)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
    if (!date) return '-';
    
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
}

/**
 * Format time to 12-hour format with AM/PM
 * @param {Date|string} time - Time to format
 * @returns {string} Formatted time string (HH:MM AM/PM)
 */
export function formatTime(time) {
    if (!time) return '-';
    
    let d;
    if (typeof time === 'string') {
        // Handle both date strings and time strings
        if (time.includes('T') || time.includes('-')) {
            d = new Date(time);
        } else {
            // Assume it's a time string like "14:30"
            const [hours, minutes] = time.split(':');
            d = new Date();
            d.setHours(parseInt(hours), parseInt(minutes || 0));
        }
    } else {
        d = new Date(time);
    }
    
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    hours = String(hours).padStart(2, '0');
    
    return `${hours}:${minutes} ${ampm}`;
}

/**
 * Format money/currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatMoney(amount) {
    if (amount === null || amount === undefined) return '0.00';
    return parseFloat(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Normalize Arabic text for search/comparison
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
export function normalizeText(text) {
    if (!text) return '';
    return text
        .toString()
        .trim()
        .replace(/[إأآا]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(//g/g, 'غ')
        .toLowerCase();
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
