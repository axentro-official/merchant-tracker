/**
 * Statement Page
 * Account statement for individual merchants - مطابق لستايل index.html
 */

import { getSupabase } from '../config/supabase.js';
import { showToast } from '../ui/toast.js';
import { formatDate, formatTime, formatMoney, escapeHtml } from '../utils/formatters.js';

let supabase = null;
let merchantsList = [];

// تهيئة Supabase
export function initStatementPage() {
    supabase = getSupabase();
}

// تحميل قائمة التجار لعرضها في خانة الاختيار
export async function loadMerchantsForStatement() {
    if (!supabase) return;
    try {
        const { data, error } = await supabase
            .from('merchants')
            .select('id, "رقم التاجر", "اسم التاجر"')
            .order('created_at', { ascending: false });
        if (error) throw error;
        merchantsList = data || [];
        
        const select = document.getElementById('stmtMerchantId');
        if (select) {
            select.innerHTML = '<option value="">-- اختر تاجر --</option>' +
                merchantsList.map(m => `<option value="${m.id}">${m['رقم التاجر']} - ${m['اسم التاجر']}</option>`).join('');
        }
    } catch (err) {
        console.error(err);
        showToast('خطأ في تحميل قائمة التجار', 'error');
    }
}

// تحميل وعرض كشف الحساب لتاجر محدد
export async function loadStatement() {
    const merchantId = document.getElementById('stmtMerchantId')?.value;
    if (!merchantId) {
        showToast('يرجى اختيار تاجر', 'warning');
        return;
    }
    
    if (!supabase) {
        showToast('قاعدة البيانات غير جاهزة', 'error');
        return;
    }
    
    try {
        // جلب بيانات التاجر
        const { data: merchant, error: mErr } = await supabase
            .from('merchants')
            .select('*')
            .eq('id', merchantId)
            .single();
        if (mErr) throw mErr;
        
        // جلب التحويلات
        const { data: transfers, error: tErr } = await supabase
            .from('transfers')
            .select('*')
            .eq('رقم التاجر', merchantId)
            .order('created_at', { ascending: true }); // تصاعدي للأقدم أولاً
        if (tErr) throw tErr;
        
        // جلب التحصيلات
        const { data: collections, error: cErr } = await supabase
            .from('collections')
            .select('*')
            .eq('رقم التاجر', merchantId)
            .order('created_at', { ascending: true });
        if (cErr) throw cErr;
        
        // عرض معلومات التاجر
        displayMerchantInfo(merchant);
        
        // دمج الحركات وترتيبها زمنياً
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
                    createdAt: t['created_at']
                });
            });
        }
        if (collections) {
            collections.forEach(c => {
                movements.push({
                    date: c['التاريخ'],
                    time: c['الوقت'],
                    type: 'تحصيل',
                    amount: -(parseFloat(c['قيمة التحصيل']) || 0), // سالب للتحصيلات
                    ref: c['الرقم المرجعي'],
                    notes: c['ملاحظات'],
                    createdAt: c['created_at']
                });
            });
        }
        
        // ترتيب حسب created_at تصاعدي (الأقدم أولاً)
        movements.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        // حساب الرصيد التراكمي
        let runningBalance = 0;
        const movementsWithBalance = movements.map(m => {
            runningBalance += m.amount;
            return { ...m, balance: runningBalance };
        });
        
        // عرض الجدول
        renderStatementTable(movementsWithBalance);
        
        // عرض الإحصائيات
        displayStats(merchant, transfers, collections);
        
    } catch (err) {
        console.error(err);
        showToast('حدث خطأ أثناء تحميل كشف الحساب', 'error');
    }
}

function displayMerchantInfo(merchant) {
    const infoDiv = document.getElementById('statementMerchantInfo');
    if (!infoDiv) return;
    
    infoDiv.innerHTML = `
        <div class="info-card" style="margin-bottom: 20px;">
            <div class="merchant-name">${escapeHtml(merchant['اسم التاجر'] || '-')}</div>
            <div class="merchant-meta">
                <span class="meta-tag"><i class="fas fa-hashtag"></i> رقم التاجر: ${escapeHtml(merchant['رقم التاجر'] || '-')}</span>
                <span class="meta-tag"><i class="fas fa-briefcase"></i> النشاط: ${escapeHtml(merchant['اسم النشاط'] || '-')}</span>
                <span class="meta-tag"><i class="fas fa-phone"></i> الهاتف: ${escapeHtml(merchant['رقم الهاتف'] || '-')}</span>
            </div>
            <div class="info-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap: 16px; margin-top: 16px;">
                <div class="info-item"><div class="info-label">رقم الحساب</div><div class="info-value">${escapeHtml(merchant['رقم الحساب'] || '-')}</div></div>
                <div class="info-item"><div class="info-label">المنطقة</div><div class="info-value">${escapeHtml(merchant['المنطقة'] || '-')}</div></div>
                <div class="info-item highlight"><div class="info-label">الرصيد النهائي</div><div class="info-value" id="finalBalance">0 ج.م</div></div>
            </div>
        </div>
    `;
}

function displayStats(merchant, transfers, collections) {
    const totalTransfers = (transfers || []).reduce((sum, t) => sum + (parseFloat(t['قيمة التحويل']) || 0), 0);
    const totalCollections = (collections || []).reduce((sum, c) => sum + (parseFloat(c['قيمة التحصيل']) || 0), 0);
    const balance = totalTransfers - totalCollections;
    
    const statsDiv = document.getElementById('statementStats');
    if (statsDiv) {
        statsDiv.innerHTML = `
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px;">
                <div class="stat-card"><div class="stat-header"><div class="stat-icon blue"><i class="fas fa-arrow-up"></i></div></div><div class="stat-value">${formatMoney(totalTransfers)}</div><div class="stat-label">إجمالي التحويلات</div></div>
                <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-arrow-down"></i></div></div><div class="stat-value">${formatMoney(totalCollections)}</div><div class="stat-label">إجمالي التحصيلات</div></div>
                <div class="stat-card"><div class="stat-header"><div class="stat-icon purple"><i class="fas fa-balance-scale"></i></div></div><div class="stat-value" style="color: ${balance >= 0 ? 'var(--success)' : 'var(--danger)'};">${formatMoney(Math.abs(balance))}</div><div class="stat-label">${balance >= 0 ? 'المستحق على التاجر' : 'رصيد دائن'}</div></div>
            </div>
        `;
    }
    const finalBalanceSpan = document.getElementById('finalBalance');
    if (finalBalanceSpan) finalBalanceSpan.textContent = formatMoney(balance);
}

function renderStatementTable(movements) {
    const tbody = document.getElementById('statementTableBody');
    if (!tbody) return;
    
    if (!movements.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>لا توجد حركات لهذا التاجر</p>
                  側
              </tr>
        `;
        return;
    }
    
    tbody.innerHTML = movements.map((m, idx) => {
        const amountClass = m.amount > 0 ? 'amount-positive' : (m.amount < 0 ? 'amount-negative' : '');
        const badgeClass = m.type === 'تحويل' ? 'badge-danger' : 'badge-success';
        return `
            <tr>
                <td>${idx + 1}侧
                <td>${formatDate(m.date)}侧
                <td>${formatTime(m.time)}侧
                <td><span class="badge ${badgeClass}">${m.type}</span>侧
                <td class="${amountClass}">${formatMoney(Math.abs(m.amount))}侧
                <td><strong>${formatMoney(m.balance)}</strong>侧
                <td>${m.notes ? escapeHtml(m.notes) : '-'}侧
              </tr>
        `;
    }).join('');
}

// ربط الدوال بالنافذة العامة
window.loadMerchantsForStatement = loadMerchantsForStatement;
window.loadStatement = loadStatement;
