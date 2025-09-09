// Admin Panel Common JavaScript

// Initialize Supabase client
const SUPABASE_URL = 'https://rpzkugodaacelruquhtc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwemt1Z29kYWFjZWxydXF1aHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyOTIwNTQsImV4cCI6MjA3MDg2ODA1NH0.NEPLSSs8JG4LK-RwJWI3GIg9hwzQLMXyllVF3Fv3yCE';


const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Expose client globally for other pages/scripts
window.supabaseClient = supabase;

// Global variables
let currentAdmin = null;
let supabaseSession = null;

// Helper to detect login page
function isLoginPage() {
    try {
        const path = (window.location && window.location.pathname) || '';
        return path.endsWith('/admin.html') || path.endsWith('admin.html') || path.endsWith('/admin') || path.endsWith('/admin/');
    } catch {
        return false;
    }
}

// Authentication check (skip on login page)
document.addEventListener('DOMContentLoaded', function() {
    if (!isLoginPage()) {
        checkAuth();
    }
});

async function checkAuth() {
    const adminAuth = localStorage.getItem('adminAuth');
    const adminUser = localStorage.getItem('adminUser');
    const demoMode = localStorage.getItem('demoMode');
    
    if (!adminAuth || adminAuth !== 'true' || !adminUser) {
        redirectToLogin();
        return;
    }
    
    try {
        currentAdmin = JSON.parse(adminUser);
        
        // Always verify with real database
        
        // Real auth mode: rehydrate or fetch fresh session
        const stored = localStorage.getItem('supabaseSession');
        if (stored) {
            supabaseSession = JSON.parse(stored);
            if (supabaseSession && supabaseSession.access_token && supabaseSession.refresh_token) {
                await supabase.auth.setSession({
                    access_token: supabaseSession.access_token,
                    refresh_token: supabaseSession.refresh_token
                });
            }
        }

        // Ensure we actually have a valid session
        const { data: sessionResult } = await supabase.auth.getSession();
        if (!sessionResult || !sessionResult.session) {
            logout();
            return;
        }
        supabaseSession = sessionResult.session;
        localStorage.setItem('supabaseSession', JSON.stringify(supabaseSession));
        
        // Verify admin is still approved
        const { data: adminCheck, error } = await supabase
            .from('admin_users')
            .select('is_approved, is_super_admin')
            .eq('id', currentAdmin.id)
            .single();
            
        if (error || !adminCheck || !adminCheck.is_approved) {
            console.error('Admin verification failed:', error);
            logout();
            return;
        }
        
        // Update current admin data
        currentAdmin.is_super_admin = adminCheck.is_super_admin;
        localStorage.setItem('adminUser', JSON.stringify(currentAdmin));
        
    } catch (error) {
        console.error('Auth check error:', error);
        // Always logout on error
        logout();
    }
}

function getLoginUrl() {
    try {
        const path = (window.location && window.location.pathname) || '';
        return path.includes('.html') ? '/admin.html' : '/admin';
    } catch {
        return '/admin';
    }
}

function redirectToLogin() {
    if (!isLoginPage()) {
        window.location.href = getLoginUrl();
    }
}

function loadAdminInfo() {
    if (currentAdmin) {
        const adminNameEl = document.getElementById('adminName');
        const adminRoleEl = document.getElementById('adminRole');
        
        if (adminNameEl) {
            adminNameEl.textContent = `${currentAdmin.first_name} ${currentAdmin.last_name}`;
        }
        
        if (adminRoleEl) {
            adminRoleEl.textContent = currentAdmin.is_super_admin ? 'Super Admin' : 'Admin';
        }
    }
}

async function logout() {
    try {
        // Sign out from Supabase
        await supabase.auth.signOut();
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    // Clear local storage
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('supabaseSession');
    
    // Redirect to login
    window.location.href = getLoginUrl();
}

// Keep session in sync and handle refresh failures
supabase.auth.onAuthStateChange((event, session) => {
    try {
        if (session) {
            supabaseSession = session;
            localStorage.setItem('supabaseSession', JSON.stringify(session));
        } else {
            localStorage.removeItem('supabaseSession');
        }

        if ((event === 'SIGNED_OUT' || event === 'USER_DELETED') && !isLoginPage()) {
            redirectToLogin();
        }
    } catch (err) {
        console.error('Auth state handler error:', err);
    }
});

// Global helper for handling auth issues from API calls
window.handleAuthIssue = async function(errOrMessage = 'Session issue detected') {
    try {
        let shouldLogout = false;
        let message = 'Session issue detected';

        if (typeof errOrMessage === 'object' && errOrMessage) {
            const maybeMsg = String(errOrMessage.message || '');
            const maybeCode = String(errOrMessage.code || '');
            const maybeStatus = errOrMessage.status;

            message = maybeMsg || message;

            // Consider only true auth problems as logout-worthy
            if (maybeStatus === 401 || maybeCode === '401' || /jwt|token|auth/i.test(maybeMsg)) {
                shouldLogout = true;
            }
            // 403/RLS denials should NOT log the user out
            if (maybeStatus === 403) {
                shouldLogout = false;
            }
        } else if (typeof errOrMessage === 'string') {
            message = errOrMessage;
            // If only a generic string is passed, do not force logout
            shouldLogout = false;
        } else {
            // Unknown input: be safe and logout
            shouldLogout = true;
        }

        showNotification(message, shouldLogout ? 'warning' : 'error');
        if (shouldLogout) {
            await logout();
        }
    } catch (_) {}
};

// Sidebar toggle for mobile
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function(e) {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.querySelector('.sidebar-toggle');
    
    if (window.innerWidth <= 768 && sidebar && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});

// Notification system
function showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto remove
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return formatDate(dateString);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Cache for auth emails to avoid many round trips
const __authEmailCache = new Map();

async function fetchEmailForUser(userId) {
    if (!userId) return null;
    if (__authEmailCache.has(userId)) return __authEmailCache.get(userId);
    try {
        const rpc = await window.supabaseClient.rpc('get_email_for_user', { in_user_id: userId });
        if (!rpc.error && rpc.data && typeof rpc.data.email === 'string') {
            __authEmailCache.set(userId, rpc.data.email);
            return rpc.data.email;
        }
    } catch {}
    return null;
}

function getEmailLinkHtml(email) {
    return `<a href="mailto:${email}"><i class="fas fa-envelope"></i> ${email}</a>`;
}

// Fill email placeholders inside cards
window.fillEmailsForElements = async function(rootEl = document) {
    try {
        const nodes = rootEl.querySelectorAll?.('.email-link[data-user-id]') || [];
        for (const el of nodes) {
            if (el.getAttribute('data-filled') === 'true') continue;
            const userId = el.getAttribute('data-user-id');
            const cached = __authEmailCache.get(userId);
            if (cached) {
                el.innerHTML = getEmailLinkHtml(cached);
                el.setAttribute('data-filled', 'true');
                continue;
            }
            const email = await fetchEmailForUser(userId);
            if (email) {
                el.innerHTML = getEmailLinkHtml(email);
                el.setAttribute('data-filled', 'true');
            }
        }
    } catch (e) {}
}

// Expose cached email getter for search usage
window.getCachedEmailForUser = function(userId) {
    try {
        if (!userId) return null;
        return __authEmailCache.get(userId) || null;
    } catch {
        return null;
    }
}

// Table utilities
function createPagination(currentPage, totalPages, onPageChange) {
    const pagination = document.createElement('div');
    pagination.className = 'pagination';
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = `pagination-btn ${currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => currentPage > 1 && onPageChange(currentPage - 1);
    pagination.appendChild(prevBtn);
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        const firstBtn = createPageButton(1, currentPage, onPageChange);
        pagination.appendChild(firstBtn);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            pagination.appendChild(ellipsis);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = createPageButton(i, currentPage, onPageChange);
        pagination.appendChild(pageBtn);
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            pagination.appendChild(ellipsis);
        }
        
        const lastBtn = createPageButton(totalPages, currentPage, onPageChange);
        pagination.appendChild(lastBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = `pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => currentPage < totalPages && onPageChange(currentPage + 1);
    pagination.appendChild(nextBtn);
    
    return pagination;
}

function createPageButton(pageNum, currentPage, onPageChange) {
    const btn = document.createElement('button');
    btn.className = `pagination-btn ${pageNum === currentPage ? 'active' : ''}`;
    btn.textContent = pageNum;
    btn.onclick = () => onPageChange(pageNum);
    return btn;
}

// Loading states
function showTableLoading(tableContainer, message = 'Loading...') {
    tableContainer.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>${message}</p>
        </div>
    `;
}

function showTableError(tableContainer, message = 'Error loading data') {
    tableContainer.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
            <button class="btn btn-secondary" onclick="location.reload()">
                <i class="fas fa-sync-alt"></i>
                Retry
            </button>
        </div>
    `;
}

function showTableEmpty(tableContainer, message = 'No data found') {
    tableContainer.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>${message}</p>
        </div>
    `;
}

// File upload utilities
function handleImageUpload(file, maxSize = 5 * 1024 * 1024) { // 5MB default
    return new Promise((resolve, reject) => {
        if (!file) {
            reject('No file selected');
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            reject('Please select an image file');
            return;
        }
        
        if (file.size > maxSize) {
            reject(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject('Error reading file');
        reader.readAsDataURL(file);
    });
}

// Confirm dialogs
function confirmAction(message, onConfirm, onCancel = null) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Confirm Action</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancelBtn">Cancel</button>
                    <button class="btn btn-danger" id="confirmBtn">Confirm</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const confirmBtn = modal.querySelector('#confirmBtn');
    const cancelBtn = modal.querySelector('#cancelBtn');
    
    confirmBtn.onclick = () => {
        modal.remove();
        onConfirm();
    };
    
    cancelBtn.onclick = () => {
        modal.remove();
        if (onCancel) onCancel();
    };
    
    // Close on overlay click
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
            if (onCancel) onCancel();
        }
    };
}

// Export utilities
function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        showNotification('No data to export', 'warning');
        return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            const value = row[header];
            // Escape commas and quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
}

// Initialize common functionality
document.addEventListener('DOMContentLoaded', function() {
    // Set active navigation
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.closest('.nav-item').classList.add('active');
        }
    });
    
    // Handle responsive sidebar
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.remove('open');
        }
    }
});

// Resize handler
window.addEventListener('resize', function() {
    const sidebar = document.querySelector('.sidebar');
    if (window.innerWidth > 768 && sidebar) {
        sidebar.classList.remove('open');
    }
});
