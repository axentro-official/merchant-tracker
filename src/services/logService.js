/**
 * Log Service
 * System activity logging
 */

import { insertRecord } from './dbService.js';
import { getTodayDate, formatTimeForDB } from '../utils/helpers.js';

/**
 * Log an action to the database
 * @param {string} type - Action type (تحويل جديد, تحصيل جديد, etc.)
 * @param {string} ref - Reference number
 * @param {string} details - Action details
 * @param {string} user - User who performed action (default: مدير)
 */
export async function logAction(type, ref, details, user = 'مدير') {
    try {
        const now = new Date();
        
        const logEntry = {
            "التاريخ": getTodayDate(),
            "الوقت": formatTimeForDB(now),
            "النوع": type,
            "الرقم المرجعي": ref,
            "التفاصيل": details,
            "المستخدم": user,
            created_at: now.toISOString()
        };
        
        await insertRecord('logs', logEntry);
        
        console.log(`📝 Log recorded: ${type} - ${ref}`);
        
    } catch (error) {
        // Don't throw error for logging failures, just warn
        console.warn('⚠️ Log warning:', error.message);
    }
}

/**
 * Log login attempt
 * @param {boolean} success - Whether login was successful
 * @param {string} details - Additional details
 */
export async function logLoginAttempt(success, details = '') {
    await logAction(
        success ? 'تسجيل دخول ناجح' : 'محاولة دخول فاشلة',
        '-',
        details
    );
}

/**
 * Log data modification
 * @param {string} entity - Entity type (تاجر, مكنة, تحويل)
 * @param {string} action - Action type (إضافة, تعديل, حذف)
 * @param {string} ref - Entity reference
 * @param {string} details - Details
 */
export async function logModification(entity, action, ref, details) {
    await logAction(`${action} ${entity}`, ref, details);
}
