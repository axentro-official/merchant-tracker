/**
 * Collections Page
 * CRUD operations for collections - مطابق لستايل index.html
 * ✅ محدث: مع دعم البحث الاحترافي وحساب دقيق للمتبقي
 */

import { showToast, showConfirm } from '../ui/toast.js';
import { escapeHtml, formatMoney, formatDate, formatTime } from '../utils/formatters.js';
import { getTodayDate, getCurrentTime } from '../utils/helpers.js';

let supabase = null;
let currentCollections = [];
let merchantsList = [];
let machinesList = [];

// تهيئة Supabase
export function initCollectionsPage() {
    supabase = window.supabaseaseClient || window.supabaseClient;
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
        
        const { data: merchants } = await supabase
            .from('merchants')
            .select('id, "رقم التاجر", "اسم التاجر", "رقم الحساب", "اسم النشاط", "المنطقة", "العنوان"');
        merchantsList = merchants || [];
        
        const { data: machines } = await supabase
            .from('machines')
            .select('id, "رقم المكنة"');
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
             لا توجد تحصيلات
        `;
        return;
    }
    
    tbody.innerHTML = currentCollections.map((c, idx) => `
        
            ${idx + 1}
            ${escapeHtml(c['الرقم المرجعي'] || '-')}
            ${formatDate(c['التاريخ'])}
            ${formatTime(c['الوقت'])}
            ${escapeHtml(c['اسم التاجر'] || '-')}
            ${escapeHtml(c['اسم النشاط'] || '-')}
            ${formatMoney(c['قيمة التحصيل'])}
            
                ${formatMoney(c['المتبقي بعد التحصيل'])}
            
            ${escapeHtml(c['ملاحظات'] || '-')}
            
                
                    
                
                
                    
                
            
        
    `).join('');
}

// ============================================
// فتح نافذة إضافة/تعديل تحصيل
// ============================================

export async function openCollectionModal(collection = null) {
    // تحميل قائمة التجار
    if (!merchantsList.length) {
        const { data } = await supabase.from('merchants').select(
            'id, "رقم التاجر", "اسم التاجر", "رقم الحساب", "اسم النشاط", "المنطقة", "العنوان"'
        );
        merchantsList = data || [];
    }
    
    // تحميل قائمة المكن
    if (!machinesList.length) {
        const { data } = await supabase.from('machines').select('id, "رقم المكنة"');
        machinesList = data || [];
    }
    
    const isEdit = !!collection;
    const modal = document.getElementById('collectionModal');
    const title = document.getElementById('collectionModalTitle');
    
    // 🔧 تهيئة datalist
    updateMerchantDatalist();
    
    // 🔧 تهيئة نظام البحث الذكي
    initMerchantSearch();
    
    // 🔧 تعبئة قائمة المكن
    populateMachinesSelect();
    
    // 🔧 إنشاء منطقة عرض البيانات
    setupMerchantInfoDisplay();
    
    // 🔧 إنشاء منطقة عرض المتبقي
    setupRemainingDisplay();
    
    const searchInput = document.getElementById('collMerchantSearch');
    const hiddenId = document.getElementById('collMerchantId');
    
    if (isEdit && collection) {
        const merchant = merchantsList.find(m => m.id === collection['رقم التاجر']);
        if (merchant && searchInput) {
            searchInput.value = `${merchant['رقم التاجر']} - ${merchant['اسم التاجر']}`;
            if (hiddenId) hiddenId.value = merchant.id;
            displayMerchantInfo(merchant);
            calculateAndDisplayRemaining(merchant.id, collection['قيمة التحصيل']);
        }
        
        title.innerHTML = ' تعديل تحصيل';
        document.getElementById('editCollectionId').value = collection.id;
        document.getElementById('collAmount').value = collection['قيمة التحصيل'] || '';
        document.getElementById('collType').value = collection['نوع التحصيل'] || 'نقدي';
        document.getElementById('collNotes').value = collection['ملاحظات'] || '';
        
        if (collection['رقم المكنة']) {
            const machineSelect = document.getElementById('collMachineId');
            if (machineSelect) machineSelect.value = collection['رقم المكنة'];
        }
    } else {
        title.innerHTML = ' تحصيل جديد';
        document.getElementById('editCollectionId').value = '';
        if (searchInput) searchInput.value = '';
        if (hiddenId) hiddenId.value = '';
        document.getElementById('collAmount').value = '';
        document.getElementById('collType').value = 'نقدي';
        document.getElementById('collNotes').value = '';
        
        const machineSelect = document.getElementById('collMachineId');
        if (machineSelect) machineSelect.value = '';
        
        hideMerchantInfo();
        hideRemainingDisplay();
    }
    
    modal.classList.add('show');
    if (window.Sound) window.Sound.play('click');
}

export function closeCollectionModal() {
    document.getElementById('collectionModal').classList.remove('show');
}

// ============================================
// 🔍 نظام البحث الذكي عن التاجر
// ============================================

function updateMerchantDatalist() {
    const datalist = document.getElementById('merchantDatalistColl');
    if (datalist) {
        datalist.innerHTML = merchantsList.map(m => 
            ``
        ).join('');
    }
}

function initMerchantSearch() {
    const searchInput = document.getElementById('collMerchantSearch');
    const hiddenId = document.getElementById('collMerchantId');
    
    if (!searchInput) return;
    
    // إزالة الأحداث القديمة
    const newInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newInput, searchInput);
    
    let resultsDiv = document.getElementById('collSearchResults');
    if (!resultsDiv) {
        resultsDiv = document.createElement('div');
        resultsDiv.id = 'collSearchResults';
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
    
    const results = document.getElementById('collSearchResults');
    
    newInput.addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase().trim();
        
        if (query.length < 1) {
            results.style.display = 'none';
            if (hiddenId) hiddenId.value = '';
            hideMerchantInfo();
            hideRemainingDisplay();
            return;
        }
        
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
                        
                    
                    
                
            
        `).join('');
        
        results.style.display = 'block';
        
        results.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', async function() {
                const id = this.dataset.id;
                const merchant = merchantsList.find(m => m.id == id);
                
                if (merchant) {
                    newInput.value = `${merchant['رقم التاجر']} - ${merchant['اسم التاجر']}`;
                    if (hiddenId) hiddenId.value = id;
                    results.style.display = 'none';
                    
                    displayMerchantInfo(merchant);
                    await calculateAndDisplayRemaining(id);
                    
                    newInput.style.borderColor = '#00ff88';
                    setTimeout(() => { newInput.style.borderColor = ''; }, 1000);
                }
            });
            
            item.addEventListener('mouseenter', function() {
                this.style.background = 'rgba(0,212,255,0.1)';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.background = '';
            });
        });
    });
    
    newInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const firstResult = results.querySelector('.search-result-item');
            if (firstResult) firstResult.click();
        }
    });
    
    document.addEventListener('click', function(e) {
        if (!newInput.contains(e.target) && !results.contains(e.target)) {
            results.style.display = 'none';
        }
    });
}

// ============================================
// 📋 عرض بيانات التاجر والمتبقي
// ============================================

function setupMerchantInfoDisplay() {
    let infoDiv = document.getElementById('selectedCollMerchantInfo');
    if (!infoDiv) {
        infoDiv = document.createElement('div');
        infoDiv.id = 'selectedCollMerchantInfo';
        infoDiv.style.cssText = `
            margin-top: 15px;
            padding: 16px;
            background: linear-gradient(135deg, rgba(0,212,255,0.08), rgba(0,153,204,0.08));
            border: 1px solid rgba(0,212,255,0.25);
            border-radius: 12px;
            display: none;
        `;
        const container = document.getElementById('collMerchantSearch')?.parentNode?.parentNode;
        if (container) container.appendChild(infoDiv);
    }
}

async function displayMerchantInfo(merchant) {
    const infoDiv = document.getElementById('selectedCollMerchantInfo');
    if (!infoDiv || !merchant) return;
    
    infoDiv.style.display = 'block';
    infoDiv.innerHTML = `
        
            
                 الاسم
                ${escapeHtml(merchant['اسم التاجر'])}
            
            
                 النشاط
                ${escapeHtml(merchant['اسم النشاط'] || '-')}
            
            
                 المنطقة
                ${escapeHtml(merchant['المنطقة'] || '-')}
            
            
                 الهاتف
                ${escapeHtml(merchant['رقم الهاتف'] || '-')}
            
        
    `;
}

function hideMerchantInfo() {
    const infoDiv = document.getElementById('selectedCollMerchantInfo');
    if (infoDiv) infoDiv.style.display = 'none';
}

function setupRemainingDisplay() {
    let remainingDiv = document.getElementById('remainingCalculation');
    if (!remainingDiv) {
        remainingDiv = document.createElement('div');
        remainingDiv.id = 'remainingCalculation';
        remainingDiv.style.cssText = `
            margin-top: 15px;
            padding: 16px;
            background: linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,200,100,0.08));
            border: 1px solid rgba(0,255,136,0.25);
            border-radius: 12px;
            display: none;
        `;
        const amountContainer = document.getElementById('collAmount')?.parentNode?.parentNode;
        if (amountContainer) amountContainer.appendChild(remainingDiv);
    }
}

async function calculateAndDisplayRemaining(merchantId, currentCollectionAmount = 0) {
    const remainingDiv = document.getElementById('remainingCalculation');
    if (!remainingDiv || !merchantId) return;
    
    try {
        const { data: transfers } = await supabase
            .from('transfers')
            .select('قيمة التحويل')
            .eq('رقم التاجر', merchantId);
        
        const { data: existingCollections } = await supabase
            .from('collections')
            .select('قيمة التحصيل')
            .eq('رقم التاجر', merchantId);
        
        const totalTransfers = (transfers || []).reduce((s, t) => s + (parseFloat(t['قيمة التحويل']) || 0), 0);
        const totalExistingCollections = (existingCollections || []).reduce((s, c) => s + (parseFloat(c['قيمة التحصيل']) || 0), 0);
        const currentDebt = totalTransfers - totalExistingCollections;
        const newRemaining = Math.max(0, currentDebt - currentCollectionAmount);
        
        remainingDiv.style.display = 'block';
        remainingDiv.innerHTML = `
            
                
                     إجمالي التحويلات
                    ${formatMoney(totalTransfers)}
                
                
                     التحصيلات السابقة
                    ${formatMoney(totalExistingCollections)}
                
                
                     المديونية الحالية
                    
                        ${formatMoney(Math.abs(currentDebt))}
                    
                
                ${currentCollectionAmount > 0 ? `
                
                     المتبقي بعد هذا التحصيل
                    
                        ${formatMoney(newRemaining)}
                    
                
                ` : ''}
            
            ${currentCollectionAmount > 0 && currentCollectionAmount > currentDebt ? `
            
                 
                تنبيه: مبلغ التحصيل يتجاوز المديونية الحالية!
            
            ` : ''}
        `;
        
        // ربط حدث تغيير المبلغ لحساب جديد
        const amountInput = document.getElementById('collAmount');
        if (amountInput && !amountInput.dataset.bound) {
            amountInput.dataset.bound = 'true';
            amountInput.addEventListener('input', async function() {
                const newAmount = parseFloat(this.value) || 0;
                if (merchantId) {
                    calculateAndDisplayRemaining(merchantId, newAmount);
                }
            });
        }
        
    } catch (e) {
        console.warn('خطأ في حساب المتبقي:', e);
    }
}

function hideRemainingDisplay() {
    const remainingDiv = document.getElementById('remainingCalculation');
    if (remainingDiv) remainingDiv.style.display = 'none';
}

function populateMachinesSelect() {
    const machineSelect = document.getElementById('collMachineId');
    if (machineSelect) {
        machineSelect.innerHTML = '-- بدون مكنة --' + 
            machinesList.map(mc => `${mc['رقم المكنة']}`).join('');
    }
}

// ============================================
// حفظ التحصيل (إضافة أو تعديل)
// ============================================

export async function saveCollection() {
    const id = document.getElementById('editCollectionId').value;
    const merchantId = document.getElementById('collMerchantId').value;
    const machineId = document.getElementById('collMachineId')?.value;
    const amount = parseFloat(document.getElementById('collAmount').value);
    const type = document.getElementById('collType').value;
    const notes = document.getElementById('collNotes').value.trim();
    
    // التحقق من الحقول المطلوبة
    if (!merchantId) {
        showToast('⚠️ يرجى اختيار التاجر من القائمة', 'warning');
        return;
    }
    
    if (!amount || amount <= 0) {
        showToast('⚠️ يرجى إدخال مبلغ صحيح أكبر من صفر', 'warning');
        document.getElementById('collAmount').focus();
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
    
    // حساب المتبقي بعد التحصيل
    const { data: transfers } = await supabase
        .from('transfers')
        .select('قيمة التحويل')
        .eq('رقم التاجر', merchantId);
    
    const { data: existingCollections } = await supabase
        .from('collections')
        .select('قيمة التحصيل')
        .eq('رقم التاجر', merchantId);
    
    const totalTransfers = (transfers || []).reduce((s, t) => s + (parseFloat(t['قيمة التحويل']) || 0), 0);
    const totalExistingCollections = (existingCollections || []).reduce((s, c) => s + (parseFloat(c['قيمة التحصيل']) || 0), 0);
    
    // إذا كان تعديل، نطرح القيمة القديمة أولاً
    let finalExistingCollections = totalExistingCollections;
    if (id) {
        const oldCollection = currentCollections.find(c => c.id === id);
        if (oldCollection) {
            finalExistingCollections -= (parseFloat(oldCollection['قيمة التحصيل']) || 0);
        }
    }
    
    const newTotalCollections = finalExistingCollections + amount;
    const remaining = Math.max(0, totalTransfers - newTotalCollections);
    
    const collectionData = {
        "رقم التاجر": merchantId,
        "اسم التاجر": merchant['اسم التاجر'],
        "رقم الحساب": merchant['رقم الحساب'],
        "اسم النشاط": merchant['اسم النشاط'],
        "المنطقة": merchant['المنطقة'] || '',
        "العنوان": merchant['العنوان'] || '',
        "رقم المكنة": machineNumber,
        "قيمة التحصيل": amount,
        "نوع التحصيل": type,
        "ملاحظات": notes,
        "المتبقي بعد التحصيل": remaining,
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
            showToast('✅ تم تحديث التحصيل بنجاح', 'success');
        } else {
            const { error } = await supabase
                .from('collections')
                .insert([collectionData]);
            if (error) throw error;
            showToast('✅ تم إضافة التحصيل بنجاح', 'success');
        }
        
        if (window.Sound) window.Sound.play('success');
        closeCollectionModal();
        await loadCollections();
        
        if (window.loadDashboardStats) window.loadDashboardStats();
        if (window.loadRecentActivities) window.loadRecentActivities();
        if (window.loadTopMachines) window.loadTopMachines();
        
    } catch (err) {
        console.error(err);
        showToast('❌ حدث خطأ: ' + err.message, 'error');
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
    showConfirm('هل تريد حذف هذا التحصيل؟ ⚠️ لا يمكن التراجع!', async () => {
        try {
            const { error } = await supabase
                .from('collections')
                .delete()
                .eq('id', id);
            if (error) throw error;
            
            showToast('✅ تم حذف التحصيل بنجاح', 'success');
            if (window.Sound) window.Sound.play('success');
            
            await loadCollections();
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
window.openCollectionModal = openCollectionModal;
window.closeCollectionModal = closeCollectionModal;
window.saveCollection = saveCollection;
window.editCollection = editCollection;
window.deleteCollection = deleteCollection;
