/**
 * Database Explorer Page
 * Visual database inspection tool
 */

import { getSupabase } from '../config/supabase.js';
import { fetchWithCount } from '../services/dbService.js';
import { showToast, showSuccess, showError } from '../ui/toast.js';
import { setLoading } from '../ui/stateManager.js';
import { showLoading } from '../core/app.js';

// Database explorer state
let discoveredTables = [];
let selectedTableName = null;

/**
 * Discover and display database tables
 */
export async function discoverDatabase() {
    const loadingText = document.getElementById('loadingText');
    if (loadingText) loadingText.textContent = 'جاري اكتشاف قاعدة البيانات...';
    
    showLoading(true);
    
    try {
        // Known tables to check
        const tablesToCheck = [
            'merchants', 'machines', 'transfers',
            'collections', 'requests', 'archives', 'logs'
        ];
        
        discoveredTables = [];
        const supabase = getSupabase();
        
        for (const tableName of tablesToCheck) {
            try {
                const { count, error } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true })
                    .limit(1);
                
                if (!error) {
                    discoveredTables.push({
                        name: tableName,
                        count: count || 0,
                        columns: getDefaultColumns(tableName),
                        status: 'connected'
                    });
                    
                    console.log(`✅ Discovered table: ${tableName} (${count || 0} rows)`);
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
        showSuccess('✅ تم اكتشاف قاعدة البيانات بنجاح');
        
    } catch (error) {
        console.error('❌ Database discovery error:', error);
        showError('❌ فشل اكتشاف قاعدة البيانات: ' + error.message);
    } finally {
        showLoading(false);
        if (loadingText) loadingText.textContent = 'جاري التحميل...';
    }
}

/**
 * Get default column names for known tables
 * @param {string} tableName - Table name
 * @returns {Array<string>}
 */
function getDefaultColumns(tableName) {
    const defaults = {
        merchants: ['رقم التاجر', 'اسم التاجر', 'اسم النشاط', 'رقم الحساب', 'رقم الهاتف', 'العنوان', 'المنطقة', 'الحالة', 'ملاحظات', 'created_at', 'updated_at'],
        machines: ['رقم المكنة', 'رقم التاجر', 'اسم التاجر', 'اسم النشاط', 'الرقم التسلسلي', 'رقم الحساب', 'التارجت الشهري', 'الحالة', 'ملاحظات', 'created_at', 'updated_at'],
        transfers: ['الرقم المرجعي', 'رقم التاجر', 'اسم التاجر', 'رقم الحساب', 'نوع التحويل', 'قيمة التحويل', 'التاريخ', 'الوقت', 'ملاحظات', 'الشهر', 'created_at', 'updated_at'],
        collections: ['الرقم المرجعي', 'رقم التاجر', 'اسم التاجر', 'رقم الحساب', 'قيمة التحصيل', 'نوع التحصيل', 'المتبقي بعد التحصيل', 'التاريخ', 'الوقت', 'ملاحظات', 'شهر', 'created_at', 'updated_at'],
        requests: ['رقم الطلب', 'رقم التاجر', 'اسم التاجر', 'رقم الحساب', 'نوع الطلب', 'المبلغ', 'المديونية الحالية', 'التاريخ', 'الوقت', 'الحالة', 'ملاحظات', 'created_at', 'updated_at'],
        archives: ['رقم الأرشيف', 'الشهر', 'عدد التحويلات', 'إجمالي التحويلات', 'عدد التحصيلات', 'إجمالي التحصيلات', 'إجمالي المتبقي', 'created_at'],
        logs: ['id', 'التاريخ', 'الوقت', 'النوع', 'الرقم المرجعي', 'التفاصيل', 'المستخدم', 'created_at']
    };
    
    return defaults[tableName] || ['id', 'created_at'];
}

/**
 * Render database explorer UI
 */
function renderDatabaseExplorer() {
    const container = document.getElementById('dbTablesList');
    
    if (!discoveredTables.length) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-database"></i>
                <p>لم يتم العثور على جداول</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = discoveredTables.map(table => {
        const statusIcon = table.status === 'connected' 
            ? '<i class="fas fa-check-circle" style="color: var(--success);"></i>' 
            : '<i class="fas fa-exclamation-circle" style="color: var(--danger);"></i>';
            
        const statusClass = selectedTableName === table.name ? 'active' : '';
        
        return `
            <div class="db-table-card ${statusClass}" onclick="window.App.selectTable('${table.name}', event)">
                <div class="db-table-name">
                    ${statusIcon}
                    <i class="fas fa-table"></i>
                    ${table.name}
                </div>
                <div class="db-table-info">
                    <div>عدد الصفوف: <strong>${table.count}</strong></div>
                    <div>عدد الأعمدة: <strong>${table.columns.length}</strong></div>
                </div>
                <div class="db-columns-list" id="columns-${table.name}">
                    <h4 style="margin-bottom: 0.5rem; font-size: 0.9rem;">الأعمدة:</h4>
                    ${table.columns.map(col => `
                        <div class="db-column-item">
                            <span class="db-column-name">${col}</span>
                            <span class="db-column-type">text</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Select and display table data
 * @param {string} tableName - Selected table name
 * @param {Event} event - Click event
 */
export async function selectTable(tableName, event) {
    selectedTableName = tableName;
    
    // Update UI selection
    document.querySelectorAll('.db-table-card').forEach(card => {
        card.classList.remove('active');
    });
    
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    
    // Toggle columns visibility
    document.querySelectorAll('.db-columns-list').forEach(list => {
        list.classList.remove('show');
    });
    
    const columnsList = document.getElementById(`columns-${tableName}`);
    if (columnsList) columnsList.classList.add('show');
    
    // Load and display table data
    await loadTableData(tableName);
}

/**
 * Load and display table data in explorer
 * @param {string} tableName - Table to load
 */
async function loadTableData(tableName) {
    const detailsContainer = document.getElementById('dbTableDetails');
    const tableNameEl = document.getElementById('dbSelectedTableName');
    const rowCountEl = document.getElementById('dbRowCount');
    const thead = document.getElementById('dbDataHead');
    const tbody = document.getElementById('dbDataBody');
    
    detailsContainer.style.display = 'block';
    tableNameEl.innerHTML = `<i class="fas fa-table"></i> جدول: ${tableName}`;
    
    showLoading(true);
    
    try {
        const { data, count } = await fetchWithCount(tableName, 50);
        
        rowCountEl.textContent = `${count || 0} صف`;
        
        if (!data || data.length === 0) {
            thead.innerHTML = '';
            tbody.innerHTML = `
                <tr>
                    <td colspan="100%" class="empty-state">
                        <p>لا توجد بيانات</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Get columns from first row
        const columns = Object.keys(data[0]);
        
        // Render header
        thead.innerHTML = `<tr>${columns.map(col => `<th>${col}</th>`).join('')}</tr>`;
        
        // Render body
        tbody.innerHTML = data.map(row => `
            <tr>${columns.map(col => {
                const value = row[col];
                const displayValue = value === null || value === undefined 
                    ? '-' 
                    : (typeof value === 'object' ? JSON.stringify(value) : String(value).substring(0, 50));
                    
                return `<td title="${displayValue}">${displayValue}</td>`;
            }).join('')}</tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading table data:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="100%" class="empty-state">
                    <p style="color: var(--danger);">خطأ: ${error.message}</p>
                </td>
            </tr>
        `;
    } finally {
        showLoading(false);
    }
}

/**
 * Refresh currently selected table data
 */
export async function refreshSelectedTable() {
    if (selectedTableName) {
        await loadTableData(selectedTableName);
    }
}

// Export for global access via window.App
window.App.selectTable = selectTable;
window.App.refreshSelectedTable = refreshSelectedTable;
