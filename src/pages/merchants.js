
import { showToast, showConfirm } from '../ui/toast.js';
import { escapeHtml } from '../utils/formatters.js';

let supabase = null;
let currentMerchants = [];

export function initMerchantsPage() { supabase = window.supabaseClient; }

export async function loadMerchants() {
  supabase = supabase || window.supabaseClient;
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from('merchants').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    currentMerchants = data || [];
    renderMerchantsTable();
  } catch (err) { console.error(err); showToast('خطأ في تحميل التجار', 'error'); }
}

function renderMerchantsTable() {
  const tbody = document.getElementById('merchantsTableBody');
  if (!tbody) return;
  if (!currentMerchants.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state"><i class="fas fa-inbox"></i> لا يوجد تجار مسجلين</td></tr>';
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
      <td><span class="badge ${m['الحالة'] === 'نشط' ? 'badge-success' : 'badge-warning'}">${escapeHtml(m['الحالة'] || '-')}</span></td>
      <td>
        <div class="action-btns">
          <button class="btn btn-primary btn-sm" onclick="window.editMerchant('${m.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger btn-sm" onclick="window.deleteMerchant('${m.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
}

export function openMerchantModal(merchant = null) {
  const isEdit = Boolean(merchant);
  document.getElementById('merchantModalTitle').innerHTML = isEdit ? '<i class="fas fa-edit"></i> تعديل تاجر' : '<i class="fas fa-user-plus"></i> إضافة تاجر جديد';
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

export function closeMerchantModal() { document.getElementById('merchantModal')?.classList.remove('show'); }

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
    const query = id ? supabase.from('merchants').update(payload).eq('id', id) : supabase.from('merchants').insert([payload]);
    const { error } = await query;
    if (error) throw error;
    showToast(id ? 'تم تحديث التاجر' : 'تم إضافة التاجر', 'success');
    closeMerchantModal();
    await loadMerchants();
    window.loadDashboardStats?.();
  } catch (err) { console.error(err); showToast(err.message || 'فشل حفظ التاجر', 'error'); }
}

export async function editMerchant(id) {
  supabase = supabase || window.supabaseClient;
  const merchant = currentMerchants.find(m => m.id === id);
  if (merchant) return openMerchantModal(merchant);
  const { data, error } = await supabase.from('merchants').select('*').eq('id', id).single();
  if (error) return showToast('تعذر جلب بيانات التاجر', 'error');
  openMerchantModal(data);
}

export function deleteMerchant(id) {
  showConfirm('هل تريد حذف هذا التاجر؟ لا يمكن التراجع!', async () => {
    supabase = supabase || window.supabaseClient;
    const { error } = await supabase.from('merchants').delete().eq('id', id);
    if (error) return showToast(error.message, 'error');
    showToast('تم حذف التاجر', 'success');
    await loadMerchants();
    window.loadDashboardStats?.();
  });
}

window.openMerchantModal = openMerchantModal;
window.closeMerchantModal = closeMerchantModal;
window.saveMerchant = saveMerchant;
window.editMerchant = editMerchant;
window.deleteMerchant = deleteMerchant;
