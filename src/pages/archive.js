/**
 * Archive Page
 * Monthly closing and archive management
 */

import { getArchives, getTransfers, getCollections } from '../ui/stateManager.js';
import { showConfirm } from '../ui/modals.js';
import { showToast } from '../ui/toast.js';
import { formatMoney } from '../utils/formatters.js';
import { 
    getAllArchives, closeMonth as closeMonthService, removeArchive 
} from '../services/archiveService.js';
import { showLoading } from '../core/app.js';

/**
 * Render archive table
 */
export function renderArchive() {
    const list = [...getArchives()];
    const tbody = document.getElementById('archiveTable');

    // Empty state
    if (!list.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-archive"></i>
                    <p>لا يوجد أرشيف</p>
                </td>
            </tr>
        `;
        return;
    }

    // Render rows
    tbody.innerHTML = list.map((archive, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${archive["الشهر"]}</strong></td>
            <td>${archive["عدد التحويلات"] || 0}</td>
            <td>${formatMoney(archive["إجمالي التحويلات"])}</td>
            <td>${archive["عدد التحصيلات"] || 0}</td>
            <td>${formatMoney(archive["إجمالي التحصيلات"])}</td>
            <td>
                <strong style="color:var(--danger);">
                    ${formatMoney(archive["إجمالي المتبقي"])}
                </strong>
            </td>
            <td>
                <button class="btn btn-danger btn-sm" 
                        onclick="window.App.deleteArchive('${archive["رقم الأرشيف"]}')" 
                        title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Confirm and execute month closing
 */
export function confirmCloseMonth() {
    const monthName = new Date().toLocaleString('ar-EG', { 
        month: 'long', 
        year: 'numeric' 
    });

    showConfirm(
        `إغلاق شهر "${monthName}"؟\n\nسيتم:\n• أرشفة جميع التحويلات والتحصيلات\n• بدء شهر جديد نظيف`,
        async () => {
            showLoading(true);
            
            try {
                await closeMonthService(getTransfers(), getCollections());
                
                showToast(`✅ تم إغلاق "${monthName}" بنجاح`, 'success');
                
                const { refreshAllData } = await import('../core/app.js');
                await refreshAllData();
            } catch (error) {
                showToast('❌ ' + error.message, 'error');
            } finally {
                showLoading(false);
            }
        },
        'نعم، أغلق'
    );
}

/**
 * Delete archive record
 * @param {string} archiveId - Archive ID
 */
export async function deleteArchive(archiveId) {
    showConfirm(
        'حذف هذا الأرشيف؟ لا يمكن التراجع!',
        async () => {
            showLoading(true);
            
            try {
                await removeArchive(archiveId);
                showToast('✅ تم حذف الأرشيف', 'success');
                
                const { refreshAllData } = await import('../core/app.js');
                await refreshAllData();
            } catch (error) {
                showToast('❌ ' + error.message, 'error');
            } finally {
                showLoading(false);
            }
        },
        'نعم، احذف'
    );
}
