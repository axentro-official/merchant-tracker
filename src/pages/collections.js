<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تحديث صفحة التحصيلات - collections.js</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0a0f1e 0%, #1a2332 100%);
            min-height: 100vh;
            color: #fff;
            padding: 20px;
        }
        
        .container { max-width: 1200px; margin: 0 auto; }
        
        .header {
            text-align: center;
            padding: 40px 20px;
            background: rgba(255,255,255,0.05);
            border-radius: 20px;
            margin-bottom: 30px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 15px;
            background: linear-gradient(135deg, #00d4ff, #0099cc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .file-info {
            background: linear-gradient(135deg, rgba(0,212,255,0.1), rgba(0,153,204,0.1));
            border: 1px solid rgba(0,212,255,0.3);
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
        }
        
        .file-info h2 { color: #00d4ff; margin-bottom: 15px; }
        
        .file-path {
            font-family: monospace;
            background: rgba(0,0,0,0.3);
            padding: 10px 15px;
            border-radius: 8px;
            color: #00ff88;
            font-size: 0.95em;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .feature-card {
            background: rgba(255,255,255,0.05);
            border-radius: 15px;
            padding: 25px;
            border: 1px solid rgba(255,255,255,0.1);
            transition: all 0.3s ease;
        }
        
        .feature-card:hover {
            transform: translateY(-5px);
            border-color: rgba(0,212,255,0.5);
        }
        
        .feature-icon { font-size: 2.5em; margin-bottom: 15px; }
        .feature-card h4 { color: #00d4ff; margin-bottom: 10px; }
        
        .changes-list {
            background: rgba(255,255,255,0.05);
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
        }
        
        .change-item {
            background: rgba(0,0,0,0.2);
            padding: 15px 20px;
            border-radius: 10px;
            margin-bottom: 12px;
            border-right: 4px solid #00ff88;
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }
        
        .code-container {
            background: #0d1117;
            border-radius: 15px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .code-header {
            background: rgba(255,255,255,0.05);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .code-header h4 { color: #00d4ff; }
        
        .copy-btn {
            background: linear-gradient(135deg, #00d4ff, #0099cc);
            color: #000;
            border: none;
            padding: 8px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        
        .copy-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 20px rgba(0,212,255,0.4);
        }
        
        pre { padding: 25px; overflow-x: auto; max-height: 700px; overflow-y: auto; }
        code { font-family: 'Fira Code', monospace; font-size: 0.85em; line-height: 1.6; color: #e6edf3; }

        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.5); border-radius: 5px; }
        .footer { text-align: center; padding: 30px; opacity: 0.6; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💵 تحديث صفحة التحصيلات</h1>
            <p>تم تحسين البحث عن التاجر مع حساب دقيق للمتبقي بعد كل تحصيل</p>
        </div>

        <div class="file-info">
            <h2>📄 معلومات الملف</h2>
            <div class="file-path">src/pages/collections.js</div>
        </div>

        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">🔍</div>
                <h4>بحث احترافي</h4>
                <p>قائمة بحث ذكية مع إكمال تلقائي وعرض فوري للنتائج</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🧮</div>
                <h4>حساب آلي للمتبقي</h4>
                <p>حساب تلقائي ودقيق للمتبقي بعد عملية التحصيل</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">📊</div>
                <h4>عرض المديونية</h4>
                <p>عرض المديونية الحالية للتاجر قبل إجراء التحصيل</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">✅</div>
                <h4>تحقق شامل</h4>
                <p>التحقق من صحة جميع المدخلات قبل الحفظ</p>
            </div>
        </div>

        <div class="changes-list">
            <h3>✨ التحسينات المنفذة:</h3>
            
            <div class="change-item">
                <span>🧮</span>
                <div>
                    <strong>نظام حساب المتبقي:</strong>
                    <p style="margin-top: 5px; opacity: 0.85;">• حساب تلقائي عند اختيار التاجر<br>• عرض المتبقي قبل وبعد التحصيل<br>• تنبيه إذا تجاوز مبلغ التحصيل المديونية</p>
                </div>
            </div>

            <div class="change-item">
                <span>🔍</span>
                <div>
                    <strong>بحث محسّن عن التاجر:</strong>
                    <p style="margin-top: 5px; opacity: 0.85;">• بحث فوري متعدد المعايير<br>• عرض بيانات التاجر الكاملة<br>• اختيار سريع وسهل</p>
                </div>
            </div>
        </div>

        <div class="code-container">
            <div class="code-header">
                <h4>📝 الكود الكامل بعد التعديل:</h4>
                <button class="copy-btn" onclick="copyCode()">نسخ الكود</button>
            </div>
            <pre><code id="codeBlock">/**
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
        tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:30px; color:#888;">
             لا توجد تحصيلات
        </td></tr>`;
        return;
    }
    
    tbody.innerHTML = currentCollections.map((c, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td><strong>${escapeHtml(c['الرقم المرجعي'] || '-')}</strong></td>
            <td>${formatDate(c['التاريخ'])}</td>
            <td>${formatTime(c['الوقت'])}</td>
            <td><strong>${escapeHtml(c['اسم التاجر'] || '-')}</strong></td>
            <td>${escapeHtml(c['اسم النشاط'] || '-')}</td>
            <td><span class="amount-negative"><strong>${formatMoney(c['قيمة التحصيل'])}</strong></span></td>
            <td><span style="color: ${parseFloat(c['المتبقي بعد التحصيل']) > 0 ? '#ff6b6b' : '#00ff88'};">
                <strong>${formatMoney(c['المتبقي بعد التحصيل'])}</strong>
            </span></td>
            <td>${escapeHtml(c['ملاحظات'] || '-')}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editCollection('${c.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteCollection('${c.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
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
        
        title.innerHTML = '<i class="fas fa-hand-holding-usd"></i> تعديل تحصيل';
        document.getElementById('editCollectionId').value = collection.id;
        document.getElementById('collAmount').value = collection['قيمة التحصيل'] || '';
        document.getElementById('collType').value = collection['نوع التحصيل'] || 'نقدي';
        document.getElementById('collNotes').value = collection['ملاحظات'] || '';
        
        if (collection['رقم المكنة']) {
            const machineSelect = document.getElementById('collMachineId');
            if (machineSelect) machineSelect.value = collection['رقم المكنة'];
        }
    } else {
        title.innerHTML = '<i class="fas fa-plus-circle"></i> تحصيل جديد';
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
            `<option value="${m['رقم التاجر']} - ${m['اسم التاجر']}" data-id="${m.id}">`
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
            <div class="search-result-item" data-id="${m.id}" style="
                padding: 14px 18px;
                cursor: pointer;
                border-bottom: 1px solid rgba(255,255,255,0.05);
                transition: all 0.2s;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: bold; color: #00d4ff; font-size: 1.05em;">${escapeHtml(m['اسم التاجر'])}</div>
                        <div style="font-size: 0.85em; opacity: 0.7; margin-top: 4px;">
                            <i class="fas fa-hashtag"></i> ${escapeHtml(m['رقم التاجر'])} | 
                            <i class="fas fa-store"></i> ${escapeHtml(m['اسم النشاط'] || '-')}
                        </div>
                    </div>
                    <i class="fas fa-chevron-left" style="opacity: 0.5;"></i>
                </div>
            </div>
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
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; font-size: 0.92em;">
            <div>
                <div style="color: #888; font-size: 0.85em;"><i class="fas fa-user"></i> الاسم</div>
                <div style="font-weight: bold; color: #00d4ff;">${escapeHtml(merchant['اسم التاجر'])}</div>
            </div>
            <div>
                <div style="color: #888; font-size: 0.85em;"><i class="fas fa-store"></i> النشاط</div>
                <div>${escapeHtml(merchant['اسم النشاط'] || '-')}</div>
            </div>
            <div>
                <div style="color: #888; font-size: 0.85em;"><i class="fas fa-map-marker-alt"></i> المنطقة</div>
                <div>${escapeHtml(merchant['المنطقة'] || '-')}</div>
            </div>
            <div>
                <div style="color: #888; font-size: 0.85em;"><i class="fas fa-phone"></i> الهاتف</div>
                <div>${escapeHtml(merchant['رقم الهاتف'] || '-')}</div>
            </div>
        </div>
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
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 0.92em;">
                <div>
                    <div style="color: #888; font-size: 0.85em;"><i class="fas fa-arrow-down"></i> إجمالي التحويلات</div>
                    <div style="font-weight: bold; color: #ff6b6b;">${formatMoney(totalTransfers)}</div>
                </div>
                <div>
                    <div style="color: #888; font-size: 0.85em;"><i class="fas fa-arrow-up"></i> التحصيلات السابقة</div>
                    <div style="font-weight: bold; color: #00ff88;">${formatMoney(totalExistingCollections)}</div>
                </div>
                <div>
                    <div style="color: #888; font-size: 0.85em;"><i class="fas fa-balance-scale"></i> المديونية الحالية</div>
                    <div style="font-weight: bold; color: ${currentDebt > 0 ? '#ff6b6b' : '#00ff88'};">
                        ${formatMoney(Math.abs(currentDebt))}
                    </div>
                </div>
                ${currentCollectionAmount > 0 ? `
                <div>
                    <div style="color: #888; font-size: 0.85em;"><i class="fas fa-calculator"></i> المتبقي بعد هذا التحصيل</div>
                    <div style="font-weight: bold; color: ${newRemaining > 0 ? '#ffd700' : '#00ff88'};">
                        ${formatMoney(newRemaining)}
                    </div>
                </div>
                ` : ''}
            </div>
            ${currentCollectionAmount > 0 && currentCollectionAmount > currentDebt ? `
            <div style="margin-top: 12px; padding: 10px; background: rgba(255,193,7,0.15); border-radius: 8px; color: #ffd700; font-size: 0.88em;">
                <i class="fas fa-exclamation-triangle"></i> 
                تنبيه: مبلغ التحصيل يتجاوز المديونية الحالية!
            </div>
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
        machineSelect.innerHTML = '<option value="">-- بدون مكنة --</option>' + 
            machinesList.map(mc => `<option value="${mc.id}">${mc['رقم المكنة']}</option>`).join('');
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
window.deleteCollection = deleteCollection;</code></pre>
        </div>

        <div class="footer">
            <p>✅ تم إنشاء هذا الملف بواسطة Axentro Development Team</p>
            <p style="margin-top: 10px;">📁 المسار: src/pages/collections.js | 🔄 الحالة: مُحدَّث بالكامل</p>
        </div>
    </div>

    <script>
        function copyCode() {
            const codeBlock = document.getElementById('codeBlock');
            const textArea = document.createElement('textarea');
            textArea.value = codeBlock.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = '✅ تم النسخ!';
                btn.style.background = 'linear-gradient(135deg, #00ff88, #00cc6a)';
                
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '';
                }, 2000);
            } catch (err) {
                alert('فشل النسخ، يرجى النسخ يدوياً');
            }
            
            document.body.removeChild(textArea);
        }
    </script>
</body>
</html></string>
