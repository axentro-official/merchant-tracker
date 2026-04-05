/**
 * Merchants Page
 * CRUD operations for merchants
 */

import { 
    getMerchants, setMerchants, getSearchTerm, setSearchTerm 
} from '../ui/stateManager.js';
import { showModal, showConfirm } from '../ui/modals.js';
import { showToast } from '../ui/toast.js';
import { escapeHtml, normalizeText, formatMoney } from '../utils/formatters.js';
import { 
    getAllMerchants, createMerchant, updateMerchant as updateMerchantDB, removeMerchant,
    generateMerchantId, findMerchantById, searchMerchants 
} from '../services/merchantService.js';
import { showLoading } from '../core/app.js';

/**
 * Render merchants table
 */
export function renderMerchants() {
    let list = [...getMerchants()];
    const term = getSearchTerm('merchant');

    // Apply search filter
    if (term) {
        list = searchMerchants(term, list, normalizeText);
    }

    // Apply status filter
    const statusFilter = document.getElementById('merchantStatusFilter')?.value;
    if (statusFilter) {
        list = list.filter(m => m['الحالة'] === statusFilter);
    }

    const tbody = document.getElementById('merchantsTable');
    
    // Empty state
    if (!list.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>لا يوجد تجار</p>
                </td>
            </tr>
        `;
        return;
    }

    // Render rows
    tbody.innerHTML = list.map((merchant, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>
                <code style="color:var(--secondary);font-weight:700;">
                    ${merchant['رقم التاجر']}
                </code>
            </td>
            <td><strong>${merchant['اسم التاجر']}</strong></td>
            <td>${merchant['اسم النشاط'] || '-'}</td>
            <td dir="ltr">${merchant['رقم الحساب'] || '-'}</td>
            <td dir="ltr">
                ${merchant['رقم الهاتف'] 
                    ? `<a href="tel:${merchant['رقم الهاتف']}" style="color:var(--primary);">
                        ${merchant['رقم الهاتف']}
                       </a>` 
                    : '-'}
            </td>
            <td>${merchant['العنوان'] || '-'}</td>
            <td>${merchant['المنطقة'] || '-'}</td>
            <td>
                <span class="badge ${
                    merchant['الحالة'] === 'نشط' ? 'badge-success' : 'badge-danger'
                }">
                    ${merchant['الحالة'] || '-'}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-primary btn-sm" 
                            onclick="window.App.editMerchant('${merchant['رقم التاجر']}')" 
                            title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" 
                            onclick="window.App.deleteMerchant('${merchant['رقم التاجر']}')" 
                            title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Open merchant add/edit modal
 * @param {Object|null} data - Existing merchant data (for edit mode)
 */
export function openMerchantModal(data = null) {
    const isEdit = !!data;
    
    const content = `
        <div class="modal-header">
            <h3>
                <i class="fas ${isEdit ? 'fa-edit' : 'fa-user-plus'}"></i> 
                ${isEdit ? 'تعديل تاجر' : 'إضافة تاجر جديد'}
            </h3>
        </div>
        <div class="form-group">
            <label class="form-label">اسم التاجر <span class="required">*</span></label>
            <input type="text" id="m_name" class="form-control" 
                   placeholder="الاسم الكامل" 
                   value="${isEdit ? escapeHtml(data?.['اسم التاجر']) || '' : ''}">
        </div>
        <div class="form-group">
            <label class="form-label">اسم النشاط التجاري</label>
            <input type="text" id="m_activity" class="form-control" 
                   placeholder="نشاط المتجر" 
                   value="${isEdit ? escapeHtml(data?.['اسم النشاط']) || '' : ''}">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
            <div class="form-group">
                <label class="form-label">رقم الحساب <span class="required">*</span></label>
                <input type="text" id="m_account" class="form-control" dir="ltr" 
                       value="${isEdit ? escapeHtml(data?.['رقم الحساب']) || '' : ''}">
            </div>
            <div class="form-group">
                <label class="form-label">رقم الهاتف</label>
                <input type="text" id="m_phone" class="form-control" dir="ltr" 
                       value="${isEdit ? escapeHtml(data?.['رقم الهاتف']) || '' : ''}">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">العنوان</label>
            <input type="text" id="m_address" class="form-control" 
                   placeholder="العنوان بالتفصيل" 
                   value="${isEdit ? escapeHtml(data?.['العنوان']) || '' : ''}">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
            <div class="form-group">
                <label class="form-label">المنطقة</label>
                <input type="text" id="m_area" class="form-control" 
                       value="${isEdit ? escapeHtml(data?.['المنطقة']) || '' : ''}">
            </div>
            <div class="form-group">
                <label class="form-label">الحالة</label>
                <select id="m_status" class="form-control">
                    <option value="نشط" ${!isEdit || data?.['الحالة']==='نشط'?'selected':''}>✅ نشط</option>
                    <option value="غير نشط" ${isEdit && data?.['الحالة']==='غير نشط'?'selected':''}>⛔ غير نشط</option>
                    <option value="موقوف" ${isEdit && data?.['الحالة']==='موقوف'?'selected':''}>🚫 موقوف</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">ملاحظات</label>
            <textarea id="m_notes" class="form-control" rows="3">${
                isEdit ? escapeHtml(data?.['ملاحظات']) || '' : ''
            }</textarea>
        </div>
        <button class="btn btn-primary btn-block" 
                onclick="window.App.saveMerchant(${isEdit ? `'${escapeHtml(data?.['رقم التاجر'])}'` : 'null'})">
            <i class="fas fa-save"></i> ${isEdit ? 'تحديث البيانات' : 'إضافة تاجر'}
        </button>
    `;
    
    showModal(content);
}

/**
 * Save merchant (create or update)
 * @param {string|null} editId - Merchant ID for updates
 */
export async function saveMerchant(editId) {
    const name = document.getElementById('m_name')?.value?.trim();
    
    if (!name) {
        showToast('⚠️ اسم التاجر مطلوب', 'warning');
        return;
    }

    showLoading(true);

    try {
        let merchantId = editId;
        
        // Generate new ID if creating
        if (!editId) {
            merchantId = generateMerchantId(getMerchants());
        }

        const merchantData = {
            "رقم التاجر": merchantId,
            "اسم التاجر": name,
            "اسم النشاط": document.getElementById('m_activity')?.value?.trim(),
            "رقم الحساب": document.getElementById('m_account')?.value?.trim(),
            "رقم الهاتف": document.getElementById('m_phone')?.value?.trim(),
            "العنوان": document.getElementById('m_address')?.value?.trim(),
            "المنطقة": document.getElementById('m_area')?.value?.trim(),
            "الحالة": document.getElementById('m_status')?.value || 'نشط',
            "ملاحظات": document.getElementById('m_notes')?.value?.trim()
        };

        if (editId) {
            await updateMerchantDB(editId, merchantData);
            showToast('✅ تم تحديث التاجر', 'success');
        } else {
            await createMerchant(merchantData);
            showToast('✅ تم إضافة التاجر', 'success');
        }

        // Close modal and refresh
        const { closeModal } = await import('../ui/modals.js');
        closeModal();
        
        const { refreshAllData } = await import('../core/app.js');
        await refreshAllData();
        
    } catch (error) {
        showToast('❌ ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Edit existing merchant
 * @param {string} id - Merchant ID
 */
export async function editMerchant(id) {
    const merchant = findMerchantById(id, getMerchants());
    
    if (merchant) {
        openMerchantModal(merchant);
    } else {
        showToast('❌ لم يتم العثور على التاجر', 'error');
    }
}

/**
 * Delete merchant
 * @param {string} id - Merchant ID
 */
export async function deleteMerchant(id) {
    const merchant = findMerchantById(id, getMerchants());
    
    if (!merchant) return;

    showConfirm(
        `هل تريد حذف التاجر "${escapeHtml(merchant['اسم التاجر'])}"؟`,
        async () => {
            showLoading(true);
            
            try {
                await removeMerchant(id);
                showToast('✅ تم حذف التاجر', 'success');
                
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
