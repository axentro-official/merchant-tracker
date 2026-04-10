/**
 * Dashboard Page
 * Main dashboard with statistics and quick actions
 */

import { getSupabase } from '../config/supabase.js';
import { formatMoney, formatNumber, formatDate } from '../utils/formatters.js';
import { getTodayDate } from '../utils/helpers.js';

let supabase = null;

// تهيئة Supabase
export function initDashboardPage() {
    supabase = getSupabase();
}

// تحميل جميع إحصائيات لوحة التحكم
export async function loadDashboardStats() {
    if (!supabase) return;
    
    try {
        // 1. عدد التجار
        const { count: merchantsCount, error: mErr } = await supabase
            .from('merchants')
            .select('*', { count: 'exact', head: true });
        if (!mErr) updateStat('totalMerchants', merchantsCount || 0);
        
        // 2. عدد المكن
        const { count: machinesCount, error: macErr } = await supabase
            .from('machines')
            .select('*', { count: 'exact', head: true });
        if (!macErr) updateStat('totalMachines', machinesCount || 0);
        
        // 3. إجمالي التحويلات (كل الوقت)
        const { data: allTransfers, error: tErr } = await supabase
            .from('transfers')
            .select('"قيمة التحويل"');
        let totalTransfers = 0;
        if (!tErr && allTransfers) {
            totalTransfers = allTransfers.reduce((sum, t) => sum + (parseFloat(t['قيمة التحويل']) || 0), 0);
        }
        updateStat('totalTransfers', totalTransfers);
        
        // 4. إجمالي التحصيلات (كل الوقت)
        const { data: allCollections, error: cErr } = await supabase
            .from('collections')
            .select('"قيمة التحصيل"');
        let totalCollections = 0;
        if (!cErr && allCollections) {
            totalCollections = allCollections.reduce((sum, c) => sum + (parseFloat(c['قيمة التحصيل']) || 0), 0);
        }
        updateStat('totalCollections', totalCollections);
        
        // 5. المتبقي الكلي
        const remaining = totalTransfers - totalCollections;
        updateStat('totalRemaining', Math.max(0, remaining));
        
        // 6. تحويلات اليوم
        const today = getTodayDate();
        const { data: todayTransfers, error: tdErr } = await supabase
            .from('transfers')
            .select('"قيمة التحويل"')
            .eq('التاريخ', today);
        let todaySum = 0;
        if (!tdErr && todayTransfers) {
            todaySum = todayTransfers.reduce((sum, t) => sum + (parseFloat(t['قيمة التحويل']) || 0), 0);
        }
        updateStat('todayTransfers', todaySum);
        
        // يمكن إضافة تحديثات أخرى مثل "أعلى المكن تحقيقاً للتارجت" و"آخر العمليات"
        // سيتم استدعاؤها من مكان آخر (مثل loadTopMachines, loadRecentActivities)
        
    } catch (err) {
        console.error('Dashboard stats error:', err);
    }
}

// دالة مساعدة لتحديث قيمة عنصر HTML مع تأثير تزايدي (اختياري)
function updateStat(elementId, value, animate = true) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (animate && window.animateValue) {
        const current = parseFloat(element.textContent.replace(/[^0-9.-]/g, '')) || 0;
        window.animateValue(elementId, current, value, 800);
    } else {
        element.textContent = value.toLocaleString('ar-EG');
    }
}

// (اختياري) دالة لعرض آخر العمليات (تحويلات + تحصيلات)
export async function loadRecentActivities(limit = 5) {
    if (!supabase) return;
    const tbody = document.getElementById('recentActivityBody');
    if (!tbody) return;
    
    try {
        // جلب آخر 5 تحويلات
        const { data: transfers } = await supabase
            .from('transfers')
            .select('"الرقم المرجعي", "التاريخ", "الوقت", "اسم التاجر", "اسم النشاط", "قيمة التحويل", "created_at"')
            .order('created_at', { ascending: false })
            .limit(limit);
        
        // جلب آخر 5 تحصيلات
        const { data: collections } = await supabase
            .from('collections')
            .select('"الرقم المرجعي", "التاريخ", "الوقت", "اسم التاجر", "اسم النشاط", "قيمة التحصيل", "created_at"')
            .order('created_at', { ascending: false })
            .limit(limit);
        
        const activities = [];
        if (transfers) transfers.forEach(t => activities.push({
            ref: t['الرقم المرجعي'],
            date: t['التاريخ'],
            time: t['الوقت'],
            merchantName: t['اسم التاجر'],
            activityName: t['اسم النشاط'],
            amount: t['قيمة التحويل'],
            type: 'تحويل',
            createdAt: t['created_at']
        }));
        if (collections) collections.forEach(c => activities.push({
            ref: c['الرقم المرجعي'],
            date: c['التاريخ'],
            time: c['الوقت'],
            merchantName: c['اسم التاجر'],
            activityName: c['اسم النشاط'],
            amount: c['قيمة التحصيل'],
            type: 'تحصيل',
            createdAt: c['created_at']
        }));
        
        // ترتيب تنازلي حسب created_at
        activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const recent = activities.slice(0, limit);
        
        if (recent.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty-state"><i class="fas fa-inbox"></i> لا توجد عمليات حديثة</td></tr>';
            return;
        }
        
        tbody.innerHTML = recent.map((act, idx) => {
            const amount = (parseFloat(act.amount) || 0).toLocaleString();
            const badgeClass = act.type === 'تحويل' ? 'badge-danger' : 'badge-success';
            const statusBadge = '<span class="badge badge-info">مكتمل</span>';
            return `
                <tr>
                    <td>${idx+1}</td>
                    <td><code class="ref-code">${act.ref || '-'}</code></td>
                    <td><span class="badge ${badgeClass}">${act.type}</span></td>
                    <td>${act.merchantName || '-'}</td>
                    <td>${act.activityName || '-'}</td>
                    <td>${amount} ج.م</td>
                    <td>${act.date || '-'}</td>
                    <td>${act.time || '-'}</td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        }).join('');
        
    } catch (err) {
        console.error('Recent activities error:', err);
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">خطأ في تحميل البيانات</td></tr>';
    }
}

// دالة عرض أعلى المكن تحقيقاً للتارجت
export async function loadTopMachines(limit = 10) {
    if (!supabase) return;
    const tbody = document.getElementById('topMachinesBody');
    if (!tbody) return;
    
    try {
        // جلب جميع المكن مع بيانات التاجر (لأن اسم التاجر موجود في جدول merchants)
        const { data: machines, error: mErr } = await supabase.from('machines').select('*');
        if (mErr) throw mErr;
        if (!machines || machines.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty-state">لا توجد مكن مسجلة</td></tr>';
            return;
        }
        
        // جلب جميع التحويلات لحساب المحقق لكل مكنة
        const { data: transfersAll } = await supabase.from('transfers').select('"رقم المكنة","قيمة التحويل"');
        const machineAchieved = {};
        if (transfersAll) {
            transfersAll.forEach(t => {
                const machineId = t['رقم المكنة'];
                if (machineId) {
                    const amount = parseFloat(t['قيمة التحويل']) || 0;
                    machineAchieved[machineId] = (machineAchieved[machineId] || 0) + amount;
                }
            });
        }
        
        // تجهيز البيانات مع حساب النسبة
        const machinesWithStats = machines.map(m => {
            const target = parseFloat(m['التارجت الشهري']) || 0;
            const achieved = machineAchieved[m['رقم المكنة']] || 0;
            const percentage = target > 0 ? Math.min(100, (achieved / target) * 100) : 0;
            return { ...m, achieved, percentage, target };
        });
        
        machinesWithStats.sort((a, b) => b.percentage - a.percentage);
        const topList = machinesWithStats.slice(0, limit);
        
        tbody.innerHTML = topList.map((m, idx) => {
            const percentage = m.percentage.toFixed(1);
            const percentClass = m.percentage >= 80 ? 'achieved-highlight' : '';
            return `
                <tr>
                    <td>${idx+1}</td>
                    <td>${m['رقم التاجر'] || '-'}</td>
                    <td>${m['اسم التاجر'] || '-'}</td>
                    <td>${m['اسم النشاط'] || '-'}</td>
                    <td><code class="ref-code">${m['رقم المكنة'] || '-'}</code></td>
                    <td><code>${m['الرقم التسلسلي'] || '-'}</code></td>
                    <td>${m.target.toLocaleString()} ج.م</td>
                    <td class="${percentClass}">${m.achieved.toLocaleString()} ج.م</td>
                    <td>
                        <div class="progress-wrapper">
                            <div class="progress-bar-bg"><div class="progress-fill" style="width: ${percentage}%;"></div></div>
                            <span class="percentage-text">${percentage}%</span>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
    } catch (err) {
        console.error('Top machines error:', err);
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">خطأ في تحميل البيانات</td></tr>';
    }
}
