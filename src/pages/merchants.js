/**
 * Merchants Page
 * CRUD operations for merchants - مطابق لستايل index.html
 */

import { showToast, showConfirm } from '../ui/toast.js';
import { escapeHtml, formatMoney } from '../utils/formatters.js';

let supabase = null;
let currentMerchants = [];

// تهيئة Supabase (باستخدام window.supabaseClient)
export function initMerchantsPage() {
    supabase = window.supabaseClient;
}

// تحميل وعرض التجار
export async function loadMerchants() {
    if (!supabase) return;
    try {
        const { data, error } = await supabase
            .from('merchants')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        currentMerchants = data || [];
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
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>لا يوجد تجار مسجلين</p>
                  
              
        `;
        return;
    }

    tbody.innerHTML = currentMerchants.map((m, idx) => `
        <tr>
            <td>${idx + 1}  
            <td><code class="ref-code">${escapeHtml(m['رقم التاجر'] || '-')}</code>  
            <td><strong>${escapeHtml(m['اسم التاجر'] || '-')}</strong>  
            <td>${escapeHtml(m['اسم النشاط'] || '-')}  
            <td>${escapeHtml(m['رقم الحساب'] || '-')}  
            <td dir="ltr">${escapeHtml(m['رقم الهاتف'] || '-')}  
            <td>${escapeHtml(m['المنطقة'] || '-')}  
            <td>
                <span class="badge ${m['الحالة'] === 'نشط' ? 'badge-success' : 'badge-danger'}">
                    ${escapeHtml(m['الحالة'] || '-')}
                </span>
              
            <td>
                <div class="action-btns">
                    <button class="btn btn-primary btn-sm" onclick="window.editMerchant('${m.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="window.deleteMerchant('${m.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
              
          
    `).join('');
}

// فتح نافذة إضافة/تعديل تاجر
export function openMerchantModal(merchant = null) {
    const isEdit = !!merchant;
    const modal = document.getElementById('merchantModal');
    const title = document.getElementById('merchantModalTitle');
    
    if (isEdit) {
        title.innerHTML = '<i class="fas fa-edit"></i> تعديل تاجر';
        document.getElementById('editMerchantId').value = merchant.id;
        document.getElementById('mName').value = merchant['اسم التاجر'] || '';
        document.getElementById('mActivity').value = merchant['اسم النشاط'] || '';
        document.getElementById('mAccount').value = merchant['رقم الحساب'] || '';
        document.getElementById('mPhone').value = merchant['رقم الهاتف'] || '';
        document.getElementById('mArea').value = merchant['المنطقة'] || '';
        document.getElementById('mAddress').value = merchant['العنوان'] || '';
        document.getElementById('mStatus').value = merchant['الحالة'] || 'نشط';
        document.getElementById('mNotes').value = merchant['ملاحظات'] || '';
    } else {
        title.innerHTML = '<i class="fas fa-user-plus"></i> إضافة تاجر جديد';
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
    modal.classList.add('show');
    if (window.Sound) window.Sound.play('click');
}

export function closeMerchantModal() {
    document.getElementById('merchantModal').classList.remove('show');
}

// حفظ التاجر (إضافة أو تعديل)
export async function saveMerchant() {
    const id = document.getElementById('editMerchantId').value;
    const merchantData = {
        "اسم التاجر": document.getElementById('mName').value.trim(),
        "اسم النشاط": document.getElementById('mActivity').value.trim(),
        "رقم الحساب": document.getElementById('mAccount').value.trim(),
        "رقم الهاتف": document.getElementById('mPhone').value.trim(),
        "المنطقة": document.getElementById('mArea').value.trim(),
        "العنوان": document.getElementById('mAddress').value.trim(),
        "الحالة": document.getElementById('mStatus').value,
        "ملاحظات": document.getElementById('mNotes').value.trim()
    };

    if (!merchantData["اسم التاجر"]) {
        showToast('اسم التاجر مطلوب', 'warning');
        return;
    }
    if (!merchantData["رقم الحساب"]) {
        showToast('رقم الحساب مطلوب', 'warning');
        return;
    }

    try {
        if (id) {
            const { error } = await supabase
                .from('merchants')
                .update(merchantData)
                .eq('id', id);
            if (error) throw error;
            showToast('تم تحديث التاجر', 'success');
        } else {
            const { error } = await supabase
                .from('merchants')
                .insert([merchantData]);
            if (error) throw error;
            showToast('تم إضافة التاجر', 'success');
        }
        if (window.Sound) window.Sound.play('success');
        closeMerchantModal();
        await loadMerchants();
        if (window.loadDashboardStats) window.loadDashboardStats();
    } catch (err) {
        console.error(err);
        showToast('حدث خطأ: ' + err.message, 'error');
        if (window.Sound) window.Sound.play('error');
    }
}

export async function editMerchant(id) {
    const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', id)
        .single();
    if (error) {
        showToast('خطأ في جلب البيانات', 'error');
        return;
    }
    openMerchantModal(data);
}

export function deleteMerchant(id) {
    showConfirm('هل تريد حذف هذا التاجر؟ لا يمكن التراجع!', async () => {
        try {
            const { error } = await supabase
                .from('merchants')
                .delete()
                .eq('id', id);
            if (error) throw error;
            showToast('تم حذف التاجر', 'success');
            if (window.Sound) window.Sound.play('success');
            await loadMerchants();
            if (window.loadDashboardStats) window.loadDashboardStats();
        } catch (err) {
            showToast('خطأ في الحذف: ' + err.message, 'error');
            if (window.Sound) window.Sound.play('error');
        }
    });
}

// ربط الدوال بالنافذة العامة
window.openMerchantModal = openMerchantModal;
window.closeMerchantModal = closeMerchantModal;
window.saveMerchant = saveMerchant;
window.editMerchant = editMerchant;
window.deleteMerchant = deleteMerchant;
