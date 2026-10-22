// assets/js/modules/purchases.js

window._walkInPurchases = [];
window._wizardState = {
    step: 1,
    customers: [],
    sellerType: 'registered',
    customerId: '',
    customerName: '',
    walkinName: '',
    goldType: 'refined',
    notes: '',

    grams: 0,
    volume: 0,
    pricePerPound: 0,
    pricePerBlade: 0,

    calculatedPounds: 0,
    calculatedDensity: 0,
    calculatedKarat: 'Unknown',
    calculatedBlades: 0,
    totalPayout: 0,

    transactionId: null
};

window.addEventListener('route-changed', async (e) => {
    if (e.detail.route !== 'purchases') return;

    const container = e.detail.container;

    container.innerHTML = `
        <div style="width: 100%; padding-bottom: 60px;">
            <!-- Hero Banner -->
            <div class="page-header-card">
                <div>
                    <div style="color: var(--gold-primary); font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; font-size: 0.85rem; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                        <div class="page-header-icon">
                            <span class="material-symbols-outlined" style="font-size: 20px;">diamond</span>
                        </div>
                        Acquisitions
                    </div>
                    <h2 class="page-header-title">Walk-In Purchases</h2>
                    <p class="page-header-subtitle">Process and track all incoming gold purchases from registered customers and walk-in sellers.</p>
                </div>
                <button class="btn btn-primary" onclick="window.openNewPurchaseModal()">
                    <span class="material-symbols-outlined">add_shopping_cart</span> New Purchase
                </button>
            </div>
            
            <div style="background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid var(--border); overflow: hidden; margin-bottom: 24px;">
                <div style="padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: #fafafa;">
                    <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-main); font-weight: 700; display: flex; align-items: center; gap: 8px;">
                        <span class="material-symbols-outlined" style="color: var(--text-muted);">list_alt</span> Purchase History
                    </h3>
                </div>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; min-width: 900px;">
                        <thead>
                            <tr style="background: var(--bg-main); color: var(--text-muted); font-size: 0.85rem; text-align: left; text-transform: uppercase;">
                                <th style="padding: 16px 24px; font-weight: 700; border-bottom: 1px solid var(--border);">No.</th>
                                <th style="padding: 16px; font-weight: 700; border-bottom: 1px solid var(--border);">Txn Ref</th>
                                <th style="padding: 16px; font-weight: 700; border-bottom: 1px solid var(--border);">Date</th>
                                <th style="padding: 16px; font-weight: 700; border-bottom: 1px solid var(--border);">Seller</th>
                                <th style="padding: 16px; font-weight: 700; border-bottom: 1px solid var(--border);">Gold Type</th>
                                <th style="padding: 16px; font-weight: 700; border-bottom: 1px solid var(--border); text-align: right;">Weight</th>
                                <th style="padding: 16px 24px; font-weight: 700; border-bottom: 1px solid var(--border); text-align: right;">Amount Paid</th>
                                <th style="padding: 16px; font-weight: 700; border-bottom: 1px solid var(--border); width: 60px;"></th>
                            </tr>
                        </thead>
                        <tbody id="purchases-tbody">
                            <tr><td colspan="8" style="padding: 48px; text-align: center; color: var(--text-muted); font-size: 1.05rem;">
                                <span class="material-symbols-outlined spin" style="font-size: 32px; color: var(--border); margin-bottom: 16px; display: block;">sync</span>
                                Loading purchases...
                            </td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div id="purchases-pagination"></div>
        </div>
    `;

    try {
        const purchases = await window.api.get('/purchases/list.php');
        window._walkInPurchases = purchases;
        window._purchasesCurrentPage = 1;
        window._purchasesItemsPerPage = 10;

        window.renderPurchasesTable();

    } catch (error) {
        document.getElementById('purchases-tbody').innerHTML =
            `<tr><td colspan="8" style="text-align: center; color: #ff6b6b;">Error loading purchases.</td></tr>`;
    }
});

window.renderPurchasesTable = () => {
    const tbody = document.getElementById('purchases-tbody');
    const paginationContainer = document.getElementById('purchases-pagination');
    if (!tbody) return;

    const purchases = window._walkInPurchases;

    if (purchases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No purchases recorded yet.</td></tr>';
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    const totalItems = purchases.length;
    const totalPages = Math.ceil(totalItems / window._purchasesItemsPerPage);

    if (window._purchasesCurrentPage > totalPages) window._purchasesCurrentPage = totalPages;
    if (window._purchasesCurrentPage < 1) window._purchasesCurrentPage = 1;

    const startIndex = (window._purchasesCurrentPage - 1) * window._purchasesItemsPerPage;
    const endIndex = startIndex + window._purchasesItemsPerPage;
    const currentItems = purchases.slice(startIndex, endIndex);

    tbody.innerHTML = currentItems.map((p, index) => {
        const globalIndex = startIndex + index + 1;
        const goldTypeBadge = p.gold_type === 'refined'
            ? `<span style="padding: 4px 10px; background: rgba(59, 130, 246, 0.1); color: #2563eb; border-radius: 20px; font-size: 0.8rem; font-weight: 700; border: 1px solid rgba(59, 130, 246, 0.2); white-space: nowrap; display: inline-flex; align-items: center;"><span class="material-symbols-outlined" style="font-size: 14px; margin-right: 4px;">diamond</span>Refined</span>`
            : `<span style="padding: 4px 10px; background: rgba(245, 158, 11, 0.1); color: #d97706; border-radius: 20px; font-size: 0.8rem; font-weight: 700; border: 1px solid rgba(245, 158, 11, 0.2); white-space: nowrap; display: inline-flex; align-items: center;"><span class="material-symbols-outlined" style="font-size: 14px; margin-right: 4px;">scatter_plot</span>Balls</span>`;

        return `
            <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='white'">
                <td style="padding: 16px 24px; font-weight: 600; color: var(--text-muted);">${globalIndex}</td>
                <td style="padding: 16px;">
                    <a href="javascript:void(0)" onclick="window.viewPurchaseReceipt(${p.id})" style="background: var(--bg-main); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); font-family: monospace; font-size: 0.85rem; font-weight: 600; color: var(--text-main); text-decoration: none; display: inline-block;">
                        ${p.transaction_ref || '#TXN-' + p.id}
                    </a>
                </td>
                <td style="padding: 16px; color: var(--text-main); font-weight: 500;">
                    ${new Date(p.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 4px;">${new Date(p.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td style="padding: 16px;">
                    <div style="font-weight: 600; color: var(--text-main); margin-bottom: 4px;">${p.seller_display}</div>
                    ${p.seller_display.includes('Walk-In') ? `<span style="font-size: 0.75rem; color: var(--text-muted); background: var(--bg-hover); padding: 2px 6px; border-radius: 4px;">One-Time</span>` : `<span style="font-size: 0.75rem; color: var(--success); background: var(--success-bg); padding: 2px 6px; border-radius: 4px;">Registered</span>`}
                </td>
                <td style="padding: 16px;">${goldTypeBadge}</td>
                <td style="padding: 16px; font-weight: 700; color: var(--text-main); text-align: right; font-size: 1rem;">
                    ${parseFloat(p.weight_grams).toFixed(2)}<span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 4px;">g</span>
                </td>
                <td style="padding: 16px 24px; color: #ef4444; font-weight: 800; text-align: right; font-size: 1.1rem;">
                    <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-right: 4px;">GHS</span>${parseFloat(p.total_paid_ghs).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td style="padding: 16px; text-align: center;">
                    ${(p.current_location === 'office_vault' || p.current_location === 'on_hold') ? `
                    <button onclick="window.confirmDeletePurchase(${p.id}, '${p.transaction_ref || ('#TXN-'+p.id)}', ${p.total_paid_ghs})" title="Delete Purchase" style="background: none; border: none; cursor: pointer; color: #ef4444; padding: 8px; border-radius: 8px; transition: background 0.2s;" onmouseover="this.style.background='rgba(239, 68, 68, 0.1)'" onmouseout="this.style.background='none'">
                        <span class="material-symbols-outlined" style="font-size: 20px;">delete</span>
                    </button>
                    ` : `
                    <span title="Gold already processed" class="material-symbols-outlined" style="font-size: 20px; color: var(--border); cursor: not-allowed; padding: 8px;">lock</span>
                    `}
                </td>
            </tr>
        `;
    }).join('');

    if (paginationContainer) {
        paginationContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
                <div style="font-size: 0.9rem; color: var(--text-muted);">
                    Showing ${startIndex + 1} to ${Math.min(endIndex, totalItems)} of ${totalItems} entries
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.9rem;" 
                            onclick="window._purchasesCurrentPage--; window.renderPurchasesTable();" 
                            ${window._purchasesCurrentPage === 1 ? 'disabled' : ''}>Previous</button>
                    <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.9rem;" 
                            onclick="window._purchasesCurrentPage++; window.renderPurchasesTable();" 
                            ${window._purchasesCurrentPage === totalPages ? 'disabled' : ''}>Next</button>
                </div>
            </div>
        `;
    }
};

// --- WIZARD LOGIC ---

window.openNewPurchaseModal = async () => {
    window.openModal('Walk-In Purchase', '<div style="text-align: center; padding: 20px;"><span class="material-symbols-outlined spin">sync</span><div style="margin-top: 8px; font-size: 0.85rem; color: var(--text-muted);">Loading data...</div></div>', { size: 'md' });
    const modalBody = document.getElementById('modal-body');

    try {
        const customers = await window.api.get('/customers/list.php');

        // Reset state
        window._wizardState = {
            step: 1,
            customers: customers,
            sellerType: 'registered',
            customerId: '',
            customerName: '',
            walkinName: '',
            goldType: 'refined',
            notes: '',
            grams: 0, volume: 0, pricePerPound: 0, pricePerBlade: 0,
            calculatedPounds: 0, calculatedDensity: 0, rawKarat: 0, calculatedKarat: 0,
            purityPercent: 0, discountPercent: (window.GoldMath ? window.GoldMath.getDiscountPercent() : 0.7),
            calculatedBlades: 0,
            totalPayout: 0,
            transactionId: null
        };

        window.renderWizardStep();
    } catch (error) {
        modalBody.innerHTML = '<div style="color: red;">Failed to load system data. Please try again.</div>';
    }
};

window.renderWizardStep = () => {
    const body = document.getElementById('modal-body');
    const state = window._wizardState;

    if (state.step === 1) {
        body.innerHTML = `
            <div style="background: #FFFFFF; border: 1px solid rgba(0,0,0,0.06); border-radius: 16px; padding: 20px; margin-bottom: 24px; display: flex; gap: 16px; align-items: center; box-shadow: 0 4px 16px rgba(0,0,0,0.02);">
                <div style="width: 48px; height: 48px; border-radius: 14px; background: #EAF0FF; color: #2D5BFF; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <span class="material-symbols-outlined" style="font-size: 1.6rem;">person_search</span>
                </div>
                <div>
                    <div style="font-size: 0.95rem; font-weight: 800; color: #121926; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Step 1: Seller Details</div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">Select whether this is a registered customer or a one-time walk-in seller.</div>
                </div>
            </div>
            <div class="form-group" style="margin-bottom: 24px;">
                <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 12px; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.5px;">Seller Type</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <label style="cursor: pointer; position: relative;">
                        <input type="radio" name="wiz_seller_type" value="registered" ${state.sellerType === 'registered' ? 'checked' : ''} onchange="window.updateWizardState('sellerType', 'registered')" style="position: absolute; opacity: 0; pointer-events: none;">
                        <div style="padding: 20px; border-radius: 16px; border: 2px solid ${state.sellerType === 'registered' ? 'var(--info)' : 'var(--border)'}; background: ${state.sellerType === 'registered' ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-main)'}; text-align: center; transition: all 0.2s; box-shadow: ${state.sellerType === 'registered' ? '0 4px 12px rgba(59,130,246,0.15)' : 'none'};">
                            <span class="material-symbols-outlined" style="font-size: 2rem; color: ${state.sellerType === 'registered' ? 'var(--info)' : 'var(--text-muted)'}; margin-bottom: 8px;">person</span>
                            <div style="font-weight: 700; color: ${state.sellerType === 'registered' ? 'var(--info)' : 'var(--text-main)'}; font-size: 1.05rem;">Registered Customer</div>
                        </div>
                    </label>
                    <label style="cursor: pointer; position: relative;">
                        <input type="radio" name="wiz_seller_type" value="walkin" ${state.sellerType === 'walkin' ? 'checked' : ''} onchange="window.updateWizardState('sellerType', 'walkin')" style="position: absolute; opacity: 0; pointer-events: none;">
                        <div style="padding: 20px; border-radius: 16px; border: 2px solid ${state.sellerType === 'walkin' ? 'var(--info)' : 'var(--border)'}; background: ${state.sellerType === 'walkin' ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-main)'}; text-align: center; transition: all 0.2s; box-shadow: ${state.sellerType === 'walkin' ? '0 4px 12px rgba(59,130,246,0.15)' : 'none'};">
                            <span class="material-symbols-outlined" style="font-size: 2rem; color: ${state.sellerType === 'walkin' ? 'var(--info)' : 'var(--text-muted)'}; margin-bottom: 8px;">person_add</span>
                            <div style="font-weight: 700; color: ${state.sellerType === 'walkin' ? 'var(--info)' : 'var(--text-main)'}; font-size: 1.05rem;">One-Time Walk-In</div>
                        </div>
                    </label>
                </div>
            </div>

            ${state.sellerType === 'registered' ? `
                <div class="form-group">
                    <label>Select Customer</label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">person</span>
                        <select id="wiz_customer_id" onchange="window.updateWizardState('customerId', this.value); window.updateWizardState('customerName', this.options[this.selectedIndex].text)" style="padding-left: 44px;">
                            <option value="">-- Select a Customer --</option>
                            ${state.customers.map(c => `<option value="${c.id}" ${state.customerId == c.id ? 'selected' : ''}>${c.name} (${c.type})</option>`).join('')}
                        </select>
                    </div>
                </div>
            ` : `
                <div class="form-group">
                    <label>Walk-In Name</label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">person_add</span>
                        <input type="text" id="wiz_walkin_name" placeholder="e.g. Kofi Boakye" value="${state.walkinName}" oninput="window.updateWizardState('walkinName', this.value)">
                    </div>
                </div>
            `}
            
            <button class="btn btn-primary btn-block" style="padding: 14px; font-size: 1.05rem; border-radius: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 32px;" onclick="window.wizardNext(2)">Proceed to Step 2 <span class="material-symbols-outlined">arrow_forward</span></button>
        `;
    }
    else if (state.step === 2) {
        body.innerHTML = `
            <div style="background: #FFFFFF; border: 1px solid rgba(0,0,0,0.06); border-radius: 16px; padding: 20px; margin-bottom: 24px; display: flex; gap: 16px; align-items: center; box-shadow: 0 4px 16px rgba(0,0,0,0.02);">
                <div style="width: 48px; height: 48px; border-radius: 14px; background: #EAF0FF; color: #2D5BFF; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <span class="material-symbols-outlined" style="font-size: 1.6rem;">calculate</span>
                </div>
                <div>
                    <div style="font-size: 0.95rem; font-weight: 800; color: #121926; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Step 2: Gold Calculation</div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">Enter the gold type, weight, volume, and current market price.</div>
                </div>
            </div>

            <!-- Mode Switcher Pill -->
            <div style="display: flex; justify-content: center; margin-bottom: 20px;">
                <div style="background: #FFFFFF; padding: 4px; border-radius: var(--radius-pill); border: 1.5px solid #E2E8F0; display: inline-flex; gap: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
                    <button type="button" class="btn ${state.goldType === 'refined' ? 'btn-primary' : 'btn-text'}" style="padding: 8px 20px; font-size: 0.88rem; border-radius: var(--radius-pill);" onclick="window.updateWizardState('goldType', 'refined'); window.renderWizardStep();">
                        <span class="material-symbols-outlined" style="font-size: 1.1rem;">diamond</span> Refined Gold
                    </button>
                    <button type="button" class="btn ${state.goldType === 'balls' ? 'btn-primary' : 'btn-text'}" style="padding: 8px 20px; font-size: 0.88rem; border-radius: var(--radius-pill);" onclick="window.updateWizardState('goldType', 'balls'); window.renderWizardStep();">
                        <span class="material-symbols-outlined" style="font-size: 1.1rem;">scatter_plot</span> Gold Balls
                    </button>
                </div>
            </div>

            <!-- CARD 1: Input details of gold below (Pastel Yellow) -->
            <div class="nwdgc-input-card">
                <div class="nwdgc-input-header">
                    <span class="nwdgc-dot-yellow"></span>
                    <span><strong>Input</strong> details of gold below.</span>
                </div>

                ${state.goldType === 'refined' ? `
                    <div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px; margin-bottom: 14px;">
                        <!-- Top Weight -->
                        <div class="nwdgc-white-tile">
                            <label class="nwdgc-tile-label" for="wiz_weight">Top Weight</label>
                            <div class="nwdgc-tile-field">
                                <input type="number" step="any" id="wiz_weight" class="nwdgc-tile-input" placeholder="0" value="${state.grams || ''}" oninput="if(this.value < 0) this.value = Math.abs(this.value); window.calculatePurchaseMath()" autocomplete="off">
                                <span class="nwdgc-tile-unit">grams</span>
                            </div>
                        </div>
                        <!-- Down Weight (Volume) -->
                        <div class="nwdgc-white-tile">
                            <label class="nwdgc-tile-label" for="wiz_volume">Down Weight</label>
                            <div class="nwdgc-tile-field">
                                <input type="number" step="any" id="wiz_volume" class="nwdgc-tile-input" placeholder="0" value="${state.volume || ''}" oninput="if(this.value < 0) this.value = Math.abs(this.value); window.calculatePurchaseMath()" autocomplete="off">
                                <span class="nwdgc-tile-unit">grams</span>
                            </div>
                        </div>
                    </div>

                    <!-- Goldbod Price -->
                    <div class="nwdgc-white-tile">
                        <label class="nwdgc-tile-label" for="wiz_price_pound">Goldbod Price</label>
                        <div class="nwdgc-tile-field">
                            <input type="number" step="any" id="wiz_price_pound" class="nwdgc-tile-input" placeholder="0" value="${state.pricePerPound || ''}" oninput="if(this.value < 0) this.value = Math.abs(this.value); window.calculatePurchaseMath()" autocomplete="off">
                            <span class="nwdgc-tile-unit">GHS</span>
                        </div>
                    </div>
                ` : `
                    <div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px; margin-bottom: 14px;">
                        <!-- Top Weight -->
                        <div class="nwdgc-white-tile">
                            <label class="nwdgc-tile-label" for="wiz_weight">Top Weight</label>
                            <div class="nwdgc-tile-field">
                                <input type="number" step="any" id="wiz_weight" class="nwdgc-tile-input" placeholder="0" value="${state.grams || ''}" oninput="if(this.value < 0) this.value = Math.abs(this.value); window.calculatePurchaseMath()" autocomplete="off">
                                <span class="nwdgc-tile-unit">grams</span>
                            </div>
                        </div>
                        <!-- Calculated Blades -->
                        <div class="nwdgc-white-tile" style="background: #F8FAFC;">
                            <label class="nwdgc-tile-label">Calculated Blades</label>
                            <div class="nwdgc-tile-field">
                                <span id="calc_blades" class="nwdgc-tile-input" style="color: #64748B;">${(Number(state.calculatedBlades) || 0).toFixed(4)}</span>
                                <span class="nwdgc-tile-unit">blades</span>
                            </div>
                        </div>
                    </div>

                    <!-- Price per Blade -->
                    <div class="nwdgc-white-tile">
                        <label class="nwdgc-tile-label" for="wiz_price_blade">Price per Blade</label>
                        <div class="nwdgc-tile-field">
                            <input type="number" step="any" id="wiz_price_blade" class="nwdgc-tile-input" placeholder="0" value="${state.pricePerBlade || ''}" oninput="if(this.value < 0) this.value = Math.abs(this.value); window.calculatePurchaseMath()" autocomplete="off">
                            <span class="nwdgc-tile-unit">GHS</span>
                        </div>
                    </div>
                `}
            </div>

            <!-- CARD 2: Results can be found below (Vibrant Royal Blue) -->
            <div class="nwdgc-results-card">
                <div class="nwdgc-results-header">
                    <span class="nwdgc-dot-yellow"></span>
                    <span><strong>Results</strong> can be found below.</span>
                </div>

                <!-- Dynamic Low Karat Warning Banner -->
                <div id="wiz_warn_banner" class="nwdgc-warning-banner ${(state.calculatedDensity > 0 && state.calculatedKarat > 0 && state.calculatedKarat < 14) ? '' : 'hidden'}">
                    <span class="material-symbols-outlined" style="font-size: 1.3rem; color: #D97706;">error</span>
                    <span>Low karat reading. Confirm the sample before saving.</span>
                </div>

                ${state.goldType === 'refined' ? `
                    <!-- 2x2 Metric Grid -->
                    <div class="nwdgc-metric-grid">
                        <div class="nwdgc-metric-tile">
                            <div class="nwdgc-metric-label">Pounds</div>
                            <div id="calc_pounds" class="nwdgc-metric-val">${(Number(state.calculatedPounds) || 0).toFixed(2)}</div>
                        </div>
                        <div class="nwdgc-metric-tile">
                            <div class="nwdgc-metric-label">Density</div>
                            <div id="calc_density" class="nwdgc-metric-val">${(Number(state.calculatedDensity) || 0).toFixed(2)}</div>
                        </div>
                        <div class="nwdgc-metric-tile">
                            <div class="nwdgc-metric-label">Karat Used</div>
                            <div id="calc_karat" class="nwdgc-metric-val">${(Number(state.calculatedKarat) || 0).toFixed(2)}</div>
                        </div>
                        <div class="nwdgc-metric-tile">
                            <div class="nwdgc-metric-label">Purity</div>
                            <div id="calc_purity" class="nwdgc-metric-val">${(Number(state.purityPercent) || 0).toFixed(2)}%</div>
                        </div>
                    </div>
                ` : `
                    <div class="nwdgc-metric-grid">
                        <div class="nwdgc-metric-tile">
                            <div class="nwdgc-metric-label">Total Grams</div>
                            <div class="nwdgc-metric-val">${(Number(state.grams) || 0).toFixed(2)}</div>
                        </div>
                        <div class="nwdgc-metric-tile">
                            <div class="nwdgc-metric-label">Conversion</div>
                            <div class="nwdgc-metric-val" style="font-size: 1.35rem;">0.80g / blade</div>
                        </div>
                        <div class="nwdgc-metric-tile">
                            <div class="nwdgc-metric-label">Blades</div>
                            <div id="calc_blades_metric" class="nwdgc-metric-val">${(Number(state.calculatedBlades) || 0).toFixed(2)}</div>
                        </div>
                        <div class="nwdgc-metric-tile">
                            <div class="nwdgc-metric-label">Price / Blade</div>
                            <div class="nwdgc-metric-val">GHS ${(Number(state.pricePerBlade) || 0).toFixed(2)}</div>
                        </div>
                    </div>
                `}

                <!-- Full Width White Payout Box -->
                <div class="nwdgc-payout-box">
                    <div class="nwdgc-payout-label">Amount to be paid to the seller</div>
                    <div class="nwdgc-payout-amount">GHS <span id="calc_total_payout">${state.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                </div>
            </div>

            <!-- Discount Note -->
            <div style="text-align: center; margin-top: 14px; margin-bottom: 20px;">
                <div style="font-size: 1.05rem; font-weight: 800; color: #121926;">
                    ${(Number(state.discountPercent) || 0.7)}% Purity Discount Applied
                </div>
                <div style="font-size: 0.8rem; color: #94A3B8; font-weight: 600;">
                    Powered by Qwik Gold
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px; font-size: 0.92rem;">Reference / Comments</label>
                <input type="text" class="form-control" value="${state.notes || ''}" oninput="window.updateWizardState('notes', this.value)" placeholder="Optional transaction notes or remarks...">
            </div>

            <div style="display: flex; gap: 12px;">
                <button class="btn btn-outline" style="flex: 1; padding: 12px;" onclick="window.wizardNext(1)">Back</button>
                <button class="btn btn-primary" style="flex: 2; padding: 12px;" onclick="window.wizardNext(3)">Review Order <span class="material-symbols-outlined">arrow_forward</span></button>
            </div>
        `;
    }
    else if (state.step === 3) {
        body.innerHTML = `
            <div style="background: #FFFFFF; border: 1px solid rgba(0,0,0,0.06); border-radius: 16px; padding: 20px; margin-bottom: 24px; display: flex; gap: 16px; align-items: center; box-shadow: 0 4px 16px rgba(0,0,0,0.02);">
                <div style="width: 48px; height: 48px; border-radius: 14px; background: #DCFCE7; color: #15803D; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <span class="material-symbols-outlined" style="font-size: 1.6rem;">check_circle</span>
                </div>
                <div>
                    <div style="font-size: 0.95rem; font-weight: 800; color: #121926; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Step 3: Summary & Confirm</div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">Review the final details and complete the walk-in purchase.</div>
                </div>
            </div>
            
            <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                <!-- Seller -->
                <div style="display: flex; align-items: center; padding: 16px; border-bottom: 1px solid var(--border);">
                    <div style="background: var(--bg-hover); padding: 8px; border-radius: 6px; margin-right: 16px; display: flex;">
                        <span class="material-symbols-outlined" style="font-size: 20px; color: var(--text-muted);">person</span>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--text-color); font-size: 0.95rem;">Seller</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">${state.sellerType === 'registered' ? state.customerName : state.walkinName + ' (Walk-In)'}</div>
                    </div>
                </div>
                
                <!-- Gold Type -->
                <div style="display: flex; align-items: center; padding: 16px; border-bottom: 1px solid var(--border);">
                    <div style="background: var(--bg-hover); padding: 8px; border-radius: 6px; margin-right: 16px; display: flex;">
                        <span class="material-symbols-outlined" style="font-size: 20px; color: var(--text-muted);">category</span>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--text-color); font-size: 0.95rem;">Gold Type</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: capitalize;">${state.goldType === 'refined' ? 'Refined Gold' : 'Gold Balls'}</div>
                    </div>
                </div>

                <!-- Weight & Metrics -->
                <div style="display: flex; align-items: center; padding: 16px; border-bottom: 1px solid var(--border);">
                    <div style="background: var(--bg-hover); padding: 8px; border-radius: 6px; margin-right: 16px; display: flex;">
                        <span class="material-symbols-outlined" style="font-size: 20px; color: var(--text-muted);">scale</span>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--text-color); font-size: 0.95rem;">Total Weight</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">${(parseFloat(state.grams) || 0).toFixed(4)} g</div>
                    </div>
                    ${state.goldType === 'refined' ? `
                    <div style="flex: 1; border-left: 1px solid var(--border); padding-left: 16px;">
                        <div style="font-weight: 600; color: var(--text-color); font-size: 0.95rem; display: flex; align-items: center; gap: 4px;">
                            <span class="material-symbols-outlined" style="font-size: 16px; color: #3b82f6;">water_drop</span> Volume
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">${(parseFloat(state.volume) || 0).toFixed(4)} v</div>
                    </div>
                    ` : ''}
                </div>

                <!-- Price & Calculations -->
                ${state.goldType === 'refined' ? `
                <div style="display: flex; align-items: center; padding: 16px; border-bottom: 1px solid var(--border);">
                    <div style="background: var(--bg-hover); padding: 8px; border-radius: 6px; margin-right: 16px; display: flex;">
                        <span class="material-symbols-outlined" style="font-size: 20px; color: var(--text-muted);">analytics</span>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--text-color); font-size: 0.95rem;">Density, Karat & Purity Breakdown</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">
                            Pounds: ${(Number(state.calculatedPounds) || 0).toFixed(2)} &nbsp;&bull;&nbsp; Density: ${(Number(state.calculatedDensity) || 0).toFixed(2)}<br>
                            Gross: ${(Number(state.rawKarat) || 0).toFixed(2)}k &nbsp;&bull;&nbsp; Payable: <strong style="color: var(--primary);">${(Number(state.calculatedKarat) || 0).toFixed(2)}k</strong> (${(Number(state.discountPercent) || 0.7)}% Disc) &nbsp;&bull;&nbsp; Purity: <strong style="color: #059669;">${(Number(state.purityPercent) || 0).toFixed(2)}%</strong>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600; color: var(--text-color); font-size: 0.95rem;">₵ ${parseFloat(state.pricePerPound).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">Local Price</div>
                    </div>
                </div>
                ` : `
                <div style="display: flex; align-items: center; padding: 16px; border-bottom: 1px solid var(--border);">
                    <div style="background: var(--bg-hover); padding: 8px; border-radius: 6px; margin-right: 16px; display: flex;">
                        <span class="material-symbols-outlined" style="font-size: 20px; color: var(--text-muted);">analytics</span>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--text-color); font-size: 0.95rem;">Total Blades</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">${(Number(state.calculatedBlades) || 0).toFixed(4)} Blades</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600; color: var(--text-color); font-size: 0.95rem;">₵ ${parseFloat(state.pricePerBlade).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">per Blade</div>
                    </div>
                </div>
                `}

                <!-- Notes/Reference -->
                ${state.notes ? `
                <div style="display: flex; align-items: center; padding: 16px; border-bottom: 1px solid var(--border);">
                    <div style="background: var(--bg-hover); padding: 8px; border-radius: 6px; margin-right: 16px; display: flex;">
                        <span class="material-symbols-outlined" style="font-size: 20px; color: var(--text-muted);">notes</span>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--text-color); font-size: 0.95rem;">Reference / Notes</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">${state.notes}</div>
                    </div>
                </div>
                ` : ''}

                <!-- Total Amount -->
                <div style="padding: 24px; background: #F8FAFC; border-top: 1px solid var(--border);">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <div style="font-weight: 800; color: #475569; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Total Amount to Pay</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">Will be deducted from vault</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 800; color: var(--danger); font-size: 2rem; letter-spacing: -0.5px;">
                                <span style="font-size: 1.2rem; vertical-align: middle; color: #94a3b8;">₵</span>${state.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="wizard_actions" style="display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn btn-outline" style="padding: 8px 20px;" onclick="window.wizardNext(2)">Back</button>
                <button class="btn btn-primary" style="padding: 8px 20px;" onclick="window.submitWizardPurchase()">
                    Confirm Transaction
                </button>
            </div>
        `;
    }
    else if (state.step === 4) {
        // Dual Receipts View
        const dateObj = new Date();
        const sellerName = state.sellerType === 'registered' ? state.customerName : state.walkinName + ' (Walk-In)';
        const company = (window.getCompanySettings && window.getCompanySettings()) || {};
        const compName = company.company_name || 'QWIK GOLD';
        const compLogo = company.company_logo || 'assets/img/logo.png';
        const compTagline = company.company_tagline || '';
        const compAddress = company.company_address || '';
        const compPhone = company.company_phone || '';
        const compEmail = company.company_email || '';
        const compFooter = company.company_receipt_footer || 'Thank you for doing business with Qwik Gold!';

        const generateReceiptHTML = (copyType) => `
            <div class="receipt-box" style="border: 1px solid var(--border); border-radius: 8px; padding: 20px; width: 48%; min-width: 300px;">
                <div style="text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 15px; margin-bottom: 15px;">
                    ${compLogo ? `<img src="${compLogo}" alt="Logo" style="max-height: 38px; max-width: 120px; object-fit: contain; margin-bottom: 6px;">` : ''}
                    <h2 style="margin: 0; color: var(--gold-primary); font-family: 'Outfit', sans-serif; font-size: 1.25rem; font-weight: 800; text-transform: uppercase;">${compName}</h2>
                    ${compTagline ? `<div style="font-size: 0.74rem; color: var(--text-muted); font-weight: 500;">${compTagline}</div>` : ''}
                    ${compAddress ? `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">${compAddress}</div>` : ''}
                    ${(compPhone || compEmail) ? `<div style="font-size: 0.72rem; color: var(--text-muted);">${[compPhone, compEmail].filter(Boolean).join(' &bull; ')}</div>` : ''}
                    <p style="margin: 6px 0 0 0; color: var(--text-muted); font-size: 0.82rem;">Purchase Receipt - <strong>${copyType}</strong></p>
                </div>
                
                <table style="width: 100%; margin-bottom: 15px; font-size: 0.85rem;">
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Txn Ref:</td><td style="padding: 3px 0; text-align: right; font-weight: 600; font-family: monospace;">${state.transactionId}</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Date:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()}</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Seller:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${sellerName}</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Handled By:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${state.handlerName}</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Gold Type:</td><td style="padding: 3px 0; text-align: right; font-weight: 600; text-transform: capitalize;">${state.goldType}</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Weight:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${parseFloat(state.grams).toFixed(4)} g</td></tr>
                    ${state.goldType === 'refined' ? `
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Volume:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${(parseFloat(state.volume) || 0).toFixed(4)} v</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Local Price:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">₵ ${parseFloat(state.pricePerPound).toLocaleString(undefined, { minimumFractionDigits: 2 })} / Pound</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Pounds:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${(Number(state.calculatedPounds) || 0).toFixed(2)}</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Density:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${(Number(state.calculatedDensity) || 0).toFixed(2)}</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Gross Karat:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${(Number(state.rawKarat) || 0).toFixed(2)}k</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Payable Karat:</td><td style="padding: 3px 0; text-align: right; font-weight: 700; color: #1d4ed8;">${(Number(state.calculatedKarat) || 0).toFixed(2)}k (${(Number(state.discountPercent) || 0.7)}% disc)</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Purity:</td><td style="padding: 3px 0; text-align: right; font-weight: 600; color: #059669;">${(Number(state.purityPercent) || 0).toFixed(2)}%</td></tr>
                    ` : `
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Local Price:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">₵ ${parseFloat(state.pricePerBlade).toLocaleString(undefined, { minimumFractionDigits: 2 })} / Blade</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Total Blades:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${(Number(state.calculatedBlades) || 0).toFixed(4)}</td></tr>
                    `}
                </table>
                
                <div style="background: var(--bg-hover); padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span style="font-weight: 600; font-size: 0.9rem;">Amount Paid:</span>
                    <span style="font-size: 1.1rem; font-weight: 700; color: var(--danger);">₵${state.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-top: 30px;">
                    <div style="border-top: 1px solid #ccc; width: 45%; text-align: center; padding-top: 5px; font-size: 0.75rem; color: var(--text-muted);">Seller Signature</div>
                    <div style="border-top: 1px solid #ccc; width: 45%; text-align: center; padding-top: 5px; font-size: 0.75rem; color: var(--text-muted);">Merchant Signature</div>
                </div>
            </div>
        `;

        document.getElementById('modal-title').textContent = 'Transaction Successful';
        body.innerHTML = `
            <div class="no-print">
                <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; margin-bottom: 20px;">
                    ${generateReceiptHTML('MERCHANT COPY')}
                    ${generateReceiptHTML('SELLER COPY')}
                </div>
                
                <div style="text-align: center;">
                    <button class="btn btn-primary" onclick="window.print()" style="padding: 12px 24px;">
                        <span class="material-symbols-outlined">print</span> Print Receipts
                    </button>
                </div>
            </div>
            ${window.getThermalPrintHTML(
            {
                gold_type: state.goldType,
                weight_grams: state.grams,
                pounds: state.calculatedPounds,
                volume: state.volume,
                density: state.calculatedDensity,
                karat: state.calculatedKarat,
                total_blades: state.calculatedBlades,
                local_price: state.pricePerPound || state.pricePerBlade,
                total_paid_ghs: state.totalPayout
            },
            new Date(),
            state.sellerType === 'registered' ? state.customerName : state.walkinName + ' (Walk-In)'
        )}
        `;
    }
};

window.updateWizardState = (key, value) => {
    window._wizardState[key] = value;
    if (key === 'sellerType' || key === 'goldType') {
        window.renderWizardStep(); // Re-render if layout changes
    }
};

window.wizardNext = async (targetStep) => {
    const state = window._wizardState;

    // Validation before moving
    if (targetStep === 2) {
        if (state.sellerType === 'registered' && !state.customerId) {
            return window.showToast('Please select a customer', 'error');
        }
        if (state.sellerType === 'walkin' && !state.walkinName.trim()) {
            return window.showToast('Please enter a walk-in name', 'error');
        }
    }
    if (targetStep === 3) {
        window.calculatePurchaseMath();
        if (state.grams <= 0) return window.showToast('Weight must be greater than 0', 'error');
        if (state.totalPayout <= 0) return window.showToast('Calculated payout is 0', 'error');

        // Strict Capital Validation
        try {
            const btn = document.querySelector(`button[onclick="window.wizardNext(3)"]`);
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Checking Capital...';
            }

            const capitalData = await window.api.get('/capital/balance.php');

            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'Review Order <span class="material-symbols-outlined">arrow_forward</span>';
            }

            if (state.totalPayout > capitalData.available_cash_ghs) {
                return window.showToast(`Insufficient Office Capital. Available: ₵ ${capitalData.available_cash_ghs.toLocaleString()}`, 'error');
            }
        } catch (error) {
            return window.showToast('Failed to verify capital balance', 'error');
        }
    }

    state.step = targetStep;
    window.renderWizardStep();
};

window.calculatePurchaseMath = () => {
    const state = window._wizardState;

    const grams = parseFloat(document.getElementById('wiz_weight')?.value) || 0;
    state.grams = grams;

    if (state.goldType === 'refined') {
        const volume = parseFloat(document.getElementById('wiz_volume')?.value) || 0;
        const pricePerPound = parseFloat(document.getElementById('wiz_price_pound')?.value) || 0;

        state.volume = volume;
        state.pricePerPound = pricePerPound;

        const calc = window.GoldMath.calculate({
            grams,
            volume,
            pricePerPound
        });

        state.calculatedPounds = calc.pounds;
        state.calculatedDensity = calc.density;
        state.rawKarat = calc.rawKarat;
        state.calculatedKarat = calc.payableKarat;
        state.purityPercent = calc.purityPercent;
        state.discountPercent = calc.discountPercent;
        state.totalPayout = calc.totalPayout;

        if (document.getElementById('calc_pounds')) {
            document.getElementById('calc_pounds').innerText = state.calculatedPounds.toFixed(2);
            document.getElementById('calc_density').innerText = state.calculatedDensity.toFixed(2);
            if (document.getElementById('calc_raw_karat')) {
                document.getElementById('calc_raw_karat').innerText = state.rawKarat.toFixed(2) + 'k';
            }
            if (document.getElementById('calc_payable_karat')) {
                document.getElementById('calc_payable_karat').innerText = state.calculatedKarat.toFixed(2) + 'k';
            }
            if (document.getElementById('calc_karat')) {
                document.getElementById('calc_karat').innerText = state.calculatedKarat.toFixed(2);
            }
            if (document.getElementById('calc_purity')) {
                document.getElementById('calc_purity').innerText = state.purityPercent.toFixed(2) + '%';
            }
            if (document.getElementById('calc_discount_badge')) {
                document.getElementById('calc_discount_badge').innerHTML = `
                    <span style="background: rgba(16, 185, 129, 0.12); color: #059669; border: 1px solid rgba(16, 185, 129, 0.25); padding: 3px 10px; border-radius: 20px; display: inline-flex; align-items: center; gap: 4px;">
                        <span class="material-symbols-outlined" style="font-size: 14px;">verified</span>
                        ${state.discountPercent}% Purity Discount Applied
                    </span>
                `;
            }
            document.getElementById('calc_total_payout').innerText = state.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            const warnBanner = document.getElementById('wiz_warn_banner');
            if (warnBanner) {
                if (state.calculatedDensity > 0 && state.calculatedKarat > 0 && state.calculatedKarat < 14.0) {
                    warnBanner.classList.remove('hidden');
                } else {
                    warnBanner.classList.add('hidden');
                }
            }
        }
    } else {
        const pricePerBlade = parseFloat(document.getElementById('wiz_price_blade')?.value) || 0;

        state.pricePerBlade = pricePerBlade;
        state.calculatedBlades = grams / 0.8;
        state.totalPayout = Math.floor(state.calculatedBlades * pricePerBlade);

        if (document.getElementById('calc_blades')) {
            document.getElementById('calc_blades').innerText = state.calculatedBlades.toFixed(4);
        }
        if (document.getElementById('calc_blades_metric')) {
            document.getElementById('calc_blades_metric').innerText = state.calculatedBlades.toFixed(2);
        }
        if (document.getElementById('calc_total_payout')) {
            document.getElementById('calc_total_payout').innerText = state.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    }
};

window.submitWizardPurchase = async () => {
    const state = window._wizardState;
    const actions = document.getElementById('wizard_actions');
    actions.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';

    // Build the notes: if walkin, store name in notes. Plus whatever they wrote.
    let finalNotes = state.notes;
    if (state.sellerType === 'walkin') {
        finalNotes = state.walkinName + (finalNotes ? ' - ' + finalNotes : '');
    }

    const payload = {
        gold_type: state.goldType,
        weight_grams: state.grams,
        volume: state.volume || null,
        total_paid_ghs: state.totalPayout,
        local_price: state.goldType === 'refined' ? state.pricePerPound : state.pricePerBlade,
        density: state.calculatedDensity || null,
        raw_karat: typeof state.rawKarat === 'number' ? state.rawKarat : null,
        karat: typeof state.calculatedKarat === 'number' ? state.calculatedKarat : null,
        discount_percent: state.goldType === 'refined' ? state.discountPercent : null,
        pounds: state.calculatedPounds || null,
        total_blades: state.calculatedBlades || null,
        customer_id: state.sellerType === 'registered' ? state.customerId : null,
        notes: finalNotes || null
    };

    try {
        const res = await window.api.post('/purchases/create.php', payload);
        state.transactionId = res.transaction_id || 'UNKNOWN';
        state.handlerName = res.handled_by || 'Unknown';
        window.showToast('Purchase completed successfully!', 'success');
        window.dispatchEvent(new Event('hashchange')); // Refresh the view in background

        // Move to Step 4 (Receipts)
        state.step = 4;
        window.renderWizardStep();
    } catch (error) {
        console.error('Error in purchase:', error);
        window.showToast(error.message || 'Failed to complete purchase', 'error');
        state.step = 3;
        window.renderWizardStep(); // Restore step 3 buttons
    }
};

window.getThermalPrintHTML = (purchaseObj, dateObj, sellerName) => {
    return `
    <div class="print-only thermal-receipt" style="display: none; position: fixed; top: 0; left: 0; font-family: monospace !important; color: black; background: white; width: 100%; max-width: 300px; padding: 20px; z-index: 999999; box-sizing: border-box;">
        <div style="text-align: center; margin-bottom: 15px;">
            <div style="font-size: 1.2rem; font-weight: bold;">Mukhlis Farhan Trading Limited</div>
            <div style="font-size: 0.9rem;">AC-0064-9566, Konongo - Odumase</div>
            <div style="font-size: 0.9rem;">+233 55 400 1608 / +233 25 664 2984</div>
            <div style="margin-top: 5px; font-weight: bold;">PURCHASE INVOICE</div>
        </div>
        
        <div style="font-size: 1.1rem; margin-bottom: 15px;">
            ${purchaseObj.gold_type === 'refined' ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>${parseFloat(purchaseObj.weight_grams).toFixed(2)}</span>
                <span>---</span>
                <span>${(parseFloat(purchaseObj.pounds) || 0).toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>${purchaseObj.density ? (purchaseObj.weight_grams / purchaseObj.density).toFixed(2) : (purchaseObj.volume ? parseFloat(purchaseObj.volume).toFixed(2) : '0.00')}</span>
                <span>---</span>
                <span>${(parseFloat(purchaseObj.density) || 0).toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Karat</span>
                <span>---</span>
                <span>${(parseFloat(purchaseObj.karat) || 0).toFixed(2)}</span>
            </div>
            ` : `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>Weight (g)</span>
                <span>---</span>
                <span>${parseFloat(purchaseObj.weight_grams).toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Total Blades</span>
                <span>---</span>
                <span>${(parseFloat(purchaseObj.total_blades) || 0).toFixed(4)}</span>
            </div>
            `}
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: bold;">
                <span>Price:</span>
                <span>₵${parseFloat(purchaseObj.local_price || purchaseObj.pricePerBlade || purchaseObj.pricePerPound || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.3rem;">
                <span>Amount:</span>
                <span>₵${parseFloat(purchaseObj.total_paid_ghs || purchaseObj.totalPayout || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
        </div>
        
        <div style="border-top: 1px dashed black; margin: 10px 0;"></div>
        
        <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
            <span>Name of Customer,</span>
            <span>${sellerName}</span>
        </div>
        
        <div style="border-top: 1px dashed black; margin: 10px 0;"></div>
        
        <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
            <span>Date,</span>
            <span>${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        
        <div style="text-align: center; margin-top: 20px; font-size: 0.9rem;">
            Thank you!
        </div>
    </div>
    `;
};

window.viewPurchaseReceipt = (purchaseId) => {
    const purchase = window._walkInPurchases.find(p => p.id === purchaseId);
    if (!purchase) return;

    document.getElementById('modal-title').textContent = 'Transaction Receipt';
    const modalBody = document.getElementById('modal-body');

    const txnId = purchase.transaction_ref || '#TXN-' + purchase.id;
    const dateObj = new Date(purchase.created_at);
    const company = (window.getCompanySettings && window.getCompanySettings()) || {};
    const compName = company.company_name || 'QWIK GOLD';
    const compLogo = company.company_logo || 'assets/img/logo.png';
    const compTagline = company.company_tagline || '';
    const compAddress = company.company_address || '';
    const compPhone = company.company_phone || '';
    const compEmail = company.company_email || '';
    const compFooter = company.company_receipt_footer || 'Thank you for doing business with Qwik Gold!';

    modalBody.innerHTML = `
        <div class="no-print">
            <div style="display: flex; justify-content: center; margin-bottom: 20px;">
                <div class="receipt-box" style="border: 1px solid var(--border); border-radius: 8px; padding: 20px; width: 100%; max-width: 400px;">
                    <div style="text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 15px; margin-bottom: 15px;">
                        ${compLogo ? `<img src="${compLogo}" alt="Logo" style="max-height: 38px; max-width: 120px; object-fit: contain; margin-bottom: 6px;">` : ''}
                        <h2 style="margin: 0; color: var(--gold-primary); font-family: 'Outfit', sans-serif; font-size: 1.25rem; font-weight: 800; text-transform: uppercase;">${compName}</h2>
                        ${compTagline ? `<div style="font-size: 0.74rem; color: var(--text-muted); font-weight: 500;">${compTagline}</div>` : ''}
                        ${compAddress ? `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">${compAddress}</div>` : ''}
                        ${(compPhone || compEmail) ? `<div style="font-size: 0.72rem; color: var(--text-muted);">${[compPhone, compEmail].filter(Boolean).join(' &bull; ')}</div>` : ''}
                        <p style="margin: 6px 0 0 0; color: var(--text-muted); font-size: 0.85rem;">Purchase Receipt</p>
                    </div>
                    
                    <table style="width: 100%; margin-bottom: 15px; font-size: 0.85rem;">
                        <tr><td style="padding: 3px 0; color: var(--text-muted);">Txn Ref:</td><td style="padding: 3px 0; text-align: right; font-weight: 600; font-family: monospace;">${txnId}</td></tr>
                        <tr><td style="padding: 3px 0; color: var(--text-muted);">Date:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()}</td></tr>
                        <tr><td style="padding: 3px 0; color: var(--text-muted);">Seller:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${purchase.seller_display}</td></tr>
                        ${purchase.handled_by ? `<tr><td style="padding: 3px 0; color: var(--text-muted);">Handled By:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${purchase.handled_by}</td></tr>` : ''}
                        <tr><td style="padding: 3px 0; color: var(--text-muted);">Gold Type:</td><td style="padding: 3px 0; text-align: right; font-weight: 600; text-transform: capitalize;">${purchase.gold_type}</td></tr>
                        <tr><td style="padding: 3px 0; color: var(--text-muted);">Weight:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${parseFloat(purchase.weight_grams).toFixed(4)} g</td></tr>
                        ${purchase.gold_type === 'refined' ? `
                        ${purchase.local_price ? `<tr><td style="padding: 3px 0; color: var(--text-muted);">Local Price:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">₵ ${parseFloat(purchase.local_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>` : ''}
                        ${purchase.density && parseFloat(purchase.density) > 0 ? `<tr><td style="padding: 3px 0; color: var(--text-muted);">Volume:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${(parseFloat(purchase.weight_grams) / parseFloat(purchase.density)).toFixed(4)}</td></tr>` : ''}
                        ${purchase.density ? `<tr><td style="padding: 3px 0; color: var(--text-muted);">Density:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${parseFloat(purchase.density).toFixed(2)}</td></tr>` : ''}
                        ${purchase.karat ? `<tr><td style="padding: 3px 0; color: var(--text-muted);">Karat:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${parseFloat(purchase.karat).toFixed(2)}</td></tr>` : ''}
                        ${purchase.pounds ? `<tr><td style="padding: 3px 0; color: var(--text-muted);">Pounds:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${parseFloat(purchase.pounds).toFixed(2)}</td></tr>` : ''}
                        ` : `
                        ${purchase.local_price ? `<tr><td style="padding: 3px 0; color: var(--text-muted);">Local Price:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">₵ ${parseFloat(purchase.local_price).toLocaleString(undefined, { minimumFractionDigits: 2 })} / Blade</td></tr>` : ''}
                        ${purchase.total_blades ? `<tr><td style="padding: 3px 0; color: var(--text-muted);">Total Blades:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${parseFloat(purchase.total_blades).toFixed(4)}</td></tr>` : ''}
                        `}
                    </table>
                    
                    <div style="background: var(--bg-hover); padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <span style="font-weight: 600; font-size: 0.9rem;">Amount Paid:</span>
                        <span style="font-size: 1.1rem; font-weight: 700; color: var(--danger);">₵${parseFloat(purchase.total_paid_ghs).toLocaleString()}</span>
                    </div>
                    
                    <div style="text-align: center; color: var(--text-muted); font-size: 0.82rem; margin-bottom: 20px; font-style: italic;">
                        ${compFooter}
                    </div>
                </div>
            </div>
    
            <button class="btn btn-primary btn-block" onclick="window.print()">
                <span class="material-symbols-outlined">print</span> Print Receipt
            </button>
        </div>
        ${window.getThermalPrintHTML(purchase, dateObj, purchase.seller_display)}
    `;

    window.openModal('Transaction Receipt', modalBody.innerHTML, { maxWidth: '420px' });
};

window.confirmDeletePurchase = (id, ref, amount) => {
    const confirmHtml = `
        <div style="padding: 10px 0; text-align: center;">
            <div style="width: 52px; height: 52px; background: rgba(239, 68, 68, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto;">
                <span class="material-symbols-outlined" style="font-size: 26px; color: #ef4444;">delete_forever</span>
            </div>
            <h3 style="margin: 0 0 10px 0; color: var(--text-main); font-size: 1.05rem;">Delete Purchase?</h3>
            <p style="color: var(--text-muted); margin-bottom: 20px; font-size: 0.85rem; line-height: 1.5;">
                Are you sure you want to delete purchase <strong>${ref}</strong>? 
                This will safely remove the gold from the vault and refund <strong style="color:var(--text-main)">GHS ${parseFloat(amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</strong> back to your capital balance.
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button type="button" class="btn btn-outline" style="flex: 1;" onclick="window.closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" style="flex: 1; background: #ef4444; border-color: #ef4444;" onclick="window.submitDeletePurchase(${id})">Yes, Delete</button>
            </div>
        </div>
    `;
    window.openModal('Delete Purchase', confirmHtml, { maxWidth: '380px', size: 'sm' });
};

window.submitDeletePurchase = async (id) => {
    document.getElementById('modal-body').innerHTML = '<div style="text-align:center; padding: 40px;"><span class="material-symbols-outlined spin">sync</span><div style="margin-top:16px;">Deleting...</div></div>';
    try {
        await window.api.post('/purchases/delete.php', { id });
        window.closeModal();
        window.showToast('Purchase deleted and capital refunded', 'success');
        
        // Refresh purchases list silently
        const purchases = await window.api.get('/purchases/list.php');
        window._walkInPurchases = purchases;
        window.renderPurchasesTable();
    } catch (e) {
        window.showToast(e.message || 'Failed to delete purchase', 'error');
        window.closeModal();
    }
};
