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
                    <h2 style="margin: 0; font-size: initial; font-weight: 600; color: var(--text-main);">Keepers Vault</h2>
                    <button class="btn btn-text" onclick="window.openCreateKeeperModal()" style="display: flex; align-items: center; gap: 6px; font-weight: 500; font-size: 0.95rem; color: var(--text-main); border: none; cursor: pointer; padding: 6px 12px; transition: background 0.2s; border-radius: 6px;">
                        <span class="material-symbols-outlined" style="font-size: 20px; font-weight: 300;">person_add</span> Register Keeper
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
                            <td>${k.phone || '-'}</td>
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

        // Build the full-page UI in Edge Settings style
        let html = `
            <div style="max-width: 900px; margin: 0 auto; padding-bottom: 40px; animation: slideIn 0.3s ease;">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 style="font-size: initial; font-weight: 600; margin: 0;">Keeper Profile</h2>
                    <button class="btn btn-secondary" onclick="window.location.hash='#keepers'; window.dispatchEvent(new Event('hashchange'));" style="background: transparent; border: none; padding: 8px 16px; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <span class="material-symbols-outlined" style="font-size: 20px;">arrow_back</span> Return
                    </button>
                </div>

                <!-- Main Profile Card -->
                <div style="border: 1px solid var(--border, #333); border-radius: 16px; overflow: hidden; margin-bottom: 24px;">
                    <!-- Top Section -->
                    <div style="padding: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
                        <!-- Left: Avatar & Info -->
                        <div style="display: flex; align-items: center; gap: 20px;">
                            <div style="width: 72px; height: 72px; border-radius: 50%; background: var(--gold-gradient, linear-gradient(135deg, #FFD700, #FDB931)); display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #000; font-weight: 700;">
                                ${initial}
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <h3 style="font-size: 1.25rem; font-weight: 600; margin: 0;">${profile.name}</h3>
                                    ${profile.business_name ? `<span style="background: rgba(255,215,0,0.1); color: var(--gold-primary, #FFD700); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; border: 1px solid rgba(255,215,0,0.2);">${profile.business_name}</span>` : ''}
                                </div>
                                <span style="color: var(--text-muted, #aaa); font-size: 0.9rem;">
                                    ${profile.phone || 'No phone'} 
                                    ${profile.email ? ` &nbsp;|&nbsp; ${profile.email}` : ''}
                                </span>
                                <div style="display: flex; align-items: center; gap: 12px; margin-top: 4px; font-size: 0.85rem; font-weight: 500;">
                                    <span style="color: #4cd137; display: flex; align-items: center; gap: 4px;">
                                        <span class="material-symbols-outlined" style="font-size: 16px;">check_circle</span> Active Keeper
                                    </span>
                                    <span style="color: var(--text-muted, #aaa); border-left: 1px solid var(--border, #333); padding-left: 12px; text-transform: capitalize; display: flex; align-items: center; gap: 4px;">
                                        <span class="material-symbols-outlined" style="font-size: 16px;">${profile.entity_type === 'group' ? 'groups' : 'person'}</span> ${profile.entity_type || 'Individual'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Action Buttons -->
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <button class="btn btn-primary" onclick="window.openKeeperDepositModal(${profile.id}, '${profile.name}')" style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 10px 18px; border-radius: 8px; font-weight: 500;">
                                <span class="material-symbols-outlined" style="font-size: 18px;">download</span> Deposit
                            </button>
                            <button class="btn" onclick="window.openKeeperLiquidateModal(${profile.id}, '${profile.name}')" style="background: var(--bg-card, #222); color: #ff6b6b; border: 1px solid rgba(255,107,107,0.3); padding: 10px 18px; border-radius: 8px; display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,107,107,0.1)'" onmouseout="this.style.background='var(--bg-card, #222)'">
                                <span class="material-symbols-outlined" style="font-size: 18px;">sell</span> Liquidate
                            </button>
                        </div>
                    </div>

                    <div style="height: 1px; background: var(--border, #333); width: 100%;"></div>

                    <!-- Bottom Section (Manage link style) -->
                    <div style="padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; color: var(--text-muted, #aaa); font-size: 0.9rem;">
                        <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span class="material-symbols-outlined" style="font-size: 18px;">badge</span> ID: #${profile.id}
                            </div>
                            ${profile.address ? `
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span class="material-symbols-outlined" style="font-size: 18px;">location_on</span> ${profile.address}
                            </div>
                            ` : ''}
                        </div>
                        <div>Joined: ${new Date(profile.created_at).toLocaleDateString()}</div>
                    </div>
                </div>

                <!-- Balances Card -->
                <div style="border: 1px solid var(--border, #333); border-radius: 16px; overflow: hidden; margin-bottom: 24px;">
                    <div style="padding: 16px 24px; font-weight: 600; border-bottom: 1px solid var(--border, #333); font-size: 1.1rem;">
                        Vault Balances
                    </div>
                    <div style="display: flex; flex-direction: column;">
                        <!-- Gold Balls Row -->
                        <div style="padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border, #333);">
                            <div style="display: flex; align-items: center; gap: 16px;">
                                <div style="width: 40px; height: 40px; border-radius: 8px; background: rgba(255,215,0,0.1); color: var(--gold-primary, #FFD700); display: flex; align-items: center; justify-content: center;">
                                    <span class="material-symbols-outlined">trip_origin</span>
                                </div>
                                <div style="display: flex; flex-direction: column;">
                                    <span style="font-weight: 500; font-size: 1rem;">Gold Balls</span>
                                    <span style="font-size: 0.85rem; color: var(--text-muted, #aaa);">Unrefined gold deposits</span>
                                </div>
                            </div>
                            <div style="font-size: 1.5rem; font-weight: 600;">
                                ${ballsGrams} <span style="font-size: 1rem; color: var(--gold-primary, #FFD700);">g</span>
                            </div>
                        </div>

                        <!-- Refined Gold Row -->
                        <div style="padding: 20px 24px; display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 16px;">
                                <div style="width: 40px; height: 40px; border-radius: 8px; background: rgba(255,215,0,0.1); color: var(--gold-primary, #FFD700); display: flex; align-items: center; justify-content: center;">
                                    <span class="material-symbols-outlined">diamond</span>
                                </div>
                                <div style="display: flex; flex-direction: column;">
                                    <span style="font-weight: 500; font-size: 1rem;">Refined Gold</span>
                                    <span style="font-size: 0.85rem; color: var(--text-muted, #aaa);">Processed and refined</span>
                                </div>
                            </div>
                            <div style="font-size: 1.5rem; font-weight: 600;">
                                ${refinedGrams} <span style="font-size: 1rem; color: var(--gold-primary, #FFD700);">g</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- History Card -->
                <div style="border: 1px solid var(--border, #333); border-radius: 16px; overflow: hidden;">
                    <div style="padding: 16px 24px; font-weight: 600; border-bottom: 1px solid var(--border, #333); font-size: 1.1rem; display: flex; justify-content: space-between; align-items: center;">
                        <span>Vault Activity History</span>
                        <span class="material-symbols-outlined" style="color: var(--text-muted, #aaa); font-size: 20px;">history</span>
                    </div>
                    
                    <div style="max-height: 400px; overflow-y: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead style="position: sticky; top: 0; background: transparent; z-index: 1;">
                                <tr>
                                    <th style="padding: 16px 24px; font-weight: 500; color: var(--text-muted, #aaa); border-bottom: 1px solid var(--border, #333);">Date</th>
                                    <th style="padding: 16px 24px; font-weight: 500; color: var(--text-muted, #aaa); border-bottom: 1px solid var(--border, #333);">Action</th>
                                    <th style="padding: 16px 24px; font-weight: 500; color: var(--text-muted, #aaa); border-bottom: 1px solid var(--border, #333);">Type</th>
                                    <th style="padding: 16px 24px; font-weight: 500; color: var(--text-muted, #aaa); border-bottom: 1px solid var(--border, #333);">Weight</th>
                                    <th style="padding: 16px 24px; font-weight: 500; color: var(--text-muted, #aaa); border-bottom: 1px solid var(--border, #333);">Payout</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${historyData && historyData.length > 0 ? historyData.map(h => {
            const isDeposit = h.action === 'deposit';
            const badgeStyle = isDeposit
                ? 'background: rgba(76, 209, 55, 0.1); color: #4cd137; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;'
                : 'background: rgba(255, 107, 107, 0.1); color: #ff6b6b; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;';
            const actionLabel = isDeposit ? 'Deposit' : 'Liquidated';

            const w = parseFloat(h.grams || 0).toFixed(2) + 'g';
            const p = h.payout_ghs ? '₵' + parseFloat(h.payout_ghs).toLocaleString() : '-';
            
            let extraInfo = '';
            if (isDeposit) {
                if (h.gold_type === 'refined' && h.volume) {
                    extraInfo = `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Vol: ${parseFloat(h.volume).toFixed(4)}</div>`;
                } else if (h.gold_type === 'balls' && h.total_blades) {
                    extraInfo = `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Blades: ${parseFloat(h.total_blades).toFixed(2)}</div>`;
                }
            }

            return `
                                        <tr style="border-bottom: 1px solid var(--border, #333); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                            <td style="padding: 16px 24px;">${new Date(h.created_at).toLocaleString()}</td>
                                            <td style="padding: 16px 24px;"><span style="${badgeStyle}">${actionLabel}</span></td>
                                            <td style="padding: 16px 24px; text-transform: capitalize;">${h.gold_type}</td>
                                            <td style="padding: 16px 24px; font-weight: 500; color: ${isDeposit ? '#4cd137' : '#ff6b6b'};">
                                                ${isDeposit ? '+' : '-'}${w}
                                                ${extraInfo}
                                            </td>
                                            <td style="padding: 16px 24px;">${p}</td>
                                        </tr>
                                    `;
        }).join('') : '<tr><td colspan="5" style="text-align: center; padding: 32px; color: var(--text-muted, #aaa);">No activity recorded yet.</td></tr>'}
                            </tbody>
                        </table>
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
                    <select id="deposit_gold_type" required onchange="window.toggleKeeperDepositFields()">
                        <option value="balls">Gold Balls</option>
                        <option value="refined">Refined Gold</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label>Weight (Grams)</label>
                <div class="input-with-icon">
                    <span class="material-symbols-outlined">scale</span>
                    <input type="number" id="deposit_weight_grams" step="0.01" min="0.01" required placeholder="0.00" oninput="window.calculateKeeperBlades()">
                </div>
            </div>

            <!-- Dynamic field for Refined Gold -->
            <div class="form-group" id="deposit_volume_group" style="display: none;">
                <label>Volume</label>
                <div class="input-with-icon">
                    <span class="material-symbols-outlined">water_drop</span>
                    <input type="number" id="deposit_volume" step="0.0001" min="0.0001" placeholder="0.0000">
                </div>
            </div>

            <!-- Dynamic field for Gold Balls -->
            <div class="form-group" id="deposit_blades_group">
                <label>Total Blades</label>
                <div class="input-with-icon" style="background: rgba(255,255,255,0.05); cursor: not-allowed;">
                    <span class="material-symbols-outlined" style="opacity: 0.5;">calculate</span>
                    <input type="number" id="deposit_total_blades" step="0.01" readonly placeholder="0.00" style="background: transparent; pointer-events: none; opacity: 0.7;">
                </div>
                <small style="color: var(--text-muted); display: block; margin-top: 4px;">Calculated automatically (Grams / 0.8)</small>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block" style="margin-top: 20px;">
                <span class="material-symbols-outlined">check_circle</span> Process Deposit
            </button>
        </form>
    `;

    document.getElementById('global-modal').classList.add('active');
};

window.toggleKeeperDepositFields = () => {
    const goldType = document.getElementById('deposit_gold_type').value;
    const volumeGroup = document.getElementById('deposit_volume_group');
    const bladesGroup = document.getElementById('deposit_blades_group');
    const volumeInput = document.getElementById('deposit_volume');

    if (goldType === 'refined') {
        volumeGroup.style.display = 'block';
        volumeInput.required = true;
        bladesGroup.style.display = 'none';
    } else {
        volumeGroup.style.display = 'none';
        volumeInput.required = false;
        volumeInput.value = ''; // clear out
        bladesGroup.style.display = 'block';
        window.calculateKeeperBlades(); // Recalculate
    }
};

window.calculateKeeperBlades = () => {
    const weightInput = document.getElementById('deposit_weight_grams');
    const bladesInput = document.getElementById('deposit_total_blades');
    if (!weightInput || !bladesInput) return;

    const grams = parseFloat(weightInput.value);
    if (!isNaN(grams) && grams > 0) {
        // Formula: totalBlades = grams / 0.8
        bladesInput.value = (grams / 0.8).toFixed(2);
    } else {
        bladesInput.value = '';
    }
};

window.submitKeeperDeposit = async (event, customerId) => {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';

    const goldType = document.getElementById('deposit_gold_type').value;
    const payload = {
        customer_id: customerId,
        gold_type: goldType,
        weight_grams: parseFloat(document.getElementById('deposit_weight_grams').value)
    };

    if (goldType === 'refined') {
        payload.volume = parseFloat(document.getElementById('deposit_volume').value);
    } else if (goldType === 'balls') {
        payload.total_blades = parseFloat(document.getElementById('deposit_total_blades').value);
    }

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
                <label>Keeper Full Name <span style="color: var(--danger);">*</span></label>
                <input type="text" id="new_keeper_name" required placeholder="e.g. Kwame Mensah">
            </div>
            
            <div class="form-group">
                <label>Business Name <span style="color: var(--text-muted); font-size: 0.8rem;">(Optional)</span></label>
                <input type="text" id="new_keeper_business" placeholder="e.g. Gold Vault Keepers Ltd">
            </div>

            <div class="form-group">
                <label>Entity Type</label>
                <select id="new_keeper_entity" required>
                    <option value="individual">Individual</option>
                    <option value="group">Group / Company</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Phone Number <span style="color: var(--danger);">*</span></label>
                <input type="text" id="new_keeper_phone" required placeholder="e.g. 0244123456">
            </div>

            <div class="form-group">
                <label>Email Address <span style="color: var(--text-muted); font-size: 0.8rem;">(Optional)</span></label>
                <input type="email" id="new_keeper_email" placeholder="e.g. contact@domain.com">
            </div>
            
            <div class="form-group">
                <label>Physical Address <span style="color: var(--text-muted); font-size: 0.8rem;">(Optional)</span></label>
                <textarea id="new_keeper_address" rows="2" placeholder="e.g. 15 Kumasi Rd"></textarea>
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
        business_name: document.getElementById('new_keeper_business').value,
        type: 'keeper',
        entity_type: document.getElementById('new_keeper_entity').value,
        phone: document.getElementById('new_keeper_phone').value,
        email: document.getElementById('new_keeper_email').value,
        address: document.getElementById('new_keeper_address').value
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
