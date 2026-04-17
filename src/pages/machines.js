/**
 * Machines Page
 * CRUD operations for machines - مطابق لستايل index.html
 * ✅ محدث: مع دعم الكاميرا والبحث الاحترافي في التجار
 */

import { showToast, showConfirm } from '../ui/toast.js';
import { escapeHtml, formatMoney } from '../utils/formatters.js';

let supabase = null;
let currentMachines = [];
let merchantsList = [];

// متغيرات الكاميرا
let cameraStream = null;
let scannerActive = false;

// تهيئة Supabase (باستخدام window.supabaseClient)
export function initMachinesPage() {
    supabase = window.supabaseaseClient || window.supabaseClient;
}

// تحميل المكن وعرضه
export async function loadMachines() {
    if (!supabase) return;
    
    try {
        const { data: machines, error } = await supabase
            .from('machines')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        currentMachines = machines || [];
        
        const { data: merchants } = await supabase
            .from('merchants')
            .select('id, "رقم التاجر", "اسم التاجر", "اسم النشاط", "رقم الحساب", "المنطقة", "العنوان"');
        merchantsList = merchants || [];
        
        renderMachinesTable();
    } catch (err) {
        console.error(err);
        showToast('خطأ في تحميل المكن', 'error');
    }
}

function renderMachinesTable() {
    const tbody = document.getElementById('machinesTableBody');
    if (!tbody) return;

    if (!currentMachines.length) {
        tbody.innerHTML = `
             لا توجد مكن مسجلة
        `;
        return;
    }
    
    tbody.innerHTML = currentMachines.map((m, idx) => {
        const merchant = merchantsList.find(mer => mer.id === m['رقم التاجر']);
        const merchantName = merchant ? merchant['اسم التاجر'] : '—';
        const merchantActivity = merchant ? merchant['اسم النشاط'] : '—';
        const target = parseFloat(m['التارجت الشهري']) || 0;
        const achieved = parseFloat(m['المحقق']) || 0;
        
        return `
        
            ${idx + 1}
            ${escapeHtml(m['رقم المكنة'] || '-')}
            ${escapeHtml(merchantName)}
            ${escapeHtml(merchantActivity)}
            ${escapeHtml(m['الرقم التسلسلي'] || '-')}
            ${formatMoney(target)}
            ${escapeHtml(m['الحالة'] || '-')}
            
                
                     تعديل
                
                
                     حذف
                
            
        `;
    }).join('');
}

// ============================================
// فتح نافذة إضافة/تعديل مكنة
// ============================================

export async function openMachineModal(machine = null) {
    // تحميل قائمة التجار إذا لم تكن محملة
    if (!merchantsList.length) {
        const { data } = await supabase.from('merchants').select(
            'id, "رقم التاجر", "اسم التاجر", "رقم الحساب", "اسم النشاط", "المنطقة", "العنوان"'
        );
        merchantsList = data || [];
    }
    
    const isEdit = !!machine;
    const modal = document.getElementById('machineModal');
    const title = document.getElementById('machineModalTitle');
    
    // 🔧 تحديث datalist للتجار (البحث الذكي)
    updateMerchantDatalist();
    
    // 🔧 تهيئة حدث البحث عن التاجر
    initMerchantSearch();
    
    // 🔧 تهيئة زر المسح الضوئي
    initScanButton();
    
    const searchInput = document.getElementById('machMerchantSearch');
    const hiddenId = document.getElementById('machMerchantId');
    
    if (isEdit && machine) {
        const merchant = merchantsList.find(m => m.id === machine['رقم التاجر']);
        if (merchant && searchInput) {
            searchInput.value = `${merchant['رقم التاجر']} - ${merchant['اسم التاجر']}`;
            if (hiddenId) hiddenId.value = merchant.id;
        }
        
        title.innerHTML = ' تعديل مكنة';
        document.getElementById('editMachineId').value = machine.id;
        document.getElementById('machSerial').value = machine['الرقم التسلسلي'] || '';
        document.getElementById('machTarget').value = machine['التارجت الشهري'] || '';
        document.getElementById('machStatus').value = machine['الحالة'] || 'نشطة';
        document.getElementById('machNotes').value = machine['ملاحظات'] || '';
    } else {
        title.innerHTML = ' إضافة مكنة جديدة';
        document.getElementById('editMachineId').value = '';
        if (searchInput) searchInput.value = '';
        if (hiddenId) hiddenId.value = '';
        document.getElementById('machSerial').value = '';
        document.getElementById('machTarget').value = '';
        document.getElementById('machStatus').value = 'نشطة';
        document.getElementById('machNotes').value = '';
    }
    
    modal.classList.add('show');
    if (window.Sound) window.Sound.play('click');
}

export function closeMachineModal() {
    // إغلاق الكاميرا إذا كانت مفتوحة
    stopCamera();
    document.getElementById('machineModal').classList.remove('show');
}

// ============================================
// 🔍 نظام البحث الذكي عن التاجر
// ============================================

function updateMerchantDatalist() {
    const datalist = document.getElementById('merchantDatalist');
    if (datalist) {
        datalist.innerHTML = merchantsList.map(m => 
            ``
        ).join('');
    }
}

function initMerchantSearch() {
    const searchInput = document.getElementById('machMerchantSearch');
    const hiddenId = document.getElementById('machMerchantId');
    const resultsDiv = document.getElementById('merchantSearchResults');
    
    if (!searchInput) return;
    
    // إزالة الأحداث القديمة
    const newInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newInput, searchInput);
    
    // إنشاء قائمة النتائج إذا لم تكن موجودة
    if (!resultsDiv) {
        const resultsContainer = document.createElement('div');
        resultsContainer.id = 'merchantSearchResults';
        resultsContainer.className = 'search-results-dropdown';
        resultsContainer.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #1a2332;
            border: 1px solid rgba(0,212,255,0.3);
            border-radius: 8px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        `;
        newInput.parentNode.style.position = 'relative';
        newInput.parentNode.appendChild(resultsContainer);
    }
    
    const results = document.getElementById('merchantSearchResults');
    
    // حدث الكتابة
    newInput.addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase().trim();
        
        if (query.length < 1) {
            results.style.display = 'none';
            if (hiddenId) hiddenId.value = '';
            return;
        }
        
        // البحث في قائمة التجار
        const filtered = merchantsList.filter(m => 
            m['رقم التاجر'].toLowerCase().includes(query) ||
            m['اسم التاجر'].toLowerCase().includes(query) ||
            (m['اسم النشاط'] && m['اسم النشاط'].toLowerCase().includes(query))
        );
        
        if (filtered.length === 0) {
            results.style.display = 'none';
            return;
        }
        
        results.innerHTML = filtered.map(m => `
            
                ${escapeHtml(m['اسم التاجر'])}
                
                    ${escapeHtml(m['رقم التاجر'])} | ${escapeHtml(m['اسم النشاط'] || '-')}
                
            
        `).join('');
        
        results.style.display = 'block';
        
        // إضافة أحداث النقر على النتائج
        results.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', function() {
                const id = this.dataset.id;
                const merchant = merchantsList.find(m => m.id == id);
                
                if (merchant) {
                    newInput.value = `${merchant['رقم التاجر']} - ${merchant['اسم التاجر']}`;
                    if (hiddenId) hiddenId.value = id;
                    results.style.display = 'none';
                    
                    // تأثير بصري
                    this.style.background = 'rgba(0,255,136,0.2)';
                    setTimeout(() => {
                        this.style.background = '';
                    }, 300);
                }
            });
            
            item.addEventListener('mouseenter', function() {
                this.style.background = 'rgba(0,212,255,0.1)';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.background = '';
            });
        });
    });
    
    // إغلاق القائمة عند النقر خارجها
    document.addEventListener('click', function(e) {
        if (!newInput.contains(e.target) && !results.contains(e.target)) {
            results.style.display = 'none';
        }
    });
}

// ============================================
// 📷 نظام الكاميرا والمسح الضوئي
// ============================================

function initScanButton() {
    const scanBtn = document.getElementById('scanSerialBtn');
    if (!scanBtn) return;
    
    // إزالة الأحداث القديمة
    const newBtn = scanBtn.cloneNode(true);
    scanBtn.parentNode.replaceChild(newBtn, scanBtn);
    
    newBtn.addEventListener('click', toggleScanner);
}

function toggleScanner() {
    if (scannerActive) {
        stopCamera();
    } else {
        startCamera();
    }
}

async function startCamera() {
    const videoContainer = document.getElementById('scannerVideoContainer');
    const scanBtn = document.getElementById('scanSerialBtn');
    
    if (!videoContainer) {
        showToast('حاوية الفيديو غير موجودة', 'error');
        return;
    }
    
    try {
        // طلب الوصول للكاميرا الخلفية
        const constraints = {
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };
        
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        const video = document.createElement('video');
        video.id = 'scannerVideo';
        video.style.cssText = `
            width: 100%;
            max-height: 300px;
            border-radius: 10px;
            background: #000;
        `;
        video.setAttribute('playsinline', '');
        video.setAttribute('autoplay', '');
        
        videoContainer.innerHTML = '';
        videoContainer.appendChild(video);
        videoContainer.style.display = 'block';
        
        video.srcObject = cameraStream;
        await video.play();
        
        scannerActive = true;
        
        // تغيير شكل الزر
        if (scanBtn) {
            scanBtn.innerHTML = ' إيقاف';
            scanBtn.classList.remove('btn-primary');
            scanBtn.classList.add('btn-danger');
        }
        
        // إظهار أزرار التحكم
        showScannerControls();
        
        // بدء المسح (باستخدام BarcodeDetector API إذا كانت متوفرة)
        if ('BarcodeDetector' in window) {
            startBarcodeDetection(video);
        } else {
            // استخدام طريقة بديلة (manual input hint)
            showToast('سيتم استخدام المسح اليدوي - الكاميرا مفتوحة للمعاينة', 'info');
        }
        
        // تشغيل صوت الفتح
        playSound('click');
        
    } catch (error) {
        console.error('خطأ في فتح الكاميرا:', error);
        showToast('خطأ في الوصول للكاميرا: ' + error.message, 'error');
    }
}

async function startBarcodeDetection(video) {
    try {
        const barcodeDetector = new BarcodeDetector({
            formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e']
        });
        
        const detectInterval = setInterval(async () => {
            if (!scannerActive) {
                clearInterval(detectInterval);
                return;
            }
            
            try {
                const barcodes = await barcodeDetector.detect(video);
                
                if (barcodes.length > 0) {
                    const scannedValue = barcodes[0].rawValue;
                    
                    // وضع القيمة في حقل السيريال
                    const serialInput = document.getElementById('machSerial');
                    if (serialInput) {
                        serialInput.value = scannedValue;
                        serialInput.dispatchEvent(new Event('input'));
                    }
                    
                    // تشغيل صوت النجاح
                    playSound('done');
                    
                    // إغلاق الكاميرا
                    stopCamera();
                    
                    showToast(`✅ تم مسح: ${scannedValue}`, 'success');
                    
                    clearInterval(detectInterval);
                }
            } catch (e) {
                console.warn('خطأ في كشف الباركود:', e);
            }
        }, 500); // فحص كل 500ms
        
    } catch (error) {
        console.warn('BarcodeDetector غير مدعوم:', error);
        showToast('المسح التلقائي غير مدعوم في هذا المتصفح', 'warning');
    }
}

function showScannerControls() {
    let controlsDiv = document.getElementById('scannerControls');
    
    if (!controlsDiv) {
        controlsDiv = document.createElement('div');
        controlsDiv.id = 'scannerControls';
        controlsDiv.style.cssText = `
            display: flex;
            gap: 10px;
            margin-top: 10px;
            align-items: center;
        `;
        
        const container = document.getElementById('scannerVideoContainer');
        if (container) {
            container.parentNode.insertBefore(controlsDiv, container.nextSibling);
        }
    }
    
    controlsDiv.innerHTML = `
        
             فلاش
        
        
             إغلاق
        
        
             وجّه الكاميرا نحو الباركود
        
    `;
    
    controlsDiv.style.display = 'flex';
}

window.toggleFlash = async function() {
    if (!cameraStream) return;
    
    const videoTrack = cameraStream.getVideoTracks()[0];
    if (!videoTrack) return;
    
    const capabilities = videoTrack.getCapabilities();
    
    if (!capabilities.torch) {
        showToast('الفلاش غير متوفر في هذا الجهاز', 'warning');
        return;
    }
    
    const currentTorch = videoTrack.getSettings().torch;
    await videoTrack.applyConstraints({
        advanced: [{ torch: !currentTorch }]
    });
    
    const flashBtn = document.getElementById('flashToggleBtn');
    if (flashBtn) {
        flashBtn.innerHTML = !currentTorch ? 
            ' إيقاف الفلاش' : 
            ' فلاش';
        flashBtn.classList.toggle('btn-success', !currentTorch);
        flashBtn.classList.toggle('btn-warning', currentTorch);
    }
};

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    scannerActive = false;
    
    // إخفاء الفيديو
    const videoContainer = document.getElementById('scannerVideoContainer');
    if (videoContainer) {
        videoContainer.style.display = 'none';
        videoContainer.innerHTML = '';
    }
    
    // إخفاء أزرار التحكم
    const controlsDiv = document.getElementById('scannerControls');
    if (controlsDiv) {
        controlsDiv.style.display = 'none';
    }
    
    // إعادة الزر للحالة الأصلية
    const scanBtn = document.getElementById('scanSerialBtn');
    if (scanBtn) {
        scanBtn.innerHTML = ' مسح';
        scanBtn.classList.remove('btn-danger');
        scanBtn.classList.add('btn-primary');
    }
}

function playSound(type) {
    try {
        if (window.Sound && typeof window.Sound.play === 'function') {
            window.Sound.play(type);
        } else {
            // تشغيل الصوت مباشرة
            const audioPath = `src/assets/${type}.mp3`;
            const audio = new Audio(audioPath);
            audio.volume = 0.7;
            audio.play().catch(() => {});
        }
    } catch (e) {
        console.warn('خطأ في تشغيل الصوت:', e);
    }
}

// ============================================
// حفظ المكنة (إضافة أو تعديل)
// ============================================

export async function saveMachine() {
    const id = document.getElementById('editMachineId').value;
    const merchantId = document.getElementById('machMerchantId').value;
    const serial = document.getElementById('machSerial').value.trim();
    const target = parseFloat(document.getElementById('machTarget').value) || 0;
    const status = document.getElementById('machStatus').value;
    const notes = document.getElementById('machNotes').value.trim();
    
    // التحقق من الحقول المطلوبة
    if (!merchantId) {
        showToast('يرجى اختيار التاجر من القائمة', 'warning');
        return;
    }
    
    if (!serial) {
        showToast('الرقم التسلسلي مطلوب', 'warning');
        document.getElementById('machSerial').focus();
        return;
    }
    
    const merchant = merchantsList.find(m => m.id == merchantId);
    if (!merchant) {
        showToast('التاجر غير موجود', 'error');
        return;
    }
    
    const machineData = {
        "رقم التاجر": merchantId,
        "اسم التاجر": merchant['اسم التاجر'],
        "رقم الحساب": merchant['رقم الحساب'],
        "اسم النشاط": merchant['اسم النشاط'],
        "المنطقة": merchant['المنطقة'] || '',
        "العنوان": merchant['العنوان'] || '',
        "الرقم التسلسلي": serial,
        "التارجت الشهري": target,
        "الحالة": status,
        "ملاحظات": notes
    };
    
    try {
        if (id) {
            const { error } = await supabase
                .from('machines')
                .update(machineData)
                .eq('id', id);
            if (error) throw error;
            showToast('تم تحديث المكنة بنجاح ✅', 'success');
        } else {
            const { error } = await supabase
                .from('machines')
                .insert([machineData]);
            if (error) throw error;
            showToast('تم إضافة المكنة بنجاح ✅', 'success');
        }
        
        playSound('success');
        closeMachineModal();
        await loadMachines();
        
        if (window.loadDashboardStats) window.loadDashboardStats();
        if (window.loadTopMachines) window.loadTopMachines();
        
    } catch (err) {
        console.error(err);
        showToast('حدث خطأ: ' + err.message, 'error');
        playSound('error');
    }
}

export async function editMachine(id) {
    const { data, error } = await supabase
        .from('machines')
        .select('*')
        .eq('id', id)
        .single();
        
    if (error) {
        showToast('خطأ في جلب البيانات', 'error');
        return;
    }
    
    openMachineModal(data);
}

export function deleteMachine(id) {
    showConfirm('هل تريد حذف هذه المكنة؟ ⚠️ لا يمكن التراجع عن هذا الإجراء!', async () => {
        try {
            const { error } = await supabase
                .from('machines')
                .delete()
                .eq('id', id);
            if (error) throw error;
            
            showToast('تم حذف المكنة بنجاح 🗑️', 'success');
            playSound('success');
            
            await loadMachines();
            if (window.loadDashboardStats) window.loadDashboardStats();
            if (window.loadTopMachines) window.loadTopMachines();
        } catch (err) {
            showToast('خطأ في الحذف: ' + err.message, 'error');
            playSound('error');
        }
    });
}

// ربط الدوال بالنافذة العامة
window.openMachineModal = openMachineModal;
window.closeMachineModal = closeMachineModal;
window.saveMachine = saveMachine;
window.editMachine = editMachine;
window.deleteMachine = deleteMachine;
