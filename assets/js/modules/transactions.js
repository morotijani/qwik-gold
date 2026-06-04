window._txState = { page: 1, limit: 15, type: 'all' };

window.addEventListener('route-changed', async (e) => {
    if (e.detail.route !== 'transactions') return;
    const container = e.detail.container;

    // Show initial loading skeleton
    container.innerHTML = `
        <div style="display: flex; justify-content: center; padding: 40px;">
            <span class="material-symbols-outlined spin" style="font-size: 2rem; color: var(--gold-primary);">sync</span>
        </div>
    `;

    window.loadTransactionsData = async () => {
        try {
            const offset = (window._txState.page - 1) * window._txState.limit;
            let url = `/ledger/history.php?limit=${window._txState.limit}&offset=${offset}`;
            if (window._txState.type && window._txState.type !== 'all') {
                url += `&type=${encodeURIComponent(window._txState.type)}`;
            }
            const data = await window.api.get(url);
            const transactionsList = data.transactions || [];
            const totalCount = data.total_count || 0;
            const totalPages = Math.ceil(totalCount / window._txState.limit);

        container.innerHTML = `
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 class="page-title" style="margin: 0; font-size: initial; font-weight: 700; color: var(--text-main);">Global Ledger</h2>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <select id="tx-type-filter" onchange="window.changeTxType(this.value)" style="padding: 10px 16px; border-radius: 8px; border: 1px solid var(--border); font-size: 0.95rem; background: white; cursor: pointer; outline: none; transition: border-color 0.2s;">
                            <option value="all" ${window._txState.type === 'all' ? 'selected' : ''}>All Transactions</option>
                            <option value="external_capital_in" ${window._txState.type === 'external_capital_in' ? 'selected' : ''}>Capital Injected</option>
                            <option value="expense" ${window._txState.type === 'expense' ? 'selected' : ''}>Expense Recorded</option>
                            <option value="expense_refunded" ${window._txState.type === 'expense_refunded' ? 'selected' : ''}>Expense Refunded</option>
                            <option value="loan_issued" ${window._txState.type === 'loan_issued' ? 'selected' : ''}>Loan Issued</option>
                            <option value="loan_repaid" ${window._txState.type === 'loan_repaid' ? 'selected' : ''}>Loan Repaid / Settled</option>
                            <option value="gold_purchase" ${window._txState.type === 'gold_purchase' ? 'selected' : ''}>Gold Purchase / Offset</option>
                            <option value="out_sale_revenue" ${window._txState.type === 'out_sale_revenue' ? 'selected' : ''}>Market Sale Revenue</option>
                        </select>
                    </div>
                </div>
                
                <div class="metric-grid" style="margin-bottom: 32px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
                    <div class="metric-card" style="background: linear-gradient(145deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.01) 100%); border: 1px solid rgba(16, 185, 129, 0.2);">
                        <div class="metric-icon" style="background: #d1fae5; color: #10b981;">
                            <span class="material-symbols-outlined">account_balance</span>
                        </div>
                        <div class="metric-content">
                            <h3>Current Capital Balance</h3>
                            <div class="metric-value" style="color: #10b981;">GHS ${Number(data.current_running_balance_ghs || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>
                </div>
                
                <div style="background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow-x: auto; border: 1px solid var(--border);">
                    <div style="padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="material-symbols-outlined" style="color: var(--text-muted);">history</span>
                            <h3 style="font-size: 1.1rem; margin: 0; color: var(--text-main); font-weight: 700;">Ledger History</h3>
                        </div>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
                        <thead>
                            <tr style="background: var(--bg-main); color: var(--text-muted); font-size: 0.85rem; text-align: left; text-transform: uppercase;">
                                <th style="padding: 16px 24px; font-weight: 600; border-bottom: 1px solid var(--border);">No.</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">TX-ID</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Date & Time</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Type</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Reference</th>
                                <th style="padding: 16px 24px; font-weight: 600; border-bottom: 1px solid var(--border); text-align: right;">Amount (GHS)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transactionsList.length === 0 ? `
                            <tr>
                                <td colspan="6" style="text-align:center; padding: 60px 20px;">
                                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted);">
                                        <div style="background: var(--bg-main); width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                                            <span class="material-symbols-outlined" style="font-size: 32px; opacity: 0.5;">history</span>
                                        </div>
                                        <h4 style="margin: 0 0 8px 0; color: var(--text-main); font-size: 1.1rem;">No Ledger History</h4>
                                        <p style="margin: 0; font-size: 0.95rem;">No transactions have been recorded in the capital ledger yet.</p>
                                    </div>
                                </td>
                            </tr>
                            ` : ''}
                            ${transactionsList.map((tx, index) => {
                                const isPositive = parseFloat(tx.amount_ghs) > 0;
                                const amountColor = isPositive ? 'var(--success)' : 'var(--danger)';
                                const displayType = tx.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                                const amountSign = isPositive ? '+' : '';
                                const dateStr = new Date(tx.date).toLocaleString(undefined, {
                                    year: 'numeric', month: 'short', day: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                });

                                const rowNum = ((window._txState.page - 1) * window._txState.limit) + index + 1;

                                return `
                                <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='white'">
                                    <td style="padding: 16px 24px; color: var(--text-muted);">${rowNum}</td>
                                    <td style="padding: 16px; font-weight: 600; color: var(--text-muted);">TX-${String(tx.id).padStart(6, '0')}</td>
                                    <td style="padding: 16px; color: var(--text-main); font-weight: 500;">${dateStr}</td>
                                    <td style="padding: 16px; color: var(--text-muted); font-weight: 500;">${displayType}</td>
                                    <td style="padding: 16px; color: var(--text-muted); font-size: 0.9rem;">${tx.reference_id ? 'Ref: ' + tx.reference_id : '-'}</td>
                                    <td style="padding: 16px 24px; font-weight: 700; text-align: right; color: ${amountColor};">
                                        ${amountSign}${parseFloat(tx.amount_ghs).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                    
                    ${totalPages > 1 ? `
                    <div style="padding: 16px 24px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: white;">
                        <span style="font-size: 0.9rem; color: var(--text-muted);">Showing page ${window._txState.page} of ${totalPages} (${totalCount} total)</span>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-outline" style="padding: 6px 12px;" 
                                ${window._txState.page === 1 ? 'disabled' : ''} 
                                onclick="window.changeTxPage(${window._txState.page - 1})">Previous</button>
                            <button class="btn btn-outline" style="padding: 6px 12px;" 
                                ${window._txState.page === totalPages ? 'disabled' : ''} 
                                onclick="window.changeTxPage(${window._txState.page + 1})">Next</button>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        } catch (error) {
            console.error('Failed to load transactions', error);
            container.innerHTML = `<div class="alert alert-danger" style="margin: 40px;">Failed to load transactions.</div>`;
        }
    };
    
    window.changeTxPage = (newPage) => {
        window._txState.page = newPage;
        window.loadTransactionsData();
    };

    window.changeTxType = (type) => {
        window._txState.type = type;
        window._txState.page = 1; // reset page to 1 when changing filters
        window.loadTransactionsData();
    };

    await window.loadTransactionsData();
});
