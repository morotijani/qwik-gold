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
                        <div id="custom-tx-filter" style="position: relative; width: 240px;">
                            <div class="custom-dropdown-btn" onclick="document.getElementById('custom-dropdown-menu').classList.toggle('hidden')" style="padding: 12px 20px; border-radius: 12px; border: 1px solid rgba(212, 175, 55, 0.3); font-size: 0.95rem; font-weight: 600; color: var(--text-main); background: rgba(212, 175, 55, 0.08); cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(212, 175, 55, 0.05); transition: all 0.2s;">
                                <span id="custom-dropdown-text">
                                    ${window._txState.type === 'all' ? 'All Transactions' : 
                                      window._txState.type === 'external_capital_in' ? 'Capital Injected' :
                                      window._txState.type === 'expense' ? 'Expense Recorded' :
                                      window._txState.type === 'expense_refunded' ? 'Expense Refunded' :
                                      window._txState.type === 'loan_issued' ? 'Loan Issued' :
                                      window._txState.type === 'loan_repaid' ? 'Loan Repaid / Settled' :
                                      window._txState.type === 'gold_purchase' ? 'Gold Purchase / Offset' :
                                      window._txState.type === 'out_sale_revenue' ? 'Market Sale Revenue' : 'All Transactions'}
                                </span>
                                <span class="material-symbols-outlined" style="color: var(--text-muted); font-size: 20px; pointer-events: none;">expand_more</span>
                            </div>
                            <div id="custom-dropdown-menu" class="hidden" style="position: absolute; top: calc(100% + 8px); left: 0; right: 0; background: #ffffff; border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 12px; box-shadow: 0 15px 35px rgba(0,0,0,0.15); z-index: 100; overflow: hidden; display: flex; flex-direction: column;">
                                <div class="dropdown-item" onclick="window.changeTxType('all')" style="padding: 12px 20px; cursor: pointer; font-size: 0.95rem; font-weight: 500; color: var(--text-main); transition: background 0.2s; background: ${window._txState.type === 'all' ? 'var(--bg-hover)' : 'transparent'};" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='${window._txState.type === 'all' ? 'var(--bg-hover)' : 'transparent'}'">All Transactions</div>
                                <div class="dropdown-item" onclick="window.changeTxType('external_capital_in')" style="padding: 12px 20px; cursor: pointer; font-size: 0.95rem; font-weight: 500; color: var(--text-main); transition: background 0.2s; background: ${window._txState.type === 'external_capital_in' ? 'var(--bg-hover)' : 'transparent'};" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='${window._txState.type === 'external_capital_in' ? 'var(--bg-hover)' : 'transparent'}'">Capital Injected</div>
                                <div class="dropdown-item" onclick="window.changeTxType('expense')" style="padding: 12px 20px; cursor: pointer; font-size: 0.95rem; font-weight: 500; color: var(--text-main); transition: background 0.2s; background: ${window._txState.type === 'expense' ? 'var(--bg-hover)' : 'transparent'};" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='${window._txState.type === 'expense' ? 'var(--bg-hover)' : 'transparent'}'">Expense Recorded</div>
                                <div class="dropdown-item" onclick="window.changeTxType('expense_refunded')" style="padding: 12px 20px; cursor: pointer; font-size: 0.95rem; font-weight: 500; color: var(--text-main); transition: background 0.2s; background: ${window._txState.type === 'expense_refunded' ? 'var(--bg-hover)' : 'transparent'};" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='${window._txState.type === 'expense_refunded' ? 'var(--bg-hover)' : 'transparent'}'">Expense Refunded</div>
                                <div class="dropdown-item" onclick="window.changeTxType('loan_issued')" style="padding: 12px 20px; cursor: pointer; font-size: 0.95rem; font-weight: 500; color: var(--text-main); transition: background 0.2s; background: ${window._txState.type === 'loan_issued' ? 'var(--bg-hover)' : 'transparent'};" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='${window._txState.type === 'loan_issued' ? 'var(--bg-hover)' : 'transparent'}'">Loan Issued</div>
                                <div class="dropdown-item" onclick="window.changeTxType('loan_repaid')" style="padding: 12px 20px; cursor: pointer; font-size: 0.95rem; font-weight: 500; color: var(--text-main); transition: background 0.2s; background: ${window._txState.type === 'loan_repaid' ? 'var(--bg-hover)' : 'transparent'};" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='${window._txState.type === 'loan_repaid' ? 'var(--bg-hover)' : 'transparent'}'">Loan Repaid / Settled</div>
                                <div class="dropdown-item" onclick="window.changeTxType('gold_purchase')" style="padding: 12px 20px; cursor: pointer; font-size: 0.95rem; font-weight: 500; color: var(--text-main); transition: background 0.2s; background: ${window._txState.type === 'gold_purchase' ? 'var(--bg-hover)' : 'transparent'};" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='${window._txState.type === 'gold_purchase' ? 'var(--bg-hover)' : 'transparent'}'">Gold Purchase / Offset</div>
                                <div class="dropdown-item" onclick="window.changeTxType('out_sale_revenue')" style="padding: 12px 20px; cursor: pointer; font-size: 0.95rem; font-weight: 500; color: var(--text-main); transition: background 0.2s; background: ${window._txState.type === 'out_sale_revenue' ? 'var(--bg-hover)' : 'transparent'};" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='${window._txState.type === 'out_sale_revenue' ? 'var(--bg-hover)' : 'transparent'}'">Market Sale Revenue</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Hero Capital Banner -->
                <div style="background: linear-gradient(135deg, #064e3b 0%, #059669 100%); border-radius: 20px; padding: 40px; margin-bottom: 32px; display: flex; align-items: center; justify-content: space-between; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(5, 150, 105, 0.2);">
                    <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: rgba(255,255,255,0.1); border-radius: 50%; filter: blur(40px);"></div>
                    <div style="position: relative; z-index: 1;">
                        <div style="color: #a7f3d0; font-size: 1rem; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Current Capital Balance</div>
                        <div style="font-size: 3.5rem; font-weight: 800; color: white; display: flex; align-items: center; gap: 12px; line-height: 1; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <span style="font-size: 1.8rem; opacity: 0.8; font-weight: 600;">GHS</span> 
                            ${Number(data.current_running_balance_ghs || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div style="background: rgba(255,255,255,0.1); width: 80px; height: 80px; border-radius: 24px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); position: relative; z-index: 1; border: 1px solid rgba(255,255,255,0.2);">
                        <span class="material-symbols-outlined" style="color: white; font-size: 40px;">account_balance</span>
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
                                const displayType = tx.type === 'from_keeper' ? 'Gold Purchase (Liquidated from Keeper)' : tx.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                                const amountSign = isPositive ? '+' : '';
                                const dateStr = new Date(tx.date).toLocaleString(undefined, {
                                    year: 'numeric', month: 'short', day: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                });

                                const rowNum = ((window._txState.page - 1) * window._txState.limit) + index + 1;

                                let badgeColor = '';
                                let badgeBg = '';
                                let icon = '';

                                switch(tx.type) {
                                    case 'external_capital_in':
                                    case 'loan_repaid':
                                    case 'out_sale_revenue':
                                    case 'expense_refunded':
                                        badgeColor = '#10b981'; badgeBg = 'rgba(16, 185, 129, 0.1)'; icon = 'south_west'; break;
                                    case 'expense':
                                        badgeColor = '#f43f5e'; badgeBg = 'rgba(244, 63, 94, 0.1)'; icon = 'north_east'; break;
                                    case 'loan_issued':
                                        badgeColor = '#8b5cf6'; badgeBg = 'rgba(139, 92, 246, 0.1)'; icon = 'account_balance_wallet'; break;
                                    case 'gold_purchase':
                                    case 'from_keeper':
                                        badgeColor = '#f59e0b'; badgeBg = 'rgba(245, 158, 11, 0.1)'; icon = 'diamond'; break;
                                    default:
                                        badgeColor = '#64748b'; badgeBg = 'rgba(100, 116, 139, 0.1)'; icon = 'sync_alt'; break;
                                }

                                const typeBadge = `
                                    <span style="background: ${badgeBg}; color: ${badgeColor}; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
                                        <span class="material-symbols-outlined" style="font-size: 14px;">${icon}</span>
                                        ${displayType}
                                    </span>
                                `;

                                return `
                                <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='white'">
                                    <td style="padding: 16px 24px; color: var(--text-muted); font-weight: 500;">${rowNum}</td>
                                    <td style="padding: 16px; font-weight: 600; color: var(--text-muted);">
                                        <span style="background: var(--bg-main); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); font-size: 0.85rem;">TX-${String(tx.id).padStart(6, '0')}</span>
                                    </td>
                                    <td style="padding: 16px; color: var(--text-main); font-weight: 500;">${dateStr}</td>
                                    <td style="padding: 16px;">${typeBadge}</td>
                                    <td style="padding: 16px; color: var(--text-muted); font-size: 0.95rem; font-weight: 500;">${tx.reference_id ? 'Ref: ' + tx.reference_id : '<span style="opacity:0.5">-</span>'}</td>
                                    <td style="padding: 16px 24px; font-weight: 800; text-align: right; color: ${amountColor}; font-size: 1.05rem;">
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
