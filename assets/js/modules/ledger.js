// assets/js/modules/ledger.js

window._ledgerState = { page: 1, limit: 15, selectedPendingSales: [] };

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
            window._ledgerState.selectedPendingSales = [];

            container.innerHTML = `
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <h2 class="page-title" style="margin: 0; font-size: initial; font-weight: 700; color: var(--text-main);">Company Ledger & Vault</h2>
                        <div style="display: flex; gap: 12px;">
                            ${(stats.gold_balls.grams > 0 || stats.refined_gold.grams > 0) ? `
                            <button class="btn btn-outline" style="color: var(--text-main);" onclick="window.moveVaultToHold()">
                                <span class="material-symbols-outlined">inventory_2</span> Move to Hold
                            </button>
                            ` : ''}
                            <!-- <button class="btn btn-primary" onclick="window.initiateMarketSale('office_vault')">
                                <span class="material-symbols-outlined">outbound</span> Initiate Market Sale
                            </button> -->
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-bottom: 32px;">
                        
                        <!-- Total Capital -->
                        <div style="background: linear-gradient(145deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.03) 100%); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 20px; padding: 28px; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.05);">
                            <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(16, 185, 129, 0.1); border-radius: 50%; filter: blur(30px);"></div>
                            <div style="position: relative; z-index: 1;">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                                    <div style="color: #059669; font-size: 0.9rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Total Capital</div>
                                    <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);">
                                        <span class="material-symbols-outlined" style="font-size: 24px;">account_balance</span>
                                    </div>
                                </div>
                                <div style="font-size: 2.2rem; font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 8px; line-height: 1;">
                                    <span style="font-size: 1.2rem; font-weight: 600; color: var(--text-muted);">GHS</span> 
                                    ${Number(stats.total_capital_ghs || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>

                        <!-- Gold Balls Vault -->
                        <div style="background: linear-gradient(145deg, rgba(71, 85, 105, 0.15) 0%, rgba(71, 85, 105, 0.03) 100%); border: 1px solid rgba(71, 85, 105, 0.2); border-radius: 20px; padding: 28px; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(71, 85, 105, 0.05);">
                            <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(71, 85, 105, 0.1); border-radius: 50%; filter: blur(30px);"></div>
                            <div style="position: relative; z-index: 1;">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                                    <div style="color: #475569; font-size: 0.9rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Vault: Gold Balls</div>
                                    <div style="background: linear-gradient(135deg, #64748b, #475569); color: white; width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(71, 85, 105, 0.3);">
                                        <span class="material-symbols-outlined" style="font-size: 24px;">scatter_plot</span>
                                    </div>
                                </div>
                                <div style="font-size: 2.2rem; font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 8px; line-height: 1;">
                                    ${Number(stats.gold_balls.grams || 0).toFixed(4)}<span style="font-size: 1.2rem; font-weight: 600; color: var(--text-muted);">g</span>
                                </div>
                                <div style="margin-top: 10px; font-size: 0.95rem; color: #10b981; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                                    <span class="material-symbols-outlined" style="font-size: 16px;">view_agenda</span>
                                    ${Number(stats.gold_balls.total_balls_blades || 0).toFixed(2)} Total Blades
                                </div>
                                <div style="margin-top: 10px; font-size: 0.95rem; color: var(--text-muted); font-weight: 600; display: flex; align-items: center; gap: 6px;">
                                    <span class="material-symbols-outlined" style="font-size: 16px;">payments</span>
                                    GHS ${Number(stats.gold_balls.guessed_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} System Value
                                </div>
                                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(16, 185, 129, 0.2);">
                                    <button class="btn btn-primary" style="width: 100%; background: #10b981; border-color: #10b981; color: white; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; padding: 12px; border-radius: 12px;" onclick="window.initiateMarketSale('office_vault', 'balls')">
                                        <span class="material-symbols-outlined">query_stats</span> Simulate & Sell
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Refined Gold Vault -->
                        <div style="background: linear-gradient(145deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 100%); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 20px; padding: 28px; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(245, 158, 11, 0.05);">
                            <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(245, 158, 11, 0.1); border-radius: 50%; filter: blur(30px);"></div>
                            <div style="position: relative; z-index: 1;">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                                    <div style="color: #d97706; font-size: 0.9rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Vault: Refined Gold</div>
                                    <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3);">
                                        <span class="material-symbols-outlined" style="font-size: 24px;">diamond</span>
                                    </div>
                                </div>
                                <div style="font-size: 2.2rem; font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 8px; line-height: 1;">
                                    ${Number(stats.refined_gold.grams || 0).toFixed(4)}<span style="font-size: 1.2rem; font-weight: 600; color: var(--text-muted);">g</span>
                                </div>
                                <div style="margin-top: 10px; font-size: 0.95rem; color: #d97706; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                                    <span class="material-symbols-outlined" style="font-size: 16px;">water_drop</span>
                                    ${Number(stats.refined_gold.volume || 0).toFixed(4)} Total Volume
                                </div>
                                <div style="margin-top: 10px; font-size: 0.95rem; color: var(--text-muted); font-weight: 600; display: flex; align-items: center; gap: 6px;">
                                    <span class="material-symbols-outlined" style="font-size: 16px;">payments</span>
                                    GHS ${Number(stats.refined_gold.guessed_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} System Value
                                </div>
                                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(245, 158, 11, 0.2);">
                                    <button class="btn btn-primary" style="width: 100%; background: #f59e0b; border-color: #f59e0b; color: white; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; padding: 12px; border-radius: 12px;" onclick="window.initiateMarketSale('office_vault', 'refined')">
                                        <span class="material-symbols-outlined">query_stats</span> Simulate & Sell
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                    
                    ${(stats.hold_gold_balls.grams > 0 || stats.hold_refined_gold.grams > 0) ? `
                    <div style="margin-bottom: 32px; padding: 24px; background: rgba(59, 130, 246, 0.05); border: 1px dashed rgba(59, 130, 246, 0.4); border-radius: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span class="material-symbols-outlined" style="color: #3b82f6; font-size: 28px;">inventory_2</span>
                                <div>
                                    <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-main); font-weight: 700;">Gold on Hold (Overnight Drafts)</h3>
                                    <div style="font-size: 0.85rem; color: var(--text-muted);">This gold is safely segregated from the active vault.</div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 12px;">
                                <button class="btn btn-outline" style="background: white; border-color: var(--border);" onclick="window.returnVaultFromHold()">
                                    <span class="material-symbols-outlined">unarchive</span> Return to Active Vault
                                </button>
                                <button class="btn btn-primary" style="background: #3b82f6; border-color: #3b82f6;" onclick="window.initiateMarketSale('on_hold')">
                                    <span class="material-symbols-outlined">outbound</span> Initiate Sale from Hold
                                </button>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px;">
                            <!-- Hold Balls -->
                            <div style="background: white; border: 1px solid var(--border); border-radius: 16px; padding: 20px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Held: Gold Balls</div>
                                    <span class="material-symbols-outlined" style="color: #94a3b8;">scatter_plot</span>
                                </div>
                                <div style="font-size: 1.8rem; font-weight: 800; color: var(--text-main);">${Number(stats.hold_gold_balls.grams || 0).toFixed(4)}<span style="font-size: 1rem; color: var(--text-muted);">g</span></div>
                                <div style="margin-top: 8px; font-size: 0.9rem; color: var(--text-muted); font-weight: 600; display: flex; align-items: center; gap: 6px;">
                                    <span class="material-symbols-outlined" style="font-size: 14px;">payments</span>
                                    GHS ${Number(stats.hold_gold_balls.guessed_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                            <!-- Hold Refined -->
                            <div style="background: white; border: 1px solid var(--border); border-radius: 16px; padding: 20px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Held: Refined Gold</div>
                                    <span class="material-symbols-outlined" style="color: #94a3b8;">diamond</span>
                                </div>
                                <div style="font-size: 1.8rem; font-weight: 800; color: var(--text-main);">${Number(stats.hold_refined_gold.grams || 0).toFixed(4)}<span style="font-size: 1rem; color: var(--text-muted);">g</span></div>
                                <div style="margin-top: 8px; font-size: 0.9rem; color: var(--text-muted); font-weight: 600; display: flex; align-items: center; gap: 6px;">
                                    <span class="material-symbols-outlined" style="font-size: 14px;">payments</span>
                                    GHS ${Number(stats.hold_refined_gold.guessed_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div style="background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow-x: auto; border: 1px solid var(--border);">
                        <div style="padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span class="material-symbols-outlined" style="color: var(--text-muted);">sell</span>
                                <h3 style="font-size: 1.1rem; margin: 0; color: var(--text-main); font-weight: 700;">Sold Out Gold History</h3>
                            </div>
                            <div id="merge-sales-action" style="display: none; align-items: center; gap: 12px;">
                                <span style="font-size: 0.9rem; font-weight: 600; color: var(--primary);" id="merge-sales-count">0 selected</span>
                                <button class="btn btn-primary" onclick="window.openMergeSalesModal()" style="padding: 8px 16px; border-radius: 8px; font-weight: 600;">
                                    <span class="material-symbols-outlined" style="font-size: 18px;">call_merge</span> Merge & Complete
                                </button>
                            </div>
                        </div>
                        <table style="width: 100%; border-collapse: collapse; min-width: 1000px;">
                            <thead>
                                <tr style="background: var(--bg-main); color: var(--text-muted); font-size: 0.85rem; text-align: left; text-transform: uppercase;">
                                    <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border); width: 40px; text-align: center;"></th>
                                    <th style="padding: 16px 24px; font-weight: 600; border-bottom: 1px solid var(--border);">Status</th>
                                    <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Date Sold</th>
                                    <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Type</th>
                                    <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Vault Est. Grams</th>
                                    <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border); text-align: right;">Est. Amount</th>
                                    <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border); text-align: right;">Handler</th>
                                    <th style="padding: 16px 24px; font-weight: 600; border-bottom: 1px solid var(--border); text-align: right;">Brought In (GHS)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sales.length === 0 ? `
                                <tr>
                                    <td colspan="8" style="text-align:center; padding: 60px 20px;">
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
                                ${sales.map(s => {
                const dateStr = new Date(s.created_at).toLocaleString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });

                const isPending = s.status === 'pending';
                const isMerged = s.is_merged === 1;

                let statusBadge = '';
                if (isMerged) {
                    statusBadge = `<span style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
                          <span class="material-symbols-outlined" style="font-size: 14px;">call_merge</span> MERGED
                       </span>`;
                } else if (isPending) {
                    statusBadge = `<span style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
                          <span class="material-symbols-outlined" style="font-size: 14px;">pending</span> PENDING
                       </span>`;
                } else {
                    statusBadge = `<span style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
                          <span class="material-symbols-outlined" style="font-size: 14px;">check_circle</span> COMPLETED
                       </span>`;
                }

                const checkboxHtml = isPending ? `<input type="checkbox" class="pending-sale-checkbox" value="${s.id}" data-sale='${JSON.stringify(s).replace(/'/g, "&#39;")}' onchange="window.togglePendingSaleSelection(this)" style="width: 18px; height: 18px; cursor: pointer;" onclick="event.stopPropagation()">` : '';

                const clickHandler = isPending
                    ? `window.openCompleteSaleModal('${encodeURIComponent(JSON.stringify(s))}')`
                    : `window.viewSoldGoldDetails(${s.id})`;

                const typeIcon = s.gold_type === 'refined' ? 'diamond' : 'scatter_plot';
                const typeColor = s.gold_type === 'refined' ? '#f59e0b' : '#64748b';

                return `
                                    <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s; cursor: pointer;" 
                                        onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='white'"
                                        onclick="${clickHandler}">
                                        <td style="padding: 16px; text-align: center;" onclick="event.stopPropagation();">${checkboxHtml}</td>
                                        <td style="padding: 16px 24px;">${statusBadge}</td>
                                        <td style="padding: 16px; color: var(--text-main); font-weight: 500;">${dateStr}</td>
                                        <td style="padding: 16px;">
                                            <span style="display: inline-flex; align-items: center; gap: 6px; color: ${typeColor}; font-weight: 600; font-size: 0.95rem;">
                                                <span class="material-symbols-outlined" style="font-size: 18px;">${typeIcon}</span>
                                                <span style="color: var(--text-muted); text-transform: capitalize;">${s.gold_type}</span>
                                            </span>
                                        </td>
                                        <td style="padding: 16px; color: var(--text-main); font-weight: 600;">${Number(s.total_grams).toFixed(4)}g</td>
                                        <td style="padding: 16px; font-weight: 500; text-align: right; color: var(--text-muted);">
                                            ${Number(s.estimated_cash).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style="padding: 16px; color: var(--text-muted); font-size: 0.9rem;">
                                            <div style="display: flex; align-items: center; gap: 6px; justify-content: flex-end;">
                                                <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--bg-main); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; color: var(--text-main);">
                                                    ${(s.handler_name || 'System').charAt(0).toUpperCase()}
                                                </div>
                                                <span style="font-weight: 600;">${s.handler_name || 'System'}</span>
                                            </div>
                                        </td>
                                        <td style="padding: 16px 24px; font-weight: 800; text-align: right; color: ${isPending ? 'var(--text-muted)' : 'var(--success)'}; font-size: 1.05rem;">
                                            ${isPending ? '-' : '+' + Number(s.actual_cash).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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

    window._initiateSaleState = {};

    window.moveVaultToHold = () => {
        const confirmHtml = `
            <div style="padding: 24px; text-align: center;">
                <div style="width: 64px; height: 64px; background: rgba(59, 130, 246, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
                    <span class="material-symbols-outlined" style="font-size: 32px; color: #3b82f6;">inventory_2</span>
                </div>
                <h3 style="margin: 0 0 12px 0; color: var(--text-main);">Draft Vault to Hold?</h3>
                <p style="color: var(--text-muted); margin-bottom: 24px; font-size: 0.95rem;">
                    This will securely move all active company-owned gold into a draft state, keeping it separated from tomorrow's new purchases.
                </p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button type="button" class="btn btn-outline" onclick="window.closeModal()">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="window.submitMoveVaultToHold()">Yes, Move to Hold</button>
                </div>
            </div>
        `;
        window.openModal('Confirm Action', confirmHtml, { maxWidth: '400px' });
    };

    window.submitMoveVaultToHold = async () => {
        document.getElementById('modal-body').innerHTML = '<div style="text-align:center; padding: 40px;"><span class="material-symbols-outlined spin">sync</span><div style="margin-top:16px;">Moving...</div></div>';
        try {
            await window.api.post('/vault/move_to_hold.php', {});
            window.closeModal();
            window.showToast('Vault successfully moved to Hold', 'success');
            window.loadLedgerDashboard();
        } catch (e) {
            window.showToast(e.message || 'Failed to move vault', 'error');
            window.closeModal();
        }
    };

    window.returnVaultFromHold = () => {
        const confirmHtml = `
            <div style="padding: 24px; text-align: center;">
                <div style="width: 64px; height: 64px; background: rgba(16, 185, 129, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
                    <span class="material-symbols-outlined" style="font-size: 32px; color: #10b981;">unarchive</span>
                </div>
                <h3 style="margin: 0 0 12px 0; color: var(--text-main);">Return Gold to Vault?</h3>
                <p style="color: var(--text-muted); margin-bottom: 24px; font-size: 0.95rem;">
                    This will merge all Held gold back into the active vault rotation.
                </p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button type="button" class="btn btn-outline" onclick="window.closeModal()">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="window.submitReturnVaultFromHold()">Yes, Return to Vault</button>
                </div>
            </div>
        `;
        window.openModal('Confirm Action', confirmHtml, { maxWidth: '400px' });
    };

    window.submitReturnVaultFromHold = async () => {
        document.getElementById('modal-body').innerHTML = '<div style="text-align:center; padding: 40px;"><span class="material-symbols-outlined spin">sync</span><div style="margin-top:16px;">Returning...</div></div>';
        try {
            await window.api.post('/vault/return_to_vault.php', {});
            window.closeModal();
            window.showToast('Held gold returned to active vault', 'success');
            window.loadLedgerDashboard();
        } catch (e) {
            window.showToast(e.message || 'Failed to return held gold', 'error');
            window.closeModal();
        }
    };

    window.initiateMarketSale = async (sourceLocation = 'office_vault', preselectedGoldType = null) => {
        document.getElementById('global-modal').classList.add('active');
        document.getElementById('modal-title').textContent = sourceLocation === 'on_hold' ? 'Initiating Sale from Hold...' : 'Market Sale Simulator';
        document.getElementById('modal-body').innerHTML = '<div style="text-align:center; padding: 40px;"><span class="material-symbols-outlined spin">sync</span></div>';
        try {
            const stats = await window.api.get('/ledger/vault_stats.php');

            const ballsGrams = sourceLocation === 'on_hold' ? stats.hold_gold_balls.grams : stats.gold_balls.grams;
            const ballsBlades = sourceLocation === 'on_hold' ? stats.hold_gold_balls.total_balls_blades : stats.gold_balls.total_balls_blades;
            const refGrams = sourceLocation === 'on_hold' ? stats.hold_refined_gold.grams : stats.refined_gold.grams;
            const refVol = sourceLocation === 'on_hold' ? stats.hold_refined_gold.volume : stats.refined_gold.volume;

            const bCost = sourceLocation === 'on_hold' ? (stats.hold_gold_balls.guessed_value || 0) : (stats.gold_balls.guessed_value || 0);
            const rCost = sourceLocation === 'on_hold' ? (stats.hold_refined_gold.guessed_value || 0) : (stats.refined_gold.guessed_value || 0);

            window._initiateSaleState = {
                source_location: sourceLocation,
                goldType: preselectedGoldType || 'refined',
                hideTabs: !!preselectedGoldType,
                refined_grams: refGrams || 0,
                refined_volume: refVol || 0,
                refined_cost_basis: rCost,
                balls_grams: ballsGrams || 0,
                balls_blades: ballsBlades || 0,
                balls_cost_basis: bCost,

                estimated_grams: preselectedGoldType === 'balls' ? ballsGrams : refGrams,
                estimated_volume: preselectedGoldType === 'balls' ? 0 : refVol,
                estimated_blades: preselectedGoldType === 'balls' ? ballsBlades : 0,

                estimated_local_price: '',
                estimated_cash: 0,
                pounds: 0,
                density: 0,
                karat: 0
            };
            window.renderInitiateSaleWizard();
        } catch (e) {
            window.closeModal();
            window.showToast('Failed to load vault stats', 'error');
        }
    };

    window.calcInitiateSale = () => {
        const s = window._initiateSaleState;
        const truncate2 = (num) => Math.floor(num * 100) / 100;
        const grams = parseFloat(s.estimated_grams) || 0;
        const clp = parseFloat(s.estimated_local_price) || 0;

        if (s.goldType === 'balls') {
            const blades = parseFloat(s.estimated_blades) || 0;
            s.estimated_cash = Math.floor(blades * clp);

            if (document.getElementById('calc_est_cash_text')) {
                document.getElementById('calc_est_cash_text').innerText = 'GHS ' + s.estimated_cash.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
            }
        } else {
            const vol = parseFloat(s.estimated_volume) || 0;
            s.pounds = truncate2(grams / 7.75);
            s.density = vol > 0 ? truncate2(grams / vol) : 0;
            s.karat = s.density > 0 ? truncate2(((s.density - 10.51) * 52.838) / s.density) : 0;
            s.estimated_cash = Math.floor((s.karat * clp / 23) * s.pounds);

            if (document.getElementById('calc_pounds')) document.getElementById('calc_pounds').innerText = s.pounds.toFixed(2) + ' lbs';
            if (document.getElementById('calc_density')) document.getElementById('calc_density').innerText = s.density.toFixed(2);
            if (document.getElementById('calc_karat')) document.getElementById('calc_karat').innerText = s.karat.toFixed(2);
            if (document.getElementById('calc_est_cash_text')) {
                document.getElementById('calc_est_cash_text').innerText = 'GHS ' + s.estimated_cash.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
            }
        }

        const currentCostBasis = s.goldType === 'balls' ? s.balls_cost_basis : s.refined_cost_basis;
        const estProfit = s.estimated_cash - currentCostBasis;
        if (document.getElementById('calc_est_profit_text')) {
            const profitEl = document.getElementById('calc_est_profit_text');
            profitEl.style.color = estProfit >= 0 ? 'var(--success)' : 'var(--danger)';
            profitEl.innerText = (estProfit >= 0 ? '+' : '-') + 'GHS ' + Math.abs(estProfit).toLocaleString(undefined, { minimumFractionDigits: 2 });
            document.getElementById('calc_est_profit_title').style.color = estProfit >= 0 ? 'var(--success)' : 'var(--danger)';
        }
    };

    window.renderInitiateSaleWizard = () => {
        const s = window._initiateSaleState;

        const currentCostBasis = s.goldType === 'balls' ? s.balls_cost_basis : s.refined_cost_basis;
        const estProfit = s.estimated_cash - currentCostBasis;

        let html = `
            ${!s.hideTabs ? `
            <div style="margin-bottom: 24px;">
                <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">Gold Type</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <!-- Gold Balls Card -->
                    <div onclick="
                            window._initiateSaleState.goldType = 'balls';
                            window._initiateSaleState.estimated_grams = window._initiateSaleState.balls_grams;
                            window._initiateSaleState.estimated_blades = window._initiateSaleState.balls_blades;
                            window._initiateSaleState.estimated_local_price = '';
                            window.calcInitiateSale();
                            window.renderInitiateSaleWizard();
                         "
                         style="padding: 20px; border: ${s.goldType === 'balls' ? '2px solid #f59e0b' : '1px solid #e5e7eb'}; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: ${s.goldType === 'balls' ? '#fefce8' : 'white'};">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                            <div style="width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: ${s.goldType === 'balls' ? '#f59e0b' : '#f3f4f6'}; color: ${s.goldType === 'balls' ? 'white' : '#6b7280'};">
                                <span class="material-symbols-outlined" style="font-size: 24px;">scatter_plot</span>
                            </div>
                            <span class="material-symbols-outlined" style="color: ${s.goldType === 'balls' ? '#f59e0b' : '#d1d5db'}; font-size: 24px;">
                                ${s.goldType === 'balls' ? 'radio_button_checked' : 'radio_button_unchecked'}
                            </span>
                        </div>
                        <div>
                            <div style="font-weight: 600; color: var(--text-main); font-size: 1.1rem; margin-bottom: 4px;">Gold Balls</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">Unrefined / Sponge</div>
                            <div style="font-size: 0.8rem; font-weight: 600; color: ${s.goldType === 'balls' ? '#d97706' : 'var(--text-muted)'}; margin-top: 8px;">Vault: ${Number(s.balls_grams).toFixed(2)}g</div>
                        </div>
                    </div>
                    
                    <!-- Refined Gold Card -->
                    <div onclick="
                            window._initiateSaleState.goldType = 'refined';
                            window._initiateSaleState.estimated_grams = window._initiateSaleState.refined_grams;
                            window._initiateSaleState.estimated_volume = window._initiateSaleState.refined_volume;
                            window._initiateSaleState.estimated_local_price = '';
                            window.calcInitiateSale();
                            window.renderInitiateSaleWizard();
                         "
                         style="padding: 20px; border: ${s.goldType === 'refined' ? '2px solid #f59e0b' : '1px solid #e5e7eb'}; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: ${s.goldType === 'refined' ? '#fefce8' : 'white'};">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                            <div style="width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: ${s.goldType === 'refined' ? '#f59e0b' : '#f3f4f6'}; color: ${s.goldType === 'refined' ? 'white' : '#6b7280'};">
                                <span class="material-symbols-outlined" style="font-size: 24px;">diamond</span>
                            </div>
                            <span class="material-symbols-outlined" style="color: ${s.goldType === 'refined' ? '#f59e0b' : '#d1d5db'}; font-size: 24px;">
                                ${s.goldType === 'refined' ? 'radio_button_checked' : 'radio_button_unchecked'}
                            </span>
                        </div>
                        <div>
                            <div style="font-weight: 600; color: var(--text-main); font-size: 1.1rem; margin-bottom: 4px;">Refined Gold</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">Processed Bars</div>
                            <div style="font-size: 0.8rem; font-weight: 600; color: ${s.goldType === 'refined' ? '#d97706' : 'var(--text-muted)'}; margin-top: 8px;">Vault: ${Number(s.refined_grams).toFixed(2)}g</div>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Form content directly renders here now without the balls restriction -->
            <form id="initiate-sale-form" onsubmit="window.confirmInitiateSale(event)">
                <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                    <div class="form-group" style="flex: 1; margin-bottom: 0;">
                        <label>Est. Grams (Editable) <span style="color: red;">*</span></label>
                        <input type="number" step="0.0001" min="0" value="${s.estimated_grams}" oninput="if(parseFloat(this.value) < 0) this.value = Math.abs(this.value); window._initiateSaleState.estimated_grams = this.value; window.calcInitiateSale();" class="form-control" required placeholder="0.00">
                    </div>
                    ${s.goldType === 'refined' ? `
                    <div class="form-group" style="flex: 1; margin-bottom: 0;">
                        <label>Est. Volume (Editable) <span style="color: red;">*</span></label>
                        <input type="number" step="0.0001" min="0" value="${s.estimated_volume}" oninput="if(parseFloat(this.value) < 0) this.value = Math.abs(this.value); window._initiateSaleState.estimated_volume = this.value; window.calcInitiateSale();" class="form-control" required placeholder="0.00">
                    </div>
                    ` : `
                    <div class="form-group" style="flex: 1; margin-bottom: 0;">
                        <label>Est. Blades (Editable) <span style="color: red;">*</span></label>
                        <input type="number" step="0.0001" min="0" value="${s.estimated_blades}" oninput="if(parseFloat(this.value) < 0) this.value = Math.abs(this.value); window._initiateSaleState.estimated_blades = this.value; window.calcInitiateSale();" class="form-control" required placeholder="0.00">
                    </div>
                    `}
                </div>
                
                <div class="form-group" style="margin-bottom: 16px;">
                    <label>${s.goldType === 'balls' ? 'Price per Blade (GHS)' : 'Local Current Price (GHS)'} <span style="color: red;">*</span></label>
                    <input type="number" step="0.01" min="0" value="${s.estimated_local_price}" oninput="if(parseFloat(this.value) < 0) this.value = Math.abs(this.value); window._initiateSaleState.estimated_local_price = this.value; window.calcInitiateSale();" class="form-control" required placeholder="Enter estimated price">
                </div>
                
                ${s.goldType === 'balls' ? `
                <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; font-size: 0.9rem; margin-bottom: 16px; border: 1px solid var(--border);">
                    <div style="display: flex; justify-content: space-between;"><span>Total Blades:</span> <span style="font-weight: 600;">${Number(s.estimated_blades).toFixed(4)}</span></div>
                </div>
                ` : `
                <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; font-size: 0.9rem; margin-bottom: 16px; border: 1px solid var(--border);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Pounds:</span> <span id="calc_pounds" style="font-weight: 600;">${s.pounds.toFixed(2)} lbs</span></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Density:</span> <span id="calc_density" style="font-weight: 600;">${s.density.toFixed(2)}</span></div>
                    <div style="display: flex; justify-content: space-between;"><span>Karat:</span> <span id="calc_karat" style="font-weight: 600;">${s.karat.toFixed(2)}</span></div>
                </div>
                `}
                
                <div style="background: rgba(16, 185, 129, 0.05); padding: 20px; border-radius: 12px; margin-bottom: 24px; border: 1px solid rgba(16, 185, 129, 0.2);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(16, 185, 129, 0.1);">
                        <span style="color: var(--text-muted); font-size: 0.9rem; font-weight: 600; text-transform: uppercase;">Total Capital Spent</span>
                        <span style="font-size: 1.1rem; font-weight: 700; color: var(--text-main);">GHS ${currentCostBasis.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <span style="color: var(--text-muted); font-size: 0.9rem; font-weight: 600; text-transform: uppercase;">Est. Total Cash</span>
                        <span style="font-size: 1.6rem; font-weight: 800; color: var(--text-main);" id="calc_est_cash_text">GHS ${s.estimated_cash.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px dashed rgba(16, 185, 129, 0.3);">
                        <span id="calc_est_profit_title" style="color: ${estProfit >= 0 ? 'var(--success)' : 'var(--danger)'}; font-size: 1rem; font-weight: 700; text-transform: uppercase;">Estimated Profit</span>
                        <span id="calc_est_profit_text" style="font-size: 1.8rem; font-weight: 800; color: ${estProfit >= 0 ? 'var(--success)' : 'var(--danger)'};">${estProfit >= 0 ? '+' : '-'}GHS ${Math.abs(estProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
                
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button type="button" class="btn btn-outline" onclick="window.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="btn-initiate-sale">Initiate Sale <span class="material-symbols-outlined" style="font-size: 18px; vertical-align: middle;">arrow_forward</span></button>
                </div>
            </form>
        `;
        window.openModal('Initiate Market Sale', html);
    };

    window.confirmInitiateSale = (e) => {
        e.preventDefault();
        const s = window._initiateSaleState;
        if (!s.estimated_grams || parseFloat(s.estimated_grams) <= 0) return window.showToast('Estimated grams must be > 0', 'error');
        if (!s.estimated_local_price || parseFloat(s.estimated_local_price) <= 0) return window.showToast('Estimated local price must be > 0', 'error');

        if (s.goldType === 'refined' && (!s.estimated_volume || parseFloat(s.estimated_volume) <= 0)) return window.showToast('Estimated volume must be > 0', 'error');
        if (s.goldType === 'balls' && (!s.estimated_blades || parseFloat(s.estimated_blades) <= 0)) return window.showToast('Estimated blades must be > 0', 'error');

        const confirmHtml = `
            <div style="text-align: center; padding: 20px 0;">
                <span class="material-symbols-outlined" style="font-size: 48px; color: var(--warning); margin-bottom: 16px;">warning</span>
                <h3 style="margin: 0 0 16px 0;">Confirm Market Sale</h3>
                
                <div style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: left;">
                    <h4 style="margin: 0 0 12px 0; font-size: 0.95rem; color: var(--text-main); border-bottom: 1px solid var(--border); padding-bottom: 8px;">Sale Summary</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.9rem;">
                        <div><span style="color: var(--text-muted);">Gold Type:</span> <strong style="color: var(--text-main); text-transform: capitalize;">${s.goldType}</strong></div>
                        <div><span style="color: var(--text-muted);">Est. Grams:</span> <strong style="color: var(--text-main);">${Number(s.estimated_grams).toFixed(4)}g</strong></div>
                        ${s.goldType === 'refined' ? `
                        <div><span style="color: var(--text-muted);">Est. Volume:</span> <strong style="color: var(--text-main);">${Number(s.estimated_volume).toFixed(4)}</strong></div>
                        ` : `
                        <div><span style="color: var(--text-muted);">Est. Blades:</span> <strong style="color: var(--text-main);">${Number(s.estimated_blades).toFixed(4)}</strong></div>
                        `}
                        <div><span style="color: var(--text-muted);">Local Price:</span> <strong style="color: var(--text-main);">GHS ${Number(s.estimated_local_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                    </div>
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--border); display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: var(--text-muted); font-weight: 600;">Est. Total Cash:</span>
                        <span style="font-size: 1.2rem; font-weight: 800; color: var(--success);">GHS ${Number(s.estimated_cash).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                <p style="color: var(--text-muted); margin-bottom: 24px; font-size: 0.9rem;">
                    Are you sure? This will move all current ${s.goldType} company gold from the vault to a "Pending Sale" state.
                </p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button type="button" class="btn btn-outline" onclick="window.renderInitiateSaleWizard()">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="window.submitInitiateSale()">Yes, Initiate Sale</button>
                </div>
            </div>
        `;
        window.openModal('Confirm Action', confirmHtml);
    };

    window.submitInitiateSale = async () => {
        const s = window._initiateSaleState;
        try {
            document.getElementById('modal-body').innerHTML = '<div style="text-align:center; padding: 40px;"><span class="material-symbols-outlined spin">sync</span><div style="margin-top:16px;">Initiating...</div></div>';

            const payload = {
                gold_type: s.goldType,
                estimated_local_price: s.estimated_local_price,
                total_grams: s.estimated_grams,
                source_location: s.source_location || 'office_vault'
            };
            if (s.goldType === 'refined') {
                payload.total_volume = s.estimated_volume;
            } else {
                payload.total_blades = s.estimated_blades;
            }

            await window.api.post('/sales/initiate_sale.php', payload);
            window.closeModal();
            window.showToast('Sale initiated successfully!', 'success');
            window.loadLedgerDashboard();
        } catch (error) {
            window.showToast('Error: ' + error.message, 'error');
            window.renderInitiateSaleWizard();
        }
    };

    window.calcCompleteSale = () => {
        const type = document.getElementById('cs_gold_type').value;
        const price = parseFloat(document.getElementById('cs_price').value) || 0;
        const grams = parseFloat(document.getElementById('cs_grams').value) || 0;

        let cash = 0;

        if (type === 'balls') {
            const blades = parseFloat(document.getElementById('cs_blades').value) || 0;
            cash = blades * price;
        } else {
            const vol = parseFloat(document.getElementById('cs_volume').value) || 0;
            const truncate2 = (num) => Math.floor(num * 100) / 100;

            const pounds = truncate2(grams / 7.75);
            const density = vol > 0 ? truncate2(grams / vol) : 0;
            const karat = density > 0 ? truncate2(((density - 10.51) * 52.838) / density) : 0;

            cash = (karat * price / 23) * pounds;

            if (document.getElementById('cs_calc_pounds')) document.getElementById('cs_calc_pounds').innerText = pounds.toFixed(2) + ' lbs';
            if (document.getElementById('cs_calc_density')) document.getElementById('cs_calc_density').innerText = density.toFixed(2);
            if (document.getElementById('cs_calc_karat')) document.getElementById('cs_calc_karat').innerText = karat.toFixed(2);
        }

        if (document.getElementById('cs_calc_cash')) {
            document.getElementById('cs_calc_cash').innerText = 'GHS ' + cash.toLocaleString(undefined, { minimumFractionDigits: 2 });

            const estCash = parseFloat(document.getElementById('cs_est_cash').value);
            const diff = cash - estCash;
            const diffEl = document.getElementById('cs_calc_variance');
            if (diffEl) {
                if (cash === 0) {
                    diffEl.innerHTML = '';
                } else if (diff >= 0) {
                    diffEl.innerHTML = `<span style="color: var(--success); font-size: 0.9rem; font-weight: 600;">Profit: +GHS ${diff.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>`;
                } else {
                    diffEl.innerHTML = `<span style="color: var(--danger); font-size: 0.9rem; font-weight: 600;">Loss: -GHS ${Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>`;
                }
            }
        }
    };

    window.openCompleteSaleModal = (dataStr) => {
        const s = JSON.parse(decodeURIComponent(dataStr));
        const profit = s.status === 'completed' ? Number(s.net_profit_ghs) : 0;
        const capitalSpent = Number(s.total_cost || 0);
        const estCash = Number(s.estimated_cash);
        const estProfit = estCash - capitalSpent;

        const estCashFormatted = estCash.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        const capitalFormatted = capitalSpent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        const profitFormatted = estProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

        const estGramsFormatted = Number(s.total_grams).toFixed(4);
        const estVolBladesFormatted = Number(s.gold_type === 'balls' ? s.total_blades : s.total_volume).toFixed(4);
        const estPriceFormatted = Number(s.estimated_local_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

        const profitColor = estProfit >= 0 ? 'var(--success)' : 'var(--danger)';

        const formHtml = `
            <!-- Pending Sale Detailed Summary -->
            <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.02) 100%); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background: #f59e0b; color: white; display: flex; align-items: center; justify-content: center;">
                        <span class="material-symbols-outlined">${s.gold_type === 'refined' ? 'diamond' : 'scatter_plot'}</span>
                    </div>
                    <div>
                        <h4 style="margin: 0; font-size: 1.1rem; color: var(--text-main);">Pending Sale: ${s.gold_type === 'refined' ? 'Refined Gold' : 'Gold Balls'}</h4>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">Sale Breakdown</div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                    <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Grams</div>
                        <div style="font-weight: 700; color: var(--text-main); font-size: 1.1rem;">${estGramsFormatted}g</div>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">${s.gold_type === 'refined' ? 'Total Volume' : 'Total Balls'}</div>
                        <div style="font-weight: 700; color: var(--text-main); font-size: 1.1rem;">${estVolBladesFormatted}</div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                        <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: 600;">Total Capital Spent</span>
                        <span style="font-weight: 700; color: var(--text-main); font-size: 1.1rem;">GHS ${capitalFormatted}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                        <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: 600;">Est. Total Cash (at GHS ${estPriceFormatted})</span>
                        <span style="font-weight: 700; color: var(--text-main); font-size: 1.1rem;">GHS ${estCashFormatted}</span>
                    </div>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(245, 158, 11, 0.2); padding-top: 12px;">
                    <span style="font-weight: 600; color: var(--text-main);">Estimated Profit</span>
                    <span style="font-size: 1.2rem; font-weight: 800; color: ${profitColor};">GHS ${profitFormatted}</span>
                </div>
            </div>

            <!-- Initial Action Buttons -->
            <div id="cs_initial_actions" style="display: flex; gap: 12px; justify-content: space-between;">
                <button type="button" class="btn btn-outline" style="color: var(--danger); border-color: var(--danger);" onclick="window.reverseSale(${s.id})">Reverse to Vault</button>
                <div style="display: flex; gap: 12px;">
                    <button type="button" class="btn btn-outline" onclick="window.closeModal()">Close</button>
                    <button type="button" class="btn btn-primary" onclick="document.getElementById('cs_form_container').style.display='block'; this.parentNode.parentNode.style.display='none';">Enter Market Actuals</button>
                </div>
            </div>

            <!-- Market Actuals Form (Hidden Initially) -->
            <div id="cs_form_container" style="display: none;">
                <input type="hidden" id="cs_gold_type" value="${s.gold_type}">
                <input type="hidden" id="cs_est_cash" value="${s.estimated_cash}">
                
                <form id="complete-sale-form" onsubmit="window.submitCompleteSale(event, ${s.id})">
                    
                    <h4 style="margin: 0 0 16px 0; font-size: 1rem; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
                        <span class="material-symbols-outlined" style="color: var(--primary);">storefront</span>
                        Enter Market Actuals
                    </h4>
                    
                    <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                        <div class="form-group" style="flex: 1; margin-bottom: 0;">
                            <label class="form-label">Actual Market Grams <span style="color: red;">*</span></label>
                            <input type="number" step="0.0001" min="0" name="actual_grams" id="cs_grams" oninput="if(parseFloat(this.value) < 0) this.value = Math.abs(this.value); window.calcCompleteSale();" class="form-control" required placeholder="0.00">
                        </div>
                        ${s.gold_type === 'refined' ? `
                        <div class="form-group" style="flex: 1; margin-bottom: 0;">
                            <label class="form-label">Actual Market Volume <span style="color: red;">*</span></label>
                            <input type="number" step="0.0001" min="0" name="actual_volume" id="cs_volume" oninput="if(parseFloat(this.value) < 0) this.value = Math.abs(this.value); window.calcCompleteSale();" class="form-control" required placeholder="0.00">
                        </div>
                        ` : `
                        <div class="form-group" style="flex: 1; margin-bottom: 0;">
                            <label class="form-label">Actual Total Blades <span style="color: red;">*</span></label>
                            <input type="number" step="0.0001" min="0" name="actual_blades" id="cs_blades" oninput="if(parseFloat(this.value) < 0) this.value = Math.abs(this.value); window.calcCompleteSale();" class="form-control" required placeholder="0.00">
                        </div>
                        `}
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 24px;">
                        <label class="form-label">Actual Market Local Price ${s.gold_type === 'refined' ? '' : '(Per Blade)'} <span style="color: red;">*</span></label>
                        <input type="number" step="0.01" min="0" name="actual_local_price" id="cs_price" oninput="if(parseFloat(this.value) < 0) this.value = Math.abs(this.value); window.calcCompleteSale();" class="form-control" required placeholder="0.00">
                    </div>

                    <!-- Live Calculation Output -->
                    ${s.gold_type === 'refined' ? `
                    <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; font-size: 0.9rem; margin-bottom: 16px; border: 1px solid var(--border);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Pounds:</span> <span id="cs_calc_pounds" style="font-weight: 600;">0.00 lbs</span></div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Density:</span> <span id="cs_calc_density" style="font-weight: 600;">0.00</span></div>
                        <div style="display: flex; justify-content: space-between;"><span>Karat:</span> <span id="cs_calc_karat" style="font-weight: 600;">0.00</span></div>
                    </div>
                    ` : ''}

                    <div style="background: rgba(16, 185, 129, 0.1); padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid rgba(16, 185, 129, 0.3);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                            <div>
                                <div style="color: var(--success); font-size: 0.85rem; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Actual Cash Brought In</div>
                                <div id="cs_calc_variance"></div>
                            </div>
                            <div style="font-size: 1.8rem; font-weight: 700; color: var(--text-main);"><span id="cs_calc_cash">GHS 0.00</span></div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button type="button" class="btn btn-outline" onclick="document.getElementById('cs_form_container').style.display='none'; document.getElementById('cs_initial_actions').style.display='flex';">Cancel</button>
                        <button type="submit" class="btn btn-primary">Complete Sale</button>
                    </div>
                </form>
            </div>
        `;
        window.openModal('Complete Market Sale', formHtml);
    };

    window.submitCompleteSale = async (e, saleId) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        data.sale_id = saleId;
        try {
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Completing...';
            await window.api.post('/sales/complete_sale.php', data);
            window.closeModal();
            window.showToast('Sale completed and cash injected!', 'success');
            window.loadLedgerDashboard();
        } catch (error) {
            alert('Error: ' + error.message);
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = false;
            btn.textContent = 'Complete Sale';
        }
    };

    window.reverseSale = async (saleId) => {
        if (!confirm('Are you sure you want to reverse this sale? The gold will be returned to the office vault.')) return;
        try {
            await window.api.post('/sales/reverse_sale.php', { sale_id: saleId });
            window.closeModal();
            window.showToast('Sale reversed. Gold returned to vault.', 'success');
            window.loadLedgerDashboard();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    window.viewSoldGoldDetails = async (saleId) => {
        try {
            document.getElementById('global-modal').classList.add('active');
            document.getElementById('modal-title').textContent = 'Loading Sale Details...';
            document.getElementById('modal-body').innerHTML = '<div style="text-align:center; padding: 40px;"><span class="material-symbols-outlined spin">sync</span></div>';

            const res = await window.api.get(`/ledger/sold_gold_details.php?sale_id=${saleId}`);
            const s = res.sale;
            const consts = res.constituents;

            const costBasis = parseFloat(s.total_cost) || 0;
            const actualCash = parseFloat(s.actual_cash) || 0;

            const diff = s.net_profit_ghs !== null ? parseFloat(s.net_profit_ghs) : (actualCash - costBasis);
            const diffColor = diff >= 0 ? 'var(--success)' : 'var(--danger)';
            const diffBg = diff >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
            const diffBorder = diff >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';
            const diffLabel = diff >= 0 ? 'True Net Profit' : 'Net Loss';

            const costBasisFmt = costBasis.toLocaleString(undefined, { minimumFractionDigits: 2 });
            const actCashFmt = actualCash.toLocaleString(undefined, { minimumFractionDigits: 2 });
            const diffCashFmt = Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 2 });

            const actGramsFmt = Number(s.actual_grams_market || s.total_grams).toFixed(4) + 'g';
            const actVolBladesFmt = Number(s.gold_type === 'balls' ? (s.actual_blades_market || s.total_blades) : (s.actual_volume_market || s.total_volume)).toFixed(4);
            const actPriceFmt = 'GHS ' + Number(s.actual_local_price || s.estimated_local_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

            const dateStr = new Date(s.created_at).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            let sourceBreakdownHtml = '';
            if (consts.total_items > 0) {
                sourceBreakdownHtml = `
                    <div style="background: rgba(71, 85, 105, 0.05); border: 1px solid rgba(71, 85, 105, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                        <h4 style="margin: 0 0 12px 0; font-size: 0.9rem; color: var(--text-muted); text-transform: uppercase;">Stock Origins</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            ${consts.smelted.count > 0 ? `
                            <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                                <div style="font-size: 0.8rem; color: #f59e0b; font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 14px;">local_fire_department</span> Converted/Smelted</div>
                                <div style="font-weight: 600; color: var(--text-main); font-size: 1.05rem;">${Number(consts.smelted.grams).toFixed(2)}g</div>
                            </div>
                            ` : ''}
                            ${consts.direct_purchased.count > 0 ? `
                            <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                                <div style="font-size: 0.8rem; color: #3b82f6; font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 14px;">shopping_bag</span> Direct Purchased</div>
                                <div style="font-weight: 600; color: var(--text-main); font-size: 1.05rem;">${Number(consts.direct_purchased.grams).toFixed(2)}g</div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }

            if (res.merged_sales && res.merged_sales.length > 0) {
                sourceBreakdownHtml += `
                    <div style="background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                        <h4 style="margin: 0 0 12px 0; font-size: 0.9rem; color: #8b5cf6; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
                            <span class="material-symbols-outlined" style="font-size: 16px;">call_merge</span> Merged From (${res.merged_sales.length} Sales)
                        </h4>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${res.merged_sales.map(ms => `
                                <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <div style="font-weight: 600; color: var(--text-main); text-transform: capitalize;">${ms.gold_type} Sale</div>
                                        <div style="font-size: 0.8rem; color: var(--text-muted);">${Number(ms.total_grams).toFixed(4)}g &bull; Cap: GHS ${Number(ms.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-weight: 600; color: var(--text-main);">Est: GHS ${Number(ms.estimated_cash).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            const html = `
                <div style="font-family: var(--font-main);">
                    
                    <!-- Header -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                <span class="material-symbols-outlined" style="color: var(--primary);">receipt_long</span>
                                <div style="font-size: 1.2rem; font-weight: 700; color: var(--text-main);">${s.transaction_ref || s.sale_uid || 'N/A'}</div>
                            </div>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">${dateStr} &bull; <span style="text-transform: capitalize; font-weight: 600;">${s.gold_type}</span></div>
                        </div>
                        <div>
                            <span style="background: var(--success-light); color: var(--success); padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 14px;">check_circle</span> COMPLETED</span>
                        </div>
                    </div>

                    ${sourceBreakdownHtml}

                    <!-- Financial Summary Cards -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                        
                        <div style="background: white; border: 1px solid var(--border); border-radius: 12px; padding: 20px;">
                            <h4 style="margin: 0 0 16px 0; font-size: 0.95rem; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                                <span class="material-symbols-outlined" style="color: var(--warning); font-size: 18px;">account_balance_wallet</span> 
                                Initial Capital Spent
                            </h4>
                            
                            <div style="border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 12px;">
                                <div style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 4px;">Total Direct Capital</div>
                                <div style="font-size: 1.2rem; font-weight: 700; color: var(--text-main);">GHS ${costBasisFmt}</div>
                            </div>
                            
                            <div>
                                <div style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 4px;">Estimated Return</div>
                                <div style="font-size: 1rem; font-weight: 600; color: var(--text-main);">GHS ${Number(s.estimated_cash || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            </div>
                        </div>

                        <div style="background: white; border: 1px solid var(--border); border-radius: 12px; padding: 20px;">
                            <h4 style="margin: 0 0 16px 0; font-size: 0.95rem; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                                <span class="material-symbols-outlined" style="color: var(--success); font-size: 18px;">storefront</span> 
                                Market Final Actuals
                            </h4>
                            
                            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: var(--text-muted); font-size: 0.85rem;">Weight</span>
                                    <span style="font-weight: 600; color: var(--text-main);">${actGramsFmt}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: var(--text-muted); font-size: 0.85rem;">${s.gold_type === 'refined' ? 'Volume' : 'Blades'}</span>
                                    <span style="font-weight: 600; color: var(--text-main);">${actVolBladesFmt}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: var(--text-muted); font-size: 0.85rem;">Price ${s.gold_type === 'refined' ? '' : '/ Blade'}</span>
                                    <span style="font-weight: 600; color: var(--text-main);">${actPriceFmt}</span>
                                </div>
                            </div>
                            
                            <div style="border-top: 1px dashed rgba(16, 185, 129, 0.3); padding-top: 12px;">
                                <div style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 4px;">Actual Brought In</div>
                                <div style="font-size: 1.2rem; font-weight: 700; color: var(--success);">GHS ${actCashFmt}</div>
                            </div>
                        </div>
                        
                    </div>

                    <!-- Variance -->
                    <div style="background: ${diffBg}; border: 1px solid ${diffBorder}; padding: 16px; border-radius: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600; font-size: 1.1rem; color: ${diffColor}; text-transform: uppercase;">${diffLabel}</div>
                        </div>
                        <div style="font-size: 1.6rem; font-weight: 800; color: ${diffColor};">${diff > 0 ? '+' : ''}${diff === 0 ? '' : 'GHS '}${diffCashFmt}</div>
                    </div>

                </div>
                <div style="text-align: right;">
                    <button type="button" class="btn btn-outline" onclick="window.closeModal()">Close Details</button>
                </div>
            `;

            document.getElementById('modal-title').textContent = 'Sold Gold Details';
            document.getElementById('modal-body').innerHTML = html;
        } catch (e) {
            console.error(e);
            window.showToast('Failed to load sale details', 'error');
            window.closeModal();
        }
    };
    window.togglePendingSaleSelection = (checkbox) => {
        const saleData = JSON.parse(checkbox.dataset.sale);
        if (checkbox.checked) {
            window._ledgerState.selectedPendingSales.push(saleData);
        } else {
            window._ledgerState.selectedPendingSales = window._ledgerState.selectedPendingSales.filter(s => s.id !== saleData.id);
        }

        const actionDiv = document.getElementById('merge-sales-action');
        const countSpan = document.getElementById('merge-sales-count');
        const count = window._ledgerState.selectedPendingSales.length;

        if (count >= 2) {
            actionDiv.style.display = 'flex';
            countSpan.textContent = `${count} selected`;
        } else {
            actionDiv.style.display = 'none';
        }
    };

    window.openMergeSalesModal = () => {
        const selected = window._ledgerState.selectedPendingSales;
        if (selected.length < 2) return;

        let totalGrams = 0;
        let totalCapital = 0;
        let totalEstCash = 0;
        const saleIds = [];

        selected.forEach(s => {
            totalGrams += Number(s.total_grams);
            totalCapital += Number(s.total_cost || 0);
            totalEstCash += Number(s.estimated_cash);
            saleIds.push(s.id);
        });

        const estProfit = totalEstCash - totalCapital;

        const estCashFormatted = totalEstCash.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        const capitalFormatted = totalCapital.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        const profitFormatted = estProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        const estGramsFormatted = totalGrams.toFixed(4);

        const profitColor = estProfit >= 0 ? 'var(--success)' : 'var(--danger)';

        const formHtml = `
            <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.02) 100%); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background: #8b5cf6; color: white; display: flex; align-items: center; justify-content: center;">
                        <span class="material-symbols-outlined">call_merge</span>
                    </div>
                    <div>
                        <h4 style="margin: 0; font-size: 1.1rem; color: var(--text-main);">Merged Sale Breakdown</h4>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">${selected.length} sales combined</div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 16px;">
                    <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Combined Est. Weight</div>
                        <div style="font-weight: 700; color: var(--text-main); font-size: 1.1rem;">${estGramsFormatted}g</div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                        <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: 600;">Total Combined Capital Spent</span>
                        <span style="font-weight: 700; color: var(--text-main); font-size: 1.1rem;">GHS ${capitalFormatted}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                        <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: 600;">Combined Est. Cash</span>
                        <span style="font-weight: 700; color: var(--text-main); font-size: 1.1rem;">GHS ${estCashFormatted}</span>
                    </div>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(139, 92, 246, 0.2); padding-top: 12px;">
                    <span style="font-weight: 600; color: var(--text-main);">Combined Est. Profit</span>
                    <span style="font-size: 1.2rem; font-weight: 800; color: ${profitColor};">GHS ${profitFormatted}</span>
                </div>
            </div>

            <!-- Market Actuals Form -->
            <form id="merge-sale-form" onsubmit="window.submitMergeSales(event)">
                <input type="hidden" id="merge_sale_ids" value="${saleIds.join(',')}">
                <input type="hidden" id="cs_gold_type" value="refined">
                <input type="hidden" id="cs_est_cash" value="${totalEstCash}">
                <input type="hidden" id="merge_capital" value="${totalCapital}">
                
                <h4 style="margin: 0 0 16px 0; font-size: 1rem; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
                    <span class="material-symbols-outlined" style="color: var(--gold-primary);">storefront</span>
                    Enter Market Actuals (As Refined Gold)
                </h4>
                
                <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                    <div class="form-group" style="flex: 1; margin-bottom: 0;">
                        <label class="form-label">Actual Merged Grams <span style="color: red;">*</span></label>
                        <input type="number" step="0.0001" min="0" name="actual_grams" id="cs_grams" oninput="if(parseFloat(this.value) < 0) this.value = Math.abs(this.value); window.calcCompleteSale();" class="form-control" required placeholder="0.00">
                    </div>
                    <div class="form-group" style="flex: 1; margin-bottom: 0;">
                        <label class="form-label">Actual Merged Volume <span style="color: red;">*</span></label>
                        <input type="number" step="0.0001" min="0" name="actual_volume" id="cs_volume" oninput="if(parseFloat(this.value) < 0) this.value = Math.abs(this.value); window.calcCompleteSale();" class="form-control" required placeholder="0.00">
                    </div>
                </div>
                
                <div class="form-group" style="margin-bottom: 24px;">
                    <label class="form-label">Actual Market Local Price (Per Pound) <span style="color: red;">*</span></label>
                    <input type="number" step="0.01" min="0" name="actual_local_price" id="cs_price" oninput="if(parseFloat(this.value) < 0) this.value = Math.abs(this.value); window.calcCompleteSale();" class="form-control" required placeholder="0.00">
                </div>

                <!-- Live Calculation Output -->
                <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; font-size: 0.9rem; margin-bottom: 16px; border: 1px solid var(--border);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Pounds:</span> <span id="cs_calc_pounds" style="font-weight: 600;">0.00 lbs</span></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Density:</span> <span id="cs_calc_density" style="font-weight: 600;">0.00</span></div>
                    <div style="display: flex; justify-content: space-between;"><span>Karat:</span> <span id="cs_calc_karat" style="font-weight: 600;">0.00</span></div>
                </div>

                <div style="background: rgba(16, 185, 129, 0.1); padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid rgba(16, 185, 129, 0.3);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                        <div>
                            <div style="color: var(--success); font-size: 0.85rem; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Actual Cash Brought In</div>
                            <div id="cs_calc_variance"></div>
                        </div>
                        <div style="font-size: 1.8rem; font-weight: 700; color: var(--text-main);"><span id="cs_calc_cash">GHS 0.00</span></div>
                    </div>
                </div>

                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button type="button" class="btn btn-outline" onclick="window.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <span class="material-symbols-outlined" style="font-size: 18px; color: white;">call_merge</span> Finalize Merge & Complete
                    </button>
                </div>
            </form>
        `;
        window.openModal('Merge & Complete Sales', formHtml);
    };

    window.submitMergeSales = async (e) => {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            submitBtn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';
            submitBtn.disabled = true;

            const saleIds = document.getElementById('merge_sale_ids').value.split(',').map(id => parseInt(id, 10));

            const payload = {
                sale_ids: saleIds,
                actual_grams: parseFloat(form.actual_grams.value),
                actual_volume: parseFloat(form.actual_volume.value),
                actual_local_price: parseFloat(form.actual_local_price.value)
            };

            const res = await window.api.post('/sales/merge_complete_sale.php', payload);
            window.showToast(`Merged ${saleIds.length} sales successfully! +GHS ${res.actual_cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'success');
            window.closeModal();
            window.loadLedgerDashboard();
        } catch (error) {
            window.showToast(error.message, 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    };

    await window.loadLedgerDashboard();
});
