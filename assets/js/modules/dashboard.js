// assets/js/modules/dashboard.js

/**
 * Dashboard Module
 * Re-designed as a Flowing UI
 */
window.addEventListener('route-changed', async (e) => {
    if (e.detail.route !== 'dashboard') return;
    
    const container = e.detail.container;

    // Loading Skeleton
    container.innerHTML = `
        <div style="display: flex; justify-content: center; padding: 40px;">
            <span class="material-symbols-outlined spin" style="font-size: 2rem; color: var(--gold-primary);">sync</span>
        </div>
    `;

    try {
        const [capitalData, vaultData, recentTxData] = await Promise.all([
            window.api.get('/capital/balance.php'),
            window.api.get('/vault/status.php'),
            window.api.get('/ledger/history.php') // Use this for the activity stream
        ]);

        const cashFmt = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(capitalData.available_cash_ghs);
        const companyTotal = (vaultData.company_owned.balls_grams + vaultData.company_owned.refined_grams).toFixed(2);
        const keeperTotal = (vaultData.keeper_held.balls_grams + vaultData.keeper_held.refined_grams).toFixed(2);
        
        // Grab top 5 recent transactions
        const recentActivity = (recentTxData.transactions || []).slice(0, 5);

        container.innerHTML = `
            <!-- Dashboard Hero -->
            <div style="background: linear-gradient(145deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 100%); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 20px; padding: clamp(24px, 5vw, 40px); position: relative; overflow: hidden; margin-bottom: 32px; box-shadow: 0 10px 30px rgba(245, 158, 11, 0.1);">
                <div style="position: absolute; top: -50px; right: -50px; width: 250px; height: 250px; background: rgba(245, 158, 11, 0.1); border-radius: 50%; filter: blur(40px);"></div>
                <div style="position: absolute; bottom: -30px; left: -30px; width: 150px; height: 150px; background: rgba(245, 158, 11, 0.1); border-radius: 50%; filter: blur(30px);"></div>
                <div style="position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
                    <div>
                        <div style="color: #d97706; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; font-size: 0.95rem; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                            <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3); margin-right: 4px;">
                                <span class="material-symbols-outlined" style="font-size: 18px;">dashboard</span>
                            </div>
                            Executive Overview
                        </div>
                        <h2 style="margin: 0 0 12px 0; font-size: clamp(1.8rem, 6vw, 2.2rem); font-weight: 800; color: var(--text-main);">Welcome back to Qwik-Gold</h2>
                        <p style="margin: 0; color: var(--text-muted); font-size: clamp(0.95rem, 3vw, 1.05rem); max-width: 500px; line-height: 1.5;">Here is your business performance and liquidity overview for today.</p>
                    </div>
                    <button class="btn btn-primary" onclick="window.showInjectCapitalModal()" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; font-weight: 700; padding: clamp(12px, 3vw, 14px) clamp(20px, 4vw, 28px); box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3); display: flex; align-items: center; gap: 8px; font-size: clamp(0.95rem, 3vw, 1.05rem); border-radius: 12px; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <span class="material-symbols-outlined">payments</span> Inject Capital
                    </button>
                </div>
            </div>
            
            <!-- Key Metrics Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 40px;">
                <!-- Available Liquidity -->
                <div style="background: linear-gradient(145deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.03) 100%); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 20px; padding: 24px; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.05); position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 16px;">
                    <div style="position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; background: rgba(16, 185, 129, 0.1); border-radius: 50%; filter: blur(20px);"></div>
                    <div style="display: flex; align-items: center; gap: 12px; position: relative; z-index: 1;">
                        <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);">
                            <span class="material-symbols-outlined" style="font-size: 24px;">account_balance</span>
                        </div>
                        <div style="color: #059669; font-size: 0.9rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2;">Available Liquidity</div>
                    </div>
                    <div style="font-size: 2.4rem; font-weight: 800; color: var(--text-main); display: flex; align-items: baseline; gap: 8px; white-space: nowrap; position: relative; z-index: 1;">
                        <span style="font-size: 1.2rem; color: var(--text-muted); font-weight: 600;">GHS</span> ${capitalData.available_cash_ghs.toLocaleString(undefined, {minimumFractionDigits:2})}
                    </div>
                </div>

                <!-- Company Gold -->
                <div style="background: linear-gradient(145deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 100%); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 20px; padding: 24px; box-shadow: 0 4px 20px rgba(245, 158, 11, 0.05); position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 16px;">
                    <div style="position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; background: rgba(245, 158, 11, 0.1); border-radius: 50%; filter: blur(20px);"></div>
                    <div style="display: flex; align-items: center; gap: 12px; position: relative; z-index: 1;">
                        <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #f59e0b, #d97706); display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3);">
                            <span class="material-symbols-outlined" style="font-size: 24px;">diamond</span>
                        </div>
                        <div style="color: #d97706; font-size: 0.9rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2;">Company Gold</div>
                    </div>
                    <div style="font-size: 2.4rem; font-weight: 800; color: var(--text-main); display: flex; align-items: baseline; gap: 8px; white-space: nowrap; position: relative; z-index: 1;">
                        ${companyTotal} <span style="font-size: 1.2rem; color: var(--text-muted); font-weight: 600;">g</span>
                    </div>
                </div>

                <!-- Keeper Liabilities -->
                <div style="background: linear-gradient(145deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.03) 100%); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 20px; padding: 24px; box-shadow: 0 4px 20px rgba(59, 130, 246, 0.05); position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 16px;">
                    <div style="position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; background: rgba(59, 130, 246, 0.1); border-radius: 50%; filter: blur(20px);"></div>
                    <div style="display: flex; align-items: center; gap: 12px; position: relative; z-index: 1;">
                        <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #3b82f6, #2563eb); display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);">
                            <span class="material-symbols-outlined" style="font-size: 24px;">inventory_2</span>
                        </div>
                        <div style="color: #2563eb; font-size: 0.9rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2;">Keeper Liabilities</div>
                    </div>
                    <div style="font-size: 2.4rem; font-weight: 800; color: var(--text-main); display: flex; align-items: baseline; gap: 8px; white-space: nowrap; position: relative; z-index: 1;">
                        ${keeperTotal} <span style="font-size: 1.2rem; color: var(--text-muted); font-weight: 600;">g</span>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px;">
                <h3 style="font-size: 1.1rem; margin: 0; color: var(--text-main); font-weight: 700;">Quick Actions</h3>
            </div>
            <div style="display: flex; gap: 16px; margin-bottom: 40px; overflow-x: auto; padding-bottom: 8px;">
                <button class="btn" onclick="window.openNewPurchaseModal()" style="background: white; box-shadow: 0 4px 15px rgba(0,0,0,0.02); border: 1px solid var(--border); padding: 16px 24px; border-radius: 16px; flex: 1; min-width: 200px; display: flex; align-items: center; gap: 12px; font-weight: 600; font-size: 1rem; color: var(--text-main); transition: all 0.2s ease; cursor: pointer;" onmouseover="this.style.transform='translateY(-2px)'; this.style.borderColor='var(--gold-primary)'; this.style.boxShadow='0 8px 25px rgba(212,175,55,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='var(--border)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.02)';">
                    <div style="width: 48px; height: 48px; background: rgba(16, 185, 129, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--success);">
                        <span class="material-symbols-outlined" style="font-size: 1.5rem;">storefront</span>
                    </div>
                    Walk-In Purchase
                </button>
                <button class="btn" onclick="window.location.hash='expenses'" style="background: white; box-shadow: 0 4px 15px rgba(0,0,0,0.02); border: 1px solid var(--border); padding: 16px 24px; border-radius: 16px; flex: 1; min-width: 200px; display: flex; align-items: center; gap: 12px; font-weight: 600; font-size: 1rem; color: var(--text-main); transition: all 0.2s ease; cursor: pointer;" onmouseover="this.style.transform='translateY(-2px)'; this.style.borderColor='#ef4444'; this.style.boxShadow='0 8px 25px rgba(239,68,68,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='var(--border)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.02)';">
                    <div style="background: rgba(239, 68, 68, 0.1); width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #ef4444;">
                        <span class="material-symbols-outlined">receipt_long</span>
                    </div>
                    Record Expense
                </button>
                <button class="btn" onclick="window.location.hash='transactions'" style="background: white; box-shadow: 0 4px 15px rgba(0,0,0,0.02); border: 1px solid var(--border); padding: 16px 24px; border-radius: 16px; flex: 1; min-width: 200px; display: flex; align-items: center; gap: 12px; font-weight: 600; font-size: 1rem; color: var(--text-main); transition: all 0.2s ease; cursor: pointer;" onmouseover="this.style.transform='translateY(-2px)'; this.style.borderColor='#3b82f6'; this.style.boxShadow='0 8px 25px rgba(59,130,246,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='var(--border)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.02)';">
                    <div style="background: rgba(59, 130, 246, 0.1); width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #3b82f6;">
                        <span class="material-symbols-outlined">receipt</span>
                    </div>
                    View Ledger
                </button>
            </div>

            <!-- Activity Stream Section -->
            <div style="background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid var(--border); overflow: hidden; margin-bottom: 24px;">
                <div style="padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: #fafafa;">
                    <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-main); font-weight: 700; display: flex; align-items: center; gap: 8px;">
                        <span class="material-symbols-outlined" style="color: var(--text-muted);">history</span> Recent Activity
                    </h3>
                    <button class="btn-text" onclick="window.location.hash='transactions'" style="font-weight: 600; color: var(--gold-primary); font-size: 0.9rem; padding: 4px 12px; border-radius: 6px; border: 1px solid rgba(212,175,55,0.3); background: rgba(212,175,55,0.05); cursor: pointer; transition: background 0.2s;">View All</button>
                </div>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; min-width: 600px;">
                        <thead>
                            <tr style="background: var(--bg-main); color: var(--text-muted); font-size: 0.85rem; text-align: left; text-transform: uppercase;">
                                <th style="padding: 16px 24px; font-weight: 700; border-bottom: 1px solid var(--border);">Date & Time</th>
                                <th style="padding: 16px; font-weight: 700; border-bottom: 1px solid var(--border);">Type</th>
                                <th style="padding: 16px; font-weight: 700; border-bottom: 1px solid var(--border);">Reference</th>
                                <th style="padding: 16px 24px; font-weight: 700; border-bottom: 1px solid var(--border); text-align: right;">Amount (GHS)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${recentActivity.length === 0 ? '<tr><td colspan="4" style="padding: 48px; text-align: center; color: var(--text-muted); font-size: 1.05rem;">No recent activity.</td></tr>' : ''}
                            ${recentActivity.map(tx => {
                                const isPositive = parseFloat(tx.amount_ghs) > 0;
                                const amountColor = isPositive ? '#10b981' : '#ef4444';
                                const displayType = tx.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                                const amountSign = isPositive ? '+' : '';

                                return `
                                <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='white'">
                                    <td style="padding: 16px 24px; color: var(--text-main); font-weight: 500;">
                                        ${new Date(tx.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 4px;">${new Date(tx.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                                    </td>
                                    <td style="padding: 16px;">
                                        <span style="padding: 4px 10px; background: rgba(100, 116, 139, 0.1); color: #64748b; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${displayType}</span>
                                    </td>
                                    <td style="padding: 16px;">
                                        <div style="font-family: monospace; font-weight: 600; color: var(--text-main); background: var(--bg-main); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); display: inline-block; font-size: 0.85rem;">
                                            ${tx.reference_id ? 'Ref: ' + tx.reference_id : 'N/A'}
                                        </div>
                                    </td>
                                    <td style="padding: 16px 24px; text-align: right; color: ${amountColor}; font-weight: 800; font-size: 1.1rem;">
                                        ${amountSign}<span style="font-size: 0.8rem; font-weight: 600; margin-right: 2px;">₵</span>${parseFloat(Math.abs(tx.amount_ghs)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Failed to load dashboard data.</div>`;
    }
});

window.showInjectCapitalModal = () => {
    const html = `
        <form id="inject-capital-form">
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 20px; border-radius: 16px; margin-bottom: 32px; display: flex; gap: 16px; align-items: flex-start; box-shadow: 0 4px 12px rgba(22, 101, 52, 0.05);">
                <div style="background: #dcfce7; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #15803d; flex-shrink: 0;">
                    <span class="material-symbols-outlined" style="font-size: 24px;">account_balance_wallet</span>
                </div>
                <div>
                    <strong style="display: block; font-size: 1rem; margin-bottom: 4px; color: #14532d;">Inject External Capital</strong>
                    <span style="font-size: 0.9rem; line-height: 1.5; color: #166534; display: block;">This amount will immediately increase the available liquidity in your Capital Ledger and will be recorded as an external injection.</span>
                </div>
            </div>

            <style>
                .premium-input-container {
                    position: relative;
                    margin-bottom: 28px;
                }
                .premium-input-container label {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 12px;
                }
                .amount-display {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-main);
                    border-radius: 20px;
                    padding: 12px;
                    border: 2px solid transparent;
                    transition: all 0.2s;
                }
                .amount-display:focus-within {
                    background: white;
                    border-color: #10b981;
                    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.15);
                }
                .currency-symbol {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: var(--text-muted);
                    position: absolute;
                    left: 24px;
                }
                #inject-amount {
                    width: 100%;
                    background: transparent;
                    border: none;
                    outline: none;
                    text-align: center;
                    font-size: 4rem;
                    font-weight: 800;
                    color: #10b981;
                    padding: 20px 60px;
                    letter-spacing: -2px;
                }
                #inject-amount::placeholder {
                    color: rgba(16, 185, 129, 0.2);
                }
                #inject-amount::-webkit-outer-spin-button,
                #inject-amount::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                #inject-amount[type=number] {
                    -moz-appearance: textfield;
                }
                .premium-text-input {
                    width: 100%;
                    background: var(--bg-main);
                    border: 2px solid transparent;
                    border-radius: 16px;
                    padding: 16px 20px;
                    font-size: 1.05rem;
                    color: var(--text-main);
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .premium-text-input:focus {
                    background: white;
                    border-color: var(--info);
                    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.1);
                    outline: none;
                }
            </style>

            <div class="premium-input-container">
                <label style="text-align: center;">Amount to Inject <span style="color: var(--danger);">*</span></label>
                <div class="amount-display">
                    <span class="currency-symbol">₵</span>
                    <input type="number" id="inject-amount" step="0.01" min="0.01" required placeholder="0.00">
                </div>
            </div>

            <div class="premium-input-container">
                <label>Source / Description <span style="color: var(--danger);">*</span></label>
                <div style="position: relative;">
                    <span class="material-symbols-outlined" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 22px;">description</span>
                    <input type="text" id="inject-source" class="premium-text-input" style="padding-left: 52px;" required placeholder="e.g. Director's Loan, Partner Investment...">
                </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block" style="margin-top: 40px; background: #10b981; border: none; padding: 18px; font-size: 1.1rem; border-radius: 16px; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3); color: white; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 15px 35px rgba(16, 185, 129, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 10px 25px rgba(16, 185, 129, 0.3)';">
                <span class="material-symbols-outlined">add_circle</span> Confirm Capital Injection
            </button>
        </form>
    `;
    
    window.openModal('Inject External Capital', html);

    document.getElementById('inject-capital-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = document.getElementById('inject-amount').value;
        const source = document.getElementById('inject-source').value;
        const btn = e.target.querySelector('button[type="submit"]');
        
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';

        try {
            const res = await window.api.post('/capital/inject.php', {
                amount_ghs: parseFloat(amount),
                source_description: source
            });
            window.showToast('Capital injected successfully!', 'success');
            window.closeModal();
            window.dispatchEvent(new CustomEvent('route-changed', { detail: { route: 'dashboard', container: document.getElementById('view-container') } }));
        } catch (error) {
            window.showToast(error.message || 'Failed to inject capital', 'error');
            btn.disabled = false;
            btn.innerHTML = 'Inject Funds';
        }
    });
};
