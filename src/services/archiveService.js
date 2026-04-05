/**
 * Archive Service
 * Business logic for archive/monthly closing operations
 */

import { fetchAll, insertRecord, deleteRecord } from './dbService.js';
import { getCurrentArabicMonth } from '../utils/helpers.js';

/**
 * Get all archives
 * @returns {Promise<Array>}
 */
export async function getAllArchives() {
    return fetchAll('archives', { orderBy: 'created_at.desc' });
}

/**
 * Create archive entry for month closing
 * @param {Object} archiveData - Archive data
 * @returns {Promise<Object>}
 */
export async function createArchive(archiveData) {
    const now = new Date();
    
    const newArchive = {
        ...archiveData,
        "رقم الأرشيف": `ARCH-${now.toISOString().slice(0,10).replace(/-/g,'')}`,
        created_at: now.toISOString()
    };
    
    return insertRecord('archives', newArchive);
}

/**
 * Delete archive
 * @param {string} archiveId - Archive ID
 * @returns {Promise<boolean>}
 */
export async function removeArchive(archiveId) {
    return deleteRecord('archives', 'رقم الأرشيف', archiveId);
}

/**
 * Find archive by ID
 * @param {string} archiveId - Archive ID
 * @param {Array} archives - Archives array
 * @returns {Object|null}
 */
export function findArchiveById(archiveId, archives) {
    return archives.find(a => a["رقم الأرشيف"] === archiveId) || null;
}

/**
 * Calculate month summary for archiving
 * @param {Array} transfers - Month's transfers
 * @param {Array} collections - Month's collections
 * @returns {Object} Summary object
 */
export function calculateMonthSummary(transfers, collections) {
    return {
        "عدد التحويلات": transfers.length,
        "إجمالي التحويلات": transfers.reduce(
            (sum, t) => sum + (Number(t['قيمة التحويل']) || 0), 
            0
        ),
        "عدد التحصيلات": collections.length,
        "إجمالي التحصيلات": collections.reduce(
            (sum, c) => sum + (Number(c['قيمة التحصيل']) || 0), 
            0
        )
    };
}

/**
 * Close current month and create archive
 * @param {Array} transfers - All transfers
 * @param {Array} collections - All collections
 * @returns {Promise<Object>} Created archive
 */
export async function closeMonth(transfers, collections) {
    const currentMonth = getCurrentArabicMonth();
    
    const monthTransfers = transfers.filter(t => t['الشهر'] === currentMonth);
    const monthCollections = collections.filter(c => c['شهر'] === currentMonth);
    
    const summary = calculateMonthSummary(monthTransfers, monthCollections);
    
    const archiveData = {
        "الشهر": currentMonth,
        ...summary,
        "إجمالي المتبقي": summary["إجمالي التحويلات"] - summary["إجمالي التحصيلات"]
    };
    
    return createArchive(archiveData);
}
