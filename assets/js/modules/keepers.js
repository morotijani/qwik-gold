window.addEventListener('route-changed', async (e) => {
    if (e.detail.route === 'keepers') {
        renderKeepers(e.detail.container);
    }
});

async function renderKeepers(container) {
    try {
        const keepersData = await window.api.get('/customers/list.php');
        // Filter only keepers
        const keepers = keepersData.filter(c => c.type === 'keeper');
            
            let html = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2>Keepers Vault</h2>
                    <button class="btn btn-primary" onclick="window.openCreateKeeperModal()">
                        <span class="material-symbols-outlined">person_add</span> Register Keeper
                    </button>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Keeper Name</th>
                                <th>Contact Info</th>
                                <th style="text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            if (keepers.length > 0) {
                keepers.forEach((k, index) => {
                    html += `
                        <tr>
                            <td>${index + 1}</td>
                            <td style="font-weight: 500;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div class="user-avatar-small"><span class="material-symbols-outlined">person</span></div>
                                    ${k.name}
                                </div>
                            </td>
                            <td>${k.contact_info || '-'}</td>
                            <td style="text-align: right;">
                                <button class="btn btn-primary" onclick="window.viewKeeper(${k.id})">
                                    Manage Vault
                                </button>
                            </td>
                        </tr>
                    `;
                });
            } else {
                html += `<tr><td colspan="4" style="text-align: center;">No keepers found.</td></tr>`;
            }

            html += `
                        </tbody>
                    </table>
                </div>
            `;
            container.innerHTML = html;
    } catch (error) {
        console.error('Error fetching keepers:', error);
        window.showToast('Network error', 'error');
        container.innerHTML = '<div class="glass-panel"><p>Network error.</p></div>';
    }
}

// Full page keeper profile view
window.viewKeeper = async (keeperId) => {
    const container = document.getElementById('view-container');
    container.innerHTML = '<div style="text-align:center; padding: 50px;"><span class="material-symbols-outlined spin gold-text" style="font-size: 2rem;">sync</span></div>';

    try {
        // Fetch basic customer details
        const data = await window.api.get(`/customers/view.php?customer_id=${keeperId}`);
        // Fetch their keeper balance explicitly
        const balanceDataRaw = await window.api.get(`/keepers/balance.php?customer_id=${keeperId}`);
        const balanceData = balanceDataRaw.vault_totals;

        // Fetch keeper transaction history
        const historyData = await window.api.get(`/keepers/history.php?customer_id=${keeperId}`);

        const profile = data.profile;
        const initial = profile.name.charAt(0).toUpperCase();

            // Balls and Refined amounts
            const ballsGrams = parseFloat(balanceData.balls_grams || 0).toFixed(2);
            const refinedGrams = parseFloat(balanceData.refined_grams || 0).toFixed(2);
            
            // Build the full-page UI
            let html = `
                <div class="profile-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <div class="profile-avatar-large" style="width: 80px; height: 80px; border-radius: 50%; background: var(--gold-gradient); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: #000; font-weight: 700;">
                            ${initial}
                        </div>
                        <div>
                            <h2 style="font-size: 2rem; margin-bottom: 4px;">${profile.name}</h2>
                            <span class="status-badge status-active" style="padding: 6px 12px; font-size: 0.9rem;">Keeper</span>
                        </div>
                    </div>
                    <button class="btn btn-secondary" onclick="window.location.hash='#keepers'; window.dispatchEvent(new Event('hashchange'));">
                        <span class="material-symbols-outlined">arrow_back</span> Return
                    </button>
                </div>

                <div class="profile-grid" style="display: grid; grid-template-columns: 1fr 2fr; gap: 30px; align-items: start;">
                    <!-- Left Column: Info & Actions -->
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <div class="glass-panel" style="padding: 24px;">
                            <h3 style="font-size: 1.1rem; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 16px;">Contact Information</h3>
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: var(--text-muted);">Phone/Email</span>
                                    <span style="font-weight: 500;">${profile.contact_info || 'N/A'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: var(--text-muted);">Customer ID</span>
                                    <span style="font-weight: 500;">#${profile.id}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: var(--text-muted);">Joined</span>
                                    <span style="font-weight: 500;">${new Date(profile.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div class="glass-panel" style="padding: 24px; text-align: center;">
                            <h3 style="font-size: 1.1rem; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 12px;">Vault Actions</h3>
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                <button class="btn btn-primary" onclick="window.openKeeperDepositModal(${profile.id}, '${profile.name}')" style="width: 100%; justify-content: center; padding: 12px;">
                                    <span class="material-symbols-outlined">download</span> Deposit Gold
                                </button>
                                <button class="btn" style="background: rgba(255,107,107,0.1); color: #ff6b6b; border: 1px solid rgba(255,107,107,0.2); width: 100%; justify-content: center; padding: 12px;" onclick="window.openKeeperLiquidateModal(${profile.id}, '${profile.name}')">
                                    <span class="material-symbols-outlined">sell</span> Liquidate (Sell)
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Balance Overview -->
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <div class="glass-panel" style="padding: 24px;">
                            <h3 style="font-size: 1.1rem; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 24px;">Keeper Vault Balance</h3>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                <!-- Gold Balls -->
                                <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 12px; padding: 24px; text-align: center;">
                                    <div style="width: 48px; height: 48px; background: rgba(255,215,0,0.1); color: var(--gold-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                                        <span class="material-symbols-outlined" style="font-size: 28px;">trip_origin</span>
                                    </div>
                                    <h4 style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Gold Balls</h4>
                                    <div style="font-size: 2.5rem; font-weight: 700; color: #fff;">
                                        ${ballsGrams} <span style="font-size: 1rem; color: var(--gold-primary);">g</span>
                                    </div>
                                </div>

                                <!-- Refined Gold -->
                                <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 12px; padding: 24px; text-align: center;">
                                    <div style="width: 48px; height: 48px; background: rgba(255,215,0,0.1); color: var(--gold-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                                        <span class="material-symbols-outlined" style="font-size: 28px;">diamond</span>
                                    </div>
                                    <h4 style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Refined Gold</h4>
                                    <div style="font-size: 2.5rem; font-weight: 700; color: #fff;">
                                        ${refinedGrams} <span style="font-size: 1rem; color: var(--gold-primary);">g</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="glass-panel" style="padding: 24px; grid-column: 1 / -1; margin-top: 10px;">
                            <h3 style="font-size: 1.1rem; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 16px;">Vault Activity History</h3>
                            <div class="table-container" style="max-height: 400px; overflow-y: auto;">
                                <table class="data-table" style="width: 100%;">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Action</th>
                                            <th>Type</th>
                                            <th>Weight</th>
                                            <th>Payout</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${historyData.length > 0 ? historyData.map(h => {
                                            const isDeposit = h.action === 'deposit';
                                            const badgeClass = isDeposit ? 'badge-outline' : 'badge-gold';
                                            const actionLabel = isDeposit ? 'Deposit' : 'Liquidated (Sold)';
                                            
                                            // Format numbers gracefully
                                            const w = parseFloat(h.grams || 0).toFixed(2) + 'g';
                                            const p = h.payout_ghs ? '₵' + parseFloat(h.payout_ghs).toLocaleString() : '-';
                                            
                                            return `
                                                <tr>
                                                    <td>${new Date(h.created_at).toLocaleString()}</td>
                                                    <td><span class="badge ${badgeClass}">${actionLabel}</span></td>
                                                    <td style="text-transform: capitalize;">${h.gold_type}</td>
                                                    <td style="font-weight: 600; color: ${isDeposit ? '#4cd137' : '#ff6b6b'};">${isDeposit ? '+' : '-'}${w}</td>
                                                    <td>${p}</td>
                                                </tr>
                                            `;
                                        }).join('') : '<tr><td colspan="5" style="text-align: center;">No activity recorded yet.</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML = html;
    } catch (error) {
        console.error('Error fetching keeper details:', error);
        window.showToast('Network error loading keeper', 'error');
    }
};

window.openKeeperDepositModal = (customerId, customerName) => {
    document.getElementById('modal-title').textContent = 'Deposit Gold - ' + customerName;
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <form id="keeper-deposit-form" onsubmit="window.submitKeeperDeposit(event, ${customerId})">
            <div class="form-group">
                <label>Gold Type</label>
                <div class="input-with-icon">
                    <span class="material-symbols-outlined">category</span>
                    <select id="deposit_gold_type" required>
                        <option value="balls">Gold Balls</option>
                        <option value="refined">Refined Gold</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label>Weight (Grams)</label>
                <div class="input-with-icon">
                    <span class="material-symbols-outlined">scale</span>
                    <input type="number" id="deposit_weight_grams" step="0.01" min="0.01" required placeholder="0.00">
                </div>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block" style="margin-top: 20px;">
                <span class="material-symbols-outlined">check_circle</span> Process Deposit
            </button>
        </form>
    `;
    
    document.getElementById('global-modal').classList.add('active');
};

window.submitKeeperDeposit = async (event, customerId) => {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';

    const payload = {
        customer_id: customerId,
        gold_type: document.getElementById('deposit_gold_type').value,
        weight_grams: parseFloat(document.getElementById('deposit_weight_grams').value)
    };

    try {
        await window.api.post('/keepers/deposit.php', payload);
        window.showToast('Gold deposited successfully', 'success');
        window.closeModal();
        window.viewKeeper(customerId); // Refresh the profile
    } catch (error) {
        console.error('Error in deposit:', error);
        window.showToast('Network error', 'error');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Process Deposit';
    }
};

window.openKeeperLiquidateModal = (customerId, customerName) => {
    document.getElementById('modal-title').textContent = 'Liquidate Gold - ' + customerName;
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <form id="keeper-liquidate-form" onsubmit="window.submitKeeperLiquidate(event, ${customerId})">
            <div class="form-group">
                <label>Gold Type to Liquidate</label>
                <div class="input-with-icon">
                    <span class="material-symbols-outlined">category</span>
                    <select id="liq_gold_type" required>
                        <option value="balls">Gold Balls</option>
                        <option value="refined">Refined Gold</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label>Grams to Sell</label>
                <div class="input-with-icon">
                    <span class="material-symbols-outlined">scale</span>
                    <input type="number" id="liq_grams_sold" step="0.01" min="0.01" required placeholder="0.00">
                </div>
                <small style="color: var(--text-muted); display: block; margin-top: 4px;">Must not exceed keeper's current balance.</small>
            </div>

            <div class="form-group">
                <label>Total Payout (GHS)</label>
                <div class="input-with-icon">
                    <span class="material-symbols-outlined">payments</span>
                    <input type="number" id="liq_payout_ghs" step="0.01" min="0.01" required placeholder="0.00">
                </div>
            </div>
            
            <button type="submit" class="btn" style="background: #ff6b6b; color: #111; margin-top: 20px; width: 100%;">
                <span class="material-symbols-outlined">point_of_sale</span> Confirm Liquidation
            </button>
        </form>
    `;
    
    document.getElementById('global-modal').classList.add('active');
};

window.submitKeeperLiquidate = async (event, customerId) => {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';

    const payload = {
        customer_id: customerId,
        gold_type: document.getElementById('liq_gold_type').value,
        total_grams_sold: parseFloat(document.getElementById('liq_grams_sold').value),
        total_payout_ghs: parseFloat(document.getElementById('liq_payout_ghs').value)
    };

    try {
        await window.api.post('/keepers/liquidate.php', payload);
        window.showToast('Keeper gold successfully liquidated', 'success');
        window.closeModal();
        window.viewKeeper(customerId); // Refresh the profile
    } catch (error) {
        console.error('Error in liquidation:', error);
        window.showToast('Network error', 'error');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined">point_of_sale</span> Confirm Liquidation';
    }
};

window.openCreateKeeperModal = () => {
    document.getElementById('modal-title').textContent = 'Register New Keeper';
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <form id="create-keeper-form" onsubmit="window.submitCreateKeeper(event)">
            <div class="form-group">
                <label>Keeper Full Name</label>
                <div class="input-with-icon">
                    <span class="material-symbols-outlined">person</span>
                    <input type="text" id="new_keeper_name" required placeholder="e.g. Kwame Mensah">
                </div>
            </div>
            
            <div class="form-group">
                <label>Contact Information</label>
                <div class="input-with-icon">
                    <span class="material-symbols-outlined">call</span>
                    <input type="text" id="new_keeper_contact" placeholder="Phone or Email">
                </div>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block" style="margin-top: 20px;">
                <span class="material-symbols-outlined">how_to_reg</span> Register Keeper
            </button>
        </form>
    `;
    
    document.getElementById('global-modal').classList.add('active');
};

window.submitCreateKeeper = async (event) => {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';

    const payload = {
        name: document.getElementById('new_keeper_name').value,
        type: 'keeper',
        contact_info: document.getElementById('new_keeper_contact').value
    };

    try {
        await window.api.post('/customers/create.php', payload);
        window.showToast('Keeper registered successfully', 'success');
        window.closeModal();
        // Refresh the list view
        window.dispatchEvent(new Event('hashchange'));
    } catch (error) {
        console.error('Error creating keeper:', error);
        window.showToast('Failed to create keeper', 'error');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined">how_to_reg</span> Register Keeper';
    }
};
