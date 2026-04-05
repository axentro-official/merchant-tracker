/**
 * Modal Management
 * Handle all modal operations (show, close, confirm dialogs)
 */

let confirmCallback = null;

/**
 * Show main modal with content
 * @param {string} content - HTML content
 */
export function showModal(content) {
    const modalBody = document.getElementById('modalBodyContent');
    const modal = document.getElementById('mainModal');
    
    modalBody.innerHTML = content;
    modal.style.display = 'flex';
    
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

/**
 * Close main modal
 */
export function closeMainModal() {
    const modal = document.getElementById('mainModal');
    
    modal.classList.remove('show');
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @param {Function} callback - Callback on confirm
 * @param {string} btnText - Button text
 * @param {string} iconType - Icon type (question, warning, danger)
 */
export function showConfirm(message, callback, btnText = 'تأكيد', iconType = 'question') {
    const icons = {
        question: 'fa-question-circle',
        warning: 'fa-exclamation-triangle',
        danger: 'fa-times-circle'
    };
    
    const colors = {
        question: 'var(--warning)',
        warning: 'var(--warning)',
        danger: 'var(--danger)'
    };
    
    document.getElementById('confirmIcon').innerHTML = 
        `<i class="fas ${icons[iconType]}"></i>`;
    document.getElementById('confirmIcon').style.background = `${colors[iconType]}20`;
    document.getElementById('confirmIcon').style.color = colors[iconType];
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmBtn').textContent = btnText;
    
    confirmCallback = callback;
    
    const modal = document.getElementById('confirmModal');
    modal.style.display = 'flex';
    
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

/**
 * Close confirmation modal
 */
export function closeConfirm() {
    const modal = document.getElementById('confirmModal');
    
    modal.classList.remove('show');
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    
    confirmCallback = null;
}

/**
 * Handle confirm button click
 */
export function handleConfirmClick() {
    if (confirmCallback) {
        confirmCallback();
    }
    closeConfirm();
}

/**
 * Initialize modal event listeners
 */
export function initModals() {
    // Confirm button click
    document.getElementById('confirmBtn')?.addEventListener('click', handleConfirmClick);
    
    // Cancel button click
    document.getElementById('cancelConfirmBtn')?.addEventListener('click', closeConfirm);
    
    // Main modal close button
    document.getElementById('closeMainModalBtn')?.addEventListener('click', closeMainModal);
    
    // Scanner modals
    document.getElementById('closeScannerBtn')?.addEventListener('click', closeScanner);
    document.getElementById('closeScannerBtn2')?.addEventListener('click', closeScanner);
}

/**
 * Show scanner modal
 * @param {Function} onOpen - Callback when scanner opens
 */
export function openScanner(onOpen) {
    const modal = document.getElementById('scannerModal');
    modal.style.display = 'flex';
    
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    document.getElementById('scanResult').style.display = 'none';
    
    if (onOpen) onOpen();
}

/**
 * Close scanner modal
 */
export function closeScanner() {
    const modal = document.getElementById('scannerModal');
    
    modal.classList.remove('show');
    
    setTimeout(() => {
        modal.style.display = 'none';
        stopScannerStream();
    }, 300);
}

/**
 * Stop scanner camera stream
 */
function stopScannerStream() {
    // Will be implemented with camera service
    if (window.scannerStream) {
        window.scannerStream.getTracks().forEach(track => track.stop());
        window.scannerStream = null;
    }
    
    const video = document.getElementById('scannerVideo');
    if (video) video.srcObject = null;
}
