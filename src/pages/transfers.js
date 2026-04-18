import { showToast, showConfirm } from '../ui/toast.js';
import { escapeHtml, formatMoney, formatDate, formatTime } from '../utils/formatters.js';

let supabase = null;
let currentTransfers = [];
let merchantsList = [];
let machinesList = [];
let listsLoaded = false;

export function initTransfersPage() {
  supabase = window.supabaseClient;
}

// =========================
// LOAD LISTS
// =========================
async function ensureLists() {
  if (listsLoaded) return;

  const [m1, m2] = await Promise.all([
    supabase.from('merchants').select('*').order('updated_at', { ascending: false }),
    supabase.from('machines').select('*').order('updated_at', { ascending: false })
  ]);

  if (m1.error) throw m1.error;
  if (m2.error) throw m2.error;

  merchantsList = m1.data || [];
  machinesList = m2.data || [];

  listsLoaded = true;
}

function merchantById(id) {
  return merchantsList.find(m => m.id === id);
}

// =========================
// NORMALIZE SEARCH (IMPORTANT)
// =========================
function normalizeArabic(text) {
  return String(text || '')
    .replace(/[أإآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim()
    .toLowerCase();
}

// =========================
// UI HELPERS
// =========================
function fillMerchantDatalist() {
  const dl = document.getElementById('merchantDatalistTrans');
  if (!dl) return;

  dl.innerHTML = merchantsList.map(m =>
    `<option value="${escapeHtml(m['رقم التاجر'])}">
      ${escapeHtml(m['رقم التاجر'])} - ${escapeHtml(m['اسم التاجر'])}
    </option>`
  ).join('');
}

// ✅ FIX: فلترة المكن حسب التاجر
function fillMachinesSelect(merchantId = '') {
  const el = document.getElementById('transMachineId');
  if (!el) return;

  const filtered = merchantId
    ? machinesList.filter(m => m['رقم التاجر'] === merchantId)
    : machinesList;

  el.innerHTML =
    '<option value="">بدون مكنة</option>' +
    filtered.map(m =>
      `<option value="${escapeHtml(m['رقم المكنة'])}">
        ${escapeHtml(m['رقم المكنة'])}
      </option>`
    ).join('');
}

// =========================
// SEARCH (FIXED)
// =========================
function attachSearch() {
  const s = document.getElementById('transMerchantSearch');
  const h = document.getElementById('transMerchantId');
  if (!s || !h) return;

  const resolve = () => {
    const val = s.value;
    const norm = normalizeArabic(val);

    const m = merchantsList.find(x => {
      const code = String(x['رقم التاجر'] || '');
      const name = String(x['اسم التاجر'] || '');
      const full = `${code} - ${name}`;

      return (
        code === val ||
        full === val ||
        normalizeArabic(code) === norm ||
        normalizeArabic(name).includes(norm) ||
        normalizeArabic(full).includes(norm)
      );
    });

    h.value = m?.id || '';
    fillMachinesSelect(m?.id || '');
  };

  s.oninput = resolve;
  s.onchange = resolve;
}

// =========================
// LOAD
// =========================
export async function loadTransfers() {
  supabase = supabase || window.supabaseClient;
  if (!supabase) return;

  try {
    const { data, error } = await supabase
      .from('transfers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    currentTransfers = data || [];

    await ensureLists();

    renderTransfersTable();
  } catch (err) {
    console.error(err);
    showToast('خطأ في تحميل التحويلات', 'error');
  }
}

// =========================
// RENDER
// =========================
function renderTransfersTable() {
  const tbody = document.getElementById('transfersTableBody');
  if (!tbody) return;

  if (!currentTransfers.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="empty-state">لا توجد تحويلات</td></tr>`;
    return;
  }

  tbody.innerHTML = currentTransfers.map((t, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><code class="ref-code">${escapeHtml(t['الرقم المرجعي'] || '-')}</code></td>
      <td>${formatDate(t['التاريخ'])}</td>
      <td>${escapeHtml(t['اسم التاجر'] || '-')}</td>
      <td>${escapeHtml(t['اسم النشاط'] || '-')}</td>
      <td>${escapeHtml(t['رقم المكنة'] || '-')}</td>
      <td>${formatMoney(t['قيمة التحويل'] || 0)}</td>
      <td>${escapeHtml(t['نوع التحويل'] || '-')}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-primary btn-sm" onclick="window.editTransfer('${t.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="window.deleteTransfer('${t.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// =========================
// SAVE
// =========================
function getNowDateTime() {
  const now = new Date();
  return {
    date: now.toISOString().split('T')[0],
    time: now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  };
}

export async function saveTransfer() {
  const id = document.getElementById('editTransferId').value;
  const merchant = merchantById(document.getElementById('transMerchantId').value);

  if (!merchant) return showToast('يرجى اختيار التاجر', 'warning');

  const amount = parseFloat(document.getElementById('transAmount').value || '0');
  if (!(amount > 0)) return showToast('المبلغ غير صحيح', 'warning');

  const { date, time } = getNowDateTime();

  const payload = {
    'رقم التاجر': merchant.id,
    'اسم التاجر': merchant['اسم التاجر'],
    'اسم النشاط': merchant['اسم النشاط'] || '',
    'رقم الحساب': merchant['رقم الحساب'] || '',
    'رقم المكنة': document.getElementById('transMachineId').value || null,
    'قيمة التحويل': amount,
    'نوع التحويل': document.getElementById('transType').value || 'نقدي',
    'ملاحظات': document.getElementById('transNotes').value.trim(),
    'التاريخ': date,
    'الوقت': time
  };

  try {
    const q = id
      ? supabase.from('transfers').update(payload).eq('id', id)
      : supabase.from('transfers').insert([payload]);

    const { error } = await q;
    if (error) throw error;

    showToast(id ? 'تم التعديل' : 'تم الإضافة', 'success');

    closeTransferModal();
    await loadTransfers();
    window.loadDashboardStats?.();
    window.loadRecentActivities?.();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'فشل الحفظ', 'error');
  }
}

// =========================
// MODAL
// =========================
export async function openTransferModal(transfer = null) {
  await ensureLists();

  fillMerchantDatalist();
  attachSearch();

  document.getElementById('editTransferId').value = transfer?.id || '';
  document.getElementById('transMerchantId').value = transfer?.['رقم التاجر'] || '';

  const merchant = merchantById(transfer?.['رقم التاجر']);
  document.getElementById('transMerchantSearch').value = merchant?.['رقم التاجر'] || '';

  fillMachinesSelect(transfer?.['رقم التاجر'] || '');

  document.getElementById('transMachineId').value = transfer?.['رقم المكنة'] || '';
  document.getElementById('transAmount').value = transfer?.['قيمة التحويل'] || '';
  document.getElementById('transType').value = transfer?.['نوع التحويل'] || 'نقدي';
  document.getElementById('transNotes').value = transfer?.['ملاحظات'] || '';

  document.getElementById('transferModal').classList.add('show');
}

export function closeTransferModal() {
  document.getElementById('transferModal')?.classList.remove('show');
}

window.openTransferModal = openTransferModal;
window.closeTransferModal = closeTransferModal;
window.saveTransfer = saveTransfer;
window.editTransfer = id => {
  const item = currentTransfers.find(t => t.id === id);
  if (item) openTransferModal(item);
};
window.deleteTransfer = id => {
  showConfirm('حذف؟', async () => {
    await supabase.from('transfers').delete().eq('id', id);
    await loadTransfers();
  });
};
