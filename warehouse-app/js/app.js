// نظام إدارة التطبيق - الإصدار المصحح
class AppManager {
    constructor() {
        this.currentUser = null;
        this.products = []; // مصفوفة تخزين الأصناف
        this.init();
    }

    init() {
        console.log('🚀 بدء تشغيل التطبيق...');
        
        // الخطوة 1: التحقق إذا كان المستخدم مسجل مسبقاً
        if (this.checkExistingLogin()) {
            // إذا كان مسجلاً، نتوقف هنا ولا نضيف مستمعات تسجيل الدخول
            return;
        }
        
        // الخطوة 2: فقط إذا لم يكن مسجلاً، نجهز شاشة تسجيل الدخول
        this.setupLoginListener();
        this.loadUsersData();
        console.log('✅ جاهز لاستقبال تسجيل الدخول');
    }

    // التحقق من وجود مستخدم مسجل مسبقاً
    checkExistingLogin() {
        const savedUser = localStorage.getItem('current_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                console.log('👤 مستخدم مسجل مسبقاً:', this.currentUser.username);
                
                // ✅ تحميل الأصناف للمستخدم المسجل مسبقاً
                this.loadProductsDataForExistingUser();
                
                // الانتقال المباشر للشاشة الرئيسية
                this.goToMainScreen();
                return true; // تم العثور على مستخدم مسجل
            } catch (error) {
                console.error('❌ خطأ في بيانات الجلسة:', error);
                localStorage.removeItem('current_user');
            }
        }
        return false; // لا يوجد مستخدم مسجل
    }

    // ✅ تحميل الأصناف للمستخدم المسجل مسبقاً
    async loadProductsDataForExistingUser() {
        try {
            console.log('📦 جاري تحميل الأصناف للمستخدم المسجل...');
            const products = await this.loadProductsData();
            
            if (products && products.length > 0) {
                console.log('✅ تم تحميل الأصناف للمستخدم المسجل:', products.length, 'صنف');
            } else {
                console.log('⚠️ لا توجد أصناف للمستخدم المسجل');
            }
        } catch (error) {
            console.error('❌ فشل تحميل الأصناف للمستخدم المسجل:', error);
        }
    }

    // جلب بيانات المستخدمين من السيرفر وحفظها محلياً
    async loadUsersData() {
        try {
            console.log('🔍 جاري جلب بيانات المستخدمين...');
            
            if (typeof googleSheets !== 'undefined') {
                const users = await googleSheets.getUsers();
                
                if (users && users.length > 0) {
                    localStorage.setItem('cached_users', JSON.stringify(users));
                    console.log('✅ تم حفظ بيانات المستخدمين محلياً:', users.length, 'مستخدم');
                }
            }
        } catch (error) {
            console.log('⚠️ لا يمكن جلب بيانات المستخدمين:', error);
        }
    }

    // جلب بيانات الأصناف من السيرفر وحفظها محلياً
    async loadProductsData() {
        try {
            console.log('📦 جاري جلب بيانات الأصناف...');
            
            // ✅ التأكد من وجود googleSheets
            if (typeof googleSheets === 'undefined') {
                throw new Error('خدمة Google Sheets غير متاحة');
            }

            // ✅ التأكد من وجود دالة getProducts
            if (typeof googleSheets.getProducts !== 'function') {
                throw new Error('دالة getProducts غير متاحة');
            }

            const products = await googleSheets.getProducts();
            console.log('🔍 استجابة getProducts:', products);
            
            if (products && products.length > 0) {
                // حفظ البيانات محلياً للاستخدام السريع
                this.products = products;
                localStorage.setItem('cached_products', JSON.stringify(products));
                localStorage.setItem('products_last_sync', new Date().toISOString());
                
                console.log('✅ تم حفظ بيانات الأصناف محلياً:', products.length, 'صنف');
                
                // ✅ إشعار تأكيد للمستخدم
                this.showMessage('✅ تم تحميل وتخزين بيانات الأصناف بنجاح');
                
                return products;
            } else {
                // ✅ إشعار في حالة عدم وجود أصناف
                this.showMessage('⚠️ لا توجد أصناف متاحة');
                return [];
            }
        } catch (error) {
            console.error('❌ لا يمكن جلب بيانات الأصناف:', error);
            
            // ✅ إشعار في حالة الخطأ
            this.showMessage('❌ فشل تحميل الأصناف - جاري استخدام البيانات المخزنة');
            
            // محاولة استخدام البيانات المخزنة مسبقاً
            const cachedProducts = this.getCachedProducts();
            if (cachedProducts.length > 0) {
                this.showMessage('✅ تم استخدام البيانات المخزنة مسبقاً');
            }
            
            return cachedProducts;
        }
    }

    // جلب البيانات المخزنة محلياً للأصناف
    getCachedProducts() {
        try {
            const cachedProducts = localStorage.getItem('cached_products');
            if (cachedProducts) {
                this.products = JSON.parse(cachedProducts);
                console.log('📦 تم تحميل الأصناف من التخزين المحلي:', this.products.length, 'صنف');
                return this.products;
            } else {
                console.log('📦 لا توجد بيانات أصناف مخزنة محلياً');
                return [];
            }
        } catch (error) {
            console.error('❌ خطأ في تحميل البيانات المخزنة:', error);
            return [];
        }
    }

    // إعداد مستمع حدث تسجيل الدخول
    setupLoginListener() {
        const loginForm = document.querySelector('.login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    // معالجة تسجيل الدخول
    async handleLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const loginBtn = document.querySelector('.login-btn');
        
        if (!username || !password) {
            this.showMessage('⚠️ يرجى إدخال اسم المستخدم وكلمة المرور');
            return;
        }

        try {
            // تعطيل الزر أثناء المعالجة
            loginBtn.disabled = true;
            loginBtn.textContent = 'جاري التحقق...';

            // التحقق من صحة البيانات ضد البيانات المخزنة محلياً
            const isValid = this.validateWithLocalData(username, password);
            
            if (isValid) {
                // حفظ بيانات المستخدم للجلسات القادمة
                this.saveUserSession(username);
                this.showMessage('✅ تم تسجيل الدخول بنجاح');
                console.log('✅ تسجيل دخول ناجح:', username);
                
                // ✅ تحميل بيانات الأصناف قبل الانتقال مع تأخير بسيط
                console.log('🔄 بدء تحميل الأصناف...');
                await this.loadProductsData();
                console.log('✅ انتهى تحميل الأصناف');
                
                // ✅ تأخير بسيط لرؤية الإشعار ثم الانتقال
                setTimeout(() => {
                    this.goToMainScreen();
                }, 1000);
                
            } else {
                this.showMessage('❌ بيانات الدخول غير صحيحة');
                console.log('❌ فشل تسجيل الدخول:', username);
            }
            
        } catch (error) {
            console.error('❌ خطأ في النظام:', error);
            this.showMessage('❌ حدث خطأ في النظام');
        } finally {
            // إعادة تمكين الزر
            loginBtn.disabled = false;
            loginBtn.textContent = 'دخول إلى النظام';
        }
    }

    // التحقق من البيانات ضد البيانات المخزنة محلياً
    validateWithLocalData(username, password) {
        const usersData = localStorage.getItem('cached_users');
        
        if (!usersData) {
            console.log('❌ لا توجد بيانات مستخدمين مخزنة');
            return false;
        }

        try {
            const users = JSON.parse(usersData);
            const user = users.find(u => u.username === username && u.password === password);
            
            if (user) {
                console.log('✅ تم العثور على المستخدم في البيانات المخزنة');
                return true;
            }
            
            console.log('❌ المستخدم غير موجود في البيانات المخزنة');
            return false;
        } catch (error) {
            console.error('❌ خطأ في تحليل بيانات المستخدمين:', error);
            return false;
        }
    }

    // حفظ جلسة المستخدم بعد تسجيل الدخول الناجح
    saveUserSession(username) {
        this.currentUser = {
            username: username,
            isLoggedIn: true,
            loginTime: new Date().toLocaleString('ar-EG')
        };
        localStorage.setItem('current_user', JSON.stringify(this.currentUser));
        console.log('💾 تم حفظ جلسة المستخدم:', username);
    }

    // الانتقال للشاشة الرئيسية
    goToMainScreen() {
        console.log('🔄 الانتقال للشاشة الرئيسية...');
        window.location.href = 'home.html';
    }

    // عرض الرسائل
    showMessage(message) {
        alert(message);
    }
}

// بدء التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    window.appManager = new AppManager();
});