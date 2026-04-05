/**
 * Database Service Layer
 * Centralized database operations for all entities
 * This is the ONLY place where direct Supabase calls should happen
 */

import { getSupabase } from '../config/supabase.js';

/**
 * Fetch all records from a table
 * @param {string} tableName - Table name
 * @param {Object} options - Query options (orderBy, limit, etc.)
 * @returns {Promise<Array>} Array of records
 */
export async function fetchAll(tableName, options = {}) {
    const supabase = getSupabase();
    
    let query = supabase.from(tableName).select('*');
    
    if (options.orderBy) {
        const [column, direction] = options.orderBy.split('.');
        query = query.order(column, { 
            ascending: direction !== 'desc' 
        });
    }
    
    if (options.limit) {
        query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error(`❌ Error fetching ${tableName}:`, error);
        throw new Error(`Failed to fetch ${tableName}: ${error.message}`);
    }
    
    return data || [];
}

/**
 * Insert a new record into a table
 * @param {string} tableName - Table name
 * @param {Object} record - Record data
 * @returns {Promise<Object>} Inserted record
 */
export async function insertRecord(tableName, record) {
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
    
    return data;
}

/**
 * Update an existing record
 * @param {string} tableName - Table name
 * @param {Object} record - Updated record data
 * @param {string} keyColumn - Column to match for update
 * @param {*} keyValue - Value of the key column
 * @returns {Promise<Object>} Updated record
 */
export async function updateRecord(tableName, record, keyColumn, keyValue) {
    const supabase = getSupabase();
    
    // Remove the key column from the update data to avoid conflicts
    const { [keyColumn]: _, ...updateData } = record;
    
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
    
    return data;
}

/**
 * Delete a record from a table
 * @param {string} tableName - Table name
 * @param {string} keyColumn - Column to match for deletion
 * @param {*} keyValue - Value of the key column
 * @returns {Promise<boolean>} Success status
 */
export async function deleteRecord(tableName, keyColumn, keyValue) {
    const supabase = getSupabase();
    
    const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(keyColumn, keyValue);
    
    if (error) {
        console.error(`❌ Error deleting from ${tableName}:`, error);
        throw new Error(`Failed to delete from ${tableName}: ${error.message}`);
    }
    
    return true;
}

/**
 * Fetch records with exact count
 * @param {string} tableName - Table name
 * @param {number} limit - Maximum records to return
 * @returns {Promise<{data: Array, count: number}>} Data and count
 */
export async function fetchWithCount(tableName, limit = 50) {
    const supabase = getSupabase();
    
    const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(limit);
    
    if (error) {
        console.error(`❌ Error fetching ${tableName} with count:`, error);
        throw new Error(error.message);
    }
    
    return { data: data || [], count: count || 0 };
}

/**
 * Execute RPC call (for stored procedures)
 * @param {string} functionName - Function name
 * @param {Object} params - Function parameters
 * @returns {Promise<any>} Function result
 */
export async function rpcCall(functionName, params = {}) {
    const supabase = getSupabase();
    
    const { data, error } = await supabase.rpc(functionName, params);
    
    if (error) {
        console.error(`❌ RPC error (${functionName}):`, error);
        throw new Error(error.message);
    }
    
    return data;
}
