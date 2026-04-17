/**
 * Database Service Layer - Enhanced Version
 * Centralized database operations for all entities
 * This is the ONLY place where direct Supabase calls should happen
 * @version 5.0.0
 */

import { getSupabase } from '../config/supabase.js';

/**
 * Fetch all records from a table
 * @param {string} tableName - Table name
 * @param {Object} options - Query options (orderBy, limit, filters)
 * @returns {Promise<Array>} Array of records
 */
export async function fetchAll(tableName, options = {}) {
    try {
        const supabase = getSupabase();
        let query = supabase.from(tableName).select('*');
        
        // Apply filters if provided
        if (options.filters) {
            Object.entries(options.filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    query = query.eq(key, value);
                }
            });
        }
        
        // Apply ordering
        if (options.orderBy) {
            const [column, direction] = options.orderBy.split('.');
            query = query.order(column, { ascending: direction !== 'desc' });
        } else {
            // Default order by updated_at desc
            query = query.order('updated_at', { ascending: false });
        }
        
        // Apply limit
        if (options.limit) {
            query = query.limit(options.limit);
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error(`❌ Error fetching ${tableName}:`, error);
            throw new Error(`Failed to fetch ${tableName}: ${error.message}`);
        }
        
        return data || [];
        
    } catch (error) {
        console.error(`❌ Exception in fetchAll(${tableName}):`, error);
        throw error;
    }
}

/**
 * Insert a new record into a table
 * @param {string} tableName - Table name
 * @param {Object} record - Record data (must match table schema exactly)
 * @returns {Promise<Object>} Inserted record
 */
export async function insertRecord(tableName, record) {
    try {
        const supabase = getSupabase();
        
        const { data, error } = await supabase
            .from(tableName)
            .insert([record])
            .select()
            .single();
        
        if (error) {
            console.error(`❌ Error inserting into ${tableName}:`, error);
            throw new Error(`Failed to insert into ${tableName}: ${error.message}`);
        }
        
        console.log(`✅ Inserted into ${tableName}:`, data.id || data['id']);
        return data;
        
    } catch (error) {
        console.error(`❌ Exception in insertRecord(${tableName}):`, error);
        throw error;
    }
}

/**
 * Update an existing record
 * @param {string} tableName - Table name
 * @param {Object} record - Updated record data
 * @param {string} keyColumn - Column to match for update (usually 'id')
 * @param {*} keyValue - Value of the key column
 * @returns {Promise<Object>} Updated record
 */
export async function updateRecord(tableName, record, keyColumn = 'id', keyValue) {
    try {
        const supabase = getSupabase();
        
        // Remove the key column from the update data to avoid conflicts
        const { [keyColumn]: _, ...updateData } = record;
        
        // Add updated_at timestamp if table has it
        if (!updateData['updated_at']) {
            updateData['updated_at'] = new Date().toISOString();
        }
        
        const { data, error } = await supabase
            .from(tableName)
            .update(updateData)
            .eq(keyColumn, keyValue)
            .select()
            .single();
        
        if (error) {
            console.error(`❌ Error updating ${tableName}:`, error);
            throw new Error(`Failed to update ${tableName}: ${error.message}`);
        }
        
        console.log(`✅ Updated ${tableName} record:`, keyValue);
        return data;
        
    } catch (error) {
        console.error(`❌ Exception in updateRecord(${tableName}):`, error);
        throw error;
    }
}

/**
 * Delete a record from a table
 * @param {string} tableName - Table name
 * @param {string} keyColumn - Column to match for deletion
 * @param {*} keyValue - Value of the key column
 * @returns {Promise<boolean>} Success status
 */
export async function deleteRecord(tableName, keyColumn, keyValue) {
    try {
        const supabase = getSupabase();
        
        const { error } = await supabase
            .from(tableName)
            .delete()
            .eq(keyColumn, keyValue);
        
        if (error) {
            console.error(`❌ Error deleting from ${tableName}:`, error);
            throw new Error(`Failed to delete from ${tableName}: ${error.message}`);
        }
        
        console.log(`✅ Deleted from ${tableName}:`, keyValue);
        return true;
        
    } catch (error) {
        console.error(`❌ Exception in deleteRecord(${tableName}):`, error);
        throw error;
    }
}

/**
 * Fetch records with exact count
 * @param {string} tableName - Table name
 * @param {number} limit - Maximum records to return
 * @returns {Promise<{data: Array, count: number}>} Data and count
 */
export async function fetchWithCount(tableName, limit = 50) {
    try {
        const supabase = getSupabase();
        
        const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact' })
            .order('updated_at', { ascending: false })
            .limit(limit);
        
        if (error) {
            console.error(`❌ Error fetching ${tableName} with count:`, error);
            throw new Error(error.message);
        }
        
        return { data: data || [], count: count || 0 };
        
    } catch (error) {
        console.error(`❌ Exception in fetchWithCount(${tableName}):`, error);
        throw error;
    }
}

/**
 * Execute RPC call (for stored procedures)
 * @param {string} functionName - Function name
 * @param {Object} params - Function parameters
 * @returns {Promise<*>} Function result
 */
export async function rpcCall(functionName, params = {}) {
    try {
        const supabase = getSupabase();
        
        const { data, error } = await supabase.rpc(functionName, params);
        
        if (error) {
            console.error(`❌ RPC error (${functionName}):`, error);
            throw new Error(error.message);
        }
        
        return data;
        
    } catch (error) {
        console.error(`❌ Exception in rpcCall(${functionName}):`, error);
        throw error;
    }
}

/**
 * Fetch single record by ID
 * @param {string} tableName - Table name
 * @param {string} id - Record ID
 * @returns {Promise<Object|null>} Record or null
 */
export async function fetchById(tableName, id) {
    try {
        const supabase = getSupabase();
        
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) {
            console.error(`❌ Error fetching ${tableName} by ID:`, error);
            return null;
        }
        
        return data;
        
    } catch (error) {
        console.error(`❌ Exception in fetchById(${tableName}):`, error);
        return null;
    }
}

/**
 * Fetch records matching a specific filter
 * @param {string} tableName - Table name
 * @param {string} column - Column name
 * @param {*} value - Value to match
 * @returns {Promise<Array>} Matching records
 */
export async function fetchByColumn(tableName, column, value) {
    try {
        const supabase = getSupabase();
        
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq(column, value)
            .order('updated_at', { ascending: false });
        
        if (error) {
            console.error(`❌ Error fetching ${tableName} by ${column}:`, error);
            return [];
        }
        
        return data || [];
        
    } catch (error) {
        console.error(`❌ Exception in fetchByColumn(${tableName}):`, error);
        return [];
    }
}
