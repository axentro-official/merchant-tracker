/**
 * Collections Page
 * CRUD operations for collections - مطابق لستايل index.html
 */

import { showToast, showConfirm } from '../ui/toast.js';
import { escapeHtml, formatMoney, formatDate, formatTime } from '../utils/formatters.js';
import { getTodayDate, getCurrentTime } from '../utils/helpers.js';

let supabase = null;
let currentCollections = [];
let merchantsList = [];
let machinesList = [];

// تهيئة Supabase (باستخدام window.supabaseClient)
export function initCollectionsPage() {
    supabase = window.supabaseClient;
}

// تحميل التحصيلات وعرضها
export async function loadCollections() {
    if (!supabase) return;
    try {
        const { data: collections, error } = await supabase
            .from('collections')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        currentCollections = collections || [];
        
        const { data: merchants } = await supabase.from('merchants').select('id, "رقم التاجر", "اسم التاجر", "رقم الحساب", "اسم النشاط"');
        merchantsList = merchants || [];
        const { data: machines } = await supabase.from('machines').select('id, "رقم المكنة"');
        machinesList = machines || [];
        
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
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>لا توجد تحصيلات</p>
                    
                
        `;
        return;
    }

    tbody.innerHTML = currentCollections.map((c, idx) => `
        <tr>
            <td>${idx + 1}  
            <td><code class="ref-code">${escapeHtml(c['الرقم المرجعي'] || '-')}</code>  
            <td>${formatDate(c['التاريخ'])}  
            <td>${formatTime(c['الوقت'])}  
            <td>${escapeHtml(c['اسم التاجر'] || '-')}  
            <td>${escapeHtml(c['اسم النشاط'] || '-')}  
            <td><strong style="color:var(--success);">${formatMoney(c['قيمة التحصيل'])}</strong>  
            <td><strong>${formatMoney(c['المتبقي بعد التحصيل'])}</strong>  
            <td title="${escapeHtml(c['ملاحظات'] || '')}">${escapeHtml(c['ملاحظات'] || '-')}  
            <td>
                <div class="action-btns">
                    <button class="btn btn-primary btn-sm" onclick="window.editCollection('${c.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="window.deleteCollection('${c.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
            
    `).join('');
}

// فتح نافذة إضافة/تعديل تحصيل
export async function openCollectionModal(collection = null) {
    if (!merchantsList.length) {
        const { data } = await supabase.from('merchants').select('id, "رقم التاجر", "اسم التاجر", "رقم الحساب", "اسم النشاط"');
        merchantsList = data || [];
    }
    if (!machinesList.length) {
        const { data } = await supabase.from('machines').select('id, "رقم المكنة"');
        machinesList = data || [];
    }
    
    const isEdit = !!collection;
    const modal = document.getElementById('collectionModal');
    const title = document.getElementById('collectionModalTitle');
    
    const merchantSelect = document.getElementById('collMerchantId');
    if (merchantSelect) {
        merchantSelect.innerHTML = '<option value="">-- اختر تاجر --</option>' +
            merchantsList.map(m => `<option value="${m.id}" ${isEdit && collection['رقم التاجر'] === m.id ? 'selected' : ''}>${m['رقم التاجر']} - ${m['اسم التاجر']}</option>`).join('');
    }
    
    const machineSelect = document.getElementById('collMachineId');
    if (machineSelect) {
        machineSelect.innerHTML = '<option value="">-- بدون مكنة --</option>' +
            machinesList.map(mc => `<option value="${mc.id}" ${isEdit && collection['رقم المكنة'] === mc.id ? 'selected' : ''}>${mc['رقم المكنة']}</option>`).join('');
    }
    
    if (isEdit) {
        title.innerHTML = '<i class="fas fa-edit"></i> تعديل تحصيل';
        document.getElementById('editCollectionId').value = collection.id;
        document.getElementById('collAmount').value = collection['قيمة التحصيل'] || '';
        document.getElementById('collType').value = collection['نوع التحصيل'] || 'نقدي';
        document.getElementById('collNotes').value = collection['ملاحظات'] || '';
    } else {
        title.innerHTML = '<i class="fas fa-hand-holding-usd"></i> تحصيل جديد';
        document.getElementById('editCollectionId').value = '';
        document.getElementById('collAmount').value = '';
        document.getElementById('collType').value = 'نقدي';
        document.getElementById('collNotes').value = '';
        if (merchantSelect) merchantSelect.value = '';
        if (machineSelect) machineSelect.value = '';
    }
    modal.classList.add('show');
    if (window.Sound) window.Sound.play('click');
}

export function closeCollectionModal() {
    document.getElementById('collectionModal').classList.remove('show');
}

// حفظ التحصيل (إضافة أو تعديل)
export async function saveCollection() {
    const id = document.getElementById('editCollectionId').value;
    const merchantId = document.getElementById('collMerchantId').value;
    const machineId = document.getElementById('collMachineId').value;
    const amount = parseFloat(document.getElementById('collAmount').value);
    const type = document.getElementById('collType').value;
    const notes = document.getElementById('collNotes').value.trim();
    
    if (!merchantId) {
        showToast('يرجى اختيار التاجر', 'warning');
        return;
    }
    if (!amount || amount <= 0) {
        showToast('المبلغ غير صحيح', 'warning');
        return;
    }
    
    const merchant = merchantsList.find(m => m.id === merchantId);
    if (!merchant) {
        showToast('التاجر غير موجود', 'error');
        return;
    }
    
    let machineNumber = null;
    if (machineId) {
        const machine = machinesList.find(mc => mc.id === machineId);
        machineNumber = machine ? machine['رقم المكنة'] : null;
    }
    
    const collectionData = {
        "رقم التاجر": merchantId,
        "اسم التاجر": merchant['اسم التاجر'],
        "رقم الحساب": merchant['رقم الحساب'],
        "اسم النشاط": merchant['اسم النشاط'],
        "رقم المكنة": machineNumber,
        "قيمة التحصيل": amount,
        "نوع التحصيل": type,
        "ملاحظات": notes,
        "التاريخ": getTodayDate(),
        "الوقت": getCurrentTime(),
        "الشهر": new Date().toLocaleString('ar-EG', { month: 'long', year: 'numeric' })
    };
    
    try {
        if (id) {
            const { error } = await supabase
                .from('collections')
                .update(collectionData)
                .eq('id', id);
            if (error) throw error;
            showToast('تم تحديث التحصيل', 'success');
        } else {
            const { error } = await supabase
                .from('collections')
                .insert([collectionData]);
            if (error) throw error;
            showToast('تم إضافة التحصيل', 'success');
        }
        if (window.Sound) window.Sound.play('success');
        closeCollectionModal();
        await loadCollections();
        if (window.loadDashboardStats) window.loadDashboardStats();
        if (window.loadRecentActivities) window.loadRecentActivities();
        if (window.loadTopMachines) window.loadTopMachines();
    } catch (err) {
        console.error(err);
        showToast('حدث خطأ: ' + err.message, 'error');
        if (window.Sound) window.Sound.play('error');
    }
}

export async function editCollection(id) {
    const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('id', id)
        .single();
    if (error) {
        showToast('خطأ في جلب البيانات', 'error');
        return;
    }
    openCollectionModal(data);
}

export function deleteCollection(id) {
    showConfirm('هل تريد حذف هذا التحصيل؟ لا يمكن التراجع!', async () => {
        try {
            const { error } = await supabase
                .from('collections')
                .delete()
                .eq('id', id);
            if (error) throw error;
            showToast('تم حذف التحصيل', 'success');
            if (window.Sound) window.Sound.play('success');
            await loadCollections();
            if (window.loadDashboardStats) window.loadDashboardStats();
            if (window.loadRecentActivities) window.loadRecentActivities();
            if (window.loadTopMachines) window.loadTopMachines();
        } catch (err) {
            showToast('خطأ في الحذف: ' + err.message, 'error');
            if (window.Sound) window.Sound.play('error');
        }
    });
}

// ربط الدوال بالنافذة العامة
window.openCollectionModal = openCollectionModal;
window.closeCollectionModal = closeCollectionModal;
window.saveCollection = saveCollection;
window.editCollection = editCollection;
window.deleteCollection = deleteCollection;
