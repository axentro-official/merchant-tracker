/**
 * Database Explorer Page
 * Visual database inspection tool - مطابق لستايل index.html
 */

import { showToast } from '../ui/toast.js';
import { escapeHtml } from '../utils/formatters.js';

let supabase = null;
let discoveredTables = [];
let selectedTableName = null;

// تهيئة Supabase (باستخدام window.supabaseClient)
export function initDatabasePage() {
    supabase = window.supabaseClient;
}

// اكتشاف وعرض جداول قاعدة البيانات
export async function discoverDatabase() {
    if (!supabase) {
        showToast('قاعدة البيانات غير جاهزة', 'error');
        return;
    }
    
    const container = document.getElementById('dbTablesList');
    if (container) container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-pulse"></i> جاري اكتشاف الجداول...</div>';
    
    try {
        const tablesToCheck = [
            'merchants', 'machines', 'transfers',
            'collections', 'requests', 'archives', 'logs', 'settings'
        ];
        
        discoveredTables = [];
        
        for (const tableName of tablesToCheck) {
            try {
                const { count, error } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true })
                    .limit(1);
                
                if (!error) {
                    let columns = [];
                    const { data: sample } = await supabase.from(tableName).select('*').limit(1);
                    if (sample && sample.length > 0) {
                        columns = Object.keys(sample[0]);
                    } else {
                        columns = getDefaultColumns(tableName);
                    }
                    
                    discoveredTables.push({
                        name: tableName,
                        count: count || 0,
                        columns: columns,
                        status: 'connected'
                    });
                } else {
                    discoveredTables.push({
                        name: tableName,
                        count: 0,
                        columns: [],
                        status: 'error',
                        error: error.message
                    });
                }
            } catch (err) {
                discoveredTables.push({
                    name: tableName,
                    count: 0,
                    columns: [],
                    status: 'error',
                    error: err.message
                });
            }
        }
        
        renderDatabaseExplorer();
        showToast('✅ تم اكتشاف قاعدة البيانات', 'success');
        
    } catch (error) {
        console.error(error);
        showToast('فشل اكتشاف قاعدة البيانات', 'error');
        if (container) container.innerHTML = '<div class="empty-state"><i class="fas fa-database"></i> حدث خطأ أثناء الاكتشاف</div>';
    }
}

function getDefaultColumns(tableName) {
    const defaults = {
        merchants: ['id', 'رقم التاجر', 'اسم التاجر', 'اسم النشاط', 'رقم الحساب', 'رقم الهاتف', 'المنطقة', 'العنوان', 'الحالة', 'updated_at'],
        machines: ['id', 'رقم المكنة', 'الرقم التسلسلي', 'رقم التاجر', 'اسم التاجر', 'اسم النشاط', 'رقم الحساب', 'التارجت الشهري', 'الحالة', 'updated_at'],
        transfers: ['id', 'الرقم المرجعي', 'التاريخ', 'الوقت', 'الشهر', 'رقم التاجر', 'اسم التاجر', 'اسم النشاط', 'قيمة التحويل', 'نوع التحويل', 'updated_at'],
        collections: ['id', 'الرقم المرجعي', 'التاريخ', 'الوقت', 'الشهر', 'رقم التاجر', 'اسم التاجر', 'اسم النشاط', 'قيمة التحصيل', 'نوع التحصيل', 'المتبقي بعد التحصيل', 'updated_at'],
        requests: ['id', 'رقم الطلب', 'التاريخ', 'الوقت', 'رقم التاجر', 'اسم التاجر', 'اسم النشاط', 'نوع الطلب', 'المبلغ', 'الحالة', 'updated_at'],
        archives: ['id', 'رقم الأرشيف', 'الشهر', 'سنة التشغيل', 'عدد التحويلات', 'إجمالي التحويلات', 'عدد التحصيلات', 'إجمالي التحصيلات', 'إجمالي المتبقي', 'تاريخ الإغلاق', 'updated_at'],
        logs: ['id', 'التاريخ', 'الوقت', 'النوع', 'التفاصيل', 'المستخدم', 'updated_at'],
        settings: ['id', 'الخاصية', 'القيمة', 'updated_at']
    };
    return defaults[tableName] || ['id', 'updated_at'];
}

function renderDatabaseExplorer() {
    const container = document.getElementById('dbTablesList');
    if (!container) return;
    
    if (!discoveredTables.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-database"></i> لم يتم العثور على جداول</div>';
        return;
    }
    
    container.innerHTML = discoveredTables.map(table => {
        const statusIcon = table.status === 'connected' 
            ? '<i class="fas fa-check-circle" style="color: var(--success);"></i>' 
            : '<i class="fas fa-exclamation-circle" style="color: var(--danger);"></i>';
        
        const statusClass = selectedTableName === table.name ? 'active' : '';
        
        return `
            <div class="db-table-card ${statusClass}" onclick="window.selectTable('${table.name}', event)">
                <div class="db-table-name">
                    ${statusIcon}
                    <i class="fas fa-table"></i>
                    <strong>${escapeHtml(table.name)}</strong>
                </div>
                <div class="db-table-info">
                    <span>عدد الصفوف: <strong>${table.count}</strong></span>
                    <span>عدد الأعمدة: <strong>${table.columns.length}</strong></span>
                </div>
                <div class="db-columns-list" id="columns-${table.name}" style="display: none;">
                    <h4>الأعمدة:</h4>
                    <div class="db-columns-grid">
                        ${table.columns.map(col => `<span class="db-column-item">${escapeHtml(col)}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

export async function selectTable(tableName, event) {
    selectedTableName = tableName;
    
    document.querySelectorAll('.db-table-card').forEach(card => {
        card.classList.remove('active');
        const columnsDiv = card.querySelector('.db-columns-list');
        if (columnsDiv) columnsDiv.style.display = 'none';
    });
    
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
        const columnsDiv = event.currentTarget.querySelector('.db-columns-list');
        if (columnsDiv) columnsDiv.style.display = 'block';
    }
    
    await loadTableData(tableName);
}

async function loadTableData(tableName) {
    const detailsContainer = document.getElementById('dbTableDetails');
    const tableNameEl = document.getElementById('dbSelectedTableName');
    const rowCountEl = document.getElementById('dbRowCount');
    const thead = document.getElementById('dbDataHead');
    const tbody = document.getElementById('dbDataBody');
    
    if (!detailsContainer) return;
    detailsContainer.style.display = 'block';
    if (tableNameEl) tableNameEl.innerHTML = `<i class="fas fa-table"></i> جدول: ${escapeHtml(tableName)}`;
    
    try {
        const { data, count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact' })
            .order('updated_at', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        
        if (rowCountEl) rowCountEl.textContent = `${count || 0} صف`;
        
        if (!data || data.length === 0) {
            if (thead) thead.innerHTML = '';
            if (tbody) tbody.innerHTML = '<tr><td colspan="100" class="empty-state">لا توجد بيانات<\/td></tr>';
            return;
        }
        
        const columns = Object.keys(data[0]);
        if (thead) {
            thead.innerHTML = `<tr>${columns.map(col => `<th>${escapeHtml(col)}</th>`).join('')}</tr>`;
        }
        
        if (tbody) {
            tbody.innerHTML = data.map(row => `
                <tr>
                    ${columns.map(col => {
                        let value = row[col];
                        if (value === null || value === undefined) value = '-';
                        else if (typeof value === 'object') value = JSON.stringify(value);
                        else value = String(value);
                        return `<td title="${escapeHtml(value)}">${escapeHtml(value.substring(0, 100))}${value.length > 100 ? '...' : ''}<\/td>`;
                    }).join('')}
                </tr>
            `).join('');
        }
        
    } catch (err) {
        console.error(err);
        if (tbody) tbody.innerHTML = `<td><td colspan="100" class="empty-state" style="color: var(--danger);">خطأ: ${escapeHtml(err.message)}<\/td></tr>`;
    }
}

export async function refreshSelectedTable() {
    if (selectedTableName) {
        await loadTableData(selectedTableName);
        showToast('تم تحديث البيانات', 'success');
    }
}

// ربط الدوال بالنافذة العامة
window.selectTable = selectTable;
window.refreshSelectedTable = refreshSelectedTable;
