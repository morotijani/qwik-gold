// assets/js/modules/transactions.js

window.addEventListener('route-changed', (e) => {
    if (e.detail.route !== 'transactions') return;
    const container = e.detail.container;

    container.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto;">
            <h2 class="page-title">New Transaction</h2>
            
            <div class="metric-grid" style="grid-template-columns: repeat(2, 1fr);">
                <button class="glass-panel" style="padding: 24px; text-align: left; cursor: pointer; border: 1px solid var(--border); transition: var(--transition);" onclick="loadTxForm('purchase')">
                    <h3><span class="material-symbols-outlined" style="vertical-align: middle;">shopping_cart</span> Walk-In Purchase</h3>
                    <p style="margin-top: 8px; font-size: 0.9rem;">Buy gold over the counter.</p>
                </button>
                
                <button class="glass-panel" style="padding: 24px; text-align: left; cursor: pointer; border: 1px solid var(--border); transition: var(--transition);" onclick="loadTxForm('issue_loan')">
                    <h3><span class="material-symbols-outlined" style="vertical-align: middle; color: var(--info);">payments</span> Issue Loan</h3>
                    <p style="margin-top: 8px; font-size: 0.9rem;">Give cash to a customer.</p>
                </button>
                
                <button class="glass-panel" style="padding: 24px; text-align: left; cursor: pointer; border: 1px solid var(--border); transition: var(--transition);" onclick="loadTxForm('offset_loan')">
                    <h3><span class="material-symbols-outlined" style="vertical-align: middle; color: var(--success);">balance</span> Walk-in Offset</h3>
                    <p style="margin-top: 8px; font-size: 0.9rem;">Accept new gold to pay down a debt.</p>
                </button>
                
                <button class="glass-panel" style="padding: 24px; text-align: left; cursor: pointer; border: 1px solid var(--border); transition: var(--transition);" onclick="loadTxForm('offset_collateral')">
                    <h3><span class="material-symbols-outlined" style="vertical-align: middle;">key</span> Collateral Offset</h3>
                    <p style="margin-top: 8px; font-size: 0.9rem;">Use deposited gold to pay down a debt.</p>
                </button>
                
                <button class="glass-panel" style="padding: 24px; text-align: left; cursor: pointer; border: 1px solid var(--border); transition: var(--transition);" onclick="loadTxForm('market_sale')">
                    <h3><span class="material-symbols-outlined" style="vertical-align: middle; color: var(--danger);">account_balance</span> Market Execution</h3>
                    <p style="margin-top: 8px; font-size: 0.9rem;">Liquidate inventory at the main market.</p>
                </button>
            </div>

            <div id="tx-form-container" style="margin-top: 32px;"></div>
        </div>
    `;
});

window.loadTxForm = (type) => {
    const formContainer = document.getElementById('tx-form-container');
        
        if (type === 'purchase') {
            formContainer.innerHTML = `
                <div class="glass-panel" style="padding: 24px;">
                    <h3>Walk-In Purchase</h3>
                    <form id="form-purchase" style="margin-top: 16px;">
                        <div class="form-group">
                            <label>Gold Type</label>
                            <select id="p_gold_type" required>
                                <option value="balls">Balls</option>
                                <option value="refined">Refined</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Weight (Grams)</label>
                            <input type="number" step="0.01" id="p_weight" required>
                        </div>
                        <div class="form-group">
                            <label>Total Paid (GHS)</label>
                            <input type="number" step="0.01" id="p_paid" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">Execute Purchase</button>
                    </form>
                </div>
            `;

            document.getElementById('form-purchase').addEventListener('submit', async (ev) => {
                ev.preventDefault();
                const btn = ev.target.querySelector('button');
                btn.disabled = true;
                btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';
                
                try {
                    await window.api.post('/sales/create.php', {
                        customer_id: null, // anonymous
                        gold_type: document.getElementById('p_gold_type').value,
                        weight_grams: parseFloat(document.getElementById('p_weight').value),
                        total_paid_ghs: parseFloat(document.getElementById('p_paid').value)
                    });
                    window.showToast('Purchase executed and vault updated', 'success');
                    formContainer.innerHTML = '';
                } catch (e) {
                    window.showToast(e.message, 'error');
                    btn.disabled = false;
                    btn.innerHTML = 'Execute Purchase';
                }
            });
        }
        else if (type === 'market_sale') {
            formContainer.innerHTML = `
                <div class="glass-panel" style="padding: 24px;">
                    <h3>Market Execution</h3>
                    <form id="form-market" style="margin-top: 16px;">
                        <div class="form-group">
                            <label>Gold Type to Sell</label>
                            <select id="m_gold_type" required>
                                <option value="balls">Balls</option>
                                <option value="refined">Refined</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Weight (Grams)</label>
                            <input type="number" step="0.01" id="m_weight" required>
                        </div>
                        <div class="form-group">
                            <label>Actual Revenue Received (GHS)</label>
                            <input type="number" step="0.01" id="m_revenue" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" style="background: var(--danger); border-color: var(--danger);">Confirm Liquidation</button>
                    </form>
                </div>
            `;

            document.getElementById('form-market').addEventListener('submit', async (ev) => {
                ev.preventDefault();
                const btn = ev.target.querySelector('button');
                btn.disabled = true;
                btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';
                
                try {
                    await window.api.post('/sales/execute_market_sale.php', {
                        gold_type: document.getElementById('m_gold_type').value,
                        weight_grams: parseFloat(document.getElementById('m_weight').value),
                        actual_revenue_ghs: parseFloat(document.getElementById('m_revenue').value)
                    });
                    window.showToast('Market sale executed', 'success');
                    formContainer.innerHTML = '';
                } catch (e) {
                    window.showToast(e.message, 'error');
                    btn.disabled = false;
                    btn.innerHTML = 'Confirm Liquidation';
                }
            });
        }
        else if (type === 'issue_loan') {
            window.wizardState = {
                type: null,
                customerId: '',
                amount: '',
                goldType: 'balls',
                weight: ''
            };
            const wizardState = window.wizardState;

            const modalHtml = `
                <div id="issue-loan-modal" class="modal-overlay active">
                    <div class="modal-card" style="padding: 32px; max-width: 500px; position: relative;">
                        <span class="material-symbols-outlined modal-close" style="position: absolute; right: 24px; top: 24px; z-index: 10;" onclick="document.getElementById('issue-loan-modal').remove()">close</span>
                        <h3 style="margin-bottom: 20px; text-align: left; font-size: 1.1rem;">Issue Loan</h3>
                    
                    <!-- Progress Bar -->
                    <div style="display: flex; gap: 8px; margin-bottom: 24px;">
                        <div id="wiz-prog-1" style="height: 4px; width: 40px; background: var(--info); border-radius: 2px; transition: var(--transition);"></div>
                        <div id="wiz-prog-2" style="height: 4px; width: 40px; background: var(--border); border-radius: 2px; transition: var(--transition);"></div>
                        <div id="wiz-prog-3" style="height: 4px; width: 40px; background: var(--border); border-radius: 2px; transition: var(--transition);"></div>
                        <div id="wiz-prog-4" style="height: 4px; width: 40px; background: var(--border); border-radius: 2px; transition: var(--transition);"></div>
                    </div>

                    <!-- Step 1: Loan Type -->
                    <div id="wiz-step-1" class="wiz-step" style="animation: fadeIn 0.3s ease;">
                        <h4 style="margin-bottom: 12px; text-align: left; color: var(--text-muted); font-weight: 500; font-size: 0.9rem;">Select Loan Type</h4>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <button type="button" class="btn btn-outline" style="text-align: left; padding: 12px 16px; border-radius: 8px; display: flex; gap: 12px; align-items: center;" onclick="window.wizSelectType('standard')">
                                <div style="width: 36px; height: 36px; min-width: 36px; background: var(--info-bg); color: var(--info); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <span class="material-symbols-outlined" style="font-size: 1.2rem;">payments</span>
                                </div>
                                <div>
                                    <strong style="font-size: 0.95rem; display: block; margin-bottom: 2px;">Standard Loan</strong>
                                    <span style="opacity: 0.8; font-size: 0.8rem; font-weight: 400;">Give money, customer pays later. No collateral required.</span>
                                </div>
                            </button>
                            <button type="button" class="btn btn-outline" style="text-align: left; padding: 12px 16px; border-radius: 8px; display: flex; gap: 12px; align-items: center;" onclick="window.wizSelectType('collateral')">
                                <div style="width: 36px; height: 36px; min-width: 36px; background: rgba(245, 158, 11, 0.1); color: #d97706; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <span class="material-symbols-outlined" style="font-size: 1.2rem;">key</span>
                                </div>
                                <div>
                                    <strong style="font-size: 0.95rem; display: block; margin-bottom: 2px;">Collateral Loan</strong>
                                    <span style="opacity: 0.8; font-size: 0.8rem; font-weight: 400;">Give money, hold customer's gold in the vault.</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <!-- Step 2: Core Details -->
                    <div id="wiz-step-2" class="wiz-step" style="display: none; animation: fadeIn 0.3s ease;">
                        <h4 style="margin-bottom: 16px; text-align: center; color: var(--text-muted); font-weight: 400;">Customer & Amount</h4>
                        <div class="form-group">
                            <label>Customer ID</label>
                            <div class="input-with-icon">
                                <span class="material-symbols-outlined">person</span>
                                <input type="number" id="w_cust" required placeholder="Enter ID">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Principal Amount (GHS)</label>
                            <div class="input-with-icon">
                                <span class="material-symbols-outlined">payments</span>
                                <input type="number" step="0.01" id="w_amount" required placeholder="0.00">
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px; margin-top: 32px; justify-content: flex-end;">
                            <button type="button" class="btn btn-outline" onclick="window.wizGoToStep(1)">Back</button>
                            <button type="button" class="btn btn-primary" onclick="window.wizNextFromStep2()">Next Step</button>
                        </div>
                    </div>

                    <!-- Step 3: Collateral -->
                    <div id="wiz-step-3" class="wiz-step" style="display: none; animation: fadeIn 0.3s ease;">
                        <h4 style="margin-bottom: 16px; text-align: center; color: var(--text-muted); font-weight: 400;">Collateral Details</h4>
                        <div class="form-group">
                            <label>Gold Type Deposited</label>
                            <select id="w_gold">
                                <option value="balls">Gold Balls</option>
                                <option value="refined">Refined Gold</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Weight (Grams)</label>
                            <div class="input-with-icon">
                                <span class="material-symbols-outlined">scale</span>
                                <input type="number" step="0.01" id="w_weight" placeholder="0.00">
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px; margin-top: 32px; justify-content: flex-end;">
                            <button type="button" class="btn btn-outline" onclick="window.wizGoToStep(2)">Back</button>
                            <button type="button" class="btn btn-primary" onclick="window.wizNextFromStep3()">Review Setup</button>
                        </div>
                    </div>

                    <!-- Step 4: Summary -->
                    <div id="wiz-step-4" class="wiz-step" style="display: none; animation: fadeIn 0.3s ease;">
                        <h4 style="margin-bottom: 16px; text-align: center; color: var(--text-muted); font-weight: 400;">Summary & Confirm</h4>
                        <div id="wiz-summary-box" style="background: var(--bg-hover); padding: 24px; border-radius: 12px; margin-bottom: 32px; border: 1px solid var(--border);"></div>
                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                            <button type="button" id="wiz-btn-back-sum" class="btn btn-outline" onclick="window.wizBackFromSummary()">Back</button>
                            <button type="button" id="wiz-btn-confirm" class="btn btn-primary" onclick="window.wizSubmit()">Confirm & Issue</button>
                        </div>
                    </div>
                </div>
                <style>
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                </style>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            window.wizSelectType = (type) => {
                wizardState.type = type;
                window.wizGoToStep(2);
            };

            window.wizGoToStep = (step) => {
                document.querySelectorAll('.wiz-step').forEach(el => el.style.display = 'none');
                document.getElementById('wiz-step-' + step).style.display = 'block';
                
                // Update Progress Bar
                for(let i=1; i<=4; i++) {
                    const prog = document.getElementById('wiz-prog-' + i);
                    if (prog) {
                        prog.style.background = i <= step ? 'var(--info)' : 'var(--border)';
                    }
                }
            };

            window.wizBackFromSummary = () => {
                window.wizGoToStep(wizardState.type === 'collateral' ? 3 : 2);
            };

            window.wizNextFromStep2 = () => {
                const cust = document.getElementById('w_cust').value;
                const amt = document.getElementById('w_amount').value;
                if (!cust || !amt) {
                    window.showToast('Please fill all required fields', 'error');
                    return;
                }
                wizardState.customerId = cust;
                wizardState.amount = amt;
                
                if (wizardState.type === 'collateral') {
                    window.wizGoToStep(3);
                } else {
                    window.wizRenderSummary();
                    window.wizGoToStep(4);
                }
            };

            window.wizNextFromStep3 = () => {
                const wt = document.getElementById('w_weight').value;
                if (!wt) {
                    window.showToast('Please enter the gold weight', 'error');
                    return;
                }
                wizardState.goldType = document.getElementById('w_gold').value;
                wizardState.weight = wt;
                window.wizRenderSummary();
                window.wizGoToStep(4);
            };

            window.wizRenderSummary = () => {
                let html = `
                    <p style="margin-bottom:8px;"><strong>Customer ID:</strong> ${wizardState.customerId}</p>
                    <p style="margin-bottom:8px;"><strong>Principal Amount:</strong> GHS ${parseFloat(wizardState.amount).toFixed(2)}</p>
                    <p style="margin-bottom:8px;"><strong>Loan Type:</strong> ${wizardState.type === 'collateral' ? 'Collateral Loan' : 'Standard (Pay Later)'}</p>
                `;
                if (wizardState.type === 'collateral') {
                    html += `
                        <p style="margin-top:16px; padding-top:16px; border-top: 1px solid var(--border);"><strong>Collateral Deposited:</strong> ${wizardState.weight}g of ${wizardState.goldType} gold</p>
                    `;
                }
                document.getElementById('wiz-summary-box').innerHTML = html;
            };

            window.wizSubmit = async () => {
                const btn = document.getElementById('wiz-btn-confirm');
                btn.disabled = true;
                btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';
                
                const payload = {
                    customer_id: parseInt(wizardState.customerId),
                    principal_amount: parseFloat(wizardState.amount),
                    has_collateral: wizardState.type === 'collateral'
                };
                
                if (payload.has_collateral) {
                    payload.gold_type = wizardState.goldType;
                    payload.weight_grams = parseFloat(wizardState.weight);
                }
                
                try {
                    await window.api.post('/loans/issue.php', payload);
                    window.showToast('Loan successfully issued', 'success');
                    document.getElementById('issue-loan-modal').remove();
                } catch (e) {
                    window.showToast(e.message, 'error');
                    btn.disabled = false;
                    btn.innerHTML = 'Confirm & Execute';
                }
            };
        }
        else if (type === 'offset_loan') {
            formContainer.innerHTML = `
                <div class="glass-panel" style="padding: 24px;">
                    <h3>Offset Loan with Gold</h3>
                    <form id="form-offset" style="margin-top: 16px;">
                        <div class="form-group">
                            <label>Loan ID</label>
                            <input type="number" id="o_loan" required>
                        </div>
                        <div class="form-group">
                            <label>Gold Type</label>
                            <select id="o_gold" required>
                                <option value="balls">Balls</option>
                                <option value="refined">Refined</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Weight (Grams)</label>
                            <input type="number" step="0.01" id="o_weight" required>
                        </div>
                        <div class="form-group">
                            <label>Agreed Gold Value (GHS)</label>
                            <input type="number" step="0.01" id="o_value" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" style="background: var(--success);">Execute Offset</button>
                    </form>
                </div>
            `;

            document.getElementById('form-offset').addEventListener('submit', async (ev) => {
                ev.preventDefault();
                const btn = ev.target.querySelector('button');
                btn.disabled = true;
                btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';
                
                try {
                    await window.api.post('/loans/offset.php', {
                        loan_id: parseInt(document.getElementById('o_loan').value),
                        gold_type: document.getElementById('o_gold').value,
                        weight_grams: parseFloat(document.getElementById('o_weight').value),
                        gold_value_ghs: parseFloat(document.getElementById('o_value').value)
                    });
                    window.showToast('Loan offset successfully', 'success');
                    formContainer.innerHTML = '';
                } catch (e) {
                    window.showToast(e.message, 'error');
                    btn.disabled = false;
                    btn.innerHTML = 'Execute Offset';
                }
            });
        }
        else if (type === 'offset_collateral') {
            formContainer.innerHTML = `
                <div class="glass-panel" style="padding: 24px;">
                    <h3>Offset Loan with Collateral</h3>
                    <form id="form-offset-col" style="margin-top: 16px;">
                        <div class="form-group">
                            <label>Loan ID</label>
                            <input type="number" id="oc_loan" required>
                        </div>
                        <div class="form-group">
                            <label>Customer ID</label>
                            <input type="number" id="oc_cust" required>
                        </div>
                        <div class="form-group">
                            <label>Gold Type in Vault</label>
                            <select id="oc_gold" required>
                                <option value="balls">Balls</option>
                                <option value="refined">Refined</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Grams to Deduct from Collateral</label>
                            <input type="number" step="0.01" id="oc_weight" required>
                        </div>
                        <div class="form-group">
                            <label>Agreed Gold Value (GHS)</label>
                            <input type="number" step="0.01" id="oc_value" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" style="background: var(--gold-primary); color: #fff;">Process Collateral Offset</button>
                    </form>
                </div>
            `;

            document.getElementById('form-offset-col').addEventListener('submit', async (ev) => {
                ev.preventDefault();
                const btn = ev.target.querySelector('button');
                btn.disabled = true;
                btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';
                
                try {
                    await window.api.post('/loans/offset_collateral.php', {
                        loan_id: parseInt(document.getElementById('oc_loan').value),
                        customer_id: parseInt(document.getElementById('oc_cust').value),
                        gold_type: document.getElementById('oc_gold').value,
                        grams_to_use: parseFloat(document.getElementById('oc_weight').value),
                        agreed_value_ghs: parseFloat(document.getElementById('oc_value').value)
                    });
                    window.showToast('Loan offset with collateral successfully', 'success');
                    formContainer.innerHTML = '';
                } catch (e) {
                    window.showToast(e.message, 'error');
                    btn.disabled = false;
                    btn.innerHTML = 'Process Collateral Offset';
                }
            });
        }
};
