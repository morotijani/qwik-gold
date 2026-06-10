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
                <div>
                    <h2 style="margin: 0 0 8px 0; font-size: 1.5rem; color: var(--text-main); font-weight: 700;">Keepers Vault</h2>
                    <p style="margin: 0; color: var(--text-muted);">Manage your gold keepers and their vault balances.</p>
                </div>
                <button class="btn btn-primary" onclick="window.openCreateKeeperModal()" style="display: flex; align-items: center; gap: 8px;">
                    <span class="material-symbols-outlined" style="font-size: 20px;">person_add</span> Register Keeper
                </button>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">
        `;

        if (keepers.length > 0) {
            keepers.forEach((k) => {
                const initial = k.name.charAt(0).toUpperCase();
                html += `
                    <div style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; transition: all 0.2s; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; gap: 24px;" onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='var(--gold-primary)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.2)';" onmouseout="this.style.transform='none'; this.style.borderColor='var(--border)'; this.style.boxShadow='none';" onclick="window.viewKeeper(${k.id})">
                        
                        <div style="display: flex; align-items: flex-start; gap: 16px;">
                            <div style="width: 56px; height: 56px; border-radius: 16px; background: rgba(255, 215, 0, 0.1); color: var(--gold-primary); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; flex-shrink: 0;">
                                ${initial}
                            </div>
                            <div style="flex-grow: 1; overflow: hidden;">
                                <h3 style="margin: 0 0 6px 0; font-size: 1.15rem; font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${k.name}</h3>
                                ${k.business_name ? `<div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 14px;">storefront</span> ${k.business_name}</div>` : ''}
                                <div style="font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                                    <span class="material-symbols-outlined" style="font-size: 14px;">call</span> ${k.phone || 'No phone'}
                                </div>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 16px;">
                            <span style="font-size: 0.85rem; color: #4cd137; background: rgba(76, 209, 55, 0.1); padding: 4px 10px; border-radius: 20px; display: inline-flex; align-items: center; gap: 4px; font-weight: 500;">
                                <span class="material-symbols-outlined" style="font-size: 14px;">check_circle</span> Active Keeper
                            </span>
                            <span style="color: var(--gold-primary); font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; gap: 4px; opacity: 0.9;">
                                Manage Vault <span class="material-symbols-outlined" style="font-size: 18px;">arrow_forward</span>
                            </span>
                        </div>
                    </div>
                `;
            });
        } else {
            html += `<div style="grid-column: 1 / -1; text-align: center; padding: 60px 40px; background: var(--bg-surface); border: 1px dashed var(--border); border-radius: 16px; color: var(--text-muted);">
                <span class="material-symbols-outlined" style="font-size: 48px; opacity: 0.5; margin-bottom: 16px; display: block;">group_off</span>
                <h3 style="margin: 0 0 8px 0; color: var(--text-main); font-weight: 600;">No Keepers Found</h3>
                <p style="margin: 0;">You haven't registered any gold keepers yet.</p>
            </div>`;
        }

        html += `
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
            <div style="width: 100%; padding-bottom: 40px; animation: slideIn 0.3s ease;">
                <!-- Top Navigation/Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <button class="btn-icon" onclick="window.location.hash='#keepers'; window.dispatchEvent(new Event('hashchange'));" style="background: var(--bg-surface); border: 1px solid var(--border);">
                            <span class="material-symbols-outlined">arrow_back</span>
                        </button>
                        <h2 style="font-size: 1.25rem; font-weight: 600; margin: 0; color: var(--text-main);">Keeper Profile</h2>
                    </div>
                    <button class="btn btn-text" onclick='window.openEditKeeperModal(${JSON.stringify(profile).replace(/'/g, "&#39;")})' style="display: flex; align-items: center; gap: 8px; font-weight: 500;">
                        <span class="material-symbols-outlined" style="font-size: 18px;">edit</span> Edit Details
                    </button>
                </div>

                <!-- Main Profile Banner Card -->
                <div style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; padding: 32px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 24px; position: relative; overflow: hidden;">
                    <!-- Decorative background glow -->
                    <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: var(--gold-primary); filter: blur(80px); opacity: 0.1; border-radius: 50%;"></div>
                    
                    <div style="display: flex; align-items: center; gap: 24px; z-index: 1;">
                        <div style="width: 80px; height: 80px; border-radius: 20px; background: rgba(255, 215, 0, 0.1); color: var(--gold-primary); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: 700;">
                            ${initial}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <h3 style="font-size: 1.5rem; font-weight: 700; margin: 0; color: var(--text-main);">${profile.name}</h3>
                                <span style="font-size: 0.8rem; color: #4cd137; background: rgba(76, 209, 55, 0.1); padding: 4px 10px; border-radius: 20px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                                    <span class="material-symbols-outlined" style="font-size: 14px;">check_circle</span> Active
                                </span>
                            </div>
                            <div style="color: var(--text-muted); font-size: 0.95rem; display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
                                <span style="display: flex; align-items: center; gap: 4px; font-weight: 500; color: var(--gold-primary);"><span class="material-symbols-outlined" style="font-size: 16px;">tag</span> ID: ${profile.customer_uid}</span>
                                <span style="display: flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 16px;">category</span> ${profile.entity_type ? profile.entity_type.charAt(0).toUpperCase() + profile.entity_type.slice(1) : 'Individual'}</span>
                                ${profile.business_name ? `<span style="display: flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 16px;">storefront</span> ${profile.business_name}</span>` : ''}
                                <span style="display: flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 16px;">call</span> ${profile.phone || 'No phone'}</span>
                                ${profile.email ? `<span style="display: flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 16px;">mail</span> ${profile.email}</span>` : ''}
                                <span style="display: flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 16px;">calendar_today</span> Joined ${profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 12px; z-index: 1;">
                        <button class="btn btn-primary" onclick="window.openKeeperDepositModal(${profile.id}, '${profile.name}')" style="display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 8px; font-weight: 600;">
                            <span class="material-symbols-outlined" style="font-size: 20px;">download</span> Receive Deposit
                        </button>
                        <button class="btn" onclick="window.openKeeperLiquidateModal(${profile.id}, '${profile.name}')" style="background: rgba(255, 107, 107, 0.1); color: #ff6b6b; border: 1px solid rgba(255, 107, 107, 0.2); padding: 12px 20px; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='rgba(255, 107, 107, 0.2)';" onmouseout="this.style.background='rgba(255, 107, 107, 0.1)';">
                            <span class="material-symbols-outlined" style="font-size: 20px;">sell</span> Liquidate
                        </button>
                    </div>
                </div>

                <!-- Balances Grid -->
                <h3 style="font-size: 1.1rem; font-weight: 600; color: var(--text-main); margin: 0 0 16px 0;">Vault Balances</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 32px;">
                    
                    <!-- Gold Balls Balance -->
                    <div style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; display: flex; align-items: center; gap: 20px;">
                        <div style="width: 56px; height: 56px; border-radius: 16px; background: rgba(255, 215, 0, 0.1); display: flex; align-items: center; justify-content: center;">
                            <span class="material-symbols-outlined" style="font-size: 28px; color: var(--gold-primary);">trip_origin</span>
                        </div>
                        <div>
                            <div style="color: var(--text-muted); font-size: 0.9rem; font-weight: 500; margin-bottom: 4px;">Gold Balls</div>
                            <div style="font-size: 1.8rem; font-weight: 700; color: var(--text-main); line-height: 1;">
                                ${ballsGrams} <span style="font-size: 1rem; color: var(--gold-primary); font-weight: 600;">g</span>
                            </div>
                        </div>
                    </div>

                    <!-- Refined Gold Balance -->
                    <div style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; display: flex; align-items: center; gap: 20px;">
                        <div style="width: 56px; height: 56px; border-radius: 16px; background: rgba(255, 215, 0, 0.1); display: flex; align-items: center; justify-content: center;">
                            <span class="material-symbols-outlined" style="font-size: 28px; color: var(--gold-primary);">diamond</span>
                        </div>
                        <div>
                            <div style="color: var(--text-muted); font-size: 0.9rem; font-weight: 500; margin-bottom: 4px;">Refined Gold</div>
                            <div style="font-size: 1.8rem; font-weight: 700; color: var(--text-main); line-height: 1;">
                                ${refinedGrams} <span style="font-size: 1rem; color: var(--gold-primary); font-weight: 600;">g</span>
                            </div>
                        </div>
                    </div>

                </div>

                <!-- History Section -->
                <div style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden;">
                    <div style="padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="font-size: 1.1rem; font-weight: 600; color: var(--text-main); margin: 0;">Vault Activity History</h3>
                        <span class="material-symbols-outlined" style="color: var(--text-muted);">history</span>
                    </div>
                    
                    <div style="max-height: 400px; overflow-y: auto;">
                        <table class="data-table" style="width: 100%; border-collapse: collapse;">
                            <thead style="position: sticky; top: 0; background: var(--bg-main); z-index: 1;">
                                <tr>
                                    <th style="padding: 16px 24px;">Date</th>
                                    <th style="padding: 16px 24px;">Action</th>
                                    <th style="padding: 16px 24px;">Type</th>
                                    <th style="padding: 16px 24px;">Weight</th>
                                    <th style="padding: 16px 24px;">Payout</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${historyData && historyData.length > 0 ? historyData.map(h => {
            const isDeposit = h.action === 'deposit';
            const badgeStyle = isDeposit
                ? 'background: rgba(76, 209, 55, 0.1); color: #4cd137; padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;'
                : 'background: rgba(255, 107, 107, 0.1); color: #ff6b6b; padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;';
            const actionIcon = isDeposit ? 'arrow_downward' : 'arrow_upward';
            const actionLabel = isDeposit ? 'Deposit' : 'Liquidated';

            const w = parseFloat(h.grams || 0).toFixed(2) + 'g';
            const p = h.payout_ghs ? '₵' + parseFloat(h.payout_ghs).toLocaleString() : '-';

            let extraInfo = '';
            if (isDeposit) {
                if (h.gold_type === 'refined' && h.volume) {
                    extraInfo = `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Vol: ${parseFloat(h.volume).toFixed(4)}</div>`;
                } else if (h.gold_type === 'balls' && h.total_blades) {
                    extraInfo = `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Blades: ${parseFloat(h.total_blades).toFixed(2)}</div>`;
                }
            }

            const rowAction = !isDeposit ? `onclick='window.openKeeperLiquidationDetailsModal(${JSON.stringify(h).replace(/'/g, "&#39;")})' style="cursor: pointer; border-bottom: 1px solid var(--border); transition: background 0.2s;" onmouseover="this.style.background='var(--bg-main)'" onmouseout="this.style.background='transparent'"` : `style="border-bottom: 1px solid var(--border); transition: background 0.2s;" onmouseover="this.style.background='var(--bg-main)'" onmouseout="this.style.background='transparent'"`;

            return `
                                        <tr ${rowAction}>
                                            <td style="padding: 16px 24px; color: var(--text-muted);">${new Date(h.created_at).toLocaleString()}</td>
                                            <td style="padding: 16px 24px;">
                                                <span style="${badgeStyle}">
                                                    <span class="material-symbols-outlined" style="font-size: 14px;">${actionIcon}</span> ${actionLabel}
                                                </span>
                                            </td>
                                            <td style="padding: 16px 24px; text-transform: capitalize; font-weight: 500;">
                                                <div style="display: flex; align-items: center; gap: 8px;">
                                                    <span class="material-symbols-outlined" style="font-size: 16px; color: var(--gold-primary);">${h.gold_type === 'refined' ? 'diamond' : 'trip_origin'}</span>
                                                    ${h.gold_type}
                                                </div>
                                            </td>
                                            <td style="padding: 16px 24px; font-weight: 600; color: ${isDeposit ? '#4cd137' : '#ff6b6b'};">
                                                ${isDeposit ? '+' : '-'}${w}
                                                ${extraInfo}
                                            </td>
                                            <td style="padding: 16px 24px; font-weight: 500;">${p}</td>
                                        </tr>
                                    `;
        }).join('') : '<tr><td colspan="5" style="text-align: center; padding: 48px; color: var(--text-muted);">No activity recorded yet.</td></tr>'}
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
        <form id="keeper-deposit-form" onsubmit="window.reviewKeeperDeposit(event, ${customerId}, '${customerName.replace(/'/g, "\\'")}')">
            
            <div id="deposit-step-1">
                <div class="form-group" style="margin-bottom: 24px;">
                    <label style="font-weight: 600; color: var(--text-main); margin-bottom: 12px; display: block; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px;">Gold Type</label>
                    <div style="display: flex; gap: 12px;">
                        <!-- Hidden input to store selected value -->
                        <input type="hidden" id="deposit_gold_type" value="balls">
                        
                        <!-- Gold Balls Card -->
                        <div id="card_deposit_balls" style="flex: 1; border: 2px solid var(--warning); background: var(--warning-bg); border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s;" 
                             onclick="window.selectKeeperDepositGoldType('balls')">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                                <div id="icon_bg_deposit_balls" style="background: var(--warning); color: white; height: 40px; width: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                    <span class="material-symbols-outlined">scatter_plot</span>
                                </div>
                                <div id="radio_border_deposit_balls" style="height: 20px; width: 20px; border-radius: 50%; border: 2px solid var(--warning); background: var(--warning); display: flex; align-items: center; justify-content: center;">
                                    <div id="radio_dot_deposit_balls" style="height: 8px; width: 8px; background: white; border-radius: 50%; display: block;"></div>
                                </div>
                            </div>
                            <div style="font-weight: 600; color: var(--text-main); font-size: 0.95rem;">Gold Balls</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Unrefined / Sponge</div>
                        </div>
                        
                        <!-- Refined Gold Card -->
                        <div id="card_deposit_refined" style="flex: 1; border: 2px solid var(--border); background: white; border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s;" 
                             onclick="window.selectKeeperDepositGoldType('refined')">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                                <div id="icon_bg_deposit_refined" style="background: var(--bg-hover); color: var(--text-muted); height: 40px; width: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                    <span class="material-symbols-outlined">diamond</span>
                                </div>
                                <div id="radio_border_deposit_refined" style="height: 20px; width: 20px; border-radius: 50%; border: 2px solid #ccc; background: transparent; display: flex; align-items: center; justify-content: center;">
                                    <div id="radio_dot_deposit_refined" style="height: 8px; width: 8px; background: white; border-radius: 50%; display: none;"></div>
                                </div>
                            </div>
                            <div style="font-weight: 600; color: var(--text-main); font-size: 0.95rem;">Refined Gold</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Processed Bars</div>
                        </div>
                    </div>
                </div>

                <!-- Highlighted Weight Input -->
                <div class="form-group" style="margin-bottom: 24px;">
                    <label style="font-weight: 600; color: var(--text-main); margin-bottom: 8px; display: block; text-align: center;">Deposit Weight</label>
                    <div style="position: relative;">
                        <input type="number" id="deposit_weight_grams" step="0.01" min="0.01" required placeholder="0.00" oninput="window.calculateKeeperBlades()" style="width: 100%; padding: 20px 80px; font-size: 2.5rem; font-weight: 700; text-align: center; background: var(--bg-main); border: 2px solid var(--border); border-radius: 16px; color: var(--text-main); transition: border-color 0.2s; outline: none; -moz-appearance: textfield;" onfocus="this.style.borderColor='var(--gold-primary)'" onblur="this.style.borderColor='var(--border)'">
                        <span style="position: absolute; right: 24px; top: 50%; transform: translateY(-50%); font-weight: 600; color: var(--gold-primary); font-size: 1.2rem; pointer-events: none;">grams</span>
                    </div>
                </div>

                <!-- Dynamic field for Refined Gold -->
                <div class="form-group" id="deposit_volume_group" style="display: none; margin-bottom: 20px;">
                    <label style="font-weight: 500; color: var(--text-main);">Water Volume</label>
                    <div class="input-with-icon" style="background: var(--bg-main); border-radius: 12px; border: 1px solid var(--border);">
                        <span class="material-symbols-outlined" style="color: #3498db;">water_drop</span>
                        <input type="number" id="deposit_volume" step="0.0001" min="0.0001" placeholder="0.0000" style="padding: 14px 14px 14px 44px; font-size: 1.05rem; background: transparent; border: none; width: 100%; color: var(--text-main); outline: none;">
                    </div>
                </div>

                <!-- Dynamic field for Gold Balls -->
                <div class="form-group" id="deposit_blades_group" style="margin-bottom: 20px;">
                    <label style="font-weight: 500; color: var(--text-main);">Total Blades <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: normal;">(Auto-calculated)</span></label>
                    <div class="input-with-icon" style="background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed var(--border);">
                        <span class="material-symbols-outlined" style="opacity: 0.5;">calculate</span>
                        <input type="number" id="deposit_total_blades" step="0.01" readonly placeholder="0.00" style="background: transparent; border: none; width: 100%; pointer-events: none; opacity: 0.9; padding: 14px 14px 14px 44px; font-size: 1.05rem; font-weight: 600; color: var(--gold-primary); outline: none;">
                    </div>
                    <small style="color: var(--text-muted); display: block; margin-top: 4px;">Each blade weighs 0.8 grams. Calculated automatically (Weight in Grams / 0.8).</small>
                </div>
                
                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 32px; padding: 16px; font-size: 1.1rem; font-weight: 600; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <span class="material-symbols-outlined">visibility</span> Review Details
                </button>
            </div>
            
            <div id="deposit-step-2" style="display: none;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="display: inline-flex; background: rgba(46, 204, 113, 0.1); color: #2ecc71; padding: 12px; border-radius: 50%; margin-bottom: 12px;">
                        <span class="material-symbols-outlined" style="font-size: 32px;">verified</span>
                    </div>
                    <h3 style="margin: 0; color: var(--text-main); font-size: 1.2rem;">Confirm Deposit</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">Please review the deposit details before confirming.</p>
                </div>

                <div id="deposit-review-details"></div>

                <div style="display: flex; gap: 12px; margin-top: 32px;">
                    <button type="button" class="btn btn-secondary" onclick="window.backToKeeperDeposit()" style="flex: 1; padding: 16px; font-size: 1.1rem; font-weight: 600; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <span class="material-symbols-outlined">arrow_back</span> Back
                    </button>
                    <button type="button" id="btn-confirm-deposit" class="btn btn-primary" onclick="window.confirmKeeperDeposit(${customerId})" style="flex: 2; padding: 16px; font-size: 1.1rem; font-weight: 600; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <span class="material-symbols-outlined">check_circle</span> Confirm Deposit
                    </button>
                </div>
            </div>
        </form>
    `;

    document.getElementById('global-modal').classList.add('active');
};

window.reviewKeeperDeposit = (event, customerId, customerName) => {
    event.preventDefault();
    
    const goldType = document.getElementById('deposit_gold_type').value;
    const weight = document.getElementById('deposit_weight_grams').value;
    
    let detailsHtml = `
        <div style="background: var(--bg-main); padding: 16px; border-radius: 12px; margin-bottom: 24px; border: 1px solid var(--border);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                <span style="color: var(--text-muted);">Action</span>
                <span style="font-weight: 600; color: var(--gold-primary);">Deposit Gold</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: var(--text-muted);">Keeper</span>
                <span style="font-weight: 600; color: var(--text-main);">${customerName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: var(--text-muted);">Gold Type</span>
                <span style="font-weight: 600; color: var(--text-main); text-transform: capitalize;">${goldType === 'balls' ? 'Gold Balls' : 'Refined Gold'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: var(--text-muted);">Deposit Weight</span>
                <span style="font-weight: 700; color: var(--text-main); font-size: 1.1rem;">${parseFloat(weight).toLocaleString('en-US', {minimumFractionDigits: 2})} g</span>
            </div>
    `;

    if (goldType === 'refined') {
        const volume = document.getElementById('deposit_volume').value;
        detailsHtml += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: var(--text-muted);">Water Volume</span>
                <span style="font-weight: 600; color: var(--text-main);">${parseFloat(volume).toFixed(4)}</span>
            </div>
        `;
    } else {
        const blades = document.getElementById('deposit_total_blades').value;
        detailsHtml += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: var(--text-muted);">Total Blades</span>
                <span style="font-weight: 600; color: var(--text-main);">${blades}</span>
            </div>
        `;
    }

    detailsHtml += `</div>`;

    document.getElementById('deposit-review-details').innerHTML = detailsHtml;
    
    document.getElementById('deposit-step-1').style.display = 'none';
    document.getElementById('deposit-step-2').style.display = 'block';
};

window.backToKeeperDeposit = () => {
    document.getElementById('deposit-step-2').style.display = 'none';
    document.getElementById('deposit-step-1').style.display = 'block';
};

window.selectKeeperDepositGoldType = (type) => {
    document.getElementById('deposit_gold_type').value = type;
    
    // Elements for balls
    const cardBalls = document.getElementById('card_deposit_balls');
    const iconBgBalls = document.getElementById('icon_bg_deposit_balls');
    const radioBorderBalls = document.getElementById('radio_border_deposit_balls');
    const radioDotBalls = document.getElementById('radio_dot_deposit_balls');

    // Elements for refined
    const cardRefined = document.getElementById('card_deposit_refined');
    const iconBgRefined = document.getElementById('icon_bg_deposit_refined');
    const radioBorderRefined = document.getElementById('radio_border_deposit_refined');
    const radioDotRefined = document.getElementById('radio_dot_deposit_refined');

    if (type === 'balls') {
        cardBalls.style.border = '2px solid var(--warning)';
        cardBalls.style.background = 'var(--warning-bg)';
        iconBgBalls.style.background = 'var(--warning)';
        iconBgBalls.style.color = 'white';
        radioBorderBalls.style.border = '2px solid var(--warning)';
        radioBorderBalls.style.background = 'var(--warning)';
        radioDotBalls.style.display = 'block';

        cardRefined.style.border = '2px solid var(--border)';
        cardRefined.style.background = 'white';
        iconBgRefined.style.background = 'var(--bg-hover)';
        iconBgRefined.style.color = 'var(--text-muted)';
        radioBorderRefined.style.border = '2px solid #ccc';
        radioBorderRefined.style.background = 'transparent';
        radioDotRefined.style.display = 'none';
    } else {
        cardRefined.style.border = '2px solid var(--warning)';
        cardRefined.style.background = 'var(--warning-bg)';
        iconBgRefined.style.background = 'var(--warning)';
        iconBgRefined.style.color = 'white';
        radioBorderRefined.style.border = '2px solid var(--warning)';
        radioBorderRefined.style.background = 'var(--warning)';
        radioDotRefined.style.display = 'block';

        cardBalls.style.border = '2px solid var(--border)';
        cardBalls.style.background = 'white';
        iconBgBalls.style.background = 'var(--bg-hover)';
        iconBgBalls.style.color = 'var(--text-muted)';
        radioBorderBalls.style.border = '2px solid #ccc';
        radioBorderBalls.style.background = 'transparent';
        radioDotBalls.style.display = 'none';
    }

    window.toggleKeeperDepositFields();
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

window.confirmKeeperDeposit = async (customerId) => {
    const btn = document.getElementById('btn-confirm-deposit');
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
        btn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Confirm Deposit';
    }
};

window.openKeeperLiquidateModal = (customerId, customerName) => {
    document.getElementById('modal-title').textContent = 'Liquidate Gold - ' + customerName;
    const modalBody = document.getElementById('modal-body');

    modalBody.innerHTML = `
        <form id="keeper-liquidate-form" onsubmit="window.reviewKeeperLiquidate(event, ${customerId}, '${customerName.replace(/'/g, "\\'")}')">
            
            <div id="liq-step-1">
                <div class="form-group" style="margin-bottom: 24px;">
                    <label style="font-weight: 600; color: var(--text-main); margin-bottom: 12px; display: block; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px;">Gold Type to Liquidate</label>
                    <div style="display: flex; gap: 12px;">
                        <input type="hidden" id="liq_gold_type" value="balls">
                        
                        <div id="card_liq_balls" style="flex: 1; border: 2px solid var(--warning); background: var(--warning-bg); border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s;" 
                             onclick="window.selectKeeperLiqGoldType('balls')">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                                <div id="icon_bg_liq_balls" style="background: var(--warning); color: white; height: 40px; width: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                    <span class="material-symbols-outlined">scatter_plot</span>
                                </div>
                                <div id="radio_border_liq_balls" style="height: 20px; width: 20px; border-radius: 50%; border: 2px solid var(--warning); background: var(--warning); display: flex; align-items: center; justify-content: center;">
                                    <div id="radio_dot_liq_balls" style="height: 8px; width: 8px; background: white; border-radius: 50%; display: block;"></div>
                                </div>
                            </div>
                            <div style="font-weight: 600; color: var(--text-main); font-size: 0.95rem;">Gold Balls</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Unrefined / Sponge</div>
                        </div>
                        
                        <div id="card_liq_refined" style="flex: 1; border: 2px solid var(--border); background: white; border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s;" 
                             onclick="window.selectKeeperLiqGoldType('refined')">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                                <div id="icon_bg_liq_refined" style="background: var(--bg-hover); color: var(--text-muted); height: 40px; width: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                    <span class="material-symbols-outlined">diamond</span>
                                </div>
                                <div id="radio_border_liq_refined" style="height: 20px; width: 20px; border-radius: 50%; border: 2px solid #ccc; background: transparent; display: flex; align-items: center; justify-content: center;">
                                    <div id="radio_dot_liq_refined" style="height: 8px; width: 8px; background: white; border-radius: 50%; display: none;"></div>
                                </div>
                            </div>
                            <div style="font-weight: 600; color: var(--text-main); font-size: 0.95rem;">Refined Gold</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Processed Bars</div>
                        </div>
                    </div>
                </div>

                <div id="liq_dynamic_container">
                    <!-- Fields populated by JS -->
                </div>
                
                <button type="submit" class="btn" style="background: #ff6b6b; color: #111; margin-top: 32px; width: 100%; padding: 16px; font-size: 1.1rem; font-weight: 600; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; border: none; cursor: pointer;">
                    <span class="material-symbols-outlined">visibility</span> Review Details
                </button>
            </div>

            <div id="liq-step-2" style="display: none;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="display: inline-flex; background: rgba(255, 107, 107, 0.1); color: #ff6b6b; padding: 12px; border-radius: 50%; margin-bottom: 12px;">
                        <span class="material-symbols-outlined" style="font-size: 32px;">point_of_sale</span>
                    </div>
                    <h3 style="margin: 0; color: var(--text-main); font-size: 1.2rem;">Confirm Liquidation</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">Please review the liquidation details before confirming.</p>
                </div>

                <div id="liq-review-details"></div>

                <div style="display: flex; gap: 12px; margin-top: 32px;">
                    <button type="button" class="btn btn-secondary" onclick="window.backToKeeperLiquidate()" style="flex: 1; padding: 16px; font-size: 1.1rem; font-weight: 600; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <span class="material-symbols-outlined">arrow_back</span> Back
                    </button>
                    <button type="button" id="btn-confirm-liquidate" class="btn" onclick="window.confirmKeeperLiquidate(${customerId})" style="background: #ff6b6b; color: #111; flex: 2; padding: 16px; font-size: 1.1rem; font-weight: 600; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; border: none; cursor: pointer;">
                        <span class="material-symbols-outlined">point_of_sale</span> Confirm Liquidation
                    </button>
                </div>
            </div>
        </form>
    `;

    document.getElementById('global-modal').classList.add('active');

    // Fetch keeper's current balance
    window.api.get('/keepers/balance.php?customer_id=' + customerId)
        .then(data => {
            const balances = data.vault_totals;
            const form = document.getElementById('keeper-liquidate-form');
            form.dataset.ballsGrams = balances.balls_grams || 0;
            form.dataset.ballsBlades = balances.balls_blades || 0;
            form.dataset.refinedGrams = balances.refined_grams || 0;
            form.dataset.refinedVolume = balances.refined_volume || 0;

            window.toggleKeeperLiqFields();
        })
        .catch(err => {
            console.error('Failed to load keeper balance:', err);
        });
};

window.toggleKeeperLiqFields = () => {
    const goldType = document.getElementById('liq_gold_type').value;
    const form = document.getElementById('keeper-liquidate-form');
    const container = document.getElementById('liq_dynamic_container');
    
    if (goldType === 'balls') {
        const grams = parseFloat(form.dataset.ballsGrams) || 0;
        const blades = parseFloat(form.dataset.ballsBlades) || 0;
        
        container.innerHTML = `
            <div style="display: flex; gap: 16px; margin-bottom: 24px;">
                <div class="form-group" style="flex: 1;">
                    <label style="color: var(--text-muted); font-weight: 600; font-size: 0.85rem; margin-bottom: 8px; display: block;">Total Grams</label>
                    <input type="number" id="liq_balls_grams" value="${grams}" readonly style="width: 100%; padding: 12px; font-weight: 600; background: var(--bg-hover); border: 1px solid var(--border); border-radius: 8px; color: var(--text-main); pointer-events: none;">
                </div>
                <div class="form-group" style="flex: 1;">
                    <label style="color: var(--text-muted); font-weight: 600; font-size: 0.85rem; margin-bottom: 8px; display: block;">Total Balls (Blades)</label>
                    <input type="number" id="liq_balls_blades" value="${blades}" readonly style="width: 100%; padding: 12px; font-weight: 600; background: var(--bg-hover); border: 1px solid var(--border); border-radius: 8px; color: var(--text-main); pointer-events: none;">
                </div>
            </div>
            
            <div class="form-group" style="margin-bottom: 24px;">
                <label style="font-weight: 600; color: var(--text-main); margin-bottom: 8px; display: block;">Current Local Price per Blade (GHS)</label>
                <div style="position: relative;">
                    <input type="number" id="liq_price_per_blade" step="0.01" min="0.01" required placeholder="0.00" style="width: 100%; padding: 16px 16px 16px 44px; font-size: 1.2rem; font-weight: 600; background: var(--bg-main); border: 2px solid var(--border); border-radius: 12px; color: var(--text-main); transition: border-color 0.2s; outline: none;" onfocus="this.style.borderColor='#ff6b6b'" onblur="this.style.borderColor='var(--border)'" oninput="window.calculateKeeperLiqPayout()">
                    <span style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-weight: 600; color: var(--text-muted); font-size: 1.2rem;">₵</span>
                </div>
            </div>
            
            <div class="form-group" style="margin-bottom: 24px;">
                <label style="font-weight: 600; color: #ff6b6b; margin-bottom: 8px; display: block; text-align: center;">Total Payout (GHS)</label>
                <input type="number" id="liq_total_payout" readonly required style="width: 100%; padding: 20px; font-size: 2.5rem; font-weight: 700; text-align: center; color: #ff6b6b; background: rgba(255,107,107,0.05); border: 2px solid #ff6b6b; border-radius: 16px; pointer-events: none;">
            </div>
        `;
    } else {
        const grams = parseFloat(form.dataset.refinedGrams) || 0;
        const volume = parseFloat(form.dataset.refinedVolume) || 0;
        
        const truncate2 = (num) => Math.floor(num * 100) / 100;
        const pounds = truncate2(grams / 7.75);
        const density = volume > 0 ? truncate2(grams / volume) : 0;
        const karat = density > 0 ? truncate2(((density - 10.51) * 52.838) / density) : 0;
        
        container.innerHTML = `
            <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                <div class="form-group" style="flex: 1;">
                    <label style="color: var(--text-muted); font-weight: 600; font-size: 0.85rem; margin-bottom: 8px; display: block;">Total Grams</label>
                    <input type="number" id="liq_refined_grams" value="${grams}" readonly style="width: 100%; padding: 12px; font-weight: 600; background: var(--bg-hover); border: 1px solid var(--border); border-radius: 8px; color: var(--text-main); pointer-events: none;">
                </div>
                <div class="form-group" style="flex: 1;">
                    <label style="color: var(--text-muted); font-weight: 600; font-size: 0.85rem; margin-bottom: 8px; display: block;">Total Volume</label>
                    <input type="number" id="liq_refined_volume" value="${volume}" readonly style="width: 100%; padding: 12px; font-weight: 600; background: var(--bg-hover); border: 1px solid var(--border); border-radius: 8px; color: var(--text-main); pointer-events: none;">
                </div>
            </div>
            
            <div style="display: flex; gap: 16px; margin-bottom: 24px; padding: 16px; background: var(--bg-hover); border: 1px solid var(--border); border-radius: 12px;">
                <div style="flex: 1; text-align: center; border-right: 1px solid var(--border);">
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px;">Pounds</div>
                    <div style="font-weight: 700; color: var(--text-main); font-size: 1.1rem;" id="liq_calc_pounds">${pounds.toFixed(2)}</div>
                </div>
                <div style="flex: 1; text-align: center; border-right: 1px solid var(--border);">
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px;">Density</div>
                    <div style="font-weight: 700; color: var(--text-main); font-size: 1.1rem;" id="liq_calc_density">${density.toFixed(2)}</div>
                </div>
                <div style="flex: 1; text-align: center;">
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px;">Karat</div>
                    <div style="font-weight: 700; color: var(--text-main); font-size: 1.1rem;" id="liq_calc_karat">${karat.toFixed(2)}</div>
                </div>
            </div>
            
            <div class="form-group" style="margin-bottom: 24px;">
                <label style="font-weight: 600; color: var(--text-main); margin-bottom: 8px; display: block;">Current Local Price (GHS)</label>
                <div style="position: relative;">
                    <input type="number" id="liq_local_price" step="0.01" min="0.01" required placeholder="0.00" style="width: 100%; padding: 16px 16px 16px 44px; font-size: 1.2rem; font-weight: 600; background: var(--bg-main); border: 2px solid var(--border); border-radius: 12px; color: var(--text-main); transition: border-color 0.2s; outline: none;" onfocus="this.style.borderColor='#ff6b6b'" onblur="this.style.borderColor='var(--border)'" oninput="window.calculateKeeperLiqPayout()">
                    <span style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-weight: 600; color: var(--text-muted); font-size: 1.2rem;">₵</span>
                </div>
            </div>
            
            <div class="form-group" style="margin-bottom: 24px;">
                <label style="font-weight: 600; color: #ff6b6b; margin-bottom: 8px; display: block; text-align: center;">Total Payout (GHS)</label>
                <input type="number" id="liq_total_payout" readonly required style="width: 100%; padding: 20px; font-size: 2.5rem; font-weight: 700; text-align: center; color: #ff6b6b; background: rgba(255,107,107,0.05); border: 2px solid #ff6b6b; border-radius: 16px; pointer-events: none;">
            </div>
        `;
    }
};

window.calculateKeeperLiqPayout = () => {
    const goldType = document.getElementById('liq_gold_type').value;
    const payoutInput = document.getElementById('liq_total_payout');
    
    if (goldType === 'balls') {
        const blades = parseFloat(document.getElementById('liq_balls_blades').value) || 0;
        const price = parseFloat(document.getElementById('liq_price_per_blade').value) || 0;
        payoutInput.value = (blades * price).toFixed(2);
    } else {
        const pounds = parseFloat(document.getElementById('liq_calc_pounds').textContent) || 0;
        const karat = parseFloat(document.getElementById('liq_calc_karat').textContent) || 0;
        const price = parseFloat(document.getElementById('liq_local_price').value) || 0;
        payoutInput.value = ((karat * price / 23) * pounds).toFixed(2);
    }
};

window.reviewKeeperLiquidate = (event, customerId, customerName) => {
    event.preventDefault();
    
    const goldType = document.getElementById('liq_gold_type').value;
    const payout = document.getElementById('liq_total_payout').value;
    
    let detailsHtml = `
        <div style="background: var(--bg-main); padding: 16px; border-radius: 12px; margin-bottom: 24px; border: 1px solid var(--border);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                <span style="color: var(--text-muted);">Action</span>
                <span style="font-weight: 600; color: #ff6b6b;">Liquidate Gold</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: var(--text-muted);">Keeper</span>
                <span style="font-weight: 600; color: var(--text-main);">${customerName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: var(--text-muted);">Gold Type</span>
                <span style="font-weight: 600; color: var(--text-main); text-transform: capitalize;">${goldType === 'balls' ? 'Gold Balls' : 'Refined Gold'}</span>
            </div>
    `;

    if (goldType === 'balls') {
        const grams = document.getElementById('liq_balls_grams').value;
        const blades = document.getElementById('liq_balls_blades').value;
        const price = document.getElementById('liq_price_per_blade').value;
        detailsHtml += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: var(--text-muted);">Grams to Sell</span>
                <span style="font-weight: 700; color: var(--text-main); font-size: 1.1rem;">${parseFloat(grams).toLocaleString('en-US', {minimumFractionDigits: 2})} g</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: var(--text-muted);">Total Balls (Blades)</span>
                <span style="font-weight: 600; color: var(--text-main);">${parseFloat(blades).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: var(--text-muted);">Price per Blade</span>
                <span style="font-weight: 600; color: var(--text-main);">₵ ${parseFloat(price).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            </div>
        `;
    } else {
        const grams = document.getElementById('liq_refined_grams').value;
        const volume = document.getElementById('liq_refined_volume').value;
        const pounds = document.getElementById('liq_calc_pounds').textContent;
        const density = document.getElementById('liq_calc_density').textContent;
        const karat = document.getElementById('liq_calc_karat').textContent;
        const price = document.getElementById('liq_local_price').value;
        
        detailsHtml += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: var(--text-muted);">Grams to Sell</span>
                <span style="font-weight: 700; color: var(--text-main); font-size: 1.1rem;">${parseFloat(grams).toLocaleString('en-US', {minimumFractionDigits: 2})} g</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: var(--text-muted);">Volume</span>
                <span style="font-weight: 600; color: var(--text-main);">${parseFloat(volume).toLocaleString('en-US', {minimumFractionDigits: 4})}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: var(--text-muted);">Pounds / Density / Karat</span>
                <span style="font-weight: 600; color: var(--text-main);">${pounds} / ${density} / ${karat}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: var(--text-muted);">Current Local Price</span>
                <span style="font-weight: 600; color: var(--text-main);">₵ ${parseFloat(price).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            </div>
        `;
    }

    detailsHtml += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; margin-top: 8px; padding-top: 12px; border-top: 1px dashed var(--border);">
                <span style="color: var(--text-muted);">Total Payout</span>
                <span style="font-weight: 700; color: #ff6b6b; font-size: 1.1rem;">₵ ${parseFloat(payout).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            </div>
        </div>
    `;

    document.getElementById('liq-review-details').innerHTML = detailsHtml;
    
    document.getElementById('liq-step-1').style.display = 'none';
    document.getElementById('liq-step-2').style.display = 'block';
};

window.backToKeeperLiquidate = () => {
    document.getElementById('liq-step-2').style.display = 'none';
    document.getElementById('liq-step-1').style.display = 'block';
};

window.selectKeeperLiqGoldType = (type) => {
    document.getElementById('liq_gold_type').value = type;
    
    // Elements for balls
    const cardBalls = document.getElementById('card_liq_balls');
    const iconBgBalls = document.getElementById('icon_bg_liq_balls');
    const radioBorderBalls = document.getElementById('radio_border_liq_balls');
    const radioDotBalls = document.getElementById('radio_dot_liq_balls');

    // Elements for refined
    const cardRefined = document.getElementById('card_liq_refined');
    const iconBgRefined = document.getElementById('icon_bg_liq_refined');
    const radioBorderRefined = document.getElementById('radio_border_liq_refined');
    const radioDotRefined = document.getElementById('radio_dot_liq_refined');

    if (type === 'balls') {
        cardBalls.style.border = '2px solid var(--warning)';
        cardBalls.style.background = 'var(--warning-bg)';
        iconBgBalls.style.background = 'var(--warning)';
        iconBgBalls.style.color = 'white';
        radioBorderBalls.style.border = '2px solid var(--warning)';
        radioBorderBalls.style.background = 'var(--warning)';
        radioDotBalls.style.display = 'block';

        cardRefined.style.border = '2px solid var(--border)';
        cardRefined.style.background = 'white';
        iconBgRefined.style.background = 'var(--bg-hover)';
        iconBgRefined.style.color = 'var(--text-muted)';
        radioBorderRefined.style.border = '2px solid #ccc';
        radioBorderRefined.style.background = 'transparent';
        radioDotRefined.style.display = 'none';
    } else {
        cardRefined.style.border = '2px solid var(--warning)';
        cardRefined.style.background = 'var(--warning-bg)';
        iconBgRefined.style.background = 'var(--warning)';
        iconBgRefined.style.color = 'white';
        radioBorderRefined.style.border = '2px solid var(--warning)';
        radioBorderRefined.style.background = 'var(--warning)';
        radioDotRefined.style.display = 'block';

        cardBalls.style.border = '2px solid var(--border)';
        cardBalls.style.background = 'white';
        iconBgBalls.style.background = 'var(--bg-hover)';
        iconBgBalls.style.color = 'var(--text-muted)';
        radioBorderBalls.style.border = '2px solid #ccc';
        radioBorderBalls.style.background = 'transparent';
        radioDotBalls.style.display = 'none';
    }

    if (window.toggleKeeperLiqFields) {
        window.toggleKeeperLiqFields();
    }
};

window.confirmKeeperLiquidate = async (customerId) => {
    const btn = document.getElementById('btn-confirm-liquidate');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';

    const goldType = document.getElementById('liq_gold_type').value;
    
    let payload = {
        customer_id: customerId,
        gold_type: goldType,
        total_payout_ghs: parseFloat(document.getElementById('liq_total_payout').value)
    };

    if (goldType === 'balls') {
        payload.total_grams_sold = parseFloat(document.getElementById('liq_balls_grams').value);
        payload.total_blades = parseFloat(document.getElementById('liq_balls_blades').value);
        payload.local_price = parseFloat(document.getElementById('liq_price_per_blade').value);
    } else {
        payload.total_grams_sold = parseFloat(document.getElementById('liq_refined_grams').value);
        payload.density = parseFloat(document.getElementById('liq_calc_density').textContent);
        payload.karat = parseFloat(document.getElementById('liq_calc_karat').textContent);
        payload.pounds = parseFloat(document.getElementById('liq_calc_pounds').textContent);
        payload.local_price = parseFloat(document.getElementById('liq_local_price').value);
    }

    // validate grams sold > 0
    if (!payload.total_grams_sold || payload.total_grams_sold <= 0) {
        window.showToast('Keeper has no balance to liquidate.', 'error');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined">point_of_sale</span> Confirm Liquidation';
        return;
    }

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
            <div style="background: linear-gradient(145deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.02) 100%); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 16px; padding: 20px; margin-bottom: 24px; display: flex; gap: 16px; align-items: center;">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                    <span class="material-symbols-outlined" style="font-size: 1.6rem;">how_to_reg</span>
                </div>
                <div>
                    <div style="font-size: 0.95rem; font-weight: 800; color: #2563eb; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Register Keeper</div>
                    <div style="font-size: 0.85rem; color: var(--text-main); line-height: 1.4;">Create a profile to securely track keeper deposits and liquidations.</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div class="form-group" style="margin: 0;">
                    <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px; font-size: 0.95rem;">Full Name <span style="color: var(--danger);">*</span></label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">person</span>
                        <input type="text" id="new_keeper_name" required placeholder="Kwame Mensah" style="padding-left: 44px; width: 100%;">
                    </div>
                </div>
                
                <div class="form-group" style="margin: 0;">
                    <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px; font-size: 0.95rem;">Business Name <span style="color: var(--text-muted); font-size: 0.8rem; font-weight: 400;">(Optional)</span></label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">storefront</span>
                        <input type="text" id="new_keeper_business" placeholder="Keepers Ltd" style="padding-left: 44px; width: 100%;">
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div class="form-group" style="margin: 0;">
                    <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px; font-size: 0.95rem;">Entity Type</label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">domain</span>
                        <select id="new_keeper_entity" required style="padding-left: 44px; width: 100%;">
                            <option value="individual">Individual</option>
                            <option value="group">Group / Company</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group" style="margin: 0;">
                    <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px; font-size: 0.95rem;">Phone Number <span style="color: var(--danger);">*</span></label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">call</span>
                        <input type="text" id="new_keeper_phone" required placeholder="0244123456" style="padding-left: 44px; width: 100%;">
                    </div>
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px; font-size: 0.95rem;">Email Address <span style="color: var(--text-muted); font-size: 0.8rem; font-weight: 400;">(Optional)</span></label>
                <div class="input-with-icon">
                    <span class="material-symbols-outlined">mail</span>
                    <input type="email" id="new_keeper_email" placeholder="contact@domain.com" style="padding-left: 44px; width: 100%;">
                </div>
            </div>
            
            <div class="form-group" style="margin-bottom: 24px;">
                <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px; font-size: 0.95rem;">Physical Address <span style="color: var(--text-muted); font-size: 0.8rem; font-weight: 400;">(Optional)</span></label>
                <textarea id="new_keeper_address" rows="2" placeholder="e.g. 15 Kumasi Rd" class="form-control" style="width: 100%; border-radius: 8px; border: 1px solid var(--border); padding: 12px;"></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 16px; font-size: 1.05rem; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);">
                <span class="material-symbols-outlined">how_to_reg</span> Complete Registration
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
        window.loadKeepersData(); // Refresh list
    } catch (error) {
        console.error('Error creating keeper:', error);
        window.showToast('Network error', 'error');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined">how_to_reg</span> Register Keeper';
    }
};

window.openEditKeeperModal = (profile) => {
    document.getElementById('modal-title').textContent = 'Update Keeper Details';
    const modalBody = document.getElementById('modal-body');

    modalBody.innerHTML = `
        <form id="edit-keeper-form" onsubmit="window.submitEditKeeper(event, ${profile.id})">
            <div style="background: linear-gradient(145deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.02) 100%); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 16px; padding: 20px; margin-bottom: 24px; display: flex; gap: 16px; align-items: center;">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                    <span class="material-symbols-outlined" style="font-size: 1.6rem;">edit_document</span>
                </div>
                <div>
                    <div style="font-size: 0.95rem; font-weight: 800; color: #d97706; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Update Keeper</div>
                    <div style="font-size: 0.85rem; color: var(--text-main); line-height: 1.4;">Modify existing profile details for this keeper.</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div class="form-group" style="margin: 0;">
                    <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px; font-size: 0.95rem;">Full Name <span style="color: var(--danger);">*</span></label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">person</span>
                        <input type="text" id="edit_keeper_name" required value="${profile.name}" style="padding-left: 44px; width: 100%;">
                    </div>
                </div>
                
                <div class="form-group" style="margin: 0;">
                    <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px; font-size: 0.95rem;">Business Name <span style="color: var(--text-muted); font-size: 0.8rem; font-weight: 400;">(Optional)</span></label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">storefront</span>
                        <input type="text" id="edit_keeper_business" value="${profile.business_name || ''}" style="padding-left: 44px; width: 100%;">
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div class="form-group" style="margin: 0;">
                    <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px; font-size: 0.95rem;">Entity Type</label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">domain</span>
                        <select id="edit_keeper_entity" required style="padding-left: 44px; width: 100%;">
                            <option value="individual" ${profile.entity_type === 'individual' ? 'selected' : ''}>Individual</option>
                            <option value="group" ${profile.entity_type === 'group' ? 'selected' : ''}>Group / Company</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group" style="margin: 0;">
                    <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px; font-size: 0.95rem;">Phone Number <span style="color: var(--danger);">*</span></label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">call</span>
                        <input type="text" id="edit_keeper_phone" required value="${profile.phone || ''}" style="padding-left: 44px; width: 100%;">
                    </div>
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px; font-size: 0.95rem;">Email Address <span style="color: var(--text-muted); font-size: 0.8rem; font-weight: 400;">(Optional)</span></label>
                <div class="input-with-icon">
                    <span class="material-symbols-outlined">mail</span>
                    <input type="email" id="edit_keeper_email" value="${profile.email || ''}" style="padding-left: 44px; width: 100%;">
                </div>
            </div>
            
            <div class="form-group" style="margin-bottom: 24px;">
                <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px; font-size: 0.95rem;">Physical Address <span style="color: var(--text-muted); font-size: 0.8rem; font-weight: 400;">(Optional)</span></label>
                <textarea id="edit_keeper_address" rows="2" class="form-control" style="width: 100%; border-radius: 8px; border: 1px solid var(--border); padding: 12px;">${profile.address || ''}</textarea>
            </div>
            
            <button type="submit" class="btn" style="width: 100%; background: #f59e0b; color: white; padding: 16px; font-size: 1.05rem; font-weight: 600; border: none; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); cursor: pointer;">
                <span class="material-symbols-outlined">save</span> Save Changes
            </button>
        </form>
    `;

    document.getElementById('global-modal').classList.add('active');
};

window.submitEditKeeper = async (event, customerId) => {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Saving...';

    const payload = {
        id: customerId,
        name: document.getElementById('edit_keeper_name').value,
        business_name: document.getElementById('edit_keeper_business').value,
        entity_type: document.getElementById('edit_keeper_entity').value,
        phone: document.getElementById('edit_keeper_phone').value,
        email: document.getElementById('edit_keeper_email').value,
        address: document.getElementById('edit_keeper_address').value
    };

    try {
        await window.api.post('/customers/update.php', payload);
        window.showToast('Keeper details updated successfully', 'success');
        window.closeModal();
        window.viewKeeper(customerId); // Refresh profile view
    } catch (error) {
        console.error('Error updating keeper:', error);
        window.showToast('Network error', 'error');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined">save</span> Save Changes';
    }
}

window.openKeeperLiquidationDetailsModal = (data) => {
    document.getElementById('modal-title').textContent = 'Liquidation Details';
    const modalBody = document.getElementById('modal-body');

    const dateStr = new Date(data.created_at).toLocaleString();
    const isRefined = data.gold_type === 'refined';

    let extraDetails = '';
    if (isRefined) {
        extraDetails = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                <span style="color: var(--text-muted);">Pounds</span>
                <span style="font-weight: 600; color: var(--text-main);">${parseFloat(data.pounds || 0).toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                <span style="color: var(--text-muted);">Density</span>
                <span style="font-weight: 600; color: var(--text-main);">${parseFloat(data.density || 0).toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                <span style="color: var(--text-muted);">Karat</span>
                <span style="font-weight: 600; color: var(--text-main);">${parseFloat(data.karat || 0).toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                <span style="color: var(--text-muted);">Local Price (GHS)</span>
                <span style="font-weight: 600; color: var(--text-main);">₵${parseFloat(data.local_price || 0).toLocaleString()}</span>
            </div>
        `;
    } else {
        extraDetails = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                <span style="color: var(--text-muted);">Total Blades</span>
                <span style="font-weight: 600; color: var(--text-main);">${parseFloat(data.total_blades || 0).toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                <span style="color: var(--text-muted);">Local Price per Blade (GHS)</span>
                <span style="font-weight: 600; color: var(--text-main);">₵${parseFloat(data.local_price || 0).toLocaleString()}</span>
            </div>
        `;
    }

    modalBody.innerHTML = `
        <div style="background: var(--bg-surface); padding: 24px; border-radius: 12px; border: 1px solid var(--border);">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-flex; background: rgba(255, 107, 107, 0.1); color: #ff6b6b; padding: 16px; border-radius: 50%; margin-bottom: 12px;">
                    <span class="material-symbols-outlined" style="font-size: 36px;">receipt_long</span>
                </div>
                <h3 style="margin: 0; color: var(--text-main); font-size: 1.4rem;">${data.transaction_ref || 'N/A'}</h3>
                <div style="color: var(--text-muted); margin-top: 4px;">${dateStr}</div>
            </div>

            <div style="background: var(--bg-main); padding: 16px; border-radius: 12px; margin-bottom: 24px; border: 1px solid var(--border);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                    <span style="color: var(--text-muted);">Action</span>
                    <span style="font-weight: 600; color: #ff6b6b; background: rgba(255, 107, 107, 0.1); padding: 4px 12px; border-radius: 20px; font-size: 0.85rem;">Liquidated</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                    <span style="color: var(--text-muted);">Gold Type</span>
                    <span style="font-weight: 600; color: var(--text-main); text-transform: capitalize;">
                        <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle; color: var(--gold-primary); margin-right: 4px;">${isRefined ? 'diamond' : 'trip_origin'}</span>
                        ${data.gold_type}
                    </span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                    <span style="color: var(--text-muted);">Weight Liquidated</span>
                    <span style="font-weight: 700; color: var(--text-main);">${parseFloat(data.grams || 0).toLocaleString('en-US', {minimumFractionDigits: 2})} g</span>
                </div>
                ${extraDetails}
                <div style="display: flex; justify-content: space-between; margin-top: 16px; background: rgba(255, 107, 107, 0.05); padding: 16px; border-radius: 8px; border: 1px dashed rgba(255, 107, 107, 0.3);">
                    <span style="color: var(--text-main); font-weight: 600; font-size: 1.1rem;">Total Payout</span>
                    <span style="font-weight: 800; color: #ff6b6b; font-size: 1.3rem;">₵${parseFloat(data.payout_ghs || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
            </div>

            <button type="button" class="btn btn-secondary btn-block" onclick="window.closeModal()" style="padding: 16px; font-size: 1.1rem; font-weight: 600; border-radius: 12px;">
                Close
            </button>
        </div>
    `;

    document.getElementById('global-modal').classList.add('active');
};;
