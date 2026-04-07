/**
 * Application Core - Complete Version
 * Main entry point, orchestration, and global utilities
 * @version 4.5.0 - Production Ready
 * 
 * Features:
 * - Enhanced Sound System
 * - Professional Loading Screen
 * - Error Handling
 * - Performance Optimization
 * - AI Assistant Integration
 */

// ============================================================
// IMPORTS
// ============================================================

// Configuration & Services
import { initSupabase, CONFIG } from '../config/supabase.js';
import { rpcCall } from '../services/dbService.js';

// State Management
import { 
    getState, setState, subscribe,
    setMerchants, setMachines, setTransfers, setCollections, 
    setRequests, setArchives, setLoading, setConnectionStatus,
    getMerchants, getMachines, getTransfers, getCollections, 
    getRequests, getArchives, setSearchTerm, getSearchTerm,
    setCurrentPage
} from '../ui/stateManager.js';

// UI Components
import { showToast, showSuccess, showError, showWarning } from '../ui/toast.js';
import { initModals, showModal, closeMainModal, showConfirm, closeConfirm, handleConfirmClick } from '../ui/modals.js';
import { playSound } from '../ui/soundManager.js';
// Utilities
import { 
    formatDate, formatTime, formatTimeForDB, formatMoney, 
    normalizeText, escapeHtml 
} from '../utils/formatters.js';
import { 
    debounce, shakeElement, getCurrentArabicMonth, getTodayDate 
} from '../utils/helpers.js';

// Pages
import { renderDashboard } from '../pages/dashboard.js';
import { 
    renderMerchants, openMerchantModal, saveMerchant, 
    editMerchant, deleteMerchant 
} from '../pages/merchants.js';
import { 
    renderMachines, openMachineModal, saveMachine, 
    editMachine, deleteMachine, autoFillMerchantData 
} from '../pages/machines.js';
import { 
    renderTransfers, openTransferModal, saveTransfer, 
    editTransfer, deleteTransfer 
} from '../pages/transfers.js';
import { 
    renderCollections, openCollectionModal, saveCollection, 
    editCollection, deleteCollection 
} from '../pages/collections.js';
import { loadStatement } from '../pages/statement.js';
import { 
    renderRequests, updatePendingBadge, convertRequest, deleteRequest 
} from '../pages/requests.js';
import { 
    renderArchive, confirmCloseMonth, deleteArchive 
} from '../pages/archive.js';
import { 
    discoverDatabase, selectTable, refreshSelectedTable 
} from '../pages/database.js';

// Additional Services
import { findMerchantById } from '../services/merchantService.js';
import { logAction } from '../services/logService.js';

// AI Assistant
import { initializeAiAssistant, sendAiMessage, toggleAiPanel } from '../ui/aiAssistant.js';

// Global App namespace
window.App = {};

// ============================================================
// GLOBAL LOADING STATE MANAGEMENT
// ============================================================

/**
 * Show/hide global loading overlay
 * @param {boolean} show - Whether to show loading
 * @param {string} message - Optional loading message
 */
export function showLoading(show, message = 'جاري التحميل...') {
    const loadingEl = document.getElementById('globalLoading');
    const loadingText = loadingEl?.querySelector('.loading-text');
    
    if (loadingEl) {
        if (show) {
            if (loadingText) loadingText.textContent = message;
            loadingEl.classList.add('show');
        } else {
            loadingEl.classList.remove('show');
        }
    }
    
    setLoading(show);
}

// ============================================================
// SESSION MANAGEMENT
// ============================================================

/**
 * Check if user has valid session
 * @returns {boolean} Session validity
 */
export function checkSession() {
    try {
        const sessionData = localStorage.getItem('axentro_session');
        if (!sessionData) return false;
        
        const session = JSON.parse(sessionData);
        const now = Date.now();
        
        // Check if session expired
        if (now > session.expiry) {
            clearSession();
            return false;
        }
        
        return session.isLoggedIn === true;
    } catch (error) {
        console.warn('Session check error:', error.message);
        return false;
    }
}

/**
 * Create new session
 */
function createSession() {
    const session = {
        isLoggedIn: true,
        loginTime: Date.now(),
        expiry: Date.now() + CONFIG.SESSION_DURATION
    };
    
    localStorage.setItem('axentro_session', JSON.stringify(session));
}

/**
 * Clear session data
 */
export function clearSession() {
    localStorage.removeItem('axentro_session');
}

// ============================================================
// DATA FETCHING & REFRESH
// ============================================================

/** Cache timestamp to prevent excessive refreshes */
let lastRefreshTime = 0;
const MIN_REFRESH_INTERVAL = 2000; // 2 seconds minimum between refreshes

/**
 * Fetch all data from database with error handling
 * @param {boolean} force - Force refresh even if recently refreshed
 * @returns {Promise<boolean>} Success status
 */
export async function refreshAllData(force = false) {
    // Prevent excessive calls
    const now = Date.now();
    if (!force && (now - lastRefreshTime) < MIN_REFRESH_INTERVAL) {
        console.log('⏭️ Skipping refresh (too recent)');
        return true;
    }
    
    lastRefreshTime = now;
    
    try {
        // Fetch all data concurrently for performance
        const [
            merchantsData,
            machinesData,
            transfersData,
            collectionsData,
            requestsData,
            archivesData
        ] = await Promise.allSettled([
            import('../services/merchantService.js').then(m => m.getAllMerchants()),
            import('../services/machineService.js').then(m => m.getAllMachines()),
            import('../services/transactionService.js').then(t => t.getAllTransfers()),
            import('../services/collectionService.js').then(c => c.getAllCollections()),
            import('../services/requestService.js').then(r => r.getAllRequests()),
            import('../services/archiveService.js').then(a => a.getAllArchives())
        ]);
        
        // Process results with error handling
        setMerchants(merchantsData.status === 'fulfilled' ? merchantsData.value : []);
        setMachines(machinesData.status === 'fulfilled' ? machinesData.value : []);
        setTransfers(transfersData.status === 'fulfilled' ? transfersData.value : []);
        setCollections(collectionsData.status === 'fulfilled' ? collectionsData.value : []);
        setRequests(requestsData.status === 'fulfilled' ? requestsData.value : []);
        setArchives(archivesData.status === 'fulfilled' ? archivesData.value : []);
        
        // Log any errors
        [merchantsData, machinesData, transfersData, collectionsData, requestsData, archivesData].forEach((result, index) => {
            if (result.status === 'rejected') {
                console.warn(`⚠️ Failed to fetch ${['merchants', 'machines', 'transfers', 'collections', 'requests', 'archives'][index]}:`, result.reason?.message);
            }
        });
        
        // Update UI after data is set
        updateAllViews();
        updatePendingBadge();
        
        setConnectionStatus('live');
        
        console.log('✅ All data refreshed successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Error refreshing data:', error);
        setConnectionStatus('error');
        showError('فشل تحديث البيانات: ' + error.message);
        return false;
    }
}

/**
 * Update all view components with current data
 */
function updateAllViews() {
    try {
        renderDashboard();
        renderMerchants();
        renderMachines();
        renderTransfers();
        renderCollections();
        renderArchive();
        renderRequests();
    } catch (error) {
        console.error('Error updating views:', error);
    }
}

// ============================================================
// AUTHENTICATION
// ============================================================

/**
 * Perform login action
 */
async function performLogin() {
    const passwordInput = document.getElementById('passwordInput');
    const errorMsg = document.getElementById('loginErrorMsg');
    const password = passwordInput?.value?.trim();
    
    if (!password) {
        errorMsg.classList.add('show');
        shakeElement(passwordInput);
        playSound('loginError');
        return;
    }
    
    // Validate password
    if (password !== CONFIG.PASSWORD) {
        errorMsg.classList.add('show');
        shakeElement(passwordInput);
        playSound('loginError');
        
        // Log failed attempt
        await logLoginAttempt(false, 'Wrong password attempt');
        return;
    }
    
    // Success
    errorMsg.classList.remove('show');
    playSound('loginSuccess');
    
    // Create session
    createSession();
    
    // Log successful login
    await logLoginAttempt(true, 'Admin logged in');
    
    // Show application
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';
    
    // Load data
    showLoading(true, 'جاري تحميل البيانات...');
    await refreshAllData(true);
    showLoading(false);
    
    showToast('🎉 مرحباً بك!', 'success');
}

/**
 * Perform logout action
 */
async function performLogout() {
    showConfirm(
        'هل تريد تسجيل الخروج؟',
        async () => {
            playSound('logoutSuccess');
            
            // Clear session
            clearSession();
            
            // Reset state
            resetAppState();
            
            // Hide app, show login
            document.getElementById('appContainer').style.display = 'none';
            document.getElementById('loginSection').style.display = 'flex';
            
            // Clear password field
            const passwordInput = document.getElementById('passwordInput');
            if (passwordInput) passwordInput.value = '';
            
            showToast('تم تسجيل الخروج بنجاح', 'success');
        },
        'نعم، خروج'
    );
}

/**
 * Reset application state
 */
function resetAppState() {
    setMerchants([]);
    setMachines([]);
    setTransfers([]);
    setCollections([]);
    setRequests([]);
    setArchives([]);
    setCurrentPage('home');
}

// ============================================================
// NAVIGATION
// ============================================================

/**
 * Navigate to a specific page
 * @param {string} pageName - Page identifier
 */
function navigateTo(pageName) {
    // Hide all pages
    document.querySelectorAll('.page-section').forEach(page => {
        page.classList.remove('active');
    });
    
    // Deactivate all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(`page${pageName.charAt(0).toUpperCase() + pageName.slice(1)}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Activate nav item
    const targetNav = document.querySelector(`[data-page="${pageName}"]`);
    if (targetNav) {
        targetNav.classList.add('active');
    }
    
    setCurrentPage(pageName);
    playSound('done');
}

// ============================================================
// EVENT LISTENERS SETUP
// ============================================================

/**
 * Initialize all application event listeners
 */
function initEventListeners() {
    // ===== LOGIN SECTION =====
    const loginBtn = document.getElementById('loginBtn');
    const passwordInput = document.getElementById('passwordInput');
    
    loginBtn?.addEventListener('click', performLogin);
    passwordInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performLogin();
    });
    
    // Hide error on input
    passwordInput?.addEventListener('input', () => {
        document.getElementById('loginErrorMsg')?.classList.remove('show');
    });
    
    // ===== HEADER ACTIONS =====
    document.getElementById('refreshBtn')?.addEventListener('click', async () => {
        playSound('scan');
        showLoading(true, 'جاري التحديث...');
        await refreshAllData(true);
        showLoading(false);
        showToast('✅ تم التحديث', 'success');
    });
    
    document.getElementById('logoutBtn')?.addEventListener('click', performLogout);
    
    // ===== SIDEBAR NAVIGATION =====
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', () => {
            navigateTo(item.dataset.page);
        });
    });
    
    // ===== FILTER CHANGES =====
    document.getElementById('merchantStatusFilter')?.addEventListener('change', () => {
        renderMerchants();
    });
    
    document.getElementById('machineStatusFilter')?.addEventListener('change', () => {
        renderMachines();
    });
    
    // ===== DATE FILTERS =====
    document.getElementById('transferDateFrom')?.addEventListener('change', () => {
        renderTransfers();
    });
    
    document.getElementById('transferDateTo')?.addEventListener('change', () => {
        renderTransfers();
    });
    
    // ===== AI ASSISTANT =====
    document.getElementById('aiToggleBtn')?.addEventListener('click', toggleAiPanel);
    document.getElementById('aiCloseBtn')?.addEventListener('click', toggleAiPanel);
    
    console.log('✅ Event listeners initialized');
}

// ============================================================
// INITIALIZATION WITH PROFESSIONAL LOADING SCREEN
// ============================================================

/**
 * Initialize the complete application with animated loading screen
 */
async function initializeApp() {
    console.log(`🚀 ${CONFIG.APP_NAME} v${CONFIG.APP_VERSION} Initializing...`);
    console.log('⚡ Developed by Axentro Team | © 2024');
    
    // Get loading screen elements
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const loadingStatus = document.getElementById('loadingStatus');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    // Animate progress bar
    let progress = 0;
    const progressInterval = setInterval(() => {
        if (progress < 90) {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            
            if (progressFill) progressFill.style.width = `${progress}%`;
            if (progressText) progressText.textContent = `${Math.round(progress)}%`;
            
            // Update status messages based on progress
            if (loadingStatus) {
                if (progress >= 30 && progress < 60) {
                    loadingStatus.textContent = 'جاري تحميل الوحدات...';
                } else if (progress >= 60 && progress < 85) {
                    loadingStatus.textContent = 'جاري الاتصال بقاعدة البيانات...';
                }
            }
        }
    }, 200);

    try {
        // Step 1: Initialize Supabase connection
        if (loadingStatus) loadingStatus.textContent = 'جاري تهيئة الاتصال...';
        
        if (!initSupabase()) {
            clearInterval(progressInterval);
            showError('❌ فشل تهيئة الاتصال بقاعدة البيانات');
            playSound('loginError');
            
            finishLoadingWithError(loadingOverlay, progressFill, progressText, loadingStatus);
            setLoading(false);
            return;
        }
        
        // Update progress for Supabase connection
        updateProgress(progressFill, progressText, loadingStatus, 95, 'جاري تهيئة واجهة المستخدم...');
        
        await delay(300);
        
        // Step 2: Initialize UI components
        initModals();
        initEventListeners();
        
        // Step 3: Initialize AI Assistant
        if (CONFIG.AI_CONFIG.ENABLED) {
            initializeAiAssistant();
        }
        
        // Complete the progress bar
        updateProgress(progressFill, progressText, loadingStatus, 100, 'تم التحميل بنجاح! ✅');
        
        clearInterval(progressInterval);
        
        await delay(800);
        
        // Fade out loading overlay
        if (loadingOverlay) loadingOverlay.classList.add('fade-out');
        
        setTimeout(() => {
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            
            // Check authentication session
            if (checkSession()) {
                document.getElementById('loginSection').style.display = 'none';
                document.getElementById('appContainer').style.display = 'flex';
                playSound('scan');
                refreshAllData(true);
            } else {
                document.getElementById('loginSection').style.display = 'flex';
                playSound('scan');
            }

            setLoading(false);
        }, 500);
        
        // Auto-refresh every 5 minutes
        setInterval(async () => {
            if (checkSession() && document.getElementById('appContainer').style.display === 'flex') {
                await refreshAllData();
            }
        }, CONFIG.AUTO_REFRESH_INTERVAL);

        console.log(`✅ ${CONFIG.APP_NAME} v${CONFIG.APP_VERSION} Ready!`);
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
        clearInterval(progressInterval);
        
        updateProgress(progressFill, progressText, loadingStatus, 100, 'حدث خطأ أثناء التحميل');
        playSound('loginError');
        
        finishLoadingWithError(loadingOverlay, progressFill, progressText, loadingStatus);
        setLoading(false);
    }
}

/**
 * Helper: Update progress bar
 */
function updateProgress(fill, text, status, value, statusMsg) {
    if (fill) fill.style.width = `${value}%`;
    if (text) text.textContent = `${value}%`;
    if (status) status.textContent = statusMsg;
}

/**
 * Helper: Finish loading with error state
 */
function finishLoadingWithError(overlay, fill, text, status) {
    if (fill) fill.style.width = '100%';
    if (text) text.textContent = '100%';
    if (status) status.textContent = 'حدث خطأ!';
    
    setTimeout(() => {
        if (overlay) overlay.classList.add('fade-out');
        setTimeout(() => {
            if (overlay) overlay.style.display = 'none';
            document.getElementById('loginSection').style.display = 'flex';
            showError('حدث خطأ أثناء تحميل النظام');
        }, 500);
    }, 1000);
}

/**
 * Helper: Delay promise
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise}
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// EXPOSE GLOBAL FUNCTIONS
// ============================================================

// Expose functions to window.App for HTML onclick handlers
window.App = {
    // Merchant operations
    openMerchantModal,
    saveMerchant,
    editMerchant,
    deleteMerchant,
    
    // Machine operations
    openMachineModal,
    saveMachine,
    editMachine,
    deleteMachine,
    autoFillMerchantData,
    
    // Transfer operations
    openTransferModal,
    saveTransfer,
    editTransfer,
    deleteTransfer,
    
    // Collection operations
    openCollectionModal,
    saveCollection,
    editCollection,
    deleteCollection,
    
    // Archive operations
    confirmCloseMonth,
    deleteArchive,
    
    // Request operations
    convertRequest,
    deleteRequest,
    
    // Database explorer
    discoverDatabase,
    selectTable,
    refreshSelectedTable,
    
    // AI Assistant
    sendAiMessage,
    toggleAiPanel,
    
    // Utility
    refreshAllData: () => refreshAllData(true),
    showLoading
};

// ============================================================
// START APPLICATION
// ============================================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
