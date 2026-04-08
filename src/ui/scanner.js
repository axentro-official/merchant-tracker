/**
 * ============================================================
 * Professional Barcode/QR Scanner Component v5.0
 * ============================================================
 * 
 * Features:
 * - Advanced camera integration with flash control
 * - Professional scanning animation with laser line
 * - Auto-detection of barcodes and QR codes
 * - Manual fallback entry option
 * - Sound feedback on successful scan
 * - Error handling for camera permissions
 * - Support for multiple input targets
 * - Responsive design for mobile/desktop
 * 
 * Dependencies:
 * - HTML5 getUserMedia API
 * - Optional: ZXing or QuaggaJS library for barcode detection
 * 
 * @version 5.0.0
 * @author Axentro Team
 */

// ============================================================
// SCANNER CONFIGURATION
// ============================================================

const ScannerConfig = {
    // Camera settings
    CAMERA_FACING: 'environment', // 'environment' for back camera, 'user' for front
    VIDEO_WIDTH: { ideal: 1280 },
    VIDEO_HEIGHT: { ideal: 720 },
    
    // Scanning settings
    SCAN_INTERVAL: 500, // ms between scan attempts
    SCAN_TIMEOUT: 30000, // 30 seconds max scanning time
    
    // Animation settings
    LASER_SPEED: 2000, // ms for one complete scan cycle
    OVERLAY_OPACITY: 0.5,
    
    // Sound settings
    PLAY_SCAN_SOUND: true,
    PLAY_SUCCESS_SOUND: true,
    PLAY_ERROR_SOUND: true
};

// ============================================================
// SCANNER CLASS
// ============================================================

const Scanner = {
    // State variables
    videoStream: null,
    videoElement: null,
    canvasElement: null,
    canvasContext: null,
    scanningActive: false,
    flashEnabled: false,
    targetInputId: null,
    targetCallback: null,
    scanIntervalId: null,
    timeoutId: null,
    lastScanTime: 0,
    
    // Track reference for flash control
    videoTrack: null,
    
    /**
     * Initialize scanner component
     * Should be called once when page loads
     */
    init() {
        console.log('📷 Initializing Scanner component...');
        
        // Cache DOM elements
        this.videoElement = document.getElementById('scannerVideo');
        this.canvasElement = document.createElement('canvas');
        this.canvasContext = this.canvasElement.getContext('2d', { willReadFrequently: true });
        
        // Hide canvas (used for processing only)
        this.canvasElement.style.display = 'none';
        document.body.appendChild(this.canvasElement);
        
        console.log('✅ Scanner initialized successfully');
    },
    
    /**
     * Open scanner for machine serial number input
     * This is the main method called from the machine form
     */
    async openForMachine() {
        console.log('🔧 Opening scanner for machine serial...');
        this.targetInputId = 'machineSerial';
        this.targetCallback = null;
        await this.startScanning();
    },
    
    /**
     * Open scanner with custom callback
     * @param {Function} callback - Function to call with scanned code
     * @param {string} [inputId] - Optional input field to fill
     */
    async openWithCallback(callback, inputId = null) {
        console.log('📷 Opening scanner with callback...');
        this.targetCallback = callback;
        this.targetInputId = inputId;
        await this.startScanning();
    },
    
    /**
     * Start the scanning process
     * Opens modal, requests camera permission, starts video stream
     */
    async startScanning() {
        try {
            // Show scanner modal
            UI.showModal('scannerModal');
            
            // Update button states
            this.updateFlashButton(false);
            
            // Request camera access
            console.log('🎥 Requesting camera access...');
            
            const constraints = {
                video: {
                    facingMode: ScannerConfig.CAMERA_FACING,
                    width: ScannerConfig.VIDEO_WIDTH,
                    height: ScannerConfig.VIDEO_HEIGHT
                },
                audio: false
            };
            
            this.videoStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Store track reference for flash control
            const tracks = this.videoStream.getVideoTracks();
            if (tracks.length > 0) {
                this.videoTrack = tracks[0];
            }
            
            // Attach stream to video element
            if (this.videoElement) {
                this.videoElement.srcObject = this.videoStream;
                await this.videoElement.play();
                
                // Set canvas size to match video
                this.videoElement.onloadedmetadata = () => {
                    this.canvasElement.width = this.videoElement.videoWidth;
                    this.canvasElement.height = this.videoElement.videoHeight;
                };
            }
            
            this.scanningActive = true;
            
            // Play scan start sound
            if (ScannerConfig.PLAY_SCAN_SOUND && window.Sound) {
                Sound.play('scan');
            }
            
            // Start periodic scanning
            this.startPeriodicScan();
            
            // Set timeout for auto-close
            this.timeoutId = setTimeout(() => {
                if (this.scanningActive) {
                    console.log('⏱️ Scan timeout reached');
                    UI.showToast('تنبيه', 'انتهى وقت المسح، يمكنك إدخال الرقم يدوياً', 'warning');
                }
            }, ScannerConfig.SCAN_TIMEOUT);
            
            console.log('✅ Scanner started successfully');
            
        } catch (error) {
            console.error('❌ Camera error:', error);
            this.handleCameraError(error);
        }
    },
    
    /**
     * Handle camera access errors gracefully
     * @param {Error} error - The error object
     */
    handleCameraError(error) {
        let userMessage = 'لا يمكن الوصول إلى الكاميرا';
        
        switch(error.name) {
            case 'NotAllowedError':
            case 'PermissionDeniedError':
                userMessage = 'تم رفض إذن الوصول للكاميرا. يرجى السماح بالوصول في إعدادات المتصفح';
                break;
            case 'NotFoundError':
            case 'DevicesNotFoundError':
                userMessage = 'لم يتم العثور على كاميرا في هذا الجهاز';
                break;
            case 'NotReadableError':
            case 'TrackStartError':
                userMessage = 'الكاميرا مشغولة بتطبيق آخر';
                break;
            case 'OverconstrainedError':
                userMessage = 'الكاميرا لا تدعم الإعدادات المطلوبة';
                break;
            default:
                userMessage = `خطأ في الكاميرا: ${error.message}`;
        }
        
        UI.showToast('خطأ الكاميرا', userMessage, 'error');
        
        if (ScannerConfig.PLAY_ERROR_SOUND && window.Sound) {
            Sound.play('error');
        }
        
        // Don't close modal - let user enter manually
        console.warn('⚠️ Camera unavailable, manual entry mode');
    },
    
    /**
     * Start periodic scanning interval
     * Captures frames and attempts to detect barcodes/QR codes
     */
    startPeriodicScan() {
        if (this.scanIntervalId) {
            clearInterval(this.scanIntervalId);
        }
        
        this.scanIntervalId = setInterval(() => {
            if (this.scanningActive) {
                this.captureAndProcess();
            }
        }, ScannerConfig.SCAN_INTERVAL);
    },
    
    /**
     * Stop periodic scanning
     */
    stopPeriodicScan() {
        if (this.scanIntervalId) {
            clearInterval(this.scanIntervalId);
            this.scanIntervalId = null;
        }
    },
    
    /**
     * Capture current frame and process it
     * This is where barcode detection would happen
     * For now, simulates detection or waits for manual confirmation
     */
    async captureAndProcess() {
        if (!this.videoElement || !this.videoElement.videoWidth) return;
        
        const now = Date.now();
        if (now - this.lastScanTime < ScannerConfig.SCAN_INTERVAL) return;
        this.lastScanTime = now;
        
        try {
            // Draw current video frame to canvas
            this.canvasContext.drawImage(
                this.videoElement, 
                0, 0, 
                this.canvasElement.width, 
                this.canvasElement.height
            );
            
            // Get image data for processing
            const imageData = this.canvasContext.getImageData(
                0, 0, 
                this.canvasElement.width, 
                this.canvasElement.height
            );
            
            // Attempt barcode detection
            // Note: In production, integrate ZXing.js or QuaggaJS here
            const detectedCode = await this.detectBarcode(imageData);
            
            if (detectedCode) {
                this.onScanDetected(detectedCode);
            }
            
        } catch (error) {
            console.warn('Frame capture error:', error.message);
        }
    },
    
    /**
     * Detect barcode from image data
     * Placeholder for actual barcode detection library
     * @param {ImageData} imageData - Canvas image data
     * @returns {Promise<string|null>} Detected code or null
     */
    async detectBarcode(imageData) {
        // In production, integrate with:
        // - ZXing JavaScript library: https://github.com/zxing-js/library
        // - QuaggaJS: https://github.com/serratus/quaggajs
        
        // For demo purposes, return null (manual entry)
        // To enable auto-detection, uncomment below and add ZXing:
        
        /*
        try {
            const codeReader = new ZXing.BrowserMultiFormatReader();
            const result = await codeReader.decodeFromImageData(imageData);
            return result.getText();
        } catch (err) {
            // No barcode found in this frame
            return null;
        }
        */
        
        return null;
    },
    
    /**
     * Handle successful barcode/QR detection
     * @param {string} code - The detected code string
     */
    onScanDetected(code) {
        console.log('✅ Code detected:', code);
        
        // Validate code
        if (!code || code.trim() === '') {
            console.warn('Empty code detected, ignoring');
            return;
        }
        
        // Clean the code
        const cleanCode = code.trim().replace(/[^\w\-./]/g, '');
        
        // Fill target input if specified
        if (this.targetInputId) {
            const input = document.getElementById(this.targetInputId);
            if (input) {
                input.value = cleanCode;
                // Trigger input event for any listeners
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
        
        // Call callback if specified
        if (this.targetCallback && typeof this.targetCallback === 'function') {
            this.targetCallback(cleanCode);
        }
        
        // Play success sound
        if (ScannerConfig.PLAY_SUCCESS_SOUND && window.Sound) {
            Sound.play('success');
        }
        
        // Show success toast
        UI.showToast('تم المسح', `تم مسح الرقم: ${cleanCode}`, 'success');
        
        // Stop scanning and close modal
        this.stop();
        UI.closeModal('scannerModal');
    },
    
    /**
     * Manual code entry (fallback when auto-scan fails)
     * Shows prompt or uses existing input
     * @param {string} manualCode - Manually entered code
     */
    manualEntry(manualCode) {
        if (manualCode && manualCode.trim()) {
            this.onScanDetected(manualCode);
        }
    },
    
    /**
     * Toggle flashlight/torch on/off
     * Requires device support and browser permission
     */
    async toggleFlash() {
        if (!this.videoTrack) {
            console.warn('No video track available for flash control');
            return;
        }
        
        try {
            const capabilities = this.videoTrack.getCapabilities();
            
            // Check if torch is supported
            if (!('torch' in capabilities)) {
                UI.showToast('غير مدعوم', 'هذا الجهاز لا يدعم التحكم بالفلاش', 'warning');
                return;
            }
            
            // Toggle flash state
            this.flashEnabled = !this.flashEnabled;
            
            // Apply constraint
            await this.videoTrack.applyConstraints({
                advanced: [{ torch: this.flashEnabled }]
            });
            
            // Update UI
            this.updateFlashButton(this.flashEnabled);
            
            console.log(`💡 Flash ${this.flashEnabled ? 'ON' : 'OFF'}`);
            
        } catch (error) {
            console.error('Flash toggle error:', error);
            UI.showToast('خطأ الفلاش', 'لا يمكن التحكم بالفلاش: ' + error.message, 'error');
        }
    },
    
    /**
     * Update flash button visual state
     * @param {boolean} isOn - Whether flash is currently on
     */
    updateFlashButton(isOn) {
        const btn = document.getElementById('flashToggleBtn');
        if (!btn) return;
        
        if (isOn) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-bolt"></i> إيقاف الفلاش';
            btn.style.background = '#f59e0b';
            btn.style.borderColor = '#f59e0b';
            btn.style.color = '#000';
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fas fa-bolt"></i> فلاش';
            btn.style.background = '';
            btn.style.borderColor = '';
            btn.style.color = '';
        }
    },
    
    /**
     * Stop scanning completely
     * Releases camera resources, clears intervals
     */
    stop() {
        console.log('🛑 Stopping scanner...');
        
        // Clear intervals
        this.stopPeriodicScan();
        
        // Clear timeout
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        
        // Stop video tracks
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => {
                track.stop();
            });
            this.videoStream = null;
        }
        
        // Clear video element
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
        
        // Reset state
        this.scanningActive = false;
        this.flashEnabled = false;
        this.videoTrack = null;
        this.targetInputId = null;
        this.targetCallback = null;
        
        console.log('✅ Scanner stopped');
    },
    
    /**
     * Check if device camera is available
     * @returns {Promise<boolean>} True if camera available
     */
    async isCameraAvailable() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(device => device.kind === 'videoinput');
            return cameras.length > 0;
        } catch (error) {
            console.warn('Cannot check camera availability:', error);
            return false;
        }
    },
    
    /**
     * Get list of available cameras
     * @returns {Promise<Array>} Array of camera devices
     */
    async getAvailableCameras() {
        try {
            // Request permission first to get detailed device info
            await navigator.mediaDevices.getUserMedia({ video: true });
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices
                .filter(device => device.kind === 'videoinput')
                .map(device => ({
                    id: device.deviceId,
                    label: device.label || `Camera ${device.deviceId.slice(0, 8)}`
                }));
        } catch (error) {
            console.error('Error getting cameras:', error);
            return [];
        }
    },
    
    /**
     * Switch between cameras (front/back)
     * Useful for mobile devices
     */
    async switchCamera() {
        if (!this.scanningActive) {
            console.warn('Scanner not active, cannot switch camera');
            return;
        }
        
        const newFacing = ScannerConfig.CAMERA_FACING === 'environment' ? 'user' : 'environment';
        ScannerConfig.CAMERA_FACING = newFacing;
        
        // Restart scanner with new camera
        this.stop();
        await this.startScanning();
        
        UI.showToast('تغيير الكاميرا', `تم التبديل إلى الكاميرا ${newFacing === 'environment' ? 'الخلفية' : 'الأمامية'}`, 'info');
    },
    
    /**
     * Take snapshot (capture current frame as image)
     * Useful for debugging or saving scanned item photo
     * @returns {string|null} Base64 data URL of captured image
     */
    takeSnapshot() {
        if (!this.videoElement || !this.scanningActive) {
            return null;
        }
        
        try {
            this.canvasContext.drawImage(
                this.videoElement,
                0, 0,
                this.canvasElement.width,
                this.canvasElement.height
            );
            
            return this.canvasElement.toDataURL('image/png');
        } catch (error) {
            console.error('Snapshot error:', error);
            return null;
        }
    },
    
    /**
     * Cleanup resources when component is destroyed
     * Should be called on page unload
     */
    destroy() {
        this.stop();
        
        // Remove canvas element
        if (this.canvasElement && this.canvasElement.parentNode) {
            this.canvasElement.parentNode.removeChild(this.canvasElement);
        }
        
        console.log('🗑️ Scanner component destroyed');
    }
};

// ============================================================
// EXPORT
// ============================================================

export { Scanner };
export default Scanner;

// Make available globally for inline handlers
window.Scanner = Scanner;
