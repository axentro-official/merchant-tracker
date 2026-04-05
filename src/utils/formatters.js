/**
 * Formatting Utilities
 * Number, date, and text formatting functions
 */

/**
 * Format date to Arabic locale
 * @param {string|Date} dateStr - Date input
 * @returns {string} Formatted date
 */
export function formatDate(dateStr) {
    if (!dateStr) return '-';
    
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('ar-EG', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (error) {
        return dateStr;
    }
}

/**
 * Format time with AM/PM badge
 * @param {string} timeStr - Time input
 * @returns {string} Formatted time HTML
 */
export function formatTime(timeStr) {
    if (!timeStr) return '-';
    
    try {
        // If already has AM/PM
        if (typeof timeStr === 'string' && 
            (timeStr.indexOf('AM') > -1 || timeStr.indexOf('PM') > -1)) {
            return `<span class="time-badge">${timeStr}</span>`;
        }
        
        // If has colon separator
        if (typeof timeStr === 'string' && timeStr.indexOf(':') > -1) {
            const parts = timeStr.split(':');
            let hours = parseInt(parts[0]) || 0;
            const minutes = parts[1] || '00';
            const seconds = parts[2] || '00';
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            
            return `<span class="time-badge">${String(hours).padStart(2,'0')}:${minutes}:${seconds} ${ampm}</span>`;
        }
        
        return `<span class="time-badge">${timeStr}</span>`;
    } catch (error) {
        return `<span class="time-badge">${timeStr}</span>`;
    }
}

/**
 * Format time for database storage
 * @param {Date} date - Date object
 * @returns {string} Time string
 */
export function formatTimeForDB(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: true 
    });
}

/**
 * Format number with Arabic locale
 * @param {number|string} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
    if (num === null || num === undefined || num === '') return '0';
    
    const n = typeof num === 'string' 
        ? parseFloat(num.replace(/[^\d.-]/g, '')) || 0 
        : Number(num);
    
    if (isNaN(n)) return '0';
    
    return n.toLocaleString('ar-EG', { maximumFractionDigits: 2 });
}

/**
 * Format money with currency
 * @param {number|string} num - Amount
 * @returns {string} Formatted money string with HTML
 */
export function formatMoney(num) {
    if (num === null || num === undefined || num === '') {
        return '0 <span class="currency">جنيه</span>';
    }
    
    const n = typeof num === 'string' 
        ? parseFloat(num.replace(/[^\d.-]/g, '')) || 0 
        : Number(num);
    
    if (isNaN(n)) {
        return '0 <span class="currency">جنيه</span>';
    }
    
    return Math.abs(n).toLocaleString('ar-EG', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    }) + ' <span class="currency">جنيه</span>';
}

/**
 * Normalize Arabic text for searching
 * @param {string} str - Text to normalize
 * @returns {string} Normalized text
 */
export function normalizeText(str) {
    return (str || '').toString()
        .trim()
        .replace(/[إأآا]/g, 'ا')
        .replace(/[ة]/g, 'ه')
        .replace(/[يى]/g, 'ي')
        .replace(/[\u0610-\u061A\u064B-\u065F\u0670]/g, '')
        .toLowerCase();
}

/**
 * Escape HTML special characters
 * @param {string} str - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(str) {
    if (!str) return '';
    
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
