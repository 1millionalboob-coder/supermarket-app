class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkSavedUser();
        console.log('✅ تم تهيئة مدير المصادقة');
    }

    // التحقق إذا كان المستخدم مسجل مسبقاً
    checkSavedUser() {
        const savedUser = localStorage.getItem('current_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            console.log('👤 مستخدم مسجل مسبقاً:', this.currentUser.username);
            return true;
        }
        return false;
    }

    // تسجيل الدخول مع جوجل شيت
    async login(username, password) {
        try {
            console.log('🔐 محاولة تسجيل الدخول بـ:', username);
            
            // التحقق من البيانات المدخلة
            if (!username || !password) {
                throw new Error('يرجى إدخال اسم المستخدم وكلمة المرور');
            }

            // المحاولة الأولى: استخدام googleSheets
            if (typeof googleSheets !== 'undefined' && googleSheets.validateLogin) {
                const user = await googleSheets.validateLogin(username, password);
                
                if (user) {
                    this.currentUser = {
                        username: user.username,
                        name: user.username,
                        permissions: user.permissions || 'basic'
                    };
                    
                    // حفظ بيانات المستخدم محلياً
                    localStorage.setItem('current_user', JSON.stringify(this.currentUser));
                    console.log('✅ تم تسجيل الدخول بنجاح:', this.currentUser.username);
                    return true;
                } else {
                    throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
                }
            } else {
                // إذا لم يكن googleSheets متاحاً، نستخدم البيانات المحلية
                return this.fallbackLogin(username, password);
            }
            
        } catch (error) {
            console.error('❌ خطأ في عملية التسجيل:', error);
            
            // المحاولة الثانية: استخدام البيانات المحلية المخزنة
            return this.fallbackLogin(username, password);
        }
    }

    // تسجيل دخول احتياطي (للطوارئ)
    async fallbackLogin(username, password) {
        try {
            console.log('🔄 استخدام البيانات المحلية للتسجيل...');
            
            // جلب المستخدمين المخزنين محلياً
            const cachedUsers = JSON.parse(localStorage.getItem('cached_users') || '[]');
            const user = cachedUsers.find(u => 
                u.username === username && 
                u.password === password
            );
            
            if (user) {
                this.currentUser = {
                    username: user.username,
                    name: user.username,
                    permissions: user.permissions || 'basic'
                };
                localStorage.setItem('current_user', JSON.stringify(this.currentUser));
                console.log('✅ تم التسجيل باستخدام البيانات المحلية');
                return true;
            }
            
            // المحاولة الثالثة: بيانات افتراضية للطوارئ
            const emergencyUsers = [
                { username: 'admin', password: '123456', permissions: 'all' },
                { username: 'user', password: '123456', permissions: 'basic' }
            ];

            const emergencyUser = emergencyUsers.find(u => 
                u.username === username && u.password === password
            );
            
            if (emergencyUser) {
                this.currentUser = {
                    username: emergencyUser.username,
                    name: emergencyUser.username,
                    permissions: emergencyUser.permissions
                };
                localStorage.setItem('current_user', JSON.stringify(this.currentUser));
                console.log('⚠️ تم التسجيل باستخدام البيانات الافتراضية للطوارئ');
                return true;
            }
            
            console.log('❌ فشل جميع محاولات التسجيل');
            return false;
            
        } catch (error) {
            console.error('❌ خطأ في التسجيل الاحتياطي:', error);
            return false;
        }
    }

    // تسجيل الخروج
    logout() {
        const username = this.currentUser ? this.currentUser.username : 'مستخدم';
        this.currentUser = null;
        localStorage.removeItem('current_user');
        console.log('✅ تم تسجيل الخروج:', username);
    }

    // الحصول على المستخدم الحالي
    getCurrentUser() {
        return this.currentUser;
    }

    // التحقق من الصلاحيات
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        if (this.currentUser.permissions === 'all') return true;
        if (this.currentUser.permissions === permission) return true;
        
        // الصلاحيات الأساسية المسموحة للجميع
        const basicPermissions = ['استعلام', 'استلامات', 'نقل من المخزن للفرع', 'نقل من الفرع للمخزن', 'اذن البيع'];
        if (basicPermissions.includes(permission)) return true;
        
        return false;
    }

    // الحصول على اسم المستخدم للعرض
    getDisplayName() {
        return this.currentUser ? this.currentUser.name : 'زائر';
    }

    // التحقق من حالة المصادقة
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // تحديث بيانات المستخدم
    updateUserData(userData) {
        if (this.currentUser) {
            this.currentUser = { ...this.currentUser, ...userData };
            localStorage.setItem('current_user', JSON.stringify(this.currentUser));
            console.log('✅ تم تحديث بيانات المستخدم');
        }
    }
}

// إنشاء instance من المدير
const authManager = new AuthManager();

// جعل المدير متاحاً globally
window.authManager = authManager;

console.log('✅ تم تحميل مدير المصادقة بنجاح');