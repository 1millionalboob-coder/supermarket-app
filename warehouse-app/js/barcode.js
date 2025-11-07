// إدارة مسح الباركود والكاميرا
class BarcodeManager {
    constructor() {
        this.isScanning = false;
        this.currentMode = 'permission'; // 'permission' or 'inquiry'
        this.init();
    }

    init() {
        console.log('✅ تم تهيئة مدير الباركود');
    }

    // بدء مسح الباركود
    async startScanning(mode = 'permission') {
        this.currentMode = mode;
        
        if (this.isScanning) {
            console.log('⚠️ المسح جاري بالفعل');
            return;
        }

        console.log('📷 بدء مسح الباركود في وضع:', mode);

        // في بيئة حقيقية، هنا سيتم تفعيل الكاميرا
        // حالياً نستخدم prompt للمحاكاة
        
        try {
            this.isScanning = true;
            this.showScanningUI();
            
            const barcode = await this.showBarcodeInput();
            
            if (barcode) {
                await this.processScannedBarcode(barcode, mode);
            }
            
        } catch (error) {
            console.error('❌ خطأ في المسح:', error);
            this.showMessage('❌ خطأ في مسح الباركود', 'error');
        } finally {
            this.isScanning = false;
            this.hideScanningUI();
        }
    }

    // عرض واجهة إدخال الباركود (مؤقتة)
    showBarcodeInput() {
        return new Promise((resolve) => {
            const barcode = prompt('🔍 أدخل الباركود يدوياً أو امسحه:');
            resolve(barcode);
        });
    }

    // معالجة الباركود الممسوح
    async processScannedBarcode(barcode, mode) {
        if (!barcode.trim()) {
            this.showMessage('⚠️ يرجى إدخال باركود صحيح', 'warning');
            return;
        }

        console.log('🔍 معالجة الباركود:', barcode, 'الوضع:', mode);

        try {
            this.showLoading('جاري البحث...');
            
            const item = await googleSheets.findItemByBarcode(barcode);
            
            if (item) {
                if (mode === 'inquiry') {
                    this.handleInquiryResult(item);
                } else {
                    this.handlePermissionResult(item);
                }
            } else {
                if (mode === 'inquiry') {
                    this.showMessage('❌ الصنف غير موجود في قاعدة البيانات', 'error');
                } else {
                    this.showItemNotFoundModal(barcode);
                }
            }
        } catch (error) {
            console.error('❌ خطأ في معالجة الباركود:', error);
            this.showMessage('❌ خطأ في البحث عن الصنف', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // معالجة نتيجة الاستعلام
    handleInquiryResult(item) {
        console.log('💰 نتيجة الاستعلام:', item);
        
        // عرض النافذة المنبثقة للاستعلام
        if (window.permissionsManager) {
            permissionsManager.showInquiryModal(item);
        } else {
            this.showMessage(`💰 ${item.name}: ${item.price || 0} ج.م`, 'info');
        }
    }

    // معالجة نتيجة الإذن
    handlePermissionResult(item) {
        console.log('📦 نتيجة الإذن:', item);
        
        // إضافة الصنف إلى الإذن
        if (window.permissionsManager) {
            permissionsManager.addItemToPermission(item);
        } else {
            this.showMessage(`✅ تم العثور على: ${item.name}`, 'success');
        }
    }

    // عرض واجهة المسح (يمكن تخصيصها لاحقاً)
    showScanningUI() {
        console.log('🎥 عرض واجهة المسح...');
        // يمكن إضافة واجهة مسح مخصصة هنا
    }

    // إخفاء واجهة المسح
    hideScanningUI() {
        console.log('🎥 إخفاء واجهة المسح...');
        // إخفاء واجهة المسح المخصصة
    }

    // إظهار نافذة الصنف غير موجود
    showItemNotFoundModal(barcode) {
        if (window.permissionsManager) {
            permissionsManager.showItemNotFoundModal(barcode);
        } else {
            const addNew = confirm('❌ الصنف غير موجود. هل تريد إضافته؟');
            if (addNew) {
                const name = prompt('أدخل اسم الصنف الجديد:');
                if (name) {
                    this.addNewItem(barcode, name);
                }
            }
        }
    }

    // إضافة صنف جديد
    async addNewItem(barcode, name) {
        try {
            this.showLoading('جاري إضافة الصنف...');
            
            const newItem = {
                barcode: barcode,
                name: name,
                price: 0
            };

            // إضافة إلى القائمة إذا كان هناك مدير أذونات
            if (window.permissionsManager) {
                permissionsManager.addItemToPermission(newItem);
            }

            // محاولة إضافة إلى قاعدة البيانات
            try {
                await googleSheets.addItem(newItem);
                this.showMessage('✅ تم إضافة الصنف إلى القاعدة', 'success');
            } catch (error) {
                console.warn('⚠️ تم إضافة الصنف محلياً فقط:', error);
                this.showMessage('✅ تم إضافة الصنف محلياً', 'info');
            }
            
        } catch (error) {
            console.error('❌ خطأ في إضافة الصنف:', error);
            this.showMessage('❌ خطأ في إضافة الصنف', 'error');
        } finally {
            this.hideLoading();
        }
    }

    showLoading(message) {
        console.log('⏳ ' + message);
    }

    hideLoading() {
        // إخفاء التحميل
    }

    showMessage(message, type) {
        if (window.appManager && appManager.showMessage) {
            appManager.showMessage(message, type);
        } else {
            console.log(`📢 ${type}: ${message}`);
        }
    }

    // إيقاف المسح
    stopScanning() {
        this.isScanning = false;
        this.hideScanningUI();
        console.log('🛑 تم إيقاف المسح');
    }

    // التحقق من دعم الكاميرا
    checkCameraSupport() {
        return new Promise((resolve) => {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    }

    // تفعيل الكاميرا (للتطوير المستقبلي)
    async enableCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            return stream;
        } catch (error) {
            console.error('❌ خطأ في تفعيل الكاميرا:', error);
            throw error;
        }
    }
}

// إنشاء instance من المدير
const barcodeManager = new BarcodeManager();

// جعل الدوال متاحة globally
window.barcodeManager = barcodeManager;
window.startBarcodeScan = (mode) => barcodeManager.startScanning(mode);

console.log('✅ تم تحميل مدير الباركود بنجاح');