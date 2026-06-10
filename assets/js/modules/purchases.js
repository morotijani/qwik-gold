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
            <div style="background: linear-gradient(145deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 100%); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 20px; padding: 40px; position: relative; overflow: hidden; margin-bottom: 32px; box-shadow: 0 10px 30px rgba(245, 158, 11, 0.1);">
                <div style="position: absolute; top: -50px; right: -50px; width: 250px; height: 250px; background: rgba(245, 158, 11, 0.1); border-radius: 50%; filter: blur(40px);"></div>
                <div style="position: absolute; bottom: -30px; left: -30px; width: 150px; height: 150px; background: rgba(245, 158, 11, 0.1); border-radius: 50%; filter: blur(30px);"></div>
                <div style="position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="color: #d97706; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; font-size: 0.95rem; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                            <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3); margin-right: 4px;">
                                <span class="material-symbols-outlined" style="font-size: 18px;">diamond</span>
                            </div>
                            Acquisitions
                        </div>
                        <h2 style="margin: 0 0 12px 0; font-size: 2.2rem; font-weight: 800; color: var(--text-main);">Walk-In Purchases</h2>
                        <p style="margin: 0; color: var(--text-muted); font-size: 1.05rem; max-width: 500px; line-height: 1.5;">Process and track all incoming gold purchases from registered customers and walk-in sellers.</p>
                    </div>
                    <button class="btn btn-primary" onclick="window.openNewPurchaseModal()" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; font-weight: 700; padding: 14px 28px; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3); display: flex; align-items: center; gap: 8px; font-size: 1.05rem; border-radius: 12px; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <span class="material-symbols-outlined">add_shopping_cart</span> New Purchase
                    </button>
                </div>
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
                            </tr>
                        </thead>
                        <tbody id="purchases-tbody">
                            <tr><td colspan="7" style="padding: 48px; text-align: center; color: var(--text-muted); font-size: 1.05rem;">
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
        const goldTypeBadge = p.gold_type === 'refined'
            ? `<span style="padding: 4px 10px; background: rgba(59, 130, 246, 0.1); color: #2563eb; border-radius: 20px; font-size: 0.8rem; font-weight: 700; border: 1px solid rgba(59, 130, 246, 0.2);"><span class="material-symbols-outlined" style="font-size: 12px; vertical-align: middle; margin-right: 4px;">diamond</span>Refined</span>`
            : `<span style="padding: 4px 10px; background: rgba(245, 158, 11, 0.1); color: #d97706; border-radius: 20px; font-size: 0.8rem; font-weight: 700; border: 1px solid rgba(245, 158, 11, 0.2);"><span class="material-symbols-outlined" style="font-size: 12px; vertical-align: middle; margin-right: 4px;">scatter_plot</span>Balls</span>`;

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
    document.getElementById('modal-title').textContent = 'Walk-In Purchase';
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
            <div style="background: linear-gradient(145deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.02) 100%); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 16px; padding: 20px; margin-bottom: 24px; display: flex; gap: 16px; align-items: center;">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, var(--info), #2563eb); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                    <span class="material-symbols-outlined" style="font-size: 1.6rem;">person_search</span>
                </div>
                <div>
                    <div style="font-size: 0.95rem; font-weight: 800; color: var(--info); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Step 1: Seller Details</div>
                    <div style="font-size: 0.85rem; color: var(--text-main); line-height: 1.4;">Select whether this is a registered customer or a one-time walk-in seller.</div>
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
                        <input type="text" id="wiz_walkin_name" placeholder="e.g. John Doe" value="${state.walkinName}" oninput="window.updateWizardState('walkinName', this.value)">
                    </div>
                </div>
            `}
            
            <button class="btn btn-primary btn-block" style="padding: 14px; font-size: 1.05rem; border-radius: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 32px;" onclick="window.wizardNext(2)">Proceed to Step 2 <span class="material-symbols-outlined">arrow_forward</span></button>
        `;
    }
    else if (state.step === 2) {
        body.innerHTML = `
            <div style="background: linear-gradient(145deg, rgba(234, 179, 8, 0.1) 0%, rgba(234, 179, 8, 0.02) 100%); border: 1px solid rgba(234, 179, 8, 0.2); border-radius: 16px; padding: 20px; margin-bottom: 24px; display: flex; gap: 16px; align-items: center;">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, var(--gold-primary), var(--gold-secondary)); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(234, 179, 8, 0.3);">
                    <span class="material-symbols-outlined" style="font-size: 1.6rem;">calculate</span>
                </div>
                <div>
                    <div style="font-size: 0.95rem; font-weight: 800; color: var(--gold-secondary); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Step 2: Gold Calculation</div>
                    <div style="font-size: 0.85rem; color: var(--text-main); line-height: 1.4;">Enter the gold type, weight, volume, and current market price.</div>
                </div>
            </div>
            <div class="form-group" style="margin-bottom: 24px;">
                <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 12px; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.5px;">Gold Type</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <label style="cursor: pointer; position: relative;">
                        <input type="radio" name="wiz_gold_type" value="refined" ${state.goldType === 'refined' ? 'checked' : ''} onchange="window.updateWizardState('goldType', 'refined')" style="position: absolute; opacity: 0; pointer-events: none;">
                        <div style="padding: 20px; border-radius: 16px; border: 2px solid ${state.goldType === 'refined' ? 'var(--gold-primary)' : 'var(--border)'}; background: ${state.goldType === 'refined' ? 'rgba(234, 179, 8, 0.05)' : 'var(--bg-main)'}; text-align: center; transition: all 0.2s; box-shadow: ${state.goldType === 'refined' ? '0 4px 12px rgba(234,179,8,0.15)' : 'none'};">
                            <span class="material-symbols-outlined" style="font-size: 2rem; color: ${state.goldType === 'refined' ? 'var(--gold-primary)' : 'var(--text-muted)'}; margin-bottom: 8px;">diamond</span>
                            <div style="font-weight: 700; color: ${state.goldType === 'refined' ? 'var(--gold-primary)' : 'var(--text-main)'}; font-size: 1.05rem;">Refined Gold</div>
                        </div>
                    </label>
                    <label style="cursor: pointer; position: relative;">
                        <input type="radio" name="wiz_gold_type" value="balls" ${state.goldType === 'balls' ? 'checked' : ''} onchange="window.updateWizardState('goldType', 'balls')" style="position: absolute; opacity: 0; pointer-events: none;">
                        <div style="padding: 20px; border-radius: 16px; border: 2px solid ${state.goldType === 'balls' ? 'var(--gold-primary)' : 'var(--border)'}; background: ${state.goldType === 'balls' ? 'rgba(234, 179, 8, 0.05)' : 'var(--bg-main)'}; text-align: center; transition: all 0.2s; box-shadow: ${state.goldType === 'balls' ? '0 4px 12px rgba(234,179,8,0.15)' : 'none'};">
                            <span class="material-symbols-outlined" style="font-size: 2rem; color: ${state.goldType === 'balls' ? 'var(--gold-primary)' : 'var(--text-muted)'}; margin-bottom: 8px;">scatter_plot</span>
                            <div style="font-weight: 700; color: ${state.goldType === 'balls' ? 'var(--gold-primary)' : 'var(--text-main)'}; font-size: 1.05rem;">Gold Balls</div>
                        </div>
                    </label>
                </div>
            </div>

            <!-- Grams Input -->
            <div class="form-group" style="margin-bottom: 24px;">
                <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px; font-size: 0.95rem;">Weight <span style="color: var(--danger);">*</span></label>
                <div style="position: relative;">
                    <span class="material-symbols-outlined" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #eab308; pointer-events: none;">scale</span>
                    <input type="number" step="0.0001" id="wiz_weight" placeholder="0.00" value="${state.grams || ''}" oninput="if(this.value < 0) this.value = Math.abs(this.value); window.calculatePurchaseMath()" min="0"
                           style="width: 100%; padding: 16px 60px 16px 48px; border: 2px solid var(--border); border-radius: 12px; background: var(--bg-main); font-size: 1.1rem; font-weight: 700; transition: all 0.2s;"
                           onfocus="this.style.borderColor='#eab308'; this.style.background='white';" onblur="this.style.borderColor='var(--border)'; this.style.background='var(--bg-main)';">
                    <span style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-weight: 800; font-size: 0.85rem; pointer-events: none;">GRM</span>
                </div>
            </div>
            
            ${state.goldType === 'refined' ? `
                <!-- Volume Input -->
                <div class="form-group" style="margin-bottom: 24px;">
                    <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px; font-size: 0.95rem;">Volume <span style="color: var(--danger);">*</span></label>
                    <div style="position: relative;">
                        <span class="material-symbols-outlined" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #3b82f6; pointer-events: none;">water_drop</span>
                        <input type="number" step="0.0001" id="wiz_volume" placeholder="0.00" value="${state.volume || ''}" oninput="if(this.value < 0) this.value = Math.abs(this.value); window.calculatePurchaseMath()" min="0"
                               style="width: 100%; padding: 16px 60px 16px 48px; border: 2px solid var(--border); border-radius: 12px; background: var(--bg-main); font-size: 1.1rem; font-weight: 700; transition: all 0.2s;"
                               onfocus="this.style.borderColor='#3b82f6'; this.style.background='white';" onblur="this.style.borderColor='var(--border)'; this.style.background='var(--bg-main)';">
                        <span style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-weight: 800; font-size: 0.85rem; pointer-events: none;">VLM</span>
                    </div>
                </div>
            ` : ''}

            <!-- Current Price Info -->
            ${state.goldType === 'refined' ? `
                <div class="form-group" style="margin-bottom: 24px;">
                    <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px; font-size: 0.95rem;">Local Price <span style="color: var(--danger);">*</span></label>
                    <div style="position: relative;">
                        <span class="material-symbols-outlined" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--gold-primary); pointer-events: none;">payments</span>
                        <input type="number" step="0.01" id="wiz_price_pound" placeholder="0.00" value="${state.pricePerPound || ''}" oninput="if(this.value < 0) this.value = Math.abs(this.value); window.calculatePurchaseMath()" min="0"
                               style="width: 100%; padding: 16px 60px 16px 48px; border: 2px solid var(--border); border-radius: 12px; background: var(--bg-main); font-size: 1.1rem; font-weight: 700; transition: all 0.2s;"
                               onfocus="this.style.borderColor='var(--gold-primary)'; this.style.background='white';" onblur="this.style.borderColor='var(--border)'; this.style.background='var(--bg-main)';">
                        <span style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-weight: 800; font-size: 0.85rem; pointer-events: none;">GHS</span>
                    </div>
                </div>
            ` : `
                <div class="form-group" style="margin-bottom: 24px;">
                    <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px; font-size: 0.95rem;">Price per Blade <span style="color: var(--danger);">*</span></label>
                    <div style="position: relative;">
                        <span class="material-symbols-outlined" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--gold-primary); pointer-events: none;">payments</span>
                        <input type="number" step="0.01" id="wiz_price_blade" placeholder="0.00" value="${state.pricePerBlade || ''}" oninput="if(this.value < 0) this.value = Math.abs(this.value); window.calculatePurchaseMath()" min="0"
                               style="width: 100%; padding: 16px 60px 16px 48px; border: 2px solid var(--border); border-radius: 12px; background: var(--bg-main); font-size: 1.1rem; font-weight: 700; transition: all 0.2s;"
                               onfocus="this.style.borderColor='var(--gold-primary)'; this.style.background='white';" onblur="this.style.borderColor='var(--border)'; this.style.background='var(--bg-main)';">
                        <span style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-weight: 800; font-size: 0.85rem; pointer-events: none;">GHS</span>
                    </div>
                </div>
            `}


            <!-- Total Amount & Metrics -->
            <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 20px; padding: 24px; text-align: center; margin-bottom: 24px; box-shadow: inset 0 2px 6px rgba(0,0,0,0.02);">
                <div style="color: #64748b; font-weight: 800; font-size: 0.85rem; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px;">Total Payout Amount</div>
                <div style="font-size: 3.2rem; font-weight: 800; color: var(--danger); letter-spacing: -1px; line-height: 1;">
                    <span style="color: #94a3b8; font-size: 2rem; vertical-align: middle;">₵</span><span id="calc_total_payout">${state.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                
                ${state.goldType === 'refined' ? `
                    <div style="display: flex; justify-content: center; gap: 24px; margin-top: 16px; padding-top: 16px; border-top: 1px dashed #cbd5e1;">
                        <div style="text-align: center;">
                            <div id="calc_pounds" style="font-weight: 800; color: #334155; font-size: 1.2rem;">${(Number(state.calculatedPounds) || 0).toFixed(2)}</div>
                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Pounds</div>
                        </div>
                        <div style="text-align: center;">
                            <div id="calc_density" style="font-weight: 800; color: #334155; font-size: 1.2rem;">${(Number(state.calculatedDensity) || 0).toFixed(2)}</div>
                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Density</div>
                        </div>
                        <div style="text-align: center;">
                            <div id="calc_karat" style="font-weight: 800; color: #334155; font-size: 1.2rem;">${(Number(state.calculatedKarat) || 0).toFixed(2)}</div>
                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Karat</div>
                        </div>
                    </div>
                ` : `
                    <div style="display: flex; justify-content: center; margin-top: 16px; padding-top: 16px; border-top: 1px dashed #cbd5e1;">
                        <div style="text-align: center;">
                            <div id="calc_blades" style="font-weight: 800; color: #334155; font-size: 1.2rem;">${(Number(state.calculatedBlades) || 0).toFixed(4)}</div>
                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Total Blades</div>
                        </div>
                    </div>
                `}
            </div>
            
            <div class="form-group">
                <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px; font-size: 0.95rem;">Reference / Comments</label>
                <input type="text" class="form-control" value="${state.notes || ''}" oninput="window.updateWizardState('notes', this.value)" placeholder="Optional notes...">
            </div>

            <div style="display: flex; gap: 10px;">
                <button class="btn btn-outline" style="flex: 1;" onclick="window.wizardNext(1)">Back</button>
                <button class="btn btn-primary" style="flex: 2;" onclick="window.wizardNext(3)">Review Order <span class="material-symbols-outlined">arrow_forward</span></button>
            </div>
        `;
    }
    else if (state.step === 3) {
        body.innerHTML = `
            <div style="background: linear-gradient(145deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.02) 100%); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 16px; padding: 20px; margin-bottom: 24px; display: flex; gap: 16px; align-items: center;">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, var(--success), #059669); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                    <span class="material-symbols-outlined" style="font-size: 1.6rem;">check_circle</span>
                </div>
                <div>
                    <div style="font-size: 0.95rem; font-weight: 800; color: var(--success); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Step 3: Summary & Confirm</div>
                    <div style="font-size: 0.85rem; color: var(--text-main); line-height: 1.4;">Review the final details and complete the walk-in purchase.</div>
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
                        <div style="font-weight: 600; color: var(--text-color); font-size: 0.95rem;">Pounds, Density & Karat</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">Pounds: ${(Number(state.calculatedPounds) || 0).toFixed(2)} &nbsp; &bull; &nbsp; Density: ${(Number(state.calculatedDensity) || 0).toFixed(2)} &nbsp; &bull; &nbsp; Karat: ${(Number(state.calculatedKarat) || 0).toFixed(2)}</div>
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
                <div style="padding: 24px; background: linear-gradient(135deg, #f8fafc, #f1f5f9);">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <div style="font-weight: 800; color: #475569; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Total Amount to Pay</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">Will be deducted from vault</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 800; color: var(--danger); font-size: 2rem; letter-spacing: -0.5px;">
                                <span style="font-size: 1.2rem; vertical-align: middle; color: #94a3b8;">₵</span>${state.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Handled By:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${state.handlerName}</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Gold Type:</td><td style="padding: 3px 0; text-align: right; font-weight: 600; text-transform: capitalize;">${state.goldType}</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Weight:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${parseFloat(state.grams).toFixed(4)} g</td></tr>
                    ${state.goldType === 'refined' ? `
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Volume:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${(parseFloat(state.volume) || 0).toFixed(4)} v</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Local Price:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">₵ ${parseFloat(state.pricePerPound).toLocaleString(undefined, { minimumFractionDigits: 2 })} / Pound</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Pounds:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${(Number(state.calculatedPounds) || 0).toFixed(2)}</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Density:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${(Number(state.calculatedDensity) || 0).toFixed(2)}</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Karat:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${(Number(state.calculatedKarat) || 0).toFixed(2)}</td></tr>
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
                    ${purchase.handled_by ? `<tr><td style="padding: 3px 0; color: var(--text-muted);">Handled By:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${purchase.handled_by}</td></tr>` : ''}
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Gold Type:</td><td style="padding: 3px 0; text-align: right; font-weight: 600; text-transform: capitalize;">${purchase.gold_type}</td></tr>
                    <tr><td style="padding: 3px 0; color: var(--text-muted);">Weight:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${parseFloat(purchase.weight_grams).toFixed(4)} g</td></tr>
                    ${purchase.gold_type === 'refined' ? `
                    ${purchase.local_price ? `<tr><td style="padding: 3px 0; color: var(--text-muted);">Local Price:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">₵ ${parseFloat(purchase.local_price).toLocaleString(undefined, { minimumFractionDigits: 2 })} / Pound</td></tr>` : ''}
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
