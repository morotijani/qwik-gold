// assets/js/modules/dashboard.js

/**
 * Dashboard Module
 * Responsible for loading the high-level global metrics for the business owner.
 */
window.addEventListener('route-changed', async (e) => {
    if (e.detail.route !== 'dashboard') return;
    
    const container = e.detail.container;

    // Build the skeleton structure for the dashboard
    container.innerHTML = `
        <div style="max-width: 1200px; margin: 0 auto;">
            <h2 class="page-title">Office Overview</h2>
            
            <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-header">
                    <h3>Office Capital</h3>
                    <div class="metric-icon icon-cash">
                        <span class="material-symbols-outlined">payments</span>
                    </div>
                </div>
                <div class="metric-value" id="dash-cash">GHS ...</div>
                <div class="metric-sub">Total Available Liquidity</div>
            </div>

            <div class="metric-card">
                <div class="metric-header">
                    <h3>Company Gold</h3>
                    <div class="metric-icon icon-gold">
                        <span class="material-symbols-outlined">diamond</span>
                    </div>
                </div>
                <div class="metric-value" id="dash-gold-company">... g</div>
                <div class="metric-sub">Physical gold owned by business</div>
            </div>

            <div class="metric-card">
                <div class="metric-header">
                    <h3>Keeper Liabilities</h3>
                    <div class="metric-icon icon-debt">
                        <span class="material-symbols-outlined">balance</span>
                    </div>
                </div>
                <div class="metric-value" id="dash-gold-keeper">... g</div>
                <div class="metric-sub">Physical gold held for Keepers</div>
            </div>
            </div>

            <div class="glass-panel" style="padding: 24px; margin-top: 32px;">
                <h3 style="margin-bottom: 16px;">Inject External Capital</h3>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                <button class="btn btn-primary" onclick="window.showInjectCapitalModal()">
                    <span class="material-symbols-outlined">payments</span> Inject Capital
                </button>
                <button class="btn btn-outline" onclick="window.location.hash='transactions'">
                    <span class="material-symbols-outlined">add</span> New Transaction
                </button>
                <button class="btn btn-outline" onclick="window.location.hash='customers'">
                    <span class="material-symbols-outlined">person_add</span> Add Customer
                </button>
            </div>
        </div>
    `;

    try {
        // Fetch Dashboard Data concurrently for maximum speed
        const [capitalData, vaultData] = await Promise.all([
            window.api.get('/capital/balance.php'),
            window.api.get('/vault/status.php')
        ]);

        // Inject Data into DOM securely
        
        // 1. Format Currency
        const cashFmt = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(capitalData.available_cash_ghs);
        document.getElementById('dash-cash').textContent = cashFmt;

        // 2. Format Gold Weights
        // Calculate totals dynamically from the structured vault response
        const companyTotal = (vaultData.company_owned.balls_grams + vaultData.company_owned.refined_grams).toFixed(2);
        const keeperTotal = (vaultData.keeper_held.balls_grams + vaultData.keeper_held.refined_grams).toFixed(2);

        document.getElementById('dash-gold-company').textContent = `${companyTotal} g`;
        document.getElementById('dash-gold-keeper').textContent = `${keeperTotal} g`;

    } catch (error) {
        // Error toast will automatically be handled by the API wrapper, 
        // but we can update the UI to show failure state
        document.getElementById('dash-cash').textContent = 'Error';
        document.getElementById('dash-gold-company').textContent = 'Error';
        document.getElementById('dash-gold-keeper').textContent = 'Error';
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
                <button type="submit" class="btn btn-primary" style="flex: 1;">Inject Funds</button>
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
            // Reload the dashboard to update metrics
            window.dispatchEvent(new CustomEvent('route-changed', { detail: { route: 'dashboard', container: document.getElementById('view-container') } }));
        } catch (error) {
            window.showToast(error.message || 'Failed to inject capital', 'error');
            btn.disabled = false;
            btn.innerHTML = 'Inject Funds';
        }
    });
};
