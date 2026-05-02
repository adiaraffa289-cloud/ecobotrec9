// ==========================================================================
// EcoBottle - Script.js
// Comprehensive JavaScript with persistence, animations, and interactions
// ==========================================================================

// Global Configuration
const CONFIG = {
    POINTS_PER_BOTTLE: 5,
    EBOOK_PRICE: 100,
    ANIMATION_DURATION: 300,
    NOTIFICATION_DURATION: 3000,
    AUTO_SAVE_INTERVAL: 5000
};

// Default Users Database
const DEFAULT_USERS = [
    { name: 'Raffa', nisn: '0174346A', points: 450, bottles: 90, ebooks: 4, lastActive: new Date().toISOString() },
    { name: 'Warren', nisn: 'F1F53F6A', points: 345, bottles: 69, ebooks: 3, lastActive: new Date().toISOString() },
    { name: 'Resvan', nisn: 'RESV4N01', points: 290, bottles: 58, ebooks: 2, lastActive: new Date().toISOString() },
    { name: 'Pak Heri', nisn: 'F3B14B16', points: 180, bottles: 36, ebooks: 1, lastActive: new Date().toISOString() }
];

// ==========================================================================
// Utility Functions
// ==========================================================================

class Utils {
    // Show notification
    static showNotification(title, message, type = 'success') {
        const container = document.querySelector('.notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const iconHTML = this.getNotificationIcon(type);
        
        notification.innerHTML = `
            ${iconHTML}
            <div class="notification-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after duration
        const timeout = setTimeout(() => {
            this.removeNotification(notification);
        }, CONFIG.NOTIFICATION_DURATION);
        
        // Manual close
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(timeout);
            this.removeNotification(notification);
        });
        
        // Add animation
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
    }
    
    static removeNotification(notification) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            notification.remove();
        }, CONFIG.ANIMATION_DURATION);
    }
    
    static getNotificationIcon(type) {
        const icons = {
            success: `<div class="notification-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#10b981"/>
                    <path d="M8 12L11 15L16 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>`,
            error: `<div class="notification-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#ef4444"/>
                    <path d="M15 9L9 15M9 9L15 15" stroke="white" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </div>`,
            info: `<div class="notification-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#3b82f6"/>
                    <path d="M12 16V12M12 8H12.01" stroke="white" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </div>`,
            warning: `<div class="notification-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 20H22L12 2Z" fill="#f59e0b"/>
                    <path d="M12 18V18.01M12 10V14" stroke="white" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </div>`
        };
        return icons[type] || icons.info;
    }
    
    // Format number with commas
    static formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    // Get user initials
    static getInitials(name) {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }
    
    // Calculate rank
    static calculateRank(users, currentUser) {
        const sorted = [...users].sort((a, b) => b.points - a.points);
        return sorted.findIndex(u => u.nisn === currentUser.nisn) + 1;
    }
    
    // Animate number counting
    static animateNumber(element, start, end, duration = 1000) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 16);
    }
    
    // Debounce function
    static debounce(func, wait) {
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
    
    // Format date
    static formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Baru saja';
        if (minutes < 60) return `${minutes} menit yang lalu`;
        if (hours < 24) return `${hours} jam yang lalu`;
        if (days < 7) return `${days} hari yang lalu`;
        
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// ==========================================================================
// Local Storage Manager
// ==========================================================================

class StorageManager {
    static KEYS = {
        CURRENT_USER: 'ecobottle_current_user',
        USERS_DATA: 'ecobottle_users_data',
        USER_ACTIVITIES: 'ecobottle_user_activities',
        USER_EBOOKS: 'ecobottle_user_ebooks'
    };
    
    // Sinkronkan user dari format login.html (ecobottle_user) ke format aplikasi
    static syncUserFromLogin() {
        const savedUser = localStorage.getItem('ecobottle_user');
        if (savedUser && !localStorage.getItem(this.KEYS.CURRENT_USER)) {
            try {
                const { name, uid, loginTime } = JSON.parse(savedUser);
                const users = this.getAllUsers();
                let user = users.find(u => u.nisn === uid || u.name === name);
                
                if (!user) {
                    user = {
                        name: name,
                        nisn: uid,
                        points: 0,
                        bottles: 0,
                        ebooks: 0,
                        createdAt: loginTime || new Date().toISOString(),
                        lastActive: new Date().toISOString()
                    };
                    this.updateUserInDatabase(user);
                }
                
                this.setCurrentUser(user);
                return user;
            } catch(e) {
                console.error('Error syncing user from login:', e);
            }
        }
        return null;
    }
    
    // Get current user - FIXED dengan fallback ke ecobottle_user
    static getCurrentUser() {
        try {
            // Coba ambil dari CURRENT_USER dulu
            let userData = localStorage.getItem(this.KEYS.CURRENT_USER);
            
            // Jika tidak ada, coba sinkron dari ecobottle_user (dari login.html)
            if (!userData) {
                const syncedUser = this.syncUserFromLogin();
                if (syncedUser) return syncedUser;
            } else {
                return JSON.parse(userData);
            }
            
            return null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }
    
    // Set current user
    static setCurrentUser(user) {
        try {
            localStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(user));
            this.updateUserInDatabase(user);
        } catch (error) {
            console.error('Error setting current user:', error);
        }
    }
    
    // Get all users
    static getAllUsers() {
        try {
            const usersData = localStorage.getItem(this.KEYS.USERS_DATA);
            if (usersData) {
                return JSON.parse(usersData);
            } else {
                // Initialize with default users
                this.setAllUsers(DEFAULT_USERS);
                return DEFAULT_USERS;
            }
        } catch (error) {
            console.error('Error getting all users:', error);
            return DEFAULT_USERS;
        }
    }
    
    // Set all users
    static setAllUsers(users) {
        try {
            localStorage.setItem(this.KEYS.USERS_DATA, JSON.stringify(users));
        } catch (error) {
            console.error('Error setting all users:', error);
        }
    }
    
    // Update user in database
    static updateUserInDatabase(updatedUser) {
        try {
            const users = this.getAllUsers();
            const userIndex = users.findIndex(u => u.nisn === updatedUser.nisn);
            
            if (userIndex !== -1) {
                users[userIndex] = { ...updatedUser, lastActive: new Date().toISOString() };
            } else {
                users.push({ ...updatedUser, lastActive: new Date().toISOString() });
            }
            
            this.setAllUsers(users);
        } catch (error) {
            console.error('Error updating user in database:', error);
        }
    }
    
    // Get user activities
    static getUserActivities(nisn) {
        try {
            const activitiesData = localStorage.getItem(`${this.KEYS.USER_ACTIVITIES}_${nisn}`);
            return activitiesData ? JSON.parse(activitiesData) : [];
        } catch (error) {
            console.error('Error getting user activities:', error);
            return [];
        }
    }
    
    // Add user activity
    static addUserActivity(nisn, activity) {
        try {
            const activities = this.getUserActivities(nisn);
            activities.unshift({
                ...activity,
                timestamp: new Date().toISOString(),
                id: Date.now()
            });
            
            // Keep only last 50 activities
            const trimmedActivities = activities.slice(0, 50);
            localStorage.setItem(`${this.KEYS.USER_ACTIVITIES}_${nisn}`, JSON.stringify(trimmedActivities));
        } catch (error) {
            console.error('Error adding user activity:', error);
        }
    }
    
    // Get user ebooks
    static getUserEbooks(nisn) {
        try {
            const ebooksData = localStorage.getItem(`${this.KEYS.USER_EBOOKS}_${nisn}`);
            return ebooksData ? JSON.parse(ebooksData) : [];
        } catch (error) {
            console.error('Error getting user ebooks:', error);
            return [];
        }
    }
    
    // Add user ebook
    static addUserEbook(nisn, ebook) {
        try {
            const ebooks = this.getUserEbooks(nisn);
            ebooks.push({
                ...ebook,
                redeemedAt: new Date().toISOString(),
                id: Date.now()
            });
            localStorage.setItem(`${this.KEYS.USER_EBOOKS}_${nisn}`, JSON.stringify(ebooks));
        } catch (error) {
            console.error('Error adding user ebook:', error);
        }
    }
    
    // Logout
    static logout() {
        try {
            localStorage.removeItem(this.KEYS.CURRENT_USER);
            localStorage.removeItem('ecobottle_user');
            sessionStorage.removeItem('ecobottle_logged_in');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }
}

// ==========================================================================
// Authentication Manager
// ==========================================================================

class AuthManager {
    static login(name, nisn) {
        // Validate input
        if (!name || !nisn) {
            Utils.showNotification('Error', 'Nama dan NISN harus diisi', 'error');
            return false;
        }
        
        // Check if user exists
        const users = StorageManager.getAllUsers();
        let user = users.find(u => u.nisn === nisn);
        
        if (!user) {
            // Create new user
            user = {
                name: name,
                nisn: nisn,
                points: 0,
                bottles: 0,
                ebooks: 0,
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString()
            };
            
            StorageManager.updateUserInDatabase(user);
            Utils.showNotification('Selamat Datang!', `Akun baru berhasil dibuat untuk ${name}`, 'success');
        } else {
            // Update existing user name if different
            if (user.name !== name) {
                user.name = name;
                StorageManager.updateUserInDatabase(user);
            }
            Utils.showNotification('Selamat Datang Kembali!', `Halo ${name}!`, 'success');
        }
        
        // Set current user
        StorageManager.setCurrentUser(user);
        
        // Simpan juga ke format ecobottle_user untuk kompatibilitas
        localStorage.setItem('ecobottle_user', JSON.stringify({
            name: user.name,
            uid: user.nisn,
            loginTime: new Date().toISOString()
        }));
        
        // Set sessionStorage
        sessionStorage.setItem('ecobottle_logged_in', 'true');
        
        // Add activity
        StorageManager.addUserActivity(nisn, {
            type: 'login',
            title: 'Login ke Sistem',
            description: 'Berhasil masuk ke akun EcoBottle'
        });
        
        // Redirect to index
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
        return true;
    }
    
    static logout() {
        const currentUser = StorageManager.getCurrentUser();
        
        if (currentUser) {
            StorageManager.addUserActivity(currentUser.nisn, {
                type: 'logout',
                title: 'Logout dari Sistem',
                description: 'Keluar dari akun EcoBottle'
            });
        }
        
        StorageManager.logout();
        Utils.showNotification('Logout Berhasil', 'Anda telah keluar dari akun', 'info');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }
    
    static checkAuth() {
        const currentUser = StorageManager.getCurrentUser();
        const currentPage = window.location.pathname;
        const isLoginPage = currentPage.includes('login.html');
        
        // Jika ada user yang login
        if (currentUser) {
            // Set sessionStorage untuk mempertahankan session
            sessionStorage.setItem('ecobottle_logged_in', 'true');
            
            // Jika di halaman login, redirect ke index
            if (isLoginPage) {
                window.location.href = 'index.html';
                return false;
            }
            return true;
        }
        
        // Jika tidak ada user yang login
        if (!isLoginPage) {
            window.location.href = 'login.html';
            return false;
        }
        
        return true;
    }
}

// ==========================================================================
// UI Manager
// ==========================================================================

class UIManager {
    // Update user display
    static updateUserDisplay() {
        const currentUser = StorageManager.getCurrentUser();
        if (!currentUser) return;
        
        // Update user name
        const userNameElements = document.querySelectorAll('#userName');
        userNameElements.forEach(el => el.textContent = currentUser.name);
        
        // Update NISN
        const userNISNElements = document.querySelectorAll('#userNISN');
        userNISNElements.forEach(el => el.textContent = currentUser.nisn);
        
        // Update initials
        const userInitialElements = document.querySelectorAll('#userInitial');
        userInitialElements.forEach(el => el.textContent = Utils.getInitials(currentUser.name));
        
        // Update points
        const pointsElements = document.querySelectorAll('#totalPoints, #userPoints, #currentProgress');
        pointsElements.forEach(el => {
            if (el) {
                const currentValue = parseInt(el.textContent) || 0;
                if (currentValue !== currentUser.points) {
                    Utils.animateNumber(el, currentValue, currentUser.points);
                } else {
                    el.textContent = currentUser.points;
                }
            }
        });
        
        // Update bottles
        const bottlesElements = document.querySelectorAll('#totalBottles');
        bottlesElements.forEach(el => {
            if (el) {
                const currentValue = parseInt(el.textContent) || 0;
                if (currentValue !== currentUser.bottles) {
                    Utils.animateNumber(el, currentValue, currentUser.bottles);
                } else {
                    el.textContent = currentUser.bottles;
                }
            }
        });
        
        // Update ebooks
        const ebooksElements = document.querySelectorAll('#ebooksRedeemed');
        ebooksElements.forEach(el => {
            if (el) el.textContent = currentUser.ebooks;
        });
        
        // Update rank
        const rankElements = document.querySelectorAll('#userRank');
        if (rankElements.length > 0) {
            const users = StorageManager.getAllUsers();
            const rank = Utils.calculateRank(users, currentUser);
            rankElements.forEach(el => el.textContent = rank);
        }
        
        // Update progress bar
        this.updateProgressBar(currentUser.points);
        
        // Update points needed
        const pointsNeededEl = document.getElementById('pointsNeeded');
        if (pointsNeededEl) {
            const pointsNeeded = Math.max(0, CONFIG.EBOOK_PRICE - (currentUser.points % CONFIG.EBOOK_PRICE));
            pointsNeededEl.textContent = pointsNeeded;
        }
    }
    
    // Update progress bar
    static updateProgressBar(points) {
        const progressFill = document.getElementById('progressFill');
        if (!progressFill) return;
        
        const progress = (points % CONFIG.EBOOK_PRICE) / CONFIG.EBOOK_PRICE * 100;
        progressFill.style.width = `${progress}%`;
    }
    
    // Initialize hamburger menu
    static initHamburgerMenu() {
        const hamburger = document.getElementById('ecobHamburger') || document.getElementById('hamburger');
        const mobileMenu = document.getElementById('ecobMobileMenu') || document.getElementById('mobileMenu');
        
        if (!hamburger || !mobileMenu) return;
        
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('open');
            
            // Prevent body scroll when menu is open
            if (mobileMenu.classList.contains('open')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('open');
                document.body.style.overflow = '';
            }
        });
        
        // Close menu when clicking a link
        const mobileLinks = mobileMenu.querySelectorAll('.ecob-mobile-link, .mobile-link');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }
    
    // Initialize counter animations
    static initCounterAnimations() {
        const counters = document.querySelectorAll('.stat-number[data-target]');
        
        const animateCounters = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.getAttribute('data-target'));
                    Utils.animateNumber(counter, 0, target, 2000);
                    observer.unobserve(counter);
                }
            });
        };
        
        const observer = new IntersectionObserver(animateCounters, {
            threshold: 0.5
        });
        
        counters.forEach(counter => observer.observe(counter));
    }
    
    // Initialize smooth scrolling
    static initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
}

// ==========================================================================
// Login Page Handler
// ==========================================================================

class LoginPageHandler {
    static init() {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;
        
        // Handle login form submission
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const nisn = document.getElementById('nisn').value.trim().toUpperCase();
            
            AuthManager.login(username, nisn);
        });
        
        // Handle demo account buttons
        const demoBtns = document.querySelectorAll('.demo-btn');
        demoBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.getAttribute('data-name');
                const nisn = btn.getAttribute('data-nisn');
                
                document.getElementById('username').value = name;
                document.getElementById('nisn').value = nisn;
                
                // Auto submit after short delay
                setTimeout(() => {
                    AuthManager.login(name, nisn);
                }, 300);
            });
        });
        
        // Add input animations
        const inputs = loginForm.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('focus', (e) => {
                e.target.parentElement.style.transform = 'scale(1.02)';
                e.target.parentElement.style.transition = 'transform 0.2s ease';
            });
            
            input.addEventListener('blur', (e) => {
                e.target.parentElement.style.transform = 'scale(1)';
            });
        });
    }
}

// ==========================================================================
// Account Page Handler
// ==========================================================================

class AccountPageHandler {
    static init() {
        // Update user display
        UIManager.updateUserDisplay();
        
        // Handle logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Apakah Anda yakin ingin keluar?')) {
                    AuthManager.logout();
                }
            });
        }
        
        // Handle add bottle button
        const addBottleBtn = document.getElementById('addBottleBtn');
        if (addBottleBtn) {
            addBottleBtn.addEventListener('click', () => {
                this.addBottle();
            });
        }
        
        // Handle recycle more button
        const recycleMoreBtn = document.getElementById('recycleMoreBtn');
        if (recycleMoreBtn) {
            recycleMoreBtn.addEventListener('click', () => {
                this.addBottle();
            });
        }
        
        // Load activities
        this.loadActivities();
    }
    
    static addBottle() {
        const currentUser = StorageManager.getCurrentUser();
        if (!currentUser) return;
        
        // Update user data
        currentUser.points += CONFIG.POINTS_PER_BOTTLE;
        currentUser.bottles += 1;
        
        // Save to storage
        StorageManager.setCurrentUser(currentUser);
        
        // Add activity
        StorageManager.addUserActivity(currentUser.nisn, {
            type: 'recycle',
            title: 'Mendaur Ulang Botol',
            description: `+${CONFIG.POINTS_PER_BOTTLE} poin dari 1 botol plastik`
        });
        
        // Show notification
        Utils.showNotification(
            'Botol Berhasil Ditambahkan!',
            `+${CONFIG.POINTS_PER_BOTTLE} poin. Total: ${currentUser.points} poin`,
            'success'
        );
        
        // Update UI
        UIManager.updateUserDisplay();
        this.loadActivities();
        
        // Add celebration animation
        this.celebratePoints();
    }
    
    static celebratePoints() {
        // Add confetti or celebration animation
        const addBottleBtn = document.getElementById('addBottleBtn');
        if (addBottleBtn) {
            addBottleBtn.style.transform = 'scale(1.1)';
            setTimeout(() => {
                addBottleBtn.style.transform = 'scale(1)';
            }, 200);
        }
    }
    
    static loadActivities() {
        const currentUser = StorageManager.getCurrentUser();
        if (!currentUser) return;
        
        const activityList = document.getElementById('activityList');
        if (!activityList) return;
        
        const activities = StorageManager.getUserActivities(currentUser.nisn);
        
        if (activities.length === 0) {
            activityList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-gray);">
                    <p>Belum ada aktivitas</p>
                </div>
            `;
            return;
        }
        
        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    ${this.getActivityIcon(activity.type)}
                </div>
                <div class="activity-details">
                    <h4>${activity.title}</h4>
                    <p>${activity.description}</p>
                </div>
                <div class="activity-time">${Utils.formatDate(activity.timestamp)}</div>
            </div>
        `).join('');
    }
    
    static getActivityIcon(type) {
        const icons = {
            recycle: '♻️',
            ebook: '📚',
            login: '🔐',
            logout: '👋',
            achievement: '🏆'
        };
        return icons[type] || '📌';
    }
}

// ==========================================================================
// Leaderboard Page Handler
// ==========================================================================

class LeaderboardPageHandler {
    static init() {
        this.loadLeaderboard();
        this.updateYourRank();
    }
    
    static loadLeaderboard() {
        const tableBody = document.querySelector('#leaderboardTable tbody');
        if (!tableBody) return;
        
        const users = StorageManager.getAllUsers();
        const sortedUsers = [...users].sort((a, b) => b.points - a.points);
        
        // Skip top 3 as they're in the podium
        const tableUsers = sortedUsers.slice(3);
        
        tableBody.innerHTML = tableUsers.map((user, index) => {
            const rank = index + 4; // Starting from 4th place
            const bottles = user.bottles || 0;
            const ebooks = user.ebooks || 0;
            
            return `
                <tr>
                    <td>${rank}</td>
                    <td>${user.name}</td>
                    <td>${user.nisn}</td>
                    <td>${Utils.formatNumber(user.points)}</td>
                    <td>${Utils.formatNumber(bottles)}</td>
                    <td>${ebooks}</td>
                </tr>
            `;
        }).join('');
    }
    
    static updateYourRank() {
        const currentUser = StorageManager.getCurrentUser();
        if (!currentUser) return;
        
        const yourRankCard = document.getElementById('yourRankCard');
        if (!yourRankCard) return;
        
        const users = StorageManager.getAllUsers();
        const rank = Utils.calculateRank(users, currentUser);
        
        // Update rank display
        const rankNumber = yourRankCard.querySelector('.rank-position .rank-number');
        const rankValue1 = yourRankCard.querySelectorAll('.rank-stat .rank-value')[0];
        const rankValue2 = yourRankCard.querySelectorAll('.rank-stat .rank-value')[1];
        
        if (rankNumber) rankNumber.textContent = rank;
        if (rankValue1) rankValue1.textContent = Utils.formatNumber(currentUser.points);
        if (rankValue2) rankValue2.textContent = Utils.formatNumber(currentUser.bottles || 0);
    }
}

// ==========================================================================
// Ebook Page Handler
// ==========================================================================

class EbookPageHandler {
    // Database buku dengan link download
    static BOOKS_DATABASE = {
        'b1': { title: 'Soal TKA MTK Paket C (Tanpa Pembahasan)', price: 50, driveLink: 'https://drive.google.com/uc?export=download&id=1mu0wJlqCEhaBZ04baA40pPpbO1BIzNWV' },
        'b2': { title: 'Atomic Habits', price: 100, driveLink: 'https://drive.google.com/uc?export=download&id=1VxWGQeIj3jFFd8Eyr0QcbKji_fEYqoJW' },
        'b3': { title: 'Bumi', price: 100, driveLink: 'https://drive.google.com/uc?export=download&id=1eN6XfqxOIqQQoFCTyCUm6VtI6jlKBYLA' },
        'b4': { title: 'Komet', price: 100, driveLink: 'https://drive.google.com/uc?export=download&id=1B1Pzw_zHNTMqWy0YuH-Xw6yy4yTMaijg' },
        'b5': { title: 'Bintang', price: 100, driveLink: 'https://drive.google.com/uc?export=download&id=1tg2D8ffDroonqYkhYFMUlyH8ppyFOaJY' },
        'b6': { title: 'Matahari', price: 100, driveLink: 'https://drive.google.com/uc?export=download&id=1hvc-91AFdWmD0GJBSM6xiqrC4DsauGln' },
        'b7': { title: 'Komet Minor', price: 100, driveLink: 'https://drive.google.com/uc?export=download&id=15YEVA91mPPGxrPBUVZP_Cto27U4QYpdR' },
        'b8': { title: 'Si Putih', price: 100, driveLink: 'https://drive.google.com/uc?export=download&id=1-yZqx-LiezIGY1UFMQpdUwDeDivFd7FA' },
        'b9': { title: 'Laut Bercerita', price: 100, driveLink: 'https://drive.google.com/uc?export=download&id=148-LilFYieS7docT4IWDn9Dh2x_fGEdn' },
        'b10': { title: 'Filosofi Teras', price: 100, driveLink: 'https://drive.google.com/uc?export=download&id=1hIpQDYdx8ZuzhOqVgqszMfaU8VJgYeB2' },
        'b11': { title: 'Lukacita', price: 100, driveLink: 'https://drive.google.com/uc?export=download&id=1Yc7o3bA1FfYVawFl8biZiEH2QDJSdu4F' },
        'b12': { title: 'Legendary', price: 100, driveLink: 'https://drive.google.com/uc?export=download&id=15_224BwDSAcxmj_PLUVKcWe_x98_jzt9' },
        'b13': { title: 'Si Anak Badai', price: 100, driveLink: 'https://drive.google.com/uc?export=download&id=15MYgsvw2f4YzwXawkJB18zqbiN4B-7eU' },
        'b14': { title: 'Soal TKA MTK Paket A', price: 100, driveLink: 'https://drive.google.com/uc?export=download&id=1HG0GhZ_2TiW9mvJHBPY99-odB3WppYYh' },
        'b15': { title: 'SagaraS', price: 100, driveLink: 'https://drive.google.com/uc?export=download&id=1ymnsPgNN-O6XlbujZCyMSHnJ-mcGytgE' },
        'b16': { title: 'Seorang Pria yang Melalui Duka', price: 100, driveLink: 'https://drive.google.com/uc?export=download&id=19bk20Va_NLjYbtOzaGujXdbEc7GmILiy' },
        'b17': { title: 'Surat Untuk Jenaka', price: 100, driveLink: 'https://drive.google.com/uc?export=download&id=1g5XsYMkGjD-koDtevHwXFupefudeDPve' },
        'b18': { title: 'Tentang Kamu', price: 100, driveLink: 'https://drive.google.com/uc?export=download&id=1u7BI0lvBUpCnJ9t02AyiLPelaqpRaLaK' },
        'b19': { title: 'Rasa', price: 150, driveLink: 'https://drive.google.com/uc?export=download&id=1-MHO6-qLOqXggDdWOaUFrLQMnm53Isqp' },
        'b20': { title: 'Soal TKA MTK Paket B', price: 150, driveLink: 'https://drive.google.com/uc?export=download&id=1b7NqWWZTHMBqdahE_JIZYxxxWeT2_BJh' },
        'b21': { title: 'Materi & Soal OSN IPS SMP', price: 150, driveLink: 'https://drive.google.com/uc?export=download&id=1db_GVmruFPM8tNwnxp0uZTkAqrzrDPEo' }
    };
    
    static init() {
        // Update user points display
        UIManager.updateUserDisplay();
        
        // Initialize category filter
        this.initCategoryFilter();
        
        // Initialize redeem buttons
        this.initRedeemButtons();
        
        // Update button states based on ownership
        this.updateButtonStates();
    }
    
    static initCategoryFilter() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const ebookCards = document.querySelectorAll('.ebook-card');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Filter ebooks
                const category = btn.getAttribute('data-category');
                
                ebookCards.forEach(card => {
                    if (category === 'semua' || card.getAttribute('data-category') === category) {
                        card.style.display = 'block';
                        // Add fade in animation
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            card.style.transition = 'all 0.3s ease';
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 10);
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }
    
    static initRedeemButtons() {
        const redeemBtns = document.querySelectorAll('.btn-redeem');
        
        redeemBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const bookId = btn.getAttribute('data-book-id');
                this.handleEbookAction(bookId, btn);
            });
        });
    }
    
    static updateButtonStates() {
        const currentUser = StorageManager.getCurrentUser();
        if (!currentUser) return;
        
        const userEbooks = StorageManager.getUserEbooks(currentUser.nisn);
        const ownedBookIds = userEbooks.map(e => e.bookId);
        
        const redeemBtns = document.querySelectorAll('.btn-redeem');
        redeemBtns.forEach(btn => {
            const bookId = btn.getAttribute('data-book-id');
            if (ownedBookIds.includes(bookId)) {
                btn.textContent = 'Dimiliki';
                btn.classList.add('btn-owned');
                btn.style.background = '#6b7280';
                btn.style.cursor = 'default';
            }
        });
    }
    
    static handleEbookAction(bookId, btn) {
        const currentUser = StorageManager.getCurrentUser();
        if (!currentUser) return;
        
        const book = this.BOOKS_DATABASE[bookId];
        if (!book) return;
        
        // Check if already owned
        const userEbooks = StorageManager.getUserEbooks(currentUser.nisn);
        const isOwned = userEbooks.some(e => e.bookId === bookId);
        
        if (isOwned) {
            // Download the ebook
            this.downloadEbook(book.driveLink, book.title);
            Utils.showNotification(
                'Download Dimulai',
                `Mengunduh "${book.title}"...`,
                'info'
            );
        } else {
            // Redeem the ebook
            this.redeemEbook(bookId, book.title, book.price, book.driveLink, btn);
        }
    }
    
    static redeemEbook(bookId, title, price, driveLink, btn) {
        const currentUser = StorageManager.getCurrentUser();
        if (!currentUser) return;
        
        // Check if user has enough points
        if (currentUser.points < price) {
            Utils.showNotification(
                'Poin Tidak Cukup',
                `Anda membutuhkan ${price - currentUser.points} poin lagi untuk menukar ebook ini`,
                'warning'
            );
            return;
        }
        
        // Confirm redemption
        if (!confirm(`Tukar "${title}" dengan ${price} poin?\n\nEbook akan otomatis didownload setelah penukaran.`)) {
            return;
        }
        
        // Update user data
        currentUser.points -= price;
        currentUser.ebooks = (currentUser.ebooks || 0) + 1;
        
        // Save to storage
        StorageManager.setCurrentUser(currentUser);
        
        // Add ebook to user's collection
        StorageManager.addUserEbook(currentUser.nisn, {
            bookId: bookId,
            title: title,
            price: price,
            driveLink: driveLink
        });
        
        // Add activity
        StorageManager.addUserActivity(currentUser.nisn, {
            type: 'ebook',
            title: 'Menukar Ebook',
            description: `Menukar "${title}" dengan ${price} poin`
        });
        
        // Update button
        btn.textContent = 'Dimiliki';
        btn.classList.add('btn-owned');
        btn.style.background = '#6b7280';
        btn.style.cursor = 'default';
        
        // Show notification
        Utils.showNotification(
            'Ebook Berhasil Ditukar!',
            `"${title}" telah ditambahkan ke koleksi Anda`,
            'success'
        );
        
        // Download the ebook
        setTimeout(() => {
            this.downloadEbook(driveLink, title);
            Utils.showNotification(
                'Download Dimulai',
                `Mengunduh "${title}"...`,
                'info'
            );
        }, 1000);
        
        // Update UI
        UIManager.updateUserDisplay();
    }
    
    static downloadEbook(driveLink, title) {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = driveLink;
        link.download = `${title}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// ==========================================================================
// Page-specific Initializations
// ==========================================================================

class PageManager {
    static init() {
        // Sinkronkan user dari login.html terlebih dahulu
        StorageManager.syncUserFromLogin();
        
        // Check authentication for all pages except login
        if (!window.location.pathname.includes('login.html')) {
            if (!AuthManager.checkAuth()) return;
        }
        
        // Initialize common UI elements
        UIManager.initHamburgerMenu();
        UIManager.initCounterAnimations();
        UIManager.initSmoothScroll();
        
        // Initialize page-specific handlers
        const pathname = window.location.pathname;
        
        if (pathname.includes('login.html')) {
            LoginPageHandler.init();
        } else if (pathname.includes('account.html')) {
            AccountPageHandler.init();
        } else if (pathname.includes('leaderboard.html')) {
            LeaderboardPageHandler.init();
        } else if (pathname.includes('ebook.html') || pathname.includes('EBOOK.html')) {
            EbookPageHandler.init();
        } else {
            // For other pages (index, about), just update user display
            UIManager.updateUserDisplay();
        }
    }
}

// ==========================================================================
// Initialize on DOM Load
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    PageManager.init();
});

// ==========================================================================
// Auto-save interval
// ==========================================================================

setInterval(() => {
    const currentUser = StorageManager.getCurrentUser();
    if (currentUser) {
        // Update last active timestamp
        currentUser.lastActive = new Date().toISOString();
        StorageManager.setCurrentUser(currentUser);
    }
}, CONFIG.AUTO_SAVE_INTERVAL);

// ==========================================================================
// Export for debugging (optional)
// ==========================================================================

window.EcoBottle = {
    Utils,
    StorageManager,
    AuthManager,
    UIManager,
    CONFIG
};