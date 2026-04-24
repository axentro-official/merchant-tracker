import { showToast, showConfirm } from '../ui/toast.js';
import { escapeHtml, formatMoney, formatMoneyText, formatDate } from '../utils/formatters.js';
import { buildMachineOptionLabel, buildMerchantLabel, filterMerchants, generateNextCode, safeMutateRecord, sortMachinesByCode, sortMerchantsByCode, sortRowsByDateTime } from '../services/referenceService.js';

let supabase = null;
let currentCollections = [];
let merchantsList = [];
let machinesList = [];
let filteredMerchants = [];
let listsLoaded = false;
let isSavingCollection = false;

export function initCollectionsPage() { supabase = window.supabaseClient; }

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

function renderMerchantSelect() {
  const select = document.getElementById('collMerchantSelect');
  if (!select) return;
  select.innerHTML = '<option value="">اختر التاجر يدوياً...</option>' + filteredMerchants.map(merchant => (
    `<option value="${escapeHtml(merchant.id)}">${escapeHtml(buildMerchantLabel(merchant))}</option>`
  )).join('');
}

function renderQuickResults(items) {
  const container = document.getElementById('collMerchantResults');
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

function hideQuickResults() { document.getElementById('collMerchantResults')?.classList.remove('show'); }

function fillMachinesSelect(merchantId = '', selectedMachine = '') {
  const select = document.getElementById('collMachineId');
  if (!select) return null;
  const machines = merchantId ? machinesList.filter(machine => machine['رقم التاجر'] === merchantId) : [];
  const autoSelected = selectedMachine || machines[0]?.['رقم المكنة'] || '';
  select.innerHTML = '<option value="">لا توجد مكنة مرتبطة</option>' + machines.map(machine => (
    `<option value="${escapeHtml(machine['رقم المكنة'])}" ${machine['رقم المكنة'] === autoSelected ? 'selected' : ''}>${escapeHtml(buildMachineOptionLabel(machine))}</option>`
  )).join('');
  select.value = autoSelected;
  select.disabled = true;
  renderMachineInfo(machineByCode(autoSelected));
  return machineByCode(autoSelected);
}

async function getMerchantDebt(merchantId, excludeId = null) {
  const [transfersRes, collectionsRes] = await Promise.all([
    supabase.from('transfers').select('"قيمة التحويل"').eq('رقم التاجر', merchantId),
    supabase.from('collections').select('id, "قيمة التحصيل"').eq('رقم التاجر', merchantId)
  ]);
  if (transfersRes.error) throw transfersRes.error;
  if (collectionsRes.error) throw collectionsRes.error;
  const totalTransfers = (transfersRes.data || []).reduce((sum, row) => sum + (parseFloat(row['قيمة التحويل']) || 0), 0);
  const totalCollections = (collectionsRes.data || []).reduce((sum, row) => {
    if (excludeId && row.id === excludeId) return sum;
    return sum + (parseFloat(row['قيمة التحصيل']) || 0);
  }, 0);
  return Math.max(0, totalTransfers - totalCollections);
}

async function renderMerchantInfo(merchant, excludeId = null) {
  const card = document.getElementById('collMerchantInfo');
  if (!card) return;
  if (!merchant) {
    card.innerHTML = '<div class="merchant-info-empty">اختر تاجراً ليتم تحميل مديونيته الحالية والمكن المرتبط به فوراً.</div>';
    document.getElementById('collCurrentDebt').textContent = formatMoneyText(0);
    return;
  }
  const linkedMachines = machinesList.filter(machine => machine['رقم التاجر'] === merchant.id);
  const debt = await getMerchantDebt(merchant.id, excludeId);
  document.getElementById('collCurrentDebt').textContent = formatMoneyText(debt);
  card.innerHTML = `
    <div class="merchant-info-grid">
      <div><span>رقم التاجر</span><strong>${escapeHtml(merchant['رقم التاجر'] || '—')}</strong></div>
      <div><span>رقم الحساب</span><strong>${escapeHtml(merchant['رقم الحساب'] || '—')}</strong></div>
      <div><span>اسم النشاط</span><strong>${escapeHtml(merchant['اسم النشاط'] || '—')}</strong></div>
      <div><span>الهاتف</span><strong>${escapeHtml(merchant['رقم الهاتف'] || '—')}</strong></div>
      <div><span>المكن المرتبط</span><strong>${linkedMachines.length}</strong></div>
    </div>
  `;
}

function renderMachineInfo(machine) {
  const card = document.getElementById('collMachineInfo');
  if (!card) return;
  if (!machine) {
    card.innerHTML = '<div class="merchant-info-empty">سيتم تحميل بيانات أول مكنة مرتبطة بالتاجر تلقائياً.</div>';
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

async function setCollectionMerchant(merchant, selectedMachine = '', excludeId = null) {
  document.getElementById('collMerchantId').value = merchant?.id || '';
  document.getElementById('collMerchantSearch').value = merchant ? buildMerchantLabel(merchant) : '';
  document.getElementById('collMerchantSelect').value = merchant?.id || '';
  fillMachinesSelect(merchant?.id || '', selectedMachine);
  await renderMerchantInfo(merchant, excludeId);
  hideQuickResults();
}

function attachSearch() {
  const search = document.getElementById('collMerchantSearch');
  const select = document.getElementById('collMerchantSelect');
  const machineSelect = document.getElementById('collMachineId');
  if (!search || !select || !machineSelect) return;
  renderMerchantSelect();
  renderMerchantInfo(null);
  renderMachineInfo(null);
  search.oninput = () => {
    filteredMerchants = filterMerchants(merchantsList, search.value);
    renderMerchantSelect();
    renderQuickResults(filteredMerchants);
    if (!search.value.trim()) setCollectionMerchant(null);
  };
  search.onfocus = () => {
    filteredMerchants = filterMerchants(merchantsList, search.value);
    renderMerchantSelect();
    renderQuickResults(filteredMerchants);
  };
  search.onblur = () => setTimeout(hideQuickResults, 160);
  select.onchange = async () => setCollectionMerchant(merchantById(select.value), '', document.getElementById('editCollectionId').value || null);
  machineSelect.onchange = () => renderMachineInfo(machineByCode(machineSelect.value));
  document.getElementById('collMerchantResults')?.addEventListener('click', async event => {
    const button = event.target.closest('[data-merchant-id]');
    if (!button) return;
    await setCollectionMerchant(merchantById(button.dataset.merchantId), '', document.getElementById('editCollectionId').value || null);
  });
}

function clearForm() {
  document.getElementById('editCollectionId').value = '';
  document.getElementById('collMerchantId').value = '';
  document.getElementById('collMerchantSearch').value = '';
  document.getElementById('collMerchantSelect').value = '';
  document.getElementById('collAmount').value = '';
  document.getElementById('collType').value = 'تحصيل جزئي';
  document.getElementById('collNotes').value = '';
  document.getElementById('collCurrentDebt').textContent = formatMoneyText(0);
  fillMachinesSelect('');
  renderMerchantInfo(null);
  renderMachineInfo(null);
}

export async function loadCollections() {
  supabase = supabase || window.supabaseClient;
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from('collections').select('*');
    if (error) throw error;
    currentCollections = sortRowsByDateTime(data || []);
    await ensureLists(true);
    renderCollectionsTable();
  } catch (err) {
    console.error(err);
    showToast('خطأ في تحميل التحصيلات', 'error');
  }
}

function renderCollectionsTable() {
  const tbody = document.getElementById('collectionsTableBody');
  if (!tbody) return;
  if (!currentCollections.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">لا توجد تحصيلات</td></tr>';
    return;
  }
  tbody.innerHTML = currentCollections.map((collection, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><code class="ref-code">${escapeHtml(collection['الرقم المرجعي'] || '-')}</code></td>
      <td>${formatDate(collection['التاريخ'])}</td>
      <td>${escapeHtml(collection['الوقت'] || '-')}</td>
      <td>${escapeHtml(collection['اسم التاجر'] || '-')}</td>
      <td>${escapeHtml(collection['اسم النشاط'] || '-')}</td>
      <td>${formatMoney(collection['قيمة التحصيل'] || 0)}</td>
      <td>${escapeHtml(String(collection['ملاحظات'] || '').replace(/^\[COLLECTION_TYPE:[^\]]+\]\s*/i, '') || '-')}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-primary btn-sm" onclick="window.editCollection('${collection.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger btn-sm" onclick="window.deleteCollection('${collection.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

export async function openCollectionModal(collection = null) {
  await ensureLists(true);
  attachSearch();
  if (!collection) clearForm();
  document.getElementById('collectionModalTitle').innerHTML = collection ? '<i class="fas fa-edit"></i> تعديل تحصيل' : '<i class="fas fa-hand-holding-usd"></i> تحصيل جديد';
  document.getElementById('editCollectionId').value = collection?.id || '';
  document.getElementById('collAmount').value = collection?.['قيمة التحصيل'] || '';
  document.getElementById('collType').value = collection?.['نوع التحصيل'] || extractCollectionTypeFromNotes(collection?.['ملاحظات']) || 'تحصيل جزئي';
  document.getElementById('collNotes').value = collection?.['ملاحظات'] || '';
  const merchant = merchantById(collection?.['رقم التاجر']);
  await setCollectionMerchant(merchant, collection?.['رقم المكنة'] || '', collection?.id || null);
  document.getElementById('collectionModal').classList.add('show');
}

export function closeCollectionModal() {
  document.getElementById('collectionModal')?.classList.remove('show');
  clearForm();
}

function buildCollectionTypeTaggedNotes(typeValue, notesValue) {
  const cleanNotes = String(notesValue || '').trim().replace(/^\[COLLECTION_TYPE:[^\]]+\]\s*/i, '');
  return `[COLLECTION_TYPE:${typeValue}] ${cleanNotes}`.trim();
}

function extractCollectionTypeFromNotes(notesValue) {
  const match = String(notesValue || '').match(/^\[COLLECTION_TYPE:([^\]]+)\]/i);
  return match?.[1] || '';
}

function normalizeCollectionType(value) {
  const raw = String(value || '').trim();
  const map = {
    'تحصيل كلي': 'تحصيل كلي',
    'تحصيل جزئي': 'تحصيل جزئي'
  };
  return map[raw] || 'تحصيل جزئي';
}

async function persistCollectionWithFallback(payload, { id = '' } = {}) {
  return await safeMutateRecord(supabase, 'collections', payload, { id });
}

export async function saveCollection() {
  if (isSavingCollection) return;
  isSavingCollection = true;
  try {
    const id = document.getElementById('editCollectionId').value;
    const merchant = merchantById(document.getElementById('collMerchantId').value);
    if (!merchant) return showToast('يرجى اختيار التاجر من القائمة أو نتائج البحث', 'warning');
    const amount = parseFloat(document.getElementById('collAmount').value || '0');
    if (!(amount > 0)) return showToast('يرجى إدخال مبلغ صحيح', 'warning');
    const currentDebt = await getMerchantDebt(merchant.id, id || null);
    if (amount > currentDebt) {
      return showToast(`مبلغ التحصيل أكبر من المديونية الحالية. المديونية الفعلية الآن: ${formatMoney(currentDebt)}`, 'warning');
    }
    const { date, time } = getNowDateTime();
    const payload = {
      'رقم التاجر': merchant.id,
      'اسم التاجر': merchant['اسم التاجر'],
      'اسم النشاط': merchant['اسم النشاط'] || 'غير محدد',
      'رقم الحساب': merchant['رقم الحساب'] || '',
      'رقم المكنة': document.getElementById('collMachineId').value || null,
      'قيمة التحصيل': amount,
      'المتبقي بعد التحصيل': Math.max(0, currentDebt - amount),
      'ملاحظات': buildCollectionTypeTaggedNotes(normalizeCollectionType(document.getElementById('collType').value || 'تحصيل جزئي'), document.getElementById('collNotes').value.trim()),
      'التاريخ': date,
      'الوقت': time,
      'الشهر': new Date().toLocaleString('ar-EG', { month: 'long', year: 'numeric' })
    };
    if (!id) {
      payload['الرقم المرجعي'] = await generateNextCode(supabase, 'collections', 'الرقم المرجعي', { prefix: 'COL', pad: 5 });
    }
    await persistCollectionWithFallback(payload, { id });
    showToast(id ? 'تم تحديث التحصيل' : 'تم إضافة التحصيل', 'success');
    closeCollectionModal();
    await loadCollections();
    window.loadDashboardStats?.();
    window.loadRecentActivities?.();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'فشل حفظ التحصيل', 'error');
  } finally {
    isSavingCollection = false;
  }
}

export function editCollection(id) {
  const item = currentCollections.find(collection => collection.id === id);
  if (item) openCollectionModal(item);
}

export function deleteCollection(id) {
  showConfirm('هل تريد حذف هذا التحصيل؟', async () => {
    const { error } = await supabase.from('collections').delete().eq('id', id);
    if (error) return showToast(error.message, 'error');
    showToast('تم حذف التحصيل', 'success');
    await loadCollections();
    window.loadDashboardStats?.();
    window.loadRecentActivities?.();
  });
}

window.openCollectionModal = openCollectionModal;
window.closeCollectionModal = closeCollectionModal;
window.saveCollection = saveCollection;
window.editCollection = editCollection;
window.deleteCollection = deleteCollection;
