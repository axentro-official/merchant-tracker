/**
 * Transfers Page
 * CRUD operations for transfers - مطابق لستايل index.html
 * ✅ محدث: مع دعم البحث الاحترافي عن التاجر وجلب البيانات تلقائياً
 */

import { showToast, showConfirm } from '../ui/toast.js';
import { escapeHtml, formatMoney, formatDate, formatTime } from '../utils/formatters.js';
import { getTodayDate, getCurrentTime } from '../utils/helpers.js';

let supabase = null;
let currentTransfers = [];
let merchantsList = [];
let machinesList = [];

// تهيئة Supabase (باستخدام window.supabaseClient)
export function initTransfersPage() {
    supabase = window.supabaseaseClient || window.supabaseClient;
}

// تحميل التحويلات وعرضها
export async function loadTransfers() {
    if (!supabase) return;
    
    try {
        const { data: transfers, error } = await supabase
            .from('transfers')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        currentTransfers = transfers || [];
        
        const { data: merchants } = await supabase
            .from('merchants')
            .select('id, "رقم التاجر", "اسم التاجر", "رقم الحساب", "اسم النشاط", "المنطقة", "العنوان"');
        merchantsList = merchants || [];
        
        const { data: machines } = await supabase
            .from('machines')
            .select('id, "رقم المكنة"');
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
             لا توجد تحويلات
        `;
        return;
    }
    
    tbody.innerHTML = currentTransfers.map((t, idx) => `
        
            ${idx + 1}
            ${escapeHtml(t['الرقم المرجعي'] || '-')}
            ${formatDate(t['التاريخ'])}
            ${formatTime(t['الوقت'])}
            ${escapeHtml(t['اسم التاجر'] || '-')}
            ${escapeHtml(t['اسم النشاط'] || '-')}
            ${formatMoney(t['قيمة التحويل'])}
            ${escapeHtml(t['ملاحظات'] || '-')}
            
                
                    
                
                
                    
                
            
        
    `).join('');
}

// ============================================
// فتح نافذة إضافة/تعديل تحويل
// ============================================

export async function openTransferModal(transfer = null) {
    // تحميل قائمة التجار إذا لم تكن محملة
    if (!merchantsList.length) {
        const { data } = await supabase.from('merchants').select(
            'id, "رقم التاجر", "اسم التاجر", "رقم الحساب", "اسم النشاط", "المنطقة", "العنوان"'
        );
        merchantsList = data || [];
    }
    
    // تحميل قائمة المكن إذا لم تكن محملة
    if (!machinesList.length) {
        const { data } = await supabase.from('machines').select('id, "رقم المكنة"');
        machinesList = data || [];
    }
    
    const isEdit = !!transfer;
    const modal = document.getElementById('transferModal');
    const title = document.getElementById('transferModalTitle');
    
    // 🔧 تهيئة datalist للتجار
    updateMerchantDatalist();
    
    // 🔧 تهيئة نظام البحث الذكي
    initMerchantSearch();
    
    // 🔧 تعبئة قائمة المكن
    populateMachinesSelect();
    
    // 🔧 إنشاء/تحديث منطقة عرض بيانات التاجر
    setupMerchantInfoDisplay();
    
    const searchInput = document.getElementById('transMerchantSearch');
    const hiddenId = document.getElementById('transMerchantId');
    
    if (isEdit && transfer) {
        const merchant = merchantsList.find(m => m.id === transfer['رقم التاجر']);
        if (merchant && searchInput) {
            searchInput.value = `${merchant['رقم التاجر']} - ${merchant['اسم التاجر']}`;
            if (hiddenId) hiddenId.value = merchant.id;
            // عرض بيانات التاجر
            displayMerchantInfo(merchant);
        }
        
        title.innerHTML = ' تعديل تحويل';
        document.getElementById('editTransferId').value = transfer.id;
        document.getElementById('transAmount').value = transfer['قيمة التحويل'] || '';
        document.getElementById('transType').value = transfer['نوع التحويل'] || 'نقدي';
        document.getElementById('transNotes').value = transfer['ملاحظات'] || '';
        
        // اختيار المكنة إذا كانت موجودة
        if (transfer['رقم المكنة']) {
            const machineSelect = document.getElementById('transMachineId');
            if (machineSelect) machineSelect.value = transfer['رقم المكنة'];
        }
    } else {
        title.innerHTML = ' تحويل جديد';
        document.getElementById('editTransferId').value = '';
        if (searchInput) searchInput.value = '';
        if (hiddenId) hiddenId.value = '';
        document.getElementById('transAmount').value = '';
        document.getElementById('transType').value = 'نقدي';
        document.getElementById('transNotes').value = '';
        
        const machineSelect = document.getElementById('transMachineId');
        if (machineSelect) machineSelect.value = '';
        
        // إخفاء بيانات التاجر
        hideMerchantInfo();
    }
    
    modal.classList.add('show');
    if (window.Sound) window.Sound.play('click');
}

export function closeTransferModal() {
    document.getElementById('transferModal').classList.remove('show');
}

// ============================================
// 🔍 نظام البحث الذكي عن التاجر
// ============================================

function updateMerchantDatalist() {
    const datalist = document.getElementById('merchantDatalistTrans');
    if (datalist) {
        datalist.innerHTML = merchantsList.map(m => 
            ``
        ).join('');
    }
}

function initMerchantSearch() {
    const searchInput = document.getElementById('transMerchantSearch');
    const hiddenId = document.getElementById('transMerchantId');
    
    if (!searchInput) return;
    
    // إزالة الأحداث القديمة
    const newInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newInput, searchInput);
    
    // إنشاء قائمة النتائج
    let resultsDiv = document.getElementById('transSearchResults');
    if (!resultsDiv) {
        resultsDiv = document.createElement('div');
        resultsDiv.id = 'transSearchResults';
        resultsDiv.className = 'search-results-dropdown';
        resultsDiv.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #1a2332;
            border: 1px solid rgba(0,212,255,0.3);
            border-radius: 8px;
            max-height: 250px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        `;
        newInput.parentNode.style.position = 'relative';
        newInput.parentNode.appendChild(resultsDiv);
    }
    
    const results = document.getElementById('transSearchResults');
    
    // حدث الكتابة
    newInput.addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase().trim();
        
        if (query.length < 1) {
            results.style.display = 'none';
            if (hiddenId) hiddenId.value = '';
            hideMerchantInfo();
            return;
        }
        
        // البحث في قائمة التجار
        const filtered = merchantsList.filter(m => 
            m['رقم التاجر'].toLowerCase().includes(query) ||
            m['اسم التاجر'].toLowerCase().includes(query) ||
            (m['اسم النشاط'] && m['اسم النشاط'].toLowerCase().includes(query)) ||
            (m['المنطقة'] && m['المنطقة'].toLowerCase().includes(query))
        );
        
        if (filtered.length === 0) {
            results.style.display = 'none';
            return;
        }
        
        results.innerHTML = filtered.slice(0, 10).map(m => `
            
                
                    
                        ${escapeHtml(m['اسم التاجر'])}
                        
                             ${escapeHtml(m['رقم التاجر'])} | 
                             ${escapeHtml(m['اسم النشاط'] || '-')}
                        
                        ${(m['المنطقة'] ? ` ${escapeHtml(m['المنطقة'])}` : '')}
                    
                    
                
            
        `).join('');
        
        results.style.display = 'block';
        
        // أحداث النقر على النتائج
        results.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', function() {
                selectMerchant(this.dataset.id, newInput, hiddenId, results);
            });
            
            item.addEventListener('mouseenter', function() {
                this.style.background = 'rgba(0,212,255,0.1)';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.background = '';
            });
        });
    });
    
    // حدث الضغط على Enter
    newInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const firstResult = results.querySelector('.search-result-item');
            if (firstResult) {
                selectMerchant(firstResult.dataset.id, newInput, hiddenId, results);
            }
        }
    });
    
    // إغلاق القائمة عند النقر خارجها
    document.addEventListener('click', function(e) {
        if (!newInput.contains(e.target) && !results.contains(e.target)) {
            results.style.display = 'none';
        }
    });
}

function selectMerchant(id, input, hiddenField, resultsContainer) {
    const merchant = merchantsList.find(m => m.id == id);
    
    if (merchant) {
        input.value = `${merchant['رقم التاجر']} - ${merchant['اسم التاجر']}`;
        if (hiddenField) hiddenField.value = id;
        resultsContainer.style.display = 'none';
        
        // عرض بيانات التاجر
        displayMerchantInfo(merchant);
        
        // تأثير بصري
        input.style.borderColor = '#00ff88';
        setTimeout(() => {
            input.style.borderColor = '';
        }, 1000);
    }
}

// ============================================
// 📋 عرض بيانات التاجر المختار
// ============================================

function setupMerchantInfoDisplay() {
    let infoDiv = document.getElementById('selectedMerchantInfo');
    
    if (!infoDiv) {
        infoDiv = document.createElement('div');
        infoDiv.id = 'selectedMerchantInfo';
        infoDiv.style.cssText = `
            margin-top: 15px;
            padding: 16px;
            background: linear-gradient(135deg, rgba(0,212,255,0.08), rgba(0,153,204,0.08));
            border: 1px solid rgba(0,212,255,0.25);
            border-radius: 12px;
            display: none;
        `;
        
        const searchContainer = document.getElementById('transMerchantSearch')?.parentNode?.parentNode;
        if (searchContainer) {
            searchContainer.appendChild(infoDiv);
        }
    }
}

async function displayMerchantInfo(merchant) {
    const infoDiv = document.getElementById('selectedMerchantInfo');
    if (!infoDiv || !merchant) return;
    
    // حساب المديونية الحالية
    let currentDebt = 0;
    try {
        const { data: transfers } = await supabase
            .from('transfers')
            .select('قيمة التحويل')
            .eq('رقم التاجر', merchant.id);
        
        const { data: collections } = await supabase
            .from('collections')
            .select('قيمة التحصيل')
            .eq('رقم التاجر', merchant.id);
        
        const totalT = (transfers || []).reduce((s, t) => s + (parseFloat(t['قيمة التحويل']) || 0), 0);
        const totalC = (collections || []).reduce((s, c) => s + (parseFloat(c['قيمة التحصيل']) || 0), 0);
        currentDebt = totalT - totalC;
    } catch (e) {
        console.warn('خطأ في حساب المديونية:', e);
    }
    
    infoDiv.style.display = 'block';
    infoDiv.innerHTML = `
        
            
                 الاسم
                ${escapeHtml(merchant['اسم التاجر'])}
            
            
                 النشاط
                ${escapeHtml(merchant['اسم النشاط'] || '-')}
            
            
                 المنطقة
                ${escapeHtml(merchant['المنطقة'] || '-')}
            
            
                 المديونية
                
                    ${formatMoney(Math.abs(currentDebt))} ${currentDebt > 0 ? '(مدين)' : '(دائن)'}
                
            
        
        ${merchant['العنوان'] ? `
        
             ${escapeHtml(merchant['العنوان'])}
        
        ` : ''}
    `;
    
    // أنيميشن بسيط
    infoDiv.style.animation = 'fadeIn 0.3s ease-out';
}

function hideMerchantInfo() {
    const infoDiv = document.getElementById('selectedMerchantInfo');
    if (infoDiv) {
        infoDiv.style.display = 'none';
    }
}

function populateMachinesSelect() {
    const machineSelect = document.getElementById('transMachineId');
    if (machineSelect) {
        machineSelect.innerHTML = '-- بدون مكنة --' + 
            machinesList.map(mc => 
                `${mc['رقم المكنة']}`
            ).join('');
    }
}

// ============================================
// حفظ التحويل (إضافة أو تعديل)
// ============================================

export async function saveTransfer() {
    const id = document.getElementById('editTransferId').value;
    const merchantId = document.getElementById('transMerchantId').value;
    const machineId = document.getElementById('transMachineId')?.value;
    const amount = parseFloat(document.getElementById('transAmount').value);
    const type = document.getElementById('transType').value;
    const notes = document.getElementById('transNotes').value.trim();
    
    // التحقق من الحقول المطلوبة
    if (!merchantId) {
        showToast('⚠️ يرجى اختيار التاجر من القائمة', 'warning');
        return;
    }
    
    if (!amount || amount <= 0) {
        showToast('⚠️ يرجى إدخال مبلغ صحيح أكبر من صفر', 'warning');
        document.getElementById('transAmount').focus();
        return;
    }
    
    if (amount > 1000000) {
        showToast('⚠️ المبلغ كبير جداً! يرجى التحقق', 'warning');
        return;
    }
    
    const merchant = merchantsList.find(m => m.id == merchantId);
    if (!merchant) {
        showToast('❌ التاجر غير موجود', 'error');
        return;
    }
    
    let machineNumber = null;
    if (machineId) {
        const machine = machinesList.find(mc => mc.id == machineId);
        machineNumber = machine ? machine['رقم المكنة'] : null;
    }
    
    const transferData = {
        "رقم التاجر": merchantId,
        "اسم التاجر": merchant['اسم التاجر'],
        "رقم الحساب": merchant['رقم الحساب'],
        "اسم النشاط": merchant['اسم النشاط'],
        "المنطقة": merchant['المنطقة'] || '',
        "العنوان": merchant['العنوان'] || '',
        "رقم المكنة": machineNumber,
        "قيمة التحويل": amount,
        "نوع التحويل": type,
        "ملاحظات": notes,
        "التاريخ": getTodayDate(),
        "الوقت": getCurrentTime(),
        "الشهر": new Date().toLocaleString('ar-EG', { month: 'long', year: 'numeric' })
    };
    
    try {
        if (id) {
            const { error } = await supabase
                .from('transfers')
                .update(transferData)
                .eq('id', id);
            if (error) throw error;
            showToast('✅ تم تحديث التحويل بنجاح', 'success');
        } else {
            const { error } = await supabase
                .from('transfers')
                .insert([transferData]);
            if (error) throw error;
            showToast('✅ تم إضافة التحويل بنجاح', 'success');
        }
        
        if (window.Sound) window.Sound.play('success');
        closeTransferModal();
        await loadTransfers();
        
        if (window.loadDashboardStats) window.loadDashboardStats();
        if (window.loadRecentActivities) window.loadRecentActivities();
        if (window.loadTopMachines) window.loadTopMachines();
        
    } catch (err) {
        console.error(err);
        showToast('❌ حدث خطأ: ' + err.message, 'error');
        if (window.Sound) window.Sound.play('error');
    }
}

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

export function deleteTransfer(id) {
    showConfirm('هل تريد حذف هذا التحويل؟ ⚠️ لا يمكن التراجع!', async () => {
        try {
            const { error } = await supabase
                .from('transfers')
                .delete()
                .eq('id', id);
            if (error) throw error;
            
            showToast('✅ تم حذف التحويل بنجاح', 'success');
            if (window.Sound) window.Sound.play('success');
            
            await loadTransfers();
            if (window.loadDashboardStats) window.loadDashboardStats();
            if (window.loadRecentActivities) window.loadRecentActivities();
            if (window.loadTopMachines) window.loadTopMachines();
        } catch (err) {
            showToast('❌ خطأ في الحذف: ' + err.message, 'error');
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
