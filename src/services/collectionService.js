/**
 * Collection Service
 * Business logic for collection operations
 */

import { fetchAll, insertRecord, updateRecord, deleteRecord } from './dbService.js';
import { generateRefCode, getCurrentArabicMonth, getTodayDate, formatTimeForDB } from '../utils/helpers.js';

/**
 * Get all collections
 * @returns {Promise<Array>}
 */
export async function getAllCollections() {
    return fetchAll('collections', { orderBy: 'created_at.asc' });
}

/**
 * Create a new collection
 * @param {Object} collectionData - Collection information
 * @returns {Promise<Object>} Created collection
 */
export async function createCollection(collectionData) {
    const now = new Date();
    
    const newCollection = {
        ...collectionData,
        "الرقم المرجعي": generateRefCode('COL'),
        "التاريخ": getTodayDate(),
        "الوقت": formatTimeForDB(now),
        "شهر": getCurrentArabicMonth(),
        created_at: now.toISOString(),
        updated_at: now.toISOString()
    };
    
    return insertRecord('collections', newCollection);
}

/**
 * Update an existing collection
 * @param {string} refCode - Collection reference code
 * @param {Object} collectionData - Updated data
 * @returns {Promise<Object>}
 */
export async function updateCollection(refCode, collectionData) {
    const updatedData = {
        ...collectionData,
        updated_at: new Date().toISOString()
    };
    
    return updateRecord('collections', updatedData, 'الرقم المرجعي', refCode);
}

/**
 * Delete a collection
 * @param {string} refCode - Reference code
 * @returns {Promise<boolean>}
 */
export async function removeCollection(refCode) {
    return deleteRecord('collections', 'الرقم المرجعي', refCode);
}

/**
 * Find collection by reference
 * @param {string} refCode - Reference code
 * @param {Array} collections - Local collections array
 * @returns {Object|null}
 */
export function findCollectionByRef(refCode, collections) {
    return collections.find(c => c['الرقم المرجعي'] == refCode) || null;
}

/**
 * Get collections for specific merchant
 * @param {string} merchantId - Merchant ID
 * @param {Array} collections - All collections
 * @returns {Array}
 */
export function getMerchantCollections(merchantId, collections) {
    return collections.filter(c => c['رقم التاجر'] == merchantId);
}

/**
 * Calculate remaining balance for merchant
 * @param {string} merchantId - Merchant ID
 * @param {Array} transfers - All transfers
 * @param {Array} collections - All collections
 * @param {string} excludeRef - Reference to exclude (for edit mode)
 * @returns {number}
 */
export function calculateRemainingBalance(merchantId, transfers, collections, excludeRef = null) {
    const merchantTransfers = transfers.filter(t => t['رقم التاجر'] == merchantId);
    const merchantCollections = collections.filter(c => 
        c['رقم التاجر'] == merchantId && c['الرقم المرجعي'] !== excludeRef
    );
    
    const totalTransfers = merchantTransfers.reduce(
        (sum, t) => sum + (Number(t['قيمة التحويل']) || 0), 
        0
    );
    
    const totalCollections = merchantCollections.reduce(
        (sum, c) => sum + (Number(c['قيمة التحصيل']) || 0), 
        0
    );
    
    return Math.max(0, totalTransfers - totalCollections);
}

/**
 * Calculate total collections value
 * @param {Array} collections - Collections array
 * @returns {number}
 */
export function calculateTotalCollections(collections) {
    return collections.reduce((sum, c) => sum + (Number(c['قيمة التحصيل']) || 0), 0);
}

/**
 * Get monthly collections
 * @param {Array} collections - All collections
 * @param {string} month - Month name (optional)
 * @returns {Array}
 */
export function getMonthlyCollections(collections, month = null) {
    const targetMonth = month || getCurrentArabicMonth();
    return collections.filter(c => c['شهر'] === targetMonth);
}
