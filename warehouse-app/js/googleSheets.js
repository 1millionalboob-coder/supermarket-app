// خدمة الاتصال بـ Google Sheets
class GoogleSheetsService {
    constructor() {
        this.scriptUrl = 'https://script.google.com/macros/s/AKfycbyeZy4h732imiVLF90gik1p9kkr5nBj55RxqZb81K6j9vXhZQyR3hGL9ngaZMaAFRL1/exec';
        this.init();
    }

    init() {
        console.log('✅ خدمة Google Sheets جاهزة');
    }

    // دالة الاتصال العامة
    async makeRequest(action, data = null) {
        return new Promise((resolve, reject) => {
            if (!navigator.onLine) {
                reject(new Error('لا يوجد اتصال بالإنترنت'));
                return;
            }

            const callbackName = 'callback_' + Math.random().toString(36).substr(2, 9);
            let url = `${this.scriptUrl}?action=${encodeURIComponent(action)}&callback=${callbackName}`;
            
            if (data) {
                url += `&data=${encodeURIComponent(JSON.stringify(data))}`;
            }

            const script = document.createElement('script');
            script.src = url;
            
            window[callbackName] = (response) => {
                delete window[callbackName];
                if (script.parentNode) {
                    document.body.removeChild(script);
                }
                
                if (response && response.status === 'success') {
                    resolve(response.data);
                } else {
                    reject(new Error(response?.data || 'خطأ في الخادم'));
                }
            };

            script.onerror = () => {
                delete window[callbackName];
                if (script.parentNode) {
                    document.body.removeChild(script);
                }
                reject(new Error('فشل الاتصال بالخادم'));
            };

            document.body.appendChild(script);

            setTimeout(() => {
                if (window[callbackName]) {
                    delete window[callbackName];
                    if (script.parentNode) {
                        document.body.removeChild(script);
                    }
                    reject(new Error('انتهى وقت الانتظار'));
                }
            }, 15000);
        });
    }

    // جلب بيانات المستخدمين
    async getUsers() {
        try {
            console.log('🔍 جاري جلب بيانات المستخدمين...');
            const users = await this.makeRequest('getUsers');
            console.log('✅ تم جلب بيانات المستخدمين:', users?.length || 0, 'مستخدم');
            return users || [];
        } catch (error) {
            console.error('❌ خطأ في جلب المستخدمين:', error);
            throw error;
        }
    }

    // التحقق من تسجيل الدخول
    async validateLogin(username, password) {
        try {
            console.log('🔐 التحقق من تسجيل الدخول:', username);
            const user = await this.makeRequest('validateLogin', {
                username: username,
                password: password
            });
            return user;
        } catch (error) {
            console.error('❌ خطأ في التحقق من تسجيل الدخول:', error);
            throw error;
        }
    }

    // جلب بيانات الأصناف
    async getItems() {
        try {
            console.log('📦 جاري جلب بيانات الأصناف...');
            const items = await this.makeRequest('getItems');
            console.log('✅ تم جلب الأصناف:', items?.length || 0, 'صنف');
            return items || [];
        } catch (error) {
            console.error('❌ خطأ في جلب الأصناف:', error);
            throw error;
        }
    }

    // جلب بيانات الأصناف من جدول "الأصناف" - الدالة الجديدة
    async getProducts() {
        try {
            console.log('📦 جاري جلب بيانات الأصناف من جدول "الأصناف"...');
            const products = await this.makeRequest('getProducts');
            
            // معالجة البيانات وتنسيقها
            if (products && Array.isArray(products)) {
                const formattedProducts = products.map(product => ({
                    barcode: product.A || '',      // العمود A: الباركود
                    name: product.B || '',         // العمود B: اسم الصنف
                    price: product.C || ''         // العمود C: السعر
                }));
                
                console.log('✅ تم جلب وتنسيق الأصناف:', formattedProducts.length, 'صنف');
                return formattedProducts;
            }
            
            console.log('⚠️ لا توجد بيانات أصناف');
            return [];
            
        } catch (error) {
            console.error('❌ خطأ في جلب بيانات الأصناف:', error);
            
            // محاولة استخدام الدالة القديمة كبديل
            try {
                console.log('🔄 محاولة استخدام getItems كبديل...');
                const items = await this.getItems();
                return items || [];
            } catch (fallbackError) {
                console.error('❌ فشل جميع محاولات جلب الأصناف');
                return [];
            }
        }
    }

    // البحث عن صنف بالباركود
    async findItemByBarcode(barcode) {
        try {
            console.log('🔍 البحث عن الصنف:', barcode);
            const item = await this.makeRequest('findItemByBarcode', { barcode: barcode });
            return item;
        } catch (error) {
            console.error('❌ خطأ في البحث عن الصنف:', error);
            throw error;
        }
    }

    // إضافة إذن جديد
    async addPermission(permissionData) {
        try {
            console.log('📝 جاري إضافة الإذن...');
            const result = await this.makeRequest('addPermission', permissionData);
            console.log('✅ تم إضافة الإذن');
            return result;
        } catch (error) {
            console.error('❌ خطأ في إضافة الإذن:', error);
            throw error;
        }
    }

    // ✅ دالة حفظ الأذن - الإصدار النهائي المصحح
    async savePermission(permissionData) {
        try {
            console.log('💾 جاري حفظ الأذن:', permissionData.number);
            
            let successCount = 0;
            let errorCount = 0;
            
            for (const item of permissionData.items) {
                try {
                    const rowData = {
                        'رقم الاذن': permissionData.number,
                        'اسم المستخدم': permissionData.user,
                        'الوقت والتاريخ': permissionData.dateTime,
                        'نوع الاذن': permissionData.type,
                        'اسم الصنف': item.name,
                        'باركود الصنف': item.barcode,
                        'الكمية من الصنف': item.quantity,
                        'السعر': 0,
                        'المجموع': 0
                    };
                    
                    console.log('📤 إرسال صنف:', item.name);
                    
                    // إرسال الطلب للسكربت
                    const result = await this.makeRequest('addPermission', rowData);
                    
                    // إذا وصلنا هنا بدون error يعني نجح الإرسال
                    successCount++;
                    console.log(`✅ تم إرسال صنف: ${item.name}`);
                    
                    // انتظار 500 مللي ثانية بين كل طلب
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                } catch (error) {
                    errorCount++;
                    console.error(`❌ فشل إرسال صنف ${item.name}:`, error.message);
                }
            }
            
            console.log(`✅ إنتهى حفظ الأذن: ${successCount} ناجح, ${errorCount} فاشل`);
            
            // ✅ التصحيح النهائي: نرجع success بناءً على النتيجة
            if (errorCount === 0) {
                return {
                    success: true, // ✅ هذا ما يبحث عنه الكود في اذون.html
                    permissionNumber: permissionData.number,
                    message: `تم حفظ ${successCount} صنف بنجاح`
                };
            } else {
                return {
                    success: false, // ✅ هذا ما يبحث عنه الكود في اذون.html
                    permissionNumber: permissionData.number,
                    error: `فشل في حفظ ${errorCount} من ${permissionData.items.length} صنف`
                };
            }
            
        } catch (error) {
            console.error('❌ خطأ في حفظ الأذن:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ✅ دالة جديدة: جلب الأذون المحفوظة
    async getPermissions() {
        try {
            console.log('📋 جاري جلب بيانات الأذون...');
            const permissions = await this.makeRequest('getPermissions');
            console.log('✅ تم جلب الأذون:', permissions?.length || 0, 'أذن');
            return permissions || [];
        } catch (error) {
            console.error('❌ خطأ في جلب الأذون:', error);
            throw error;
        }
    }

    // ✅ دالة جديدة: التحقق من اتصال الأذون
    async checkPermissionsConnection() {
        try {
            console.log('🔗 التحقق من اتصال جدول الأذون...');
            const testData = {
                A: 'TEST',
                B: 'نظام الاختبار',
                C: new Date().toLocaleString('ar-EG'),
                D: 'اختبار',
                E: 'صنف اختبار',
                F: '123456',
                G: '1'
            };
            
            const result = await this.makeRequest('testConnection', testData);
            console.log('✅ اتصال جدول الأذون يعمل بشكل صحيح');
            return true;
        } catch (error) {
            console.error('❌ فشل الاتصال بجدول الأذون:', error);
            return false;
        }
    }

    // ✅ دالة جديدة: البحث عن أذن برقمه
    async findPermissionByNumber(permissionNumber) {
        try {
            console.log('🔍 البحث عن الأذن:', permissionNumber);
            const permission = await this.makeRequest('findPermissionByNumber', {
                permissionNumber: permissionNumber
            });
            return permission;
        } catch (error) {
            console.error('❌ خطأ في البحث عن الأذن:', error);
            throw error;
        }
    }

    // ✅ دالة جديدة: تحديث حالة الأذن
    async updatePermissionStatus(permissionNumber, status) {
        try {
            console.log('🔄 تحديث حالة الأذن:', permissionNumber, status);
            const result = await this.makeRequest('updatePermissionStatus', {
                permissionNumber: permissionNumber,
                status: status
            });
            return result;
        } catch (error) {
            console.error('❌ خطأ في تحديث حالة الأذن:', error);
            throw error;
        }
    }
}

// ✅ دالة إضافة صنف جديد - كانت مفقودة
async addProduct(productData) {
    try {
        console.log('🆕 جاري إضافة صنف جديد:', productData.name);
        const result = await this.makeRequest('addProduct', productData);
        console.log('✅ تم إضافة الصنف بنجاح');
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('❌ خطأ في إضافة الصنف:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ✅ دالة الحفظ المحلي للصنف - للاستخدام عند عدم وجود اتصال
saveProductLocally(productData) {
    try {
        const pendingProducts = JSON.parse(localStorage.getItem('pending_products') || '[]');
        const productWithMetadata = {
            ...productData,
            id: 'local_' + Date.now(),
            status: 'pending',
            createdAt: new Date().toISOString(),
            syncAttempts: 0
        };
        
        pendingProducts.push(productWithMetadata);
        localStorage.setItem('pending_products', JSON.stringify(pendingProducts));
        
        console.log('💾 تم حفظ الصنف محلياً:', productData.name);
        return {
            success: true,
            product: productWithMetadata
        };
    } catch (error) {
        console.error('❌ خطأ في الحفظ المحلي:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ✅ دالة مزامنة الأصناف المحلية مع السيرفر
async syncPendingProducts() {
    try {
        const pendingProducts = JSON.parse(localStorage.getItem('pending_products') || '[]');
        const productsToSync = pendingProducts.filter(p => 
            p.status === 'pending' || (p.status === 'failed' && p.syncAttempts < 3)
        );

        if (productsToSync.length === 0) {
            return { success: 0, failed: 0 };
        }

        console.log(`🔄 جاري مزامنة ${productsToSync.length} صنف محلي...`);

        let successCount = 0;
        let failedCount = 0;

        for (const product of productsToSync) {
            try {
                const result = await this.addProduct(product);
                
                if (result.success) {
                    // تحديث حالة الصنف إلى متم المزامنة
                    product.status = 'synced';
                    product.syncedAt = new Date().toISOString();
                    successCount++;
                } else {
                    product.status = 'failed';
                    product.syncAttempts = (product.syncAttempts || 0) + 1;
                    product.lastError = result.error;
                    failedCount++;
                }
            } catch (error) {
                product.status = 'failed';
                product.syncAttempts = (product.syncAttempts || 0) + 1;
                product.lastError = error.message;
                failedCount++;
            }
        }

        // حفظ التحديثات
        localStorage.setItem('pending_products', JSON.stringify(pendingProducts));

        console.log(`✅ إنتهت المزامنة: ${successCount} ناجح, ${failedCount} فاشل`);
        return { success: successCount, failed: failedCount };

    } catch (error) {
        console.error('❌ خطأ في مزامنة الأصناف المحلية:', error);
        return { success: 0, failed: 0 };
    }
}
// ✅ دالة إضافة صنف جديد - كانت مفقودة
async addProduct(productData) {
    try {
        console.log('🆕 جاري إضافة صنف جديد:', productData.name);
        const result = await this.makeRequest('addProduct', productData);
        console.log('✅ تم إضافة الصنف بنجاح');
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('❌ خطأ في إضافة الصنف:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ✅ دالة الحفظ المحلي للصنف - للاستخدام عند عدم وجود اتصال
saveProductLocally(productData) {
    try {
        const pendingProducts = JSON.parse(localStorage.getItem('pending_products') || '[]');
        const productWithMetadata = {
            ...productData,
            id: 'local_' + Date.now(),
            status: 'pending',
            createdAt: new Date().toISOString(),
            syncAttempts: 0
        };
        
        pendingProducts.push(productWithMetadata);
        localStorage.setItem('pending_products', JSON.stringify(pendingProducts));
        
        console.log('💾 تم حفظ الصنف محلياً:', productData.name);
        return {
            success: true,
            product: productWithMetadata
        };
    } catch (error) {
        console.error('❌ خطأ في الحفظ المحلي:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ✅ دالة مزامنة الأصناف المحلية مع السيرفر
async syncPendingProducts() {
    try {
        const pendingProducts = JSON.parse(localStorage.getItem('pending_products') || '[]');
        const productsToSync = pendingProducts.filter(p => 
            p.status === 'pending' || (p.status === 'failed' && p.syncAttempts < 3)
        );

        if (productsToSync.length === 0) {
            return { success: 0, failed: 0 };
        }

        console.log(`🔄 جاري مزامنة ${productsToSync.length} صنف محلي...`);

        let successCount = 0;
        let failedCount = 0;

        for (const product of productsToSync) {
            try {
                const result = await this.addProduct(product);
                
                if (result.success) {
                    // تحديث حالة الصنف إلى متم المزامنة
                    product.status = 'synced';
                    product.syncedAt = new Date().toISOString();
                    successCount++;
                } else {
                    product.status = 'failed';
                    product.syncAttempts = (product.syncAttempts || 0) + 1;
                    product.lastError = result.error;
                    failedCount++;
                }
            } catch (error) {
                product.status = 'failed';
                product.syncAttempts = (product.syncAttempts || 0) + 1;
                product.lastError = error.message;
                failedCount++;
            }
        }

        // حفظ التحديثات
        localStorage.setItem('pending_products', JSON.stringify(pendingProducts));

        console.log(`✅ إنتهت المزامنة: ${successCount} ناجح, ${failedCount} فاشل`);
        return { success: successCount, failed: failedCount };

    } catch (error) {
        console.error('❌ خطأ في مزامنة الأصناف المحلية:', error);
        return { success: 0, failed: 0 };
    }
}
// إنشاء نسخة من الخدمة وجعلها متاحة globally
const googleSheets = new GoogleSheetsService();
window.googleSheets = googleSheets;

console.log('🚀 تم تحميل خدمة Google Sheets بنجاح - مع دعم الأذون الكامل');