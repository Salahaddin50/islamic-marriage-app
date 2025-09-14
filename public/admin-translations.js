// Admin Panel Translation System
let currentLang = 'en';
let translations = {};

// Translation data
const translationData = {
    en: {
        admin: {
            user_packages: {
                title: "Packages",
                filters: {
                    search_label: "Search",
                    search_placeholder: "Search by user, type, name...",
                    package_label: "Package",
                    active_label: "Active",
                    lifetime_label: "Lifetime",
                    updated_label: "Updated",
                    all: "All",
                    all_time: "All Time",
                    today: "Today",
                    last_7_days: "Last 7 Days",
                    last_30_days: "Last 30 Days",
                    active: "Active",
                    inactive: "Inactive"
                },
                columns: {
                    user: "User",
                    type: "Package Type",
                    name: "Package Name",
                    amount: "Amount",
                    active: "Active",
                    lifetime: "Lifetime",
                    expires: "Expires",
                    updated: "Updated",
                    actions: "Actions"
                },
                no_records: "No records"
            },
            package_definitions: {
                title: "Package Definitions",
                packages_title: "Packages",
                columns: {
                    id: "ID",
                    name: "Name",
                    price: "Price (USD)",
                    ratio: "Epoint ratio (AZN/USD)",
                    updated: "Updated",
                    actions: "Actions"
                },
                no_packages: "No packages"
            },
            navigation: {
                dashboard: "Dashboard",
                female_profiles: "Female Profiles",
                male_profiles: "Male Profiles",
                interests: "Interests",
                meet_requests: "Meet Requests",
                packages: "Payments",
                user_packages: "Packages",
                support_team: "Support Team",
                admin_management: "Admin Management",
                package_definitions: "Package Definitions",
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
                buttons: {
                    refresh: "Refresh"
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
            // Dashboard-specific labels/messages
            dashboard_extra: {
                labels: {
                    gender: "Gender",
                    admin: "Admin",
                    registered: "Registered"
                },
                activity: {
                    new_user_registered: "New user registered",
                    loading_recent: "Loading recent activity...",
                    no_recent: "No recent activity"
                },
                approvals: {
                    loading: "Loading pending approvals...",
                    empty: "No pending approvals"
                },
                time: {
                    just_now: "Just now",
                    minutes_ago: "{count} minutes ago",
                    hours_ago: "{count} hours ago",
                    days_ago: "{count} days ago"
                }
            },
            profiles: {
                female_title: "Female Profiles",
                male_title: "Male Profiles",
                messages: {
                    loading_female: "Loading female profiles...",
                    loading_male: "Loading male profiles..."
                },
                filters: {
                    search_label: "Search",
                    search_placeholder: "Search by name, email, location...",
                    status_label: "Approval Status",
                    status_all: "All Statuses",
                    status_pending: "Pending",
                    status_approved: "Approved",
                    status_rejected: "Rejected",
                    age_range: "Age Range",
                    country_label: "Country",
                    all_countries: "All Countries",
                    all_ages: "All Ages",
                    date_joined_label: "Date Joined",
                    all_time: "All Time",
                    today: "Today",
                    week: "This Week",
                    month: "This Month",
                    year: "This Year",
                    apply_filters: "Apply Filters",
                    clear_filters: "Clear Filters"
                },
                actions: {
                    approve: "Approve",
                    reject: "Reject",
                    delete: "Delete",
                    view_media: "Media",
                    view: "View",
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
                    city: "City",
                    country: "Country",
                    status: "Status",
                    photos: "Photos",
                    videos: "Videos"
                },
                modal: {
                    sections: {
                        personal_information: "Personal Information",
                        education_work: "Education & Work",
                        living_situation: "Living Situation",
                        contact_languages: "Contact & Languages",
                        about: "About",
                        account_info: "Account Info"
                    },
                    labels: {
                        age: "Age",
                        gender: "Gender",
                        country: "Country",
                        city: "City",
                        height: "Height",
                        weight: "Weight",
                        eye_color: "Eye Color",
                        hair_color: "Hair Color",
                        skin_tone: "Skin Tone",
                        body_type: "Body Type",
                        education: "Education",
                        occupation: "Occupation",
                        work_status: "Work Status",
                        housing: "Housing",
                        living_condition: "Living Condition",
                        phone: "Phone",
                        languages: "Languages",
                        about_text: "About",
                        public_profile: "Public Profile",
                        approval: "Approval",
                        joined: "Joined",
                        last_updated: "Last Updated"
                    },
                    buttons: {
                        close: "Close"
                    }
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
                edit_schedule: "Edit schedule",
                edit_schedule_title: "Edit Schedule",
                labels: {
                    timezone: "Time Zone",
                    date: "Date",
                    time: "Time"
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
            support_team: {
                title: "Support Team",
                buttons: {
                    refresh: "Refresh"
                },
                table: {
                    role: "Role",
                    name: "Name",
                    mobile: "Mobile Number",
                    email: "Email",
                    actions: "Actions"
                },
                actions: {
                    edit: "Edit"
                }
            },
            // Common labels usable across pages
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
                selected_count: "{{count}} selected",
                yes: "Yes",
                no: "No",
                not_specified: "Not specified",
                cm: "cm",
                kg: "kg"
            },
            // Profile option dictionaries used to translate values in profile modals
            profile_options: {
                gender: { male: "Male", female: "Female" },
                eye_color: { brown: "Brown", black: "Black", hazel: "Hazel", green: "Green", blue: "Blue", gray: "Gray", amber: "Amber", other: "Other" },
                hair_color: { black: "Black", dark_brown: "Dark Brown", brown: "Brown", light_brown: "Light Brown", blonde: "Blonde", red: "Red", gray: "Gray", white: "White", other: "Other" },
                skin_tone: { very_fair: "Very Fair", fair: "Fair", medium: "Medium", olive: "Olive", brown: "Brown", dark_brown: "Dark Brown", very_dark: "Very Dark", dark: "Dark" },
                body_type: { slim: "Slim", athletic: "Athletic", average: "Average", curvy: "Curvy", muscular: "Muscular", heavy_set: "Heavy Set", plus_size: "Plus Size" },
                education: { high_school: "High School", some_college: "Some College", associate_degree: "Associate Degree", bachelor: "Bachelor's Degree", master: "Master's Degree", phd: "PhD/Doctorate", islamic: "Islamic Studies", certification: "Professional Certification", trade_school: "Trade School", other: "Other" },
                work_status: { working: "Working", not_working: "Not Working" },
                housing: { own_house: "Own House", own_apartment: "Own Apartment", rent_apartment: "Rent Apartment", rent_house: "Rent House", family_home: "Family Home", shared: "Shared Accommodation", shared_accommodation: "Shared Accommodation", other: "Other" },
                living: { with_parents: "Living with Parents", alone: "Living Alone", with_children: "Living with Children" },
                languages: { arabic: "Arabic", english: "English", turkish: "Turkish", russian: "Russian", spanish: "Spanish", french: "French", urdu: "Urdu" }
            }
        }
    },
    ar: {
        admin: {
            user_packages: {
                title: "الباقات",
                filters: {
                    search_label: "بحث",
                    search_placeholder: "ابحث بالمستخدم، النوع، الاسم...",
                    package_label: "الباقة",
                    active_label: "نشطة",
                    lifetime_label: "مدى الحياة",
                    updated_label: "آخر تحديث",
                    all: "الكل",
                    all_time: "كل الوقت",
                    today: "اليوم",
                    last_7_days: "آخر 7 أيام",
                    last_30_days: "آخر 30 يوماً",
                    active: "نشطة",
                    inactive: "غير نشطة"
                },
                columns: {
                    user: "المستخدم",
                    type: "نوع الباقة",
                    name: "اسم الباقة",
                    amount: "المبلغ",
                    active: "نشطة",
                    lifetime: "مدى الحياة",
                    expires: "تاريخ الانتهاء",
                    updated: "آخر تحديث",
                    actions: "الإجراءات"
                },
                no_records: "لا توجد سجلات"
            },
            package_definitions: {
                title: "تعريفات الباقات",
                packages_title: "الباقات",
                columns: {
                    id: "المعرف",
                    name: "الاسم",
                    price: "السعر (دولار)",
                    ratio: "معامل إيبويت (AZN/USD)",
                    updated: "آخر تحديث",
                    actions: "الإجراءات"
                },
                no_packages: "لا توجد باقات"
            },
            navigation: {
                dashboard: "لوحة التحكم",
                female_profiles: "الملفات النسائية",
                male_profiles: "الملفات الرجالية",
                interests: "الاهتمامات",
                meet_requests: "طلبات المقابلة",
                packages: "المدفوعات",
                user_packages: "الباقات",
                support_team: "فريق الدعم",
                admin_management: "إدارة المديرين",
                package_definitions: "تعريفات الباقات",
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
                buttons: {
                    refresh: "تحديث"
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
            // Dashboard-specific labels/messages
            dashboard_extra: {
                labels: {
                    gender: "الجنس",
                    admin: "مشرف",
                    registered: "تم التسجيل"
                },
                activity: {
                    new_user_registered: "تسجيل مستخدم جديد",
                    loading_recent: "جارٍ تحميل النشاط الأخير...",
                    no_recent: "لا يوجد نشاط حديث"
                },
                approvals: {
                    loading: "جارٍ تحميل الموافقات المعلقة...",
                    empty: "لا توجد موافقات معلقة"
                },
                time: {
                    just_now: "الآن",
                    minutes_ago: "قبل {count} دقيقة",
                    hours_ago: "قبل {count} ساعة",
                    days_ago: "قبل {count} يوم"
                }
            },
            profiles: {
                female_title: "الملفات النسائية",
                male_title: "الملفات الرجالية",
                messages: {
                    loading_female: "جارٍ تحميل الملفات النسائية...",
                    loading_male: "جارٍ تحميل الملفات الرجالية..."
                },
                filters: {
                    search_label: "بحث",
                    search_placeholder: "البحث بالاسم، البريد الإلكتروني، الموقع...",
                    status_label: "حالة الموافقة",
                    status_all: "جميع الحالات",
                    status_pending: "قيد المراجعة",
                    status_approved: "مقبول",
                    status_rejected: "مرفوض",
                    age_range: "الفئة العمرية",
                    country_label: "الدولة",
                    all_countries: "كل الدول",
                    all_ages: "كل الأعمار",
                    date_joined_label: "تاريخ الانضمام",
                    all_time: "كل الوقت",
                    today: "اليوم",
                    week: "هذا الأسبوع",
                    month: "هذا الشهر",
                    year: "هذه السنة",
                    apply_filters: "تطبيق المرشحات",
                    clear_filters: "مسح المرشحات"
                },
                actions: {
                    approve: "قبول",
                    reject: "رفض",
                    delete: "حذف",
                    view_media: "الوسائط",
                    view: "عرض",
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
                    city: "المدينة",
                    country: "الدولة",
                    status: "الحالة",
                    photos: "الصور",
                    videos: "الفيديوهات"
                },
                modal: {
                    sections: {
                        personal_information: "المعلومات الشخصية",
                        education_work: "التعليم والعمل",
                        living_situation: "ظروف السكن",
                        contact_languages: "التواصل واللغات",
                        about: "نبذة",
                        account_info: "معلومات الحساب"
                    },
                    labels: {
                        age: "العمر",
                        gender: "الجنس",
                        country: "الدولة",
                        city: "المدينة",
                        height: "الطول",
                        weight: "الوزن",
                        eye_color: "لون العين",
                        hair_color: "لون الشعر",
                        skin_tone: "لون البشرة",
                        body_type: "نوع الجسم",
                        education: "التعليم",
                        occupation: "المهنة",
                        work_status: "حالة العمل",
                        housing: "السكن",
                        living_condition: "حالة المعيشة",
                        phone: "الهاتف",
                        languages: "اللغات",
                        about_text: "نبذة",
                        public_profile: "الملف العام",
                        approval: "الموافقة",
                        joined: "تاريخ الانضمام",
                        last_updated: "آخر تحديث"
                    },
                    buttons: {
                        close: "إغلاق"
                    }
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
                edit_schedule: "تعديل الموعد",
                edit_schedule_title: "تعديل الموعد",
                labels: {
                    timezone: "المنطقة الزمنية",
                    date: "التاريخ",
                    time: "الوقت"
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
            support_team: {
                title: "فريق الدعم",
                buttons: {
                    refresh: "تحديث"
                },
                table: {
                    role: "الدور",
                    name: "الاسم",
                    mobile: "رقم الجوال",
                    email: "البريد الإلكتروني",
                    actions: "الإجراءات"
                },
                actions: {
                    edit: "تعديل"
                }
            },
            // Common labels usable across pages
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
                selected_count: "{{count}} محدد",
                yes: "نعم",
                no: "لا",
                not_specified: "غير محدد",
                cm: "سم",
                kg: "كغ"
            },
            // Profile option dictionaries used to translate values in profile modals
            profile_options: {
                gender: { male: "ذكر", female: "أنثى" },
                eye_color: { brown: "بني", black: "أسود", hazel: "عسلي", green: "أخضر", blue: "أزرق", gray: "رمادي", amber: "كهرماني", other: "أخرى" },
                hair_color: { black: "أسود", dark_brown: "بني داكن", brown: "بني", light_brown: "بني فاتح", blonde: "أشقر", red: "أحمر", gray: "رمادي", white: "أبيض", other: "أخرى" },
                skin_tone: { very_fair: "فاتح جدًا", fair: "فاتح", medium: "متوسط", olive: "قمحي", brown: "بني", dark_brown: "بني داكن", very_dark: "داكن جدًا", dark: "داكن" },
                body_type: { slim: "نحيف", athletic: "رياضي", average: "متوسط", curvy: "منحني", muscular: "عضلي", heavy_set: "ثقيل البنية", plus_size: "مقاس كبير" },
                education: { high_school: "ثانوي", some_college: "درس جامعيًا جزئيًا", associate_degree: "درجة الزمالة", bachelor: "بكالوريوس", master: "ماجستير", phd: "دكتوراه", islamic: "دراسات إسلامية", certification: "شهادة مهنية", trade_school: "مدرسة مهنية", other: "أخرى" },
                work_status: { working: "يعمل", not_working: "لا يعمل" },
                housing: { own_house: "منزل ملك", own_apartment: "شقة ملك", rent_apartment: "شقة مستأجرة", rent_house: "منزل مستأجر", family_home: "منزل العائلة", shared: "سكن مشترك", shared_accommodation: "سكن مشترك", other: "أخرى" },
                living: { with_parents: "يعيش مع الوالدين", alone: "يعيش وحيداً", with_children: "يعيش مع الأطفال" },
                languages: { arabic: "العربية", english: "الإنجليزية", turkish: "التركية", russian: "الروسية", spanish: "الإسبانية", french: "الفرنسية", urdu: "الأردية" }
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
