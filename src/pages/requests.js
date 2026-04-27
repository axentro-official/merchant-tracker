/**
 * Requests Page
 * CRUD operations for merchant requests - مطابق لستايل index.html
 * مع دعم: المديونية الحالية، التنبيه كل 5 دقائق، الإدراج في Supabase
 */

import { showToast, showConfirm } from '../ui/toast.js';
import { escapeHtml, formatMoney, formatDate, formatTime } from '../utils/formatters.js';
import { sendRequestEmailNotification } from '../services/networkService.js';
import { generateNextCode } from '../services/referenceService.js';

let supabase = null;
let currentRequests = [];
let merchantsList = [];
let pendingCheckInterval = null;
let lastPendingCount = 0;


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

                if (document.getElementById('section-requests')?.style.display === 'block') {
                    await loadRequests();
                }
            } else if (count === 0) {
                lastPendingCount = 0;
            }
        } catch (e) {
            console.warn(e);
        }
    }, 300000);
}

function getNowDate() {
    return new Date().toISOString().split('T')[0];
}

function getNowTime12h() {
    return new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function getCurrentMonthLabel() {
    return new Date().toLocaleString('ar-EG', {
        month: 'long',
        year: 'numeric'
    });
}

async function syncGoogleScript(payload) {
    if (!payload || payload.action !== 'create_request') return null;

    const merchant = merchantsList.find(m => m.id === payload['رقم التاجر']) || {};
    const { data: machines } = await supabase
        .from('machines')
        .select('"رقم المكنة", "الرقم التسلسلي", "الحالة", "ملاحظات"')
        .eq('رقم التاجر', payload['رقم التاجر']);

    return sendRequestEmailNotification({
        merchant: {
            code: merchant['رقم التاجر'] || '',
            name: payload['اسم التاجر'] || merchant['اسم التاجر'] || '',
            phone: merchant['رقم الهاتف'] || '',
            area: merchant['المنطقة'] || '',
            status: merchant['الحالة'] || '',
            accountNumber: payload['رقم الحساب'] || merchant['رقم الحساب'] || ''
        },
        request: {
            code: payload['رقم الطلب'] || 'REQUEST-PENDING',
            requestType: payload['نوع الطلب'] || '',
            amount: payload['المبلغ'] || 0,
            notes: payload['ملاحظات'] || '',
            date: payload['التاريخ'] || getNowDate()
        },
        machines: (machines || []).map(machine => ({
            code: machine['رقم المكنة'] || '',
            serial: machine['الرقم التسلسلي'] || '',
            status: machine['الحالة'] || '',
            location: machine['ملاحظات'] || ''
        })),
        remainingBalance: payload['المديونية الحالية'] || 0
    }, { timeoutMs: 12000 });
}

function safeText(value) {
    return escapeHtml(value ?? '-');
}

function getMerchantIdentityMap() {
    const map = new Map();
    merchantsList.forEach(merchant => {
        map.set(merchant.id, merchant);
    });
    return map;
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

        const { data: merchants } = await supabase
            .from('merchants')
            .select('id, "رقم التاجر", "اسم التاجر", "رقم الحساب", "اسم النشاط"');

        merchantsList = merchants || [];

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
    const { data: transfers } = await supabase
        .from('transfers')
        .select('"رقم التاجر", "قيمة التحويل"');

    const { data: collections } = await supabase
        .from('collections')
        .select('"رقم التاجر", "قيمة التحصيل"');

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

    const merchantMap = getMerchantIdentityMap();

    currentRequests = currentRequests.map(req => {
        const debt = merchantBalance.get(req['رقم التاجر']) || 0;
        const merchant = merchantMap.get(req['رقم التاجر']);

        return {
            ...req,
            currentDebt: Math.max(0, debt),
            normalizedMerchantNumber: req['رقم التاجر'] || merchant?.['رقم التاجر'] || '-',
            normalizedMerchantName: req['اسم التاجر'] || merchant?.['اسم التاجر'] || '-',
            normalizedActivityName: req['اسم النشاط'] || merchant?.['اسم النشاط'] || '-',
            normalizedAccountNumber: req['رقم الحساب'] || merchant?.['رقم الحساب'] || '-'
        };
    });
}

function renderRequestsTable() {
    const tbody = document.getElementById('requestsTableBody');
    if (!tbody) return;

    const visibleRequests = currentRequests.filter(r => r['الحالة'] === 'معلق');

    if (!visibleRequests.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>لا توجد طلبات معلقة</p>
                </td>
            </tr>
        `;
        return;
    }

    const statusMap = {
        'معلق': ['معلق', 'badge-warning'],
        'مكتمل': ['مكتمل', 'badge-success'],
        'ملغي': ['ملغي', 'badge-danger'],
        'قيد التنفيذ': ['قيد التنفيذ', 'badge-info']
    };

    tbody.innerHTML = visibleRequests.map((r, idx) => {
        const [statusText, statusClass] = statusMap[r['الحالة']] || [r['الحالة'] || 'معلق', 'badge-warning'];
        const convertBtn = r['الحالة'] === 'معلق'
            ? `
                <button class="btn btn-success btn-sm" onclick="window.convertRequest('${r.id}')" title="تحويل تلقائي">
                    <i class="fas fa-exchange-alt"></i>
                </button>
              `
            : '';

        return `
            <tr>
                <td>${idx + 1}</td>
                <td><code class="ref-code">${safeText(r['رقم الطلب'])}</code></td>
                <td>${formatDate(r['التاريخ'])}</td>
                <td>${safeText(r.normalizedMerchantName)}</td>
                <td>${safeText(r['نوع الطلب'])}</td>
                <td><strong style="color:var(--danger);">${formatMoney(r['المبلغ'])}</strong></td>
                <td><strong style="color:var(--warning);">${formatMoney(r.currentDebt || 0)}</strong></td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="action-btns">
                        ${convertBtn}
                        <button class="btn btn-danger btn-sm" onclick="window.deleteRequest('${r.id}')" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
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
        const { data } = await supabase
            .from('merchants')
            .select('id, "رقم التاجر", "اسم التاجر", "رقم الحساب", "اسم النشاط"');

        merchantsList = data || [];
    }

    const modal = document.getElementById('requestModal');
    const title = document.getElementById('requestModalTitle');
    const merchantSelect = document.getElementById('reqMerchantId');

    if (title) {
        title.innerHTML = '<i class="fas fa-paper-plane"></i> تقديم طلب جديد';
    }

    if (merchantSelect) {
        merchantSelect.innerHTML =
            '<option value="">-- اختر تاجر --</option>' +
            merchantsList.map(m =>
                `<option value="${m.id}">${escapeHtml(m['رقم التاجر'])} - ${escapeHtml(m['اسم التاجر'])}</option>`
            ).join('');
    }

    const editRequestId = document.getElementById('editRequestId');
    const reqType = document.getElementById('reqType');
    const reqAmount = document.getElementById('reqAmount');
    const reqNotes = document.getElementById('reqNotes');

    if (editRequestId) editRequestId.value = '';
    if (reqType) reqType.value = '';
    if (reqAmount) reqAmount.value = '';
    if (reqNotes) reqNotes.value = '';
    if (merchantSelect) merchantSelect.value = '';

    modal?.classList.add('show');

    if (window.Sound) window.Sound.play('click');
}

export function closeRequestModal() {
    document.getElementById('requestModal')?.classList.remove('show');
}

// حفظ طلب جديد
export async function saveRequest() {
    const merchantId = document.getElementById('reqMerchantId')?.value || '';
    const type = document.getElementById('reqType')?.value || '';
    const amount = parseFloat(document.getElementById('reqAmount')?.value);
    const notes = (document.getElementById('reqNotes')?.value || '').trim();

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

    const { data: transfers, error: transfersError } = await supabase
        .from('transfers')
        .select('قيمة التحويل')
        .eq('رقم التاجر', merchantId);

    if (transfersError) {
        console.error(transfersError);
        showToast('تعذر احتساب مديونية التاجر', 'error');
        return;
    }

    const { data: collections, error: collectionsError } = await supabase
        .from('collections')
        .select('قيمة التحصيل')
        .eq('رقم التاجر', merchantId);

    if (collectionsError) {
        console.error(collectionsError);
        showToast('تعذر احتساب مديونية التاجر', 'error');
        return;
    }

    const totalTransfers = transfers?.reduce((s, t) => s + (parseFloat(t['قيمة التحويل']) || 0), 0) || 0;
    const totalCollections = collections?.reduce((s, c) => s + (parseFloat(c['قيمة التحصيل']) || 0), 0) || 0;
    const currentDebt = totalTransfers - totalCollections;

    const requestData = {
        'رقم التاجر': merchantId,
        'اسم التاجر': merchant['اسم التاجر'],
        'رقم الحساب': merchant['رقم الحساب'],
        'اسم النشاط': merchant['اسم النشاط'],
        'نوع الطلب': type,
        'المبلغ': amount,
        'المديونية الحالية': Math.max(0, currentDebt),
        'ملاحظات': notes,
        'التاريخ': getNowDate(),
        'الوقت': getNowTime12h(),
        'الحالة': 'معلق'
    };

    try {
        const { data: insertedRows, error } = await supabase
            .from('requests')
            .insert([requestData])
            .select('id, "رقم الطلب"');

        if (error) throw error;

        const emailResult = await syncGoogleScript({
            action: 'create_request',
            ...requestData,
            'رقم الطلب': insertedRows?.[0]?.['رقم الطلب'] || 'REQUEST-PENDING'
        }).catch(err => ({ error: err?.message || String(err) }));

        showToast(emailResult?.error ? 'تم حفظ الطلب، لكن تعذر إرسال الإيميل الآن' : 'تم إرسال الطلب بنجاح', emailResult?.error ? 'warning' : 'success');
        if (window.Sound) window.Sound.play('success');

        closeRequestModal();
        await loadRequests();
    } catch (err) {
        console.error(err);
        showToast('حدث خطأ: ' + err.message, 'error');
        if (window.Sound) window.Sound.play('error');
    }
}

function normalizeRequestTransferType(requestType) {
    const raw = String(requestType || '').trim();
    if (raw === 'رصيد خدمات') return 'رصيد خدمات';
    if (raw === 'كاش على المكنة' || raw === 'رصيد كاش') return 'رصيد كاش';
    return 'أخرى';
}

async function generateTransferReference() {
    return await generateNextCode(supabase, 'transfers', 'الرقم المرجعي', { prefix: 'TRF', pad: 5 });
}

function uniqueNonEmpty(values) {
    return [...new Set((values || []).map(v => String(v ?? '').trim()).filter(Boolean))];
}

async function resolveMachineCodeForRequest(request) {
    const directMachineCode = String(request?.['رقم المكنة'] || '').trim();
    if (directMachineCode) return directMachineCode;

    const merchantCandidates = uniqueNonEmpty([
        request?.['رقم التاجر'],
        request?.merchant_id,
        request?.normalizedMerchantCode,
        request?.['merchant_number']
    ]);

    const accountCandidates = uniqueNonEmpty([
        request?.['رقم الحساب'],
        request?.normalizedAccountNumber,
        request?.account_number
    ]);

    const merchantNameCandidates = uniqueNonEmpty([
        request?.['اسم التاجر'],
        request?.normalizedMerchantName
    ]);

    try {
        const orParts = [];
        merchantCandidates.forEach(value => orParts.push(`رقم التاجر.eq.${value}`));
        accountCandidates.forEach(value => orParts.push(`رقم الحساب.eq.${value}`));
        merchantNameCandidates.forEach(value => orParts.push(`اسم التاجر.eq.${value}`));

        if (!orParts.length) return '';

        const { data, error } = await supabase
            .from('machines')
            .select('"رقم المكنة", "الحالة", created_at')
            .or(orParts.join(','));

        if (error) {
            console.warn('تعذر جلب المكنة المرتبطة بالطلب:', error.message);
            return '';
        }

        const machines = (data || [])
            .filter(machine => String(machine['رقم المكنة'] || '').trim())
            .sort((a, b) => {
                const aActive = ['نشط', 'نشطة'].includes(String(a['الحالة'] || '').trim()) ? 0 : 1;
                const bActive = ['نشط', 'نشطة'].includes(String(b['الحالة'] || '').trim()) ? 0 : 1;
                if (aActive !== bActive) return aActive - bActive;
                return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            });

        return machines[0]?.['رقم المكنة'] || '';
    } catch (error) {
        console.warn('خطأ أثناء تحديد مكنة الطلب:', error);
        return '';
    }
}

async function insertTransferFromRequest(transferData) {
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
        const payload = {
            ...transferData,
            'الرقم المرجعي': await generateTransferReference()
        };

        const { data, error } = await supabase
            .from('transfers')
            .insert([payload])
            .select('id, "الرقم المرجعي"')
            .single();

        if (!error) return data;

        lastError = error;
        const msg = String(error.message || '');
        if (!msg.includes('duplicate key') && error.code !== '23505') {
            throw error;
        }
    }

    throw lastError || new Error('تعذر توليد رقم مرجعي فريد للتحويل');
}

// تحويل طلب إلى تحويل (للأدمن)
export async function convertRequest(requestId) {
    const request = currentRequests.find(r => r.id === requestId);
    if (!request) return;

    showConfirm(`تحويل الطلب "${request['رقم الطلب']}" إلى تحويل تلقائي؟`, async () => {
        try {
            const resolvedMachineCode = await resolveMachineCodeForRequest(request);

            const transferData = {
                'رقم التاجر': request['رقم التاجر'],
                'اسم التاجر': request.normalizedMerchantName || request['اسم التاجر'],
                'رقم الحساب': request.normalizedAccountNumber || request['رقم الحساب'],
                'اسم النشاط': request.normalizedActivityName || request['اسم النشاط'],
                'نوع التحويل': normalizeRequestTransferType(request['نوع الطلب']),
                'قيمة التحويل': request['المبلغ'],
                'رقم المكنة': resolvedMachineCode || null,
                'ملاحظات': `تحويل تلقائي من طلب: ${request['رقم الطلب']}`,
                'التاريخ': getNowDate(),
                'الوقت': getNowTime12h(),
                'الشهر': getCurrentMonthLabel()
            };

            const insertedTransfer = await insertTransferFromRequest(transferData);

            const { error: updateError } = await supabase
                .from('requests')
                .update({ 'الحالة': 'مكتمل' })
                .eq('id', requestId);

            if (updateError) throw updateError;

            await syncGoogleScript({
                action: 'update_request_status',
                requestId,
                requestNumber: request['رقم الطلب'],
                status: 'مكتمل',
                convertedToTransfer: true,
                transferReference: insertedTransfer?.['الرقم المرجعي'] || '',
                convertedAtDate: getNowDate(),
                convertedAtTime: getNowTime12h()
            });

            showToast('تم تحويل الطلب بنجاح', 'success');
            if (window.Sound) window.Sound.play('success');

            await loadRequests();

            if (window.loadDashboardStats) await window.loadDashboardStats();
            if (window.loadRecentActivities) await window.loadRecentActivities();
            if (window.loadTopMachines) await window.loadTopMachines();
            if (window.loadTransfers) await window.loadTransfers();
        } catch (err) {
            console.error(err);
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

            await syncGoogleScript({
                action: 'delete_request',
                requestId
            });

            showToast('تم حذف الطلب', 'success');
            if (window.Sound) window.Sound.play('success');

            await loadRequests();
        } catch (err) {
            console.error(err);
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
