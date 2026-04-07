/**
 * Request Service
 * Business logic for merchant request operations
 * This service was previously inline in requests.js
 * @version 1.0.0
 */

import { fetchAll, insertRecord, updateRecord, deleteRecord } from './dbService.js';

/**
 * Get all requests
 * @returns {Promise<Array>} Array of requests
 */
export async function getAllRequests() {
    return fetchAll('requests', { orderBy: 'created_at.asc' });
}

/**
 * Create a new request
 * @param {Object} requestData - Request data
 * @returns {Promise<Object>} Created request
 */
export async function createRequest(requestData) {
    const now = new Date();
    const newRequest = {
        ...requestData,
        "رقم الطلب": generateRequestId(),
        "التاريخ": now.toISOString().split('T')[0],
        "الوقت": now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
        "الحالة": requestData["الحالة"] || 'pending',
        created_at: now.toISOString(),
        updated_at: now.toISOString()
    };
    
    return insertRecord('requests', newRequest);
}

/**
 * Delete a request
 * @param {string} requestId - Request ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteRequest(requestId) {
    return deleteRecord('requests', 'رقم الطلب', requestId);
}

/**
 * Update request status
 * @param {string} requestId - Request ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated request
 */
export async function updateRequestStatus(requestId, status) {
    return updateRecord('requests', { "الحالة": status, updated_at: new Date().toISOString() }, 'رقم الطلب', requestId);
}

/**
 * Generate unique request ID
 * @returns {string} Request ID
 */
function generateRequestId() {
    const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomPart = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `REQ-${datePart}-${randomPart}`;
}

/**
 * Get pending requests count
 * @param {Array} requests - Requests array (optional, fetches if not provided)
 * @returns {Promise<number>} Pending count
 */
export async function getPendingCount(requests = null) {
    const list = requests || await getAllRequests();
    return list.filter(r => r['الحالة'] === 'pending').length;
}
