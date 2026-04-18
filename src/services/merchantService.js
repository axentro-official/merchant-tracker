/**
 * Merchant Service - Enhanced Version
 * Handles all merchant-related database operations
 * Schema matches: merchants table with Arabic columns
 * @version 5.0.0
 */

import { fetchAll, insertRecord, updateRecord, deleteRecord, fetchByColumn } from './dbService.js';
import { CONFIG, generateReferenceNumber } from '../config/supabase.js';

/**
 * Get all merchants
 * @returns {Promise<Array>} Array of merchants
 */
export async function getAllMerchants() {
    return await fetchAll('merchants', {
        orderBy: 'created_at.desc'
    });
}

/**
 * Get merchant by ID
 * @param {string} id - Merchant UUID
 * @returns {Promise<Object|null>} Merchant object or null
 */
export async function getMerchantById(id) {
    const merchants = await fetchByColumn('merchants', 'id', id);
    return merchants.length > 0 ? merchants[0] : null;
}

/**
 * Find merchant by merchant number (رقم التاجر)
 * @param {string} merchantNumber - Merchant number
 * @returns {Promise<Object|null>} Merchant object or null
 */
export async function findByMerchantNumber(merchantNumber) {
    const merchants = await fetchByColumn('merchants', 'رقم التاجر', merchantNumber);
    return merchants.length > 0 ? merchants[0] : null;
}

/**
 * Create new merchant with auto-generated number
 * @param {Object} merchantData - Merchant data (without رقم التاجر)
 * @returns {Promise<Object>} Created merchant
 */
export async function createMerchant(merchantData) {
    // Generate professional merchant number
    const merchantNumber = generateReferenceNumber(CONFIG.REFERENCE_PREFIX.MERCHANT);
    
    const newMerchant = {
        'رقم التاجر': merchantNumber,
        'اسم التاجر': merchantData['اسم التاجر'] || '',
        'اسم النشاط': merchantData['اسم النشاط'] || '',
        'رقم الهاتف': merchantData['رقم الهاتف'] || '',
        'المنطقة': merchantData['المنطقة'] || '',
        'العنوان': merchantData['العنوان'] || '',
        'الحالة': merchantData['الحالة'] || 'نشط',
        'ملاحظات': merchantData['ملاحظات'] || '',
        'تاريخ الإنشاء': new Date().toISOString().split('T')[0],
        'وقت الإنشاء': new Date().toTimeString().slice(0, 8),
        'created_at': new Date().toISOString(),
        'updated_at': new Date().toISOString()
    };
    
    return await insertRecord('merchants', newMerchant);
}

/**
 * Update existing merchant
 * @param {string} id - Merchant UUID
 * @param {Object} merchantData - Updated data
 * @returns {Promise<Object>} Updated merchant
 */
export async function updateMerchant(id, merchantData) {
    const updateData = {
        ...merchantData,
        'updated_at': new Date().toISOString()
    };
    
    return await updateRecord('merchants', updateData, 'id', id);
}

/**
 * Delete merchant
 * @param {string} id - Merchant UUID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteMerchant(id) {
    return await deleteRecord('merchants', 'id', id);
}

/**
 * Search merchants by name or phone
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Matching merchants
 */
export async function searchMerchants(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
        return await getAllMerchants();
    }
    
    // This is a simple implementation - for production, consider using PostgreSQL full-text search
    const allMerchants = await getAllMerchants();
    const term = searchTerm.toLowerCase().trim();
    
    return allMerchants.filter(merchant => {
        const name = (merchant['اسم التاجر'] || '').toLowerCase();
        const phone = (merchant['رقم الهاتف'] || '').toLowerCase();
        const activity = (merchant['اسم النشاط'] || '').toLowerCase();
        const region = (merchant['المنطقة'] || '').toLowerCase();
        const number = (merchant['رقم التاجر'] || '').toLowerCase();
        
        return name.includes(term) || 
               phone.includes(term) || 
               activity.includes(term) ||
               region.includes(term) ||
               number.includes(term);
    });
}

/**
 * Get merchant select options (for dropdowns)
 * @returns {Promise<Array>} Array of {value, label} objects
 */
export async function getMerchantSelectOptions() {
    const merchants = await getAllMerchants();
    
    return merchants.map(m => ({
        value: m['رقم التاجر'],
        label: `${m['رقم التاجر']} - ${m['اسم التاجر']}`,
        name: m['اسم التاجر'],
        activity: m['اسم النشاط'],
        phone: m['رقم الهاتف'],
        region: m['المنطقة'],
        address: m['العنوان'],
        id: m['id']
    }));
}

/**
 * Calculate merchant balance (transfers - collections)
 * @param {string} merchantNumber - Merchant number
 * @param {Array} transfers - All transfers
 * @param {Array} collections - All collections
 * @returns {Object} Balance info {totalTransfers, totalCollections, balance}
 */
export function calculateMerchantBalance(merchantNumber, transfers, collections) {
    const merchantTransfers = transfers.filter(t => t['رقم التاجر'] === merchantNumber);
    const merchantCollections = collections.filter(c => c['رقم التاجر'] === merchantNumber);
    
    const totalTransfers = merchantTransfers.reduce((sum, t) => sum + (parseFloat(t['قيمة التحويل']) || 0), 0);
    const totalCollections = merchantCollections.reduce((sum, c) => sum + (parseFloat(c['قيمة التحصيل']) || 0), 0);
    
    return {
        totalTransfers,
        totalCollections,
        balance: totalTransfers - totalCollections,
        transferCount: merchantTransfers.length,
        collectionCount: merchantCollections.length
    };
}
