<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تحديث صفحة التحويلات - transfers.js</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0a0f1e 0%, #1a2332 100%);
            min-height: 100vh;
            color: #fff;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
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
        
        .file-info h2 {
            color: #00d4ff;
            margin-bottom: 15px;
        }
        
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
        
        .feature-icon {
            font-size: 2.5em;
            margin-bottom: 15px;
        }
        
        .feature-card h4 {
            color: #00d4ff;
            margin-bottom: 10px;
        }
        
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
        
        .code-header h4 {
            color: #00d4ff;
        }
        
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
        
        pre {
            padding: 25px;
            overflow-x: auto;
            max-height: 700px;
            overflow-y: auto;
        }
        
        code {
            font-family: 'Fira Code', 'Consolas', monospace;
            font-size: 0.85em;
            line-height: 1.6;
            color: #e6edf3;
        }

        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.5); border-radius: 5px; }
        
        .footer { text-align: center; padding: 30px; opacity: 0.6; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💰 تحديث صفحة التحويلات</h1>
            <p>تم تحسين البحث عن التاجر مع جلب البيانات تلقائياً + حسابات دقيقة</p>
        </div>

        <div class="file-info">
            <h2>📄 معلومات الملف</h2>
            <div class="file-path">src/pages/transfers.js</div>
        </div>

        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">🔍</div>
                <h4>بحث احترافي</h4>
                <p>قائمة بحث ذكية مع إكمال تلقائي وعرض فوري للنتائج</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">📋</div>
                <h4>جلب تلقائي للبيانات</h4>
                <p>عند اختيار تاجر، يتم جلب جميع بياناته تلقائياً</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">✅</div>
                <h4>تحقق دقيق</h4>
                <p>التحقق من صحة المدخلات قبل الحفظ</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">💾</div>
                <h4>حفظ آمن</h4>
                <p>حسابات مالية دقيقة وتسجيل شامل للبيانات</p>
            </div>
        </div>

        <div class="changes-list">
            <h3>✨ التحسينات المنفذة:</h3>
            
            <div class="change-item">
                <span>🔍</span>
                <div>
                    <strong>نظام بحث محسّن:</strong>
                    <p style="margin-top: 5px; opacity: 0.85;">• بحث فوري عند الكتابة<br>• عرض قائمة منسدلة بالنتائج<br>• دعم البحث بالاسم أو الرقم<br>• اختيار بالنقر أو Enter</p>
                </div>
            </div>

            <div class="change-item">
                <span>📊</span>
                <div>
                    <strong>عرض بيانات التاجر:</strong>
                    <p style="margin-top: 5px; opacity: 0.85;">• عرض الاسم والنشاط والمنطقة والعنوان<br>• عرض المديونية الحالية<br>• تنسيق الأرقام بشكل احترافي</p>
                </div>
            </div>
        </div>

        <div class="code-container">
            <div class="code-header">
                <h4>📝 الكود الكامل بعد التعديل:</h4>
                <button class="copy-btn" onclick="copyCode()">نسخ الكود</button>
            </div>
            <pre><code id="codeBlock">/**
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
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:30px; color:#888;">
             لا توجد تحويلات
        </td></tr>`;
        return;
    }
    
    tbody.innerHTML = currentTransfers.map((t, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td><strong>${escapeHtml(t['الرقم المرجعي'] || '-')}</strong></td>
            <td>${formatDate(t['التاريخ'])}</td>
            <td>${formatTime(t['الوقت'])}</td>
            <td><strong>${escapeHtml(t['اسم التاجر'] || '-')}</strong></td>
            <td>${escapeHtml(t['اسم النشاط'] || '-')}</td>
            <td><span class="amount-positive"><strong>${formatMoney(t['قيمة التحويل'])}</strong></span></td>
            <td>${escapeHtml(t['ملاحظات'] || '-')}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editTransfer('${t.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteTransfer('${t.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
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
        
        title.innerHTML = '<i class="fas fa-exchange-alt"></i> تعديل تحويل';
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
        title.innerHTML = '<i class="fas fa-plus-circle"></i> تحويل جديد';
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
            `<option value="${m['رقم التاجر']} - ${m['اسم التاجر']}" data-id="${m.id}">`
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
                        ${(m['المنطقة'] ? `<div style="font-size: 0.8em; opacity: 0.6; margin-top: 2px;"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(m['المنطقة'])}</div>` : '')}
                    </div>
                    <i class="fas fa-chevron-left" style="opacity: 0.5;"></i>
                </div>
            </div>
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
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 0.92em;">
            <div>
                <div style="color: #888; font-size: 0.85em; margin-bottom: 3px;"><i class="fas fa-user"></i> الاسم</div>
                <div style="font-weight: bold; color: #00d4ff;">${escapeHtml(merchant['اسم التاجر'])}</div>
            </div>
            <div>
                <div style="color: #888; font-size: 0.85em; margin-bottom: 3px;"><i class="fas fa-store"></i> النشاط</div>
                <div>${escapeHtml(merchant['اسم النشاط'] || '-')}</div>
            </div>
            <div>
                <div style="color: #888; font-size: 0.85em; margin-bottom: 3px;"><i class="fas fa-map-marker-alt"></i> المنطقة</div>
                <div>${escapeHtml(merchant['المنطقة'] || '-')}</div>
            </div>
            <div>
                <div style="color: #888; font-size: 0.85em; margin-bottom: 3px;"><i class="fas fa-money-bill-wave"></i> المديونية</div>
                <div style="font-weight: bold; color: ${currentDebt > 0 ? '#ff6b6b' : '#00ff88'};">
                    ${formatMoney(Math.abs(currentDebt))} ${currentDebt > 0 ? '(مدين)' : '(دائن)'}
                </div>
            </div>
        </div>
        ${merchant['العنوان'] ? `
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.88em; color: #aaa;">
            <i class="fas fa-home"></i> ${escapeHtml(merchant['العنوان'])}
        </div>
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
        machineSelect.innerHTML = '<option value="">-- بدون مكنة --</option>' + 
            machinesList.map(mc => 
                `<option value="${mc.id}">${mc['رقم المكنة']}</option>`
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
window.deleteTransfer = deleteTransfer;</code></pre>
        </div>

        <div class="footer">
            <p>✅ تم إنشاء هذا الملف بواسطة Axentro Development Team</p>
            <p style="margin-top: 10px;">📁 المسار: src/pages/transfers.js | 🔄 الحالة: مُحدَّث بالكامل</p>
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
