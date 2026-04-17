/**
 * Machine Service
 * Business logic for machine operations
 * @version 4.5.0
 */

import { fetchAll, insertRecord, updateRecord, deleteRecord } from './dbService.js';

/**
 * Get all machines
 * @returns {Promise<Array>} Array of machines
 */
export async function getAllMachines() {
    return fetchAll('machines', { orderBy: 'updated_at.asc' });
}

/**
 * Create a new machine
 * @param {Object} machineData - Machine information
 * @returns {Promise<Object>} Created machine
 */
export async function createMachine(machineData) {
    const now = new Date().toISOString();
    const newMachine = {
        ...machineData,
        updated_at: now,
        updated_at: now
    };
    return insertRecord('machines', newMachine);
}

/**
 * Update an existing machine
 * @param {string} machineId - Machine ID
 * @param {Object} machineData - Updated data
 * @returns {Promise<Object>} Updated machine
 */
export async function updateMachine(machineId, machineData) {
    const updatedData = {
        ...machineData,
        updated_at: new Date().toISOString()
    };
    return updateRecord('machines', updatedData, 'رقم المكنة', machineId);
}

/**
 * Delete a machine
 * @param {string} machineId - Machine ID
 * @returns {Promise<boolean>} Success status
 */
export async function removeMachine(machineId) {
    return deleteRecord('machines', 'رقم المكنة', machineId);
}

/**
 * Find machine by ID
 * @param {string} machineId - Machine ID
 * @param {Array} machines - Local machines array
 * @returns {Object|null} Machine object or null
 */
export function findMachineById(machineId, machines) {
    return machines.find(m => m['رقم المكنة'] == machineId) || null;
}

/**
 * Generate next machine ID
 * @param {Array} machines - Current machines array
 * @returns {string} New ID
 */
export function generateMachineId(machines) {
    const maxId = machines.reduce((max, m) => {
        const id = parseInt(m['رقم المكنة']) || 0;
        return Math.max(max, id);
    }, 0);
    return String(maxId + 1).padStart(4, '0');
}

/**
 * Search machines by term
 * @param {string} searchTerm - Search term
 * @param {Array} machines - Machines array
 * @param {Function} normalizeFn - Normalization function
 * @returns {Array} Filtered machines
 */
export function searchMachines(searchTerm, machines, normalizeFn) {
    if (!searchTerm) return machines;
    
    const term = searchTerm.toLowerCase();
    return machines.filter(m =>
        m['رقم المكنة']?.includes(term) ||
        normalizeFn(m['اسم التاجر']).includes(term) ||
        m['الرقم التسلسلي']?.includes(term)
    );
}
