/**
 * Merchant Service
 * Business logic for merchant operations
 * @version 4.5.0
 */

import { fetchAll, insertRecord, updateRecord, deleteRecord } from './dbService.js';

/**
 * Get all merchants
 * @returns {Promise<Array>} Array of merchants
 */
export async function getAllMerchants() {
    return fetchAll('merchants', { orderBy: 'created_at.asc' });
}

/**
 * Create a new merchant
 * @param {Object} merchantData - Merchant information
 * @returns {Promise<Object>} Created merchant
 */
export async function createMerchant(merchantData) {
    const now = new Date().toISOString();
    const newMerchant = {
        ...merchantData,
        created_at: now,
        updated_at: now
    };
    return insertRecord('merchants', newMerchant);
}

/**
 * Update an existing merchant
 * @param {string} merchantId - Merchant ID
 * @param {Object} merchantData - Updated data
 * @returns {Promise<Object>} Updated merchant
 */
export async function updateMerchant(merchantId, merchantData) {
    const updatedData = {
        ...merchantData,
        updated_at: new Date().toISOString()
    };
    return updateRecord('merchants', updatedData, 'رقم التاجر', merchantId);
}

/**
 * Delete a merchant
 * @param {string} merchantId - Merchant ID
 * @returns {Promise<boolean>} Success status
 */
export async function removeMerchant(merchantId) {
    return deleteRecord('merchants', 'رقم التاجر', merchantId);
}

/**
 * Find merchant by ID
 * @param {string} merchantId - Merchant ID
 * @param {Array} merchants - Local merchants array (optional optimization)
 * @returns {Object|null} Merchant object or null
 */
export function findMerchantById(merchantId, merchants = null) {
    const list = merchants || [];
    return list.find(m => m['رقم التاجر'] == merchantId) || null;
}

/**
 * Generate next merchant ID
 * @param {Array} merchants - Current merchants array
 * @returns {string} New ID
 */
export function generateMerchantId(merchants) {
    const maxId = merchants.reduce((max, m) => {
        const id = parseInt(m['رقم التاجر']) || 0;
        return Math.max(max, id);
    }, 0);
    return String(maxId + 1).padStart(4, '0');
}

/**
 * Search merchants by term
 * @param {string} searchTerm - Search term
 * @param {Array} merchants - Merchants array
 * @param {Function} normalizeFn - Normalization function
 * @returns {Array} Filtered merchants
 */
export function searchMerchants(searchTerm, merchants, normalizeFn) {
    if (!searchTerm) return merchants;
    
    const normalizedTerm = normalizeFn(searchTerm).toLowerCase();
    return merchants.filter(m => 
        normalizeText(m['اسم التاجر']).toLowerCase().includes(normalizedTerm) ||
        m['رقم التاجر']?.toString().includes(searchTerm)
    );
}

/** Internal normalize helper */
function normalizeText(str) {
    return (str || '').toString()
        .trim()
        .replace(/[إأآا]/g, 'ا')
        .replace(/[ة]/g, 'ه')
        .replace(/[يى]/g, 'ي')
        .replace(/[\u0610-\u061A\u064B-\u065F\u0670]/g, '')
        .toLowerCase();
}
