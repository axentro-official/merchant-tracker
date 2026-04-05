/**
 * Transfer Service
 * Business logic for transfer operations
 */

import { fetchAll, insertRecord, updateRecord, deleteRecord } from './dbService.js';
import { generateRefCode, getCurrentArabicMonth, getTodayDate, formatTimeForDB } from '../utils/helpers.js';

/**
 * Get all transfers
 * @returns {Promise<Array>}
 */
export async function getAllTransfers() {
    return fetchAll('transfers', { orderBy: 'created_at.asc' });
}

/**
 * Create a new transfer
 * @param {Object} transferData - Transfer information
 * @returns {Promise<Object>} Created transfer
 */
export async function createTransfer(transferData) {
    const now = new Date();
    
    const newTransfer = {
        ...transferData,
        "الرقم المرجعي": generateRefCode('TRF'),
        "التاريخ": getTodayDate(),
        "الوقت": formatTimeForDB(now),
        "الشهر": getCurrentArabicMonth(),
        created_at: now.toISOString(),
        updated_at: now.toISOString()
    };
    
    return insertRecord('transfers', newTransfer);
}

/**
 * Create transfer with custom reference code
 * @param {Object} transferData - Transfer data (should include الرقم المرجعي)
 * @returns {Promise<Object>}
 */
export async function createTransferWithRef(transferData) {
    const now = new Date();
    
    const newTransfer = {
        ...transferData,
        "التاريخ": getTodayDate(),
        "الوقت": formatTimeForDB(now),
        "الشهر": getCurrentArabicMonth(),
        created_at: now.toISOString(),
        updated_at: now.toISOString()
    };
    
    return insertRecord('transfers', newTransfer);
}

/**
 * Update an existing transfer
 * @param {string} refCode - Transfer reference code
 * @param {Object} transferData - Updated data
 * @returns {Promise<Object>}
 */
export async function updateTransfer(refCode, transferData) {
    const updatedData = {
        ...transferData,
        updated_at: new Date().toISOString()
    };
    
    return updateRecord('transfers', updatedData, 'الرقم المرجعي', refCode);
}

/**
 * Delete a transfer
 * @param {string} refCode - Reference code
 * @returns {Promise<boolean>}
 */
export async function removeTransfer(refCode) {
    return deleteRecord('transfers', 'الرقم المرجعي', refCode);
}

/**
 * Find transfer by reference
 * @param {string} refCode - Reference code
 * @param {Array} transfers - Local transfers array
 * @returns {Object|null}
 */
export function findTransferByRef(refCode, transfers) {
    return transfers.find(t => t['الرقم المرجعي'] == refCode) || null;
}

/**
 * Get transfers for specific merchant
 * @param {string} merchantId - Merchant ID
 * @param {Array} transfers - All transfers
 * @returns {Array}
 */
export function getMerchantTransfers(merchantId, transfers) {
    return transfers.filter(t => t['رقم التاجر'] == merchantId);
}

/**
 * Calculate total transfers value
 * @param {Array} transfers - Transfers array
 * @returns {number}
 */
export function calculateTotalTransfers(transfers) {
    return transfers.reduce((sum, t) => sum + (Number(t['قيمة التحويل']) || 0), 0);
}

/**
 * Filter transfers by date range
 * @param {Array} transfers - All transfers
 * @param {string} dateFrom - Start date (YYYY-MM-DD)
 * @param {string} dateTo - End date (YYYY-MM-DD)
 * @returns {Array}
 */
export function filterTransfersByDate(transfers, dateFrom, dateTo) {
    let filtered = [...transfers];
    
    if (dateFrom) {
        filtered = filtered.filter(t => t['التاريخ'] >= dateFrom);
    }
    
    if (dateTo) {
        filtered = filtered.filter(t => t['التاريخ'] <= dateTo);
    }
    
    return filtered;
}

/**
 * Get monthly transfers
 * @param {Array} transfers - All transfers
 * @param {string} month - Month name (optional, defaults to current)
 * @returns {Array}
 */
export function getMonthlyTransfers(transfers, month = null) {
    const targetMonth = month || getCurrentArabicMonth();
    return transfers.filter(t => t['الشهر'] === targetMonth);
}
