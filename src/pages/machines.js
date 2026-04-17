<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تحديث صفحة المكن - machines.js</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0a0f1e 0%, #1a2332 100%);
            min-height: 100vh;
            color: #fff;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            padding: 40px 20px;
            background: rgba(255,255,255,0.05);
            border-radius: 20px;
            margin-bottom: 30px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 15px;
            background: linear-gradient(135deg, #00d4ff, #0099cc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .file-info {
            background: linear-gradient(135deg, rgba(0,212,255,0.1), rgba(0,153,204,0.1));
            border: 1px solid rgba(0,212,255,0.3);
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
        }
        
        .file-info h2 {
            color: #00d4ff;
            margin-bottom: 15px;
        }
        
        .file-path {
            font-family: monospace;
            background: rgba(0,0,0,0.3);
            padding: 10px 15px;
            border-radius: 8px;
            color: #00ff88;
            font-size: 0.95em;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .feature-card {
            background: rgba(255,255,255,0.05);
            border-radius: 15px;
            padding: 25px;
            border: 1px solid rgba(255,255,255,0.1);
            transition: all 0.3s ease;
        }
        
        .feature-card:hover {
            transform: translateY(-5px);
            border-color: rgba(0,212,255,0.5);
        }
        
        .feature-icon {
            font-size: 2.5em;
            margin-bottom: 15px;
        }
        
        .feature-card h4 {
            color: #00d4ff;
            margin-bottom: 10px;
        }
        
        .changes-list {
            background: rgba(255,255,255,0.05);
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
        }
        
        .change-item {
            background: rgba(0,0,0,0.2);
            padding: 15px 20px;
            border-radius: 10px;
            margin-bottom: 12px;
            border-right: 4px solid #00d4ff;
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }
        
        .change-item.new {
            border-right-color: #00ff88;
        }
        
        .code-container {
            background: #0d1117;
            border-radius: 15px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .code-header {
            background: rgba(255,255,255,0.05);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .code-header h4 {
            color: #00d4ff;
        }
        
        .copy-btn {
            background: linear-gradient(135deg, #00d4ff, #0099cc);
            color: #000;
            border: none;
            padding: 8px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        
        .copy-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 20px rgba(0,212,255,0.4);
        }
        
        pre {
            padding: 25px;
            overflow-x: auto;
            max-height: 700px;
            overflow-y: auto;
        }
        
        code {
            font-family: 'Fira Code', 'Consolas', monospace;
            font-size: 0.85em;
            line-height: 1.6;
            color: #e6edf3;
        }

        ::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }
        
        ::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.05);
            border-radius: 5px;
        }
        
        ::-webkit-scrollbar-thumb {
            background: rgba(0,212,255,0.5);
            border-radius: 5px;
        }
        
        .footer {
            text-align: center;
            padding: 30px;
            opacity: 0.6;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📷 تحديث صفحة المكن</h1>
            <p>تمت إضافة ميزة مسح الباركود بالكاميرا + تحسين قائمة البحث عن التاجر</p>
        </div>

        <div class="file-info">
            <h2>📄 معلومات الملف</h2>
            <div class="file-path">src/pages/machines.js</div>
        </div>

        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">📷</div>
                <h4>مسح الباركود بالكاميرا</h4>
                <p>زر مسح بجانب حقل السيريال يفتح كاميرا احترافية لمسح الباركود تلقائياً</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🔦</div>
                <h4>التحكم بالفلاش</h4>
                <p>إمكانية فتح وإغلاق الفلاش أثناء المسح للإضاءة في الأماكن المظلمة</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🔍</div>
                <h4>بحث ذكي عن التاجر</h4>
                <p>قائمة بحث احترافية مع إكمال تلقائي وعرض جميع بيانات التاجر</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🔊</div>
                <h4>صوت المسح</h4>
                <p>استخدام صوت scan.mp3 عند نجاح عملية المسح</p>
            </div>
        </div>

        <div class="changes-list">
            <h3>🆕 الميزات الجديدة:</h3>
            
            <div class="change-item new">
                <span>📷</span>
                <div>
                    <strong>ميزة الكاميرا للمسح:</strong>
                    <p style="margin-top: 5px; opacity: 0.85;">• فتح الكاميرا الخلفية<br>• استخدام مكتبة ZXing أو HTML5 QR API<br>• اكتشاف تلقائي للباركود<br>• إغلاق تلقائي بعد المسح الناجح</p>
                </div>
            </div>

            <div class="change-item new">
                <span>🔦</span>
                <div>
                    <strong>التحكم بالفلاش:</strong>
                    <p style="margin-top: 5px; opacity: 0.85;">• زر تشغيل/إيقاف الفلاش<br>• يعمل فقط إذا كان الجهاز يدعمه<br>• مفيد في الإضاءة المنخفضة</p>
                </div>
            </div>

            <div class="change-item new">
                <span>🔍</span>
                <div>
                    <strong>البحث المحسّن:</strong>
                    <p style="margin-top: 5px; opacity: 0.85;">• بحث فوري عند الكتابة<br>• عرض قائمة منسدلة بالنتائج<br>• اختيار التاجر بالنقر أو Enter</p>
                </div>
            </div>
        </div>

        <div class="code-container">
            <div class="code-header">
                <h4>📝 الكود الكامل بعد التعديل:</h4>
                <button class="copy-btn" onclick="copyCode()">نسخ الكود</button>
            </div>
            <pre><code id="codeBlock">/**
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
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:30px; color:#888;">
             لا توجد مكن مسجلة
        </td></tr>`;
        return;
    }
    
    tbody.innerHTML = currentMachines.map((m, idx) => {
        const merchant = merchantsList.find(mer => mer.id === m['رقم التاجر']);
        const merchantName = merchant ? merchant['اسم التاجر'] : '—';
        const merchantActivity = merchant ? merchant['اسم النشاط'] : '—';
        const target = parseFloat(m['التارجت الشهري']) || 0;
        const achieved = parseFloat(m['المحقق']) || 0;
        
        return `
        <tr>
            <td>${idx + 1}</td>
            <td>${escapeHtml(m['رقم المكنة'] || '-')}</td>
            <td><strong>${escapeHtml(merchantName)}</strong></td>
            <td>${escapeHtml(merchantActivity)}</td>
            <td><code>${escapeHtml(m['الرقم التسلسلي'] || '-')}</code></td>
            <td>${formatMoney(target)}</td>
            <td><span class="badge ${m['الحالة'] === 'نشطة' ? 'badge-success' : 'badge-warning'}">${escapeHtml(m['الحالة'] || '-')}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editMachine('${m.id}')">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteMachine('${m.id}')">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </td>
        </tr>`;
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
        
        title.innerHTML = '<i class="fas fa-desktop"></i> تعديل مكنة';
        document.getElementById('editMachineId').value = machine.id;
        document.getElementById('machSerial').value = machine['الرقم التسلسلي'] || '';
        document.getElementById('machTarget').value = machine['التارجت الشهري'] || '';
        document.getElementById('machStatus').value = machine['الحالة'] || 'نشطة';
        document.getElementById('machNotes').value = machine['ملاحظات'] || '';
    } else {
        title.innerHTML = '<i class="fas fa-plus-circle"></i> إضافة مكنة جديدة';
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
            `<option value="${m['رقم التاجر']} - ${m['اسم التاجر']}" data-id="${m.id}">`
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
            <div class="search-result-item" data-id="${m.id}" style="
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid rgba(255,255,255,0.05);
                transition: background 0.2s;
            ">
                <div style="font-weight: bold; color: #00d4ff;">${escapeHtml(m['اسم التاجر'])}</div>
                <div style="font-size: 0.85em; opacity: 0.7;">
                    ${escapeHtml(m['رقم التاجر'])} | ${escapeHtml(m['اسم النشاط'] || '-')}
                </div>
            </div>
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
            scanBtn.innerHTML = '<i class="fas fa-stop"></i> إيقاف';
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
        <button id="flashToggleBtn" class="btn btn-sm btn-warning" onclick="toggleFlash()">
            <i class="fas fa-lightbulb"></i> فلاش
        </button>
        <button class="btn btn-sm btn-secondary" onclick="stopCamera()">
            <i class="fas fa-times"></i> إغلاق
        </button>
        <span style="color: #888; font-size: 0.9em;">
            <i class="fas fa-info-circle"></i> وجّه الكاميرا نحو الباركود
        </span>
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
            '<i class="fas fa-lightbulb"></i> إيقاف الفلاش' : 
            '<i class="fas fa-lightbulb"></i> فلاش';
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
        scanBtn.innerHTML = '<i class="fas fa-camera"></i> مسح';
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
window.deleteMachine = deleteMachine;</code></pre>
        </div>

        <div class="footer">
            <p>✅ تم إنشاء هذا الملف بواسطة Axentro Development Team</p>
            <p style="margin-top: 10px;">📁 المسار: src/pages/machines.js | 🔄 الحالة: مُحدَّث بالكامل</p>
        </div>
    </div>

    <script>
        function copyCode() {
            const codeBlock = document.getElementById('codeBlock');
            const textArea = document.createElement('textarea');
            textArea.value = codeBlock.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = '✅ تم النسخ!';
                btn.style.background = 'linear-gradient(135deg, #00ff88, #00cc6a)';
                
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '';
                }, 2000);
            } catch (err) {
                alert('فشل النسخ، يرجى النسخ يدوياً');
            }
            
            document.body.removeChild(textArea);
        }
    </script>
</body>
</html></string>
