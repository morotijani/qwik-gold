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
                <button class="btn btn-primary" onclick="window.openNewPurchaseModal()">
                    <span class="material-symbols-outlined">add_shopping_cart</span> New Purchase
                </button>
            </div>
            
            <div class="table-container">
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
        </div>
    `;

    try {
        const purchases = await window.api.get('/purchases/list.php');
        window._walkInPurchases = purchases;
        const tbody = document.getElementById('purchases-tbody');
        
        if (purchases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No purchases recorded yet.</td></tr>';
            return;
        }

        tbody.innerHTML = purchases.map((p, index) => `
            <tr>
                <td style="font-weight: 500; color: var(--text-muted);">${index + 1}</td>
                <td>
                    <a href="javascript:void(0)" onclick="window.viewPurchaseReceipt(${p.id})" style="font-family: monospace; font-weight: 600; color: var(--gold-primary); text-decoration: none;">
                        ${p.transaction_ref || '#TXN-'+p.id}
                    </a>
                </td>
                <td>${new Date(p.created_at).toLocaleDateString()}</td>
                <td><span class="badge badge-outline">${p.seller_display}</span></td>
                <td style="text-transform: capitalize;">${p.gold_type}</td>
                <td style="font-weight: 600;">${parseFloat(p.weight_grams).toFixed(2)}g</td>
                <td style="color: #ff6b6b; font-weight: 600;">₵${parseFloat(p.total_paid_ghs).toLocaleString()}</td>
            </tr>
        `).join('');

    } catch (error) {
        document.getElementById('purchases-tbody').innerHTML = 
            `<tr><td colspan="7" style="text-align: center; color: #ff6b6b;">Error loading purchases.</td></tr>`;
    }
});

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
            calculatedPounds: 0, calculatedDensity: 0, calculatedKarat: 'Unknown', calculatedBlades: 0,
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
            <div style="margin-bottom: 20px; text-align: center;">
                <span class="badge" style="background: var(--gold-primary); color: #000;">Step 1: Seller Details</span>
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
            <div style="margin-bottom: 20px; text-align: center;">
                <span class="badge" style="background: var(--gold-primary); color: #000;">Step 2: Gold Calculation</span>
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

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                    <label>Weight (Grams)</label>
                    <input type="number" step="0.0001" id="wiz_weight" class="form-control" value="${state.grams || ''}" oninput="window.calculatePurchaseMath()">
                </div>
                
                ${state.goldType === 'refined' ? `
                    <div class="form-group">
                        <label>Volume (Water)</label>
                        <input type="number" step="0.0001" id="wiz_volume" class="form-control" value="${state.volume || ''}" oninput="window.calculatePurchaseMath()">
                    </div>
                    <div class="form-group">
                        <label>Local Price per Pound (₵)</label>
                        <input type="number" step="0.01" id="wiz_price_pound" class="form-control" value="${state.pricePerPound || ''}" oninput="window.calculatePurchaseMath()">
                    </div>
                ` : `
                    <div class="form-group">
                        <label>Price per Blade (₵)</label>
                        <input type="number" step="0.01" id="wiz_price_blade" class="form-control" value="${state.pricePerBlade || ''}" oninput="window.calculatePurchaseMath()">
                    </div>
                `}
            </div>
            
            <div style="background: var(--bg-hover); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; font-size: 0.9rem; color: var(--text-muted);">Auto-Calculated Metrics</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    ${state.goldType === 'refined' ? `
                        <div><label style="font-size: 0.75rem; margin:0;">Pounds:</label><input type="text" id="calc_pounds" disabled class="form-control" value="${state.calculatedPounds.toFixed(4)}" style="padding: 5px; font-size: 0.9rem;"></div>
                        <div><label style="font-size: 0.75rem; margin:0;">Density:</label><input type="text" id="calc_density" disabled class="form-control" value="${state.calculatedDensity.toFixed(2)}" style="padding: 5px; font-size: 0.9rem;"></div>
                        <div style="grid-column: span 2;"><label style="font-size: 0.75rem; margin:0;">Est. Karat:</label><input type="text" id="calc_karat" disabled class="form-control" value="${state.calculatedKarat}" style="padding: 5px; font-size: 0.9rem;"></div>
                    ` : `
                        <div style="grid-column: span 2;"><label style="font-size: 0.75rem; margin:0;">Total Blades:</label><input type="text" id="calc_blades" disabled class="form-control" value="${state.calculatedBlades.toFixed(4)}" style="padding: 5px; font-size: 0.9rem;"></div>
                    `}
                </div>
            </div>
            
            <div style="background: var(--gold-bg); border: 1px solid var(--gold-primary); padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <span style="font-weight: 600; color: #b45309;">Total Payout:</span>
                <span id="calc_total_payout" style="font-size: 1.25rem; font-weight: 700; color: var(--danger);">₵ ${state.totalPayout.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
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
            <div style="margin-bottom: 20px; text-align: center;">
                <span class="badge" style="background: var(--gold-primary); color: #000;">Step 3: Summary & Confirm</span>
            </div>
            
            <table style="width: 100%; margin-bottom: 20px; font-size: 0.95rem; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 10px 0; color: var(--text-muted);">Seller:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 600;">${state.sellerType === 'registered' ? state.customerName : state.walkinName + ' (Walk-In)'}</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 10px 0; color: var(--text-muted);">Gold Type:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 600; text-transform: capitalize;">${state.goldType}</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 10px 0; color: var(--text-muted);">Total Weight:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 600;">${parseFloat(state.grams).toFixed(4)} g</td>
                </tr>
                ${state.goldType === 'refined' ? `
                    <tr style="border-bottom: 1px solid var(--border);">
                        <td style="padding: 10px 0; color: var(--text-muted);">Karat / Density:</td>
                        <td style="padding: 10px 0; text-align: right; font-weight: 600;">${state.calculatedKarat} (${state.calculatedDensity.toFixed(2)})</td>
                    </tr>
                ` : ``}
            </table>
            
            <div style="background: var(--bg-hover); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                <p style="margin: 0 0 5px 0; color: var(--text-muted); font-size: 0.9rem;">Amount to Pay</p>
                <h2 style="margin: 0; color: var(--danger);">₵ ${state.totalPayout.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
            </div>

            <div style="display: flex; gap: 10px;" id="wizard_actions">
                <button class="btn btn-outline" style="flex: 1;" onclick="window.wizardNext(2)">Back</button>
                <button class="btn btn-primary" style="flex: 2;" onclick="window.submitWizardPurchase()">
                    <span class="material-symbols-outlined">check_circle</span> Confirm Purchase
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
                </table>
                
                <div style="background: var(--bg-hover); padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span style="font-weight: 600; font-size: 0.9rem;">Amount Paid:</span>
                    <span style="font-size: 1.1rem; font-weight: 700; color: var(--danger);">₵${state.totalPayout.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
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
        state.calculatedPounds = grams / 8;
        state.calculatedDensity = volume > 0 ? (grams / volume) : 0;
        
        const karatMap = { 19.32: '24K', 17.70: '22K', 15.60: '18K', 13.50: '14K', 11.50: '10K' };
        let closestKarat = 'Unknown';
        let minDiff = null;
        for(let d in karatMap) {
            let diff = Math.abs(state.calculatedDensity - parseFloat(d));
            if (minDiff === null || diff < minDiff) {
                minDiff = diff;
                closestKarat = karatMap[d];
            }
        }
        state.calculatedKarat = closestKarat;
        state.totalPayout = state.calculatedPounds * pricePerPound;
        
        if (document.getElementById('calc_pounds')) {
            document.getElementById('calc_pounds').value = state.calculatedPounds.toFixed(4);
            document.getElementById('calc_density').value = state.calculatedDensity.toFixed(2);
            document.getElementById('calc_karat').value = state.calculatedKarat;
            document.getElementById('calc_total_payout').innerText = '₵ ' + state.totalPayout.toLocaleString(undefined, {minimumFractionDigits: 2});
        }
    } else {
        const pricePerBlade = parseFloat(document.getElementById('wiz_price_blade')?.value) || 0;
        
        state.pricePerBlade = pricePerBlade;
        state.calculatedBlades = grams / 0.8;
        state.totalPayout = state.calculatedBlades * pricePerBlade;
        
        if (document.getElementById('calc_blades')) {
            document.getElementById('calc_blades').value = state.calculatedBlades.toFixed(4);
            document.getElementById('calc_total_payout').innerText = '₵ ' + state.totalPayout.toLocaleString(undefined, {minimumFractionDigits: 2});
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
    
    const txnId = purchase.transaction_ref || '#TXN-'+purchase.id;
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
