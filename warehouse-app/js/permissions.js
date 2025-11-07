// إدارة شاشة الأذونات والإضافات
class PermissionsManager {
    constructor() {
        this.permissionType = '';
        this.selectedItems = [];
        this.currentPermissionNumber = '';
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCurrentUser();
        console.log('✅ تم تهيئة مدير الأذونات');
    }

    setupEventListeners() {
        // إعداد مستمعي الأحداث للكمية
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quantity-decrease')) {
                const index = parseInt(e.target.closest('.item-card-3d').dataset.index);
                this.decreaseQuantity(index);
            } else if (e.target.classList.contains('quantity-increase')) {
                const index = parseInt(e.target.closest('.item-card-3d').dataset.index);
                this.increaseQuantity(index);
            } else if (e.target.classList.contains('remove-item')) {
                const index = parseInt(e.target.closest('.item-card-3d').dataset.index);
                this.removeItem(index);
            }
        });
    }

    loadCurrentUser() {
        this.currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
    }

    initialize(permissionType, user) {
        this.permissionType = permissionType;
        this.currentUser = user;
        this.currentPermissionNumber = this.generatePermissionNumber(permissionType);
        this.selectedItems = [];
        
        this.updatePermissionInfo();
        this.updateItemsDisplay();
        
        console.log('🎯 تم تهيئة المدير للإذن:', permissionType);
    }

    setPermissionType(type) {
        this.permissionType = type;
        this.currentPermissionNumber = this.generatePermissionNumber(type);
        this.updatePermissionInfo();
        console.log('📋 نوع الإذن المعين:', type);
    }

    generatePermissionNumber(permissionType) {
        const prefix = this.getPermissionPrefix(permissionType);
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}${timestamp}${random}`;
    }

    getPermissionPrefix(permissionType) {
        const prefixes = {
            'استلامات': 'R',
            'نقل من المخزن للفرع': 'TS',
            'نقل من الفرع للمخزن': 'TB',
            'اذن البيع': 'S',
            'استعلام': 'I'
        };
        return prefixes[permissionType] || 'X';
    }

    updatePermissionInfo() {
        // تحديث معلومات الإذن في الواجهة
        const numberElement = document.getElementById('permission-number');
        const typeElement = document.getElementById('permission-type');
        const userElement = document.getElementById('permission-user');
        const datetimeElement = document.getElementById('permission-datetime');
        const titleElement = document.getElementById('permission-title');

        if (numberElement) {
            numberElement.textContent = this.currentPermissionNumber;
        }

        if (typeElement) {
            typeElement.textContent = this.permissionType;
        }

        if (titleElement) {
            titleElement.textContent = this.permissionType;
        }

        if (userElement && this.currentUser) {
            userElement.textContent = this.currentUser.username || 'مستخدم';
        }

        if (datetimeElement) {
            const now = new Date();
            const dateTimeString = now.toLocaleString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            datetimeElement.textContent = dateTimeString;
        }
    }

    // دالة لبدء مسح الباركود
    async startBarcodeScan() {
        console.log('📷 بدء مسح الباركود...');
        
        if (this.permissionType === 'استعلام') {
            await this.handleInquiryScan();
        } else {
            await this.handlePermissionScan();
        }
    }

    async handlePermissionScan() {
        // في بيئة حقيقية، هنا سيتم تفعيل الكاميرا للمسح
        // حالياً سنستخدم prompt للمحاكاة
        const barcode = prompt('أدخل الباركود يدوياً أو امسحه:');
        
        if (barcode) {
            await this.handleBarcodeScan(barcode);
        }
    }

    async handleInquiryScan() {
        const barcode = prompt('أدخل الباركود للاستعلام عن السعر:');
        
        if (barcode) {
            await this.handleInquiryBarcode(barcode);
        }
    }

    async handleBarcodeScan(barcode) {
        if (!barcode.trim()) {
            this.showMessage('⚠️ يرجى إدخال باركود صحيح', 'warning');
            return;
        }

        console.log('🔍 معالجة الباركود:', barcode);

        try {
            this.showLoading('جاري البحث عن الصنف...');
            
            const item = await googleSheets.findItemByBarcode(barcode);
            
            if (item) {
                this.addItemToPermission(item);
                this.showMessage('✅ تم إضافة الصنف بنجاح', 'success');
            } else {
                this.showItemNotFoundModal(barcode);
            }
        } catch (error) {
            console.error('❌ خطأ في البحث:', error);
            this.showMessage('❌ خطأ في البحث عن الصنف', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleInquiryBarcode(barcode) {
        if (!barcode.trim()) {
            this.showMessage('⚠️ يرجى إدخال باركود صحيح', 'warning');
            return;
        }

        try {
            this.showLoading('جاري البحث عن السعر...');
            
            const item = await googleSheets.findItemByBarcode(barcode);
            
            if (item) {
                this.showInquiryModal(item);
            } else {
                this.showMessage('❌ الصنف غير موجود في قاعدة البيانات', 'error');
            }
        } catch (error) {
            console.error('❌ خطأ في الاستعلام:', error);
            this.showMessage('❌ خطأ في البحث عن السعر', 'error');
        } finally {
            this.hideLoading();
        }
    }

    addItemToPermission(item) {
        // التحقق من عدم تكرار الصنف
        const existingItemIndex = this.selectedItems.findIndex(i => i.barcode === item.barcode);
        
        if (existingItemIndex !== -1) {
            this.selectedItems[existingItemIndex].quantity++;
            this.showMessage('↗️ تم زيادة كمية الصنف', 'info');
        } else {
            this.selectedItems.push({
                ...item,
                quantity: 1,
                total: item.price || 0
            });
            this.showMessage('✅ تم إضافة الصنف', 'success');
        }

        this.updateItemsDisplay();
        this.calculateTotals();
        console.log('📦 الأصناف المحددة:', this.selectedItems);
    }

    updateItemsDisplay() {
        const emptyState = document.getElementById('empty-state');
        const itemsList = document.getElementById('items-list');
        const itemsContainer = document.getElementById('items-container');

        if (!emptyState || !itemsList || !itemsContainer) {
            console.error('❌ عناصر الواجهة غير موجودة');
            return;
        }

        if (this.selectedItems.length === 0) {
            emptyState.style.display = 'block';
            itemsList.style.display = 'none';
            return;
        }

        // إخفاء حالة عدم وجود أصناف وإظهار القائمة
        emptyState.style.display = 'none';
        itemsList.style.display = 'block';

        // تحديث قائمة الأصناف
        itemsContainer.innerHTML = this.selectedItems.map((item, index) => {
            const itemTotal = (item.price || 0) * (item.quantity || 1);
            const showPrice = this.permissionType === 'اذن البيع';
            
            return `
                <div class="item-card-3d" data-index="${index}">
                    <div class="item-info">
                        <div class="item-name">${item.name || 'بدون اسم'}</div>
                        <div class="item-details">
                            <span class="item-barcode">باركود: ${item.barcode || 'بدون'}</span>
                            ${showPrice ? `<span class="item-price">السعر: ${item.price || 0} ج.م</span>` : ''}
                            ${showPrice ? `<span class="item-total">المجموع: ${itemTotal} ج.م</span>` : ''}
                        </div>
                    </div>
                    <div class="item-controls">
                        <div class="quantity-controls">
                            <button class="quantity-btn quantity-decrease">-</button>
                            <input type="number" class="quantity-input" value="${item.quantity || 1}" 
                                   min="1" onchange="permissionsManager.updateQuantity(${index}, this.value)">
                            <button class="quantity-btn quantity-increase">+</button>
                        </div>
                        <button class="remove-btn-3d remove-item">🗑️ حذف</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateQuantity(index, newQuantity) {
        const quantity = parseInt(newQuantity) || 1;
        if (this.selectedItems[index] && quantity > 0) {
            this.selectedItems[index].quantity = quantity;
            this.calculateTotals();
            this.showMessage('📝 تم تحديث الكمية', 'info');
        }
    }

    increaseQuantity(index) {
        if (this.selectedItems[index]) {
            this.selectedItems[index].quantity++;
            this.updateItemsDisplay();
            this.calculateTotals();
            this.showMessage('↗️ تم زيادة الكمية', 'info');
        }
    }

    decreaseQuantity(index) {
        if (this.selectedItems[index] && this.selectedItems[index].quantity > 1) {
            this.selectedItems[index].quantity--;
            this.updateItemsDisplay();
            this.calculateTotals();
            this.showMessage('↙️ تم تقليل الكمية', 'info');
        }
    }

    removeItem(index) {
        if (this.selectedItems[index]) {
            const itemName = this.selectedItems[index].name;
            this.selectedItems.splice(index, 1);
            this.updateItemsDisplay();
            this.calculateTotals();
            this.showMessage(`🗑️ تم حذف ${itemName}`, 'info');
        }
    }

    calculateTotals() {
        if (this.permissionType === 'اذن البيع') {
            let grandTotal = 0;
            this.selectedItems.forEach(item => {
                item.total = (item.price || 0) * (item.quantity || 1);
                grandTotal += item.total;
            });
            
            // تحديث المجموع الكلي في الواجهة إذا كان هناك عنصر مخصص لذلك
            const totalElement = document.getElementById('grand-total');
            if (totalElement) {
                totalElement.textContent = `المجموع الكلي: ${grandTotal} ج.م`;
            }
        }
    }

    // ✅ دالة محسنة لحفظ الإذن - نظام مزدوج
    async savePermission() {
        if (this.selectedItems.length === 0) {
            this.showMessage('⚠️ يرجى إضافة أصناف أولاً', 'warning');
            return;
        }

        try {
            console.log('💾 بدء حفظ الإذن...');
            this.showLoading('جاري حفظ الإذن...');

            // ✅ إعداد بيانات الإذن حسب هيكل الأعمدة المحدد
            const permissionData = {
                number: this.currentPermissionNumber,
                type: this.permissionType,
                title: this.permissionType,
                user: this.currentUser?.username || 'مستخدم',
                dateTime: new Date().toLocaleString('ar-EG'),
                items: this.selectedItems.map(item => ({
                    barcode: item.barcode || '000000',
                    name: item.name || 'غير معروف',
                    quantity: item.quantity || 1,
                    price: item.price || 0
                })),
                status: 'pending', // pending, sent, failed
                syncTime: null,
                syncAttempts: 0
            };

            console.log('📤 بيانات الإذن المحضرة:', permissionData);

            // ✅ الخطوة 1: الحفظ المحلي فوراً
            const localSaveResult = this.savePermissionLocal(permissionData);
            
            if (localSaveResult) {
                this.showMessage('✅ تم حفظ الأذن محلياً', 'success');
                
                // ✅ الخطوة 2: محاولة الإرسال للسيرفر إذا كان هناك اتصال
                if (navigator.onLine) {
                    this.showMessage('🌐 جاري إرسال الأذن إلى السيرفر...', 'info');
                    const serverSaveResult = await this.sendPermissionToServer(permissionData);
                    
                    if (serverSaveResult) {
                        this.showMessage('✅ تم حفظ وإرسال الأذن بنجاح!', 'success');
                        // تحديث حالة الأذن المحلي إلى "مرسل"
                        this.updateLocalPermissionStatus(permissionData.number, 'sent');
                    } else {
                        this.showMessage('⚠️ تم الحفظ محلياً ولكن فشل الإرسال - سيتم إعادة المحاولة لاحقاً', 'warning');
                        // تحديث حالة الأذن المحلي إلى "فشل الإرسال"
                        this.updateLocalPermissionStatus(permissionData.number, 'failed');
                    }
                } else {
                    this.showMessage('📴 تم الحفظ محلياً - سيتم الإرسال عند الاتصال بالإنترنت', 'info');
                }
            } else {
                this.showMessage('❌ فشل حفظ الأذن محلياً', 'error');
                return;
            }
            
            // إعادة تعيين النموذج بعد الحفظ الناجح
            this.resetForm();
            
        } catch (error) {
            console.error('❌ خطأ في حفظ الإذن:', error);
            this.showMessage(`❌ خطأ في الحفظ: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    // ✅ دالة محسنة للحفظ المحلي
    savePermissionLocal(permissionData) {
        try {
            const permissions = JSON.parse(localStorage.getItem('pending_permissions') || '[]');
            
            // التأكد من عدم تكرار رقم الأذن
            const existingIndex = permissions.findIndex(p => p.number === permissionData.number);
            if (existingIndex !== -1) {
                permissions[existingIndex] = permissionData; // تحديث
            } else {
                permissions.push(permissionData); // إضافة جديدة
            }
            
            localStorage.setItem('pending_permissions', JSON.stringify(permissions));
            console.log('✅ تم الحفظ المحلي:', permissionData.number);
            return true;
        } catch (error) {
            console.error('❌ خطأ في الحفظ المحلي:', error);
            return false;
        }
    }

    // ✅ دالة محسنة للإرسال للسيرفر
    async sendPermissionToServer(permissionData) {
        try {
            console.log('🔄 محاولة إرسال الأذن للسيرفر:', permissionData.number);
            
            if (typeof googleSheets !== 'undefined' && typeof googleSheets.savePermission === 'function') {
                // تحديث عدد محاولات الإرسال
                permissionData.syncAttempts = (permissionData.syncAttempts || 0) + 1;
                permissionData.lastSyncAttempt = new Date().toISOString();
                
                const result = await googleSheets.savePermission(permissionData);
                
                if (result && result.success) {
                    console.log('✅ تم إرسال الأذن بنجاح:', permissionData.number);
                    
                    // تحديث وقت المزامنة
                    permissionData.syncTime = new Date().toISOString();
                    permissionData.status = 'sent';
                    
                    // تحديث البيانات المحلية
                    this.updateLocalPermissionStatus(permissionData.number, 'sent', permissionData.syncTime);
                    
                    return true;
                } else {
                    console.error('❌ فشل إرسال الأذن:', result?.error);
                    return false;
                }
            } else {
                console.error('❌ خدمة Google Sheets غير متاحة');
                return false;
            }
        } catch (error) {
            console.error('❌ خطأ في إرسال الأذن:', error);
            return false;
        }
    }

    // ✅ دالة تحديث حالة الأذن المحلي
    updateLocalPermissionStatus(permissionNumber, status, syncTime = null) {
        try {
            const permissions = JSON.parse(localStorage.getItem('pending_permissions') || '[]');
            const permissionIndex = permissions.findIndex(p => p.number === permissionNumber);
            
            if (permissionIndex !== -1) {
                permissions[permissionIndex].status = status;
                if (syncTime) {
                    permissions[permissionIndex].syncTime = syncTime;
                }
                localStorage.setItem('pending_permissions', JSON.stringify(permissions));
                console.log('✅ تم تحديث حالة الأذن:', permissionNumber, status);
            }
        } catch (error) {
            console.error('❌ خطأ في تحديث الحالة:', error);
        }
    }

    // ✅ دالة جديدة: مزامنة الأذون المعلقة
    async syncPendingPermissions() {
        if (!navigator.onLine) {
            console.log('📴 لا يوجد اتصال - لا يمكن المزامنة');
            return;
        }
        
        try {
            const permissions = JSON.parse(localStorage.getItem('pending_permissions') || '[]');
            const pendingPermissions = permissions.filter(p => p.status === 'pending' || p.status === 'failed');
            
            if (pendingPermissions.length === 0) {
                console.log('✅ لا توجد أذون معلقة للمزامنة');
                return;
            }
            
            console.log(`🔄 جاري مزامنة ${pendingPermissions.length} أذون معلقة...`);
            
            let successCount = 0;
            let failCount = 0;
            
            for (const permission of pendingPermissions) {
                // عدم إعادة محاولة الإرسال أكثر من 3 مرات
                if (permission.syncAttempts >= 3) {
                    console.log(`⏭️ تخطي الأذن ${permission.number} - تجاوز الحد الأقصى للمحاولات`);
                    failCount++;
                    continue;
                }
                
                const result = await this.sendPermissionToServer(permission);
                if (result) {
                    successCount++;
                } else {
                    failCount++;
                }
                
                // انتظار 1 ثانية بين كل إرسال لتجنب ازدحام السيرفر
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            console.log(`✅ إنتهت المزامنة: ${successCount} ناجح, ${failCount} فاشل`);
            
            if (successCount > 0) {
                this.showMessage(`✅ تم مزامنة ${successCount} أذن بنجاح`, 'success');
            }
            if (failCount > 0) {
                this.showMessage(`⚠️ فشل في مزامنة ${failCount} أذون - سيتم إعادة المحاولة لاحقاً`, 'warning');
            }
            
        } catch (error) {
            console.error('❌ خطأ في مزامنة الأذون المعلقة:', error);
        }
    }

    resetForm() {
        this.selectedItems = [];
        this.currentPermissionNumber = this.generatePermissionNumber(this.permissionType);
        this.updateItemsDisplay();
        this.updatePermissionInfo();
        
        console.log('🔄 تم إعادة تعيين النموذج');
    }

    // نوافذ منبثقة
    showItemNotFoundModal(barcode) {
        const modal = document.getElementById('item-not-found-modal');
        const newItemName = document.getElementById('new-item-name');
        
        if (modal && newItemName) {
            newItemName.value = '';
            newItemName.setAttribute('data-barcode', barcode);
            modal.style.display = 'block';
        }
    }

    showInquiryModal(item) {
        const modal = document.getElementById('inquiry-modal');
        const itemName = document.getElementById('inquiry-item-name');
        const itemPrice = document.getElementById('inquiry-item-price');
        
        if (modal && itemName && itemPrice) {
            itemName.textContent = item.name || 'بدون اسم';
            itemPrice.textContent = item.price || 0;
            modal.style.display = 'block';
        }
    }

    closeItemModal() {
        const modal = document.getElementById('item-not-found-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    closeInquiryModal() {
        const modal = document.getElementById('inquiry-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async addNewItem() {
        const newItemName = document.getElementById('new-item-name');
        const modal = document.getElementById('item-not-found-modal');
        
        if (!newItemName || !modal) return;

        const name = newItemName.value.trim();
        const barcode = newItemName.getAttribute('data-barcode');

        if (!name) {
            this.showMessage('⚠️ يرجى إدخال اسم الصنف', 'warning');
            return;
        }

        try {
            this.showLoading('جاري إضافة الصنف...');
            
            // إضافة الصنف الجديد
            const newItem = {
                barcode: barcode,
                name: name,
                price: 0
            };

            // إضافة الصنف إلى القائمة مباشرة
            this.addItemToPermission(newItem);
            
// محاولة إضافة الصنف إلى قاعدة البيانات
try {
    const addResult = await googleSheets.addProduct(newItem);
    
    if (addResult.success) {
        // ✅ تم الإرسال بنجاح للسيرفر
        this.showMessage('✅ تم إضافة الصنف إلى القاعدة', 'success');
    } else {
        // ❌ فشل الإرسال - الحفظ محلياً
        const localResult = googleSheets.saveProductLocally(newItem);
        if (localResult.success) {
            this.showMessage('✅ تم إضافة الصنف محلياً (بانتظار الاتصال)', 'info');
        } else {
            this.showMessage('❌ فشل إضافة الصنف', 'error');
        }
    }
    
    // ✅ إغلاق النافذة بعد انتهاء العملية
    modal.style.display = 'none';
    
} catch (error) {
    // ❌ خطأ في الاتصال أصلاً - حفظ محلي
    const localResult = googleSheets.saveProductLocally(newItem);
    if (localResult.success) {
        this.showMessage('✅ تم إضافة الصنف محلياً (لا يوجد اتصال)', 'info');
    } else {
        this.showMessage('❌ فشل إضافة الصنف', 'error');
    }
    
    // ✅ إغلاق النافذة حتى في حالة الخطأ
    modal.style.display = 'none';
    
} finally {
    // ✅ إخفاء شاشة التحميل في جميع الحالات
    this.hideLoading();
}

// ❌ احذف هذه الأسطر المكررة:
//     // ✅ إغلاق النافذة حتى في حالة الخطأ
//     modal.style.display = 'none';
// } finally {
//     this.hideLoading();
// }

// واستمر بالدوالت التالية:
showLoading(message) {
    // يمكن إضافة شاشة تحميل هنا
    console.log('⏳ ' + message);
}

hideLoading() {
    // إخفاء شاشة التحميل
}

showMessage(message, type) {
    if (window.appManager && appManager.showMessage) {
        appManager.showMessage(message, type);
    } else {
        console.log(`📢 ${type}: ${message}`);
    }
}

// إنشاء instance من المدير
const permissionsManager = new PermissionsManager();

// ✅ إضافة دوال المزامنة للنظام
window.syncPendingPermissions = () => permissionsManager.syncPendingPermissions();

// جعل الدوال متاحة globally للاستدعاء من HTML
window.startBarcodeScan = () => permissionsManager.startBarcodeScan();
window.savePermission = () => permissionsManager.savePermission();
window.closeItemModal = () => permissionsManager.closeItemModal();
window.closeInquiryModal = () => permissionsManager.closeInquiryModal();
window.addNewItem = () => permissionsManager.addNewItem();

// جعل المدير متاحاً globally
window.permissionsManager = permissionsManager;

console.log('✅ تم تحميل مدير الأذونات بنجاح - مع نظام الحفظ المزدوج');