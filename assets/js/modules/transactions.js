// assets/js/modules/transactions.js

window.addEventListener('route-changed', async (e) => {
    if (e.detail.route !== 'transactions') return;
    const container = e.detail.container;

    container.innerHTML = `
        <div style="display: flex; justify-content: center; padding: 40px;">
            <span class="material-symbols-outlined spin" style="font-size: 2rem; color: var(--gold-primary);">sync</span>
        </div>
    `;

    try {
        const data = await window.api.get('/ledger/history.php');
        const transactionsList = data.transactions || [];

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 class="page-title" style="margin: 0;">Global Transactions Ledger</h2>
                <button class="btn btn-outline" onclick="window.location.hash='dashboard'" style="border-radius: var(--radius-pill); background: #ffffff;">
                    <span class="material-symbols-outlined">payments</span> Inject Capital
                </button>
            </div>
            
            <div class="glass-panel" style="background: transparent; border: none; box-shadow: none; padding: 0;">
                <div class="journey-stream">
                    ${transactionsList.length === 0 ? '<p style="color: var(--text-muted);">No transactions found.</p>' : ''}
                    ${transactionsList.map((tx, index) => {
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
                                    <div class="journey-ref" style="display: flex; gap: 8px;">
                                        <span style="background: var(--bg-main); padding: 2px 6px; border-radius: 4px;">TX-${String(tx.id).padStart(6, '0')}</span>
                                        ${tx.reference_id ? `<span style="color: var(--text-muted);">Ref: ${tx.reference_id}</span>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Failed to load transactions', error);
        container.innerHTML = `<div class="alert alert-danger">Failed to load transactions.</div>`;
    }
});
