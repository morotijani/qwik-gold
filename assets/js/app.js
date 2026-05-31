// assets/js/app.js

/**
 * Main Application Logic & Router
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // Core Elements
    const loginOverlay = document.getElementById('login-overlay');
    const appShell = document.getElementById('app-shell');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const viewContainer = document.getElementById('view-container');
    const toastContainer = document.getElementById('toast-container');

    // Modal Elements
    const globalModal = document.getElementById('global-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    // User Profile Elements
    const userNameEl = document.getElementById('current-user-name');
    const userRoleEl = document.getElementById('current-user-role');
    const adminNav = document.getElementById('admin-nav');

    // === GLOBAL TOAST NOTIFICATIONS ===
    window.showToast = (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'info';
        if (type === 'success') icon = 'check_circle';
        if (type === 'error') icon = 'error';

        toast.innerHTML = `<span class="material-symbols-outlined">${icon}</span> <span>${message}</span>`;
        toastContainer.appendChild(toast);

        // Remove after 4 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    };

    // === MODAL SYSTEM ===
    window.openModal = (title, htmlContent) => {
        if(modalTitle) modalTitle.textContent = title;
        if(modalBody) modalBody.innerHTML = htmlContent;
        if(globalModal) globalModal.classList.add('active');
    };

    window.closeModal = () => {
        if(globalModal) globalModal.classList.remove('active');
    };

    // === AUTHENTICATION FLOW ===
    
    // Check initial state
    const checkAuth = () => {
        const token = window.api.token;
        const userJson = localStorage.getItem('qwik_gold_user');
        
        if (token && userJson) {
            const user = JSON.parse(userJson);
            showAppShell(user);
        } else {
            showLogin();
        }
    };

    const showLogin = () => {
        loginOverlay.classList.add('active');
        appShell.classList.add('hidden');
    };

    const showAppShell = (user) => {
        loginOverlay.classList.remove('active');
        appShell.classList.remove('hidden');
        
        // Populate User Info
        userNameEl.textContent = user.name;
        userRoleEl.textContent = user.role;
        
        if (user.role === 'admin') {
            adminNav.classList.remove('hidden');
        } else {
            adminNav.classList.add('hidden');
        }

        // Trigger initial route
        handleRouting();
    };

    // Handle Login Form Submit
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const btn = loginForm.querySelector('button');
        
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Authenticating...';

        try {
            const data = await window.api.post('/auth/login.php', {
                username: usernameInput.value,
                password: passwordInput.value
            });
            
            // Save Token & User
            window.api.setToken(data.token);
            localStorage.setItem('qwik_gold_user', JSON.stringify(data.user));
            
            showToast('Login successful', 'success');
            showAppShell(data.user);
            
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span>Authenticate</span> <span class="material-symbols-outlined">arrow_forward</span>';
        }
    });

    // Handle Logout Action
    logoutBtn.addEventListener('click', () => {
        window.api.clearSession();
    });

    // Listen for global logout events (like 401s from the API)
    window.addEventListener('auth-logout', () => {
        showLogin();
        showToast('You have been logged out.', 'info');
    });


    // === SIMPLE ROUTER ===
    const handleRouting = () => {
        const hash = window.location.hash.substring(1) || 'dashboard';
        loadView(hash);
    };

    const loadView = (route) => {
        // Update sidebar active states
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.route === route) {
                link.classList.add('active');
            }
        });

        // Clear View Container
        viewContainer.innerHTML = '<div style="text-align:center; padding: 50px;"><span class="material-symbols-outlined spin gold-text" style="font-size: 2rem;">sync</span></div>';

        // Trigger module load event
        // E.g., modules/dashboard.js should listen for this event and inject its HTML into viewContainer
        const event = new CustomEvent('route-changed', { detail: { route, container: viewContainer } });
        window.dispatchEvent(event);
    };

    // Listen for Hash Changes
    window.addEventListener('hashchange', handleRouting);

    // Initial load
    checkAuth();

    // Clock
    setInterval(() => {
        document.getElementById('clock').textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }, 1000);
});
