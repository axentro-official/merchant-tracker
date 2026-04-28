import { showToast, showConfirm } from '../ui/toast.js';
import { escapeHtml, formatMoney, formatDate } from '../utils/formatters.js';
import { buildMachineOptionLabel, buildMerchantLabel, filterMerchants, generateNextCode, safeMutateRecord, sortMachinesByCode, sortMerchantsByCode, sortRowsByDateTime } from '../services/referenceService.js';

let supabase = null;
let currentTransfers = [];
let merchantsList = [];
let machinesList = [];
let filteredMerchants = [];
let listsLoaded = false;
let isSavingTransfer = false;

export function initTransfersPage() { supabase = window.supabaseClient; }

async function ensureLists(force = false) {
  if (listsLoaded && !force) return;
  const [merchantsRes, machinesRes] = await Promise.all([
    supabase.from('merchants').select('*'),
    supabase.from('machines').select('*')
  ]);
  if (merchantsRes.error) throw merchantsRes.error;
  if (machinesRes.error) throw machinesRes.error;
  merchantsList = sortMerchantsByCode(merchantsRes.data || []);
  machinesList = sortMachinesByCode(machinesRes.data || []);
  filteredMerchants = [...merchantsList];
  listsLoaded = true;
}

function merchantById(id) { return merchantsList.find(item => item.id === id) || null; }
function machineByCode(code) { return machinesList.find(item => item['رقم المكنة'] === code) || null; }
function getNowDateTime() { const now = new Date(); return { date: now.toISOString().split('T')[0], time: now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true }) }; }
function buildDateTime(date, time) { try { return new Date(`${date || ''} ${time || '12:00 AM'}`).getTime() || 0; } catch { return 0; } }

function normalizeStatus(value) {
  return String(value || '').trim();
}

function isMerchantActive(merchant) {
  return normalizeStatus(merchant?.['الحالة']) === 'نشط';
}

function isMachineActive(machine) {
  return ['نشط', 'نشطة'].includes(normalizeStatus(machine?.['الحالة']));
}

function getMerchantMachines(merchantId = '') {
  return merchantId ? machinesList.filter(machine => machine['رقم التاجر'] === merchantId) : [];
}

function getActiveMerchantMachines(merchantId = '') {
  return getMerchantMachines(merchantId).filter(isMachineActive);
}

function showOperationBlockedToast(reason, details = '') {
  const suffix = details ? ` — ${details}` : '';
  showToast(`⛔ العملية مرفوضة${suffix}. ${reason}`, 'error');
}

function validateMerchantAndMachineForTransfer(merchant, machine) {
  if (!merchant) {
    showOperationBlockedToast('يرجى اختيار تاجر صحيح من القائمة');
    return false;
  }
  if (!isMerchantActive(merchant)) {
    showOperationBlockedToast('لا يمكن تنفيذ تحويل على تاجر غير نشط', `حالة التاجر: ${merchant['الحالة'] || 'غير محددة'}`);
    return false;
  }
  const activeMachines = getActiveMerchantMachines(merchant.id);
  if (!activeMachines.length) {
    showOperationBlockedToast('لا توجد مكنة نشطة لهذا التاجر. فعّل مكنة حالية أو أضف مكنة جديدة نشطة أولاً');
    return false;
  }
  if (!machine || !isMachineActive(machine)) {
    showOperationBlockedToast('لا يمكن تنفيذ التحويل إلا على مكنة نشطة', machine ? `حالة المكنة: ${machine['الحالة'] || 'غير محددة'}` : 'لم يتم تحديد مكنة نشطة');
    return false;
  }
  return true;
}

function renderMerchantSelect() {
  const select = document.getElementById('transMerchantSelect');
  if (!select) return;
  select.innerHTML = '<option value="">اختر التاجر يدوياً...</option>' + filteredMerchants.map(merchant => {
    const disabled = !isMerchantActive(merchant) ? 'disabled' : '';
    const suffix = !isMerchantActive(merchant) ? ' — غير نشط' : '';
    return `<option value="${escapeHtml(merchant.id)}" ${disabled}>${escapeHtml(buildMerchantLabel(merchant) + suffix)}</option>`;
  }).join('');
}

function renderQuickResults(items) {
  const container = document.getElementById('transMerchantResults');
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

function hideQuickResults() {
  document.getElementById('transMerchantResults')?.classList.remove('show');
}

function fillMachinesSelect(merchantId = '', selectedMachine = '') {
  const select = document.getElementById('transMachineId');
  if (!select) return null;
  const activeMachines = getActiveMerchantMachines(merchantId);
  const selected = activeMachines.find(machine => machine['رقم المكنة'] === selectedMachine);
  const autoSelected = selected?.['رقم المكنة'] || activeMachines[0]?.['رقم المكنة'] || '';
  select.innerHTML = '<option value="">لا توجد مكنة نشطة مرتبطة</option>' + activeMachines.map(machine => (
    `<option value="${escapeHtml(machine['رقم المكنة'])}" ${machine['رقم المكنة'] === autoSelected ? 'selected' : ''}>${escapeHtml(buildMachineOptionLabel(machine))}</option>`
  )).join('');
  select.value = autoSelected;
  select.disabled = true;
  renderMachineInfo(machineByCode(autoSelected));
  return machineByCode(autoSelected);
}

async function calculateMerchantDebt(merchantId) {
  if (!merchantId) return 0;
  const [transfersRes, collectionsRes] = await Promise.all([
    supabase.from('transfers').select('"قيمة التحويل"').eq('رقم التاجر', merchantId),
    supabase.from('collections').select('"قيمة التحصيل"').eq('رقم التاجر', merchantId)
  ]);
  if (transfersRes.error) throw transfersRes.error;
  if (collectionsRes.error) throw collectionsRes.error;
  const totalTransfers = (transfersRes.data || []).reduce((sum, row) => sum + (parseFloat(row['قيمة التحويل']) || 0), 0);
  const totalCollections = (collectionsRes.data || []).reduce((sum, row) => sum + (parseFloat(row['قيمة التحصيل']) || 0), 0);
  return Math.max(0, totalTransfers - totalCollections);
}

async function renderMerchantInfo(merchant) {
  const card = document.getElementById('transMerchantInfo');
  if (!card) return;
  if (!merchant) {
    card.innerHTML = '<div class="merchant-info-empty">اختر تاجراً ليتم جلب بياناته والمكن المرتبط به تلقائياً.</div>';
    return;
  }
  const linkedMachines = machinesList.filter(machine => machine['رقم التاجر'] === merchant.id);
  const debt = await calculateMerchantDebt(merchant.id);
  card.innerHTML = `
    <div class="merchant-info-grid">
      <div><span>رقم التاجر</span><strong>${escapeHtml(merchant['رقم التاجر'] || '—')}</strong></div>
      <div><span>رقم الحساب</span><strong>${escapeHtml(merchant['رقم الحساب'] || '—')}</strong></div>
      <div><span>اسم النشاط</span><strong>${escapeHtml(merchant['اسم النشاط'] || '—')}</strong></div>
      <div><span>الهاتف</span><strong>${escapeHtml(merchant['رقم الهاتف'] || '—')}</strong></div>
      <div><span>المنطقة</span><strong>${escapeHtml(merchant['المنطقة'] || '—')}</strong></div>
      <div><span>المكن المرتبط</span><strong>${linkedMachines.length}</strong></div>
      <div class="full accent"><span>المديونية الحالية</span><strong>${formatMoney(debt)}</strong></div>
    </div>
  `;
}

function renderMachineInfo(machine) {
  const card = document.getElementById('transMachineInfo');
  if (!card) return;
  if (!machine) {
    card.innerHTML = '<div class="merchant-info-empty">سيتم ربط أول مكنة نشطة أو أول مكنة متاحة بالتاجر تلقائياً.</div>';
    return;
  }
  card.innerHTML = `
    <div class="merchant-info-grid compact">
      <div><span>رقم المكنة</span><strong>${escapeHtml(machine['رقم المكنة'] || '—')}</strong></div>
      <div><span>السيريال</span><strong>${escapeHtml(machine['الرقم التسلسلي'] || '—')}</strong></div>
      <div><span>الحالة</span><strong>${escapeHtml(machine['الحالة'] || '—')}</strong></div>
      <div><span>التارجت</span><strong>${formatMoney(machine['التارجت الشهري'] || 0)}</strong></div>
    </div>
  `;
}

async function setTransferMerchant(merchant, selectedMachine = '') {
  if (merchant && !isMerchantActive(merchant)) {
    showOperationBlockedToast('لا يمكن اختيار تاجر غير نشط لإجراء تحويل', `حالة التاجر: ${merchant['الحالة'] || 'غير محددة'}`);
    merchant = null;
  }
  document.getElementById('transMerchantId').value = merchant?.id || '';
  document.getElementById('transMerchantSearch').value = merchant ? buildMerchantLabel(merchant) : '';
  document.getElementById('transMerchantSelect').value = merchant?.id || '';
  const selected = fillMachinesSelect(merchant?.id || '', selectedMachine);
  if (merchant && !selected) {
    showOperationBlockedToast('لا توجد مكنة نشطة لهذا التاجر. فعّل مكنة أو أضف مكنة جديدة نشطة أولاً');
  }
  await renderMerchantInfo(merchant);
  hideQuickResults();
}

function attachSearch() {
  const search = document.getElementById('transMerchantSearch');
  const select = document.getElementById('transMerchantSelect');
  const machineSelect = document.getElementById('transMachineId');
  if (!search || !select || !machineSelect) return;

  renderMerchantSelect();
  renderMerchantInfo(null);
  renderMachineInfo(null);

  search.oninput = () => {
    filteredMerchants = filterMerchants(merchantsList, search.value);
    renderMerchantSelect();
    renderQuickResults(filteredMerchants);
    if (!search.value.trim()) setTransferMerchant(null);
  };
  search.onfocus = () => {
    filteredMerchants = filterMerchants(merchantsList, search.value);
    renderMerchantSelect();
    renderQuickResults(filteredMerchants);
  };
  search.onblur = () => setTimeout(hideQuickResults, 160);
  select.onchange = async () => setTransferMerchant(merchantById(select.value));
  machineSelect.onchange = () => renderMachineInfo(machineByCode(machineSelect.value));

  document.getElementById('transMerchantResults')?.addEventListener('click', async event => {
    const button = event.target.closest('[data-merchant-id]');
    if (!button) return;
    await setTransferMerchant(merchantById(button.dataset.merchantId));
  });
}

function clearForm() {
  document.getElementById('editTransferId').value = '';
  document.getElementById('transMerchantId').value = '';
  document.getElementById('transMerchantSearch').value = '';
  document.getElementById('transMerchantSelect').value = '';
  document.getElementById('transAmount').value = '';
  document.getElementById('transType').value = 'رصيد خدمات';
  document.getElementById('transNotes').value = '';
  fillMachinesSelect('');
  renderMerchantInfo(null);
  renderMachineInfo(null);
}

export async function loadTransfers() {
  supabase = supabase || window.supabaseClient;
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from('transfers').select('*');
    if (error) throw error;
    currentTransfers = sortRowsByDateTime(data || []);
    await ensureLists(true);
    renderTransfersTable();
  } catch (err) {
    console.error(err);
    showToast('خطأ في تحميل التحويلات', 'error');
  }
}

function renderTransfersTable() {
  const tbody = document.getElementById('transfersTableBody');
  if (!tbody) return;
  if (!currentTransfers.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">لا توجد تحويلات</td></tr>';
    return;
  }
  tbody.innerHTML = currentTransfers.map((transfer, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><code class="ref-code">${escapeHtml(transfer['الرقم المرجعي'] || '-')}</code></td>
      <td>${formatDate(transfer['التاريخ'])}</td>
      <td>${escapeHtml(transfer['الوقت'] || '-')}</td>
      <td>${escapeHtml(transfer['اسم التاجر'] || '-')}</td>
      <td>${escapeHtml(transfer['اسم النشاط'] || '-')}</td>
      <td>${formatMoney(transfer['قيمة التحويل'] || 0)}</td>
      <td>${escapeHtml(String(transfer['ملاحظات'] || '').replace(/^\[TYPE:[^\]]+\]\s*/i, '') || '-')}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-primary btn-sm" onclick="window.editTransfer('${transfer.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger btn-sm" onclick="window.deleteTransfer('${transfer.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

export async function openTransferModal(transfer = null) {
  supabase = supabase || window.supabaseClient;
  await ensureLists(true);
  attachSearch();
  if (!transfer) clearForm();
  document.getElementById('transferModalTitle').innerHTML = transfer ? '<i class="fas fa-edit"></i> تعديل تحويل' : '<i class="fas fa-exchange-alt"></i> تحويل جديد';
  document.getElementById('editTransferId').value = transfer?.id || '';
  document.getElementById('transAmount').value = transfer?.['قيمة التحويل'] || '';
  document.getElementById('transType').value = transfer?.['نوع التحويل'] || extractTypeFromNotes(transfer?.['ملاحظات']) || 'رصيد خدمات';
  document.getElementById('transNotes').value = transfer?.['ملاحظات'] || '';
  const merchant = merchantById(transfer?.['رقم التاجر']);
  await setTransferMerchant(merchant, transfer?.['رقم المكنة'] || '');
  document.getElementById('transferModal').classList.add('show');
}

export function closeTransferModal() {
  document.getElementById('transferModal')?.classList.remove('show');
  clearForm();
}

function buildTypeTaggedNotes(typeValue, notesValue) {
  const cleanNotes = String(notesValue || '').trim().replace(/^\[TYPE:[^\]]+\]\s*/i, '');
  return `[TYPE:${typeValue}] ${cleanNotes}`.trim();
}

function extractTypeFromNotes(notesValue) {
  const match = String(notesValue || '').match(/^\[TYPE:([^\]]+)\]/i);
  return match?.[1] || '';
}

function normalizeTransferType(value) {
  const raw = String(value || '').trim();
  const map = {
    'رصيد خدمات': 'رصيد خدمات',
    'رصيد كاش': 'رصيد كاش',
    'أخرى': 'أخرى'
  };
  return map[raw] || 'أخرى';
}

async function persistTransferWithFallback(payload, { id = '' } = {}) {
  return await safeMutateRecord(supabase, 'transfers', payload, { id });
}

export async function saveTransfer() {
  if (isSavingTransfer) return;
  isSavingTransfer = true;
  try {
    supabase = supabase || window.supabaseClient;
    const id = document.getElementById('editTransferId').value;
    const merchant = merchantById(document.getElementById('transMerchantId').value);
    const machine = machineByCode(document.getElementById('transMachineId').value);
    if (!validateMerchantAndMachineForTransfer(merchant, machine)) return;
    const amount = parseFloat(document.getElementById('transAmount').value || '0');
    if (!(amount > 0)) return showToast('المبلغ غير صحيح', 'warning');
    const { date, time } = getNowDateTime();
    const payload = {
      'رقم التاجر': merchant.id,
      'اسم التاجر': merchant['اسم التاجر'],
      'اسم النشاط': merchant['اسم النشاط'] || 'غير محدد',
      'رقم الحساب': merchant['رقم الحساب'] || '',
      'رقم المكنة': document.getElementById('transMachineId').value || null,
      'قيمة التحويل': amount,
      'ملاحظات': buildTypeTaggedNotes(normalizeTransferType(document.getElementById('transType').value || 'رصيد خدمات'), document.getElementById('transNotes').value.trim()),
      'التاريخ': date,
      'الوقت': time,
      'الشهر': new Date().toLocaleString('ar-EG', { month: 'long', year: 'numeric' })
    };
    if (!id) {
      payload['الرقم المرجعي'] = await generateNextCode(supabase, 'transfers', 'الرقم المرجعي', { prefix: 'TRF', pad: 5 });
    }
    await persistTransferWithFallback(payload, { id });
    showToast(id ? 'تم تعديل التحويل' : 'تم إضافة التحويل', 'success');
    closeTransferModal();
    await loadTransfers();
    window.loadDashboardStats?.();
    window.loadRecentActivities?.();
    window.loadTopMachines?.();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'فشل حفظ التحويل', 'error');
  } finally {
    isSavingTransfer = false;
  }
}

export function editTransfer(id) {
  const item = currentTransfers.find(transfer => transfer.id === id);
  if (item) openTransferModal(item);
}

export async function deleteTransfer(id) {
  supabase = supabase || window.supabaseClient;
  showConfirm('هل تريد حذف هذا التحويل؟', async () => {
    try {
      const { error } = await supabase.from('transfers').delete().eq('id', id);
      if (error) throw error;
      showToast('تم حذف التحويل', 'success');
      await loadTransfers();
      window.loadDashboardStats?.();
      window.loadRecentActivities?.();
      window.loadTopMachines?.();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'فشل حذف التحويل', 'error');
    }
  });
}

window.openTransferModal = openTransferModal;
window.closeTransferModal = closeTransferModal;
window.saveTransfer = saveTransfer;
window.editTransfer = editTransfer;
window.deleteTransfer = deleteTransfer;
