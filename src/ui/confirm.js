// src/ui/confirm.js
/**
 * Custom Confirm Modal - متوافق مع index.html
 */

let pendingConfirmCallback = null;

/**
 * إظهار نافذة تأكيد مخصصة
 * @param {string} message - رسالة التأكيد
 * @param {Function} onConfirm - دالة تُنفذ عند الضغط على تأكيد
 * @param {string} confirmText - نص زر التأكيد (اختياري)
 */
export function showConfirm(message, onConfirm, confirmText = 'تأكيد') {
    const modal = document.getElementById('confirmModal');
    const msgEl = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('confirmOkBtn');
    
    if (!modal || !msgEl || !confirmBtn) {
        // Fallback: استخدام confirm() العادية إذا لم توجد العناصر
        if (confirm(message)) {
            onConfirm();
        }
        return;
    }
    
    msgEl.textContent = message;
    confirmBtn.textContent = confirmText;
    pendingConfirmCallback = onConfirm;
    modal.classList.add('show');
}

/**
 * إغلاق نافذة التأكيد (تُستدعى من الأزرار)
 */
export function closeConfirm() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.classList.remove('show');
    pendingConfirmCallback = null;
}

/**
 * تأكيد الإجراء (تُستدعى من زر التأكيد)
 */
export function confirmAction() {
    if (pendingConfirmCallback) {
        pendingConfirmCallback();
    }
    closeConfirm();
}

// ربط الدوال بالنافذة العامة لاستخدامها من أزرار HTML
window.closeConfirm = closeConfirm;
window.confirmAction = confirmAction;

// إذا كان index.html يحتوي على أزرار confirmModal بمعرفات مختلفة، نربطها
document.addEventListener('DOMContentLoaded', () => {
    const okBtn = document.getElementById('confirmOkBtn');
    const cancelBtn = document.getElementById('confirmCancelBtn');
    if (okBtn) okBtn.onclick = confirmAction;
    if (cancelBtn) cancelBtn.onclick = closeConfirm;
});
