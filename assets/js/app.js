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
    window.openModal = (title, htmlContent, options = {}) => {
        if (modalTitle) modalTitle.textContent = title;
        if (modalBody) modalBody.innerHTML = htmlContent;
        
        const modalCard = document.querySelector('.modal-card');
        if (modalCard) {
            modalCard.style.maxWidth = options.maxWidth || '560px';
        }
        
        if (globalModal) globalModal.classList.add('active');
    };

    window.closeModal = () => {
        if (globalModal) globalModal.classList.remove('active');
    };

    // === LOAN DETAILS MODAL ===
    window.openLoanDetailsModal = async (loanId) => {
        try {
            const data = await window.api.get(`/loans/details.php?loan_id=${loanId}`);
            const { loan, settlements } = data;

            let settlementRows = settlements.length === 0
                ? '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">No settlement records found.</td></tr>'
                : settlements.map(s => {
                    let details = '';
                    if (s.settlement_type === 'walk_in_gold' || s.settlement_type === 'collateral') {
                        details = `<br><small style="color: var(--gold-primary);">`;
                        if (s.gold_type === 'refined') {
                            details += `${parseFloat(s.gold_grams_used).toFixed(2)}g (Vol: ${s.volume || '-'} | Krt: ${s.karat || '-'} | Den: ${s.density || '-'} | Lbs: ${s.pounds || '-'})`;
                        } else if (s.gold_type === 'balls') {
                            details += `${parseFloat(s.gold_grams_used).toFixed(2)}g (${s.total_blades || '-'} blades @ ₵${s.price_per_blade || '-'})`;
                        } else {
                            details += `${parseFloat(s.gold_grams_used).toFixed(2)}g of ${s.gold_type}`;
                        }
                        details += `</small>`;
                    }

                    return `
                    <tr style="border-bottom: 1px solid var(--border);">
                        <td style="padding: 12px; color: var(--text-muted);">${new Date(s.created_at).toLocaleDateString()}</td>
                        <td style="padding: 12px; text-transform: capitalize;">${s.settlement_type.replace(/_/g, ' ')}${details}</td>
                        <td style="padding: 12px; color: var(--success); font-weight: 600;">GH₵ ${parseFloat(s.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td style="padding: 12px; color: var(--text-muted);">GH₵ ${parseFloat(s.principal_after).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td style="padding: 12px;">${s.processor_name || 'N/A'}</td>
                    </tr>
                    `;
                }).join('');

            let collateralBlock = '';
            if (loan.collateral_gold_type) {
                let colStr = '';
                if (loan.collateral_gold_type === 'refined') {
                    colStr = `${parseFloat(loan.collateral_weight || 0).toFixed(2)}g (Vol: ${parseFloat(loan.collateral_volume || 0).toFixed(2)})`;
                } else if (loan.collateral_gold_type === 'balls') {
                    colStr = `${parseFloat(loan.collateral_weight || 0).toFixed(2)}g (${parseFloat(loan.collateral_blades || 0).toFixed(2)} blades)`;
                }
                collateralBlock = `
                    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed var(--border);">
                        <div style="color: var(--gold-primary); font-size: 0.85rem; text-transform: uppercase; margin-bottom: 4px;">Collateral Deposited (at issuance)</div>
                        <div style="font-size: 1.1rem; color: var(--text-main); text-transform: capitalize;">
                            <span class="material-symbols-outlined" style="font-size: 1.1rem; vertical-align: text-bottom; margin-right: 4px;">inventory_2</span>
                            ${loan.collateral_gold_type}: ${colStr}
                        </div>
                    </div>
                `;
            }

            const html = `
                <div style="display: flex; flex-direction: column; gap: 24px;">
                    <!-- Top Summary Cards -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                        <div style="background: linear-gradient(145deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.02) 100%); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 12px; padding: 20px; text-align: center;">
                            <div style="color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; font-weight: 600; margin-bottom: 8px;">Original Principal</div>
                            <div style="font-size: 1.6rem; font-weight: 700; color: var(--text-main);">GH₵ ${parseFloat(loan.original_principal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                        
                        <div style="background: ${loan.principal_amount > 0 ? 'linear-gradient(145deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%)' : 'linear-gradient(145deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)'}; border: 1px solid ${loan.principal_amount > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}; border-radius: 12px; padding: 20px; text-align: center;">
                            <div style="color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; font-weight: 600; margin-bottom: 8px;">Current Outstanding</div>
                            <div style="font-size: 1.6rem; font-weight: 700; color: ${loan.principal_amount > 0 ? 'var(--danger)' : 'var(--success)'};">GH₵ ${parseFloat(loan.principal_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>

                    <!-- Meta Data Strip -->
                    <div style="display: flex; gap: 24px; background: var(--bg-main); border: 1px solid var(--border); border-radius: 12px; padding: 16px 24px; justify-content: space-around;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 36px; height: 36px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                                <span class="material-symbols-outlined" style="font-size: 1.1rem; color: var(--info);">calendar_today</span>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Issued On</div>
                                <div style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">${new Date(loan.created_at).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 36px; height: 36px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                                <span class="material-symbols-outlined" style="font-size: 1.1rem; color: var(--info);">person</span>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Issued By</div>
                                <div style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">${loan.issuer_name || 'System'}</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 36px; height: 36px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                                <span class="material-symbols-outlined" style="font-size: 1.1rem; color: var(--info);">label</span>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Status</div>
                                <div style="font-size: 0.95rem; font-weight: 600; color: ${loan.status === 'active' ? 'var(--warning)' : 'var(--success)'}; text-transform: capitalize;">${loan.status}</div>
                            </div>
                        </div>
                    </div>

                    ${loan.notes ? `
                    <div style="background: var(--bg-card); border-left: 4px solid var(--info); border-radius: 4px 12px 12px 4px; padding: 16px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <span class="material-symbols-outlined" style="color: var(--info); font-size: 1.2rem;">edit_note</span>
                            <div style="color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; font-weight: 700;">Loan Notes</div>
                        </div>
                        <div style="font-size: 0.95rem; color: var(--text-main); line-height: 1.5; white-space: pre-wrap;">${loan.notes}</div>
                    </div>
                    ` : ''}

                    ${collateralBlock ? `
                    <div style="background: linear-gradient(145deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.02) 100%); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 20px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.05);">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            <span class="material-symbols-outlined" style="color: var(--gold-primary); font-size: 1.5rem;">inventory_2</span>
                            <div style="color: var(--gold-primary); font-size: 0.9rem; text-transform: uppercase; font-weight: 700;">Collateral Details</div>
                        </div>
                        <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-main); margin-left: 36px;">
                            ${loan.collateral_gold_type === 'refined' ? 'Refined Gold' : 'Gold Balls'}: ${loan.collateral_gold_type === 'refined' ? `${parseFloat(loan.collateral_weight || 0).toFixed(2)}g (Vol: ${parseFloat(loan.collateral_volume || 0).toFixed(2)})` : `${parseFloat(loan.collateral_weight || 0).toFixed(2)}g (${parseFloat(loan.collateral_blades || 0).toFixed(2)} blades)`}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Timeline Table -->
                    <div>
                        <h4 style="margin: 0 0 16px 0; color: var(--text-main); font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                            <span class="material-symbols-outlined" style="color: var(--info);">history</span> Settlement Timeline
                        </h4>
                        <div style="background: white; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead style="background: var(--bg-main); border-bottom: 2px solid var(--border);">
                                    <tr>
                                        <th style="padding: 16px; text-align: left; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Date</th>
                                        <th style="padding: 16px; text-align: left; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Method</th>
                                        <th style="padding: 16px; text-align: right; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Amount Paid</th>
                                        <th style="padding: 16px; text-align: right; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Balance After</th>
                                        <th style="padding: 16px; text-align: left; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Processed By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${settlements.length === 0 ? `
                                        <tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px; font-style: italic;">No settlement records found.</td></tr>
                                    ` : settlements.map(s => {
                                        let details = '';
                                        if (s.settlement_type === 'walk_in_gold' || s.settlement_type === 'collateral') {
                                            details = `<div style="font-size: 0.8rem; color: var(--gold-primary); margin-top: 4px; font-weight: 500;">`;
                                            if (s.gold_type === 'refined') {
                                                details += `${parseFloat(s.gold_grams_used).toFixed(2)}g (Vol: ${s.volume || '-'} | Krt: ${s.karat || '-'} | Den: ${s.density || '-'})`;
                                            } else if (s.gold_type === 'balls') {
                                                details += `${parseFloat(s.gold_grams_used).toFixed(2)}g (${s.total_blades || '-'} blades @ ₵${s.price_per_blade || '-'})`;
                                            } else {
                                                details += `${parseFloat(s.gold_grams_used).toFixed(2)}g of ${s.gold_type}`;
                                            }
                                            details += `</div>`;
                                        }

                                        return `
                                        <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='white'">
                                            <td style="padding: 16px; color: var(--text-muted); font-weight: 500; font-size: 0.9rem;">${new Date(s.created_at).toLocaleDateString()}</td>
                                            <td style="padding: 16px; text-transform: capitalize; color: var(--text-main); font-weight: 600;">
                                                <span style="display: flex; align-items: center; gap: 6px;">
                                                    <span class="material-symbols-outlined" style="font-size: 1.1rem; color: ${s.settlement_type === 'cash' ? 'var(--info)' : 'var(--gold-primary)'};">${s.settlement_type === 'cash' ? 'payments' : 'inventory_2'}</span>
                                                    ${s.settlement_type.replace(/_/g, ' ')}
                                                </span>
                                                ${details}
                                            </td>
                                            <td style="padding: 16px; text-align: right; color: var(--success); font-weight: 700;">GH₵ ${parseFloat(s.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td style="padding: 16px; text-align: right; color: var(--warning); font-weight: 700;">GH₵ ${parseFloat(s.principal_after).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td style="padding: 16px; color: var(--text-muted); font-size: 0.9rem;">${s.processor_name || 'System'}</td>
                                        </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            window.openModal(`Loan Details: ${loan.loan_uid || 'LN-' + loan.id}`, html, { maxWidth: '850px' });
        } catch (e) {
            window.showToast('Failed to load loan details', 'error');
        }
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
        document.getElementById('clock').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, 1000);
});
