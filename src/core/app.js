/**
 * Application Core - Complete Version
 * Main entry point, orchestration, and global utilities
 * 🔊 Enhanced with Sound System & Professional Loading
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
    getRequests, getArchives, setSearchTerm, getSearchTerm
} from '../ui/stateManager.js';

// UI Components
import { showToast, showSuccess, showError, showWarning } from '../ui/toast.js';
import { initModals, showModal, closeMainModal, showConfirm, closeConfirm, handleConfirmClick } from '../ui/modals.js';

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

// Global App namespace
window.App = {};

// ============================================================
// SOUND MANAGEMENT SYSTEM 🎵
// ============================================================

/**
 * Play sound effect
 * @param {string} soundName - Sound identifier (loginSuccess, loginError, logoutSuccess, done, scan)
 */
function playSound(soundName) {
    try {
        const soundMap = {
            'loginSuccess': 'soundLoginSuccess',
            'loginError': 'soundLoginError',
            'logoutSuccess': 'soundLogoutSuccess',
            'done': 'soundDone',
            'scan': 'soundScan'
        };
        
        const audioId = soundMap[soundName];
        if (!audioId) {
            console.warn(`⚠️ Sound not found: ${soundName}`);
            return;
        }
        
        const audio = document.getElementById(audioId);
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log('🔊 Audio play blocked:', e.message));
        } else {
            console.warn(`⚠️ Audio element not found: ${audioId}`);
        }
    } catch (error) {
        console.error('❌ Error playing sound:', error);
    }
}

// Expose globally for use in other modules
window.playSound = playSound;

// ============================================================
// INITIALIZATION WITH PROFESSIONAL LOADING SCREEN ⚡
// ============================================================

/**
 * Initialize the complete application with animated loading screen
 */
async function initializeApp() {
    console.log('🚀 Axentro System v3.0 Professional Initializing...');
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
            
            // Play error sound
            playSound('loginError');
            
            // Still hide loading and show login
            if (progressFill) progressFill.style.width = '100%';
            if (progressText) progressText.textContent = '100%';
            if (loadingStatus) loadingStatus.textContent = 'حدث خطأ!';
            
            setTimeout(() => {
                if (loadingOverlay) loadingOverlay.classList.add('fade-out');
                setTimeout(() => {
                    if (loadingOverlay) loadingOverlay.style.display = 'none';
                    document.getElementById('loginSection').style.display = 'flex';
                }, 500);
            }, 500);
            
            setLoading(false);
            return;
        }
        
        // Update progress for Supabase connection
        if (progressFill) progressFill.style.width = '95%';
        if (progressText) progressText.textContent = '95%';
        if (loadingStatus) loadingStatus.textContent = 'جاري تهيئة واجهة المستخدم...';
        
        // Small delay for visual effect
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Step 2: Initialize UI components
        initModals();
        initEventListeners();
        
        // Complete the progress bar
        if (progressFill) progressFill.style.width = '100%';
        if (progressText) progressText.textContent = '100%';
        if (loadingStatus) loadingStatus.textContent = 'تم التحميل بنجاح! ✅';
        
        // Clear interval and finish loading
        clearInterval(progressInterval);
        
        // Wait a moment then hide loading screen
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Fade out loading overlay
        if (loadingOverlay) loadingOverlay.classList.add('fade-out');
        
        setTimeout(() => {
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            
            // Check authentication session
            if (checkSession()) {
                document.getElementById('loginSection').style.display = 'none';
                document.getElementById('appContainer').style.display = 'flex';
                
                // Play subtle ready sound
                playSound('scan');
                
                refreshAllData();
            } else {
                document.getElementById('loginSection').style.display = 'flex';
                
                // Play subtle sound to indicate readiness
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

        console.log('✅ Axentro System v3.0 Ready!');
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
        clearInterval(progressInterval);
        
        // Update UI to show error
        if (progressFill) progressFill.style.width = '100%';
        if (progressText) progressText.textContent = '100%';
        if (loadingStatus) loadingStatus.textContent = 'حدث خطأ أثناء التحميل';
        
        // Play error sound
        playSound('loginError');
        
        setTimeout(() => {
            if (loadingOverlay) loadingOverlay.classList.add('fade-out');
            setTimeout(() => {
                if (loadingOverlay) loadingOverlay.style.display = 'none';
                document.getElementById('loginSection').style.display = 'flex';
                showError('حدث خطأ أثناء تحميل النظام');
            }, 500);
        }, 1000);
        
        setLoading(false);
    }
}

// ============================================================
// EVENT LISTENERS SETUP
// ============================================================

/**
 * Initialize all application event listeners
 */
function initEventListeners() {
    // ===== LOGIN SECTION =====
    document.getElementById('loginBtn')?.addEventListener('click', performLogin);
    document.getElementById('passwordInput')?.addEventListener('keypress', handleLoginKeypress);
    document.getElementById('togglePasswordBtn')?.addEventListener('click', togglePassword);
    
    // ===== NAVBAR ACTIONS =====
    document.getElementById('refreshDataBtn')?.addEventListener('click', refreshAllData);
    document.getElementById('exportExcelBtn')?.addEventListener('click', exportToExcel);
    document.getElementById('logoutBtn')?.addEventListener('click', confirmLogout);
    
    // ===== TAB NAVIGATION =====
    document.querySelectorAll('.tab-link').forEach(tab => {
        tab.addEventListener('click', () => switchPage(tab.dataset.page, tab));
    });
    
    // ===== QUICK ACTION BUTTONS =====
    document.getElementById('quickTransferBtn')?.addEventListener('click', () => openTransferModal());
    document.getElementById('quickCollectionBtn')?.addEventListener('click', () => openCollectionModal());
    document.getElementById('quickMerchantBtn')?.addEventListener('click', () => openMerchantModal());
    document.getElementById('quickMachineBtn')?.addEventListener('click', () => openMachineModal());
    
    // ===== PAGE-SPECIFIC BUTTONS =====
    document.getElementById('addMerchantBtn')?.addEventListener('click', () => openMerchantModal());
    document.getElementById('addMachineBtn')?.addEventListener('click', () => openMachineModal());
    document.getElementById('addTransferBtn')?.addEventListener('click', () => openTransferModal());
    document.getElementById('addCollectionBtn')?.addEventListener('click', () => openCollectionModal());
    document.getElementById('loadStatementBtn')?.addEventListener('click', loadStatement);
    document.getElementById('closeMonthBtn')?.addEventListener('click', confirmCloseMonth);
    document.getElementById('discoverDbBtn')?.addEventListener('click', discoverDatabase);
    document.getElementById('refreshTableBtn')?.addEventListener('click', refreshSelectedTable);
    
    // ===== SEARCH INPUTS WITH DEBOUNCE =====
    setupDebouncedSearch('merchantSearch', 'merchant', renderMerchants);
    setupDebouncedSearch('machineSearch', 'machine', renderMachines);
    setupDebouncedSearch('requestSearch', 'request', renderRequests);
    
    // ===== FILTER CHANGES =====
    document.getElementById('merchantStatusFilter')?.addEventListener('change', renderMerchants);
    document.getElementById('machineStatusFilter')?.addEventListener('change', renderMachines);
    document.getElementById('requestStatusFilter')?.addEventListener('change', renderRequests);
    document.getElementById('transferDateFrom')?.addEventListener('change', renderTransfers);
    document.getElementById('transferDateTo')?.addEventListener('change', renderTransfers);
    
    // ===== STATEMENT SEARCH =====
    document.getElementById('stmtMerchantSearch')?.addEventListener('input', 
        (e) => handleMerchantLookup(e.target.value, 'stmtResults', 'stmtMerchantId')
    );
    
    // ===== SCANNER CONTROLS =====
    document.getElementById('toggleFlashBtn')?.addEventListener('click', toggleFlash);
    document.getElementById('captureScanBtn')?.addEventListener('click', captureScan);
    document.getElementById('useScannedValueBtn')?.addEventListener('click', useScannedValue);
    
    // ===== KEYBOARD SHORTCUTS =====
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // ===== CLICK OUTSIDE TO CLOSE SEARCH RESULTS =====
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            document.querySelectorAll('.search-results').forEach(el => {
                el.classList.remove('show');
            });
        }
    });

    // Expose all necessary methods globally for inline handlers
    exposeGlobalMethods();
    
    console.log('🎧 Event listeners initialized | 🔊 Sounds enabled');
}

/**
 * Setup debounced search input
 * @param {string} elementId - Input element ID
 * @param {string} searchType - Search type key
 * @param {Function} renderFn - Render function to call
 */
function setupDebouncedSearch(elementId, searchType, renderFn) {
    const input = document.getElementById(elementId);
    if (!input) return;
    
    input.addEventListener('input', debounce((e) => {
        setSearchTerm(searchType, e.target.value);
        renderFn();
    }, 200));
}

/**
 * Expose methods to window.App for global access
 */
function exposeGlobalMethods() {
    Object.assign(window.App, {
        // Merchants
        editMerchant,
        deleteMerchant,
        saveMerchant,
        
        // Machines
        editMachine,
        deleteMachine,
        saveMachine,
        autoFillMerchantData,
        
        // Transfers
        editTransfer,
        deleteTransfer,
        saveTransfer,
        
        // Collections
        editCollection,
        deleteCollection,
        saveCollection,
        
        // Requests
        convertRequest,
        deleteRequest,
        
        // Archive
        deleteArchive,
        
        // Utilities
        handleMerchantLookup,
        openScannerForInput,
        
        // Database Explorer
        selectTable,
        refreshSelectedTable
    });
}

// ============================================================
// AUTHENTICATION SYSTEM WITH SOUNDS 🔐🎵
// ============================================================

/**
 * Perform user login with sound effects
 */
async function performLogin() {
    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');
    const password = passwordInput?.value?.trim();

    if (!password) {
        showWarning('⚠️ يرجى إدخال كلمة المرور');
        shakeElement(passwordInput);
        
        // Play warning sound
        playSound('scan');
        return;
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...';
    setLoading(true);

    try {
        const data = await rpcCall('check_admin_login', { p_password: password });

        if (data && data.success) {
            localStorage.setItem('axentro_auth', JSON.stringify({
                loggedIn: true,
                timestamp: Date.now(),
                sessionExpiry: Date.now() + CONFIG.SESSION_DURATION
            }));

            // ✅ Play success sound on successful login
            playSound('loginSuccess');
            
            showSuccess('🎉 مرحباً بك في النظام!');
            
            await logLoginAttempt(true, 'تم تسجيل الدخول بنجاح');

            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('appContainer').style.display = 'flex';

            await refreshAllData();
        } else {
            // ❌ Play error sound on failed login
            playSound('loginError');
            
            showError(data?.message || '❌ كلمة المرور غير صحيحة');
            passwordInput.value = '';
            passwordInput.focus();
            
            await logLoginAttempt(false, 'محاولة فاشلة');
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        
        // ❌ Play error sound on exception
        playSound('loginError');
        
        showError('❌ ' + error.message);
    } finally {
        setLoading(false);
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> تسجيل الدخول';
    }
}

/**
 * Handle Enter key press on login form
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleLoginKeypress(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        performLogin();
    }
}

/**
 * Toggle password visibility
 */
function togglePassword() {
    const input = document.getElementById('passwordInput');
    const icon = document.getElementById('togglePasswordIcon');
    if (!input || !icon) return;

    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
    
    // Play subtle click sound
    playSound('scan');
    
    setTimeout(() => input.focus(), 100);
}

/**
 * Check if user has valid session
 * @returns {boolean}
 */
function checkSession() {
    const authData = localStorage.getItem('axentro_auth');
    if (!authData) return false;

    try {
        const { loggedIn, sessionExpiry } = JSON.parse(authData);
        if (loggedIn && Date.now() < sessionExpiry) return true;
    } catch (e) {}

    localStorage.removeItem('axentro_auth');
    return false;
}

/**
 * Confirm and perform logout with sound effect
 */
function confirmLogout() {
    showConfirm(
        'هل تريد تسجيل الخروج من النظام؟',
        async () => {
            localStorage.removeItem('axentro_auth');
            
            // ✅ Play logout success sound
            playSound('logoutSuccess');
            
            showSuccess('👋 تم تسجيل الخروج بنجاح');
            
            await logAction('تسجيل خروج', '-', 'تم تسجيل الخروج');
            
            setTimeout(() => location.reload(), 500);
        },
        'نعم، سجل خروجي'
    );
}

// ============================================================
// DATA OPERATIONS WITH SOUNDS 💾🎵
// ============================================================

/**
 * Refresh all data from database with success sound
 */
async function refreshAllData() {
    setLoading(true);
    setConnectionStatus('connecting');

    try {
        // Fetch all data in parallel
        const [
            mRes, macRes, tRes, cRes, rRes, aRes
        ] = await Promise.all([
            import('../services/merchantService.js').then(m => m.getAllMerchants()),
            import('../services/machineService.js').then(m => m.getAllMachines()),
            import('../services/transactionService.js').then(t => t.getAllTransfers()),
            import('../services/collectionService.js').then(c => c.getAllCollections()),
            import('../services/requestService.js').then(r => r.getAllRequests()),
            import('../services/archiveService.js').then(a => a.getAllArchives())
        ]);

        // Update state
        setMerchants(mRes);
        setMachines(macRes);
        setTransfers(tRes);
        setCollections(cRes);
        setRequests(rRes);
        setArchives(aRes);

        // Render all pages
        renderAllPages();
        updatePendingBadge();
        
        setConnectionStatus('live');
        
        // ✅ Play done sound on successful data refresh
        playSound('done');
        
        showSuccess('✅ تم تحديث البيانات بنجاح');
        
    } catch (error) {
        console.error('❌ Data refresh error:', error);
        setConnectionStatus('offline');
        
        // ❌ Play error sound on refresh failure
        playSound('loginError');
        
        showError('❌ فشل تحميل البيانات: ' + error.message);
    } finally {
        setLoading(false);
    }
}

/**
 * Render all pages with current data
 */
function renderAllPages() {
    renderDashboard();
    renderMerchants();
    renderMachines();
    renderTransfers();
    renderCollections();
    renderRequests();
    renderArchive();
}

// ============================================================
// PAGE NAVIGATION
// ============================================================

/**
 * Switch between pages/tabs
 * @param {string} pageName - Page identifier
 * @param {HTMLElement} element - Tab element clicked
 */
function switchPage(pageName, element) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Deactivate all tabs
    document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));

    // Activate selected page
    const page = document.getElementById('page-' + pageName);
    if (page) page.classList.add('active');
    
    // Activate selected tab
    if (element) element.classList.add('active');
    
    // Auto-discover database when switching to database page
    if (pageName === 'database') {
        // Only discover if not already done
        const dbTables = document.getElementById('dbTablesList');
        if (dbTables && !dbTables.children.length) {
            discoverDatabase();
        }
    }
}

// ============================================================
// SEARCH & LOOKUP
// ============================================================

/**
 * Handle merchant lookup in search inputs
 * @param {string} query - Search query
 * @param {string} resultsListId - Results container ID
 * @param {string} hiddenInputId - Hidden input ID for storing selection
 */
function handleMerchantLookup(query, resultsListId, hiddenInputId) {
    const resultsEl = document.getElementById(resultsListId);
    const hiddenEl = document.getElementById(hiddenInputId);
    
    if (!resultsEl || !hiddenEl) return;

    if (!query || query.length < 1) {
        resultsEl.classList.remove('show');
        return;
    }

    const normalizedQuery = normalizeText(query);
    const results = getMerchants().filter(m =>
        normalizeText(m['اسم التاجر']).includes(normalizedQuery) ||
        m['رقم التاجر']?.toString().includes(query) ||
        normalizeText(m['اسم النشاط']).includes(normalizedQuery) ||
        m['رقم الحساب']?.includes(query)
    ).slice(0, 10);

    if (!results.length) {
        resultsEl.innerHTML = `
            <div class="no-result">
                <i class="fas fa-search"></i> لا توجد نتائج
            </div>
        `;
        resultsEl.classList.add('show');
        return;
    }

    resultsEl.innerHTML = results.map(m => `
        <div class="search-result-item" 
             onclick="window.App.selectMerchantResult('${m['رقم التاجر']}','${escapeHtml(m['اسم التاجر'])}','${resultsListId}','${hiddenInputId}')">
            <div>
                <strong>${m['اسم التاجر']}</strong>
                <small style="display:block;color:inherit;opacity:0.7;font-size:0.75rem;margin-top:2px;">
                    ${m['رقم التاجر']} - ${m['اسم النشاط']||'-'} - ${m['رقم الحساب']||'-'}
                </small>
            </div>
            <span class="result-code">${m['رقم التاجر']}</span>
        </div>
    `).join('');

    resultsEl.classList.add('show');
}

/**
 * Select merchant from lookup results
 * @param {string} id - Merchant ID
 * @param {string} name - Merchant name
 * @param {string} listId - Results list ID
 * @param {string} inputId - Input ID
 */
function selectMerchantResult(id, name, listId, inputId) {
    const input = document.querySelector('#' + listId.replace('_list','_search'));
    const hidden = document.getElementById(inputId);
    const list = document.getElementById(listId);

    if (input) input.value = name;
    if (hidden) hidden.value = id;
    if (list) list.classList.remove('show');
    
    // Play selection sound
    playSound('done');
    
    // Auto-fill machine form if applicable
    if (inputId === 'mc_merchant_id') {
        autoFillMerchantData(id);
    }
}

// Add to global App
window.App.selectMerchantResult = selectMerchantResult;

// ============================================================
// SCANNER FUNCTIONS WITH SOUNDS 📷🎵
// ============================================================

let scannerStream = null;
let flashState = false;
window.currentScannerInput = null;
let scannedValueTemp = '';

/**
 * Open scanner for specific input field
 * @param {string} inputId - Target input field ID
 */
function openScannerForInput(inputId) {
    window.currentScannerInput = inputId;
    
    const modal = document.getElementById('scannerModal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
    
    document.getElementById('scanResult').style.display = 'none';
    
    startCamera();
}

/**
 * Start camera stream
 */
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        
        scannerStream = stream;
        window.scannerStream = stream; // Store globally
        
        const video = document.getElementById('scannerVideo');
        video.srcObject = stream;
        video.play();
        
        flashState = false;
        updateFlashIcon();
        
        // Play camera start sound
        playSound('scan');
        
    } catch (err) {
        console.error('Camera error:', err);
        
        // Play error sound
        playSound('loginError');
        
        showError('❌ لا يمكن الوصول للكاميرا');
        closeScanner();
    }
}

/**
 * Stop camera stream
 */
function stopScanner() {
    if (scannerStream) {
        scannerStream.getTracks().forEach(track => track.stop());
        scannerStream = null;
        window.scannerStream = null;
    }
    
    const video = document.getElementById('scannerVideo');
    if (video) video.srcObject = null;
}

/**
 * Close scanner modal
 */
function closeScanner() {
    const modal = document.getElementById('scannerModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        stopScanner();
    }, 300);
}

/**
 * Toggle camera flash
 */
async function toggleFlash() {
    if (!scannerStream) return;
    
    try {
        const track = scannerStream.getVideoTracks()[0];
        
        if ('torch' in track.getSettings()) {
            await track.applyConstraints({
                advanced: [{ torch: !flashState }]
            });
            flashState = !flashState;
            updateFlashIcon();
            
            // Play toggle sound
            playSound('scan');
        } else {
            showWarning('⚠️ الفلاش غير مدعوم في هذا الجهاز');
        }
    } catch (err) {
        console.error('Flash error:', err);
        showError('❌ لا يمكن تشغيل الفلاش');
    }
}

/**
 * Update flash icon based on state
 */
function updateFlashIcon() {
    const icon = document.getElementById('flashIcon');
    if (icon) {
        icon.className = flashState ? 'fas fa-lightbulb' : 'fas fa-bolt';
    }
}

/**
 * Capture scan result (mock implementation)
 */
function captureScan() {
    const mockSerial = 'SN-' + Date.now().toString(36).toUpperCase();
    scannedValueTemp = mockSerial;
    
    document.getElementById('scannedValue').textContent = mockSerial;
    document.getElementById('scanResult').style.display = 'block';
    
    // ✅ Play scan success sound
    playSound('scan');
    
    showSuccess('📸 تم المسح بنجاح!');
}

/**
 * Use scanned value in target input
 */
function useScannedValue() {
    if (window.currentScannerInput && scannedValueTemp) {
        const input = document.getElementById(window.currentScannerInput);
        if (input) {
            input.value = scannedValueTemp;
            input.dispatchEvent(new Event('input'));
        }
        closeScanner();
        
        // ✅ Play done sound
        playSound('done');
        
        showSuccess('✅ تم استخدام الرقم المسوح');
    }
}

// ============================================================
// EXPORT TO EXCEL WITH SOUND 📊🎵
// ============================================================

/**
 * Export current data to Excel file
 */
function exportToExcel() {
    try {
        const XLSX = window.XLSX; // From CDN
        const wb = XLSX.utils.book_new();

        /**
         * Add worksheet helper
         * @param {string} name - Sheet name
         * @param {Array} data - Data array
         * @param {Function} mapper - Row mapping function
         */
        const addSheet = (name, data, mapper) => {
            if (!data.length) return;
            const wsData = data.map(mapper);
            const ws = XLSX.utils.json_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, name);
        };

        // Merchants sheet
        addSheet('التجار', getMerchants(), (m, i) => ({ 
            '#': i+1, 
            'رقم التاجر': m['رقم التاجر'], 
            'الاسم': m['اسم التاجر'], 
            'النشاط': m['اسم النشاط'], 
            'الحساب': m['رقم الحساب'], 
            'الهاتف': m['رقم الهاتف'], 
            'العنوان': m['العنوان'], 
            'المنطقة': m['المنطقة'], 
            'الحالة': m['الحالة'] 
        }));
        
        // Machines sheet
        addSheet('المكن', getMachines(), (m, i) => ({ 
            '#': i+1, 
            'رقم المكنة': m['رقم المكنة'], 
            'التاجر': m['اسم التاجر'], 
            'النشاط': m['اسم النشاط'], 
            'التسلسلي': m['الرقم التسلسلي'], 
            'التارجت': m['التارجت الشهري'], 
            'الحالة': m['الحالة'] 
        }));
        
        // Transfers sheet
        addSheet('التحويلات', getTransfers(), (t, i) => ({ 
            '#': i+1, 
            'المرجعي': t['الرقم المرجعي'], 
            'التاريخ': t['التاريخ'], 
            'التاجر': t['اسم التاجر'], 
            'النوع': t['نوع التحويل'], 
            'القيمة': t['قيمة التحويل'] 
        }));
        
        // Collections sheet
        addSheet('التحصيلات', getCollections(), (c, i) => ({ 
            '#': i+1, 
            'المرجعي': c['الرقم المرجعي'], 
            'التاريخ': c['التاريخ'], 
            'التاجر': c['اسم التاجر'], 
            'القيمة': c['قيمة التحصيل'], 
            'النوع': c['نوع التحصيل'], 
            'المتبقي': c['المتبقي بعد التحصيل'] 
        }));

        // Generate filename with date
        const filename = `Axentro_Report_${new Date().toISOString().slice(0,10)}.xlsx`;
        
        XLSX.writeFile(wb, filename);
        
        // ✅ Play done sound on successful export
        playSound('done');
        
        showSuccess('✅ تم التصدير بنجاح');
        
    } catch (error) {
        console.error('Export error:', error);
        
        // ❌ Play error sound on export failure
        playSound('loginError');
        
        showError('❌ فشل التصدير: ' + error.message);
    }
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

/**
 * Handle global keyboard shortcuts
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleKeyboardShortcuts(e) {
    // Escape to close modals
    if (e.key === 'Escape') {
        closeMainModal();
        closeConfirm();
        closeScanner();
    }
    
    // Prevent Ctrl+S default behavior
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        showWarning('💡 استخدم أزرار النظام للحفظ');
    }
}

// ============================================================
// LOADING & CONNECTION STATUS HELPERS
// ============================================================

/**
 * Show/hide loading overlay
 * @param {boolean} show - Show loading state
 */
export function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay?.classList.toggle('hidden', !show);
}

/**
 * Set connection status indicator
 * @param {string} status - Status ('live', 'offline', 'connecting')
 */
export function setConnectionStatusUI(status) {
    const el = document.getElementById('connectionStatus');
    if (!el) return;
    
    el.className = 'conn-status ' + status;
    
    const statusTexts = {
        live: 'متصل',
        offline: 'غير متصل',
        connecting: 'جاري الاتصال...'
    };
    
    el.querySelector('span').textContent = statusTexts[status] || status;
    
    // Update database page status
    const dbStatusEl = document.getElementById('dbStatusText');
    if (dbStatusEl) {
        const badgeClasses = {
            live: 'success',
            offline: 'danger',
            connecting: 'warning'
        };
        
        dbStatusEl.textContent = statusTexts[status];
        dbStatusEl.className = `badge badge-${badgeClasses[status] || 'warning'}`;
    }
}

// Override setConnectionStatus from state manager to also update UI
const originalSetConnectionStatus = setConnectionStatus;
setConnectionStatus = (status) => {
    originalSetConnectionStatus(status);
    setConnectionStatusUI(status);
};

// ============================================================
// APPLICATION BOOTSTRAP 🚀
// ============================================================

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);

// Console branding with sound system indicator
console.log('%c🎉 Axentro System v3.0 Professional Edition', 'color:#2563eb;font-size:18px;font-weight:bold;');
console.log('%c⚡ Developed by Axentro Team | © 2024', 'color:#64748b;font-size:12px;');
console.log('%c🔊 Sound System: ENABLED ✅', 'color:#10b981;font-size:14px;font-weight:bold;');
