/**
 * Validation Utilities
 * Input validation functions for forms and data
 */

/**
 * Validate required field
 * @param {*} value - Field value
 * @param {string} fieldName - Field name for error message
 * @returns {{valid: boolean, message?: string}}
 */
export function validateRequired(value, fieldName) {
    if (!value || (typeof value === 'string' && !value.trim())) {
        return {
            valid: false,
            message: `⚠️ ${fieldName} مطلوب`
        };
    }
    return { valid: true };
}

/**
 * Validate positive number
 * @param {*} value - Number value
 * @param {string} fieldName - Field name
 * @returns {{valid: boolean, message?: string}}
 */
export function validatePositiveNumber(value, fieldName) {
    const num = parseFloat(value);
    
    if (!num || num <= 0) {
        return {
            valid: false,
            message: `⚠️ ${fieldName} غير صحيح`
        };
    }
    
    return { valid: true };
}

/**
 * Validate merchant form data
 * @param {Object} data - Form data
 * @returns {{valid: boolean, errors: Array}}
 */
export function validateMerchantForm(data) {
    const errors = [];
    
    if (!data.name?.trim()) {
        errors.push({ field: 'name', message: '⚠️ اسم التاجر مطلوب' });
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate machine form data
 * @param {Object} data - Form data
 * @returns {{valid: boolean, errors: Array}}
 */
export function validateMachineForm(data) {
    const errors = [];
    
    if (!data.merchantId) {
        errors.push({ field: 'merchantId', message: '⚠️ يجب اختيار التاجر' });
    }
    
    if (!data.serial?.trim()) {
        errors.push({ field: 'serial', message: '⚠️ الرقم التسلسلي مطلوب' });
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate transfer/collection form data
 * @param {Object} data - Form data
 * @param {string} type - 'transfer' or 'collection'
 * @returns {{valid: boolean, errors: Array}}
 */
export function validateTransactionForm(data, type = 'transfer') {
    const errors = [];
    
    if (!data.merchantId) {
        errors.push({ field: 'merchantId', message: '⚠️ يجب اختيار التاجر' });
    }
    
    const amount = parseFloat(data.amount);
    if (!amount || amount <= 0) {
        errors.push({ field: 'amount', message: '⚠️ المبلغ غير صحيح' });
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}
