// assets/js/modules/purchases.js

window.addEventListener('route-changed', async (e) => {
    if (e.detail.route !== 'purchases') return;
    
    const container = e.detail.container;
    
    // Initial Render
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
            `<tr><td colspan="6" style="text-align: center; color: #ff6b6b;">Error loading purchases.</td></tr>`;
    }
});

window.openNewPurchaseModal = async () => {
    document.getElementById('modal-title').textContent = 'New Walk-In Purchase';
    const modalBody = document.getElementById('modal-body');
    
    // Set a loading state while fetching customers
    modalBody.innerHTML = '<div style="text-align: center; padding: 20px;">Loading...</div>';
    document.getElementById('global-modal').classList.add('active');

    try {
        const customers = await window.api.get('/customers/list.php');
        
        modalBody.innerHTML = `
            <form id="create-purchase-form" onsubmit="window.submitNewPurchase(event)">
                
                <div class="form-group" style="margin-bottom: 20px;">
                    <label>Seller Type</label>
                    <div style="display: flex; gap: 15px;">
                        <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                            <input type="radio" name="seller_type" value="registered" checked onchange="window.toggleSellerInput()"> Registered Customer
                        </label>
                        <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                            <input type="radio" name="seller_type" value="walkin" onchange="window.toggleSellerInput()"> One-Time Walk-In
                        </label>
                    </div>
                </div>

                <div id="registered_customer_field" class="form-group">
                    <label>Select Customer</label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">person</span>
                        <select id="purchase_customer_id" required>
                            <option value="">-- Select a Customer --</option>
                            ${customers.map(c => `<option value="${c.id}">${c.name} (${c.type})</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div id="walkin_notes_field" class="form-group" style="display: none;">
                    <label>Walk-In Name / Notes</label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">edit_note</span>
                        <input type="text" id="purchase_notes" placeholder="e.g. John Doe (Walk-in)">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Gold Type</label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">diamond</span>
                        <select id="purchase_gold_type" required>
                            <option value="refined">Refined Gold</option>
                            <option value="balls">Gold Balls</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Weight (Grams)</label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">scale</span>
                        <input type="number" step="0.0001" id="purchase_weight" required placeholder="0.00">
                    </div>
                </div>

                <div class="form-group">
                    <label>Amount Paid (GHS)</label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">payments</span>
                        <input type="number" step="0.01" id="purchase_payout" required placeholder="0.00">
                    </div>
                </div>
                
                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 20px;">
                    <span class="material-symbols-outlined">check_circle</span> Complete Purchase
                </button>
            </form>
        `;
    } catch (error) {
        console.error("Failed to load customers:", error);
        modalBody.innerHTML = '<div style="color: red;">Failed to load system data. Please try again.</div>';
    }
};

window.toggleSellerInput = () => {
    const isRegistered = document.querySelector('input[name="seller_type"]:checked').value === 'registered';
    const regField = document.getElementById('registered_customer_field');
    const noteField = document.getElementById('walkin_notes_field');
    const regSelect = document.getElementById('purchase_customer_id');
    const noteInput = document.getElementById('purchase_notes');

    if (isRegistered) {
        regField.style.display = 'block';
        noteField.style.display = 'none';
        regSelect.required = true;
        noteInput.required = false;
        noteInput.value = '';
    } else {
        regField.style.display = 'none';
        noteField.style.display = 'block';
        regSelect.required = false;
        regSelect.value = '';
        noteInput.required = true;
    }
};

window.submitNewPurchase = async (event) => {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';

    const payload = {
        gold_type: document.getElementById('purchase_gold_type').value,
        weight_grams: document.getElementById('purchase_weight').value,
        total_paid_ghs: document.getElementById('purchase_payout').value,
        customer_id: document.getElementById('purchase_customer_id').value || null,
        notes: document.getElementById('purchase_notes').value || null
    };

    try {
        await window.api.post('/purchases/create.php', payload);
        window.showToast('Purchase completed successfully!', 'success');
        window.closeModal();
        window.dispatchEvent(new Event('hashchange')); // Refresh the view
    } catch (error) {
        console.error('Error in purchase:', error);
        window.showToast('Failed to complete purchase', 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
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
        <div style="text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 20px; margin-bottom: 20px;">
            <h2 style="margin: 0; color: var(--gold-primary); font-family: 'Outfit', sans-serif;">QWIK GOLD</h2>
            <p style="margin: 5px 0 0 0; color: var(--text-muted); font-size: 0.9rem;">Purchase Receipt</p>
        </div>
        
        <table style="width: 100%; margin-bottom: 20px; font-size: 0.95rem;">
            <tr>
                <td style="padding: 5px 0; color: var(--text-muted);">Txn Ref:</td>
                <td style="padding: 5px 0; text-align: right; font-weight: 600; font-family: monospace;">${txnId}</td>
            </tr>
            <tr>
                <td style="padding: 5px 0; color: var(--text-muted);">Date:</td>
                <td style="padding: 5px 0; text-align: right; font-weight: 600;">${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()}</td>
            </tr>
            <tr>
                <td style="padding: 5px 0; color: var(--text-muted);">Seller:</td>
                <td style="padding: 5px 0; text-align: right; font-weight: 600;">${purchase.seller_display}</td>
            </tr>
            <tr>
                <td style="padding: 5px 0; color: var(--text-muted);">Gold Type:</td>
                <td style="padding: 5px 0; text-align: right; font-weight: 600; text-transform: capitalize;">${purchase.gold_type}</td>
            </tr>
            <tr>
                <td style="padding: 5px 0; color: var(--text-muted);">Weight:</td>
                <td style="padding: 5px 0; text-align: right; font-weight: 600;">${parseFloat(purchase.weight_grams).toFixed(2)} g</td>
            </tr>
        </table>
        
        <div style="background: var(--bg-body); padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <span style="font-weight: 600;">Amount Paid:</span>
            <span style="font-size: 1.25rem; font-weight: 700; color: var(--danger);">₵${parseFloat(purchase.total_paid_ghs).toLocaleString()}</span>
        </div>
        
        <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">
            Thank you for doing business with Qwik Gold!
        </div>

        <button class="btn btn-primary btn-block no-print" onclick="window.print()">
            <span class="material-symbols-outlined">print</span> Print Receipt
        </button>
    `;
    
    document.getElementById('global-modal').classList.add('active');
};
