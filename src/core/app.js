/**
 * Application Core - Complete Version v5.0
 * Main entry point, orchestration, and global utilities
 * 
 * Features:
 * - Enhanced Sound System
 * - Professional Loading Screen
 * - Robust Error Handling
 * - Performance Optimization
 * - AI Assistant Integration
 * - Smart Search Components
 * - Professional Scanner
 */

// ============================================================
// IMPORTS
// ============================================================

import { CONFIG, initSupabase, getSupabase, generateReferenceNumber, formatDate, formatTime, formatMoney, normalizeText, escapeHtml } from '../config/supabase.js';
import { fetchAll, insertRecord, updateRecord, deleteRecord } from '../services/dbService.js';
import { getAllMerchants, findMerchantById } from '../services/merchantService.js';
import { getAllMachines } from '../services/machineService.js';
import { getAllTransfers } from '../services/transactionService.js';
import { getAllCollections } from '../services/collectionService.js';
import { getAllRequests, updateRequestStatus } from '../services/requestService.js';
import { getAllArchives } from '../services/archiveService.js';
import { logAction } from '../services/logService.js';
import { processAiQuery } from '../services/aiService.js';

// Global App namespace
const App = {
    // State
    state: {
        merchants: [],
        machines: [],
        transfers: [],
        collections: [],
        requests: [],
        archives: [],
        currentPage: 'dashboard',
        isLoading: false,
        connectionStatus: 'live',
        searchTerm: ''
    },
    
    // Cache timestamps
    lastRefreshTime: 0,
    MIN_REFRESH_INTERVAL: 2000, // 2 seconds
    
    // ============================================================
    // INITIALIZATION
    // ============================================================
    
    /**
     * Initialize the application
     */
    async init() {
        console.log('🎯 Initializing Application...');
        
        // Check session
        if (this.checkSession()) {
            this.showApp();
            await this.refreshAllData(true);
        } else {
            this.showLogin();
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start request checker
        this.startRequestChecker();
        
        console.log('✅ Application initialized');
    },
    
    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Enter key on login
        document.getElementById('passwordInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+R to refresh (prevent default reload)
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.refreshData();
            }
        });
    },
    
    // ============================================================
    // SESSION MANAGEMENT
    // ============================================================
    
    /**
     * Check if user has valid session
     * @returns {boolean} Session validity
     */
    checkSession() {
        try {
            const sessionData = localStorage.getItem('axentro_session');
            if (!sessionData) return false;
            
            const session = JSON.parse(sessionData);
            const now = Date.now();
            
            if (now > session.expiry) {
                this.clearSession();
                return false;
            }
            
            return session.isLoggedIn === true;
        } catch (error) {
            console.warn('Session check error:', error.message);
            return false;
        }
    },
    
    /**
     * Create new session
     */
    createSession() {
        const session = {
            isLoggedIn: true,
            loginTime: Date.now(),
            expiry: Date.now() + CONFIG.SESSION_DURATION
        };
        
        localStorage.setItem('axentro_session', JSON.stringify(session));
    },
    
    /**
     * Clear session data
     */
    clearSession() {
        localStorage.removeItem('axentro_session');
    },
    
    // ============================================================
    // AUTHENTICATION
    // ============================================================
    
    /**
     * Perform login action
     */
    async login() {
        const passwordInput = document.getElementById('passwordInput');
        const errorMsg = document.getElementById('loginErrorMsg');
        const password = passwordInput?.value?.trim();
        
        if (!password) {
            errorMsg.classList.add('show');
            this.shakeElement(passwordInput);
            Sound.play('loginError');
            return;
        }
        
        // Validate against database or config
        // For now using config password (can be changed to DB auth)
        if (password !== CONFIG.PASSWORD) {
            errorMsg.classList.add('show');
            this.shakeElement(passwordInput);
            Sound.play('loginError');
            
            // Log failed attempt
            await logAction('login_failed', 'Wrong password attempt', null, 'error');
            return;
        }
        
        // Success
        errorMsg.classList.remove('show');
        Sound.play('loginSuccess');
        
        // Create session
        this.createSession();
        
        // Log successful login
        await logAction('login_success', 'Admin logged in', null, 'info');
        
        // Show application
        this.showApp();
        
        // Load data
        this.showLoading(true, 'جاري تحميل البيانات...');
        await this.refreshAllData(true);
        this.showLoading(false);
        
        UI.showToast('🎉 مرحباً بك!', 'تم تسجيل الدخول بنجاح', 'success');
    },
    
    /**
     * Perform logout action
     */
    async logout() {
        UI.showConfirm(
            'هل تريد تسجيل الخروج؟',
            async () => {
                Sound.play('logoutSuccess');
                
                // Clear session
                this.clearSession();
                
                // Reset state
                this.resetAppState();
                
                // Hide app, show login
                document.getElementById('appContainer').style.display = 'none';
                document.getElementById('loginSection').style.display = 'flex';
                
                // Clear password field
                const passwordInput = document.getElementById('passwordInput');
                if (passwordInput) passwordInput.value = '';
                
                UI.showToast('تم تسجيل الخروج بنجاح', '', 'success');
            },
            'نعم، خروج'
        );
    },
    
    /**
     * Show login screen
     */
    showLogin() {
        document.getElementById('loginSection').style.display = 'flex';
        document.getElementById('appContainer').style.display = 'none';
    },
    
    /**
     * Show main application
     */
    showApp() {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
    },
    
    /**
     * Reset application state
     */
    resetAppState() {
        this.state.merchants = [];
        this.state.machines = [];
        this.state.transfers = [];
        this.state.collections = [];
        this.state.requests = [];
        this.state.archives = [];
        this.state.currentPage = 'dashboard';
    },
    
    // ============================================================
    // NAVIGATION
    // ============================================================
    
    /**
     * Navigate to a specific page
     * @param {string} pageName - Name of the page to navigate to
     */
    navigateTo(pageName) {
        // Update state
        this.state.currentPage = pageName;
        
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === pageName) {
                item.classList.add('active');
            }
        });
        
        // Show/hide pages
        document.querySelectorAll('.page-container').forEach(page => {
            page.classList.remove('active');
        });
        
        const targetPage = document.getElementById(`page-${pageName}`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Play navigation sound
        Sound.play('click');
        
        // Render page-specific data
        this.renderCurrentPage(pageName);
    },
    
    /**
     * Render current page data
     * @param {string} pageName - Current page name
     */
    renderCurrentPage(pageName) {
        switch(pageName) {
            case 'dashboard':
                Dashboard.render(this.state);
                break;
            case 'merchants':
                MerchantsPage.render(this.state.merchants);
                break;
            case 'machines':
                MachinesPage.render(this.state.machines, this.state.merchants);
                break;
            case 'transfers':
                TransfersPage.render(this.state.transfers);
                break;
            case 'collections':
                CollectionsPage.render(this.state.collections);
                break;
            case 'archive':
                ArchivePage.render(this.state.archives);
                break;
            case 'requests':
                RequestsPage.render(this.state.requests);
                break;
        }
    },
    
    // ============================================================
    // DATA FETCHING & REFRESH
    // ============================================================
    
    /**
     * Fetch all data from database with error handling
     * @param {boolean} force - Force refresh even if recently refreshed
     * @returns {Promise<boolean>} Success status
     */
    async refreshAllData(force = false) {
        // Prevent excessive calls
        const now = Date.now();
        if (!force && (now - this.lastRefreshTime) < this.MIN_REFRESH_INTERVAL) {
            console.log('⏭️ Skipping refresh (too recent)');
            return true;
        }
        this.lastRefreshTime = now;
        
        try {
            this.setLoading(true);
            this.updateConnectionStatus('live');
            
            // Fetch all data concurrently for performance
            const [
                merchantsResult,
                machinesResult,
                transfersResult,
                collectionsResult,
                requestsResult,
                archivesResult
            ] = await Promise.allSettled([
                getAllMerchants(),
                getAllMachines(),
                getAllTransfers(),
                getAllCollections(),
                getAllRequests(),
                getAllArchives()
            ]);
            
            // Process results with error handling
            this.state.merchants = merchantsResult.status === 'fulfilled' ? merchantsResult.value : [];
            this.state.machines = machinesResult.status === 'fulfilled' ? machinesResult.value : [];
            this.state.transfers = transfersResult.status === 'fulfilled' ? transfersResult.value : [];
            this.state.collections = collectionsResult.status === 'fulfilled' ? collectionsResult.value : [];
            this.state.requests = requestsResult.status === 'fulfilled' ? requestsResult.value : [];
            this.state.archives = archivesResult.status === 'fulfilled' ? archivesResult.value : [];
            
            // Log any errors
            const results = [merchantsResult, machinesResult, transfersResult, collectionsResult, requestsResult, archivesResult];
            const tableNames = ['merchants', 'machines', 'transfers', 'collections', 'requests', 'archives'];
            
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.warn(`⚠️ Failed to fetch ${tableNames[index]}:`, result.reason?.message);
                }
            });
            
            // Update UI
            this.updateAllViews();
            this.updateBadges();
            
            console.log('✅ All data refreshed successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error refreshing data:', error);
            this.updateConnectionStatus('error');
            UI.showToast('خطأ', 'فشل تحديث البيانات: ' + error.message, 'error');
            return false;
        } finally {
            this.setLoading(false);
        }
    },
    
    /**
     * Refresh data (public method for button click)
     */
    async refreshData() {
        Sound.play('refresh');
        await this.refreshAllData(true);
        UI.showToast('تم التحديث', 'تم تحديث البيانات بنجاح', 'success');
    },
    
    /**
     * Update all view components with current data
     */
    updateAllViews() {
        try {
            // Always render dashboard stats
            Dashboard.render(this.state);
            
            // Render current page
            this.renderCurrentPage(this.state.currentPage);
            
        } catch (error) {
            console.error('Error updating views:', error);
        }
    },
    
    /**
     * Update badges (pending requests, etc.)
     */
    updateBadges() {
        // Count pending requests
        const pendingRequests = this.state.requests.filter(r => r['الحالة'] === 'pending' || r['الحالة'] === 'معلق');
        const pendingCount = pendingRequests.length;
        
        // Update request badge
        const requestsBadge = document.getElementById('requestsBadge');
        const requestsCountBadge = document.getElementById('requestsCountBadge');
        
        if (pendingCount > 0) {
            if (requestsBadge) {
                requestsBadge.style.display = 'inline-block';
                requestsBadge.textContent = pendingCount;
            }
            if (requestsCountBadge) {
                requestsCountBadge.style.display = 'inline-block';
                requestsCountBadge.textContent = `${pendingCount} طلب معلق`;
            }
        } else {
            if (requestsBadge) requestsBadge.style.display = 'none';
            if (requestsCountBadge) requestsCountBadge.style.display = 'none';
        }
    },
    
    // ============================================================
    // LOADING STATE MANAGEMENT
    // ============================================================
    
    /**
     * Show/hide global loading overlay
     * @param {boolean} show - Whether to show loading
     * @param {string} message - Optional loading message
     */
    showLoading(show, message = 'جاري التحميل...') {
        const loadingEl = document.getElementById('globalLoading');
        const loadingText = loadingEl?.querySelector('.loading-text');
        
        if (loadingEl) {
            if (show) {
                if (loadingText) loadingText.textContent = message;
                loadingEl.classList.remove('hidden');
            } else {
                loadingEl.classList.add('hidden');
            }
        }
        
        this.state.isLoading = show;
    },
    
    /**
     * Set internal loading state
     * @param {boolean} loading - Loading state
     */
    setLoading(loading) {
        this.state.isLoading = loading;
    },
    
    // ============================================================
    // CONNECTION STATUS
    // ============================================================
    
    /**
     * Update connection status indicator
     * @param {string} status - Status ('live' or 'error')
     */
    updateConnectionStatus(status) {
        this.state.connectionStatus = status;
        
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) {
            statusEl.className = `connection-status ${status}`;
            statusEl.innerHTML = `
                <span class="status-dot"></span>
                <span>${status === 'live' ? 'متصل' : 'غير متصل'}</span>
            `;
        }
    },
    
    // ============================================================
    // REQUEST CHECKER (Every 5 minutes)
    // ============================================================
    
    requestCheckerInterval: null,
    
    /**
     * Start periodic request checking
     */
    startRequestChecker() {
        if (this.requestCheckerInterval) {
            clearInterval(this.requestCheckerInterval);
        }
        
        this.requestCheckerInterval = setInterval(async () => {
            await this.checkPendingRequests();
        }, CONFIG.REQUEST_CHECK_INTERVAL);
    },
    
    /**
     * Check for pending requests and show notification
     */
    async checkPendingRequests() {
        try {
            const pendingRequests = this.state.requests.filter(r => 
                r['الحالة'] === 'pending' || r['الحالة'] === 'معلق'
            );
            
            if (pendingRequests.length > 0) {
                Sound.play('notification');
                UI.showToast(
                    'تنبيه: طلبات معلقة',
                    `لديك ${pendingRequests.length} طلب(ات) بانتظار المعالجة`,
                    'warning'
                );
            }
        } catch (error) {
            console.warn('Error checking pending requests:', error.message);
        }
    },
    
    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================
    
    /**
     * Shake element animation (for errors)
     * @param {HTMLElement} element - Element to shake
     */
    shakeElement(element) {
        if (!element) return;
        element.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    },
    
    /**
     * Debounce function for search inputs
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * Get today's date in YYYY-MM-DD format
     * @returns {string} Today's date
     */
    getTodayDate() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    },
    
    /**
     * Get current time in HH:MM format (24-hour)
     * @returns {string} Current time
     */
    getCurrentTime() {
        const now = new Date();
        return now.toTimeString().slice(0, 5);
    }
};

// Export as singleton
export { App };
export default App;
