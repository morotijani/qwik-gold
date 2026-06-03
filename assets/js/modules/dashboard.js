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
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
                <h2 class="page-title" style="margin: 0;">Enterprise Overview</h2>
                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-outline" onclick="window.showInjectCapitalModal()" style="border-radius: var(--radius-pill); border: 1px solid var(--border); box-shadow: var(--shadow-sm); background: #fff;">
                        <span class="material-symbols-outlined" style="font-size: 1.1rem;">payments</span> Inject Capital
                    </button>
                </div>
            </div>
            
            <div class="metric-grid">
                <div class="metric-card" style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);">
                    <div class="metric-icon" style="background: var(--success-bg); color: var(--success);">
                        <span class="material-symbols-outlined">account_balance</span>
                    </div>
                    <div class="metric-content">
                        <h3>Available Liquidity</h3>
                        <div class="metric-value">${cashFmt}</div>
                    </div>
                </div>

                <div class="metric-card" style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);">
                    <div class="metric-icon" style="background: var(--warning-bg); color: var(--warning);">
                        <span class="material-symbols-outlined">diamond</span>
                    </div>
                    <div class="metric-content">
                        <h3>Company Gold</h3>
                        <div class="metric-value">${companyTotal} g</div>
                    </div>
                </div>

                <div class="metric-card" style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);">
                    <div class="metric-icon" style="background: var(--info-bg); color: var(--info);">
                        <span class="material-symbols-outlined">inventory_2</span>
                    </div>
                    <div class="metric-content">
                        <h3>Keeper Liabilities</h3>
                        <div class="metric-value">${keeperTotal} g</div>
                    </div>
                </div>
            </div>

            <!-- Activity Stream Section -->
            <div class="glass-panel" style="margin-top: 40px;">
                <h3 style="font-size: 1.1rem; margin-bottom: 24px; color: var(--text-main);">Recent Activity Stream</h3>
                <div class="journey-stream">
                    ${recentActivity.length === 0 ? '<p style="color: var(--text-muted);">No recent activity.</p>' : ''}
                    ${recentActivity.map(tx => {
                        const isPositive = parseFloat(tx.amount_ghs) > 0;
                        const iconType = isPositive ? 'arrow_downward' : 'arrow_upward';
                        const dotColor = isPositive ? 'success' : 'danger';
                        const amountColor = isPositive ? 'var(--success)' : 'var(--danger)';
                        const displayType = tx.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                        const amountSign = isPositive ? '+' : '';

                        return `
                        <div class="journey-node">
                            <div class="journey-dot ${dotColor}"></div>
                            <div class="journey-card">
                                <div class="journey-card-left">
                                    <div class="journey-icon" style="background: var(--${dotColor}-bg); color: var(--${dotColor});">
                                        <span class="material-symbols-outlined">${iconType}</span>
                                    </div>
                                    <div class="journey-details">
                                        <div class="journey-title">${displayType}</div>
                                        <div class="journey-date">${new Date(tx.date).toLocaleString()}</div>
                                    </div>
                                </div>
                                <div class="journey-card-right">
                                    <div class="journey-amount" style="color: ${amountColor};">${amountSign}${parseFloat(tx.amount_ghs).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    ${tx.reference_id ? `<div class="journey-ref">Ref: ${tx.reference_id}</div>` : ''}
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
                
                ${recentActivity.length > 0 ? `
                <div style="text-align: center; margin-top: 24px;">
                    <button class="btn btn-text" onclick="window.location.hash='transactions'">View Full Ledger</button>
                </div>
                ` : ''}
            </div>
        `;

    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Failed to load dashboard data.</div>`;
    }
});

window.showInjectCapitalModal = () => {
    const html = `
        <form id="inject-capital-form">
            <div class="form-group">
                <label for="inject-amount">Amount (GHS)</label>
                <div class="input-with-icon">
                    <span class="material-symbols-outlined">payments</span>
                    <input type="number" id="inject-amount" step="0.01" required placeholder="e.g. 50000">
                </div>
            </div>
            <div class="form-group">
                <label for="inject-source">Source / Description</label>
                <div class="input-with-icon">
                    <span class="material-symbols-outlined">description</span>
                    <input type="text" id="inject-source" required placeholder="e.g. Director's Loan">
                </div>
            </div>
            <div style="display: flex; gap: 16px; margin-top: 32px;">
                <button type="button" class="btn btn-outline" style="flex: 1;" onclick="window.closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" style="flex: 1; background: var(--success); color: white;">Inject Funds</button>
            </div>
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
