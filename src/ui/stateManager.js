/**
 * State Manager
 * Centralized application state management
 */

// Initial state structure
const initialState = {
    // Authentication
    auth: {
        isLoggedIn: false,
        sessionExpiry: null
    },
    
    // Database cache
    db: {
        merchants: [],
        machines: [],
        transfers: [],
        collections: [],
        requests: [],
        archives: []
    },
    
    // UI State
    ui: {
        currentPage: 'home',
        loading: false,
        connectionStatus: 'live'
    },
    
    // Search terms
    search: {
        merchant: '',
        machine: '',
        request: ''
    },
    
    // Scanner state
    scanner: {
        stream: null,
        flashState: false,
        currentInput: null,
        scannedValue: ''
    },
    
    // Database explorer
    databaseExplorer: {
        discoveredTables: [],
        selectedTable: null
    }
};

// Current application state
let currentState = { ...initialState };

// Subscribers for state changes
const subscribers = new Map();

/**
 * Get current state
 * @returns {Object} Current state (read-only copy)
 */
export function getState() {
    return { ...currentState };
}

/**
 * Update state
 * @param {string} path - Dot notation path (e.g., 'db.merchants')
 * @param {*} value - New value
 */
export function setState(path, value) {
    const keys = path.split('.');
    let obj = currentState;
    
    // Navigate to the target object
    for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in obj)) {
            obj[keys[i]] = {};
        }
        obj = obj[keys[i]];
    }
    
    // Set the final value
    obj[keys[keys.length - 1]] = value;
    
    // Notify subscribers
    notifySubscribers(path, value);
}

/**
 * Subscribe to state changes
 * @param {string} path - Path to watch
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export function subscribe(path, callback) {
    if (!subscribers.has(path)) {
        subscribers.set(path, new Set());
    }
    
    subscribers.get(path).add(callback);
    
    // Return unsubscribe function
    return () => {
        const subs = subscribers.get(path);
        if (subs) {
            subs.delete(callback);
        }
    };
}

/**
 * Notify subscribers of state change
 * @param {string} path - Changed path
 * @param {*} value - New value
 */
function notifySubscribers(path, value) {
    // Notify exact path subscribers
    const subs = subscribers.get(path);
    if (subs) {
        subs.forEach(callback => {
            try {
                callback(value);
            } catch (error) {
                console.error('Subscriber error:', error);
            }
        });
    }
    
    // Notify parent path subscribers
    const keys = path.split('.');
    for (let i = keys.length - 1; i > 0; i--) {
        const parentPath = keys.slice(0, i).join('.');
        const parentSubs = subscribers.get(parentPath);
        
        if (parentSubs) {
            parentSubs.forEach(callback => {
                try {
                    callback(getState());
                } catch (error) {
                    console.error('Subscriber error:', error);
                }
            });
        }
    }
}

/**
 * Reset state to initial values
 */
export function resetState() {
    currentState = { ...initialState };
    
    // Notify all subscribers
    subscribers.forEach((subs, path) => {
        subs.forEach(callback => {
            try {
                callback(getState());
            } catch (error) {
                console.error('Subscriber error:', error);
            }
        });
    });
}

/**
 * Update multiple state properties at once
 * @param {Object} updates - Object with path:value pairs
 */
export function batchUpdate(updates) {
    Object.entries(updates).forEach(([path, value]) => {
        setState(path, value);
    });
}

// Export convenience getters for common paths
export const getMerchants = () => getState().db.merchants;
export const getMachines = () => getState().db.machines;
export const getTransfers = () => getState().db.transfers;
export const getCollections = () => getState().db.collections;
export const getRequests = () => getState().db.requests;
export const getArchives = () => getState().db.archives;
export const isLoading = () => getState().ui.loading;
export const getCurrentPage = () => getState().ui.currentPage;
export const getConnectionStatus = () => getState().ui.connectionStatus;

// Export convenience setters
export const setMerchants = (value) => setState('db.merchants', value);
export const setMachines = (value) => setState('db.machines', value);
export const setTransfers = (value) => setState('db.transfers', value);
export const setCollections = (value) => setState('db.collections', value);
export const setRequests = (value) => setState('db.requests', value);
export const setArchives = (value) => setState('db.archives', value);
export const setLoading = (value) => setState('ui.loading', value);
export const setCurrentPage = (value) => setState('ui.currentPage', value);
export const setConnectionStatus = (value) => setState('ui.connectionStatus', value);
export const setSearchTerm = (type, value) => setState(`search.${type}`, value);
export const getSearchTerm = (type) => getState().search[type];
