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
    const detailsContainer = document.getElementById('dbTableDetails');
    const thead = document.getElementById('dbDataHead');
    const tbody = document.getElementById('dbDataBody');
    const rowCountEl = document.getElementById('dbRowCount');

    if (container) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-pulse"></i> جاري اكتشاف الجداول...</div>';
    }

    if (detailsContainer) detailsContainer.style.display = 'none';
    if (thead) thead.innerHTML = '';
    if (tbody) tbody.innerHTML = '';
    if (rowCountEl) rowCountEl.textContent = '0 صف';

    try {
        const tablesToCheck = [
            'merchants',
            'machines',
            'transfers',
            'collections',
            'requests',
            'archives',
            'logs',
            'settings'
        ];

        discoveredTables = [];

        for (const tableName of tablesToCheck) {
            try {
                const { count, error } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });

                if (error) {
                    discoveredTables.push({
                        name: tableName,
                        count: 0,
                        columns: getDefaultColumns(tableName),
                        status: 'error',
                        error: error.message
                    });
                    continue;
                }

                let columns = [];
                const { data: sample, error: sampleError } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);

                if (!sampleError && Array.isArray(sample) && sample.length > 0) {
                    columns = Object.keys(sample[0]);
                } else {
                    columns = getDefaultColumns(tableName);
                }

                discoveredTables.push({
                    name: tableName,
                    count: count || 0,
                    columns,
                    status: 'connected'
                });
            } catch (err) {
                discoveredTables.push({
                    name: tableName,
                    count: 0,
                    columns: getDefaultColumns(tableName),
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

        if (container) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-database"></i> حدث خطأ أثناء الاكتشاف</div>';
        }
    }
}

function getDefaultColumns(tableName) {
    const defaults = {
        merchants: [
            'id',
            'رقم التاجر',
            'اسم التاجر',
            'اسم النشاط',
            'رقم الحساب',
            'رقم الهاتف',
            'المنطقة',
            'العنوان',
            'الحالة',
            'ملاحظات',
            'تاريخ الإنشاء',
            'وقت الإنشاء',
            'updated_at'
        ],
        machines: [
            'id',
            'رقم المكنة',
            'الرقم التسلسلي',
            'رقم التاجر',
            'اسم التاجر',
            'اسم النشاط',
            'رقم الحساب',
            'التارجت الشهري',
            'الحالة',
            'تاريخ الإسناد',
            'ملاحظات',
            'وقت الإنشاء',
            'updated_at'
        ],
        transfers: [
            'id',
            'الرقم المرجعي',
            'التاريخ',
            'الوقت',
            'الشهر',
            'رقم التاجر',
            'اسم التاجر',
            'اسم النشاط',
            'رقم المكنة',
            'رقم الحساب',
            'نوع التحويل',
            'قيمة التحويل',
            'ملاحظات',
            'وقت الإنشاء',
            'created_at'
        ],
        collections: [
            'id',
            'الرقم المرجعي',
            'التاريخ',
            'الوقت',
            'الشهر',
            'رقم التاجر',
            'اسم التاجر',
            'اسم النشاط',
            'رقم المكنة',
            'رقم الحساب',
            'قيمة التحصيل',
            'نوع التحصيل',
            'المتبقي بعد التحصيل',
            'ملاحظات',
            'وقت الإنشاء',
            'created_at'
        ],
        requests: [
            'id',
            'رقم الطلب',
            'التاريخ',
            'الوقت',
            'رقم التاجر',
            'اسم التاجر',
            'اسم النشاط',
            'رقم الحساب',
            'رقم المكنة',
            'المديونية الحالية',
            'نوع الطلب',
            'المبلغ',
            'ملاحظات',
            'الحالة',
            'وقت الإنشاء',
            'created_at'
        ],
        archives: [
            'id',
            'رقم الأرشيف',
            'الشهر',
            'سنة التشغيل',
            'عدد التحويلات',
            'إجمالي التحويلات',
            'عدد التحصيلات',
            'إجمالي التحصيلات',
            'إجمالي المتبقي',
            'تاريخ الإغلاق',
            'رابط الملف',
            'ملاحظات',
            'وقت الإنشاء',
            'تاريخ الإنشاء',
            'created_at'
        ],
        logs: [
            'id',
            'التاريخ',
            'الوقت',
            'النوع',
            'الرقم المرجعي',
            'التفاصيل',
            'المستخدم',
            'اسم التاجر',
            'رقم الحساب',
            'اسم النشاط',
            'رقم المكنة',
            'الرقم التسلسلي',
            'وقت الإنشاء',
            'table_name',
            'operation',
            'user_id',
            'ip_address',
            'metadata',
            'level',
            'message',
            'created_at'
        ],
        settings: [
            'id',
            'الخاصية',
            'القيمة',
            'created_at',
            'updated_at'
        ]
    };

    return defaults[tableName] || ['id'];
}

function getOrderCandidates(tableName) {
    const priorityMap = {
        merchants: ['updated_at', 'تاريخ الإنشاء', 'وقت الإنشاء'],
        machines: ['updated_at', 'تاريخ الإسناد', 'وقت الإنشاء'],
        transfers: ['created_at', 'التاريخ', 'وقت الإنشاء'],
        collections: ['created_at', 'التاريخ', 'وقت الإنشاء'],
        requests: ['created_at', 'التاريخ', 'وقت الإنشاء'],
        archives: ['created_at', 'تاريخ الإغلاق', 'تاريخ الإنشاء'],
        logs: ['created_at', 'التاريخ', 'وقت الإنشاء'],
        settings: ['updated_at', 'created_at']
    };

    return priorityMap[tableName] || ['created_at', 'updated_at'];
}

function getAvailableOrderColumn(tableName, columns = []) {
    const candidates = getOrderCandidates(tableName);
    return candidates.find((column) => columns.includes(column)) || null;
}

function renderDatabaseExplorer() {
    const container = document.getElementById('dbTablesList');
    if (!container) return;

    if (!discoveredTables.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-database"></i> لم يتم العثور على جداول</div>';
        return;
    }

    container.innerHTML = discoveredTables.map((table) => {
        const statusIcon = table.status === 'connected'
            ? '<i class="fas fa-check-circle" style="color: var(--success);"></i>'
            : '<i class="fas fa-exclamation-circle" style="color: var(--danger);"></i>';

        const statusClass = selectedTableName === table.name ? 'active' : '';
        const errorHtml = table.status === 'error' && table.error
            ? `<div style="margin-top:10px;color:var(--danger);font-size:12px;">${escapeHtml(table.error)}</div>`
            : '';

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
                        ${table.columns.map((col) => `<span class="db-column-item">${escapeHtml(col)}</span>`).join('')}
                    </div>
                </div>
                ${errorHtml}
            </div>
        `;
    }).join('');
}

export async function selectTable(tableName, event) {
    selectedTableName = tableName;

    document.querySelectorAll('.db-table-card').forEach((card) => {
        card.classList.remove('active');
        const columnsDiv = card.querySelector('.db-columns-list');
        if (columnsDiv) columnsDiv.style.display = 'none';
    });

    if (event?.currentTarget) {
        event.currentTarget.classList.add('active');
        const columnsDiv = event.currentTarget.querySelector('.db-columns-list');
        if (columnsDiv) columnsDiv.style.display = 'block';
    }

    await loadTableData(tableName);
}

function stringifyCellValue(value) {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value, null, 2);
        } catch (e) {
            return String(value);
        }
    }
    return String(value);
}

function buildCell(value) {
    const fullValue = stringifyCellValue(value);
    const shortValue = fullValue.length > 120 ? `${fullValue.slice(0, 120)}...` : fullValue;
    return `<td title="${escapeHtml(fullValue)}">${escapeHtml(shortValue)}</td>`;
}

async function runTableQuery(tableName, columns) {
    const orderColumn = getAvailableOrderColumn(tableName, columns);

    if (orderColumn) {
        const ordered = await supabase
            .from(tableName)
            .select('*', { count: 'exact' })
            .order(orderColumn, { ascending: false })
            .limit(50);

        if (!ordered.error) return ordered;
    }

    return supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(50);
}

async function loadTableData(tableName) {
    const detailsContainer = document.getElementById('dbTableDetails');
    const tableNameEl = document.getElementById('dbSelectedTableName');
    const rowCountEl = document.getElementById('dbRowCount');
    const thead = document.getElementById('dbDataHead');
    const tbody = document.getElementById('dbDataBody');

    if (!detailsContainer || !tbody || !thead) return;

    detailsContainer.style.display = 'block';

    if (tableNameEl) {
        tableNameEl.innerHTML = `<i class="fas fa-table"></i> جدول: ${escapeHtml(tableName)}`;
    }

    thead.innerHTML = '';
    tbody.innerHTML = '<tr><td colspan="100" class="empty-state"><i class="fas fa-spinner fa-pulse"></i> جاري تحميل البيانات...</td></tr>';

    try {
        const selectedTable = discoveredTables.find((t) => t.name === tableName);
        const knownColumns = selectedTable?.columns?.length ? selectedTable.columns : getDefaultColumns(tableName);

        const { data, count, error } = await runTableQuery(tableName, knownColumns);
        if (error) throw error;

        if (rowCountEl) {
            rowCountEl.textContent = `${count || 0} صف`;
        }

        if (!data || data.length === 0) {
            const columns = knownColumns.length ? knownColumns : ['لا توجد أعمدة'];
            thead.innerHTML = `
                <tr>
                    ${columns.map((col) => `<th>${escapeHtml(col)}</th>`).join('')}
                </tr>
            `;
            tbody.innerHTML = `<tr><td colspan="${columns.length}" class="empty-state">لا توجد بيانات</td></tr>`;
            return;
        }

        const actualColumns = Object.keys(data[0]);

        thead.innerHTML = `
            <tr>
                ${actualColumns.map((col) => `<th>${escapeHtml(col)}</th>`).join('')}
            </tr>
        `;

        tbody.innerHTML = data.map((row) => `
            <tr>
                ${actualColumns.map((col) => buildCell(row[col])).join('')}
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
        const message = err?.message || 'حدث خطأ غير متوقع';
        tbody.innerHTML = `
            <tr>
                <td colspan="100" class="empty-state" style="color: var(--danger);">
                    خطأ: ${escapeHtml(message)}
                </td>
            </tr>
        `;
    }
}

export async function refreshSelectedTable() {
    if (!selectedTableName) {
        showToast('اختر جدولاً أولاً', 'warning');
        return;
    }

    await loadTableData(selectedTableName);
    showToast('تم تحديث البيانات', 'success');
}

// ربط الدوال بالنافذة العامة
window.discoverDatabase = discoverDatabase;
window.selectTable = selectTable;
window.refreshSelectedTable = refreshSelectedTable;
