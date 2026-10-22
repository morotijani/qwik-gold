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
    const modalCard = document.querySelector('.modal-card');

    window.setModalSize = (sizeOrWidth) => {
        if (!modalCard) return;
        modalCard.classList.remove('modal-sm', 'modal-md', 'modal-lg');
        delete modalCard.dataset.size;

        const val = String(sizeOrWidth || '').toLowerCase();
        if (val === 'lg' || val === '840px' || val === '900px') {
            modalCard.classList.add('modal-lg');
            modalCard.dataset.size = 'lg';
            modalCard.style.maxWidth = 'min(840px, 94vw)';
        } else if (val === 'sm' || val === '380px' || val === '400px') {
            modalCard.classList.add('modal-sm');
            modalCard.dataset.size = 'sm';
            modalCard.style.maxWidth = 'min(380px, 94vw)';
        } else if (val === 'md' || val === '450px' || val === '480px' || val === '500px') {
            modalCard.classList.add('modal-md');
            modalCard.dataset.size = 'md';
            modalCard.style.maxWidth = 'min(450px, 94vw)';
        } else if (sizeOrWidth) {
            modalCard.style.maxWidth = sizeOrWidth;
        } else {
            modalCard.style.maxWidth = '420px';
        }
    };

    window.openModal = (title, htmlContent, options = {}) => {
        if (modalTitle) modalTitle.textContent = title;
        if (modalBody) modalBody.innerHTML = htmlContent;

        const sizeOption = options.size || options.maxWidth || options.width;
        if (sizeOption) {
            window.setModalSize(sizeOption);
        } else {
            const lowerTitle = (title || '').toLowerCase();
            if (lowerTitle.includes('loan details')) {
                window.setModalSize('lg');
            } else if (lowerTitle.includes('delete') || lowerTitle.includes('confirm') || lowerTitle.includes('status')) {
                window.setModalSize('sm');
            } else if (lowerTitle.includes('wizard') || lowerTitle.includes('purchase') || lowerTitle.includes('settle')) {
                window.setModalSize('md');
            } else {
                window.setModalSize('420px');
            }
        }

        if (globalModal) globalModal.classList.add('active');
    };

    window.closeModal = () => {
        if (globalModal) globalModal.classList.remove('active');
        if (modalCard) {
            modalCard.classList.remove('modal-sm', 'modal-md', 'modal-lg');
            delete modalCard.dataset.size;
            modalCard.style.maxWidth = '420px';
        }
    };

    // Close on backdrop click & ESC key
    if (globalModal) {
        globalModal.addEventListener('click', (e) => {
            if (e.target === globalModal) {
                window.closeModal();
            }
        });

        // MutationObserver to safely auto-size direct classList.add('active') activations
        const modalObserver = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                if (m.type === 'attributes' && m.attributeName === 'class') {
                    if (globalModal.classList.contains('active')) {
                        const currentTitle = (modalTitle ? modalTitle.textContent || '' : '').toLowerCase();
                        if (!modalCard.classList.contains('modal-lg') && !modalCard.classList.contains('modal-md') && !modalCard.classList.contains('modal-sm')) {
                            if (currentTitle.includes('loan details')) {
                                window.setModalSize('lg');
                            } else if (currentTitle.includes('delete') || currentTitle.includes('confirm') || currentTitle.includes('withdrawal')) {
                                window.setModalSize('sm');
                            } else if (currentTitle.includes('purchase') || currentTitle.includes('settle')) {
                                window.setModalSize('md');
                            } else if (!modalCard.style.maxWidth || parseInt(modalCard.style.maxWidth) > 500) {
                                window.setModalSize('420px');
                            }
                        }
                    } else {
                        if (modalCard) {
                            modalCard.classList.remove('modal-sm', 'modal-md', 'modal-lg');
                            delete modalCard.dataset.size;
                            modalCard.style.maxWidth = '420px';
                        }
                    }
                }
            });
        });
        modalObserver.observe(globalModal, { attributes: true });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && globalModal && globalModal.classList.contains('active')) {
            window.closeModal();
        }
    });

    // === LOAN DETAILS MODAL ===
    window.openLoanDetailsModal = async (loanId) => {
        if (typeof window.isSalesperson === 'function' && window.isSalesperson()) {
            return window.showToast('Access Denied: Only administrators and staff can view loan details.', 'error');
        }
        try {
            const data = await window.api.get(`/loans/details.php?loan_id=${loanId}`);
            const { loan, settlements } = data;

            let collateralBlock = '';
            if (loan.collateral_gold_type) {
                let colStr = '';
                if (loan.collateral_gold_type === 'refined') {
                    colStr = `<div style="display: flex; gap: 24px; margin-top: 10px;">
                        <div><span style="color: var(--text-muted); font-size:0.72rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Weight</span><br><span style="font-weight:800; font-size: 1.05rem; color: var(--gold-primary);">${parseFloat(loan.collateral_weight || 0).toFixed(2)}g</span></div>
                        <div><span style="color: var(--text-muted); font-size:0.72rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Volume</span><br><span style="font-weight:800; font-size: 1.05rem; color: var(--gold-primary);">${parseFloat(loan.collateral_volume || 0).toFixed(2)}</span></div>
                    </div>`;
                } else if (loan.collateral_gold_type === 'balls') {
                    colStr = `<div style="display: flex; gap: 24px; margin-top: 10px;">
                        <div><span style="color: var(--text-muted); font-size:0.72rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Weight</span><br><span style="font-weight:800; font-size: 1.05rem; color: var(--gold-primary);">${parseFloat(loan.collateral_weight || 0).toFixed(2)}g</span></div>
                        <div><span style="color: var(--text-muted); font-size:0.72rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Blades</span><br><span style="font-weight:800; font-size: 1.05rem; color: var(--gold-primary);">${parseFloat(loan.collateral_blades || 0).toFixed(2)}</span></div>
                    </div>`;
                }
                collateralBlock = `
                    <div style="background: #FFFFFF; border: 1px solid rgba(0,0,0,0.06); border-radius: 14px; padding: 16px 18px; grid-column: span 3; display: flex; align-items: flex-start; gap: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
                        <div style="width: 44px; height: 44px; border-radius: 12px; background: #EEF2FF; color: #2D5BFF; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <span class="material-symbols-outlined" style="font-size: 1.4rem;">inventory_2</span>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.8px; margin-bottom: 2px;">Collateral Deposited</div>
                            <div style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); text-transform: capitalize;">${loan.collateral_gold_type === 'refined' ? 'Refined Gold' : 'Gold Balls'}</div>
                            ${colStr}
                        </div>
                    </div>
                `;
            }

            const html = `
                <div style="display: flex; flex-direction: column;">
                    
                    <!-- Clean NWDGC Header Banner -->
                    <div style="background: #FFFFFF; border: 1px solid rgba(0,0,0,0.06); border-radius: 16px; padding: 18px 22px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; box-shadow: 0 3px 14px rgba(0,0,0,0.025); margin-bottom: 18px;">
                        <div style="flex: 1; min-width: 220px;">
                            <div style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Loan Reference</div>
                            <div style="font-size: clamp(1.35rem, 4vw, 1.6rem); font-weight: 800; color: var(--text-main); letter-spacing: -0.3px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                                ${loan.loan_uid || 'LN-' + String(loan.id).padStart(6, '0')}
                                <span style="font-size: 0.72rem; padding: 4px 10px; border-radius: 9999px; font-weight: 700; background: ${loan.status === 'active' ? '#EEF2FF' : '#DCFCE7'}; color: ${loan.status === 'active' ? '#2D5BFF' : '#16A34A'}; border: 1px solid ${loan.status === 'active' ? '#C7D2FE' : '#BBF7D0'}; text-transform: uppercase; letter-spacing: 0.6px;">
                                    ${loan.status}
                                </span>
                            </div>
                        </div>
                        
                        <div style="text-align: left; flex: 1; min-width: 220px;">
                            <div style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px;">Current Outstanding</div>
                            <div style="font-size: clamp(1.5rem, 5vw, 1.85rem); font-weight: 800; color: ${loan.principal_amount > 0 ? '#ef4444' : '#10b981'}; margin-bottom: 10px; word-break: break-word;">
                                ₵ ${parseFloat(loan.principal_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            ${loan.status === 'active' && !(typeof window.isSalesperson === 'function' && window.isSalesperson()) ? `<button class="btn btn-primary" onclick="window.closeModal(); setTimeout(() => window.openSettleLoanWizard(${loan.id}, ${loan.customer_id}, '${loan.type}', ${loan.principal_amount}), 300);" style="padding: 7px 16px; font-size: 0.82rem; font-weight: 700; border-radius: 9999px; background: #2D5BFF; border: none; display: inline-flex; align-items: center; justify-content: center; color: #FFFFFF;">Settle Loan</button>` : ''}
                        </div>
                    </div>

                    <!-- Information Grid -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 18px;">
                        <!-- Original Principal -->
                        <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 16px 18px; display: flex; align-items: flex-start; gap: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
                            <div style="width: 42px; height: 42px; border-radius: 10px; background: #EEF2FF; color: #2D5BFF; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                <span class="material-symbols-outlined" style="font-size: 1.35rem;">account_balance</span>
                            </div>
                            <div>
                                <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px;">Original Principal</div>
                                <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">₵ ${parseFloat(loan.original_principal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            </div>
                        </div>
                        
                        <!-- Issued By -->
                        <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 16px 18px; display: flex; align-items: flex-start; gap: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
                            <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(14, 165, 233, 0.1); color: var(--info); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                <span class="material-symbols-outlined" style="font-size: 1.35rem;">badge</span>
                            </div>
                            <div>
                                <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px;">Issued By</div>
                                <div style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); line-height: 1.2;">${loan.issuer_name || 'System'}</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 3px; font-weight: 500;">${new Date(loan.created_at).toLocaleDateString()}</div>
                            </div>
                        </div>

                        ${collateralBlock}
                    </div>

                    ${loan.notes ? `
                    <div style="background: var(--bg-card); border: 1px solid var(--border); border-left: 3px solid var(--info); border-radius: 12px; padding: 14px 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); margin-bottom: 18px;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <div style="width: 28px; height: 28px; border-radius: 7px; background: rgba(14, 165, 233, 0.1); color: var(--info); display: flex; align-items: center; justify-content: center;">
                                <span class="material-symbols-outlined" style="font-size: 1rem;">edit_note</span>
                            </div>
                            <div style="color: var(--text-main); font-size: 0.92rem; font-weight: 800;">Loan Notes</div>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; white-space: pre-wrap; padding-left: 38px;">${loan.notes}</div>
                    </div>
                    ` : ''}

                    <!-- Timeline Table -->
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h4 style="margin: 0; color: var(--text-main); font-size: 0.98rem; font-weight: 800; display: flex; align-items: center; gap: 10px;">
                                <div style="width: 30px; height: 30px; border-radius: 8px; background: var(--bg-main); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center;">
                                    <span class="material-symbols-outlined" style="color: var(--text-main); font-size: 1.1rem;">history</span> 
                                </div>
                                Settlement Timeline
                            </h4>
                        </div>
                        <div style="background: white; border-radius: 14px; border: 1px solid var(--border); overflow-x: auto; box-shadow: 0 3px 14px rgba(0,0,0,0.025);">
                            <table style="width: 100%; border-collapse: collapse; min-width: 600px;">
                                <thead style="background: #f8fafc; border-bottom: 1.5px solid #e2e8f0;">
                                    <tr>
                                        <th style="padding: 11px 16px; text-align: left; color: var(--text-muted); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">Date</th>
                                        <th style="padding: 11px 16px; text-align: left; color: var(--text-muted); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">Method</th>
                                        <th style="padding: 11px 16px; text-align: right; color: var(--text-muted); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">Amount Paid</th>
                                        <th style="padding: 11px 16px; text-align: right; color: var(--text-muted); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">Balance After</th>
                                        <th style="padding: 11px 16px; text-align: left; color: var(--text-muted); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">Processed By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${settlements.length === 0 ? `
                                        <tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px; font-style: italic; font-size: 0.85rem;">No settlement records found.</td></tr>
                                    ` : settlements.map(s => {
                let details = '';
                if (s.settlement_type === 'walk_in_gold' || s.settlement_type === 'collateral') {
                    details = `<div style="font-size: 0.75rem; color: var(--gold-primary); margin-top: 4px; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                                                <span class="material-symbols-outlined" style="font-size: 0.85rem;">scale</span>`;
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
                                        <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                                            <td style="padding: 11px 16px; color: var(--text-muted); font-weight: 600; font-size: 0.83rem;">${new Date(s.created_at).toLocaleDateString()}</td>
                                            <td style="padding: 11px 16px; text-transform: capitalize; color: var(--text-main); font-weight: 700; font-size: 0.85rem;">
                                                <span style="display: flex; align-items: center; gap: 8px;">
                                                    <div style="width: 24px; height: 24px; border-radius: 6px; background: ${s.settlement_type === 'cash' ? '#EEF2FF' : '#FEF8D8'}; color: ${s.settlement_type === 'cash' ? '#2D5BFF' : '#B45309'}; display: flex; align-items: center; justify-content: center;">
                                                        <span class="material-symbols-outlined" style="font-size: 0.9rem;">${s.settlement_type === 'cash' ? 'payments' : 'inventory_2'}</span>
                                                    </div>
                                                    ${s.settlement_type.replace(/_/g, ' ')}
                                                </span>
                                                ${details}
                                            </td>
                                            <td style="padding: 11px 16px; text-align: right; color: var(--success); font-weight: 800; font-size: 0.86rem;">₵ ${parseFloat(s.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td style="padding: 11px 16px; text-align: right; color: var(--warning); font-weight: 800; font-size: 0.86rem;">₵ ${parseFloat(s.principal_after).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td style="padding: 11px 16px; color: var(--text-muted); font-size: 0.83rem; font-weight: 500;">${s.processor_name || 'System'}</td>
                                        </tr>
                                        `;
            }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            window.openModal('Loan Details', html, { maxWidth: '840px', size: 'lg' });
        } catch (e) {
            console.error(e);
            window.showToast('Failed to load loan details', 'error');
        }
    };

    window.getThermalPrintHTMLLoan = (loan, dateObj) => {
        const loanUid = loan.loan_uid || 'LN-' + String(loan.id).padStart(6, '0');
        const customerName = loan.customer_name || 'Walk-In';

        return `
        <div class="print-only thermal-receipt" style="display: none; position: fixed; top: 0; left: 0; font-family: monospace !important; color: black; background: white; width: 100%; max-width: 300px; padding: 20px; z-index: 999999; box-sizing: border-box;">
            <div style="text-align: center; margin-bottom: 15px;">
                <div style="font-size: 1.2rem; font-weight: bold;">Mukhlis Farhan Trading Limited</div>
                <div style="font-size: 0.9rem;">AC-0064-9566, Konongo - Odumase</div>
                <div style="font-size: 0.9rem;">+233 55 400 1608 / +233 25 664 2984</div>
                <div style="margin-top: 5px; font-weight: bold;">LOAN ISSUE RECEIPT</div>
            </div>
            
            <div style="font-size: 1.1rem; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Loan Ref:</span>
                    <span>${loanUid}</span>
                </div>
                ${loan.collateral_gold_type ? `
                <div style="border-top: 1px dashed black; margin: 5px 0;"></div>
                <div style="text-align: center; font-weight: bold; font-size: 0.9rem;">Collateral</div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Gold Type:</span>
                    <span style="text-transform: capitalize;">${loan.collateral_gold_type}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Weight (g):</span>
                    <span>${parseFloat(loan.collateral_weight).toFixed(2)}</span>
                </div>
                ${loan.collateral_gold_type === 'refined' ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Volume:</span>
                    <span>${parseFloat(loan.collateral_volume || 0).toFixed(2)}</span>
                </div>
                ` : `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Blades:</span>
                    <span>${parseFloat(loan.collateral_blades || 0).toFixed(4)}</span>
                </div>
                `}
                <div style="border-top: 1px dashed black; margin: 5px 0;"></div>
                ` : `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Collateral:</span>
                    <span>None</span>
                </div>
                `}
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.3rem; margin-top: 10px;">
                    <span>Principal:</span>
                    <span>₵${parseFloat(loan.original_principal).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
            </div>
            
            <div style="border-top: 1px dashed black; margin: 10px 0;"></div>
            
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                <span>Customer,</span>
                <span>${customerName}</span>
            </div>
            
            <div style="border-top: 1px dashed black; margin: 10px 0;"></div>
            
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                <span>${dateObj.toLocaleDateString()}</span>
                <span>${dateObj.toLocaleTimeString()}</span>
            </div>
            <div style="text-align: center; margin-top: 15px; font-size: 0.8rem;">
                Powered by Qwik-Gold
            </div>
        </div>
        `;
    };

    window.viewLoanIssueReceipt = async (loanId) => {
        try {
            const data = await window.api.get(`/loans/details.php?loan_id=${loanId}`);
            const { loan } = data;

            document.getElementById('modal-title').textContent = 'Loan Issue Receipt';
            const modalBody = document.getElementById('modal-body');

            const dateObj = new Date(loan.created_at);
            const loanUid = loan.loan_uid || 'LN-' + String(loan.id).padStart(6, '0');

            modalBody.innerHTML = `
                <div class="no-print">
                    <div style="display: flex; justify-content: center; margin-bottom: 20px;">
                        <div class="receipt-box" style="border: 1px solid var(--border); border-radius: 8px; padding: 20px; width: 100%; max-width: 400px; background: white;">
                            <div style="text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 15px; margin-bottom: 15px;">
                                <h2 style="margin: 0; color: var(--gold-primary); font-family: 'Outfit', sans-serif;">QWIK GOLD</h2>
                                <p style="margin: 5px 0 0 0; color: var(--text-muted); font-size: 0.85rem;">Loan Issue Receipt</p>
                            </div>
                            
                            <table style="width: 100%; margin-bottom: 15px; font-size: 0.85rem;">
                                <tr><td style="padding: 3px 0; color: var(--text-muted);">Loan Ref:</td><td style="padding: 3px 0; text-align: right; font-weight: 600; font-family: monospace;">${loanUid}</td></tr>
                                <tr><td style="padding: 3px 0; color: var(--text-muted);">Date:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()}</td></tr>
                                <tr><td style="padding: 3px 0; color: var(--text-muted);">Customer:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${loan.customer_name || 'Walk-In'}</td></tr>
                                <tr><td style="padding: 3px 0; color: var(--text-muted);">Issued By:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${loan.issuer_name || 'System'}</td></tr>
                                
                                ${loan.collateral_gold_type ? `
                                <tr><td colspan="2" style="padding: 10px 0 5px 0; font-weight: 700; color: var(--text-main); border-bottom: 1px dashed #eee;">Collateral Deposited</td></tr>
                                <tr><td style="padding: 3px 0; color: var(--text-muted);">Gold Type:</td><td style="padding: 3px 0; text-align: right; font-weight: 600; text-transform: capitalize;">${loan.collateral_gold_type}</td></tr>
                                <tr><td style="padding: 3px 0; color: var(--text-muted);">Weight:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${parseFloat(loan.collateral_weight).toFixed(2)} g</td></tr>
                                ${loan.collateral_gold_type === 'refined' ? `
                                <tr><td style="padding: 3px 0; color: var(--text-muted);">Volume:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${parseFloat(loan.collateral_volume || 0).toFixed(2)}</td></tr>
                                ` : `
                                <tr><td style="padding: 3px 0; color: var(--text-muted);">Blades:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${parseFloat(loan.collateral_blades || 0).toFixed(2)}</td></tr>
                                `}
                                ` : `
                                <tr><td colspan="2" style="padding: 10px 0 5px 0; font-weight: 700; color: var(--text-main); border-bottom: 1px dashed #eee;">Collateral</td></tr>
                                <tr><td style="padding: 3px 0; color: var(--text-muted);">Status:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">None (Unsecured)</td></tr>
                                `}
                            </table>
                            
                            <div style="background: rgba(239, 68, 68, 0.05); padding: 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border: 1px solid rgba(239, 68, 68, 0.2);">
                                <span style="font-weight: 600; font-size: 0.9rem; color: var(--danger);">Principal Issued:</span>
                                <span style="font-size: 1.1rem; font-weight: 800; color: var(--danger);">₵${parseFloat(loan.original_principal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            
                            <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; margin-bottom: 10px;">
                                Please retain this receipt for your records.
                            </div>
                        </div>
                    </div>
            
                    <button class="btn btn-primary btn-block" onclick="window.print()">
                        <span class="material-symbols-outlined">print</span> Print Receipt
                    </button>
                </div>
                ${typeof window.getThermalPrintHTMLLoan === 'function' ? window.getThermalPrintHTMLLoan(loan, dateObj) : ''}
            `;

            window.openModal('Loan Issue Receipt', modalBody.innerHTML, { maxWidth: '420px' });
        } catch (err) {
            window.showToast('Failed to load loan receipt: ' + err.message, 'error');
        }
    };

    // === MOBILE MENU SYSTEM ===
    window.toggleMobileMenu = () => {
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('mobile-backdrop');
        if (sidebar && backdrop) {
            sidebar.classList.toggle('open');
            backdrop.classList.toggle('active');
        }
    };

    window.closeMobileMenu = () => {
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('mobile-backdrop');
        if (sidebar && backdrop) {
            sidebar.classList.remove('open');
            backdrop.classList.remove('active');
        }
    };

    // === LOGIN LOGO FALLBACK HANDLER ===
    window.handleLoginLogoFallback = (imgEl) => {
        if (!imgEl) return;
        const defaultLogo = 'assets/img/logo.png';
        const emblem = document.getElementById('login-default-emblem');

        // If the custom logo path fails to load, try default logo first
        if (!imgEl.dataset.triedDefault && imgEl.src && !imgEl.src.endsWith(defaultLogo)) {
            imgEl.dataset.triedDefault = 'true';
            imgEl.src = defaultLogo;
            return;
        }

        // If default logo also fails, fall back to the default blue diamond emblem
        imgEl.style.display = 'none';
        if (emblem) {
            emblem.style.display = 'inline-flex';
        }
    };

    // === COMPANY PROFILE & BRANDING STATE ===
    window.applyCompanyProfileUI = (settings) => {
        if (!settings) return;

        try {
            localStorage.setItem('qwik_gold_settings', JSON.stringify(settings));
        } catch (e) {}

        const companyName = settings.company_name || 'Qwik Gold';
        const companyTagline = settings.company_tagline || 'Enterprise Precious Metals Ledger';
        const companyLogo = settings.company_logo || 'assets/img/logo.png';

        // 1. Update Login Card Logo & Branding
        const loginLogo = document.getElementById('login-company-logo');
        const loginEmblem = document.getElementById('login-default-emblem');
        if (loginLogo) {
            delete loginLogo.dataset.triedDefault;
            if (companyLogo && companyLogo.trim()) {
                loginLogo.src = companyLogo;
                loginLogo.style.display = 'inline-block';
                if (loginEmblem) loginEmblem.style.display = 'none';
            } else {
                loginLogo.style.display = 'none';
                if (loginEmblem) loginEmblem.style.display = 'inline-flex';
            }
        }

        const loginName = document.getElementById('login-company-name');
        if (loginName) {
            loginName.textContent = companyName;
        }
        const loginTagline = document.getElementById('login-company-tagline');
        if (loginTagline) {
            loginTagline.textContent = companyTagline;
        }

        // 2. Update Sidebar brand
        const sidebarLogo = document.getElementById('sidebar-company-logo');
        if (sidebarLogo) {
            delete sidebarLogo.dataset.triedDefault;
            sidebarLogo.src = companyLogo;
            sidebarLogo.onerror = () => {
                if (!sidebarLogo.dataset.triedDefault && !sidebarLogo.src.endsWith('assets/img/logo.png')) {
                    sidebarLogo.dataset.triedDefault = 'true';
                    sidebarLogo.src = 'assets/img/logo.png';
                }
            };
        }
        const sidebarName = document.getElementById('sidebar-company-name');
        if (sidebarName) {
            sidebarName.textContent = companyName;
        }

        // 3. Update Dashboard welcome header if currently rendered
        const dashboardWelcome = document.getElementById('dashboard-welcome-title');
        if (dashboardWelcome) {
            dashboardWelcome.textContent = `Welcome back to ${companyName}`;
        }

        // 4. Update page title
        document.title = `${companyName} | Enterprise Ledger`;
    };

    window.getCompanySettings = () => {
        try {
            return JSON.parse(localStorage.getItem('qwik_gold_settings') || '{}');
        } catch (e) {
            return {};
        }
    };

    window.loadSystemSettings = async () => {
        // Fast restore from local cache first
        const cached = window.getCompanySettings();
        if (cached && (cached.company_name || cached.company_logo)) {
            window.applyCompanyProfileUI(cached);
        }

        try {
            const res = await window.api.get('/settings/get.php');
            if (res) {
                const settingsData = res.data || res;
                window.applyCompanyProfileUI(settingsData);
                if (settingsData.purity_discount_percent !== undefined && window.GoldMath) {
                    window.GoldMath.setDiscountPercent(parseFloat(settingsData.purity_discount_percent));
                }
                return settingsData;
            }
        } catch (err) {
            // Silently fall back to cached settings
        }
        return cached;
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
        document.getElementById('login-form').reset();
    };

    // === ROLE HELPERS ===
    window.getCurrentUser = () => {
        try {
            return JSON.parse(localStorage.getItem('qwik_gold_user') || '{}');
        } catch (e) {
            return {};
        }
    };

    window.isAdmin = () => {
        const u = window.getCurrentUser();
        return u && u.role === 'admin';
    };

    window.isStaff = () => {
        const u = window.getCurrentUser();
        return u && u.role === 'staff';
    };

    window.isSalesperson = () => {
        const u = window.getCurrentUser();
        return u && u.role === 'salesperson';
    };

    const applySidebarPermissions = (role) => {
        const allowedSalesperson = ['calculator', 'purchases', 'customers', 'expenses', 'keepers', 'profile', 'help'];
        const adminOnly = ['users', 'audit', 'settings'];

        // Nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            const r = link.dataset.route;
            if (!r) return;

            if (role === 'salesperson') {
                if (allowedSalesperson.includes(r)) {
                    link.style.display = '';
                } else {
                    link.style.display = 'none';
                }
            } else if (role === 'staff') {
                if (adminOnly.includes(r)) {
                    link.style.display = 'none';
                } else {
                    link.style.display = '';
                }
            } else {
                link.style.display = '';
            }
        });

        // Admin section
        if (role === 'admin') {
            adminNav.classList.remove('hidden');
        } else {
            adminNav.classList.add('hidden');
        }

        // Section titles
        const sectionTitles = document.querySelectorAll('.nav-section-title');
        sectionTitles.forEach(title => {
            const text = (title.textContent || '').trim().toLowerCase();
            if (role === 'salesperson') {
                if (text === 'overview') {
                    title.style.display = 'none';
                } else {
                    title.style.display = '';
                }
            } else {
                title.style.display = '';
            }
        });
    };

    // === USER PROFILE & ROLE DISPLAY UI ===
    window.updateCurrentUserUI = (user) => {
        if (!user) return;

        // Topbar elements (if present)
        if (userNameEl) userNameEl.textContent = user.name || 'User';
        if (userRoleEl) userRoleEl.textContent = user.role || '';

        // Sidebar Bottom Card elements
        const sidebarName = document.getElementById('sidebar-user-name');
        const sidebarInitial = document.getElementById('sidebar-user-initial');
        const sidebarRoleBadge = document.getElementById('sidebar-user-role-badge');
        const sidebarRoleText = document.getElementById('sidebar-user-role-text');
        const sidebarRoleIcon = document.getElementById('sidebar-role-icon');

        const displayName = user.name || user.username || 'User';
        if (sidebarName) {
            sidebarName.textContent = displayName;
        }

        if (sidebarInitial) {
            const trimmed = displayName.trim();
            sidebarInitial.textContent = trimmed ? trimmed.charAt(0).toUpperCase() : 'U';
        }

        const role = String(user.role || 'staff').toLowerCase();
        let roleLabel = 'Staff';
        let roleIcon = 'badge';
        let roleClass = 'role-staff';

        if (role === 'admin') {
            roleLabel = 'Administrator';
            roleIcon = 'admin_panel_settings';
            roleClass = 'role-admin';
        } else if (role === 'salesperson') {
            roleLabel = 'Salesperson';
            roleIcon = 'point_of_sale';
            roleClass = 'role-salesperson';
        } else {
            roleLabel = 'Staff';
            roleIcon = 'badge';
            roleClass = 'role-staff';
        }

        if (sidebarRoleText) {
            sidebarRoleText.textContent = roleLabel;
        }

        if (sidebarRoleIcon) {
            sidebarRoleIcon.textContent = roleIcon;
        }

        if (sidebarRoleBadge) {
            sidebarRoleBadge.className = `sidebar-role-badge ${roleClass}`;
        }
    };

    const showAppShell = (user) => {
        loginOverlay.classList.remove('active');
        appShell.classList.remove('hidden');

        // Populate User Info across Topbar and Sidebar Bottom Card
        window.updateCurrentUserUI(user);

        // Apply role-based sidebar link visibility
        applySidebarPermissions(user.role);

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


    // Global Modal for Converting Gold Balls to Refined
    window.openConvertBallsModal = (maxGramsAvailable, totalBladesAvailable, ownershipStatus, customerId = null, callback = null, sourceLocation = 'office_vault') => {
        // Fallback formula if blades wasn't captured in the db
        const displayBlades = (totalBladesAvailable && parseFloat(totalBladesAvailable) > 0)
            ? parseFloat(totalBladesAvailable)
            : (parseFloat(maxGramsAvailable) / 0.8);

        const html = `
            <div style="padding: 4px 2px;">
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Available Balls to Convert</div>
                        <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">${parseFloat(maxGramsAvailable).toFixed(2)} <span style="font-size: 0.85rem; color: var(--text-muted);">g</span></div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Total Blades</div>
                        <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">${displayBlades.toFixed(2)}</div>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 16px;">
                    <label style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">Balls to Convert (Grams) <span style="color: var(--danger);">*</span></label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">trip_origin</span>
                        <input type="number" id="convert-balls-used" step="0.0001" min="0.0001" max="${maxGramsAvailable}" value="${maxGramsAvailable}" style="font-weight: 700; color: var(--text-main);">
                    </div>
                </div>

                <div style="border-top: 1px dashed var(--border); margin: 16px 0;"></div>

                <h4 style="margin: 0 0 12px 0; font-size: 0.95rem; font-weight: 700; color: var(--text-main);">Resulting Refined Gold</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">Refined Weight (g) <span style="color: var(--danger);">*</span></label>
                        <div class="input-with-icon">
                            <span class="material-symbols-outlined">diamond</span>
                            <input type="number" id="convert-refined-grams" step="0.0001" min="0.0001" placeholder="0.00">
                        </div>
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">Refined Volume <span style="color: var(--danger);">*</span></label>
                        <div class="input-with-icon">
                            <span class="material-symbols-outlined">water_drop</span>
                            <input type="number" id="convert-refined-volume" step="0.0001" min="0.0001" placeholder="0.00">
                        </div>
                    </div>
                </div>

                <div style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; padding: 12px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 18px; text-align: center;">
                    <div>
                        <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Pounds (lb)</div>
                        <div id="convert-calc-pounds" style="font-size: 1rem; font-weight: 700; color: var(--text-main);">-</div>
                    </div>
                    <div>
                        <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Density</div>
                        <div id="convert-calc-density" style="font-size: 1rem; font-weight: 700; color: var(--text-main);">-</div>
                    </div>
                    <div>
                        <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Karat</div>
                        <div id="convert-calc-karat" style="font-size: 1rem; font-weight: 700; color: var(--warning);">-</div>
                    </div>
                </div>

                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn btn-outline" onclick="window.closeModal()">Cancel</button>
                    <button class="btn btn-primary" id="btn-convert-balls-submit" onclick="window.submitConvertBalls('${ownershipStatus}', ${customerId}, '${sourceLocation}')" style="background: #2D5BFF; color: #fff; border: none; border-radius: 9999px; padding: 8px 20px; font-weight: 700;">
                        <span class="material-symbols-outlined">local_fire_department</span> Smelt & Convert
                    </button>
                </div>
            </div>
        `;

        window.openModal('Convert Gold Balls', html, { size: 'md', maxWidth: '450px' });

        const uInput = document.getElementById('convert-balls-used');
        const gInput = document.getElementById('convert-refined-grams');
        const vInput = document.getElementById('convert-refined-volume');
        const dSpan = document.getElementById('convert-calc-density');
        const kSpan = document.getElementById('convert-calc-karat');
        const pSpan = document.getElementById('convert-calc-pounds');

        const updateCalcs = () => {
            const g = parseFloat(gInput.value) || 0;
            const v = parseFloat(vInput.value) || 0;
            const truncate2 = (num) => Math.floor(num * 100) / 100;

            if (g > 0) {
                pSpan.innerText = truncate2(g / 7.75).toFixed(2);
            } else {
                pSpan.innerText = '-';
            }

            if (g > 0 && v > 0) {
                if (window.GoldMath) {
                    const calc = window.GoldMath.calculate({ grams: g, volume: v });
                    dSpan.innerText = calc.density.toFixed(2);
                    kSpan.innerText = calc.payableKarat.toFixed(2) + 'k';
                } else {
                    const density = truncate2(g / v);
                    dSpan.innerText = density.toFixed(2);
                    const rawKarat = density > 0 ? truncate2(((density - 10.51) * 52.838) / density) : 0;
                    const payableKarat = rawKarat > 0 ? truncate2(rawKarat * 0.993) : 0;
                    kSpan.innerText = Math.max(0, payableKarat).toFixed(2) + 'k';
                }
            } else {
                dSpan.innerText = '-';
                kSpan.innerText = '-';
            }
        };

        gInput.addEventListener('input', updateCalcs);
        vInput.addEventListener('input', updateCalcs);

        window.submitConvertBalls = async (status, custId, sourceLocation = 'office_vault') => {
            const btn = document.getElementById('btn-convert-balls-submit') || (typeof event !== 'undefined' && event ? event.currentTarget : null);
            const used = parseFloat(uInput.value);
            const refG = parseFloat(gInput.value);
            const refV = parseFloat(vInput.value);

            if (!used || used <= 0 || used > maxGramsAvailable) {
                return window.showToast('Invalid balls used (must be between 0 and ' + maxGramsAvailable + 'g)', 'error');
            }
            if (!refG || refG <= 0) {
                return window.showToast('Please enter the resulting refined weight', 'error');
            }
            if (!refV || refV <= 0) {
                return window.showToast('Please enter the resulting refined volume', 'error');
            }

            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Converting...';
            }

            try {
                const payload = {
                    ownership_status: status,
                    customer_id: custId,
                    balls_grams: used,
                    balls_grams_used: used,
                    balls_blades: (used / maxGramsAvailable) * displayBlades,
                    refined_grams: refG,
                    refined_grams_produced: refG,
                    refined_volume: refV,
                    source_location: sourceLocation
                };

                await window.api.post('/vault/convert_balls.php', payload);
                window.showToast('Gold Balls successfully converted to Refined Gold!', 'success');
                window.closeModal();
                if (typeof callback === 'function') callback();
            } catch (err) {
                window.showToast(err.message, 'error');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<span class="material-symbols-outlined">local_fire_department</span> Smelt & Convert';
                }
            }
        };
    };

    // === SIMPLE ROUTER ===
    const handleRouting = () => {
        const user = window.getCurrentUser();
        let hash = window.location.hash.substring(1) || '';

        // Role-based route gating
        if (user.role === 'salesperson') {
            const allowedSalesperson = ['calculator', 'purchases', 'customers', 'expenses', 'keepers', 'profile', 'help'];
            if (!hash || hash === 'dashboard') {
                window.location.hash = '#calculator';
                return;
            }
            if (!allowedSalesperson.includes(hash)) {
                window.showToast('Access Denied: Your account role does not have permission to view this section.', 'error');
                window.location.hash = '#calculator';
                return;
            }
        } else if (user.role === 'staff') {
            const adminOnly = ['users', 'audit', 'settings'];
            if (!hash) {
                window.location.hash = '#dashboard';
                return;
            }
            if (adminOnly.includes(hash)) {
                window.showToast('Access Denied: Only administrators have access to this section.', 'error');
                window.location.hash = '#dashboard';
                return;
            }
        } else {
            // Admin or default
            if (!hash) {
                window.location.hash = '#dashboard';
                return;
            }
        }

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

        // Close mobile menu on navigation
        if (window.closeMobileMenu) {
            window.closeMobileMenu();
        }

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
    window.loadSystemSettings();

    // Clock
    setInterval(() => {
        document.getElementById('clock').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, 1000);
});

// --- Capital Withdrawal (Partial Amount or Clear All) ---
window.withdrawAllCapital = async () => {
    if (!window.isAdmin()) {
        return window.showToast('Access Denied: Only administrators have permission to perform Capital Withdrawals.', 'error');
    }
    let availableBalance = 0;
    try {
        const res = await window.api.get('/capital/balance.php');
        if (res) {
            if (res.available_cash_ghs !== undefined) {
                availableBalance = parseFloat(res.available_cash_ghs) || 0;
            } else if (res.data && res.data.available_cash_ghs !== undefined) {
                availableBalance = parseFloat(res.data.available_cash_ghs) || 0;
            }
        }
    } catch (err) {
        console.error("Error fetching capital balance:", err);
    }

    // Safety fallback: check displayed liquidity if API returned 0 or errored
    if (availableBalance <= 0) {
        const candidates = document.querySelectorAll('div, span');
        for (const el of candidates) {
            const txt = (el.innerText || el.textContent || '').trim();
            if (txt.includes('GHS') && (txt.includes('Available Liquidity') || (el.previousElementSibling && el.previousElementSibling.textContent.includes('Available Liquidity')))) {
                const clean = txt.replace(/,/g, '');
                const m = clean.match(/([0-9]+(\.[0-9]+)?)/);
                if (m && parseFloat(m[1]) > 0) {
                    availableBalance = parseFloat(m[1]);
                    break;
                }
            }
        }
    }

    if (availableBalance <= 0) {
        const emptyHtml = `
            <div style="text-align: center; padding: 24px 10px;">
                <div style="width: 52px; height: 52px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px;">
                    <span class="material-symbols-outlined" style="font-size: 28px;">account_balance_wallet</span>
                </div>
                <h3 style="margin: 0 0 8px; color: var(--text-main); font-size: 1.1rem; font-weight: 700;">No Available Capital</h3>
                <p style="color: var(--text-muted); line-height: 1.5; margin: 0 0 20px; font-size: 0.88rem;">
                    Your capital ledger currently has <strong>GHS 0.00</strong> available liquidity. There are no funds available to withdraw at this time.
                </p>
                <button class="btn btn-primary btn-block" style="padding: 11px; border-radius: 8px;" onclick="window.closeModal()">Close</button>
            </div>
        `;
        return window.openModal('Withdraw Capital', emptyHtml, { size: 'sm', maxWidth: '380px' });
    }

    const formattedBal = availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const html = `
        <div style="padding: 4px 0;">
            <!-- Current Balance Banner -->
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #e8f5e9 100%); border: 1px solid #bbf7d0; border-radius: 14px; padding: 14px 16px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background: #dcfce7; color: #15803d; display: flex; align-items: center; justify-content: center;">
                        <span class="material-symbols-outlined" style="font-size: 22px;">account_balance_wallet</span>
                    </div>
                    <div>
                        <div style="font-size: 0.72rem; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Available Liquidity</div>
                        <div style="font-size: 1.35rem; font-weight: 800; color: #14532d; line-height: 1.2;">
                            <span style="font-size: 0.85rem; font-weight: 600; color: #15803d;">GHS</span> ${formattedBal}
                        </div>
                    </div>
                </div>
                <div style="background: #ffffff; border: 1px solid #bbf7d0; color: #15803d; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">
                    Active
                </div>
            </div>

            <!-- Segmented Mode Control -->
            <div style="display: flex; background: var(--bg-main); border: 1px solid var(--border); border-radius: 10px; padding: 3px; margin-bottom: 18px;">
                <button type="button" id="withdraw-tab-partial" onclick="window.switchWithdrawalMode('partial', ${availableBalance})" style="flex: 1; padding: 8px 12px; font-size: 0.85rem; font-weight: 700; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s; background: white; color: var(--text-main); box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
                    <span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle; margin-right: 4px;">payments</span> Withdraw Amount
                </button>
                <button type="button" id="withdraw-tab-all" onclick="window.switchWithdrawalMode('all', ${availableBalance})" style="flex: 1; padding: 8px 12px; font-size: 0.85rem; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s; background: transparent; color: var(--text-muted);">
                    <span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle; margin-right: 4px;">cleaning_services</span> Clear All Capital
                </button>
            </div>

            <!-- View 1: Partial Amount -->
            <div id="withdraw-view-partial">
                <div class="form-group" style="margin-bottom: 10px;">
                    <label style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">
                        <span>Withdrawal Amount (GHS)</span>
                        <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">Max: GHS ${formattedBal}</span>
                    </label>
                    <div style="position: relative; display: flex; align-items: center;">
                        <span style="position: absolute; left: 14px; font-weight: 700; color: var(--text-muted); font-size: 0.95rem;">GHS</span>
                        <input type="number" id="withdraw_amount_input" step="0.01" min="0.01" max="${availableBalance}" placeholder="0.00" style="width: 100%; padding: 12px 14px 12px 54px; font-size: 1.15rem; font-weight: 800; border: 1.5px solid var(--border); border-radius: 10px; background: var(--bg-surface); color: var(--text-main); outline: none;">
                    </div>
                </div>

                <!-- Quick Fill Chips -->
                <div style="display: flex; gap: 6px; margin-bottom: 14px;">
                    <button type="button" class="btn btn-outline" onclick="window.setWithdrawAmountPercent(0.25, ${availableBalance})" style="flex: 1; padding: 4px 6px; font-size: 0.75rem; font-weight: 600; border-radius: 6px;">25%</button>
                    <button type="button" class="btn btn-outline" onclick="window.setWithdrawAmountPercent(0.50, ${availableBalance})" style="flex: 1; padding: 4px 6px; font-size: 0.75rem; font-weight: 600; border-radius: 6px;">50%</button>
                    <button type="button" class="btn btn-outline" onclick="window.setWithdrawAmountPercent(0.75, ${availableBalance})" style="flex: 1; padding: 4px 6px; font-size: 0.75rem; font-weight: 600; border-radius: 6px;">75%</button>
                    <button type="button" class="btn btn-outline" onclick="window.setWithdrawAmountPercent(1.00, ${availableBalance})" style="flex: 1.2; padding: 4px 6px; font-size: 0.75rem; font-weight: 700; border-radius: 6px; color: #b91c1c; border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.05);">All (100%)</button>
                </div>

                <!-- Calculation Summary Box -->
                <div style="background: var(--bg-main); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; display: flex; flex-direction: column; gap: 6px; font-size: 0.83rem;">
                    <div style="display: flex; justify-content: space-between; color: var(--text-muted);">
                        <span>Withdrawal Outflow</span>
                        <span id="withdraw_calc_outflow" style="font-weight: 700; color: #ef4444;">- GHS 0.00</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; color: var(--text-main); border-top: 1px dashed var(--border); padding-top: 6px;">
                        <span style="font-weight: 600;">Remaining Liquidity</span>
                        <span id="withdraw_calc_remaining" style="font-weight: 800; color: #15803d;">GHS ${formattedBal}</span>
                    </div>
                </div>

                <!-- Optional Note -->
                <div class="form-group" style="margin-bottom: 18px;">
                    <label style="display: block; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">Reason / Description (Optional)</label>
                    <input type="text" id="withdraw_partial_description" placeholder="e.g. Bank transfer, petty cash, owner payout" style="width: 100%; padding: 9px 12px; font-size: 0.85rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-surface); color: var(--text-main);">
                </div>
            </div>

            <!-- View 2: Clear All -->
            <div id="withdraw-view-all" style="display: none;">
                <div style="background: rgba(239, 68, 68, 0.06); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 16px; text-align: center;">
                    <div style="width: 44px; height: 44px; background: rgba(239, 68, 68, 0.12); color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;">
                        <span class="material-symbols-outlined" style="font-size: 24px;">warning</span>
                    </div>
                    <h4 style="margin: 0 0 6px; color: #b91c1c; font-size: 1rem; font-weight: 800;">Are you absolutely sure?</h4>
                    <p style="color: #64748b; font-size: 0.82rem; line-height: 1.45; margin: 0 0 12px;">
                        You are about to withdraw all available capital from the system. This will reset your available liquidity to <strong>GHS 0.00</strong>.
                    </p>
                    <div style="background: white; border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span style="color: #64748b;">Remaining Liquidity:</span>
                        <strong style="color: #ef4444; font-size: 0.95rem;">GHS 0.00</strong>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 18px;">
                    <label style="display: block; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">Reason / Description (Optional)</label>
                    <input type="text" id="withdraw_all_description" value="Full Capital Withdrawal (Clear)" style="width: 100%; padding: 9px 12px; font-size: 0.85rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-surface); color: var(--text-main);">
                </div>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" class="btn btn-outline" style="flex: 1; padding: 11px;" onclick="window.closeModal()">Cancel</button>
                <button type="button" id="btn-submit-withdrawal" class="btn btn-primary" style="flex: 1.3; padding: 11px; background: #2563eb; border-color: #2563eb; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 6px;" onclick="window.submitCapitalWithdrawal(${availableBalance})">
                    <span class="material-symbols-outlined" style="font-size: 18px;">payments</span>
                    <span id="btn-submit-withdrawal-text">Withdraw Amount</span>
                </button>
            </div>
        </div>
    `;

    window.openModal('Capital Withdrawal', html, { size: 'sm', maxWidth: '440px' });

    window._currentWithdrawalMode = 'partial';
    const amountInp = document.getElementById('withdraw_amount_input');
    if (amountInp) {
        amountInp.addEventListener('input', () => {
            window.updateWithdrawalCalculations(availableBalance);
        });
    }
};

window.switchWithdrawalMode = (mode, totalBalance) => {
    window._currentWithdrawalMode = mode;
    const tabPartial = document.getElementById('withdraw-tab-partial');
    const tabAll = document.getElementById('withdraw-tab-all');
    const viewPartial = document.getElementById('withdraw-view-partial');
    const viewAll = document.getElementById('withdraw-view-all');
    const btnSubmit = document.getElementById('btn-submit-withdrawal');
    const btnText = document.getElementById('btn-submit-withdrawal-text');

    if (mode === 'all') {
        if (tabPartial) {
            tabPartial.style.background = 'transparent';
            tabPartial.style.color = 'var(--text-muted)';
            tabPartial.style.boxShadow = 'none';
            tabPartial.style.fontWeight = '600';
        }
        if (tabAll) {
            tabAll.style.background = 'white';
            tabAll.style.color = '#b91c1c';
            tabAll.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
            tabAll.style.fontWeight = '700';
        }
        if (viewPartial) viewPartial.style.display = 'none';
        if (viewAll) viewAll.style.display = 'block';

        if (btnSubmit) {
            btnSubmit.style.background = '#ef4444';
            btnSubmit.style.borderColor = '#ef4444';
            btnSubmit.disabled = false;
        }
        if (btnText) {
            btnText.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px; margin-right: 4px; vertical-align: middle;">cleaning_services</span> Yes, Clear All Capital';
        }
    } else {
        if (tabPartial) {
            tabPartial.style.background = 'white';
            tabPartial.style.color = 'var(--text-main)';
            tabPartial.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
            tabPartial.style.fontWeight = '700';
        }
        if (tabAll) {
            tabAll.style.background = 'transparent';
            tabAll.style.color = 'var(--text-muted)';
            tabAll.style.boxShadow = 'none';
            tabAll.style.fontWeight = '600';
        }
        if (viewPartial) viewPartial.style.display = 'block';
        if (viewAll) viewAll.style.display = 'none';

        if (btnSubmit) {
            btnSubmit.style.background = '#2563eb';
            btnSubmit.style.borderColor = '#2563eb';
        }
        window.updateWithdrawalCalculations(totalBalance);
    }
};

window.setWithdrawAmountPercent = (fraction, totalBalance) => {
    const amountInp = document.getElementById('withdraw_amount_input');
    if (!amountInp) return;
    const computed = Math.floor(totalBalance * fraction * 100) / 100;
    amountInp.value = computed.toFixed(2);
    window.updateWithdrawalCalculations(totalBalance);
};

window.updateWithdrawalCalculations = (totalBalance) => {
    if (window._currentWithdrawalMode !== 'partial') return;

    const amountInp = document.getElementById('withdraw_amount_input');
    const outflowEl = document.getElementById('withdraw_calc_outflow');
    const remainingEl = document.getElementById('withdraw_calc_remaining');
    const btnSubmit = document.getElementById('btn-submit-withdrawal');
    const btnText = document.getElementById('btn-submit-withdrawal-text');

    const amount = parseFloat(amountInp ? amountInp.value : 0) || 0;
    const remaining = totalBalance - amount;

    if (outflowEl) {
        outflowEl.textContent = '- GHS ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    if (remainingEl) {
        if (amount > totalBalance) {
            remainingEl.textContent = 'Exceeds balance! (Max GHS ' + totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 }) + ')';
            remainingEl.style.color = '#ef4444';
            if (btnSubmit) btnSubmit.disabled = true;
            if (btnText) btnText.textContent = 'Amount Exceeds Capital';
            return;
        } else {
            remainingEl.textContent = 'GHS ' + Math.max(0, remaining).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            remainingEl.style.color = '#15803d';
            if (btnSubmit) btnSubmit.disabled = false;
        }
    }

    if (btnText) {
        if (amount > 0) {
            btnText.textContent = 'Withdraw GHS ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else {
            btnText.textContent = 'Withdraw Amount';
        }
    }
};

window.submitCapitalWithdrawal = async (totalBalance) => {
    if (!window.isAdmin()) {
        return window.showToast('Access Denied: Only administrators have permission to perform Capital Withdrawals.', 'error');
    }
    const btn = document.getElementById('btn-submit-withdrawal');
    const mode = window._currentWithdrawalMode || 'partial';
    let payload = {};

    if (mode === 'all') {
        const desc = document.getElementById('withdraw_all_description')?.value || 'Full Capital Withdrawal (Clear)';
        payload = { mode: 'all', description: desc };
    } else {
        const amount = parseFloat(document.getElementById('withdraw_amount_input')?.value);
        if (isNaN(amount) || amount <= 0) {
            return window.showToast('Please enter a valid withdrawal amount greater than zero.', 'error');
        }
        if (amount > (totalBalance + 0.001)) {
            return window.showToast(`Withdrawal amount (GHS ${amount.toFixed(2)}) cannot exceed available capital (GHS ${totalBalance.toFixed(2)}).`, 'error');
        }
        const desc = document.getElementById('withdraw_partial_description')?.value || '';
        payload = { mode: 'partial', amount_ghs: amount, description: desc };
    }

    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="material-symbols-outlined spin" style="font-size: 18px;">sync</span> Processing...';
        }

        const res = await window.api.post('/capital/withdraw_all.php', payload);
        window.showToast(res.message || 'Capital withdrawn successfully.', 'success');
        window.closeModal();

        // Refresh currently active page
        if (window.location.hash === '#dashboard' && window.loadDashboard) {
            window.loadDashboard();
        } else if (window.location.hash === '#ledger' && window.loadLedgerDashboard) {
            window.loadLedgerDashboard();
        } else if (window.location.hash === '#transactions' && window.loadTransactionsView) {
            window.loadTransactionsView();
        } else {
            const currentRoute = window.location.hash.replace('#', '') || 'dashboard';
            window.dispatchEvent(new CustomEvent('route-changed', {
                detail: { route: currentRoute, container: document.getElementById('view-container') }
            }));
        }
    } catch (e) {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">payments</span> <span id="btn-submit-withdrawal-text">${mode === 'all' ? 'Yes, Clear All Capital' : 'Withdraw Amount'}</span>`;
        }
        window.showToast(e.message || 'Failed to withdraw capital.', 'error');
    }
};

window.executeWithdrawAllCapital = () => window.submitCapitalWithdrawal(0);

