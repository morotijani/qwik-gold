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

            let collateralBlock = '';
            if (loan.collateral_gold_type) {
                let colStr = '';
                if (loan.collateral_gold_type === 'refined') {
                    colStr = `<div style="display: flex; gap: 32px; margin-top: 12px;">
                        <div><span style="color:rgba(245,158,11,0.7); font-size:0.75rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Weight</span><br><span style="font-weight:800; font-size: 1.1rem; color: var(--gold-primary);">${parseFloat(loan.collateral_weight || 0).toFixed(2)}g</span></div>
                        <div><span style="color:rgba(245,158,11,0.7); font-size:0.75rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Volume</span><br><span style="font-weight:800; font-size: 1.1rem; color: var(--gold-primary);">${parseFloat(loan.collateral_volume || 0).toFixed(2)}</span></div>
                    </div>`;
                } else if (loan.collateral_gold_type === 'balls') {
                    colStr = `<div style="display: flex; gap: 32px; margin-top: 12px;">
                        <div><span style="color:rgba(245,158,11,0.7); font-size:0.75rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Weight</span><br><span style="font-weight:800; font-size: 1.1rem; color: var(--gold-primary);">${parseFloat(loan.collateral_weight || 0).toFixed(2)}g</span></div>
                        <div><span style="color:rgba(245,158,11,0.7); font-size:0.75rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Blades</span><br><span style="font-weight:800; font-size: 1.1rem; color: var(--gold-primary);">${parseFloat(loan.collateral_blades || 0).toFixed(2)}</span></div>
                    </div>`;
                }
                collateralBlock = `
                    <div style="background: linear-gradient(145deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.02) 100%); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 16px; padding: 24px; grid-column: span 3; display: flex; align-items: flex-start; gap: 20px; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
                        <div style="width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, var(--warning), #d97706); color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 16px rgba(245, 158, 11, 0.25);">
                            <span class="material-symbols-outlined" style="font-size: 1.8rem;">inventory_2</span>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 0.8rem; color: var(--warning); text-transform: uppercase; font-weight: 800; letter-spacing: 1px; margin-bottom: 4px;">Collateral Deposited</div>
                            <div style="font-size: 1.3rem; font-weight: 800; color: var(--text-main); text-transform: capitalize;">${loan.collateral_gold_type === 'refined' ? 'Refined Gold' : 'Gold Balls'}</div>
                            ${colStr}
                        </div>
                    </div>
                `;
            }

            const html = `
                <div style="display: flex; flex-direction: column;">
                    
                    <!-- Beautiful Header Banner -->
                    <div style="background: linear-gradient(135deg, var(--gold-primary), var(--bg-main)); border-radius: 20px; padding: 32px; color: white; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.15); margin-bottom: 24px; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: rgba(255,255,255,0.03); border-radius: 50%;"></div>
                        <div style="position: absolute; bottom: -30px; right: 40px; width: 120px; height: 120px; background: rgba(245,158,11,0.08); border-radius: 50%;"></div>
                        
                        <div style="position: relative; z-index: 1;">
                            <div style="font-size: 0.85rem; font-weight: 700; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Loan Reference</div>
                            <div style="font-size: 2rem; font-weight: 800; color: white; letter-spacing: -0.5px; display: flex; align-items: center; gap: 12px;">
                                ${loan.loan_uid || 'LN-' + String(loan.id).padStart(6, '0')}
                                <span style="font-size: 0.75rem; padding: 6px 12px; border-radius: 20px; font-weight: 800; background: ${loan.status === 'active' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}; color: ${loan.status === 'active' ? '#fde68a' : '#a7f3d0'}; border: 1px solid ${loan.status === 'active' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}; text-transform: uppercase; letter-spacing: 1px; backdrop-filter: blur(4px);">
                                    ${loan.status}
                                </span>
                            </div>
                        </div>
                        
                        <div style="text-align: right; position: relative; z-index: 1;">
                            <div style="font-size: 0.85rem; font-weight: 700; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Current Outstanding</div>
                            <div style="font-size: 2.5rem; font-weight: 800; color: ${loan.principal_amount > 0 ? '#fca5a5' : '#a7f3d0'}; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                                ₵ ${parseFloat(loan.principal_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>

                    <!-- Information Grid -->
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
                        <!-- Original Principal -->
                        <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; display: flex; align-items: flex-start; gap: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
                            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(245, 158, 11, 0.1); color: var(--warning); display: flex; align-items: center; justify-content: center;">
                                <span class="material-symbols-outlined" style="font-size: 1.5rem;">account_balance</span>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 6px;">Original Principal</div>
                                <div style="font-size: 1.4rem; font-weight: 800; color: var(--text-main);">₵ ${parseFloat(loan.original_principal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            </div>
                        </div>
                        
                        <!-- Issued By -->
                        <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; display: flex; align-items: flex-start; gap: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
                            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(14, 165, 233, 0.1); color: var(--info); display: flex; align-items: center; justify-content: center;">
                                <span class="material-symbols-outlined" style="font-size: 1.5rem;">badge</span>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 6px;">Issued By</div>
                                <div style="font-size: 1.2rem; font-weight: 800; color: var(--text-main); line-height: 1.2;">${loan.issuer_name || 'System'}</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; font-weight: 500;">${new Date(loan.created_at).toLocaleDateString()}</div>
                            </div>
                        </div>

                        ${collateralBlock}
                    </div>

                    ${loan.notes ? `
                    <div style="background: var(--bg-card); border: 1px solid var(--border); border-left: 4px solid var(--info); border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); margin-bottom: 24px;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                            <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(14, 165, 233, 0.1); color: var(--info); display: flex; align-items: center; justify-content: center;">
                                <span class="material-symbols-outlined" style="font-size: 1.1rem;">edit_note</span>
                            </div>
                            <div style="color: var(--text-main); font-size: 1rem; font-weight: 800;">Loan Notes</div>
                        </div>
                        <div style="font-size: 0.95rem; color: var(--text-muted); line-height: 1.6; white-space: pre-wrap; padding-left: 44px;">${loan.notes}</div>
                    </div>
                    ` : ''}

                    <!-- Timeline Table -->
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h4 style="margin: 0; color: var(--text-main); font-size: 1.1rem; font-weight: 800; display: flex; align-items: center; gap: 12px;">
                                <div style="width: 36px; height: 36px; border-radius: 10px; background: var(--bg-main); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center;">
                                    <span class="material-symbols-outlined" style="color: var(--text-main); font-size: 1.2rem;">history</span> 
                                </div>
                                Settlement Timeline
                            </h4>
                        </div>
                        <div style="background: white; border-radius: 16px; border: 1px solid var(--border); overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                                    <tr>
                                        <th style="padding: 16px 20px; text-align: left; color: var(--text-muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Date</th>
                                        <th style="padding: 16px 20px; text-align: left; color: var(--text-muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Method</th>
                                        <th style="padding: 16px 20px; text-align: right; color: var(--text-muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Amount Paid</th>
                                        <th style="padding: 16px 20px; text-align: right; color: var(--text-muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Balance After</th>
                                        <th style="padding: 16px 20px; text-align: left; color: var(--text-muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Processed By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${settlements.length === 0 ? `
                                        <tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 40px; font-style: italic;">No settlement records found.</td></tr>
                                    ` : settlements.map(s => {
                                        let details = '';
                                        if (s.settlement_type === 'walk_in_gold' || s.settlement_type === 'collateral') {
                                            details = `<div style="font-size: 0.8rem; color: var(--gold-primary); margin-top: 6px; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                                                <span class="material-symbols-outlined" style="font-size: 0.9rem;">scale</span>`;
                                            if (s.gold_type === 'refined') {
                                                details += `${parseFloat(s.gold_grams_used).toFixed(2)}g <span style="color:var(--text-muted); font-weight:500;">(Vol: ${s.volume || '-'} | Den: ${s.density || '-'})</span>`;
                                            } else if (s.gold_type === 'balls') {
                                                details += `${parseFloat(s.gold_grams_used).toFixed(2)}g <span style="color:var(--text-muted); font-weight:500;">(${s.total_blades || '-'} blades)</span>`;
                                            } else {
                                                details += `${parseFloat(s.gold_grams_used).toFixed(2)}g <span style="color:var(--text-muted); font-weight:500;">of ${s.gold_type}</span>`;
                                            }
                                            details += `</div>`;
                                        }

                                        return `
                                        <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                                            <td style="padding: 16px 20px; color: var(--text-muted); font-weight: 600; font-size: 0.9rem;">${new Date(s.created_at).toLocaleDateString()}</td>
                                            <td style="padding: 16px 20px; text-transform: capitalize; color: var(--text-main); font-weight: 700;">
                                                <span style="display: flex; align-items: center; gap: 8px;">
                                                    <div style="width: 28px; height: 28px; border-radius: 6px; background: ${s.settlement_type === 'cash' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(245, 158, 11, 0.1)'}; color: ${s.settlement_type === 'cash' ? 'var(--info)' : 'var(--warning)'}; display: flex; align-items: center; justify-content: center;">
                                                        <span class="material-symbols-outlined" style="font-size: 1rem;">${s.settlement_type === 'cash' ? 'payments' : 'inventory_2'}</span>
                                                    </div>
                                                    ${s.settlement_type.replace(/_/g, ' ')}
                                                </span>
                                                ${details}
                                            </td>
                                            <td style="padding: 16px 20px; text-align: right; color: var(--success); font-weight: 800;">₵ ${parseFloat(s.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td style="padding: 16px 20px; text-align: right; color: var(--warning); font-weight: 800;">₵ ${parseFloat(s.principal_after).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td style="padding: 16px 20px; color: var(--text-muted); font-size: 0.9rem; font-weight: 500;">${s.processor_name || 'System'}</td>
                                        </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            window.openModal('Loan Details', html, { maxWidth: '900px' });
        } catch (e) {
            console.error(e);
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
