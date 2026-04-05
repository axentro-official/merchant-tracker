/**
 * Collections Page
 * CRUD operations for money collections
 */

import { 
    getCollections, setCollections, 
    getTransfers, getMerchants 
} from '../ui/stateManager.js';
import { showModal, showConfirm } from '../ui/modals.js';
import { showToast } from '../ui/toast.js';
import { escapeHtml, formatDate, formatTime, formatMoney } from '../utils/formatters.js';
import { 
    getAllCollections, createCollection, updateCollection as updateCollectionDB, removeCollection,
    findCollectionByRef, calculateRemainingBalance 
} from '../services/collectionService.js';
import { findMerchantById } from '../services/merchantService.js';
import { logAction } from '../services/logService.js';
import { showLoading } from '../core/app.js';

/**
 * Render collections table
 */
export function renderCollections() {
    const list = [...getCollections()];
    const tbody = document.getElementById('collectionsTable');

    // Empty state
    if (!list.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="fas fa-hand-holding-usd"></i>
                    <p>لا توجد تحصيلات</p>
                </td>
            </tr>
        `;
        return;
    }

    // Render rows
    tbody.innerHTML = list.map((collection, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>
                <code style="color:var(--secondary);font-size:0.82rem;">
                    ${collection['الرقم المرجعي']}
                </code>
            </td>
            <td>${formatDate(collection['التاريخ'])}</td>
            <td>${formatTime(collection['وقت'])}</td>
            <td><strong>${collection['اسم التاجر'] || '-'}</strong></td>
            <td>
                <strong style="color:var(--success);">
                    ${formatMoney(collection['قيمة التحصيل'])}
                </strong>
            </td>
            <td>
                <span class="badge ${
                    collection['نوع التحصيل']==='كلي' ? 'badge-success' : 'badge-warning'
                }">
                    ${collection['نوع التحصيل']||'-'}
                </span>
            </td>
            <td>
                <strong style="color:var(--danger);">
                    ${formatMoney(collection['المتبقي بعد التحصيل'])}
                </strong>
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-primary btn-sm" 
                            onclick="window.App.editCollection('${collection['الرقم المرجعي']}')" 
                            title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" 
                            onclick="window.App.deleteCollection('${collection['الرقم المرجعي']}')" 
                            title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Open collection add/edit modal
 * @param {Object|null} data - Existing collection data (for edit)
 */
export function openCollectionModal(data = null) {
    const isEdit = !!data;
    
    const content = `
        <div class="modal-header">
            <h3>
                <i class="fas fa-hand-holding-usd"></i> 
                ${isEdit ? 'تعديل تحصيل' : 'تحصيل جديد'}
            </h3>
        </div>
        <div class="form-group">
            <label class="form-label">التاجر <span class="required">*</span></label>
            <div class="search-wrapper">
                <input type="text" id="col_merchant_search" class="form-control" 
                       placeholder="🔍 ابحث عن تاجر..." autocomplete="off"
                       oninput="window.App.handleMerchantLookup(this.value, 'col_merchant_list', 'col_merchant_id')"
                       value="${isEdit ? escapeHtml(data?.['اسم التاجر']) || '' : ''}">
                <input type="hidden" id="col_merchant_id" value="${isEdit ? data?.['رقم التاجر'] || '' : ''}">
                <div id="col_merchant_list" class="search-results"></div>
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">المبلغ <span class="required">*</span></label>
            <input type="number" id="col_amount" class="form-control" step="any" min="0.01" dir="ltr"
                   placeholder="0.00" value="${isEdit ? data?.['قيمة التحصيل'] || '' : ''}">
        </div>
        <div class="form-group">
            <label class="form-label">نوع التحصيل</label>
            <select id="col_type" class="form-control">
                <option value="جزئي" ${isEdit && data?.['نوع التحصيل']==='جزئي'?'selected':''}>📊 جزئي</option>
                <option value="كلي" ${!isEdit || data?.['نوع التحصيل']==='كلي'?'selected':''}>✅ كامل</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">ملاحظات</label>
            <textarea id="col_notes" class="form-control" rows="3">${
                isEdit ? escapeHtml(data?.['ملاحظات']) || '' : ''
            }</textarea>
        </div>
        <button class="btn btn-primary btn-block" 
                onclick="window.App.saveCollection(${isEdit ? `'${escapeHtml(data?.['الرقم المرجعي'])}'` : 'null'})">
            <i class="fas fa-check"></i> تأكيد التحصيل
        </button>
    `;
    
    showModal(content);
}

/**
 * Save collection (create or update)
 * @param {string|null} editId - Reference code for updates
 */
export async function saveCollection(editId) {
    const merchId = document.getElementById('col_merchant_id')?.value;
    const amount = parseFloat(document.getElementById('col_amount')?.value);

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
        
        // Calculate remaining balance
        const remaining = calculateRemainingBalance(
            merchId, 
            getTransfers(), 
            getCollections(), 
            editId
        ) - amount;

        const collectionData = {
            "رقم التاجر": merchId,
            "اسم التاجر": merchant?.['اسم التاجر'] || '',
            "رقم الحساب": merchant?.['رقم الحساب'] || '',
            "قيمة التحصيل": Math.round(amount * 100) / 100,
            "نوع التحصيل": document.getElementById('col_type')?.value || 'جزئي',
            "المتبقي بعد التحصيل": Math.max(0, remaining),
            "ملاحظات": document.getElementById('col_notes')?.value?.trim()
        };

        if (editId) {
            // Update existing collection
            collectionData["الرقم المرجعي"] = editId;
            await updateCollectionDB(editId, collectionData);
            showToast('✅ تم تحديث التحصيل', 'success');
        } else {
            // Create new collection
            const created = await createCollection(collectionData);
            
            // Log the action
            await logAction(
                'تحصيل جديد', 
                created['الرقم المرجعي'], 
                `تحصيل: ${amount} جنيه - ${merchant?.['اسم التاجر']}`
            );
            
            showToast('✅ تم إضافة التحصيل بنجاح', 'success');
        }

        // Close modal and refresh
        const { closeModal } = await import('../ui/modals.js');
        closeModal();
        
        const { refreshAllData } = await import('../core/app.js');
        await refreshAllData();
        
    } catch (error) {
        console.error('Collection save error:', error);
        showToast('❌ فشل الحفظ: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Edit existing collection
 * @param {string} ref - Reference code
 */
export async function editCollection(ref) {
    const collection = findCollectionByRef(ref, getCollections());
    
    if (collection) {
        openCollectionModal(collection);
    } else {
        showToast('❌ لم يتم العثور على التحصيل', 'error');
    }
}

/**
 * Delete collection
 * @param {string} ref - Reference code
 */
export async function deleteCollection(ref) {
    showConfirm(
        `هل تريد حذف التحصيل "${ref}"؟`,
        async () => {
            showLoading(true);
            
            try {
                await removeCollection(ref);
                showToast('✅ تم حذف التحصيل', 'success');
                
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
