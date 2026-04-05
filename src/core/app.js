/**
 * Application Core
 * Main entry point and orchestration
 */

import { initSupabase, CONFIG } from '../config/supabase.js';
import { rpcCall, fetchAll } from '../services/dbService.js';
import { 
    getAllMerchants, getAllMachines 
} from '../services/merchantService.js';
import { 
    getAllMachines as getAllMachinesFromService 
} from '../services/machineService.js';
import { 
    setMerchants, setMachines, setTransfers, setCollections, 
    setRequests, setArchives, setLoading, setConnectionStatus,
    getMerchants, getMachines, getTransfers, getCollections, 
    getRequests, getArchives
} from '../ui/stateManager.js';
import { showToast, showSuccess, showError } from '../ui/toast.js';
import { initModals, showModal, showConfirm, closeConfirm } from '../ui/modals.js';
import { renderDashboard } from '../pages/dashboard.js';
import { renderMerchants, saveMerchant, editMerchant, deleteMerchant, openMerchantModal } from '../pages/merchants.js';
import { renderMachines, saveMachine, editMachine, deleteMachine, openMachineModal, autoFillMerchantData } from '../pages/machines.js';
import { formatDate, formatTime, formatTimeForDB, formatMoney, normalizeText, escapeHtml } from '../utils/formatters.js';
import { debounce, generateRefCode, getCurrentArabicMonth, getTodayDate, shakeElement } from '../utils/helpers.js';
import { validateRequired, validatePositiveNumber } from '../utils/validators.js';

// Global App namespace for cross-module access
window.App = {};

/**
 * Initialize application
 */
async function initializeApp() {
    console.log('🚀 Axentro System v3.0 Professional Initializing...');
    console.log('⚡ Developed by Axentro Team | © 2024');

    // Initialize Supabase connection
    if (!initSupabase()) {
        showError('❌ فشل تهيئة الاتصال بقاعدة البيانات');
        setLoading(false);
        return;
    }

    // Initialize UI components
    initModals();
    initEventListeners();

    // Check session
    if (checkSession()) {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
        await refreshAllData();
    } else {
        document.getElementById('loginSection').style.display = 'flex';
    }

    setLoading(false);

    // Auto-refresh every 5 minutes
    setInterval(async () => {
        if (checkSession() && document.getElementById('appContainer').style.display === 'flex') {
            await refreshAllData();
        }
    }, CONFIG.AUTO_REFRESH_INTERVAL);

    console.log('✅ Axentro System v3.0 Ready!');
}

/**
 * Initialize all event listeners
 */
function initEventListeners() {
    // Login section
    document.getElementById('loginBtn')?.addEventListener('click', performLogin);
    document.getElementById('passwordInput')?.addEventListener('keypress', handleLoginKeypress);
    document.getElementById('togglePasswordBtn')?.addEventListener('click', togglePassword);
    
    // Navbar actions
    document.getElementById('refreshDataBtn')?.addEventListener('click', refreshAllData);
    document.getElementById('exportExcelBtn')?.addEventListener('click', exportToExcel);
    document.getElementById('logoutBtn')?.addEventListener('click', confirmLogout);
    
    // Tab navigation
    document.querySelectorAll('.tab-link').forEach(tab => {
        tab.addEventListener('click', () => switchPage(tab.dataset.page, tab));
    });
    
    // Quick action buttons
    document.getElementById('quickTransferBtn')?.addEventListener('click', () => openTransferModal());
    document.getElementById('quickCollectionBtn')?.addEventListener('click', () => openCollectionModal());
    document.getElementById('quickMerchantBtn')?.addEventListener('click', () => openMerchantModal());
    document.getElementById('quickMachineBtn')?.addEventListener('click', () => openMachineModal());
    
    // Page-specific buttons
    document.getElementById('addMerchantBtn')?.addEventListener('click', () => openMerchantModal());
    document.getElementById('addMachineBtn')?.addEventListener('click', () => openMachineModal());
    document.getElementById('addTransferBtn')?.addEventListener('click', () => openTransferModal());
    document.getElementById('addCollectionBtn')?.addEventListener('click', () => openCollectionModal());
    document.getElementById('loadStatementBtn')?.addEventListener('click', loadStatement);
    document.getElementById('closeMonthBtn')?.addEventListener('click', confirmCloseMonth);
    document.getElementById('discoverDbBtn')?.addEventListener('click', discoverDatabase);
    document.getElementById('refreshTableBtn')?.addEventListener('click', refreshSelectedTable);
    
    // Search inputs with debounce
    document.getElementById('merchantSearch')?.addEventListener('input', 
        debounce((e) => handleSearch('merchant', e.target.value))
    );
    document.getElementById('machineSearch')?.addEventListener('input', 
        debounce((e) => handleSearch('machine', e.target.value))
    );
    document.getElementById('requestSearch')?.addEventListener('input', 
        debounce((e) => handleSearch('request', e.target.value))
    );
    
    // Filters
    document.getElementById('merchantStatusFilter')?.addEventListener('change', renderMerchants);
    document.getElementById('machineStatusFilter')?.addEventListener('change', renderMachines);
    document.getElementById('requestStatusFilter')?.addEventListener('change', renderRequests);
    document.getElementById('transferDateFrom')?.addEventListener('change', renderTransfers);
    document.getElementById('transferDateTo')?.addEventListener('change', renderTransfers);
    
    // Statement search
    document.getElementById('stmtMerchantSearch')?.addEventListener('input', 
        (e) => handleMerchantLookup(e.target.value, 'stmtResults', 'stmtMerchantId')
    );
    
    // Scanner buttons
    document.getElementById('toggleFlashBtn')?.addEventListener('click', toggleFlash);
    document.getElementById('captureScanBtn')?.addEventListener('click', captureScan);
    document.getElementById('useScannedValueBtn')?.addEventListener('click', useScannedValue);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Click outside to close search results
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            document.querySelectorAll('.search-results').forEach(el => {
                el.classList.remove('show');
            });
        }
    });

    // Expose global methods for inline handlers
    window.App = {
        editMerchant,
        deleteMerchant,
        saveMerchant,
        editMachine,
        deleteMachine,
        saveMachine,
        handleMerchantLookup,
        openScannerForInput,
        // More methods will be added in Part 2
    };
}

/**
 * Perform login
 */
async function performLogin() {
    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');
    const password = passwordInput?.value?.trim();

    if (!password) {
        showWarning('⚠️ يرجى إدخال كلمة المرور');
        shakeElement(passwordInput);
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

            showSuccess('🎉 مرحباً بك في النظام!
