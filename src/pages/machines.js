/**
 * Machines Page
 * CRUD operations for machines
 */

import { 
    getMachines, getMerchants, getSearchTerm, setSearchTerm 
} from '../ui/stateManager.js';
import { showModal, showConfirm } from '../ui/modals.js';
import { showToast } from '../ui/toast.js';
import { escapeHtml, normalizeText, formatMoney } from '../utils/formatters.js';
import { 
    getAllMachines, createMachine, updateMachine as updateMachineDB, removeMachine,
    generateMachineId, findMachineById 
} from '../services/machineService.js';
import { findMerchantById as findMerchant } from '../services/merchantService.js';
import { showLoading } from '../core/app.js';

/**
 * Render machines table
 */
export function renderMachines() {
    let list = [...getMachines()];
    const term = getSearchTerm('machine');

    // Apply search filter
    if (term) {
        list = list.filter(m =>
            m['رقم المكنة']?.includes(term) ||
            normalizeText(m['اسم التاجر']).includes(term) ||
            m['الرقم التسلسلي']?.includes(term)
        );
    }

    // Apply status filter
    const statusFilter = document.getElementById('machineStatusFilter')?.value;
    if (statusFilter) {
        list = list.filter(m => m['الحالة'] === statusFilter);
    }

    const tbody = document.getElementById('machinesTable');
    
    // Empty state
    if (!list.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-cash-register"></i>
                    <p>لا توجد مكن</p>
                </td>
            </tr>
        `;
        return;
    }

    // Render rows
    tbody.innerHTML = list.map((machine, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>
                <code style="color:var(--secondary);font-weight:700;">
                    ${machine['رقم المكنة']}
                </code>
            </td>
            <td>${machine['اسم التاجر'] || '-'}</td>
            <td>
                <span class="badge badge-purple">${machine['اسم النشاط'] || '-'}</span>
            </td>
            <td>
                <code style="color:#dc2626;font-size:0.82rem;">
                    ${machine['الرقم التسلسلي']||'-'}
                </code>
            </td>
            <td>${formatMoney(machine['التارجت الشهري'])}</td>
            <td>
                <span class="badge ${
                    machine['الحالة']==='نشطة' ? 'badge-success' : 'badge-danger'
                }">
                    ${machine['الحالة']||'-'}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-primary btn-sm" 
                            onclick="window.App.editMachine('${machine['رقم المكنة']}')" 
                            title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" 
                            onclick="window.App.deleteMachine('${machine['رقم المكنة']}')" 
                            title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Open machine add/edit modal
 * @param {Object|null} data - Existing machine data (for edit mode)
 */
export function openMachineModal(data = null) {
    const isEdit = !!data;
    
    const content = `
        <div class="modal-header">
            <h3>
                <i class="fas ${isEdit ? 'fa-edit' : 'fa-plus-circle'}"></i> 
                ${isEdit ? 'تعديل مكنة' : 'إضافة مكنة جديدة'}
            </h3>
        </div>
        <div class="form-group">
            <label class="form-label">التاجر <span class="required">*</span></label>
            <div class="search-wrapper">
                <input type="text" id="mc_merchant_search" class="form-control" 
                       placeholder="🔍 ابحث عن تاجر..." autocomplete="off"
                       oninput="window.App.handleMerchantLookup(this.value, 'mc_merchant_list', 'mc_merchant_id')"
                       value="${isEdit ? escapeHtml(data?.['اسم التاجر']) || '' : ''}">
                <input type="hidden" id="mc_merchant_id" value="${isEdit ? data?.['رقم التاجر'] || '' : ''}">
                <div id="mc_merchant_list" class="search-results"></div>
            </div>
        </div>
        
        <div id="autoFillFields" style="display:none;background:var(--bg);padding:1rem;border-radius:var(--radius-sm);margin-bottom:1rem;border:1px solid var(--border);">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;font-size:0.88rem;color:var(--text-light);">
                <div><strong>اسم التاجر:</strong> <span id="auto_name" style="color:var(--text);">-</span></div>
                <div><strong>رقم الحساب:</strong> <span id="auto_account" dir="ltr" style="color:var(--text);">-</span></div>
                <div><strong>اسم النشاط:</strong> <span id="auto_activity" style="color:var(--text);">-</span></div>
                <div><strong>الهاتف:</strong> <span id="auto_phone" dir="ltr" style="color:var(--text);">-</span></div>
            </div>
        </div>

        <div class="form-group">
            <label class="form-label">الرقم التسلسلي <span class="required">*</span></label>
            <div class="input-with-camera">
                <input type="text" id="mc_serial" class="form-control" dir="ltr" 
                       placeholder="SN-XXXXX أو امسح بالكاميرا" 
                       value="${isEdit ? escapeHtml(data?.['الرقم التسلسلي']) || '' : ''}"
                       onclick="window.currentScannerInput='mc_serial'">
                <button type="button" class="camera-btn" 
                        onclick="window.App.openScannerForInput('mc_serial')" 
                        title="مسح بالكاميرا">
                    <i class="fas fa-camera"></i>
                </button>
            </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
            <div class="form-group">
                <label class="form-label">التارجت الشهري</label>
                <input type="number" id="mc_target" class="form-control" min="0" 
                       value="${isEdit ? data?.['التارجت الشهري'] || '' : ''}">
            </div>
            <div class="form-group">
                <label class="form-label">الحالة</label>
                <select id="mc_status" class="form-control">
                    <option value="نشطة" ${!isEdit || data?.['الحالة']==='نشطة'?'selected':''}>✅ نشطة</option>
                    <option value="متوقفة" ${isEdit && data?.['الحالة']=='متوقفة'?'selected':''}>⏸ متوقفة</option>
                    <option value="صيانة" ${isEdit && data?.['الحالة']=='صيانة'?'selected':''}>🔧 صيانة</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">ملاحظات</label>
            <textarea id="mc_notes" class="form-control" rows="3">${
                isEdit ? escapeHtml(data?.['ملاحظات']) || '' : ''
            }</textarea>
        </div>
        <button class="btn btn-primary btn-block" 
                onclick="window.App.saveMachine(${isEdit ? `'${escapeHtml(data?.['رقم المكنة'])}'` : 'null'})">
            <i class="fas fa-save"></i> ${isEdit ? 'تحديث المكنة' : 'إضافة مكنة'}
        </button>
    `;
    
    showModal(content);
    
    // Auto-fill merchant data if editing
    if (isEdit && data?.['رقم التاجر']) {
        autoFillMerchantData(data['رقم التاجر']);
    }
}

/**
 * Auto-fill merchant details when selected
 * @param {string} merchantId - Selected merchant ID
 */
export function autoFillMerchantData(merchantId) {
    const merchant = findMerchant(merchantId, getMerchants());
    
    if (merchant) {
        document.getElementById('autoFillFields').style.display = 'block';
        document.getElementById('auto_name').textContent = merchant['اسم التاجر'] || '-';
        document.getElementById('auto_account').textContent = merchant['رقم الحساب'] || '-';
        document.getElementById('auto_activity').textContent = merchant['اسم النشاط'] || '-';
        document.getElementById('auto_phone').textContent = merchant['رقم الهاتف'] || '-';
    } else {
        document.getElementById('autoFillFields').style.display = 'none';
    }
}

/**
 * Save machine (create or update)
 * @param {string|null} editId - Machine ID for updates
 */
export async function saveMachine(editId) {
    const merchId = document.getElementById('mc_merchant_id')?.value;
    const serial = document.getElementById('mc_serial')?.value?.trim();

    if (!merchId) {
        showToast('⚠️ يجب اختيار التاجر', 'warning');
        return;
    }
    
    if (!serial) {
        showToast('⚠️ الرقم التسلسلي مطلوب', 'warning');
        return;
    }

    showLoading(true);

    try {
        const merchant = findMerchant(merchId, getMerchants());
        let machineId = editId;
        
        // Generate new ID if creating
        if (!editId) {
            machineId = generateMachineId(getMachines());
        }

        const machineData = {
            "رقم المكنة": machineId,
            "رقم التاجر": merchId,
            "اسم التاجر": merchant?.['اسم التاجر'] || '',
            "اسم النشاط": merchant?.['اسم النشاط'] || '',
            "الرقم التسلسلي": serial,
            "رقم الحساب": merchant?.['رقم الحساب'] || '',
            "التارجت الشهري": Number(document.getElementById('mc_target')?.value) || 0,
            "الحالة": document.getElementById('mc_status')?.value || 'نشطة',
            "ملاحظات": document.getElementById('mc_notes')?.value?.trim()
        };

        if (editId) {
            await updateMachineDB(editId, machineData);
            showToast('✅ تم تحديث المكنة', 'success');
        } else {
            await createMachine(machineData);
            showToast('✅ تم إضافة المكنة', 'success');
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
 * Edit existing machine
 * @param {string} id - Machine ID
 */
export async function editMachine(id) {
    const machine = findMachineById(id, getMachines());
    
    if (machine) {
        openMachineModal(machine);
    } else {
        showToast('❌ لم يتم العثور على المكنة', 'error');
    }
}

/**
 * Delete machine
 * @param {string} id - Machine ID
 */
export async function deleteMachine(id) {
    showConfirm(
        `هل تريد حذف المكنة "${id}"؟`,
        async () => {
            showLoading(true);
            
            try {
                await removeMachine(id);
                showToast('✅ تم حذف المكنة', 'success');
                
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
