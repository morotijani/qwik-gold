// assets/js/modules/customers.js

/**
 * Customers Module
 */
window.addEventListener('route-changed', async (e) => {
    if (e.detail.route !== 'customers') return;
    
    const container = e.detail.container;

    // View State: 'list', 'create', 'view'
    let currentViewState = 'list';
    
    const render = () => {
        if (currentViewState === 'list') renderList();
        else if (currentViewState === 'create') renderCreate();
    };

    const renderList = async () => {
        container.innerHTML = `
            <div class="glass-panel" style="padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2>Customer Directory</h2>
                    <button class="btn btn-primary" id="btn-new-customer">
                        <span class="material-symbols-outlined">add</span> Register Customer
                    </button>
                </div>
                
                <div class="table-container">
                    <table id="customers-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Contact</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="customers-tbody">
                            <tr><td colspan="5" style="text-align: center;">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        document.getElementById('btn-new-customer').addEventListener('click', () => {
            currentViewState = 'create';
            render();
        });

        try {
            const customers = await window.api.get('/customers/list.php');
            const tbody = document.getElementById('customers-tbody');
            
            if (customers.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No customers found.</td></tr>';
                return;
            }

            tbody.innerHTML = customers.map(c => `
                <tr>
                    <td>#${c.id}</td>
                    <td style="font-weight: 600;">${c.name}</td>
                    <td><span class="badge badge-outline">${c.type}</span></td>
                    <td>${c.phone || 'N/A'}</td>
                    <td>
                        <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem;" onclick="viewCustomer(${c.id})">
                            View Profile
                        </button>
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            document.getElementById('customers-tbody').innerHTML = 
                `<tr><td colspan="5" class="gold-text" style="text-align: center;">Error loading data</td></tr>`;
        }
    };

    const renderCreate = () => {
        container.innerHTML = `
            <div class="glass-panel" style="padding: 24px; max-width: 600px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2>Register New Customer</h2>
                    <button class="btn btn-outline" id="btn-back">
                        <span class="material-symbols-outlined">arrow_back</span> Back
                    </button>
                </div>
                
                <form id="create-customer-form">
                    <div class="form-group">
                        <label>Full Name <span style="color: var(--danger);">*</span></label>
                        <input type="text" id="cust-name" required placeholder="e.g. Kwame Mensah">
                    </div>
                    
                    <div class="form-group">
                        <label>Business Name <span style="color: var(--text-muted); font-size: 0.8rem;">(Optional)</span></label>
                        <input type="text" id="cust-business-name" placeholder="e.g. Gold Traders Ltd">
                    </div>

                    <div class="form-group">
                        <label>Entity Type</label>
                        <select id="cust-type" required>
                            <option value="individual">Individual</option>
                            <option value="group">Group / Company</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Phone Number <span style="color: var(--danger);">*</span></label>
                        <input type="text" id="cust-phone" required placeholder="e.g. 0244123456">
                    </div>

                    <div class="form-group">
                        <label>Email Address <span style="color: var(--text-muted); font-size: 0.8rem;">(Optional)</span></label>
                        <input type="email" id="cust-email" placeholder="e.g. name@example.com">
                    </div>
                    
                    <div class="form-group">
                        <label>Physical Address <span style="color: var(--text-muted); font-size: 0.8rem;">(Optional)</span></label>
                        <textarea id="cust-address" rows="2" placeholder="e.g. 15 Kumasi Rd, Adum"></textarea>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-block">
                        <span class="material-symbols-outlined">save</span> Save Customer
                    </button>
                </form>
            </div>
        `;

        document.getElementById('btn-back').addEventListener('click', () => {
            currentViewState = 'list';
            render();
        });

        document.getElementById('create-customer-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Saving...';

            try {
                const payload = {
                    name: document.getElementById('cust-name').value,
                    business_name: document.getElementById('cust-business-name').value,
                    type: document.getElementById('cust-type').value,
                    phone: document.getElementById('cust-phone').value,
                    email: document.getElementById('cust-email').value,
                    address: document.getElementById('cust-address').value
                };

                await window.api.post('/customers/create.php', payload);
                window.showToast('Customer registered successfully', 'success');
                currentViewState = 'list';
                render();
                
            } catch (error) {
                window.showToast(error.message, 'error');
                btn.disabled = false;
                btn.innerHTML = '<span class="material-symbols-outlined">save</span> Save Customer';
            }
        });
    };

    // Global function to be called from inline onclick in the list
    window.viewCustomer = async (id, returnRoute = 'customers') => {
        container.innerHTML = '<div style="text-align:center; padding: 50px;"><span class="material-symbols-outlined spin gold-text" style="font-size: 2rem;">sync</span></div>';
        try {
            const data = await window.api.get(`/customers/view.php?customer_id=${id}`);
            
            let loansHtml = '';
            if (data.all_loans && data.all_loans.length > 0) {
                loansHtml = `
                    <div class="table-container" style="margin-top: 16px;">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.all_loans.map(l => `
                                    <tr>
                                        <td>${new Date(l.created_at).toLocaleDateString()}</td>
                                        <td><strong>GHS ${parseFloat(l.principal_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></td>
                                        <td><span class="badge badge-outline">${l.type}</span></td>
                                        <td><span style="font-weight: 600; font-size: 0.85rem; color: ${l.status === 'active' ? 'var(--danger)' : 'var(--success)'};">${l.status.toUpperCase()}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            } else {
                loansHtml = '<div style="padding: 32px; text-align: center; color: var(--text-muted); background: var(--bg-main); border-radius: 8px; margin-top: 16px;">No loan history found.</div>';
            }

            // Render Profile
            container.innerHTML = `
                <div style="max-width: 900px; margin: 0 auto; padding-bottom: 40px; animation: slideIn 0.3s ease;">
                    <!-- Header -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <h2 style="font-size: initial; font-weight: 600; margin: 0;">Customer Profile</h2>
                        <div style="display: flex; gap: 12px;">
                            <button class="btn btn-secondary" onclick="window.location.hash = '#${returnRoute}'; window.dispatchEvent(new CustomEvent('route-changed', {detail:{route:'${returnRoute}', container: document.getElementById('view-container')}}))" style="background: transparent; border: none; padding: 8px 16px; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <span class="material-symbols-outlined" style="font-size: 20px;">arrow_back</span> Return
                            </button>
                        </div>
                    </div>

                    <!-- Main Profile Card -->
                    <div style="border: 1px solid var(--border, #333); border-radius: 16px; overflow: hidden; margin-bottom: 24px;">
                        <!-- Top Section -->
                        <div style="padding: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
                            <div style="display: flex; align-items: center; gap: 20px;">
                                <div style="width: 72px; height: 72px; border-radius: 50%; background: var(--gold-gradient, linear-gradient(135deg, #FFD700, #FDB931)); display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #000; font-weight: 700;">
                                    ${data.profile.name.charAt(0).toUpperCase()}
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 4px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <h3 style="font-size: 1.25rem; font-weight: 600; margin: 0;">${data.profile.name}</h3>
                                        ${data.profile.business_name ? `<span style="background: rgba(255,215,0,0.1); color: var(--gold-primary, #FFD700); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; border: 1px solid rgba(255,215,0,0.2);">${data.profile.business_name}</span>` : ''}
                                    </div>
                                    <span style="color: var(--text-muted, #aaa); font-size: 0.9rem;">
                                        ${data.profile.phone || 'No phone'} 
                                        ${data.profile.email ? ` &nbsp;|&nbsp; ${data.profile.email}` : ''}
                                    </span>
                                    <div style="display: flex; align-items: center; gap: 12px; margin-top: 4px; font-size: 0.85rem; font-weight: 500;">
                                        <span style="color: #4cd137; display: flex; align-items: center; gap: 4px;">
                                            <span class="material-symbols-outlined" style="font-size: 16px;">check_circle</span> Active Customer
                                        </span>
                                        <span style="color: var(--text-muted, #aaa); border-left: 1px solid var(--border, #333); padding-left: 12px; text-transform: capitalize; display: flex; align-items: center; gap: 4px;">
                                            <span class="material-symbols-outlined" style="font-size: 16px;">${data.profile.entity_type === 'group' ? 'groups' : 'person'}</span> ${data.profile.entity_type || 'Individual'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style="height: 1px; background: var(--border, #333); width: 100%;"></div>
                        <!-- Bottom Section -->
                        <div style="padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; color: var(--text-muted, #aaa); font-size: 0.9rem;">
                            <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span class="material-symbols-outlined" style="font-size: 18px;">badge</span> ID: #${data.profile.id}
                                </div>
                                ${data.profile.address ? `
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span class="material-symbols-outlined" style="font-size: 18px;">location_on</span> ${data.profile.address}
                                </div>
                                ` : ''}
                            </div>
                            <div>Joined: ${new Date(data.profile.created_at).toLocaleDateString()}</div>
                        </div>
                    </div>

                    ${(data.current_kept_gold && (parseFloat(data.current_kept_gold.balls_grams) > 0 || parseFloat(data.current_kept_gold.refined_grams) > 0)) || (data.all_loans && data.all_loans.some(l => l.type === 'collateral')) ? `
                    <!-- Balances Card -->
                    <div style="border: 1px solid var(--border, #333); border-radius: 16px; overflow: hidden; margin-bottom: 24px;">
                        <div style="padding: 16px 24px; font-weight: 600; border-bottom: 1px solid var(--border, #333); font-size: 1.1rem;">
                            Collateral Vault Inventory
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
                                        <span style="font-size: 0.85rem; color: var(--text-muted, #aaa);">Unrefined gold collateral</span>
                                    </div>
                                </div>
                                <div style="font-size: 1.5rem; font-weight: 600;">
                                    ${parseFloat(data.current_kept_gold.balls_grams || 0).toFixed(2)} <span style="font-size: 1rem; color: var(--gold-primary, #FFD700);">g</span>
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
                                        <span style="font-size: 0.85rem; color: var(--text-muted, #aaa);">Processed gold collateral</span>
                                    </div>
                                </div>
                                <div style="font-size: 1.5rem; font-weight: 600;">
                                    ${parseFloat(data.current_kept_gold.refined_grams || 0).toFixed(2)} <span style="font-size: 1rem; color: var(--gold-primary, #FFD700);">g</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    ` : ''}

                    <!-- Financial Summary -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                        <div style="border: 1px solid var(--border, #333); border-radius: 16px; padding: 24px; border-top: 4px solid #ff6b6b; background: transparent;">
                            <div style="color: var(--text-muted, #aaa); font-size: 0.9rem; margin-bottom: 8px;">Total Active Debt</div>
                            <div style="font-size: 2rem; font-weight: bold; color: #ff6b6b;">GHS ${Number(data.active_debt.total_amount_ghs || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted, #aaa); margin-top: 8px;">Spread across ${data.active_debt.loans ? data.active_debt.loans.length : 0} active loan(s)</div>
                        </div>
                        <div style="border: 1px solid var(--border, #333); border-radius: 16px; padding: 24px; border-top: 4px solid #4cd137; background: transparent;">
                            <div style="color: var(--text-muted, #aaa); font-size: 0.9rem; margin-bottom: 8px;">Total Settled Loans</div>
                            <div style="font-size: 2rem; font-weight: bold; color: #4cd137;">GHS ${Number(data.total_settled_ghs || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted, #aaa); margin-top: 8px;">Historical lifetime value</div>
                        </div>
                    </div>

                    <!-- Loan History Card -->
                    <div style="border: 1px solid var(--border, #333); border-radius: 16px; overflow: hidden;">
                        <div style="padding: 16px 24px; font-weight: 600; border-bottom: 1px solid var(--border, #333); font-size: 1.1rem; display: flex; justify-content: space-between; align-items: center;">
                            <span>Complete Loan History</span>
                            <span class="material-symbols-outlined" style="color: var(--text-muted, #aaa); font-size: 20px;">account_balance_wallet</span>
                        </div>
                        <div style="max-height: 400px; overflow-y: auto;">
                            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                                <thead style="position: sticky; top: 0; background: transparent; z-index: 1;">
                                    <tr>
                                        <th style="padding: 16px 24px; font-weight: 500; color: var(--text-muted, #aaa); border-bottom: 1px solid var(--border, #333);">Date</th>
                                        <th style="padding: 16px 24px; font-weight: 500; color: var(--text-muted, #aaa); border-bottom: 1px solid var(--border, #333);">Amount</th>
                                        <th style="padding: 16px 24px; font-weight: 500; color: var(--text-muted, #aaa); border-bottom: 1px solid var(--border, #333);">Type</th>
                                        <th style="padding: 16px 24px; font-weight: 500; color: var(--text-muted, #aaa); border-bottom: 1px solid var(--border, #333);">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.all_loans && data.all_loans.length > 0 ? data.all_loans.map(l => {
                                        const statusColor = l.status === 'active' ? '#ff6b6b' : '#4cd137';
                                        const statusBg = l.status === 'active' ? 'rgba(255, 107, 107, 0.1)' : 'rgba(76, 209, 55, 0.1)';
                                        return `
                                        <tr style="border-bottom: 1px solid var(--border, #333); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                            <td style="padding: 16px 24px;">${new Date(l.created_at).toLocaleDateString()}</td>
                                            <td style="padding: 16px 24px; font-weight: 600;">GHS ${parseFloat(l.principal_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                            <td style="padding: 16px 24px; text-transform: capitalize;">${l.type}</td>
                                            <td style="padding: 16px 24px;">
                                                <span style="background: ${statusBg}; color: ${statusColor}; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">
                                                    ${l.status.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                        `}).join('') : `<tr><td colspan="4" style="padding: 32px; text-align: center; color: var(--text-muted);">No loan history found.</td></tr>`}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

        } catch (error) {
            window.showToast(error.message, 'error');
            // return to list
            currentViewState = 'list';
            render();
        }
    };

    // Initial render
    render();
});
