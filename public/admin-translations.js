// Admin Panel Translation System
let currentLang = 'en';
let translations = {};

// Translation data
const translationData = {
    en: {
        admin: {
            navigation: {
                dashboard: "Dashboard",
                female_profiles: "Female Profiles",
                male_profiles: "Male Profiles",
                interests: "Interests",
                meet_requests: "Meet Requests",
                packages: "Packages",
                admin_management: "Admin Management",
                logout: "Logout"
            },
            dashboard: {
                title: "Dashboard",
                stats: {
                    total_users: "Total Users",
                    new_users_today: "New Users Today",
                    active_subscriptions: "Active Subscriptions",
                    matches_today: "Matches Today",
                    meet_today: "Meet Today"
                },
                charts: {
                    user_growth: "User Growth",
                    user_demographics: "User Demographics",
                    subscriptions: "Subscriptions",
                    accepted_interests: "Accepted Interests",
                    accepted_meet_requests: "Accepted Meet Requests"
                },
                filters: {
                    all: "All",
                    males: "Males",
                    females: "Females",
                    "7_days": "7 Days",
                    "30_days": "30 Days",
                    "90_days": "90 Days",
                    all_time: "All Time"
                },
                sections: {
                    recent_activity: "Recent Activity",
                    pending_approvals: "Pending Approvals"
                }
            },
            profiles: {
                female_title: "Female Profiles",
                male_title: "Male Profiles",
                filters: {
                    search_placeholder: "Search by name, email, location...",
                    status_all: "All Status",
                    status_pending: "Pending",
                    status_approved: "Approved",
                    status_rejected: "Rejected",
                    age_range: "Age Range",
                    location: "Location",
                    apply_filters: "Apply Filters",
                    clear_filters: "Clear Filters"
                },
                actions: {
                    approve: "Approve",
                    reject: "Reject",
                    delete: "Delete",
                    view_media: "View Media",
                    bulk_approve: "Bulk Approve",
                    bulk_reject: "Bulk Reject",
                    export: "Export"
                },
                status: {
                    pending: "Pending",
                    approved: "Approved",
                    rejected: "Rejected"
                },
                fields: {
                    name: "Name",
                    email: "Email",
                    age: "Age",
                    location: "Location",
                    joined: "Joined",
                    status: "Status",
                    photos: "Photos",
                    videos: "Videos"
                }
            },
            interests: {
                title: "Interests",
                filters: {
                    search_label: "Search",
                    search_placeholder: "Search by sender, receiver, email...",
                    status_label: "Status",
                    time_label: "Time",
                    sender_gender: "Sender Gender",
                    receiver_gender: "Receiver Gender",
                    all_time: "All Time",
                    today: "Today",
                    last_7_days: "Last 7 Days",
                    last_30_days: "Last 30 Days",
                    all: "All",
                    male: "Male",
                    female: "Female"
                },
                buttons: {
                    reset_filters: "Reset Filters",
                    refresh: "Refresh"
                },
                table: {
                    sender: "Sender",
                    receiver: "Receiver",
                    status: "Status",
                    created: "Created"
                },
                messages: {
                    loading: "Loading...",
                    no_records: "No records found",
                    failed_to_load_records: "Failed to load records."
                },
                status: {
                    accepted: "Accepted",
                    rejected: "Rejected",
                    pending: "Pending",
                    null: "Unknown"
                },
                notifications: {
                    status_updated: "Status updated",
                    update_status_failed: "Failed to update status"
                }
            },
            meet_requests: {
                title: "Meet Requests",
                filters: {
                    search_label: "Search",
                    search_placeholder: "Search by sender, receiver, email...",
                    status_label: "Status",
                    time_label: "Time",
                    scheduled_label: "Scheduled",
                    scheduled_any: "Any",
                    scheduled_today: "Today",
                    scheduled_yesterday: "Yesterday",
                    scheduled_week: "This Week",
                    sender_gender: "Sender Gender",
                    receiver_gender: "Receiver Gender",
                    all_time: "All Time",
                    today: "Today",
                    last_7_days: "Last 7 Days",
                    last_30_days: "Last 30 Days",
                    all: "All",
                    male: "Male",
                    female: "Female"
                },
                buttons: {
                    reset_filters: "Reset Filters",
                    refresh: "Refresh"
                },
                table: {
                    sender: "Sender",
                    receiver: "Receiver",
                    status: "Status", 
                    scheduled: "Scheduled",
                    created: "Created"
                },
                messages: {
                    loading: "Loading...",
                    no_records: "No records found",
                    failed_to_load_records: "Failed to load records."
                },
                status: {
                    accepted: "Accepted",
                    rejected: "Rejected",
                    pending: "Pending",
                    null: "Unknown"
                },
                notifications: {
                    status_updated: "Status updated",
                    update_status_failed: "Failed to update status"
                }
            },
            packages: {
                title: "Packages",
                filters: {
                    search_label: "Search",
                    search_placeholder: "Search by user, package, status, email...",
                    status_label: "Payment Status",
                    package_label: "Package Name",
                    updated_label: "Updated",
                    complaints_label: "Complaints",
                    all_time: "All Time",
                    today: "Today",
                    last_7_days: "Last 7 Days",
                    last_30_days: "Last 30 Days",
                    yes: "Yes",
                    no: "No",
                    free: "Free",
                    premium: "Premium",
                    vip: "VIP Premium",
                    golden: "Golden Premium"
                },
                buttons: {
                    reset_filters: "Reset Filters",
                    refresh: "Refresh"
                },
                table: {
                    user: "User",
                    package: "Package",
                    amount: "Amount",
                    status: "Status",
                    created: "Created"
                }
                ,
                messages: {
                    loading: "Loading...",
                    failed_to_load_records: "Failed to load records.",
                    no_records: "No records found"
                },
                status: {
                    completed: "Completed",
                    pending: "Pending",
                    failed: "Failed",
                    refunded: "Refunded",
                    null: "Unknown"
                },
                notifications: {
                    package_updated: "Package updated",
                    update_package_failed: "Failed to update package",
                    status_updated: "Status updated",
                    update_status_failed: "Failed to update status"
                }
            },
            common: {
                loading: "Loading...",
                no_data: "No data available",
                error: "Error loading data",
                confirm: "Confirm",
                cancel: "Cancel",
                save: "Save",
                edit: "Edit",
                delete: "Delete",
                search: "Search",
                filter: "Filter",
                export: "Export",
                select_all: "Select All",
                selected_count: "{{count}} selected"
            }
        }
    },
    ar: {
        admin: {
            navigation: {
                dashboard: "لوحة التحكم",
                female_profiles: "الملفات النسائية",
                male_profiles: "الملفات الرجالية",
                interests: "الاهتمامات",
                meet_requests: "طلبات المقابلة",
                packages: "الباقات",
                admin_management: "إدارة المديرين",
                logout: "تسجيل الخروج"
            },
            dashboard: {
                title: "لوحة التحكم",
                stats: {
                    total_users: "إجمالي المستخدمين",
                    new_users_today: "المستخدمون الجدد اليوم",
                    active_subscriptions: "الاشتراكات النشطة",
                    matches_today: "المطابقات اليوم",
                    meet_today: "المقابلات اليوم"
                },
                charts: {
                    user_growth: "نمو المستخدمين",
                    user_demographics: "التركيبة السكانية للمستخدمين",
                    subscriptions: "الاشتراكات",
                    accepted_interests: "الاهتمامات المقبولة",
                    accepted_meet_requests: "طلبات المقابلة المقبولة"
                },
                filters: {
                    all: "الكل",
                    males: "الذكور",
                    females: "الإناث",
                    "7_days": "7 أيام",
                    "30_days": "30 يوماً",
                    "90_days": "90 يوماً",
                    all_time: "كل الوقت"
                },
                sections: {
                    recent_activity: "النشاط الأخير",
                    pending_approvals: "الموافقات المعلقة"
                }
            },
            profiles: {
                female_title: "الملفات النسائية",
                male_title: "الملفات الرجالية",
                filters: {
                    search_placeholder: "البحث بالاسم، البريد الإلكتروني، الموقع...",
                    status_all: "جميع الحالات",
                    status_pending: "قيد المراجعة",
                    status_approved: "مقبول",
                    status_rejected: "مرفوض",
                    age_range: "الفئة العمرية",
                    location: "الموقع",
                    apply_filters: "تطبيق المرشحات",
                    clear_filters: "مسح المرشحات"
                },
                actions: {
                    approve: "قبول",
                    reject: "رفض",
                    delete: "حذف",
                    view_media: "عرض الوسائط",
                    bulk_approve: "قبول جماعي",
                    bulk_reject: "رفض جماعي",
                    export: "تصدير"
                },
                status: {
                    pending: "قيد المراجعة",
                    approved: "مقبول",
                    rejected: "مرفوض"
                },
                fields: {
                    name: "الاسم",
                    email: "البريد الإلكتروني",
                    age: "العمر",
                    location: "الموقع",
                    joined: "تاريخ الانضمام",
                    status: "الحالة",
                    photos: "الصور",
                    videos: "الفيديوهات"
                }
            },
            interests: {
                title: "الاهتمامات",
                filters: {
                    search_label: "بحث",
                    search_placeholder: "ابحث بالمرسل، المستقبل، البريد...",
                    status_label: "الحالة",
                    time_label: "الوقت",
                    sender_gender: "جنس المرسل",
                    receiver_gender: "جنس المستقبل",
                    all_time: "كل الوقت",
                    today: "اليوم",
                    last_7_days: "آخر 7 أيام",
                    last_30_days: "آخر 30 يوماً",
                    all: "الكل",
                    male: "ذكر",
                    female: "أنثى"
                },
                buttons: {
                    reset_filters: "مسح المرشحات",
                    refresh: "تحديث"
                },
                table: {
                    sender: "المرسل",
                    receiver: "المستقبل",
                    status: "الحالة",
                    created: "تاريخ الإنشاء"
                },
                messages: {
                    loading: "جارٍ التحميل...",
                    no_records: "لا توجد سجلات",
                    failed_to_load_records: "تعذر تحميل السجلات."
                },
                status: {
                    accepted: "مقبول",
                    rejected: "مرفوض",
                    pending: "قيد الانتظار",
                    null: "غير معروف"
                },
                notifications: {
                    status_updated: "تم تحديث الحالة",
                    update_status_failed: "تعذر تحديث الحالة"
                }
            },
            meet_requests: {
                title: "طلبات المقابلة",
                filters: {
                    search_label: "بحث",
                    search_placeholder: "ابحث بالمرسل، المستقبل، البريد...",
                    status_label: "الحالة",
                    time_label: "الوقت",
                    scheduled_label: "مجدولة",
                    scheduled_any: "أي",
                    scheduled_today: "اليوم",
                    scheduled_yesterday: "أمس",
                    scheduled_week: "هذا الأسبوع",
                    sender_gender: "جنس المرسل",
                    receiver_gender: "جنس المستقبل",
                    all_time: "كل الوقت",
                    today: "اليوم",
                    last_7_days: "آخر 7 أيام",
                    last_30_days: "آخر 30 يوماً",
                    all: "الكل",
                    male: "ذكر",
                    female: "أنثى"
                },
                buttons: {
                    reset_filters: "مسح المرشحات",
                    refresh: "تحديث"
                },
                table: {
                    sender: "المرسل",
                    receiver: "المستقبل",
                    status: "الحالة",
                    scheduled: "موعد المقابلة",
                    created: "تاريخ الإنشاء"
                },
                messages: {
                    loading: "جارٍ التحميل...",
                    no_records: "لا توجد سجلات",
                    failed_to_load_records: "تعذر تحميل السجلات."
                },
                status: {
                    accepted: "مقبول",
                    rejected: "مرفوض",
                    pending: "قيد الانتظار",
                    null: "غير معروف"
                },
                notifications: {
                    status_updated: "تم تحديث الحالة",
                    update_status_failed: "تعذر تحديث الحالة"
                }
            },
            packages: {
                title: "الباقات",
                filters: {
                    search_label: "بحث",
                    search_placeholder: "ابحث بالمستخدم، الباقة، الحالة، البريد...",
                    status_label: "حالة الدفع",
                    package_label: "اسم الباقة",
                    updated_label: "آخر تحديث",
                    complaints_label: "الشكاوى",
                    all_time: "كل الوقت",
                    today: "اليوم",
                    last_7_days: "آخر 7 أيام",
                    last_30_days: "آخر 30 يوماً",
                    yes: "نعم",
                    no: "لا",
                    free: "مجانية",
                    premium: "بريميوم",
                    vip: "بريميوم VIP",
                    golden: "بريميوم ذهبي"
                },
                buttons: {
                    reset_filters: "مسح المرشحات",
                    refresh: "تحديث"
                },
                table: {
                    user: "المستخدم",
                    package: "الباقة",
                    amount: "المبلغ",
                    status: "الحالة",
                    created: "تاريخ الإنشاء"
                }
                ,
                messages: {
                    loading: "جارٍ التحميل...",
                    failed_to_load_records: "تعذر تحميل السجلات.",
                    no_records: "لا توجد سجلات"
                },
                status: {
                    completed: "مكتمل",
                    pending: "قيد الانتظار",
                    failed: "فشل",
                    refunded: "مسترد",
                    null: "غير معروف"
                },
                notifications: {
                    package_updated: "تم تحديث الباقة",
                    update_package_failed: "تعذر تحديث الباقة",
                    status_updated: "تم تحديث الحالة",
                    update_status_failed: "تعذر تحديث الحالة"
                }
            },
            common: {
                loading: "جارٍ التحميل...",
                no_data: "لا توجد بيانات متاحة",
                error: "خطأ في تحميل البيانات",
                confirm: "تأكيد",
                cancel: "إلغاء",
                save: "حفظ",
                edit: "تعديل",
                delete: "حذف",
                search: "بحث",
                filter: "تصفية",
                export: "تصدير",
                select_all: "تحديد الكل",
                selected_count: "{{count}} محدد"
            }
        }
    }
};

function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
}

function translateText(key) {
    return getNestedValue(translations, key) || key;
}

function updateTranslations() {
    // Update text content
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        element.textContent = translateText(key);
    });

    // Update placeholders
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        element.placeholder = translateText(key);
    });

    // Update document direction for Arabic
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
}

function toggleLanguageMenu() {
    const menu = document.getElementById('languageMenu');
    if (menu) {
        menu.classList.toggle('show');
    }
}

function changeLanguage(lang) {
    currentLang = lang;
    translations = translationData[lang];
    
    // Update current language display
    const currentLanguage = document.getElementById('currentLanguage');
    if (currentLanguage) {
        if (lang === 'ar') {
            currentLanguage.textContent = 'العربية';
        } else {
            currentLanguage.textContent = 'English';
        }
    }

    // Update active language option
    document.querySelectorAll('.language-option').forEach(option => {
        option.classList.toggle('active', option.getAttribute('data-lang') === lang);
    });

    // Apply translations
    updateTranslations();

    // Close language menu
    const languageMenu = document.getElementById('languageMenu');
    if (languageMenu) {
        languageMenu.classList.remove('show');
    }

    // Save language preference
    localStorage.setItem('adminLanguage', lang);
}

// Initialize translations
function initializeLanguage() {
    // Load saved language preference
    const savedLang = localStorage.getItem('adminLanguage') || 'en';
    changeLanguage(savedLang);
}

// Close language menu when clicking outside
document.addEventListener('click', function(event) {
    const languageDropdown = document.querySelector('.language-dropdown');
    if (languageDropdown && !languageDropdown.contains(event.target)) {
        const languageMenu = document.getElementById('languageMenu');
        if (languageMenu) {
            languageMenu.classList.remove('show');
        }
    }
});

// Initialize language on page load
document.addEventListener('DOMContentLoaded', initializeLanguage);
