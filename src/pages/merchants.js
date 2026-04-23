import { showToast, showConfirm } from '../ui/toast.js';
import { escapeHtml, normalizeText } from '../utils/formatters.js';
import { generateNextCode, safeMutateRecord, sortMerchantsByCode } from '../services/referenceService.js';

let supabase = null;
let currentMerchants = [];

export function initMerchantsPage() {
  supabase = window.supabaseClient;
}

function extractSequence(code) {
  const match = String(code || '').match(/(\d+)(?!.*\d)/);
  return match ? parseInt(match[1], 10) : 0;
}

function sortMerchants(list) {
  return sortMerchantsByCode(list || []);
}

export async function loadMerchants() {
  supabase = supabase || window.supabaseClient;
  if (!supabase) return;

  try {
    const { data, error } = await supabase.from('merchants').select('*');
    if (error) throw error;

    currentMerchants = sortMerchants(data || []);
    renderMerchantsTable();
  } catch (err) {
    console.error(err);
    showToast('خطأ في تحميل التجار', 'error');
  }
}

function renderMerchantsTable() {
  const tbody = document.getElementById('merchantsTableBody');
  if (!tbody) return;

  if (!currentMerchants.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state"><i class="fas fa-inbox"></i> لا يوجد تجار</td></tr>';
    return;
  }

  tbody.innerHTML = currentMerchants.map((m, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><code class="ref-code">${escapeHtml(m['رقم التاجر'] || '-')}</code></td>
      <td><strong>${escapeHtml(m['اسم التاجر'] || '-')}</strong></td>
      <td>${escapeHtml(m['اسم النشاط'] || '-')}</td>
      <td>${escapeHtml(m['رقم الحساب'] || '-')}</td>
      <td dir="ltr">${escapeHtml(m['رقم الهاتف'] || '-')}</td>
      <td>${escapeHtml(m['المنطقة'] || '-')}</td>
      <td>
        <span class="badge ${m['الحالة'] === 'نشط' ? 'badge-success' : 'badge-warning'}">
          ${escapeHtml(m['الحالة'] || '-')}
        </span>
      </td>
      <td>
        <div class="action-btns">
          <button class="btn btn-primary btn-sm" onclick="window.editMerchant('${m.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="window.deleteMerchant('${m.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function clearMerchantForm() {
  document.getElementById('editMerchantId').value = '';
  document.getElementById('mName').value = '';
  document.getElementById('mActivity').value = '';
  document.getElementById('mAccount').value = '';
  document.getElementById('mPhone').value = '';
  document.getElementById('mArea').value = '';
  document.getElementById('mAddress').value = '';
  document.getElementById('mStatus').value = 'نشط';
  document.getElementById('mNotes').value = '';
}

export async function openMerchantModal(merchant = null) {
  const isEdit = Boolean(merchant);

  document.getElementById('merchantModalTitle').innerHTML = isEdit
    ? '<i class="fas fa-edit"></i> تعديل تاجر'
    : '<i class="fas fa-user-plus"></i> إضافة تاجر جديد';

  if (!isEdit) {
    clearMerchantForm();
  }

  document.getElementById('editMerchantId').value = merchant?.id || '';
  document.getElementById('mName').value = merchant?.['اسم التاجر'] || '';
  document.getElementById('mActivity').value = merchant?.['اسم النشاط'] || '';
  document.getElementById('mAccount').value = merchant?.['رقم الحساب'] || '';
  document.getElementById('mPhone').value = merchant?.['رقم الهاتف'] || '';
  document.getElementById('mArea').value = merchant?.['المنطقة'] || '';
  document.getElementById('mAddress').value = merchant?.['العنوان'] || '';
  document.getElementById('mStatus').value = merchant?.['الحالة'] || 'نشط';
  document.getElementById('mNotes').value = merchant?.['ملاحظات'] || '';

  document.getElementById('merchantModal').classList.add('show');
}

export function closeMerchantModal() {
  document.getElementById('merchantModal')?.classList.remove('show');
  clearMerchantForm();
}

export async function saveMerchant() {
  supabase = supabase || window.supabaseClient;

  const id = document.getElementById('editMerchantId').value;
  const payload = {
    'اسم التاجر': document.getElementById('mName').value.trim(),
    'اسم النشاط': document.getElementById('mActivity').value.trim() || 'غير محدد',
    'رقم الحساب': document.getElementById('mAccount').value.trim(),
    'رقم الهاتف': document.getElementById('mPhone').value.trim(),
    'المنطقة': document.getElementById('mArea').value.trim() || 'غير محدد',
    'العنوان': document.getElementById('mAddress').value.trim(),
    'الحالة': document.getElementById('mStatus').value || 'نشط',
    'ملاحظات': document.getElementById('mNotes').value.trim()
  };

  if (!payload['اسم التاجر']) return showToast('اسم التاجر مطلوب', 'warning');
  if (!payload['رقم الحساب']) return showToast('رقم الحساب مطلوب', 'warning');

  try {
    const existingByAccount = currentMerchants.find(m =>
      m['رقم الحساب'] === payload['رقم الحساب'] && m.id !== id
    );
    if (existingByAccount) {
      return showToast('رقم الحساب مستخدم بالفعل لتاجر آخر', 'warning');
    }

    const normalizedName = normalizeText(payload['اسم التاجر']);
    const duplicateName = currentMerchants.find(m =>
      normalizeText(m['اسم التاجر']) === normalizedName && normalizeText(m['اسم النشاط']) === normalizeText(payload['اسم النشاط']) && m.id !== id
    );
    if (duplicateName) {
      return showToast('يوجد تاجر بنفس الاسم والنشاط بالفعل', 'warning');
    }

    const record = { ...payload };
    if (!id) {
      record['رقم التاجر'] = await generateNextCode(supabase, 'merchants', 'رقم التاجر', { prefix: 'MER', pad: 3 });
      record['تاريخ الإنشاء'] = new Date().toISOString().split('T')[0];
      record['وقت الإنشاء'] = new Date().toTimeString().slice(0, 8);
    }

    await safeMutateRecord(supabase, 'merchants', record, { id });

    showToast(id ? 'تم تحديث التاجر' : 'تم إضافة التاجر', 'success');
    closeMerchantModal();
    await loadMerchants();
    window.populateMerchantDatalists?.();
    window.loadDashboardStats?.();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'فشل حفظ التاجر', 'error');
  }
}

export function editMerchant(id) {
  const merchant = currentMerchants.find(m => m.id === id);
  if (merchant) openMerchantModal(merchant);
}

export function deleteMerchant(id) {
  showConfirm('سيتم حذف التاجر وكل بياناته، هل أنت متأكد؟', async () => {
    supabase = supabase || window.supabaseClient;

    try {
      await supabase.from('machines').delete().eq('رقم التاجر', id);
      await supabase.from('transfers').delete().eq('رقم التاجر', id);
      await supabase.from('collections').delete().eq('رقم التاجر', id);
      await supabase.from('requests').delete().eq('رقم التاجر', id);

      const { error } = await supabase.from('merchants').delete().eq('id', id);
      if (error) throw error;

      showToast('تم حذف التاجر وكل بياناته', 'success');
      await loadMerchants();
      window.populateMerchantDatalists?.();
      window.loadDashboardStats?.();
      window.loadMachines?.();
      window.loadTransfers?.();
      window.loadCollections?.();
      window.loadRequests?.();
    } catch (err) {
      console.error(err);
      showToast('فشل الحذف', 'error');
    }
  });
}

window.openMerchantModal = openMerchantModal;
window.closeMerchantModal = closeMerchantModal;
window.saveMerchant = saveMerchant;
window.editMerchant = editMerchant;
window.deleteMerchant = deleteMerchant;
