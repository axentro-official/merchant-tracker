/**
 * Toast Notification System
 * Display temporary notification messages
 */

const TOAST_DURATION = 4000;
const REMOVING_CLASS_DELAY = 3500;

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type (success, error, warning)
 */
export function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    
    if (!container) {
        console.warn('Toast container not found');
        return;
    }
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.success}"></i> ${message}`;
    
    container.appendChild(toast);
    
    // Start removing animation
    setTimeout(() => {
        toast.classList.add('removing');
    }, REMOVING_CLASS_DELAY);
    
    // Remove from DOM
    setTimeout(() => {
        toast.remove();
    }, TOAST_DURATION);
}

/**
 * Show success toast
 * @param {string} message
 */
export function showSuccess(message) {
    showToast(message, 'success');
}

/**
 * Show error toast
 * @param {string} message
 */
export function showError(message) {
    showToast(message, 'error');
}

/**
 * Show warning toast
 * @param {string} message
 */
export function showWarning(message) {
    showToast(message, 'warning');
}
