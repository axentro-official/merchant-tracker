/**
 * Transfers Page
 * CRUD operations for money transfers
 */

import { 
    getTransfers, setTransfers, 
    getMerchants 
} from '../ui/stateManager.js';
import { showModal, showConfirm } from '../ui/modals.js';
import { showToast } from '../ui/toast.js';
import { escapeHtml, formatDate, formatTime, formatMoney } from '../utils/formatters.js';
import { getTodayDate } from '../utils/helpers.js';
import { 
    getAllTransfers, createTransfer, updateTransfer as updateTransferDB, removeTransfer,
    findTransferByRef, filterTransfersByDate 
} from '../services/transferService.js';
import { findMerchantById } from '../services/merchantService.js';
import { logAction } from '../services/logService.js';
import { showLoading } from '../core/app.js';

/**
 * Render transfers table with filters
 */
export function renderTransfers() {
    let list = [...getTransfers()];
    
    // Apply date filters
    const dateFrom = document.getElementById('transferDateFrom')?.value;
    const dateTo = document.getElementById('transferDateTo')?.value;
    
    list = filterTransfersByDate(list, dateFrom, dateTo);

    const tbody = document.getElementById('transfersTable');
    
    // Empty state
    if (!list.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="fas fa-exchange-alt"></i>
                    <p>لا توجد تحويلات</p>
                </td>
            </tr>
        `;
        return;
    }

    // Render rows
    tbody.innerHTML = list.map((transfer, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>
                <code style="color:var(--secondary);font-size:0.82rem;">
                    ${transfer['الرقم المرجعي']}
                </code>
            </td>
            <td>${formatDate(transfer['التاريخ'])}</td>
            <td>${formatTime(transfer['وقت'])}</td>
            <td><strong>${transfer['اسم التاجر'] || '-'}</strong></td>
            <td>
                <span class="badge badge-primary">${transfer['نوع التحويل']||'-'}</span>
            </td>
            <td>
                <strong style="color:var(--danger);">
                    ${formatMoney(transfer['قيمة التحويل'])}
                </strong>
            </td>
            <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;" 
                title="${escapeHtml(transfer['ملاحظات'])||'-'}">
                ${transfer['ملاحظات']||'-'}
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-primary btn-sm" 
                            onclick="window.App.editTransfer('${transfer['الرقم المرجعي']}')" 
                            title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" 
                            onclick="window.App.deleteTransfer('${transfer['الرقم المرجعي']}')" 
                            title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Open transfer add/edit modal
 * @param {Object|null} data - Existing transfer data (for edit)
 */
export function openTransferModal(data = null) {
    const isEdit = !!data;
    
    const content = `
        <div class="modal-header">
            <h3>
                <i class="fas fa-exchange-alt"></i> 
                ${isEdit ? 'تعديل تحويل' : 'تحويل جديد'}
            </h3>
        </div>
        <div class="form-group">
            <label class="form-label">التاجر <span class="required">*</span></label>
            <div class="search-wrapper">
                <input type="text" id="tr_merchant_search" class="form-control" 
                       placeholder="🔍 ابحث عن تاجر..." autocomplete="off"
                       oninput="window.App.handleMerchantLookup(this.value, 'tr_merchant_list', 'tr_merchant_id')"
                       value="${isEdit ? escapeHtml(data?.['اسم التاجر']) || '' : ''}">
                <input type="hidden" id="tr_merchant_id" value="${isEdit ? data?.['رقم التاجر'] || '' : ''}">
                <div id="tr_merchant_list" class="search-results"></div>
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">نوع التحويل</label>
            <select id="tr_type" class="form-control">
                <option value="رصيد خدمات" ${!isEdit || data?.['نوع التحويل']==='رصيد خدمات'?'selected':''}>💳 رصيد خدمات</option>
                <option value="رصيد كاش" ${isEdit && data?.['نوع التحويل']==='رصيد كاش'?'selected':''}>💵 رصيد كاش</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">المبلغ <span class="required">*</span></label>
            <input type="number" id="tr_amount" class="form-control" step="any" min="0.01" dir="ltr"
                   placeholder="0.00" value="${isEdit ? data?.['قيمة التحويل'] || '' : ''}">
        </div>
        <div class="form-group">
            <label class="form-label">ملاحظات</label>
            <textarea id="tr_notes" class="form-control" rows="3">${
                isEdit ? escapeHtml(data?.['ملاحظات']) || '' : ''
            }</textarea>
        </div>
        <button class="btn btn-success btn-block" 
                onclick="window.App.saveTransfer(${isEdit ? `'${escapeHtml(data?.['الرقم المرجعي'])}'` : 'null'})">
            <i class="fas fa-check"></i> تأكيد التحويل
        </button>
    `;
    
    showModal(content);
}

/**
 * Save transfer (create or update)
 * @param {string|null} editId - Reference code for updates
 */
export async function saveTransfer(editId) {
    const merchId = document.getElementById('tr_merchant_id')?.value;
    const amount = parseFloat(document.getElementById('tr_amount')?.value);

    // Validation
    if (!merchId) {
        showToast('⚠️ يجب اختيار التاجر', 'warning');
        return;
    }
    
    if (!amount || amount <= 0) {
        showToast('⚠️ المبلغ غير صحيح', 'error');
        return;
    }

    showLoading(true);

    try {
        const merchant = findMerchantById(merchId, getMerchants());
        
        const transferData = {
            "رقم التاجر": merchId,
            "اسم التاجر": merchant?.['اسم التاجر'] || '',
            "رقم الحساب": merchant?.['رقم الحساب'] || '',
            "نوع التحويل": document.getElementById('tr_type')?.value || 'رصيد خدمات',
            "قيمة التحويل": Math.round(amount * 100) / 100,
            "ملاحظات": document.getElementById('tr_notes')?.value?.trim()
        };

        if (editId) {
            // Update existing transfer
            transferData["الرقم المرجعي"] = editId;
            await updateTransferDB(editId, transferData);
            showToast('✅ تم تحديث التحويل', 'success');
        } else {
            // Create new transfer
            const created = await createTransfer(transferData);
            
            // Log the action
            await logAction(
                'تحويل جديد', 
                created['الرقم المرجعي'], 
                `تحويل: ${amount} جنيه - ${merchant?.['اسم التاجر']}`
            );
            
            showToast('✅ تم إضافة التحويل بنجاح', 'success');
        }

        // Close modal and refresh
        const { closeModal } = await import('../ui/modals.js');
        closeModal();
        
        const { refreshAllData } = await import('../core/app.js');
        await refreshAllData();
        
    } catch (error) {
        console.error('Transfer save error:', error);
        showToast('❌ فشل الحفظ: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Edit existing transfer
 * @param {string} ref - Reference code
 */
export async function editTransfer(ref) {
    const transfer = findTransferByRef(ref, getTransfers());
    
    if (transfer) {
        openTransferModal(transfer);
    } else {
        showToast('❌ لم يتم العثور على التحويل', 'error');
    }
}

/**
 * Delete transfer
 * @param {string} ref - Reference code
 */
export async function deleteTransfer(ref) {
    showConfirm(
        `هل تريد حذف التحويل "${ref}"؟`,
        async () => {
            showLoading(true);
            
            try {
                await removeTransfer(ref);
                showToast('✅ تم حذف التحويل', 'success');
                
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
