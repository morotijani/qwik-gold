// assets/js/modules/transactions.js

window._ledgerState = { page: 1, limit: 15 };

window.addEventListener('route-changed', async (e) => {
    if (e.detail.route !== 'ledger') return;
    const container = e.detail.container;

    container.innerHTML = `
        <div style="display: flex; justify-content: center; padding: 40px;">
            <span class="material-symbols-outlined spin" style="font-size: 2rem; color: var(--gold-primary);">sync</span>
        </div>
    `;

    window.loadLedgerDashboard = async () => {
        try {
            // Fetch Vault Stats
            const stats = await window.api.get('/ledger/vault_stats.php');
            
            // Fetch Sold Gold History
            const offset = (window._ledgerState.page - 1) * window._ledgerState.limit;
            const salesData = await window.api.get(`/ledger/sold_gold.php?limit=${window._ledgerState.limit}&offset=${offset}`);
            const sales = salesData.sales || [];
            const totalCount = salesData.total_count || 0;
            const totalPages = Math.ceil(totalCount / window._ledgerState.limit);

            container.innerHTML = `
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <h2 class="page-title" style="margin: 0; font-size: initial; font-weight: 700; color: var(--text-main);">Company Ledger & Vault</h2>
                    </div>
                    
                    <div class="metric-grid" style="margin-bottom: 32px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
                        <div class="metric-card" style="background: linear-gradient(145deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.01) 100%); border: 1px solid rgba(16, 185, 129, 0.2);">
                            <div class="metric-icon" style="background: #d1fae5; color: #10b981;">
                                <span class="material-symbols-outlined">account_balance</span>
                            </div>
                            <div class="metric-content">
                                <h3>Total Capital</h3>
                                <div class="metric-value" style="color: #10b981;">GHS ${Number(stats.total_capital_ghs || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            </div>
                        </div>

                        <div class="metric-card" style="background: linear-gradient(145deg, rgba(234, 179, 8, 0.05) 0%, rgba(234, 179, 8, 0.01) 100%); border: 1px solid rgba(234, 179, 8, 0.2);">
                            <div class="metric-icon" style="background: #fef08a; color: #eab308;">
                                <span class="material-symbols-outlined">circle</span>
                            </div>
                            <div class="metric-content">
                                <h3>Vault: Gold Balls</h3>
                                <div class="metric-value" style="color: #ca8a04;">
                                    ${Number(stats.gold_balls.grams || 0).toFixed(4)}g 
                                    <span style="font-size: 1rem; opacity: 0.8; font-weight: 500;">(${Number(stats.gold_balls.total_balls_blades || 0)} Balls)</span>
                                </div>
                            </div>
                        </div>

                        <div class="metric-card" style="background: linear-gradient(145deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.01) 100%); border: 1px solid rgba(245, 158, 11, 0.2);">
                            <div class="metric-icon" style="background: #fde68a; color: #f59e0b;">
                                <span class="material-symbols-outlined">diamond</span>
                            </div>
                            <div class="metric-content">
                                <h3>Vault: Refined Gold</h3>
                                <div class="metric-value" style="color: #d97706;">
                                    ${Number(stats.refined_gold.grams || 0).toFixed(4)}g 
                                    <span style="font-size: 1rem; opacity: 0.8; font-weight: 500;">(${Number(stats.refined_gold.volume || 0)} Vol)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow-x: auto; border: 1px solid var(--border);">
                        <div style="padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span class="material-symbols-outlined" style="color: var(--text-muted);">sell</span>
                                <h3 style="font-size: 1.1rem; margin: 0; color: var(--text-main); font-weight: 700;">Sold Out Gold</h3>
                            </div>
                        </div>
                        <table style="width: 100%; border-collapse: collapse; min-width: 1000px;">
                            <thead>
                                <tr style="background: var(--bg-main); color: var(--text-muted); font-size: 0.85rem; text-align: left; text-transform: uppercase;">
                                    <th style="padding: 16px 24px; font-weight: 600; border-bottom: 1px solid var(--border);">No.</th>
                                    <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Date Sold</th>
                                    <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Type</th>
                                    <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Grams</th>
                                    <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Vol/Balls</th>
                                    <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border); text-align: right;">Est. Amount (GHS)</th>
                                    <th style="padding: 16px 24px; font-weight: 600; border-bottom: 1px solid var(--border); text-align: right;">Brought In (GHS)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sales.length === 0 ? `
                                <tr>
                                    <td colspan="7" style="text-align:center; padding: 60px 20px;">
                                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted);">
                                            <div style="background: var(--bg-main); width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                                                <span class="material-symbols-outlined" style="font-size: 32px; opacity: 0.5;">history</span>
                                            </div>
                                            <h4 style="margin: 0 0 8px 0; color: var(--text-main); font-size: 1.1rem;">No Sales History</h4>
                                            <p style="margin: 0; font-size: 0.95rem;">No gold has been sold to the market yet.</p>
                                        </div>
                                    </td>
                                </tr>
                                ` : ''}
                                ${sales.map((s, index) => {
                                    const rowNum = ((window._ledgerState.page - 1) * window._ledgerState.limit) + index + 1;
                                    const dateStr = new Date(s.created_at).toLocaleString(undefined, {
                                        year: 'numeric', month: 'short', day: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    });
                                    
                                    let volBalls = 0;
                                    let volBallsLabel = '';
                                    if (s.gold_type === 'balls') {
                                        volBalls = s.total_blades;
                                        volBallsLabel = 'Balls';
                                    } else if (s.gold_type === 'refined') {
                                        volBalls = s.total_volume;
                                        volBallsLabel = 'Vol';
                                    } else {
                                        volBalls = parseFloat(s.total_volume) + parseFloat(s.total_blades);
                                        volBallsLabel = 'Mixed';
                                    }

                                    return `
                                    <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s; cursor: pointer;" 
                                        onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='white'"
                                        onclick="window.viewSoldGoldDetails('${encodeURIComponent(JSON.stringify(s))}')">
                                        <td style="padding: 16px 24px; color: var(--text-muted);">${rowNum}</td>
                                        <td style="padding: 16px; color: var(--text-main); font-weight: 500;">${dateStr}</td>
                                        <td style="padding: 16px; color: var(--text-muted); text-transform: capitalize;">${s.gold_type}</td>
                                        <td style="padding: 16px; color: var(--text-main); font-weight: 500;">${Number(s.total_grams).toFixed(4)}g</td>
                                        <td style="padding: 16px; color: var(--text-muted);">${Number(volBalls).toFixed(4)} ${volBallsLabel}</td>
                                        <td style="padding: 16px; font-weight: 500; text-align: right; color: var(--text-muted);">
                                            ${Number(s.estimated_cash).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style="padding: 16px 24px; font-weight: 700; text-align: right; color: var(--success);">
                                            +${Number(s.actual_cash).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                        
                        ${totalPages > 1 ? `
                        <div style="padding: 16px 24px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: white;">
                            <span style="font-size: 0.9rem; color: var(--text-muted);">Showing page ${window._ledgerState.page} of ${totalPages} (${totalCount} total)</span>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn btn-outline" style="padding: 6px 12px;" 
                                    ${window._ledgerState.page === 1 ? 'disabled' : ''} 
                                    onclick="window.changeLedgerPage(${window._ledgerState.page - 1})">Previous</button>
                                <button class="btn btn-outline" style="padding: 6px 12px;" 
                                    ${window._ledgerState.page === totalPages ? 'disabled' : ''} 
                                    onclick="window.changeLedgerPage(${window._ledgerState.page + 1})">Next</button>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Failed to load ledger dashboard', error);
            container.innerHTML = `<div class="alert alert-danger" style="margin: 40px;">Failed to load ledger dashboard.</div>`;
        }
    };

    window.changeLedgerPage = (newPage) => {
        window._ledgerState.page = newPage;
        window.loadLedgerDashboard();
    };

    window.viewSoldGoldDetails = (dataStr) => {
        const s = JSON.parse(decodeURIComponent(dataStr));
        const dateStr = new Date(s.created_at).toLocaleString();

        const diff = s.actual_cash - s.estimated_cash;
        const diffColor = diff >= 0 ? 'var(--success)' : 'var(--danger)';
        const diffSign = diff >= 0 ? '+' : '';

        const modalHtml = `
            <div style="padding: 16px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 24px;">
                    <div>
                        <div style="font-size: 0.9rem; color: var(--text-muted);">Sale ID</div>
                        <div style="font-weight: 600;">${s.sale_uid}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.9rem; color: var(--text-muted);">Date Sold</div>
                        <div style="font-weight: 600;">${dateStr}</div>
                    </div>
                </div>

                <div class="glass-panel" style="margin-bottom: 24px;">
                    <h4 style="margin: 0 0 16px 0; border-bottom: 1px solid var(--border); padding-bottom: 8px;">Gold Breakdown</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div>
                            <span style="font-size: 0.85rem; color: var(--text-muted);">Gold Type</span>
                            <div style="font-weight: 500; text-transform: capitalize;">${s.gold_type}</div>
                        </div>
                        <div>
                            <span style="font-size: 0.85rem; color: var(--text-muted);">Total Grams</span>
                            <div style="font-weight: 500;">${Number(s.total_grams).toFixed(4)}g</div>
                        </div>
                        <div>
                            <span style="font-size: 0.85rem; color: var(--text-muted);">Total Volume</span>
                            <div style="font-weight: 500;">${Number(s.total_volume).toFixed(4)}</div>
                        </div>
                        <div>
                            <span style="font-size: 0.85rem; color: var(--text-muted);">Total Balls</span>
                            <div style="font-weight: 500;">${Number(s.total_blades).toFixed(4)}</div>
                        </div>
                    </div>
                </div>

                <div class="glass-panel">
                    <h4 style="margin: 0 0 16px 0; border-bottom: 1px solid var(--border); padding-bottom: 8px;">Financials</h4>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 1.1rem;">
                        <span style="color: var(--text-muted);">System Estimated:</span>
                        <span style="font-weight: 600;">GHS ${Number(s.estimated_cash).toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 1.2rem;">
                        <span style="color: var(--text-main);">Actual Brought In:</span>
                        <span style="font-weight: 700; color: var(--success);">GHS ${Number(s.actual_cash).toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 1.1rem; padding-top: 12px; border-top: 1px dashed var(--border);">
                        <span style="color: var(--text-muted);">Profit / Loss Variance:</span>
                        <span style="font-weight: 700; color: ${diffColor};">${diffSign}GHS ${Math.abs(diff).toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                    </div>
                </div>
            </div>
        `;

        window.showModal('Sold Gold Details', modalHtml);
    };

    await window.loadLedgerDashboard();
});
