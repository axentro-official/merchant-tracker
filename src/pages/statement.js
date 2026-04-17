/**
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
    supabase = window.supabaseClient || window.supabase;
}

// تحميل قائمة التجار لعرضها في خانة البحث
export async function loadMerchantsForStatement() {
    if (!supabase) return;
    
    try {
        const { data, error } = await supabase
            .from('merchants')
            .select('id, "رقم التاجر", "اسم التاجر", "اسم النشاط", "رقم الحساب", "رقم الهاتف", "المنطقة", "العنوان"')
            .order('updated_at', { ascending: false });
            
        if (error) throw error;
        merchantsList = data || [];
        
        // 🔧 تحديث datalist
        const datalist = document.getElementById('merchantDatalistStmt');
        if (datalist) {
            datalist.innerHTML = merchantsList.map(m => `<option value="${escapeHtml(m['رقم التاجر'])} - ${escapeHtml(m['اسم التاجر'])}"></option>`).join('');
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
            <div class="search-result-item" data-id="${m.id}" style="padding:12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.08);">
                <div style="font-weight:700;">${escapeHtml(m['اسم التاجر'])}</div>
                <div style="font-size:12px;opacity:.8;">${escapeHtml(m['رقم التاجر'])} | ${escapeHtml(m['اسم النشاط'] || '-')}</div>
                <div style="font-size:11px;opacity:.7;">${m['المنطقة'] ? escapeHtml(m['المنطقة']) : ''} ${m['رقم الهاتف'] ? ' | ' + escapeHtml(m['رقم الهاتف']) : ''}</div>
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
        
            
                
                    ${escapeHtml(merchant['اسم التاجر'] || '-')}
                
                
                     رقم التاجر: ${escapeHtml(merchant['رقم التاجر'] || '-')}
                
            
            
            
                
                    
                         النشاط
                    
                    ${escapeHtml(merchant['اسم النشاط'] || '-')}
                
                
                
                    
                         الهاتف
                    
                    ${escapeHtml(merchant['رقم الهاتف'] || '-')}
                
                
                
                    
                         المنطقة
                    
                    ${escapeHtml(merchant['المنطقة'] || '-')}
                
                
                
                    
                         العنوان
                    
                    ${escapeHtml(merchant['العنوان'] || '-')}
                
                
                
                    
                        ${escapeHtml(merchant['رقم الحساب'] || '-')}
                
                
                
                    
                         الرصيد النهائي
                    
                    0 ج.م
                
            
        
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
            
                
                    
                         إجمالي التحويلات
                    
                    
                        ${formatMoney(totalTransfers)}
                    
                
                
                
                    
                         إجمالي التحصيلات
                    
                    
                        ${formatMoney(totalCollections)}
                    
                
                
                
                    
                         ${balance >= 0 ? 'المستحق على التاجر' : 'رصيد دائن'}
                    
                    
                        ${formatMoney(Math.abs(balance))}
                    
                
                
                
                    
                         عدد العمليات
                    
                    
                        ${(transfers?.length || 0) + (collections?.length || 0)}
                    
                
            
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
            
                
                    
                    لا توجد حركات لهذا التاجر
                
            
        `;
        return;
    }
    
    tbody.innerHTML = movements.map((m, idx) => {
        const isPositive = m.amount > 0;
        const amountClass = isPositive ? 'amount-positive' : 'amount-negative';
        const badgeClass = m.type === 'تحويل' ? 'badge-danger' : 'badge-success';
        const badgeIcon = m.type === 'تحويل' ? 'fa-arrow-down' : 'fa-arrow-up';
        
        return `
            
                ${idx + 1}
                ${formatDate(m.date)}
                ${formatTime(m.time)}
                
                    
                         ${m.type}
                    
                
                
                    ${isPositive ? '+' : ''}${formatMoney(Math.abs(m.amount))}
                
                
                    ${formatMoney(m.balance)}
                
                
                    ${m.notes ? escapeHtml(m.notes.length > 30 ? m.notes.substring(0, 30) + '...' : m.notes) : '-'}
                
            
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
        loader.innerHTML = 'جاري تحميل كشف الحساب...';
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
window.loadStatement = loadStatement;
