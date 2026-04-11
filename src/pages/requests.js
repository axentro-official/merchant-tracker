/**
 * Requests Page
 * CRUD operations for merchant requests - مطابق لستايل index.html
 * مع دعم: المديونية الحالية، التنبيه كل 5 دقائق، الإدراج في Supabase
 */

import { showToast, showConfirm } from '../ui/toast.js';
import { escapeHtml, formatMoney, formatDate, formatTime } from '../utils/formatters.js';

let supabase = null;
let currentRequests = [];
let merchantsList = [];
let pendingCheckInterval = null;
let lastPendingCount = 0;

// رابط Google Script الثابت
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby5emGQI0R5T8sQls0oOSGL7PUa8AyK5Eya_gFIMo_qLu6ONCHxw0Ewt8Wo6h4N8O2d/exec';

// تهيئة Supabase (باستخدام window.supabaseClient)
export function initRequestsPage() {
    supabase = window.supabaseClient;
    startPendingRequestsChecker();
}

// بدء التنبيه الدوري كل 5 دقائق
function startPendingRequestsChecker() {
    if (pendingCheckInterval) clearInterval(pendingCheckInterval);
    pendingCheckInterval = setInterval(async () => {
        if (!supabase) return;
        try {
            const { count, error } = await supabase
                .from('requests')
                .select('*', { count: 'exact', head: true })
                .eq('الحالة', 'معلق');
            if (!error && count !== null && count !== lastPendingCount && count > 0) {
                lastPendingCount = count;
                showToast(`📋 يوجد ${count} طلب(ات) معلقة جديدة!`, 'warning');
                if (window.Sound) window.Sound.play('warning');
                // تحديث الجدول إذا كان مفتوحاً
                if (document.getElementById('section-requests')?.style.display === 'block') {
                    await loadRequests();
                }
            } else if (count === 0) {
                lastPendingCount = 0;
            }
        } catch(e) { console.warn(e); }
    }, 300000); // 5 دقائق
}

// تحميل الطلبات وعرضها
export async function loadRequests() {
    if (!supabase) return;
    try {
        const { data: requests, error } = await supabase
            .from('requests')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        currentRequests = requests || [];
        
        const { data: merchants } = await supabase.from('merchants').select('id, "رقم التاجر", "اسم التاجر"');
        merchantsList = merchants || [];
        
        // حساب المديونية الحالية لكل طلب
        await enrichRequestsWithCurrentDebt();
        
        renderRequestsTable();
        updatePendingBadge();
    } catch (err) {
        console.error(err);
        showToast('خطأ في تحميل الطلبات', 'error');
    }
}

// حساب المديونية الحالية لكل تاجر بناءً على التحويلات والتحصيلات
async function enrichRequestsWithCurrentDebt() {
    // جلب جميع التحويلات والتحصيلات
    const { data: transfers } = await supabase.from('transfers').select('"رقم التاجر", "قيمة التحويل"');
    const { data: collections } = await supabase.from('collections').select('"رقم التاجر", "قيمة التحصيل"');
    
    const merchantBalance = new Map();
    
    if (transfers) {
        transfers.forEach(t => {
            const merchantId = t['رقم التاجر'];
            const amount = parseFloat(t['قيمة التحويل']) || 0;
            merchantBalance.set(merchantId, (merchantBalance.get(merchantId) || 0) + amount);
        });
    }
    if (collections) {
        collections.forEach(c => {
            const merchantId = c['رقم التاجر'];
            const amount = parseFloat(c['قيمة التحصيل']) || 0;
            merchantBalance.set(merchantId, (merchantBalance.get(merchantId) || 0) - amount);
        });
    }
    
    // إضافة حقل المديونية الحالية لكل طلب
    currentRequests = currentRequests.map(req => {
        const debt = merchantBalance.get(req['رقم التاجر']) || 0;
        return { ...req, currentDebt: Math.max(0, debt) };
    });
}

function renderRequestsTable() {
    const tbody = document.getElementById('requestsTableBody');
    if (!tbody) return;

    if (!currentRequests.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>لا توجد طلبات</p>
                    
                
        `;
        return;
    }

    const statusMap = {
        'معلق': ['معلق', 'badge-warning'],
        'مكتمل': ['مكتمل', 'badge-success'],
        'ملغي': ['ملغي', 'badge-danger'],
        'قيد التنفيذ': ['قيد التنفيذ', 'badge-info']
    };

    tbody.innerHTML = currentRequests.map((r, idx) => {
        const [statusText, statusClass] = statusMap[r['الحالة']] || [r['الحالة'] || 'معلق', 'badge-warning'];
        const convertBtn = r['الحالة'] === 'معلق' 
            ? `<button class="btn btn-success btn-sm" onclick="window.convertRequest('${r.id}')" title="تحويل تلقائي">
                    <i class="fas fa-exchange-alt"></i>
               </button>` 
            : '';
        
        return `
            <tr>
                <td>${idx + 1}  
                <td><code class="ref-code">${escapeHtml(r['رقم الطلب'] || '-')}</code>  
                <td>${formatDate(r['التاريخ'])}  
                <td>${formatTime(r['الوقت'])}  
                <td>${escapeHtml(r['اسم التاجر'] || '-')}  
                <td>${escapeHtml(r['اسم النشاط'] || '-')}  
                <td>${escapeHtml(r['نوع الطلب'] || '-')}  
                <td><strong style="color:var(--danger);">${formatMoney(r['المبلغ'])}</strong>  
                <td><strong style="color:var(--warning);">${formatMoney(r.currentDebt || 0)}</strong>  
                <td>
                    <span class="badge ${statusClass}">${statusText}</span>
                    
                  
                <td>
                    <div class="action-btns">
                        ${convertBtn}
                        <button class="btn btn-danger btn-sm" onclick="window.deleteRequest('${r.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    
              
        `;
    }).join('');
}

// تحديث العدد الظاهر بجانب "الطلبات" في القائمة
function updatePendingBadge() {
    const pendingCount = currentRequests.filter(r => r['الحالة'] === 'معلق').length;
    const badge = document.getElementById('pendingBadge');
    if (badge) {
        if (pendingCount > 0) {
            badge.textContent = pendingCount;
            badge.classList.add('show');
        } else {
            badge.classList.remove('show');
        }
    }
}

// فتح نافذة إضافة طلب (للأدمن)
export async function openRequestModal() {
    if (!merchantsList.length) {
        const { data } = await supabase.from('merchants').select('id, "رقم التاجر", "اسم التاجر", "رقم الحساب", "اسم النشاط"');
        merchantsList = data || [];
    }
    
    const modal = document.getElementById('requestModal');
    const title = document.getElementById('requestModalTitle');
    title.innerHTML = '<i class="fas fa-paper-plane"></i> تقديم طلب جديد';
    
    const merchantSelect = document.getElementById('reqMerchantId');
    if (merchantSelect) {
        merchantSelect.innerHTML = '<option value="">-- اختر تاجر --</option>' +
            merchantsList.map(m => `<option value="${m.id}">${m['رقم التاجر']} - ${m['اسم التاجر']}</option>`).join('');
    }
    
    document.getElementById('editRequestId').value = '';
    document.getElementById('reqType').value = '';
    document.getElementById('reqAmount').value = '';
    document.getElementById('reqNotes').value = '';
    if (merchantSelect) merchantSelect.value = '';
    
    modal.classList.add('show');
    if (window.Sound) window.Sound.play('click');
}

export function closeRequestModal() {
    document.getElementById('requestModal').classList.remove('show');
}

// حفظ طلب جديد (يُرسل إلى Google Script و Supabase)
export async function saveRequest() {
    const merchantId = document.getElementById('reqMerchantId').value;
    const type = document.getElementById('reqType').value;
    const amount = parseFloat(document.getElementById('reqAmount').value);
    const notes = document.getElementById('reqNotes').value.trim();
    
    if (!merchantId) {
        showToast('يرجى اختيار التاجر', 'warning');
        return;
    }
    if (!type) {
        showToast('يرجى اختيار نوع الطلب', 'warning');
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
    
    // حساب المديونية الحالية
    const { data: transfers } = await supabase.from('transfers').select('قيمة التحويل').eq('رقم التاجر', merchantId);
    const { data: collections } = await supabase.from('collections').select('قيمة التحصيل').eq('رقم التاجر', merchantId);
    const totalTransfers = transfers?.reduce((s,t)=>s+(parseFloat(t['قيمة التحويل'])||0),0) || 0;
    const totalCollections = collections?.reduce((s,c)=>s+(parseFloat(c['قيمة التحصيل'])||0),0) || 0;
    const currentDebt = totalTransfers - totalCollections;
    
    const requestData = {
        "رقم التاجر": merchantId,
        "اسم التاجر": merchant['اسم التاجر'],
        "رقم الحساب": merchant['رقم الحساب'],
        "اسم النشاط": merchant['اسم النشاط'],
        "نوع الطلب": type,
        "المبلغ": amount,
        "المديونية الحالية": Math.max(0, currentDebt),
        "ملاحظات": notes,
        "التاريخ": new Date().toISOString().split('T')[0],
        "الوقت": new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        "الحالة": 'معلق'
    };
    
    try {
        // إرسال إلى Google Script (لا ننتظر الرد بسبب mode: 'no-cors')
        fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        }).catch(e => console.warn('Google Script error:', e));
        
        // إدراج في Supabase (الرقم المرجعي يتولد تلقائياً)
        const { error } = await supabase.from('requests').insert([requestData]);
        if (error) throw error;
        
        showToast('تم إرسال الطلب بنجاح', 'success');
        if (window.Sound) window.Sound.play('success');
        closeRequestModal();
        await loadRequests();
    } catch (err) {
        console.error(err);
        showToast('حدث خطأ: ' + err.message, 'error');
        if (window.Sound) window.Sound.play('error');
    }
}

// تحويل طلب إلى تحويل (للأدمن)
export async function convertRequest(requestId) {
    const request = currentRequests.find(r => r.id === requestId);
    if (!request) return;
    
    showConfirm(`تحويل الطلب "${request['رقم الطلب']}" إلى تحويل تلقائي؟`, async () => {
        try {
            // إنشاء تحويل
            const transferData = {
                "رقم التاجر": request['رقم التاجر'],
                "اسم التاجر": request['اسم التاجر'],
                "رقم الحساب": request['رقم الحساب'],
                "اسم النشاط": request['اسم النشاط'],
                "نوع التحويل": "رصيد خدمات",
                "قيمة التحويل": request['المبلغ'],
                "ملاحظات": `تحويل تلقائي من طلب: ${request['رقم الطلب']}`,
                "التاريخ": new Date().toISOString().split('T')[0],
                "الوقت": new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                "الشهر": new Date().toLocaleString('ar-EG', { month: 'long', year: 'numeric' })
            };
            const { error: transferError } = await supabase.from('transfers').insert([transferData]);
            if (transferError) throw transferError;
            
            // تحديث حالة الطلب
            const { error: updateError } = await supabase
                .from('requests')
                .update({ "الحالة": "مكتمل" })
                .eq('id', requestId);
            if (updateError) throw updateError;
            
            showToast('تم تحويل الطلب بنجاح', 'success');
            if (window.Sound) window.Sound.play('success');
            await loadRequests();
            if (window.loadDashboardStats) window.loadDashboardStats();
            if (window.loadRecentActivities) window.loadRecentActivities();
            if (window.loadTopMachines) window.loadTopMachines();
        } catch (err) {
            showToast('خطأ في التحويل: ' + err.message, 'error');
            if (window.Sound) window.Sound.play('error');
        }
    });
}

// حذف طلب
export function deleteRequest(requestId) {
    showConfirm('هل تريد حذف هذا الطلب؟ لا يمكن التراجع!', async () => {
        try {
            const { error } = await supabase
                .from('requests')
                .delete()
                .eq('id', requestId);
            if (error) throw error;
            showToast('تم حذف الطلب', 'success');
            if (window.Sound) window.Sound.play('success');
            await loadRequests();
        } catch (err) {
            showToast('خطأ في الحذف: ' + err.message, 'error');
            if (window.Sound) window.Sound.play('error');
        }
    });
}

// ربط الدوال بالنافذة العامة
window.openRequestModal = openRequestModal;
window.closeRequestModal = closeRequestModal;
window.saveRequest = saveRequest;
window.convertRequest = convertRequest;
window.deleteRequest = deleteRequest;
