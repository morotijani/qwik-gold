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
        <div style="max-width: 1100px; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 class="page-title" style="margin-bottom: 0;">Walk-In Purchases</h2>
                <button class="btn" onclick="window.openNewPurchaseModal()">
                    <span class="material-symbols-outlined">add_shopping_cart</span> New Purchase
                </button>
            </div>
            
            <div class="table-container" style="overflow: visible;">
                <table>
                    <thead>
                        <tr>
                            <th>No.</th>
                            <th>Txn Ref</th>
                            <th>Date</th>
                            <th>Seller</th>
                            <th>Gold Type</th>
                            <th>Weight</th>
                            <th>Amount Paid</th>
                        </tr>
                    </thead>
                    <tbody id="purchases-tbody">
                        <tr><td colspan="7" style="text-align: center;">Loading purchases...</td></tr>
                    </tbody>
                </table>
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
            `<tr><td colspan="7" style="text-align: center; color: #ff6b6b;">Error loading purchases.</td></tr>`;
    }
});

window.renderPurchasesTable = () => {
    const tbody = document.getElementById('purchases-tbody');
    const paginationContainer = document.getElementById('purchases-pagination');
    if (!tbody) return;

    const purchases = window._walkInPurchases;

    if (purchases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No purchases recorded yet.</td></tr>';
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
        return `
            <tr>
                <td style="font-weight: 500; color: var(--text-muted);">${globalIndex}</td>
                <td>
                    <a href="javascript:void(0)" onclick="window.viewPurchaseReceipt(${p.id})" style="font-family: monospace; font-weight: 600; color: var(--gold-primary); text-decoration: none;">
                        ${p.transaction_ref || '#TXN-' + p.id}
                    </a>
                </td>
                <td>${new Date(p.created_at).toLocaleDateString()}</td>
                <td><span class="badge badge-outline">${p.seller_display}</span></td>
                <td style="text-transform: capitalize;">${p.gold_type}</td>
                <td style="font-weight: 600;">${parseFloat(p.weight_grams).toFixed(2)}g</td>
                <td style="color: #ff6b6b; font-weight: 600;">₵${parseFloat(p.total_paid_ghs).toLocaleString()}</td>
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
    document.getElementById('modal-title').textContent = 'Walk-In Purchase Wizard';
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = '<div style="text-align: center; padding: 20px;">Loading data...</div>';
    document.getElementById('global-modal').classList.add('active');

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
            calculatedPounds: 0, calculatedDensity: 0, calculatedKarat: 0, calculatedBlades: 0,
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
            <div style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 5px 0; font-weight: 600; color: var(--text-color);">Seller Details</h3>
                <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem;">Select who is selling the gold.</p>
            </div>
            <div class="form-group" style="margin-bottom: 24px;">
                <label style="margin-bottom: 8px;">Seller Type</label>
                <div class="segmented-control">
                    <label class="segment-label">
                        <input type="radio" name="wiz_seller_type" value="registered" ${state.sellerType === 'registered' ? 'checked' : ''} onchange="window.updateWizardState('sellerType', 'registered')"> 
                        <span><span class="material-symbols-outlined" style="font-size:18px; vertical-align:text-bottom;">person</span> Registered Customer</span>
                    </label>
                    <label class="segment-label">
                        <input type="radio" name="wiz_seller_type" value="walkin" ${state.sellerType === 'walkin' ? 'checked' : ''} onchange="window.updateWizardState('sellerType', 'walkin')"> 
                        <span><span class="material-symbols-outlined" style="font-size:18px; vertical-align:text-bottom;">person_add</span> One-Time Walk-In</span>
                    </label>
                </div>
            </div>

            ${state.sellerType === 'registered' ? `
                <div class="form-group">
                    <label>Select Customer</label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">person</span>
                        <select id="wiz_customer_id" onchange="window.updateWizardState('customerId', this.value); window.updateWizardState('customerName', this.options[this.selectedIndex].text)">
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
                        <input type="text" id="wiz_walkin_name" placeholder="e.g. John Doe" value="${state.walkinName}" oninput="window.updateWizardState('walkinName', this.value)">
                    </div>
                </div>
            `}
            
            <button class="btn btn-primary btn-block" onclick="window.wizardNext(2)">Next Step <span class="material-symbols-outlined">arrow_forward</span></button>
        `;
    }
    else if (state.step === 2) {
        body.innerHTML = `
            <div style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 5px 0; font-weight: 600; color: var(--text-color);">Gold Calculation</h3>
                <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem;">Enter the weight and current market price.</p>
            </div>
            <div class="form-group" style="margin-bottom: 24px;">
                <label style="margin-bottom: 8px;">Gold Type</label>
                <div class="segmented-control">
                    <label class="segment-label">
                        <input type="radio" name="wiz_gold_type" value="refined" ${state.goldType === 'refined' ? 'checked' : ''} onchange="window.updateWizardState('goldType', 'refined')"> 
                        <span><span class="material-symbols-outlined" style="font-size:18px; vertical-align:text-bottom;">diamond</span> Refined Gold</span>
                    </label>
                    <label class="segment-label">
                        <input type="radio" name="wiz_gold_type" value="balls" ${state.goldType === 'balls' ? 'checked' : ''} onchange="window.updateWizardState('goldType', 'balls')"> 
                        <span><span class="material-symbols-outlined" style="font-size:18px; vertical-align:text-bottom;">scatter_plot</span> Gold Balls</span>
                    </label>
                </div>
            </div>

            <!-- Current Price Info -->
            ${state.goldType === 'refined' ? `
                <div style="margin-bottom: 6px; font-weight: 700; color: #4b5563; font-size: 0.85rem;">
                    Local Price
                </div>
                <div class="swap-input-card" style="margin-bottom: 25px;">
                    <div class="swap-input-body">
                        <input type="number" step="0.01" id="wiz_price_pound" placeholder="0.00" value="${state.pricePerPound || ''}" oninput="if(this.value < 0) this.value = Math.abs(this.value); window.calculatePurchaseMath()" min="0">
                        <div class="swap-badge" style="background: var(--gold-primary);">
                            <span class="material-symbols-outlined" style="font-size: 16px;">payments</span> GHS
                        </div>
                    </div>
                </div>
            ` : `
                <div style="margin-bottom: 6px; font-weight: 700; color: #4b5563; font-size: 0.85rem;">
                    Price per Blade
                </div>
                <div class="swap-input-card" style="margin-bottom: 25px;">
                    <div class="swap-input-body">
                        <input type="number" step="0.01" id="wiz_price_blade" placeholder="0.00" value="${state.pricePerBlade || ''}" oninput="if(this.value < 0) this.value = Math.abs(this.value); window.calculatePurchaseMath()" min="0">
                        <div class="swap-badge" style="background: var(--gold-primary);">
                            <span class="material-symbols-outlined" style="font-size: 16px;">payments</span> GHS
                        </div>
                    </div>
                </div>
            `}

            <!-- Grams Input -->
            <div class="swap-input-card" style="${state.goldType === 'refined' ? 'margin-bottom: 4px;' : 'margin-bottom: 20px;'}">
                <div class="swap-input-header">
                    <span>Gram</span>
                    <span class="material-symbols-outlined" style="font-size: 18px; cursor: pointer;">more_horiz</span>
                </div>
                <div class="swap-input-body">
                    <input type="number" step="0.0001" id="wiz_weight" placeholder="0.00" value="${state.grams || ''}" oninput="if(this.value < 0) this.value = Math.abs(this.value); window.calculatePurchaseMath()" min="0">
                    <div class="swap-badge" style="background: #eab308; color: white;">
                        <span class="material-symbols-outlined" style="font-size: 16px;">scale</span> GRM
                    </div>
                </div>
                
                ${state.goldType === 'refined' ? `
                    <div class="swap-icon-btn">
                        <span class="material-symbols-outlined" style="font-size: 20px;">swap_vert</span>
                    </div>
                ` : ''}
            </div>
            
            ${state.goldType === 'refined' ? `
                <!-- Volume Input -->
                <div class="swap-input-card" style="margin-bottom: 20px;">
                    <div class="swap-input-header">
                        <span>Volume</span>
                        <span class="material-symbols-outlined" style="font-size: 18px; cursor: pointer;">more_horiz</span>
                    </div>
                    <div class="swap-input-body">
                        <input type="number" step="0.0001" id="wiz_volume" placeholder="0.00" value="${state.volume || ''}" oninput="if(this.value < 0) this.value = Math.abs(this.value); window.calculatePurchaseMath()" min="0">
                        <div class="swap-badge" style="background: #3b82f6; color: white;">
                            <span class="material-symbols-outlined" style="font-size: 16px;">water_drop</span> VLM
                        </div>
                    </div>
                </div>
            ` : ''}

            <!-- Total Amount & Metrics -->
            <div class="swap-total-container" style="margin-bottom: 20px;">
                <div class="swap-total-label">Total Amount</div>
                <div class="swap-total-value">
                    <span id="calc_total_payout">${state.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <span class="swap-total-symbol">₵</span>
                </div>
                
                ${state.goldType === 'refined' ? `
                    <div class="swap-metrics-row">
                        <span><span id="calc_density" style="font-weight: 700; color: #374151;">${(Number(state.calculatedDensity) || 0).toFixed(2)}</span> Density</span>
                        <span><span id="calc_pounds" style="font-weight: 700; color: #374151;">${(Number(state.calculatedPounds) || 0).toFixed(2)}</span> Pounds</span>
                        <span><span id="calc_karat" style="font-weight: 700; color: #374151;">${(Number(state.calculatedKarat) || 0).toFixed(2)}</span> Karat</span>
                    </div>
                ` : `
                    <div class="swap-metrics-row">
                        <span><span id="calc_blades" style="font-weight: 700; color: #374151;">${(Number(state.calculatedBlades) || 0).toFixed(4)}</span> Total Blades</span>
                    </div>
                `}
            </div>
            
            <div class="form-group">
                <label>Reference / Comments</label>
                <input type="text" class="form-control" value="${state.notes}" oninput="window.updateWizardState('notes', this.value)" placeholder="Optional notes...">
            </div>

            <div style="display: flex; gap: 10px;">
                <button class="btn btn-outline" style="flex: 1;" onclick="window.wizardNext(1)">Back</button>
                <button class="btn btn-primary" style="flex: 2;" onclick="window.wizardNext(3)">Review Order <span class="material-symbols-outlined">arrow_forward</span></button>
            </div>
        `;
    }
    else if (state.step === 3) {
        body.innerHTML = `
            <div style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 5px 0; font-weight: 600; color: var(--text-color);">Summary & Confirm</h3>
                <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem;">Review the transaction details before confirming.</p>
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
                        <div style="font-size: 0.85rem; color: var(--text-muted);">${parseFloat(state.grams).toFixed(4)} g</div>
                    </div>
                </div>

                <!-- Price & Calculations -->
                ${state.goldType === 'refined' ? `
                <div style="display: flex; align-items: center; padding: 16px; border-bottom: 1px solid var(--border);">
                    <div style="background: var(--bg-hover); padding: 8px; border-radius: 6px; margin-right: 16px; display: flex;">
                        <span class="material-symbols-outlined" style="font-size: 20px; color: var(--text-muted);">analytics</span>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--text-color); font-size: 0.95rem;">Density & Karat</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">Density: ${(Number(state.calculatedDensity) || 0).toFixed(2)} &bull; Karat: ${(Number(state.calculatedKarat) || 0).toFixed(2)} &bull; Pounds: ${(Number(state.calculatedPounds) || 0).toFixed(2)}</div>
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
                <div style="display: flex; align-items: center; padding: 16px; background: rgba(0,0,0,0.02);">
                    <div style="background: var(--bg-hover); padding: 8px; border-radius: 6px; margin-right: 16px; display: flex;">
                        <span class="material-symbols-outlined" style="font-size: 20px; color: var(--text-color);">payments</span>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--text-color); font-size: 1rem;">Total Amount to Pay</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 700; color: var(--text-color); font-size: 1.15rem;">₵ ${state.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
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

        const generateReceiptHTML = (copyType) => `
            <div class="receipt-box" style="border: 1px solid var(--border); border-radius: 8px; padding: 20px; width: 48%; min-width: 300px;">
                <div style="text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 15px; margin-bottom: 15px;">
                    <h2 style="margin: 0; color: var(--gold-primary); font-family: 'Outfit', sans-serif;">QWIK GOLD</h2>
                    <p style="margin: 5px 0 0 0; color: var(--text-muted); font-size: 0.85rem;">Purchase Receipt - <strong>${copyType}</strong></p>
                </div>
                
                <table style="width: 100%; margin-bottom: 15px; font-size: 0.85rem;">
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Txn Ref:</td><td style="padding: 3px 0; text-align: right; font-weight: 600; font-family: monospace;">${state.transactionId}</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Date:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()}</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Seller:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${sellerName}</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Gold Type:</td><td style="padding: 3px 0; text-align: right; font-weight: 600; text-transform: capitalize;">${state.goldType}</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Weight:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${parseFloat(state.grams).toFixed(4)} g</td></tr>
                    ${state.goldType === 'refined' ? `
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Local Price:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">₵ ${parseFloat(state.pricePerPound).toLocaleString(undefined, { minimumFractionDigits: 2 })} / Pound</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Density:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${(Number(state.calculatedDensity) || 0).toFixed(2)}</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Karat:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${(Number(state.calculatedKarat) || 0).toFixed(2)}</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Pounds:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${(Number(state.calculatedPounds) || 0).toFixed(2)}</td></tr>
                    ` : `
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Local Price:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">₵ ${parseFloat(state.pricePerBlade).toLocaleString(undefined, { minimumFractionDigits: 2 })} / Blade</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Total Blades:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${(Number(state.calculatedBlades) || 0).toFixed(4)}</td></tr>
                    `}
                </table>
                
                <div style="background: var(--bg-hover); padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span style="font-weight: 600; font-size: 0.9rem;">Amount Paid:</span>
                    <span style="font-size: 1.1rem; font-weight: 700; color: var(--danger);">₵${state.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-top: 30px;">
                    <div style="border-top: 1px solid #ccc; width: 45%; text-align: center; padding-top: 5px; font-size: 0.75rem; color: var(--text-muted);">Seller Signature</div>
                    <div style="border-top: 1px solid #ccc; width: 45%; text-align: center; padding-top: 5px; font-size: 0.75rem; color: var(--text-muted);">Merchant Signature</div>
                </div>
            </div>
        `;

        document.getElementById('modal-title').textContent = 'Transaction Successful';
        body.innerHTML = `
            <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; margin-bottom: 20px;">
                ${generateReceiptHTML('MERCHANT COPY')}
                ${generateReceiptHTML('SELLER COPY')}
            </div>
            
            <div class="no-print" style="text-align: center;">
                <button class="btn btn-primary" onclick="window.print()" style="padding: 12px 24px;">
                    <span class="material-symbols-outlined">print</span> Print Receipts
                </button>
            </div>
        `;
    }
};

window.updateWizardState = (key, value) => {
    window._wizardState[key] = value;
    if (key === 'sellerType' || key === 'goldType') {
        window.renderWizardStep(); // Re-render if layout changes
    }
};

window.wizardNext = (targetStep) => {
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

        const truncate2 = (num) => Math.floor(num * 100) / 100;

        state.calculatedPounds = truncate2(grams / 7.75);
        state.calculatedDensity = volume > 0 ? truncate2(grams / volume) : 0;

        if (state.calculatedDensity > 0) {
            state.calculatedKarat = truncate2(((state.calculatedDensity - 10.51) * 52.838) / state.calculatedDensity);
        } else {
            state.calculatedKarat = 0;
        }

        state.totalPayout = (state.calculatedKarat * pricePerPound / 23) * state.calculatedPounds;

        if (document.getElementById('calc_pounds')) {
            document.getElementById('calc_pounds').innerText = state.calculatedPounds.toFixed(2);
            document.getElementById('calc_density').innerText = state.calculatedDensity.toFixed(2);
            document.getElementById('calc_karat').innerText = typeof state.calculatedKarat === 'number' ? state.calculatedKarat.toFixed(2) : '0.00';
            document.getElementById('calc_total_payout').innerText = state.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2 });
        }
    } else {
        const pricePerBlade = parseFloat(document.getElementById('wiz_price_blade')?.value) || 0;

        state.pricePerBlade = pricePerBlade;
        state.calculatedBlades = grams / 0.8;
        state.totalPayout = state.calculatedBlades * pricePerBlade;

        if (document.getElementById('calc_blades')) {
            document.getElementById('calc_blades').innerText = state.calculatedBlades.toFixed(4);
            document.getElementById('calc_total_payout').innerText = state.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2 });
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
        total_paid_ghs: state.totalPayout,
        local_price: state.goldType === 'refined' ? state.pricePerPound : state.pricePerBlade,
        density: state.calculatedDensity || null,
        karat: typeof state.calculatedKarat === 'number' ? state.calculatedKarat : null,
        pounds: state.calculatedPounds || null,
        total_blades: state.calculatedBlades || null,
        customer_id: state.sellerType === 'registered' ? state.customerId : null,
        notes: finalNotes || null
    };

    try {
        const res = await window.api.post('/purchases/create.php', payload);
        state.transactionId = res.transaction_id || 'UNKNOWN';
        window.showToast('Purchase completed successfully!', 'success');
        window.dispatchEvent(new Event('hashchange')); // Refresh the view in background

        // Move to Step 4 (Receipts)
        state.step = 4;
        window.renderWizardStep();
    } catch (error) {
        console.error('Error in purchase:', error);
        window.showToast('Failed to complete purchase', 'error');
        state.step = 3;
        window.renderWizardStep(); // Restore step 3 buttons
    }
};

window.viewPurchaseReceipt = (purchaseId) => {
    const purchase = window._walkInPurchases.find(p => p.id === purchaseId);
    if (!purchase) return;

    document.getElementById('modal-title').textContent = 'Transaction Receipt';
    const modalBody = document.getElementById('modal-body');

    const txnId = purchase.transaction_ref || '#TXN-' + purchase.id;
    const dateObj = new Date(purchase.created_at);

    modalBody.innerHTML = `
        <div style="display: flex; justify-content: center; margin-bottom: 20px;">
            <div class="receipt-box" style="border: 1px solid var(--border); border-radius: 8px; padding: 20px; width: 100%; max-width: 400px;">
                <div style="text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 15px; margin-bottom: 15px;">
                    <h2 style="margin: 0; color: var(--gold-primary); font-family: 'Outfit', sans-serif;">QWIK GOLD</h2>
                    <p style="margin: 5px 0 0 0; color: var(--text-muted); font-size: 0.85rem;">Purchase Receipt</p>
                </div>
                
                <table style="width: 100%; margin-bottom: 15px; font-size: 0.85rem;">
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Txn Ref:</td><td style="padding: 3px 0; text-align: right; font-weight: 600; font-family: monospace;">${txnId}</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Date:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()}</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Seller:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${purchase.seller_display}</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Gold Type:</td><td style="padding: 3px 0; text-align: right; font-weight: 600; text-transform: capitalize;">${purchase.gold_type}</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Weight:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${parseFloat(purchase.weight_grams).toFixed(4)} g</td></tr>
                    ${purchase.gold_type === 'refined' ? `
                    ${purchase.local_price ? `<tr><td style="padding: 3px 0; color: var(--text-muted);">Local Price:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">₵ ${parseFloat(purchase.local_price).toLocaleString(undefined, {minimumFractionDigits: 2})} / Pound</td></tr>` : ''}
                    ${purchase.density ? `<tr><td style="padding: 3px 0; color: var(--text-muted);">Density:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${parseFloat(purchase.density).toFixed(2)}</td></tr>` : ''}
                    ${purchase.karat ? `<tr><td style="padding: 3px 0; color: var(--text-muted);">Karat:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${parseFloat(purchase.karat).toFixed(2)}</td></tr>` : ''}
                    ${purchase.pounds ? `<tr><td style="padding: 3px 0; color: var(--text-muted);">Pounds:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${parseFloat(purchase.pounds).toFixed(2)}</td></tr>` : ''}
                    ` : `
                    ${purchase.local_price ? `<tr><td style="padding: 3px 0; color: var(--text-muted);">Local Price:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">₵ ${parseFloat(purchase.local_price).toLocaleString(undefined, {minimumFractionDigits: 2})} / Blade</td></tr>` : ''}
                    ${purchase.total_blades ? `<tr><td style="padding: 3px 0; color: var(--text-muted);">Total Blades:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${parseFloat(purchase.total_blades).toFixed(4)}</td></tr>` : ''}
                    `}
                </table>
                
                <div style="background: var(--bg-hover); padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span style="font-weight: 600; font-size: 0.9rem;">Amount Paid:</span>
                    <span style="font-size: 1.1rem; font-weight: 700; color: var(--danger);">₵${parseFloat(purchase.total_paid_ghs).toLocaleString()}</span>
                </div>
                
                <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">
                    Thank you for doing business with Qwik Gold!
                </div>
            </div>
        </div>

        <button class="btn btn-primary btn-block no-print" onclick="window.print()">
            <span class="material-symbols-outlined">print</span> Print Receipt
        </button>
    `;

    document.getElementById('global-modal').classList.add('active');
};
