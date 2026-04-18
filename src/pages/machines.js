import { showToast, showConfirm } from '../ui/toast.js';
import { escapeHtml, formatMoney, normalizeText } from '../utils/formatters.js';

let supabase = null;
let currentMachines = [];
let merchantsList = [];
let isSavingMachine = false;

export function initMachinesPage() {
  supabase = window.supabaseClient;
}

function extractSequence(code) {
  const match = String(code || '').match(/(\d+)(?!.*\d)/);
  return match ? parseInt(match[1], 10) : 0;
}

async function ensureMerchants(force = false) {
  if (merchantsList.length && !force) return;

  const { data, error } = await supabase.from('merchants').select('*');
  if (error) throw error;

  merchantsList = [...(data || [])].sort((a, b) => extractSequence(a['رقم التاجر']) - extractSequence(b['رقم التاجر']));
}

function merchantLabel(merchant) {
  return `${merchant['رقم التاجر']} - ${merchant['اسم التاجر']} (${merchant['اسم النشاط'] || 'غير محدد'})`;
}

function fillMerchantDatalist() {
  const dl = document.getElementById('merchantDatalist');
  if (!dl) return;

  dl.innerHTML = merchantsList.map(m => `<option value="${escapeHtml(merchantLabel(m))}"></option>`).join('');
}

function resolveMerchant(inputValue) {
  const raw = String(inputValue || '').trim();
  const normalized = normalizeText(raw);

  return merchantsList.find(m => {
    const code = String(m['رقم التاجر'] || '');
    const name = String(m['اسم التاجر'] || '');
    const activity = String(m['اسم النشاط'] || '');
    const label = merchantLabel(m);
    return (
      code === raw ||
      label === raw ||
      normalizeText(code) === normalized ||
      normalizeText(name).includes(normalized) ||
      normalizeText(activity).includes(normalized) ||
      normalizeText(label).includes(normalized)
    );
  }) || null;
}

function attachMerchantSearch() {
  const search = document.getElementById('machMerchantSearch');
  const hidden = document.getElementById('machMerchantId');
  if (!search || !hidden) return;

  const resolve = () => {
    const merchant = resolveMerchant(search.value);
    hidden.value = merchant?.id || '';
    if (merchant) {
      search.value = merchantLabel(merchant);
    }
  };

  search.oninput = () => {
    const merchant = resolveMerchant(search.value);
    hidden.value = merchant?.id || '';
  };
  search.onchange = resolve;
}

export async function loadMachines() {
  supabase = supabase || window.supabaseClient;
  if (!supabase) return;

  try {
    const { data, error } = await supabase.from('machines').select('*');
    if (error) throw error;

    currentMachines = [...(data || [])].sort((a, b) => extractSequence(a['رقم المكنة']) - extractSequence(b['رقم المكنة']));
    await ensureMerchants(true);
    renderMachinesTable();
  } catch (err) {
    console.error(err);
    showToast('خطأ في تحميل المكن', 'error');
  }
}

function renderMachinesTable() {
  const tbody = document.getElementById('machinesTableBody');
  if (!tbody) return;

  if (!currentMachines.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">لا توجد مكن</td></tr>';
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
          <button class="btn btn-primary btn-sm" onclick="window.editMachine('${m.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger btn-sm" onclick="window.deleteMachine('${m.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function clearMachineForm() {
  document.getElementById('editMachineId').value = '';
  document.getElementById('machMerchantSearch').value = '';
  document.getElementById('machMerchantId').value = '';
  document.getElementById('machSerial').value = '';
  document.getElementById('machTarget').value = '';
  document.getElementById('machStatus').value = 'نشطة';
  document.getElementById('machNotes').value = '';
}

export async function openMachineModal(machine = null) {
  await ensureMerchants(true);
  fillMerchantDatalist();
  attachMerchantSearch();

  document.getElementById('machineModalTitle').innerHTML = machine
    ? '<i class="fas fa-edit"></i> تعديل مكنة'
    : '<i class="fas fa-plus-circle"></i> إضافة مكنة جديدة';

  if (!machine) clearMachineForm();

  document.getElementById('editMachineId').value = machine?.id || '';
  document.getElementById('machSerial').value = machine?.['الرقم التسلسلي'] || '';
  document.getElementById('machTarget').value = machine?.['التارجت الشهري'] || '';
  document.getElementById('machStatus').value = machine?.['الحالة'] || 'نشطة';
  document.getElementById('machNotes').value = machine?.['ملاحظات'] || '';

  const merchant = merchantsList.find(m => m.id === machine?.['رقم التاجر']);
  document.getElementById('machMerchantSearch').value = merchant ? merchantLabel(merchant) : '';
  document.getElementById('machMerchantId').value = merchant?.id || '';

  document.getElementById('machineModal').classList.add('show');
}

export function closeMachineModal() {
  document.getElementById('machineModal')?.classList.remove('show');
  clearMachineForm();
}

export async function saveMachine() {
  if (isSavingMachine) return;
  isSavingMachine = true;

  try {
    supabase = supabase || window.supabaseClient;
    await ensureMerchants(true);

    const id = document.getElementById('editMachineId').value;
    const merchantId = document.getElementById('machMerchantId').value;
    const merchant = merchantsList.find(m => m.id === merchantId);

    if (!merchant) return showToast('يرجى اختيار التاجر من القائمة', 'warning');

    const serial = document.getElementById('machSerial').value.trim();
    if (!serial) return showToast('الرقم التسلسلي مطلوب', 'warning');

    const duplicateSerial = currentMachines.find(m => m['الرقم التسلسلي'] === serial && m.id !== id);
    if (duplicateSerial) return showToast('الرقم التسلسلي مستخدم بالفعل', 'warning');

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

    const query = id
      ? supabase.from('machines').update(payload).eq('id', id)
      : supabase.from('machines').insert([payload]);

    const { error } = await query;
    if (error) throw error;

    showToast(id ? 'تم تحديث المكنة' : 'تم إضافة المكنة', 'success');
    closeMachineModal();
    await loadMachines();
    window.loadDashboardStats?.();
    window.loadTopMachines?.();
    window.populateMerchantDatalists?.();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'فشل حفظ المكنة', 'error');
  } finally {
    isSavingMachine = false;
  }
}

export function editMachine(id) {
  const machine = currentMachines.find(m => m.id === id);
  if (machine) openMachineModal(machine);
}

export function deleteMachine(id) {
  showConfirm('هل تريد حذف هذه المكنة؟', async () => {
    try {
      const { error } = await supabase.from('machines').delete().eq('id', id);
      if (error) throw error;

      showToast('تم حذف المكنة', 'success');
      await loadMachines();
      window.loadDashboardStats?.();
      window.loadTopMachines?.();
    } catch (err) {
      showToast(err.message || 'فشل حذف المكنة', 'error');
    }
  });
}

window.openMachineModal = openMachineModal;
window.closeMachineModal = closeMachineModal;
window.saveMachine = saveMachine;
window.editMachine = editMachine;
window.deleteMachine = deleteMachine;
