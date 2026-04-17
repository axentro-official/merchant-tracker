<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تحديث صفحة كشف الحساب - statement.js</title>
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
            <h1>📊 تحديث صفحة كشف الحساب</h1>
            <p>تم تحسين واجهة البحث مع عرض احترافي للحركات المالية والرصيد</p>
        </div>

        <div class="file-info">
            <h2>📄 معلومات الملف</h2>
            <div class="file-path">src/pages/statement.js</div>
        </div>

        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">🔍</div>
                <h4>بحث احترافي</h4>
                <p>قائمة بحث ذكية عن التاجر مع إكمال تلقائي سريع</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">📈</div>
                <h4>عرض تفصيلي</h4>
                <p>عرض جميع بيانات التاجر مع الرصيد الحالي والمديونية</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">📋</div>
                <h4>جدول الحركات</h4>
                <p>عرض مرتب زمنياً (الأقدم أولاً) مع حساب الرصيد التراكمي</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🖨️</div>
                <h4>إحصائيات شاملة</h4>
                <p>ملخص مالي كامل مع إجماليات ونسب دقيقة</p>
            </div>
        </div>

        <div class="changes-list">
            <h3>✨ التحسينات المنفذة:</h3>
            
            <div class="change-item">
                <span>🔍</span>
                <div>
                    <strong>نظام بحث محسّن:</strong>
                    <p style="margin-top: 5px; opacity: 0.85;">• بحث فوري عند الكتابة<br>• عرض قائمة منسدلة بالنتائج<br>• اختيار بالنقر أو Enter<br>• عرض البيانات فور الاختيار</p>
                </div>
            </div>

            <div class="change-item">
                <span>📊</span>
                <div>
                    <strong>عرض احترافي للبيانات:</strong>
                    <p style="margin-top: 5px; opacity: 0.85;">• بطاقة معلومات التاجر<br>• جدول حركات مفصل<br>• حسابات دقيقة للرصيد<br>• تنسيق الأرقام والعملة</p>
                </div>
            </div>
        </div>

        <div class="code-container">
            <div class="code-header">
                <h4>📝 الكود الكامل بعد التعديل:</h4>
                <button class="copy-btn" onclick="copyCode()">نسخ الكود</button>
            </div>
            <pre><code id="codeBlock">/**
 * Statement Page
 * Account statement for individual merchants - مطابق لستايل index.html
 * ✅ محدث: مع دعم البحث الاحترافي وحساب دقيق للرصيد
 */

import { showToast } from '../ui/toast.js';
import { formatDate, formatTime, formatMoney, escapeHtml } from '../utils/formatters.js';

let supabase = null;
let merchantsList = [];

// تهيئة Supabase
export function initStatementPage() {
    supabase = window.supabaseaseClient || window.supabaseClient;
}

// تحميل قائمة التجار لعرضها في خانة البحث
export async function loadMerchantsForStatement() {
    if (!supabase) return;
    
    try {
        const { data, error } = await supabase
            .from('merchants')
            .select('id, "رقم التاجر", "اسم التاجر", "اسم النشاط", "رقم الحساب", "رقم الهاتف", "المنطقة", "العنوان"')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        merchantsList = data || [];
        
        // 🔧 تحديث datalist
        const datalist = document.getElementById('merchantDatalistStmt');
        if (datalist) {
            datalist.innerHTML = merchantsList.map(m => 
                `<option value="${m['رقم التاجر']} - ${m['اسم التاجر']}" data-id="${m.id}">`
            ).join('');
        }
        
        // 🔧 تهيئة نظام البحث الذكي
        initMerchantSearch();
        
    } catch (err) {
        console.error(err);
        showToast('خطأ في تحميل قائمة التجار', 'error');
    }
}

// ============================================
// 🔍 نظام البحث الذكي عن التاجر
// ============================================

function initMerchantSearch() {
    const searchInput = document.getElementById('stmtMerchantSearch');
    const hiddenId = document.getElementById('stmtMerchantId');
    
    if (!searchInput) return;
    
    // إزالة الأحداث القديمة
    const newInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newInput, searchInput);
    
    let resultsDiv = document.getElementById('stmtSearchResults');
    if (!resultsDiv) {
        resultsDiv = document.createElement('div');
        resultsDiv.id = 'stmtSearchResults';
        resultsDiv.className = 'search-results-dropdown';
        resultsDiv.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #1a2332;
            border: 1px solid rgba(0,212,255,0.3);
            border-radius: 8px;
            max-height: 280px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        `;
        newInput.parentNode.style.position = 'relative';
        newInput.parentNode.appendChild(resultsDiv);
    }
    
    const results = document.getElementById('stmtSearchResults');
    
    newInput.addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase().trim();
        
        if (query.length < 1) {
            results.style.display = 'none';
            if (hiddenId) hiddenId.value = '';
            return;
        }
        
        const filtered = merchantsList.filter(m => 
            m['رقم التاجر'].toLowerCase().includes(query) ||
            m['اسم التاجر'].toLowerCase().includes(query) ||
            (m['اسم النشاط'] && m['اسم النشاط'].toLowerCase().includes(query)) ||
            (m['المنطقة'] && m['المنطقة'].toLowerCase().includes(query)) ||
            (m['رقم الهاتف'] && m['رقم الهاتف'].includes(query))
        );
        
        if (filtered.length === 0) {
            results.style.display = 'none';
            return;
        }
        
        results.innerHTML = filtered.slice(0, 12).map(m => `
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
                        ${(m['المنطقة'] ? `<div style="font-size: 0.8em; opacity: 0.6;"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(m['المنطقة'])}</div>` : '')}
                        ${(m['رقم الهاتف'] ? `<div style="font-size: 0.8em; opacity: 0.6;"><i class="fas fa-phone"></i> ${escapeHtml(m['رقم الهاتف'])}</div>` : '')}
                    </div>
                    <i class="fas fa-chevron-left" style="opacity: 0.5;"></i>
                </div>
            </div>
        `).join('');
        
        results.style.display = 'block';
        
        results.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', function() {
                const id = this.dataset.id;
                const merchant = merchantsList.find(m => m.id == id);
                
                if (merchant) {
                    newInput.value = `${merchant['رقم التاجر']} - ${merchant['اسم التاجر']}`;
                    if (hiddenId) hiddenId.value = id;
                    results.style.display = 'none';
                    
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
// تحميل وعرض كشف الحساب لتاجر محدد
// ============================================

export async function loadStatement() {
    const merchantId = document.getElementById('stmtMerchantId')?.value;
    
    if (!merchantId) {
        showToast('⚠️ يرجى اختيار تاجر من القائمة أولاً', 'warning');
        return;
    }
    
    if (!supabase) {
        showToast('❌ قاعدة البيانات غير جاهزة', 'error');
        return;
    }
    
    // عرض حالة التحميل
    showLoadingState();
    
    try {
        // جلب بيانات التاجر
        const { data: merchant, error: mErr } = await supabase
            .from('merchants')
            .select('*')
            .eq('id', merchantId)
            .single();
        if (mErr) throw mErr;
        
        // جلب التحويلات (مرتبة تصاعدياً)
        const { data: transfers, error: tErr } = await supabase
            .from('transfers')
            .select('*')
            .eq('رقم التاجر', merchantId)
            .order('created_at', { ascending: true });
        if (tErr) throw tErr;
        
        // جلب التحصيلات (مرتبة تصاعدياً)
        const { data: collections, error: cErr } = await supabase
            .from('collections')
            .select('*')
            .eq('رقم التاجر', merchantId)
            .order('created_at', { ascending: true });
        if (cErr) throw cErr;
        
        // عرض معلومات التاجر
        displayMerchantInfo(merchant);
        
        // دمج الحركات وترتيبها زمنياً
        const movements = mergeAndSortMovements(transfers, collections);
        
        // حساب الرصيد التراكمي
        const movementsWithBalance = calculateRunningBalance(movements);
        
        // عرض الجدول
        renderStatementTable(movementsWithBalance);
        
        // عرض الإحصائيات
        displayStats(merchant, transfers, collections);
        
        // إخفاء حالة التحميل
        hideLoadingState();
        
        if (window.Sound) window.Sound.play('success');
        
    } catch (err) {
        console.error(err);
        showToast('❌ حدث خطأ أثناء تحميل كشف الحساب', 'error');
        hideLoadingState();
    }
}

function mergeAndSortMovements(transfers, collections) {
    const movements = [];
    
    if (transfers) {
        transfers.forEach(t => {
            movements.push({
                date: t['التاريخ'],
                time: t['الوقت'],
                type: 'تحويل',
                amount: parseFloat(t['قيمة التحويل']) || 0,
                ref: t['الرقم المرجعي'],
                notes: t['ملاحظات'],
                createdAt: t['created_at'],
                machineNumber: t['رقم المكنة']
            });
        });
    }
    
    if (collections) {
        collections.forEach(c => {
            movements.push({
                date: c['التاريخ'],
                time: c['الوقت'],
                type: 'تحصيل',
                amount: -(parseFloat(c['قيمة التحصيل']) || 0),
                ref: c['الرقم المرجعي'],
                notes: c['ملاحظات'],
                createdAt: c['created_at'],
                machineNumber: c['رقم المكنة']
            });
        });
    }
    
    // ترتيب حسب created_at تصاعدي (الأقدم أولاً)
    movements.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    return movements;
}

function calculateRunningBalance(movements) {
    let runningBalance = 0;
    
    return movements.map(m => {
        runningBalance += m.amount;
        return { ...m, balance: runningBalance };
    });
}

// ============================================
// عرض معلومات التاجر
// ============================================

function displayMerchantInfo(merchant) {
    const infoDiv = document.getElementById('statementMerchantInfo');
    if (!infoDiv) return;
    
    infoDiv.innerHTML = `
        <div style="
            background: linear-gradient(135deg, rgba(0,212,255,0.1), rgba(0,153,204,0.1));
            border: 1px solid rgba(0,212,255,0.3);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 24px;
        ">
            <div style="
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 16px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            ">
                <div style="font-size: 1.8em; font-weight: bold; color: #00d4ff; margin-bottom: 6px;">
                    ${escapeHtml(merchant['اسم التاجر'] || '-')}
                </div>
                <div style="color: #888; font-size: 0.95em;">
                    <i class="fas fa-hashtag"></i> رقم التاجر: <strong>${escapeHtml(merchant['رقم التاجر'] || '-')}</strong>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                <div style="
                    background: rgba(0,0,0,0.2);
                    padding: 14px;
                    border-radius: 10px;
                    text-align: center;
                ">
                    <div style="color: #888; font-size: 0.85em; margin-bottom: 6px;">
                        <i class="fas fa-store"></i> النشاط
                    </div>
                    <div style="font-weight: 600;">${escapeHtml(merchant['اسم النشاط'] || '-')}</div>
                </div>
                
                <div style="
                    background: rgba(0,0,0,0.2);
                    padding: 14px;
                    border-radius: 10px;
                    text-align: center;
                ">
                    <div style="color: #888; font-size: 0.85em; margin-bottom: 6px;">
                        <i class="fas fa-phone"></i> الهاتف
                    </div>
                    <div style="font-weight: 600;">${escapeHtml(merchant['رقم الهاتف'] || '-')}</div>
                </div>
                
                <div style="
                    background: rgba(0,0,0,0.2);
                    padding: 14px;
                    border-radius: 10px;
                    text-align: center;
                ">
                    <div style="color: #888; font-size: 0.85em; margin-bottom: 6px;">
                        <i class="fas fa-map-marker-alt"></i> المنطقة
                    </div>
                    <div style="font-weight: 600;">${escapeHtml(merchant['المنطقة'] || '-')}</div>
                </div>
                
                <div style="
                    background: rgba(0,0,0,0.2);
                    padding: 14px;
                    border-radius: 10px;
                    text-align: center;
                ">
                    <div style="color: #888; font-size: 0.85em; margin-bottom: 6px;">
                        <i class="fas fa-home"></i> العنوان
                    </div>
                    <div style="font-weight: 600;">${escapeHtml(merchant['العنوان'] || '-')}</div>
                </div>
                
                <div style="
                    background: rgba(0,0,0,0.2);
                    padding: 14px;
                    border-radius: 10px;
                    text-align: center;
                ">
                    <div style="color: #888; font-size: 0.85em; margin-bottom: 6px;">
                        <i class="fas fa-credit-card</i> رقم الحساب
                    </div>
                    <div style="font-weight: 600; direction: ltr; text-align: left;">${escapeHtml(merchant['رقم الحساب'] || '-')}</div>
                </div>
                
                <div id="finalBalanceContainer"
                    style="
                    background: linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,153,204,0.2));
                    padding: 14px;
                    border-radius: 10px;
                    text-align: center;
                    border: 1px solid rgba(0,212,255,0.4);
                ">
                    <div style="color: #888; font-size: 0.85em; margin-bottom: 6px;">
                        <i class="fas fa-wallet"></i> الرصيد النهائي
                    </div>
                    <div id="finalBalance" style="font-weight: bold; font-size: 1.2em; color: #00d4ff;">0 ج.م</div>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// عرض الإحصائيات
// ============================================

function displayStats(merchant, transfers, collections) {
    const totalTransfers = (transfers || []).reduce((sum, t) => sum + (parseFloat(t['قيمة التحويل']) || 0), 0);
    const totalCollections = (collections || []).reduce((sum, c) => sum + (parseFloat(c['قيمة التحصيل']) || 0), 0);
    const balance = totalTransfers - totalCollections;
    
    const statsDiv = document.getElementById('statementStats');
    if (statsDiv) {
        statsDiv.innerHTML = `
            <div style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 16px;
                margin-bottom: 24px;
            ">
                <div style="
                    background: linear-gradient(135deg, rgba(255,107,107,0.15), rgba(255,71,87,0.15));
                    border: 1px solid rgba(255,107,107,0.3);
                    border-radius: 12px;
                    padding: 18px;
                    text-align: center;
                ">
                    <div style="color: #ff6b6b; font-size: 0.9em; margin-bottom: 8px;">
                        <i class="fas fa-arrow-down"></i> إجمالي التحويلات
                    </div>
                    <div style="font-size: 1.5em; font-weight: bold; color: #ff6b6b;">
                        ${formatMoney(totalTransfers)}
                    </div>
                </div>
                
                <div style="
                    background: linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,200,100,0.15));
                    border: 1px solid rgba(0,255,136,0.3);
                    border-radius: 12px;
                    padding: 18px;
                    text-align: center;
                ">
                    <div style="color: #00ff88; font-size: 0.9em; margin-bottom: 8px;">
                        <i class="fas fa-arrow-up"></i> إجمالي التحصيلات
                    </div>
                    <div style="font-size: 1.5em; font-weight: bold; color: #00ff88;">
                        ${formatMoney(totalCollections)}
                    </div>
                </div>
                
                <div style="
                    background: linear-gradient(135deg, ${balance >= 0 ? 'rgba(255,215,0,0.15)' : 'rgba(0,255,136,0.15)'});
                    border: 1px solid ${balance >= 0 ? 'rgba(255,215,0,0.3)' : 'rgba(0,255,136,0.3)'};
                    border-radius: 12px;
                    padding: 18px;
                    text-align: center;
                ">
                    <div style="color: ${balance >= 0 ? '#ffd700' : '#00ff88'}; font-size: 0.9em; margin-bottom: 8px;">
                        <i class="fas fa-balance-scale"></i> ${balance >= 0 ? 'المستحق على التاجر' : 'رصيد دائن'}
                    </div>
                    <div style="font-size: 1.5em; font-weight: bold; color: ${balance >= 0 ? '#ffd700' : '#00ff88'};">
                        ${formatMoney(Math.abs(balance))}
                    </div>
                </div>
                
                <div style="
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 18px;
                    text-align: center;
                ">
                    <div style="color: #888; font-size: 0.9em; margin-bottom: 8px;">
                        <i class="fas fa-exchange-alt"></i> عدد العمليات
                    </div>
                    <div style="font-size: 1.5em; font-weight: bold; color: #00d4ff;">
                        ${(transfers?.length || 0) + (collections?.length || 0)}
                    </div>
                </div>
            </div>
        `;
    }
    
    const finalBalanceSpan = document.getElementById('finalBalance');
    if (finalBalanceSpan) {
        finalBalanceSpan.textContent = formatMoney(balance);
        finalBalanceSpan.style.color = balance >= 0 ? '#ff6b6b' : '#00ff88';
    }
}

// ============================================
// عرض جدول الحركات
// ============================================

function renderStatementTable(movements) {
    const tbody = document.getElementById('statementTableBody');
    if (!tbody) return;
    
    if (!movements.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:40px; color:#888;">
                    <i class="fas fa-inbox" style="font-size: 2em; margin-bottom: 12px; display: block;"></i>
                    لا توجد حركات لهذا التاجر
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = movements.map((m, idx) => {
        const isPositive = m.amount > 0;
        const amountClass = isPositive ? 'amount-positive' : 'amount-negative';
        const badgeClass = m.type === 'تحويل' ? 'badge-danger' : 'badge-success';
        const badgeIcon = m.type === 'تحويل' ? 'fa-arrow-down' : 'fa-arrow-up';
        
        return `
            <tr style="animation: fadeInUp 0.3s ease-out ${idx * 0.03}s both;">
                <td>${idx + 1}</td>
                <td>${formatDate(m.date)}</td>
                <td>${formatTime(m.time)}</td>
                <td>
                    <span class="${badgeClass}" style="
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 0.85em;
                        font-weight: 600;
                    ">
                        <i class="fas ${badgeIcon}"></i> ${m.type}
                    </span>
                </td>
                <td style="
                    font-weight: bold;
                    color: ${isPositive ? '#ff6b6b' : '#00ff88'};
                ">
                    ${isPositive ? '+' : ''}${formatMoney(Math.abs(m.amount))}
                </td>
                <td style="
                    font-weight: bold;
                    color: ${m.balance >= 0 ? '#ffd700' : '#00ff88'};
                    background: ${m.balance >= 0 ? 'rgba(255,215,0,0.08)' : 'rgba(0,255,136,0.08)'};
                    border-radius: 6px;
                    padding: 6px 10px;
                ">
                    ${formatMoney(m.balance)}
                </td>
                <td title="${escapeHtml(m.notes || '')}">
                    ${m.notes ? escapeHtml(m.notes.length > 30 ? m.notes.substring(0, 30) + '...' : m.notes) : '-'}
                </td>
            </tr>
        `;
    }).join('');
    
    // إضافة أنيميشن CSS إذا لم تكن موجودة
    if (!document.getElementById('statementAnimationStyle')) {
        const style = document.createElement('style');
        style.id = 'statementAnimationStyle';
        style.textContent = `
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// ============================================
// حالات التحميل
// ============================================

function showLoadingState() {
    const container = document.getElementById('statementContent') || document.querySelector('.section-statement');
    if (container) {
        container.style.opacity = '0.6';
        container.style.pointerEvents = 'none';
    }
    
    // إظهار مؤشر التحميل
    let loader = document.getElementById('statementLoader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'statementLoader';
        loader.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size: 2em;"></i><br><br>جاري تحميل كشف الحساب...';
        loader.style.cssText = `
            text-align: center;
            padding: 50px;
            color: #00d4ff;
        `;
        const tableContainer = document.getElementById('statementTableBody')?.parentNode?.parentNode;
        if (tableContainer) tableContainer.parentNode.insertBefore(loader, tableContainer);
    }
    loader.style.display = 'block';
}

function hideLoadingState() {
    const container = document.getElementById('statementContent') || document.querySelector('.section-statement');
    if (container) {
        container.style.opacity = '1';
        container.style.pointerEvents = 'auto';
    }
    
    const loader = document.getElementById('statementLoader');
    if (loader) loader.style.display = 'none';
}

// ربط الدوال بالنافذة العامة
window.loadMerchantsForStatement = loadMerchantsForStatement;
window.loadStatement = loadStatement;</code></pre>
        </div>

        <div class="footer">
            <p>✅ تم إنشاء هذا الملف بواسطة Axentro Development Team</p>
            <p style="margin-top: 10px;">📁 المسار: src/pages/statement.js | 🔄 الحالة: مُحدَّث بالكامل</p>
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
