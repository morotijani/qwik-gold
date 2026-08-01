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
                    <div style="background: linear-gradient(145deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 100%); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 20px; padding: clamp(20px, 4vw, 32px); display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 24px; box-shadow: 0 10px 30px rgba(245,158,11,0.05); margin-bottom: 24px; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: rgba(245,158,11,0.1); border-radius: 50%; filter: blur(30px);"></div>
                        <div style="position: absolute; bottom: -30px; right: 40px; width: 120px; height: 120px; background: rgba(245,158,11,0.1); border-radius: 50%; filter: blur(20px);"></div>
                        
                        <div style="position: relative; z-index: 1; flex: 1; min-width: 250px;">
                            <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Loan Reference</div>
                            <div style="font-size: clamp(1.5rem, 5vw, 2rem); font-weight: 800; color: var(--text-main); letter-spacing: -0.5px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                                ${loan.loan_uid || 'LN-' + String(loan.id).padStart(6, '0')}
                                <span style="font-size: 0.75rem; padding: 6px 12px; border-radius: 20px; font-weight: 800; background: ${loan.status === 'active' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)'}; color: ${loan.status === 'active' ? '#d97706' : '#059669'}; border: 1px solid ${loan.status === 'active' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}; text-transform: uppercase; letter-spacing: 1px;">
                                    ${loan.status}
                                </span>
                            </div>
                        </div>
                        
                        <div style="text-align: left; position: relative; z-index: 1; flex: 1; min-width: 250px;">
                            <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Current Outstanding</div>
                            <div style="font-size: clamp(1.8rem, 6vw, 2.5rem); font-weight: 800; color: ${loan.principal_amount > 0 ? '#ef4444' : '#10b981'}; margin-bottom: 12px; word-break: break-word;">
                                ₵ ${parseFloat(loan.principal_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            ${loan.status === 'active' ? `<button class="btn btn-primary" onclick="window.closeModal(); setTimeout(() => window.openSettleLoanWizard(${loan.id}, ${loan.customer_id}, '${loan.type}', ${loan.principal_amount}), 300);" style="padding: 8px 16px; font-size: 0.85rem; font-weight: 700; border-radius: 8px; box-shadow: 0 4px 15px rgba(245,158,11,0.3); border: none; display: inline-flex; align-items: center; justify-content: center;">Settle Loan</button>` : ''}
                        </div>
                    </div>

                    <!-- Information Grid -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 24px;">
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
                        <div style="background: white; border-radius: 16px; border: 1px solid var(--border); overflow-x: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                            <table style="width: 100%; border-collapse: collapse; min-width: 600px;">
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

    window.getThermalPrintHTMLLoan = (loan, dateObj) => {
        const loanUid = loan.loan_uid || 'LN-' + String(loan.id).padStart(6, '0');
        const customerName = loan.customer_name || 'Walk-In';

        return `
        <div class="print-only thermal-receipt" style="display: none; position: fixed; top: 0; left: 0; font-family: monospace !important; color: black; background: white; width: 100%; max-width: 300px; padding: 20px; z-index: 999999; box-sizing: border-box;">
            <div style="text-align: center; margin-bottom: 15px;">
                <div style="font-size: 1.2rem; font-weight: bold;">Mukhlis Farhan Trading Limited</div>
                <div style="font-size: 0.9rem;">AC-0064-9566, Konongo - Odumase</div>
                <div style="font-size: 0.9rem;">+233 55 400 1608 / +233 55 369 8903</div>
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
                                <span style="font-size: 1.1rem; font-weight: 800; color: var(--danger);">₵${parseFloat(loan.original_principal).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
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
            
            document.getElementById('global-modal').classList.add('active');
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


    // Global Modal for Converting Gold Balls to Refined
    window.openConvertBallsModal = (maxGramsAvailable, ownershipStatus, customerId = null, callback = null) => {
        const html = `
            <div style="padding: 24px;">
                <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <div style="font-size: 0.85rem; color: var(--warning); font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Available Balls to Convert</div>
                    <div style="font-size: 1.5rem; font-weight: 800; color: var(--text-main);">${maxGramsAvailable} <span style="font-size: 1rem; color: var(--text-muted);">g</span></div>
                </div>

                <!-- Hidden field for balls used to keep logic intact -->
                <input type="hidden" id="convert-balls-used" value="${maxGramsAvailable}">

                <div style="border-top: 1px dashed var(--border); margin: 24px 0;"></div>

                <h4 style="margin: 0 0 16px 0; font-size: 1.1rem; color: var(--text-main);">Resulting Refined Gold</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                    <div class="form-group" style="margin: 0;">
                        <label>Refined Weight (Grams)</label>
                        <div class="input-with-icon">
                            <span class="material-symbols-outlined">diamond</span>
                            <input type="number" id="convert-refined-grams" step="0.0001" min="0.0001">
                        </div>
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label>Refined Volume</label>
                        <div class="input-with-icon">
                            <span class="material-symbols-outlined">water_drop</span>
                            <input type="number" id="convert-refined-volume" step="0.0001" min="0.0001">
                        </div>
                    </div>
                </div>

                <div style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; text-align: center;">
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Density</div>
                        <div id="convert-calc-density" style="font-size: 1.1rem; font-weight: 700; color: var(--text-main);">-</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Karat</div>
                        <div id="convert-calc-karat" style="font-size: 1.1rem; font-weight: 700; color: var(--warning);">-</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Pounds (lb)</div>
                        <div id="convert-calc-pounds" style="font-size: 1.1rem; font-weight: 700; color: var(--text-main);">-</div>
                    </div>
                </div>

                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="btn btn-outline" onclick="window.closeModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="window.submitConvertBalls('${ownershipStatus}', ${customerId})" style="background: var(--warning); color: #fff; border: none; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                        <span class="material-symbols-outlined">local_fire_department</span> Smelt & Convert
                    </button>
                </div>
            </div>
        `;

        window.openModal('Convert Gold Balls', html, { maxWidth: '500px' });

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
                const density = truncate2(g / v);
                dSpan.innerText = density.toFixed(2);
                
                // Karat Logic matching purchases.js
                if (density > 0) {
                    const karat = truncate2(((density - 10.51) * 52.838) / density);
                    kSpan.innerText = Math.max(0, karat).toFixed(2) + 'k';
                } else {
                    kSpan.innerText = '-';
                }
            } else {
                dSpan.innerText = '-';
                kSpan.innerText = '-';
            }
        };

        gInput.addEventListener('input', updateCalcs);
        vInput.addEventListener('input', updateCalcs);

        window.submitConvertBalls = async (status, custId) => {
            const btn = event.currentTarget;
            const used = parseFloat(uInput.value);
            const refG = parseFloat(gInput.value);
            const refV = parseFloat(vInput.value);

            if (!used || used <= 0 || used > maxGramsAvailable) return window.showToast('Invalid balls used', 'error');
            if (!refG || refG <= 0) return window.showToast('Invalid refined weight', 'error');
            if (!refV || refV <= 0) return window.showToast('Invalid volume', 'error');

            btn.disabled = true;
            btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Converting...';

            try {
                await window.api.post('/vault/convert_balls.php', {
                    ownership_status: status,
                    customer_id: custId,
                    balls_grams_used: used,
                    refined_grams_produced: refG,
                    refined_volume: refV
                });
                window.showToast('Gold successfully converted!', 'success');
                window.closeModal();
                if (callback) callback();
            } catch (err) {
                window.showToast(err.message, 'error');
                btn.disabled = false;
                btn.innerHTML = '<span class="material-symbols-outlined">local_fire_department</span> Smelt & Convert';
            }
        };
    };

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

    // Clock
    setInterval(() => {
        document.getElementById('clock').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, 1000);
});
