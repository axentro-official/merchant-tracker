/**
 * Requests Page
 * Handle merchant requests and conversions
 */

import { 
    getRequests, setRequests, setTransfers,
    getTransfers, getMerchants 
} from '../ui/stateManager.js';
import { showConfirm } from '../ui/modals.js';
import { showToast } from '../ui/toast.js';
import { escapeHtml, formatDate, formatTime, formatMoney, normalizeText } from '../utils/formatters.js';
import { 
    getAllRequests, deleteRequest as deleteRequestDB 
} from '../services/requestService.js'; // Will be created inline if needed
import { createTransferWithRef } from '../services/transactionService.js';
import { updateRequestStatus } from '../services/requestService.js'; // Helper function
import { logAction } from '../services/logService.js';
import { showLoading } from '../core/app.js';

// Inline request service functions (if not in separate file)
const requestService = {
    async getAll() {
        const { fetchAll } = await import('../services/dbService.js');
        return fetchAll('requests', { orderBy: 'created_at.asc' });
    },
    
    async delete(id) {
        const { deleteRecord } = await import('../services/dbService.js');
        return deleteRecord('requests', 'رقم الطلب', id);
    },
    
    async updateStatus(id, status) {
        const { updateRecord } = await import('../services/dbService.js');
        return updateRecord('requests', { "الحالة": status }, 'رقم الطلب', id);
    }
};

/**
 * Render requests table with statistics
 */
export async function renderRequests() {
    let list = [...getRequests()];
    const term = document.getElementById('requestSearch')?.value;

    // Apply search filter
    if (term) {
        const normalizedTerm = normalizeText(term).toLowerCase();
        list = list.filter(r =>
            normalizeText(r['اسم التاجر']).toLowerCase().includes(normalizedTerm) ||
            r['رقم الطلب']?.toString().includes(term)
        );
    }

    // Apply status filter
    const statusFilter = document.getElementById('requestStatusFilter')?.value;
    if (statusFilter) {
        list = list.filter(r => r['الحالة'] === statusFilter);
    }

    // Calculate statistics
    const pendingCount = getRequests().filter(r => r['الحالة'] === 'pending').length;
    const totalAmount = list.reduce((sum, r) => sum + (Number(r['المبلغ']) || 0), 0);

    // Update stat cards
    document.getElementById('reqTotalCount').textContent = list.length;
    document.getElementById('reqPendingCount').textContent = pendingCount;
    document.getElementById('reqTotalAmount').innerHTML = formatMoney(totalAmount);

    const tbody = document.getElementById('requestsTable');
    
    // Empty state
    if (!list.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">
                    <i class="fas fa-bell"></i>
                    <p>لا توجد طلبات</p>
                </td>
            </tr>
        `;
        return;
    }

    // Status mapping
    const statusMap = {
        'pending': ['معلق', 'warning'],
        'محوّل': ['محوّل', 'primary'],
        'مكتمل': ['مكتمل', 'success'],
        'مرفوض': ['مرفوض', 'danger']
    };

    // Render rows
    tbody.innerHTML = list.map((request, index) => {
        const [statusText, statusClass] = statusMap[request['الحالة']] || [request['الحالة'], 'secondary'];
        
        // Show convert button only for pending requests
        const convertBtn = request['الحالة'] === 'pending' 
            ? `<button class="btn btn-success btn-sm" onclick="window.App.convertRequest('${request['رقم الطلب']}')" title="تحويل تلقائي">
                    <i class="fas fa-exchange-alt"></i>
               </button>` 
            : '';

        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${request['رقم الطلب']}</strong></td>
                <td>${formatDate(request['التاريخ'])}</td>
                <td>${formatTime(request['وقت'])}</td>
                <td>${request['اسم التاجر']}</td>
                <td>${request['نوع الطلب']}</td>
                <td>
                    <strong style="color:var(--danger);">
                        ${formatMoney(request['المبلغ'])}
                    </strong>
                </td>
                <td>${formatMoney(request['المديونية الحالية'])}</td>
                <td>
                    <span class="badge badge-${statusClass}">${statusText}</span>
                </td>
                <td>
                    <div class="action-btns">
                        ${convertBtn}
                        <button class="btn btn-danger btn-sm" 
                                onclick="window.App.deleteRequest('${request['رقم الطلب']}')" 
                                title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Update pending requests badge count
 */
export function updatePendingBadge() {
    const count = getRequests().filter(r => r['الحالة'] === 'pending').length;
    const badge = document.getElementById('pendingBadge');
    
    if (count > 0) {
        badge.textContent = count;
        badge.classList.add('show');
    } else {
        badge.classList.remove('show');
    }
}

/**
 * Convert pending request to automatic transfer
 * @param {string} requestId - Request ID to convert
 */
export async function convertRequest(requestId) {
    const request = getRequests().find(r => r['رقم الطلب'] == requestId);
    
    if (!request) return;

    showConfirm(
        `تحويل الطلب "${requestId}" تلقائياً؟\nالمبلغ: ${formatMoney(request['المبلغ'])}`,
        async () => {
            showLoading(true);
            
            try {
                // Create transfer from request
                await createTransferWithRef({
                    "رقم التاجر": request['رقم التاجر'],
                    "اسم التاجر": request['اسم التاجر'],
                    "رقم الحساب": request['رقم الحساب'] || '',
                    "نوع التحويل": 'رصيد خدمات',
                    "قيمة التحويل": Number(request['المبلغ']),
                    "ملاحظات": `تحويل تلقائي من طلب: ${requestId}`
                });

                // Update request status
                await requestService.updateStatus(requestId, 'محوّل');

                // Log the conversion
                await logAction(
                    'تحويل طلب',
                    requestId,
                    `تم تحويل الطلب تلقائياً - المبلغ: ${request['المبلغ']}`
                );

                showToast('✅ تم تحويل الطلب بنجاح', 'success');
                
                const { refreshAllData } = await import('../core/app.js');
                await refreshAllData();
                
            } catch (error) {
                showToast('❌ ' + error.message, 'error');
            } finally {
                showLoading(false);
            }
        },
        'نعم، حول'
    );
}

/**
 * Delete a request
 * @param {string} requestId - Request ID to delete
 */
export async function deleteRequest(requestId) {
    showConfirm(
        `حذف الطلب "${requestId}"؟`,
        async () => {
            showLoading(true);
            
            try {
                await requestService.delete(requestId);
                showToast('✅ تم حذف الطلب', 'success');
                
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
