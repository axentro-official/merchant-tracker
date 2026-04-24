import { showToast, showConfirm } from '../ui/toast.js';
import { escapeHtml, formatMoney } from '../utils/formatters.js';
import { buildMerchantLabel, filterMerchants, generateNextCode, safeMutateRecord, sortMerchantsByCode, sortMachinesByCode } from '../services/referenceService.js';

let supabase = null;
let currentMachines = [];
let merchantsList = [];
let filteredMerchants = [];
let isSavingMachine = false;

export function initMachinesPage() {
  supabase = window.supabaseClient;
}

function normalizeMachineStatus(value) {
  const raw = String(value || '').trim();
  const map = { 'نشطة': 'نشط', 'نشط': 'نشط', 'غير نشطة': 'غير نشط', 'غير نشط': 'غير نشط', 'صيانة': 'صيانة' };
  return map[raw] || 'نشط';
}

function extractSequence(code) {
  const match = String(code || '').match(/(\d+)(?!.*\d)/);
  return match ? parseInt(match[1], 10) : 0;
}

async function ensureMerchants(force = false) {
  if (merchantsList.length && !force) return;
  const { data, error } = await supabase.from('merchants').select('*');
  if (error) throw error;
  merchantsList = sortMerchantsByCode(data || []);
  filteredMerchants = [...merchantsList];
}

function renderMerchantSelect() {
  const select = document.getElementById('machMerchantSelect');
  if (!select) return;
  select.innerHTML = '<option value="">اختر التاجر يدوياً...</option>' + filteredMerchants.map(merchant => (
    `<option value="${escapeHtml(merchant.id)}">${escapeHtml(buildMerchantLabel(merchant))}</option>`
  )).join('');
}

function renderMerchantQuickResults(items) {
  const container = document.getElementById('machMerchantResults');
  if (!container) return;
  if (!items.length) {
    container.innerHTML = '<div class="merchant-result-item muted">لا توجد نتائج مطابقة</div>';
    container.classList.add('show');
    return;
  }
  container.innerHTML = items.slice(0, 8).map(merchant => `
    <button type="button" class="merchant-result-item" data-merchant-id="${escapeHtml(merchant.id)}">
      <strong>${escapeHtml(merchant['اسم التاجر'] || 'بدون اسم')}</strong>
      <span>${escapeHtml(merchant['رقم التاجر'] || '—')} • ${escapeHtml(merchant['اسم النشاط'] || 'غير محدد')} • ${escapeHtml(merchant['رقم الحساب'] || 'بدون حساب')}</span>
    </button>
  `).join('');
  container.classList.add('show');
}

function hideMerchantQuickResults() {
  const container = document.getElementById('machMerchantResults');
  if (!container) return;
  container.classList.remove('show');
}

function setMachineMerchant(merchant) {
  const hidden = document.getElementById('machMerchantId');
  const search = document.getElementById('machMerchantSearch');
  const select = document.getElementById('machMerchantSelect');
  if (hidden) hidden.value = merchant?.id || '';
  if (search) search.value = merchant ? buildMerchantLabel(merchant) : '';
  if (select) select.value = merchant?.id || '';
  renderMachineMerchantInfo(merchant);
  hideMerchantQuickResults();
}

function renderMachineMerchantInfo(merchant) {
  const card = document.getElementById('machMerchantInfo');
  if (!card) return;
  if (!merchant) {
    card.innerHTML = '<div class="merchant-info-empty">اختر تاجراً ليتم تعبئة بياناته تلقائياً.</div>';
    return;
  }
  card.innerHTML = `
    <div class="merchant-info-grid compact">
      <div><span>رقم التاجر</span><strong>${escapeHtml(merchant['رقم التاجر'] || '—')}</strong></div>
      <div><span>رقم الحساب</span><strong>${escapeHtml(merchant['رقم الحساب'] || '—')}</strong></div>
      <div><span>النشاط</span><strong>${escapeHtml(merchant['اسم النشاط'] || '—')}</strong></div>
      <div><span>الهاتف</span><strong>${escapeHtml(merchant['رقم الهاتف'] || '—')}</strong></div>
      <div><span>المنطقة</span><strong>${escapeHtml(merchant['المنطقة'] || '—')}</strong></div>
      <div><span>العنوان</span><strong>${escapeHtml(merchant['العنوان'] || '—')}</strong></div>
    </div>
  `;
}

function attachMerchantSearch() {
  const search = document.getElementById('machMerchantSearch');
  const select = document.getElementById('machMerchantSelect');
  if (!search || !select) return;

  renderMerchantSelect();
  renderMachineMerchantInfo(null);

  search.oninput = () => {
    filteredMerchants = filterMerchants(merchantsList, search.value);
    renderMerchantSelect();
    renderMerchantQuickResults(filteredMerchants);
    const exact = filteredMerchants.find(merchant => buildMerchantLabel(merchant) === search.value);
    if (!search.value.trim()) {
      setMachineMerchant(null);
      filteredMerchants = [...merchantsList];
      renderMerchantSelect();
      hideMerchantQuickResults();
    } else if (exact) {
      setMachineMerchant(exact);
    }
  };

  search.onfocus = () => {
    filteredMerchants = filterMerchants(merchantsList, search.value);
    renderMerchantSelect();
    renderMerchantQuickResults(filteredMerchants);
  };

  search.onblur = () => {
    setTimeout(() => {
      const currentId = document.getElementById('machMerchantId')?.value;
      if (!currentId) {
        const first = filteredMerchants[0] || null;
        if (first && search.value.trim()) setMachineMerchant(first);
      }
      hideMerchantQuickResults();
    }, 160);
  };

  select.onchange = () => {
    const merchant = merchantsList.find(item => item.id === select.value) || null;
    setMachineMerchant(merchant);
  };

  document.getElementById('machMerchantResults')?.addEventListener('click', event => {
    const button = event.target.closest('[data-merchant-id]');
    if (!button) return;
    const merchant = merchantsList.find(item => item.id === button.dataset.merchantId) || null;
    setMachineMerchant(merchant);
  });
}

function clearMachineForm() {
  document.getElementById('editMachineId').value = '';
  document.getElementById('machMerchantSearch').value = '';
  document.getElementById('machMerchantId').value = '';
  document.getElementById('machMerchantSelect').value = '';
  document.getElementById('machSerial').value = '';
  document.getElementById('machTarget').value = '';
  document.getElementById('machStatus').value = 'نشط';
  document.getElementById('machNotes').value = '';
  renderMachineMerchantInfo(null);
  filteredMerchants = [...merchantsList];
  renderMerchantSelect();
}

export async function loadMachines() {
  supabase = supabase || window.supabaseClient;
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from('machines').select('*');
    if (error) throw error;
    currentMachines = sortMachinesByCode(data || []);
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
  tbody.innerHTML = currentMachines.map((machine, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><code class="ref-code">${escapeHtml(machine['رقم المكنة'] || '-')}</code></td>
      <td>${escapeHtml(machine['اسم التاجر'] || '-')}</td>
      <td>${escapeHtml(machine['اسم النشاط'] || '-')}</td>
      <td dir="ltr">${escapeHtml(machine['الرقم التسلسلي'] || '-')}</td>
      <td>${formatMoney(machine['التارجت الشهري'] || 0)}</td>
      <td>${escapeHtml(machine['الحالة'] || '-')}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-primary btn-sm" onclick="window.editMachine('${machine.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger btn-sm" onclick="window.deleteMachine('${machine.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

export async function openMachineModal(machine = null) {
  await ensureMerchants(true);
  attachMerchantSearch();
  document.getElementById('machineModalTitle').innerHTML = machine
    ? '<i class="fas fa-edit"></i> تعديل مكنة'
    : '<i class="fas fa-plus-circle"></i> إضافة مكنة جديدة';
  if (!machine) clearMachineForm();
  document.getElementById('editMachineId').value = machine?.id || '';
  document.getElementById('machSerial').value = machine?.['الرقم التسلسلي'] || '';
  document.getElementById('machTarget').value = machine?.['التارجت الشهري'] || '';
  document.getElementById('machStatus').value = normalizeMachineStatus(machine?.['الحالة'] || 'نشط');
  document.getElementById('machNotes').value = machine?.['ملاحظات'] || '';
  const merchant = merchantsList.find(item => item.id === machine?.['رقم التاجر']) || null;
  setMachineMerchant(merchant);
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
    const merchant = merchantsList.find(item => item.id === merchantId);
    if (!merchant) return showToast('يرجى اختيار التاجر من القائمة أو نتائج البحث', 'warning');
    const serial = document.getElementById('machSerial').value.trim();
    if (!serial) return showToast('الرقم التسلسلي مطلوب', 'warning');
    const duplicateSerial = currentMachines.find(item => item['الرقم التسلسلي'] === serial && item.id !== id);
    if (duplicateSerial) return showToast('الرقم التسلسلي مستخدم بالفعل', 'warning');

    const payload = {
      'رقم التاجر': merchant.id,
      'اسم التاجر': merchant['اسم التاجر'],
      'اسم النشاط': merchant['اسم النشاط'] || 'غير محدد',
      'رقم الحساب': merchant['رقم الحساب'] || '',
      'الرقم التسلسلي': serial,
      'التارجت الشهري': parseFloat(document.getElementById('machTarget').value || '0') || 0,
      'الحالة': normalizeMachineStatus(document.getElementById('machStatus').value || 'نشط'),
      'ملاحظات': document.getElementById('machNotes').value.trim()
    };

    if (!id) {
      payload['رقم المكنة'] = await generateNextCode(supabase, 'machines', 'رقم المكنة', { prefix: 'MAC', pad: 3 });
    }

    await safeMutateRecord(supabase, 'machines', payload, { id });

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
  const machine = currentMachines.find(item => item.id === id);
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
