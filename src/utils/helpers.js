/**
 * Helper Utilities
 * General purpose helper functions
 */

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Generate unique reference code
 * @param {string} prefix - Code prefix (TRF, COL, etc.)
 * @returns {string} Reference code
 */
export function generateRefCode(prefix) {
    const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomPart = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `${prefix}-${datePart}-${randomPart}`;
}

/**
 * Get current month in Arabic
 * @returns {string} Month name
 */
export function getCurrentArabicMonth() {
    return new Date().toLocaleString('ar-EG', { 
        month: 'long', 
        year: 'numeric' 
    });
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
export function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Shake element animation (for validation feedback)
 * @param {HTMLElement} el - Element to shake
 */
export function shakeElement(el) {
    if (!el) return;
    
    el.style.animation = 'shake 0.5s ease';
    setTimeout(() => {
        el.style.animation = '';
    }, 500);
}

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if value is empty
 * @param {*} value - Value to check
 * @returns {boolean}
 */
export function isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return !value.trim();
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}
