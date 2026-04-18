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
    if (container) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-pulse"></i> جاري اكتشاف الجداول...</div>';
    }

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

                if (!error) {
                    let columns = [];

                    const { data: sample, error: sampleError } = await supabase
                        .from(tableName)
                        .select('*')
                        .limit(1);

                    if (!sampleError && sample && sample.length > 0) {
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
            'نوع التحصيل',
            'قيمة التحصيل',
            'المتبقي بعد التحصيل',
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
            'نوع الطلب',
            'المبلغ',
            'الحالة',
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

function getOrderColumn(tableName, columns = []) {
    const priorityMap = {
        merchants: ['updated_at', 'تاريخ الإنشاء'],
        machines: ['updated_at', 'تاريخ الإسناد', 'وقت الإنشاء'],
        transfers: ['created_at', 'التاريخ'],
        collections: ['created_at', 'التاريخ'],
        requests: ['created_at', 'التاريخ'],
        archives: ['created_at', 'تاريخ الإغلاق'],
        logs: ['created_at', 'التاريخ'],
        settings: ['updated_at', 'created_at']
    };

    const priorities = priorityMap[tableName] || ['created_at', 'updated_at'];

    for (const column of priorities) {
        if (columns.includes(column)) {
            return column;
        }
    }

    return null;
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

    if (!detailsContainer || !tbody || !thead) return;

    detailsContainer.style.display = 'block';
    if (tableNameEl) {
        tableNameEl.innerHTML = `<i class="fas fa-table"></i> جدول: ${escapeHtml(tableName)}`;
    }

    tbody.innerHTML = '<tr><td colspan="100" class="empty-state"><i class="fas fa-spinner fa-pulse"></i> جاري تحميل البيانات...</td></tr>';
    thead.innerHTML = '';

    try {
        let columns = [];
        const selectedTable = discoveredTables.find((t) => t.name === tableName);
        if (selectedTable?.columns?.length) {
            columns = selectedTable.columns;
        }

        let query = supabase
            .from(tableName)
            .select('*', { count: 'exact' });

        const orderColumn = getOrderColumn(tableName, columns);
        if (orderColumn) {
            query = query.order(orderColumn, { ascending: false });
        }

        query = query.limit(50);

        const { data, count, error } = await query;
        if (error) throw error;

        if (rowCountEl) {
            rowCountEl.textContent = `${count || 0} صف`;
        }

        if (!data || data.length === 0) {
            thead.innerHTML = '';
            tbody.innerHTML = '<tr><td colspan="100" class="empty-state">لا توجد بيانات</td></tr>';
            return;
        }

        const actualColumns = Object.keys(data[0]);

        thead.innerHTML = `
            <tr>
                ${actualColumns.map((col) => `<th>${escapeHtml(col)}</th>`).join('')}
            </tr>
        `;

        tbody.innerHTML = data.map((row) => {
            return `
                <tr>
                    ${actualColumns.map((col) => {
                        let value = row[col];

                        if (value === null || value === undefined) {
                            value = '-';
                        } else if (typeof value === 'object') {
                            value = JSON.stringify(value);
                        } else {
                            value = String(value);
                        }

                        const shortValue = value.length > 100 ? `${value.substring(0, 100)}...` : value;

                        return `<td title="${escapeHtml(value)}">${escapeHtml(shortValue)}</td>`;
                    }).join('')}
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `
            <tr>
                <td colspan="100" class="empty-state" style="color: var(--danger);">
                    خطأ: ${escapeHtml(err.message)}
                </td>
            </tr>
        `;
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
