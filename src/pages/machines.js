import { showToast, showConfirm } from '../ui/toast.js';
import { escapeHtml, formatMoney } from '../utils/formatters.js';

let supabase = null;
let currentMachines = [];
let merchantsList = [];

export function initMachinesPage() {
  supabase = window.supabaseClient;
}

function normalizeArabic(text) {
  return String(text || '')
    .replace(/[أإآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim()
    .toLowerCase();
}

// =====================
// تحميل التجار
// =====================
async function ensureMerchants() {
  if (merchantsList.length) return;

  const { data, error } = await supabase
    .from('merchants')
    .select('*');

  if (error) throw error;

  merchantsList = (data || []).sort((a, b) =>
    (parseInt(a['رقم التاجر']) || 0) - (parseInt(b['رقم التاجر']) || 0)
  );
}

// =====================
// توليد رقم مكنة
// =====================
async function generateMachineCode() {
  const { data } = await supabase.from('machines').select('رقم المكنة');

  const nums = (data || [])
    .map(m => parseInt(m['رقم المكنة']))
    .filter(n => !isNaN(n));

  const next = nums.length ? Math.max(...nums) + 1 : 1;

  return String(next).padStart(5, '0');
}

// =====================
// البحث
// =====================
function fillMerchantDatalist() {
  const dl = document.getElementById('merchantDatalist');
  if (!dl) return;

  dl.innerHTML = merchantsList.map(m =>
    `<option value="${escapeHtml(m['رقم التاجر'])}">
      ${escapeHtml(m['رقم التاجر'])} - ${escapeHtml(m['اسم التاجر'])}
    </option>`
  ).join('');
}

function attachMerchantSearch() {
  const search = document.getElementById('machMerchantSearch');
  const hidden = document.getElementById('machMerchantId');

  if (!search || !hidden) return;

  const resolve = () => {
    const val = search.value;
    const normalized = normalizeArabic(val);

    const merchant = merchantsList.find(m => {
      const code = String(m['رقم التاجر']);
      const name = String(m['اسم التاجر']);
      const full = `${code} - ${name}`;

      return (
        code === val ||
        full === val ||
        normalizeArabic(code) === normalized ||
        normalizeArabic(name).includes(normalized)
      );
    });

    hidden.value = merchant?.id || '';
  };

  search.oninput = resolve;
  search.onchange = resolve;
}

// =====================
// تحميل المكن
// =====================
export async function loadMachines() {
  supabase = supabase || window.supabaseClient;
  if (!supabase) return;

  try {
    const { data, error } = await supabase.from('machines').select('*');

    if (error) throw error;

    currentMachines = (data || []).sort((a, b) =>
      (parseInt(a['رقم المكنة']) || 0) - (parseInt(b['رقم المكنة']) || 0)
    );

    await ensureMerchants();
    renderMachinesTable();
  } catch (err) {
    console.error(err);
    showToast('خطأ في تحميل المكن', 'error');
  }
}

// =====================
// عرض الجدول
// =====================
function renderMachinesTable() {
  const tbody = document.getElementById('machinesTableBody');
  if (!tbody) return;

  if (!currentMachines.length) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="empty-state">لا توجد مكن</td></tr>';
    return;
  }

  tbody.innerHTML = currentMachines.map((m, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><code class="ref-code">${escapeHtml(m['رقم المكنة'] || '-')}</code></td>
      <td>${escapeHtml(m['اسم التاجر'] || '-')}</td>
      <td>${escapeHtml(m['اسم النشاط'] || '-')}</td>
      <td dir="ltr">${escapeHtml(m['الرقم التسلسلي'] || '-')}</td>
      <td>${formatMoney(m['التارجت الشهري'] || 0)}</td>
      <td>${escapeHtml(m['الحالة'] || '-')}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-primary btn-sm" onclick="window.editMachine('${m.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="window.deleteMachine('${m.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// =====================
// مودال
// =====================
export async function openMachineModal(machine = null) {
  await ensureMerchants();
  fillMerchantDatalist();
  attachMerchantSearch();

  document.getElementById('machineModalTitle').innerHTML =
    machine
      ? '<i class="fas fa-edit"></i> تعديل مكنة'
      : '<i class="fas fa-plus-circle"></i> إضافة مكنة جديدة';

  document.getElementById('editMachineId').value = machine?.id || '';
  document.getElementById('machSerial').value = machine?.['الرقم التسلسلي'] || '';
  document.getElementById('machTarget').value = machine?.['التارجت الشهري'] || '';
  document.getElementById('machStatus').value = machine?.['الحالة'] || 'نشطة';
  document.getElementById('machNotes').value = machine?.['ملاحظات'] || '';

  const merchant = merchantsList.find(m => m.id === machine?.['رقم التاجر']);

  document.getElementById('machMerchantSearch').value =
    merchant ? merchant['رقم التاجر'] : '';

  document.getElementById('machMerchantId').value = merchant?.id || '';

  document.getElementById('machineModal').classList.add('show');
}

export function closeMachineModal() {
  document.getElementById('machineModal')?.classList.remove('show');
}

// =====================
// حفظ
// =====================
export async function saveMachine() {
  supabase = supabase || window.supabaseClient;
  await ensureMerchants();

  const id = document.getElementById('editMachineId').value;
  const merchantId = document.getElementById('machMerchantId').value;

  const merchant = merchantsList.find(m => m.id === merchantId);

  if (!merchant)
    return showToast('يرجى اختيار التاجر', 'warning');

  const serial = document.getElementById('machSerial').value.trim();
  if (!serial)
    return showToast('الرقم التسلسلي مطلوب', 'warning');

  const payload = {
    'رقم التاجر': merchant.id,
    'اسم التاجر': merchant['اسم التاجر'],
    'اسم النشاط': merchant['اسم النشاط'] || 'غير محدد',
    'رقم الحساب': merchant['رقم الحساب'] || '',
    'الرقم التسلسلي': serial,
    'التارجت الشهري': parseFloat(document.getElementById('machTarget').value || '0') || 0,
    'الحالة': document.getElementById('machStatus').value || 'نشطة',
    'ملاحظات': document.getElementById('machNotes').value.trim()
  };

  try {
    // توليد رقم مكنة
    if (!id) {
      payload['رقم المكنة'] = await generateMachineCode();
    }

    const query = id
      ? supabase.from('machines').update(payload).eq('id', id)
      : supabase.from('machines').insert([payload]);

    const { error } = await query;
    if (error) throw error;

    showToast(id ? 'تم تحديث المكنة' : 'تم إضافة المكنة', 'success');

    closeMachineModal();

    await loadMachines();

    // تحديث كل شيء مهم
    window.loadDashboardStats?.();
    window.loadTopMachines?.();

  } catch (err) {
    console.error(err);
    showToast(err.message || 'فشل حفظ المكنة', 'error');
  }
}

// =====================
// تعديل
// =====================
export function editMachine(id) {
  const machine = currentMachines.find(m => m.id === id);
  if (machine) openMachineModal(machine);
}

// =====================
// حذف
// =====================
export function deleteMachine(id) {
  showConfirm('هل تريد حذف هذه المكنة؟', async () => {
    const { error } = await supabase.from('machines').delete().eq('id', id);

    if (error)
      return showToast(error.message, 'error');

    showToast('تم حذف المكنة', 'success');

    await loadMachines();

    window.loadDashboardStats?.();
    window.loadTopMachines?.();
  });
}

// =====================
window.openMachineModal = openMachineModal;
window.closeMachineModal = closeMachineModal;
window.saveMachine = saveMachine;
window.editMachine = editMachine;
window.deleteMachine = deleteMachine;
