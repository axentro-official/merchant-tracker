/**
 * Transfers Page
 * CRUD operations for transfers - مطابق لستايل index.html
 */

import { getSupabase } from '../config/supabase.js';
import { showToast, showConfirm } from '../ui/toast.js';
import { escapeHtml, formatMoney, formatDate, formatTime } from '../utils/formatters.js';
import { getTodayDate, getCurrentTime } from '../utils/helpers.js';

let supabase = null;
let currentTransfers = [];
let merchantsList = [];
let machinesList = [];

// تهيئة Supabase
export function initTransfersPage() {
    supabase = getSupabase();
}

// تحميل التحويلات وعرضها
export async function loadTransfers() {
    if (!supabase) return;
    try {
        // جلب التحويلات مع بيانات التاجر (يمكن استخدام join لكن سنكتفي بالحقل الموجود)
        const { data: transfers, error } = await supabase
            .from('transfers')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        currentTransfers = transfers || [];
        
        // جلب التجار والمكن للاستخدام في الحقول المساعدة (اختياري)
        const { data: merchants } = await supabase.from('merchants').select('id, "رقم التاجر", "اسم التاجر", "رقم الحساب", "اسم النشاط"');
        merchantsList = merchants || [];
        const { data: machines } = await supabase.from('machines').select('id, "رقم المكنة"');
        machinesList = machines || [];
        
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
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>لا توجد تحويلات</p>
                 </td>
             </tr>
        `;
        return;
    }

    tbody.innerHTML = currentTransfers.map((t, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td><code class="ref-code">${escapeHtml(t['الرقم المرجعي'] || '-')}</code></td>
            <td>${formatDate(t['التاريخ'])}</td>
            <td>${formatTime(t['الوقت'])}</td>
            <td>${escapeHtml(t['اسم التاجر'] || '-')}</td>
            <td>${escapeHtml(t['اسم النشاط'] || '-')}</td>
            <td><strong style="color:var(--danger);">${formatMoney(t['قيمة التحويل'])}</strong></td>
            <td title="${escapeHtml(t['ملاحظات'] || '')}">${escapeHtml(t['ملاحظات'] || '-')}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-primary btn-sm" onclick="window.editTransfer('${t.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="window.deleteTransfer('${t.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
             </td>
         </tr>
    `).join('');
}

// فتح نافذة إضافة/تعديل تحويل
export async function openTransferModal(transfer = null) {
    // تأكد من تحميل قائمة التجار والمكن
    if (!merchantsList.length) {
        const { data } = await supabase.from('merchants').select('id, "رقم التاجر", "اسم التاجر", "رقم الحساب", "اسم النشاط"');
        merchantsList = data || [];
    }
    if (!machinesList.length) {
        const { data } = await supabase.from('machines').select('id, "رقم المكنة"');
        machinesList = data || [];
    }
    
    const isEdit = !!transfer;
    const modal = document.getElementById('transferModal');
    const title = document.getElementById('transferModalTitle');
    
    // تعبئة قائمة التجار
    const merchantSelect = document.getElementById('transMerchantId');
    if (merchantSelect) {
        merchantSelect.innerHTML = '<option value="">-- اختر تاجر --</option>' +
            merchantsList.map(m => `<option value="${m.id}" ${isEdit && transfer['رقم التاجر'] === m.id ? 'selected' : ''}>${m['رقم التاجر']} - ${m['اسم التاجر']}</option>`).join('');
    }
    
    // تعبئة قائمة المكن (اختياري)
    const machineSelect = document.getElementById('transMachineId');
    if (machineSelect) {
        machineSelect.innerHTML = '<option value="">-- بدون مكنة --</option>' +
            machinesList.map(mc => `<option value="${mc.id}" ${isEdit && transfer['رقم المكنة'] === mc.id ? 'selected' : ''}>${mc['رقم المكنة']}</option>`).join('');
    }
    
    if (isEdit) {
        title.innerHTML = '<i class="fas fa-edit"></i> تعديل تحويل';
        document.getElementById('editTransferId').value = transfer.id;
        document.getElementById('transAmount').value = transfer['قيمة التحويل'] || '';
        document.getElementById('transType').value = transfer['نوع التحويل'] || 'نقدي';
        document.getElementById('transNotes').value = transfer['ملاحظات'] || '';
    } else {
        title.innerHTML = '<i class="fas fa-exchange-alt"></i> تحويل جديد';
        document.getElementById('editTransferId').value = '';
        document.getElementById('transAmount').value = '';
        document.getElementById('transType').value = 'نقدي';
        document.getElementById('transNotes').value = '';
        if (merchantSelect) merchantSelect.value = '';
        if (machineSelect) machineSelect.value = '';
    }
    modal.classList.add('show');
    if (window.Sound) window.Sound.play('click');
}

export function closeTransferModal() {
    document.getElementById('transferModal').classList.remove('show');
}

// حفظ التحويل (إضافة أو تعديل)
export async function saveTransfer() {
    const id = document.getElementById('editTransferId').value;
    const merchantId = document.getElementById('transMerchantId').value;
    const machineId = document.getElementById('transMachineId').value;
    const amount = parseFloat(document.getElementById('transAmount').value);
    const type = document.getElementById('transType').value;
    const notes = document.getElementById('transNotes').value.trim();
    
    if (!merchantId) {
        showToast('يرجى اختيار التاجر', 'warning');
        return;
    }
    if (!amount || amount <= 0) {
        showToast('المبلغ غير صحيح', 'warning');
        return;
    }
    
    // جلب بيانات التاجر
    const merchant = merchantsList.find(m => m.id === merchantId);
    if (!merchant) {
        showToast('التاجر غير موجود', 'error');
        return;
    }
    
    // جلب رقم المكنة إذا وجد
    let machineNumber = null;
    if (machineId) {
        const machine = machinesList.find(mc => mc.id === machineId);
        machineNumber = machine ? machine['رقم المكنة'] : null;
    }
    
    const transferData = {
        "رقم التاجر": merchantId,
        "اسم التاجر": merchant['اسم التاجر'],
        "رقم الحساب": merchant['رقم الحساب'],
        "اسم النشاط": merchant['اسم النشاط'],
        "رقم المكنة": machineNumber,
        "قيمة التحويل": amount,
        "نوع التحويل": type,
        "ملاحظات": notes,
        "التاريخ": getTodayDate(),
        "الوقت": getCurrentTime(),
        "الشهر": new Date().toLocaleString('ar-EG', { month: 'long', year: 'numeric' }) // سيتم تعبئتها تلقائياً في DB أيضاً
    };
    
    try {
        if (id) {
            // تحديث (نحتفظ بالتاريخ والوقت الأصليين)
            const { error } = await supabase
                .from('transfers')
                .update(transferData)
                .eq('id', id);
            if (error) throw error;
            showToast('تم تحديث التحويل', 'success');
        } else {
            // إضافة جديدة (الرقم المرجعي يتولد تلقائياً من قاعدة البيانات)
            const { error } = await supabase
                .from('transfers')
                .insert([transferData]);
            if (error) throw error;
            showToast('تم إضافة التحويل', 'success');
        }
        if (window.Sound) window.Sound.play('success');
        closeTransferModal();
        await loadTransfers();
        // تحديث إحصائيات لوحة التحكم
        if (window.loadDashboardStats) window.loadDashboardStats();
        if (window.loadRecentActivities) window.loadRecentActivities();
        if (window.loadTopMachines) window.loadTopMachines();
    } catch (err) {
        console.error(err);
        showToast('حدث خطأ: ' + err.message, 'error');
        if (window.Sound) window.Sound.play('error');
    }
}

// جلب تحويل للتعديل
export async function editTransfer(id) {
    const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .eq('id', id)
        .single();
    if (error) {
        showToast('خطأ في جلب البيانات', 'error');
        return;
    }
    openTransferModal(data);
}

// حذف تحويل
export function deleteTransfer(id) {
    showConfirm('هل تريد حذف هذا التحويل؟ لا يمكن التراجع!', async () => {
        try {
            const { error } = await supabase
                .from('transfers')
                .delete()
                .eq('id', id);
            if (error) throw error;
            showToast('تم حذف التحويل', 'success');
            if (window.Sound) window.Sound.play('success');
            await loadTransfers();
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
window.openTransferModal = openTransferModal;
window.closeTransferModal = closeTransferModal;
window.saveTransfer = saveTransfer;
window.editTransfer = editTransfer;
window.deleteTransfer = deleteTransfer;
