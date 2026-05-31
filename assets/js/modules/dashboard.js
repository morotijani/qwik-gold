// assets/js/modules/dashboard.js

/**
 * Dashboard Module
 * Re-designed as a Flowing UI
 */
window.addEventListener('route-changed', async (e) => {
    if (e.detail.route !== 'dashboard') return;
    
    const container = e.detail.container;

    // Loading Skeleton
    container.innerHTML = `
        <div style="display: flex; justify-content: center; padding: 40px;">
            <span class="material-symbols-outlined spin" style="font-size: 2rem; color: var(--gold-primary);">sync</span>
        </div>
    `;

    try {
        const [capitalData, vaultData, recentTxData] = await Promise.all([
            window.api.get('/capital/balance.php'),
            window.api.get('/vault/status.php'),
            window.api.get('/ledger/history.php') // Use this for the activity stream
        ]);

        const cashFmt = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(capitalData.available_cash_ghs);
        const companyTotal = (vaultData.company_owned.balls_grams + vaultData.company_owned.refined_grams).toFixed(2);
        const keeperTotal = (vaultData.keeper_held.balls_grams + vaultData.keeper_held.refined_grams).toFixed(2);
        
        // Grab top 5 recent transactions
        const recentActivity = (recentTxData.transactions || []).slice(0, 5);

        container.innerHTML = `
            <div style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; padding: 24px 32px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2 style="margin: 0 0 8px 0; font-size: 1.5rem; color: var(--text-main); font-weight: 700;">Welcome back to Qwik-Gold</h2>
                    <p style="margin: 0; font-size: 1rem; color: var(--text-muted);">Here is your business overview for today.</p>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-outline" onclick="window.showInjectCapitalModal()" style="display: flex; align-items: center; gap: 8px;">
                        <span class="material-symbols-outlined" style="font-size: 1.2rem;">payments</span> Inject Capital
                    </button>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 40px;">
                <div style="background: var(--bg-surface); border-radius: 12px; padding: 24px; border: 1px solid var(--border);">
                    <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
                        <div style="width: 48px; height: 48px; border-radius: 12px; background: var(--success-bg); color: var(--success); display: flex; align-items: center; justify-content: center;">
                            <span class="material-symbols-outlined" style="font-size: 24px;">account_balance</span>
                        </div>
                        <h3 style="margin: 0; font-size: 1rem; color: var(--text-muted); font-weight: 500;">Available Liquidity</h3>
                    </div>
                    <div style="font-size: 2rem; font-weight: 700; color: var(--text-main);">${cashFmt}</div>
                </div>

                <div style="background: var(--bg-surface); border-radius: 12px; padding: 24px; border: 1px solid var(--border);">
                    <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
                        <div style="width: 48px; height: 48px; border-radius: 12px; background: var(--warning-bg); color: var(--warning); display: flex; align-items: center; justify-content: center;">
                            <span class="material-symbols-outlined" style="font-size: 24px;">diamond</span>
                        </div>
                        <h3 style="margin: 0; font-size: 1rem; color: var(--text-muted); font-weight: 500;">Company Gold</h3>
                    </div>
                    <div style="font-size: 2rem; font-weight: 700; color: var(--text-main);">${companyTotal} <span style="font-size: 1.2rem; font-weight: 600; color: var(--text-muted);">g</span></div>
                </div>

                <div style="background: var(--bg-surface); border-radius: 12px; padding: 24px; border: 1px solid var(--border);">
                    <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
                        <div style="width: 48px; height: 48px; border-radius: 12px; background: var(--info-bg); color: var(--info); display: flex; align-items: center; justify-content: center;">
                            <span class="material-symbols-outlined" style="font-size: 24px;">inventory_2</span>
                        </div>
                        <h3 style="margin: 0; font-size: 1rem; color: var(--text-muted); font-weight: 500;">Keeper Liabilities</h3>
                    </div>
                    <div style="font-size: 2rem; font-weight: 700; color: var(--text-main);">${keeperTotal} <span style="font-size: 1.2rem; font-weight: 600; color: var(--text-muted);">g</span></div>
                </div>
            </div>

            <!-- Quick Actions -->
            <h3 style="font-size: 1.1rem; margin-bottom: 16px; color: var(--text-main);">Quick Actions</h3>
            <div style="display: flex; gap: 16px; margin-bottom: 40px; overflow-x: auto; padding-bottom: 8px;">
                <button class="btn" onclick="window.location.hash='sales'" style="background: var(--bg-surface); border: 1px solid var(--border); padding: 16px 24px; border-radius: 12px; flex: 1; min-width: 200px; display: flex; align-items: center; gap: 12px; font-weight: 600; font-size: 1rem; color: var(--text-main); transition: all 0.2s ease;" onmouseover="this.style.background='var(--bg-hover)'; this.style.borderColor='var(--gold-primary)';" onmouseout="this.style.background='var(--bg-surface)'; this.style.borderColor='var(--border)';">
                    <div style="background: var(--bg-main); width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--gold-primary);">
                        <span class="material-symbols-outlined">add_shopping_cart</span>
                    </div>
                    New Sale
                </button>
                <button class="btn" onclick="window.location.hash='expenses'" style="background: var(--bg-surface); border: 1px solid var(--border); padding: 16px 24px; border-radius: 12px; flex: 1; min-width: 200px; display: flex; align-items: center; gap: 12px; font-weight: 600; font-size: 1rem; color: var(--text-main); transition: all 0.2s ease;" onmouseover="this.style.background='var(--bg-hover)'; this.style.borderColor='var(--danger)';" onmouseout="this.style.background='var(--bg-surface)'; this.style.borderColor='var(--border)';">
                    <div style="background: var(--danger-light); width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--danger);">
                        <span class="material-symbols-outlined">receipt_long</span>
                    </div>
                    Record Expense
                </button>
                <button class="btn" onclick="window.location.hash='transactions'" style="background: var(--bg-surface); border: 1px solid var(--border); padding: 16px 24px; border-radius: 12px; flex: 1; min-width: 200px; display: flex; align-items: center; gap: 12px; font-weight: 600; font-size: 1rem; color: var(--text-main); transition: all 0.2s ease;" onmouseover="this.style.background='var(--bg-hover)'; this.style.borderColor='var(--info)';" onmouseout="this.style.background='var(--bg-surface)'; this.style.borderColor='var(--border)';">
                    <div style="background: var(--info-bg); width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--info);">
                        <span class="material-symbols-outlined">receipt</span>
                    </div>
                    View Ledger
                </button>
            </div>

            <!-- Activity Stream Section -->
            <div style="background: var(--bg-surface); border-radius: 12px; padding: 24px; border: 1px solid var(--border);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h3 style="font-size: 1.2rem; margin: 0; color: var(--text-main); font-weight: 600;">Recent Activity</h3>
                    <button class="btn btn-outline" onclick="window.location.hash='transactions'">View All</button>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Type</th>
                                <th>Reference</th>
                                <th style="text-align: right;">Amount (GHS)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${recentActivity.length === 0 ? '<tr><td colspan="4" style="text-align: center;">No recent activity.</td></tr>' : ''}
                            ${recentActivity.map(tx => {
                                const isPositive = parseFloat(tx.amount_ghs) > 0;
                                const amountColor = isPositive ? 'var(--success)' : 'var(--danger)';
                                const displayType = tx.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                                const amountSign = isPositive ? '+' : '';

                                return `
                                <tr>
                                    <td>${new Date(tx.date).toLocaleString()}</td>
                                    <td>${displayType}</td>
                                    <td>${tx.reference_id ? 'Ref: ' + tx.reference_id : '-'}</td>
                                    <td style="text-align: right; color: ${amountColor}; font-weight: 600;">
                                        ${amountSign}${parseFloat(Math.abs(tx.amount_ghs)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Failed to load dashboard data.</div>`;
    }
});

window.showInjectCapitalModal = () => {
    const html = `
        <form id="inject-capital-form">
            <div style="background: linear-gradient(145deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.02) 100%); border: 1px solid rgba(16, 185, 129, 0.2); color: #065f46; padding: 16px; border-radius: 8px; margin-bottom: 24px; font-size: 0.9rem; display: flex; gap: 12px; align-items: flex-start;">
                <span class="material-symbols-outlined" style="margin-top: 2px;">info</span>
                <div>
                    <strong>External Capital</strong><br>
                    This amount will be added to the available liquidity in your Capital Ledger.
                </div>
            </div>

            <style>
                #inject-amount:focus {
                    outline: none !important;
                    border-color: transparent !important;
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.02) !important;
                }
                #inject-amount::-webkit-outer-spin-button,
                #inject-amount::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                #inject-amount[type=number] {
                    -moz-appearance: textfield;
                }
            </style>

            <div class="form-group" style="text-align: center; margin-bottom: 24px;">
                <label style="display: block; font-size: 1rem; color: var(--text-muted); margin-bottom: 12px; font-weight: 600;">Amount to Inject (GHS) <span style="color: var(--danger);">*</span></label>
                <input type="number" id="inject-amount" step="0.01" min="0.01" required placeholder="0.00" style="padding: 24px 16px; font-size: 3.5rem; font-weight: 800; text-align: center; height: 100px; border-radius: 16px; border: none; outline: none; color: var(--success); background: var(--bg-main); letter-spacing: -1px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
            </div>

            <div class="form-group">
                <label for="inject-source">Source / Description <span style="color: var(--danger);">*</span></label>
                <input type="text" id="inject-source" required placeholder="e.g. Director's Loan, External Funding..." style="padding: 12px; font-size: 1rem;">
            </div>

            <button type="submit" class="btn btn-primary btn-block" style="margin-top: 32px; background: var(--success); border-color: var(--success); color: white; font-size: 1rem; padding: 14px;">
                <span class="material-symbols-outlined">payments</span> Confirm Injection
            </button>
        </form>
    `;
    
    window.openModal('Inject External Capital', html);

    document.getElementById('inject-capital-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = document.getElementById('inject-amount').value;
        const source = document.getElementById('inject-source').value;
        const btn = e.target.querySelector('button[type="submit"]');
        
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';

        try {
            const res = await window.api.post('/capital/inject.php', {
                amount_ghs: parseFloat(amount),
                source_description: source
            });
            window.showToast('Capital injected successfully!', 'success');
            window.closeModal();
            window.dispatchEvent(new CustomEvent('route-changed', { detail: { route: 'dashboard', container: document.getElementById('view-container') } }));
        } catch (error) {
            window.showToast(error.message || 'Failed to inject capital', 'error');
            btn.disabled = false;
            btn.innerHTML = 'Inject Funds';
        }
    });
};
