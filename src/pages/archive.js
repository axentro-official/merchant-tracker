/**
 * Archive Page
 * Monthly closing and archive management - مطابق لستايل index.html
 */

import { showToast, showConfirm } from '../ui/toast.js';
import { escapeHtml, formatMoney, formatDate } from '../utils/formatters.js';
import { getCurrentArabicMonth } from '../utils/helpers.js';

let supabase = null;
let currentArchives = [];

// تهيئة Supabase (باستخدام window.supabaseClient)
export function initArchivePage() {
    supabase = window.supabaseClient;
}

// تحميل الأرشيف وعرضه
export async function loadArchives() {
    if (!supabase) return;
    try {
        const { data: archives, error } = await supabase
            .from('archives')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        currentArchives = archives || [];
        renderArchiveTable();
    } catch (err) {
        console.error(err);
        showToast('خطأ في تحميل الأرشيف', 'error');
    }
}

function renderArchiveTable() {
    const tbody = document.getElementById('archiveTableBody');
    if (!tbody) return;

    if (!currentArchives.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-archive"></i>
                    <p>لا يوجد أرشيف</p>
                   
                
        `;
        return;
    }

    tbody.innerHTML = currentArchives.map((arch, idx) => `
        <tr>
            <td>${idx + 1}  
            <td><strong>${escapeHtml(arch['الشهر'] || '-')}</strong>  
            <td>${arch['سنة التشغيل'] || '-'}  
            <td>${arch['عدد التحويلات'] || 0}  
            <td>${formatMoney(arch['إجمالي التحويلات'])}  
            <td>${arch['عدد التحصيلات'] || 0}  
            <td>${formatMoney(arch['إجمالي التحصيلات'])}  
            <td><strong style="color:var(--danger);">${formatMoney(arch['إجمالي المتبقي'])}</strong>  
            <td>
                <div class="action-btns">
                    <button class="btn btn-danger btn-sm" onclick="window.deleteArchive('${arch.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
            
    `).join('');
}

// دالة إغلاق الشهر الحالي وإنشاء أرشيف
export async function closeMonth() {
    const monthName = getCurrentArabicMonth();
    const currentYear = new Date().getFullYear();
    
    showConfirm(
        `إغلاق شهر "${monthName}"؟\n\nسيتم:\n• أرشفة جميع التحويلات والتحصيلات الخاصة بهذا الشهر\n• حذفها من الجداول النشطة\n• إنشاء سجل أرشيفي`,
        async () => {
            if (!supabase) {
                showToast('قاعدة البيانات غير جاهزة', 'error');
                return;
            }
            
            try {
                // 1. جلب جميع التحويلات والتحصيلات الخاصة بالشهر الحالي
                const { data: transfers, error: tErr } = await supabase
                    .from('transfers')
                    .select('*')
                    .eq('الشهر', monthName);
                if (tErr) throw tErr;
                
                const { data: collections, error: cErr } = await supabase
                    .from('collections')
                    .select('*')
                    .eq('الشهر', monthName);
                if (cErr) throw cErr;
                
                if ((!transfers || transfers.length === 0) && (!collections || collections.length === 0)) {
                    showToast(`لا توجد بيانات لإغلاق شهر ${monthName}`, 'warning');
                    return;
                }
                
                // 2. حساب الإحصائيات
                const totalTransfers = (transfers || []).reduce((sum, t) => sum + (parseFloat(t['قيمة التحويل']) || 0), 0);
                const totalCollections = (collections || []).reduce((sum, c) => sum + (parseFloat(c['قيمة التحصيل']) || 0), 0);
                const remaining = totalTransfers - totalCollections;
                
                // 3. إنشاء سجل الأرشيف
                const archiveData = {
                    "الشهر": monthName,
                    "سنة التشغيل": currentYear,
                    "عدد التحويلات": transfers?.length || 0,
                    "إجمالي التحويلات": totalTransfers,
                    "عدد التحصيلات": collections?.length || 0,
                    "إجمالي التحصيلات": totalCollections,
                    "إجمالي المتبقي": remaining,
                    "تاريخ الإغلاق": new Date().toISOString().split('T')[0]
                };
                
                const { error: insertErr } = await supabase
                    .from('archives')
                    .insert([archiveData]);
                if (insertErr) throw insertErr;
                
                // 4. حذف البيانات المؤرشفة من الجداول النشطة
                if (transfers && transfers.length) {
                    const transferIds = transfers.map(t => t.id);
                    const { error: delTErr } = await supabase
                        .from('transfers')
                        .delete()
                        .in('id', transferIds);
                    if (delTErr) console.warn('فشل حذف التحويلات:', delTErr);
                }
                if (collections && collections.length) {
                    const collectionIds = collections.map(c => c.id);
                    const { error: delCErr } = await supabase
                        .from('collections')
                        .delete()
                        .in('id', collectionIds);
                    if (delCErr) console.warn('فشل حذف التحصيلات:', delCErr);
                }
                
                showToast(`✅ تم إغلاق شهر ${monthName} بنجاح`, 'success');
                if (window.Sound) window.Sound.play('success');
                
                // تحديث الصفحات
                await loadArchives();
                if (window.loadDashboardStats) window.loadDashboardStats();
                if (window.loadRecentActivities) window.loadRecentActivities();
                if (window.loadTopMachines) window.loadTopMachines();
                if (window.loadTransfers) window.loadTransfers();
                if (window.loadCollections) window.loadCollections();
                
            } catch (err) {
                console.error(err);
                showToast('حدث خطأ أثناء إغلاق الشهر: ' + err.message, 'error');
                if (window.Sound) window.Sound.play('error');
            }
        },
        'نعم، أغلق الشهر'
    );
}

// حذف أرشيف
export function deleteArchive(archiveId) {
    showConfirm('هل تريد حذف هذا الأرشيف؟ لا يمكن التراجع!', async () => {
        try {
            const { error } = await supabase
                .from('archives')
                .delete()
                .eq('id', archiveId);
            if (error) throw error;
            showToast('تم حذف الأرشيف', 'success');
            if (window.Sound) window.Sound.play('success');
            await loadArchives();
        } catch (err) {
            showToast('خطأ في الحذف: ' + err.message, 'error');
            if (window.Sound) window.Sound.play('error');
        }
    });
}

// ربط الدوال بالنافذة العامة
window.closeMonth = closeMonth;
window.deleteArchive = deleteArchive;
