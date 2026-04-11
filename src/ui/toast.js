// src/ui/toast.js
/**
 * Toast Notification System & Confirm Modal
 */

const TOAST_DURATION = 2500;
const REMOVING_CLASS_DELAY = 2000;

let confirmCallback = null;

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type (success, error, warning, info)
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
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.success}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('removing');
    }, REMOVING_CLASS_DELAY);
    
    setTimeout(() => {
        toast.remove();
    }, TOAST_DURATION);
}

/**
 * Show confirmation dialog using the existing confirmModal in index.html
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback when confirmed
 * @param {string} confirmText - Button text (optional)
 */
export function showConfirm(message, onConfirm, confirmText = 'تأكيد') {
    const modal = document.getElementById('confirmModal');
    const messageEl = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('confirmOkBtn');
    const cancelBtn = document.getElementById('confirmCancelBtn');
    
    if (!modal || !messageEl || !confirmBtn || !cancelBtn) {
        console.error('Confirm modal elements not found');
        // Fallback to native confirm
        if (confirm(message)) {
            onConfirm();
        }
        return;
    }
    
    messageEl.textContent = message;
    confirmBtn.textContent = confirmText;
    
    // Store callback
    confirmCallback = onConfirm;
    
    // Show modal
    modal.classList.add('show');
    
    // Remove existing listeners to avoid duplicates
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    newConfirmBtn.addEventListener('click', () => {
        if (confirmCallback) confirmCallback();
        closeConfirm();
    });
    
    newCancelBtn.addEventListener('click', closeConfirm);
    
    // Also close on overlay click? optional
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeConfirm();
    }, { once: true });
}

function closeConfirm() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.classList.remove('show');
    confirmCallback = null;
}

// Export convenience methods
export const showSuccess = (msg) => showToast(msg, 'success');
export const showError = (msg) => showToast(msg, 'error');
export const showWarning = (msg) => showToast(msg, 'warning');
export const showInfo = (msg) => showToast(msg, 'info');
