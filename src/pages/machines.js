/**
 * Machines Page
 * CRUD operations for machines - مطابق لستايل index.html
 * مع دعم الكاميرا والبحث في التجار
 */

import { showToast, showConfirm } from '../ui/toast.js';
import { escapeHtml, formatMoney } from '../utils/formatters.js';

let supabase = null;
let currentMachines = [];
let merchantsList = [];

// تهيئة Supabase (باستخدام window.supabaseClient)
export function initMachinesPage() {
    supabase = window.supabaseClient;
}

// تحميل المكن وعرضه
export async function loadMachines() {
    if (!supabase) return;
    try {
        const { data: machines, error } = await supabase
            .from('machines')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        currentMachines = machines || [];
        
        const { data: merchants } = await supabase
            .from('merchants')
            .select('id, "رقم التاجر", "اسم التاجر", "اسم النشاط", "رقم الحساب"');
        merchantsList = merchants || [];
        
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
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>لا توجد مكن مسجلة</p>
                  
              
        `;
        return;
    }

    tbody.innerHTML = currentMachines.map((m, idx) => {
        const merchant = merchantsList.find(mer => mer.id === m['رقم التاجر']);
        const merchantName = merchant ? merchant['اسم التاجر'] : '—';
        const merchantActivity = merchant ? merchant['اسم النشاط'] : '—';
        const target = parseFloat(m['التارجت الشهري']) || 0;
        const achieved = parseFloat(m['المحقق']) || 0;
        
        return `
            <tr>
                <td>${idx + 1}  
                <td><code class="ref-code">${escapeHtml(m['رقم المكنة'] || '-')}</code>  
                <td>${escapeHtml(merchantName)}  
                <td>${escapeHtml(merchantActivity)}  
                <td><code>${escapeHtml(m['الرقم التسلسلي'] || '-')}</code>  
                <td>${formatMoney(target)}  
                <td>
                    <span class="badge ${m['الحالة'] === 'نشطة' ? 'badge-success' : 'badge-danger'}">
                        ${escapeHtml(m['الحالة'] || '-')}
                    </span>
                  
                <td>
                    <div class="action-btns">
                        <button class="btn btn-primary btn-sm" onclick="window.editMachine('${m.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="window.deleteMachine('${m.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                  
              
        `;
    }).join('');
}

// فتح نافذة إضافة/تعديل مكنة
export async function openMachineModal(machine = null) {
    if (!merchantsList.length) {
        const { data } = await supabase.from('merchants').select('id, "رقم التاجر", "اسم التاجر", "رقم الحساب", "اسم النشاط"');
        merchantsList = data || [];
    }
    
    const isEdit = !!machine;
    const modal = document.getElementById('machineModal');
    const title = document.getElementById('machineModalTitle');
    
    // تعبئة قائمة التجار في datalist (تم بالفعل في index.html، ولكن نحدثها)
    const datalist = document.getElementById('merchantDatalist');
    if (datalist) {
        datalist.innerHTML = merchantsList.map(m => 
            `<option value="${m['رقم التاجר']}">${m['رقم التاجر']} - ${m['اسم التاجر']}</option>`
        ).join('');
    }
    
    // حقل البحث عن التاجر
    const searchInput = document.getElementById('machMerchantSearch');
    const hiddenId = document.getElementById('machMerchantId');
    
    if (isEdit && machine) {
        const merchant = merchantsList.find(m => m.id === machine['رقم التاجر']);
        if (merchant && searchInput) {
            searchInput.value = merchant['رقم التاجر'];
            if (hiddenId) hiddenId.value = merchant.id;
        }
        title.innerHTML = '<i class="fas fa-edit"></i> تعديل مكنة';
        document.getElementById('editMachineId').value = machine.id;
        document.getElementById('machSerial').value = machine['الرقم التسلسلي'] || '';
        document.getElementById('machTarget').value = machine['التارجت الشهري'] || '';
        document.getElementById('machStatus').value = machine['الحالة'] || 'نشطة';
        document.getElementById('machNotes').value = machine['ملاحظات'] || '';
    } else {
        title.innerHTML = '<i class="fas fa-plus-circle"></i> إضافة مكنة جديدة';
        document.getElementById('editMachineId').value = '';
        if (searchInput) searchInput.value = '';
        if (hiddenId) hiddenId.value = '';
        document.getElementById('machSerial').value = '';
        document.getElementById('machTarget').value = '';
        document.getElementById('machStatus').value = 'نشطة';
        document.getElementById('machNotes').value = '';
    }
    
    modal.classList.add('show');
    if (window.Sound) window.Sound.play('click');
}

export function closeMachineModal() {
    document.getElementById('machineModal').classList.remove('show');
}

// حفظ المكنة (إضافة أو تعديل)
export async function saveMachine() {
    const id = document.getElementById('editMachineId').value;
    const merchantId = document.getElementById('machMerchantId').value;
    const serial = document.getElementById('machSerial').value.trim();
    const target = parseFloat(document.getElementById('machTarget').value) || 0;
    const status = document.getElementById('machStatus').value;
    const notes = document.getElementById('machNotes').value.trim();
    
    if (!merchantId) {
        showToast('يرجى اختيار التاجر', 'warning');
        return;
    }
    if (!serial) {
        showToast('الرقم التسلسلي مطلوب', 'warning');
        return;
    }
    
    const merchant = merchantsList.find(m => m.id === merchantId);
    if (!merchant) {
        showToast('التاجر غير موجود', 'error');
        return;
    }
    
    const machineData = {
        "رقم التاجر": merchantId,
        "اسم التاجر": merchant['اسم التاجر'],
        "رقم الحساب": merchant['رقم الحساب'],
        "اسم النشاط": merchant['اسم النشاط'],
        "الرقم التسلسلي": serial,
        "التارجت الشهري": target,
        "الحالة": status,
        "ملاحظات": notes
    };
    
    try {
        if (id) {
            const { error } = await supabase
                .from('machines')
                .update(machineData)
                .eq('id', id);
            if (error) throw error;
            showToast('تم تحديث المكنة', 'success');
        } else {
            const { error } = await supabase
                .from('machines')
                .insert([machineData]);
            if (error) throw error;
            showToast('تم إضافة المكنة', 'success');
        }
        if (window.Sound) window.Sound.play('success');
        closeMachineModal();
        await loadMachines();
        if (window.loadDashboardStats) window.loadDashboardStats();
    } catch (err) {
        console.error(err);
        showToast('حدث خطأ: ' + err.message, 'error');
        if (window.Sound) window.Sound.play('error');
    }
}

export async function editMachine(id) {
    const { data, error } = await supabase
        .from('machines')
        .select('*')
        .eq('id', id)
        .single();
    if (error) {
        showToast('خطأ في جلب البيانات', 'error');
        return;
    }
    openMachineModal(data);
}

export function deleteMachine(id) {
    showConfirm('هل تريد حذف هذه المكنة؟ لا يمكن التراجع!', async () => {
        try {
            const { error } = await supabase
                .from('machines')
                .delete()
                .eq('id', id);
            if (error) throw error;
            showToast('تم حذف المكنة', 'success');
            if (window.Sound) window.Sound.play('success');
            await loadMachines();
            if (window.loadDashboardStats) window.loadDashboardStats();
        } catch (err) {
            showToast('خطأ في الحذف: ' + err.message, 'error');
            if (window.Sound) window.Sound.play('error');
        }
    });
}

// ربط الدوال بالنافذة العامة
window.openMachineModal = openMachineModal;
window.closeMachineModal = closeMachineModal;
window.saveMachine = saveMachine;
window.editMachine = editMachine;
window.deleteMachine = deleteMachine;
