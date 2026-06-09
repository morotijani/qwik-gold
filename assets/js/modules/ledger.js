// assets/js/modules/ledger.js

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
                        <button class="btn btn-primary" onclick="window.initiateMarketSale()">
                            <span class="material-symbols-outlined">outbound</span> Initiate Market Sale
                        </button>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-bottom: 32px;">
                        
                        <!-- Total Capital -->
                        <div style="background: linear-gradient(135deg, #064e3b 0%, #059669 100%); border-radius: 20px; padding: 28px; position: relative; overflow: hidden; box-shadow: 0 10px 25px rgba(5, 150, 105, 0.2);">
                            <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(255,255,255,0.1); border-radius: 50%; filter: blur(30px);"></div>
                            <div style="position: relative; z-index: 1;">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                                    <div style="color: #a7f3d0; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Total Capital</div>
                                    <div style="background: rgba(255,255,255,0.15); width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                                        <span class="material-symbols-outlined" style="color: white; font-size: 24px;">account_balance</span>
                                    </div>
                                </div>
                                <div style="font-size: 2.2rem; font-weight: 800; color: white; display: flex; align-items: center; gap: 8px; line-height: 1; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                    <span style="font-size: 1.2rem; opacity: 0.8; font-weight: 600;">GHS</span> 
                                    ${Number(stats.total_capital_ghs || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>

                        <!-- Gold Balls Vault -->
                        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 20px; padding: 28px; position: relative; overflow: hidden; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.2); border: 1px solid rgba(255,255,255,0.05);">
                            <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(245, 158, 11, 0.15); border-radius: 50%; filter: blur(30px);"></div>
                            <div style="position: relative; z-index: 1;">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                                    <div style="color: #94a3b8; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Vault: Gold Balls</div>
                                    <div style="background: rgba(245, 158, 11, 0.15); width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(245, 158, 11, 0.2);">
                                        <span class="material-symbols-outlined" style="color: #fbbf24; font-size: 24px;">scatter_plot</span>
                                    </div>
                                </div>
                                <div style="font-size: 2.2rem; font-weight: 800; color: white; display: flex; align-items: center; gap: 8px; line-height: 1;">
                                    ${Number(stats.gold_balls.grams || 0).toFixed(4)}<span style="font-size: 1.2rem; opacity: 0.7;">g</span>
                                </div>
                                <div style="margin-top: 10px; font-size: 0.95rem; color: #fbbf24; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                                    <span class="material-symbols-outlined" style="font-size: 16px;">category</span>
                                    ${Number(stats.gold_balls.total_balls_blades || 0)} Total Balls/Blades
                                </div>
                            </div>
                        </div>

                        <!-- Refined Gold Vault -->
                        <div style="background: linear-gradient(135deg, #b45309 0%, #92400e 100%); border-radius: 20px; padding: 28px; position: relative; overflow: hidden; box-shadow: 0 10px 25px rgba(146, 64, 14, 0.2);">
                            <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(255,255,255,0.15); border-radius: 50%; filter: blur(30px);"></div>
                            <div style="position: relative; z-index: 1;">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                                    <div style="color: #fde68a; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Vault: Refined Gold</div>
                                    <div style="background: rgba(255,255,255,0.15); width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                                        <span class="material-symbols-outlined" style="color: white; font-size: 24px;">diamond</span>
                                    </div>
                                </div>
                                <div style="font-size: 2.2rem; font-weight: 800; color: white; display: flex; align-items: center; gap: 8px; line-height: 1; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                    ${Number(stats.refined_gold.grams || 0).toFixed(4)}<span style="font-size: 1.2rem; opacity: 0.8;">g</span>
                                </div>
                                <div style="margin-top: 10px; font-size: 0.95rem; color: #fef3c7; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                                    <span class="material-symbols-outlined" style="font-size: 16px;">water_drop</span>
                                    ${Number(stats.refined_gold.volume || 0)} Total Volume
                                </div>
                            </div>
                        </div>

                    </div>
                    
                    <div style="background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow-x: auto; border: 1px solid var(--border);">
                        <div style="padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span class="material-symbols-outlined" style="color: var(--text-muted);">sell</span>
                                <h3 style="font-size: 1.1rem; margin: 0; color: var(--text-main); font-weight: 700;">Sold Out Gold History</h3>
                            </div>
                        </div>
                        <table style="width: 100%; border-collapse: collapse; min-width: 1000px;">
                            <thead>
                                <tr style="background: var(--bg-main); color: var(--text-muted); font-size: 0.85rem; text-align: left; text-transform: uppercase;">
                                    <th style="padding: 16px 24px; font-weight: 600; border-bottom: 1px solid var(--border);">Status</th>
                                    <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Date Sold</th>
                                    <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Type</th>
                                    <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Vault Est. Grams</th>
                                    <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border); text-align: right;">Est. Amount</th>
                                    <th style="padding: 16px 24px; font-weight: 600; border-bottom: 1px solid var(--border); text-align: right;">Brought In (GHS)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sales.length === 0 ? `
                                <tr>
                                    <td colspan="6" style="text-align:center; padding: 60px 20px;">
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
                const statusBadge = isPending
                    ? `<span style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
                          <span class="material-symbols-outlined" style="font-size: 14px;">pending</span> PENDING
                       </span>`
                    : `<span style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
                          <span class="material-symbols-outlined" style="font-size: 14px;">check_circle</span> COMPLETED
                       </span>`;

                const clickHandler = isPending
                    ? `window.openCompleteSaleModal('${encodeURIComponent(JSON.stringify(s))}')`
                    : `window.viewSoldGoldDetails('${encodeURIComponent(JSON.stringify(s))}')`;
                
                const typeIcon = s.gold_type === 'refined' ? 'diamond' : 'scatter_plot';
                const typeColor = s.gold_type === 'refined' ? '#f59e0b' : '#64748b';

                return `
                                    <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s; cursor: pointer;" 
                                        onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='white'"
                                        onclick="${clickHandler}">
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

    window.initiateMarketSale = async () => {
        document.getElementById('global-modal').classList.add('active');
        document.getElementById('modal-title').textContent = 'Loading Vault...';
        document.getElementById('modal-body').innerHTML = '<div style="text-align:center; padding: 40px;"><span class="material-symbols-outlined spin">sync</span></div>';
        try {
            const stats = await window.api.get('/ledger/vault_stats.php');
            window._initiateSaleState = {
                goldType: 'refined',
                refined_grams: stats.refined_gold.grams || 0,
                refined_volume: stats.refined_gold.volume || 0,
                balls_grams: stats.gold_balls.grams || 0,
                balls_blades: stats.gold_balls.total_balls_blades || 0,

                estimated_grams: stats.refined_gold.grams || 0,
                estimated_volume: stats.refined_gold.volume || 0,
                estimated_blades: 0,

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
            s.estimated_cash = blades * clp;

            if (document.getElementById('calc_est_cash_text')) {
                document.getElementById('calc_est_cash_text').innerText = 'GHS ' + s.estimated_cash.toLocaleString(undefined, { minimumFractionDigits: 2 });
            }
        } else {
            const vol = parseFloat(s.estimated_volume) || 0;
            s.pounds = truncate2(grams / 7.75);
            s.density = vol > 0 ? truncate2(grams / vol) : 0;
            s.karat = s.density > 0 ? truncate2(((s.density - 10.51) * 52.838) / s.density) : 0;
            s.estimated_cash = (s.karat * clp / 23) * s.pounds;

            if (document.getElementById('calc_pounds')) document.getElementById('calc_pounds').innerText = s.pounds.toFixed(2) + ' lbs';
            if (document.getElementById('calc_density')) document.getElementById('calc_density').innerText = s.density.toFixed(2);
            if (document.getElementById('calc_karat')) document.getElementById('calc_karat').innerText = s.karat.toFixed(2);
            if (document.getElementById('calc_est_cash_text')) {
                document.getElementById('calc_est_cash_text').innerText = 'GHS ' + s.estimated_cash.toLocaleString(undefined, { minimumFractionDigits: 2 });
            }
        }
    };

    window.renderInitiateSaleWizard = () => {
        const s = window._initiateSaleState;

        let html = `
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
                        <label>Est. Total Blades (Editable) <span style="color: red;">*</span></label>
                        <input type="number" step="0.0001" min="0" value="${s.estimated_blades}" oninput="if(parseFloat(this.value) < 0) this.value = Math.abs(this.value); window._initiateSaleState.estimated_blades = this.value; window.calcInitiateSale();" class="form-control" required placeholder="0.00">
                    </div>
                    `}
                </div>
                
                <div class="form-group" style="margin-bottom: 16px;">
                    <label>Estimated Local Price ${s.goldType === 'refined' ? '' : '(Per Blade)'} <span style="color: red;">*</span></label>
                    <input type="number" step="0.01" min="0" value="${s.estimated_local_price}" oninput="if(parseFloat(this.value) < 0) this.value = Math.abs(this.value); window._initiateSaleState.estimated_local_price = this.value; window.calcInitiateSale();" class="form-control" required placeholder="Enter estimated price">
                </div>
                
                ${s.goldType === 'refined' ? `
                <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; font-size: 0.9rem; margin-bottom: 16px; border: 1px solid var(--border);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Pounds:</span> <span id="calc_pounds" style="font-weight: 600;">${s.pounds.toFixed(2)} lbs</span></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Density:</span> <span id="calc_density" style="font-weight: 600;">${s.density.toFixed(2)}</span></div>
                    <div style="display: flex; justify-content: space-between;"><span>Karat:</span> <span id="calc_karat" style="font-weight: 600;">${s.karat.toFixed(2)}</span></div>
                </div>
                ` : ''}
                
                <div style="background: rgba(16, 185, 129, 0.1); padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 24px; border: 1px solid rgba(16, 185, 129, 0.3);">
                    <div style="color: var(--success); font-size: 0.85rem; text-transform: uppercase; font-weight: 600;">Estimated Total Cash</div>
                    <div style="font-size: 1.8rem; font-weight: 700; color: var(--text-main);"><span id="calc_est_cash_text">GHS ${s.estimated_cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
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
                <p style="color: var(--text-muted); margin-bottom: 24px;">
                    Are you sure you want to initiate a market sale for <strong>${s.goldType.toUpperCase()}</strong> gold?<br><br>
                    This will move all current ${s.goldType} company gold from the vault to a "Pending Sale" state, using your edited estimations.
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
                total_grams: s.estimated_grams
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
            document.getElementById('cs_calc_cash').innerText = 'GHS ' + cash.toLocaleString(undefined, {minimumFractionDigits: 2});
            
            const estCash = parseFloat(document.getElementById('cs_est_cash').value);
            const diff = cash - estCash;
            const diffEl = document.getElementById('cs_calc_variance');
            if (diffEl) {
                if (cash === 0) {
                     diffEl.innerHTML = '';
                } else if (diff >= 0) {
                     diffEl.innerHTML = `<span style="color: var(--success); font-size: 0.9rem; font-weight: 600;">Profit: +GHS ${diff.toLocaleString(undefined, {minimumFractionDigits:2})}</span>`;
                } else {
                     diffEl.innerHTML = `<span style="color: var(--danger); font-size: 0.9rem; font-weight: 600;">Loss: -GHS ${Math.abs(diff).toLocaleString(undefined, {minimumFractionDigits:2})}</span>`;
                }
            }
        }
    };

    window.openCompleteSaleModal = (dataStr) => {
        const s = JSON.parse(decodeURIComponent(dataStr));
        const estCashFormatted = Number(s.estimated_cash).toLocaleString(undefined, { minimumFractionDigits: 2 });
        const estGramsFormatted = Number(s.total_grams).toFixed(4);
        const estVolBladesFormatted = Number(s.gold_type === 'balls' ? s.total_blades : s.total_volume).toFixed(4);
        const estPriceFormatted = Number(s.estimated_local_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

        const formHtml = `
            <input type="hidden" id="cs_gold_type" value="${s.gold_type}">
            <input type="hidden" id="cs_est_cash" value="${s.estimated_cash}">
            
            <form id="complete-sale-form" onsubmit="window.submitCompleteSale(event, ${s.id})">
                
                <!-- System Estimation Summary -->
                <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.02) 100%); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <div style="width: 40px; height: 40px; border-radius: 10px; background: #f59e0b; color: white; display: flex; align-items: center; justify-content: center;">
                            <span class="material-symbols-outlined">${s.gold_type === 'refined' ? 'diamond' : 'scatter_plot'}</span>
                        </div>
                        <div>
                            <h4 style="margin: 0; font-size: 1.1rem; color: var(--text-main);">Pending Sale: ${s.gold_type === 'refined' ? 'Refined Gold' : 'Gold Balls'}</h4>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">System Estimation</div>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                        <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                            <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Est. Weight</div>
                            <div style="font-weight: 700; color: var(--text-main); font-size: 1.1rem;">${estGramsFormatted}g</div>
                        </div>
                        <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                            <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Est. ${s.gold_type === 'refined' ? 'Volume' : 'Blades'}</div>
                            <div style="font-weight: 700; color: var(--text-main); font-size: 1.1rem;">${estVolBladesFormatted}</div>
                        </div>
                        <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                            <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Est. Price</div>
                            <div style="font-weight: 700; color: var(--text-main); font-size: 1.1rem;">GHS ${estPriceFormatted}</div>
                        </div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(245, 158, 11, 0.2); padding-top: 12px;">
                        <span style="font-weight: 600; color: var(--warning);">Total Estimated Cash</span>
                        <span style="font-size: 1.2rem; font-weight: 700; color: var(--text-main);">GHS ${estCashFormatted}</span>
                    </div>
                </div>

                <!-- Input Fields for Market Actuals -->
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

                <div style="display: flex; gap: 12px; justify-content: space-between;">
                    <button type="button" class="btn btn-outline" style="color: var(--danger); border-color: var(--danger);" onclick="window.reverseSale(${s.id})">Reverse to Vault</button>
                    <div style="display: flex; gap: 12px;">
                        <button type="button" class="btn btn-outline" onclick="window.closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Complete Sale</button>
                    </div>
                </div>
            </form>
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

    window.viewSoldGoldDetails = (dataStr) => {
        const s = JSON.parse(decodeURIComponent(dataStr));
        
        const diff = s.actual_cash - s.estimated_cash;
        const diffColor = diff >= 0 ? 'var(--success)' : 'var(--danger)';
        const diffBg = diff >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
        const diffBorder = diff >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';
        const diffLabel = diff >= 0 ? 'Profit' : 'Loss';
        
        const estCashFmt = Number(s.estimated_cash).toLocaleString(undefined, { minimumFractionDigits: 2 });
        const actCashFmt = Number(s.actual_cash).toLocaleString(undefined, { minimumFractionDigits: 2 });
        const diffCashFmt = Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 2 });
        
        const estGramsFmt = Number(s.total_grams).toFixed(4) + 'g';
        const estVolBladesFmt = Number(s.gold_type === 'balls' ? s.total_blades : s.total_volume).toFixed(4);
        const estPriceFmt = 'GHS ' + Number(s.estimated_local_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

        const actGramsFmt = Number(s.actual_grams_market || s.total_grams).toFixed(4) + 'g';
        const actVolBladesFmt = Number(s.gold_type === 'balls' ? (s.actual_blades_market || s.total_blades) : (s.actual_volume_market || s.total_volume)).toFixed(4);
        const actPriceFmt = 'GHS ' + Number(s.actual_local_price || s.estimated_local_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

        const dateStr = new Date(s.created_at).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        const html = `
            <div style="font-family: var(--font-main);">
                
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <span class="material-symbols-outlined" style="color: var(--primary);">receipt_long</span>
                            <div style="font-size: 1.2rem; font-weight: 700; color: var(--text-main);">${s.sale_uid}</div>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">${dateStr} &bull; <span style="text-transform: capitalize; font-weight: 600;">${s.gold_type}</span></div>
                    </div>
                    <div>
                        <span style="background: var(--success-light); color: var(--success); padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 14px;">check_circle</span> COMPLETED</span>
                    </div>
                </div>

                <!-- Comparison Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                    
                    <!-- System Estimation -->
                    <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.01) 100%); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 12px; padding: 16px;">
                        <h4 style="margin: 0 0 16px 0; font-size: 0.95rem; color: var(--warning); display: flex; align-items: center; gap: 6px;">
                            <span class="material-symbols-outlined" style="font-size: 18px;">calculate</span> System Estimation
                        </h4>
                        
                        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-muted); font-size: 0.85rem;">Weight</span>
                                <span style="font-weight: 600; color: var(--text-main);">${estGramsFmt}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-muted); font-size: 0.85rem;">${s.gold_type === 'refined' ? 'Volume' : 'Blades'}</span>
                                <span style="font-weight: 600; color: var(--text-main);">${estVolBladesFmt}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-muted); font-size: 0.85rem;">Price ${s.gold_type === 'refined' ? '' : '/ Blade'}</span>
                                <span style="font-weight: 600; color: var(--text-main);">${estPriceFmt}</span>
                            </div>
                        </div>
                        
                        <div style="border-top: 1px dashed rgba(245, 158, 11, 0.3); padding-top: 12px;">
                            <div style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 4px;">Estimated Cash</div>
                            <div style="font-size: 1.2rem; font-weight: 700; color: var(--text-main);">GHS ${estCashFmt}</div>
                        </div>
                    </div>
                    
                    <!-- Market Actuals -->
                    <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.01) 100%); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 16px;">
                        <h4 style="margin: 0 0 16px 0; font-size: 0.95rem; color: var(--success); display: flex; align-items: center; gap: 6px;">
                            <span class="material-symbols-outlined" style="font-size: 18px;">storefront</span> Market Actuals
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
                        <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Net Variance</div>
                        <div style="font-weight: 600; font-size: 1rem; color: ${diffColor};">${diffLabel} on Sale</div>
                    </div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: ${diffColor};">${diff > 0 ? '+' : ''}${diff === 0 ? '' : 'GHS '}${diffCashFmt}</div>
                </div>

            </div>
            <div style="text-align: right;">
                <button type="button" class="btn btn-outline" onclick="window.closeModal()">Close Details</button>
            </div>
        `;
        window.openModal('Sold Gold Details', html);
    };

    await window.loadLedgerDashboard();
});
