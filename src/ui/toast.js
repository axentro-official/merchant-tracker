// src/ui/toast.js
const TOAST_DURATION = 2500;
const REMOVING_CLASS_DELAY = 2000;
let confirmCallback = null;

export function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
  const toast = document.createElement('div');
  const icon = document.createElement('i');
  const textNode = document.createElement('span');

  toast.className = `toast ${type}`;
  icon.className = `fas ${icons[type] || icons.info}`;
  textNode.textContent = String(message ?? '');

  toast.appendChild(icon);
  toast.appendChild(document.createTextNode(' '));
  toast.appendChild(textNode);
  container.appendChild(toast);

  setTimeout(() => toast.classList.add('removing'), REMOVING_CLASS_DELAY);
  setTimeout(() => toast.remove(), TOAST_DURATION);
}

export function showConfirm(message, onConfirm, confirmText = 'تأكيد') {
  const modal = document.getElementById('confirmModal');
  const messageEl = document.getElementById('confirmMessage');
  const confirmBtn = document.getElementById('confirmOkBtn');
  const cancelBtn = document.getElementById('confirmCancelBtn');

  if (!modal || !messageEl || !confirmBtn || !cancelBtn) {
    if (window.confirm(message)) onConfirm?.();
    return;
  }

  messageEl.textContent = message;
  confirmBtn.textContent = confirmText;
  confirmCallback = onConfirm;
  modal.classList.add('show');

  const newConfirmBtn = confirmBtn.cloneNode(true);
  const newCancelBtn = cancelBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

  newConfirmBtn.addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    closeConfirm();
  });

  newCancelBtn.addEventListener('click', closeConfirm);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeConfirm(); }, { once: true });
}

function closeConfirm() {
  const modal = document.getElementById('confirmModal');
  if (modal) modal.classList.remove('show');
  confirmCallback = null;
}

export const showSuccess = (msg) => showToast(msg, 'success');
export const showError = (msg) => showToast(msg, 'error');
export const showWarning = (msg) => showToast(msg, 'warning');
export const showInfo = (msg) => showToast(msg, 'info');
