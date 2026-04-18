import { showToast, showConfirm } from '../ui/toast.js';
import { escapeHtml, formatMoney, formatDate, formatTime } from '../utils/formatters.js';

let supabase = null;
let currentCollections = [];
let merchantsList = [];
let machinesList = [];
let listsLoaded = false;

export function initCollectionsPage() {
  supabase = window.supabaseClient;
}

async function ensureLists() {
  if (listsLoaded) return;

  const m1 = await supabase.from('merchants').select('*').order('updated_at', { ascending: false });
  if (m1.error) throw m1.error;
  merchantsList = m1.data || [];

  const m2 = await supabase.from('machines').select('*').order('updated_at', { ascending: false });
  if (m2.error) throw m2.error;
  machinesList = m2.data || [];

  listsLoaded = true;
}

function merchantById(id) {
  return merchantsList.find(m => m.id === id);
}

function merchantCodeById(id) {
  const m = merchantById(id);
  return m ? m['رقم التاجر'] : id;
}

function normalizeArabic(text) {
  return String(text || '')
    .replace(/[أإآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function fillMerchantDatalist() {
  const dl = document.getElementById('merchantDatalistColl');
  if (!dl) return;

  dl.innerHTML = merchantsList.map(m =>
    `<option value="${escapeHtml(m['رقم التاجر'])}">${escapeHtml(m['رقم التاجر'])} - ${escapeHtml(m['اسم التاجر'])}</option>`
  ).join('');
}

function fillMachinesSelect(filteredMerchantId = '') {
  const el = document.getElementById('collMachineId');
  if (!el) return;

  const filteredMachines = filteredMerchantId
    ? machinesList.filter(m => m['رقم التاجر'] === filteredMerchantId)
    : machinesList;

  el.innerHTML =
    '<option value="">بدون مكنة</option>' +
    filteredMachines.map(m =>
      `<option value="${escapeHtml(m['رقم المكنة'])}">${escapeHtml(m['رقم المكنة'])}</option>`
    ).join('');
}

function attachSearch() {
  const s = document.getElementById('collMerchantSearch');
  const h = document.getElementById('collMerchantId');
  if (!s || !h) return;

  const resolveMerchant = () => {
    const raw = s.value || '';
    const normalizedInput = normalizeArabic(raw);

    const m = merchantsList.find(x => {
      const code = String(x['رقم التاجر'] || '');
      const name = String(x['اسم التاجر'] || '');
      const full = `${code} - ${name}`;
      return (
        code === raw ||
        full === raw ||
        normalizeArabic(code) === normalizedInput ||
        normalizeArabic(name).includes(normalizedInput) ||
        normalizeArabic(full).includes(normalizedInput)
      );
    });

    h.value = m?.id || '';
    fillMachinesSelect(m?.id || '');
  };

  s.onchange = resolveMerchant;
  s.oninput = resolveMerchant;
}

async function getMerchantDebt(merchantId, excludeCollectionId = null) {
  const { data: transfers, error: transferError } = await supabase
    .from('transfers')
    .select('قيمة التحويل')
    .eq('رقم التاجر', merchantId);

  if (transferError) throw transferError;

  let collectionQuery = supabase
    .from('collections')
    .select('id, قيمة التحصيل')
    .eq('رقم التاجر', merchantId);

  const { data: collections, error: collectionError } = await collectionQuery;
  if (collectionError) throw collectionError;

  const totalTransfers = (transfers || []).reduce(
    (sum, row) => sum + (parseFloat(row['قيمة التحويل']) || 0),
    0
  );

  const totalCollections = (collections || [])
    .filter(row => !excludeCollectionId || row.id !== excludeCollectionId)
    .reduce((sum, row) => sum + (parseFloat(row['قيمة التحصيل']) || 0), 0);

  return Math.max(0, totalTransfers - totalCollections);
}

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

async function insertLog(action, details, ref = '') {
  try {
    await supabase.from('logs').insert([{
      النوع: action,
      التفاصيل: details,
      الرقم_المرجعي: ref,
      التاريخ: new Date().toISOString().split('T')[0],
      الوقت: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    }]);
  } catch (e) {
    console.warn('log failed', e);
  }
}

export async function loadCollections() {
  supabase = supabase || window.supabaseClient;
  if (!supabase) return;

  try {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    currentCollections = data || [];
    await ensureLists();
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
    tbody.innerHTML = '<tr><td colspan="10" class="empty-state">لا توجد تحصيلات</td></tr>';
    return;
  }

  tbody.innerHTML = currentCollections.map((t, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><code class="ref-code">${escapeHtml(t['الرقم المرجعي'] || '-')}</code></td>
      <td>${formatDate(t['التاريخ'])}</td>
      <td>${formatTime(t['الوقت'])}</td>
      <td>${escapeHtml(t['اسم التاجر'] || '-')}</td>
      <td>${escapeHtml(t['اسم النشاط'] || '-')}</td>
      <td>${formatMoney(t['قيمة التحصيل'] || 0)}</td>
      <td>${formatMoney(t['المتبقي بعد التحصيل'] || 0)}</td>
      <td>${escapeHtml(t['ملاحظات'] || '-')}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-primary btn-sm" onclick="window.editCollection('${t.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="window.deleteCollection('${t.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

export async function openCollectionModal(collection = null) {
  await ensureLists();
  fillMerchantDatalist();
  attachSearch();

  document.getElementById('collectionModalTitle').innerHTML = collection
    ? '<i class="fas fa-edit"></i> تعديل تحصيل'
    : '<i class="fas fa-hand-holding-usd"></i> تحصيل جديد';

  document.getElementById('editCollectionId').value = collection?.id || '';
  document.getElementById('collMerchantId').value = collection?.['رقم التاجر'] || '';

  const merchant = merchantById(collection?.['رقم التاجر']);
  document.getElementById('collMerchantSearch').value = merchant?.['رقم التاجر'] || '';

  fillMachinesSelect(collection?.['رقم التاجر'] || '');
  document.getElementById('collMachineId').value = collection?.['رقم المكنة'] || '';
  document.getElementById('collAmount').value = collection?.['قيمة التحصيل'] || '';
  document.getElementById('collType').value = collection?.['نوع التحصيل'] || 'نقدي';
  document.getElementById('collNotes').value = collection?.['ملاحظات'] || '';

  document.getElementById('collectionModal').classList.add('show');
}

export function closeCollectionModal() {
  document.getElementById('collectionModal')?.classList.remove('show');
}

export async function saveCollection() {
  const id = document.getElementById('editCollectionId').value;
  const merchant = merchantById(document.getElementById('collMerchantId').value);

  if (!merchant) {
    return showToast('يرجى اختيار التاجر من القائمة', 'warning');
  }

  const amount = parseFloat(document.getElementById('collAmount').value || '0');
  if (!(amount > 0)) {
    return showToast('يرجى إدخال مبلغ صحيح', 'warning');
  }

  try {
    const currentDebt = await getMerchantDebt(merchant.id, id || null);

    if (amount > currentDebt) {
      return showToast(
        `مبلغ التحصيل (${formatMoney(amount)}) أكبر من المديونية الحالية (${formatMoney(currentDebt)})`,
        'warning'
      );
    }

    const remainingAfterCollection = Math.max(0, currentDebt - amount);
    const { date, time } = getNowDateTime();

    const payload = {
      'رقم التاجر': merchant.id,
      'اسم التاجر': merchant['اسم التاجر'],
      'اسم النشاط': merchant['اسم النشاط'] || 'غير محدد',
      'رقم الحساب': merchant['رقم الحساب'] || '',
      'رقم المكنة': document.getElementById('collMachineId').value || null,
      'قيمة التحصيل': amount,
      'نوع التحصيل': document.getElementById('collType').value || 'نقدي',
      'المتبقي بعد التحصيل': remainingAfterCollection,
      'ملاحظات': document.getElementById('collNotes').value.trim(),
      'التاريخ': date,
      'الوقت': time
    };

    const q = id
      ? supabase.from('collections').update(payload).eq('id', id)
      : supabase.from('collections').insert([payload]);

    const { error } = await q;
    if (error) throw error;

    await insertLog(
      id ? 'تعديل تحصيل' : 'إضافة تحصيل',
      `تم ${id ? 'تعديل' : 'إضافة'} تحصيل بمبلغ ${amount}، والمتبقي ${remainingAfterCollection}`,
      payload['الرقم المرجعي'] || ''
    );

    showToast(id ? 'تم تحديث التحصيل' : 'تم إضافة التحصيل', 'success');

    closeCollectionModal();
    await loadCollections();
    window.loadDashboardStats?.();
    window.loadRecentActivities?.();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'فشل حفظ التحصيل', 'error');
  }
}

export function editCollection(id) {
  const item = currentCollections.find(t => t.id === id);
  if (item) openCollectionModal(item);
}

export function deleteCollection(id) {
  showConfirm('هل تريد حذف هذا التحصيل؟', async () => {
    const { error } = await supabase.from('collections').delete().eq('id', id);
    if (error) return showToast(error.message, 'error');

    await insertLog('حذف تحصيل', 'تم حذف تحصيل', id);

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
