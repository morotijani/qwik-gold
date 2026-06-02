// assets/js/modules/customers.js

/**
 * Customers Module
 */
window.addEventListener('route-changed', async (e) => {
    if (e.detail.route !== 'customers') return;

    const container = e.detail.container;

    // View State: 'list', 'create', 'view'
    let currentViewState = 'list';
    let viewingCustomerId = null;

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
        viewingCustomerId = id;
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
                                        <td><strong>GHS ${parseFloat(l.principal_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></td>
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
                            <button class="btn btn-primary" onclick="window.openCustomerIssueLoanModal(${data.profile.id})" style="padding: 8px 16px; border-radius: 6px; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <span class="material-symbols-outlined" style="font-size: 18px;">payments</span> Issue Loan
                            </button>
                            <button class="btn btn-text" onclick='window.openEditCustomerModal(${JSON.stringify(data.profile).replace(/'/g, "&#39;")})' style="background: transparent; border: 1px solid var(--border, #333); color: var(--text-main); padding: 8px 16px; border-radius: 6px; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">
                                <span class="material-symbols-outlined" style="font-size: 18px;">edit</span> Edit
                            </button>
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
                        <div style="padding: 16px 24px; font-weight: 600; border-bottom: 1px solid var(--border, #333); font-size: initial;">
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
                            <div style="font-size: 2rem; font-weight: bold; color: #ff6b6b;">GHS ${Number(data.active_debt.total_amount_ghs || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted, #aaa); margin-top: 8px;">Spread across ${data.active_debt.loans ? data.active_debt.loans.length : 0} active loan(s)</div>
                        </div>
                        <div style="border: 1px solid var(--border, #333); border-radius: 16px; padding: 24px; border-top: 4px solid #4cd137; background: transparent;">
                            <div style="color: var(--text-muted, #aaa); font-size: 0.9rem; margin-bottom: 8px;">Total Settled Loans</div>
                            <div style="font-size: 2rem; font-weight: bold; color: #4cd137;">GHS ${Number(data.total_settled_ghs || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted, #aaa); margin-top: 8px;">Historical lifetime value</div>
                        </div>
                    </div>

                    <!-- Loan History Card -->
                    <div style="border: 1px solid var(--border, #333); border-radius: 16px; overflow: hidden;">
                        <div style="padding: 16px 24px; font-weight: 600; border-bottom: 1px solid var(--border, #333); font-size: initial; display: flex; justify-content: space-between; align-items: center;">
                            <span>Complete Loan History</span>
                            <span class="material-symbols-outlined" style="color: var(--text-muted, #aaa); font-size: initial;">account_balance_wallet</span>
                        </div>
                        <div style="max-height: 400px; overflow-y: auto;">
                            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                                <thead style="position: sticky; top: 0; background: transparent; z-index: 1;">
                                    <tr>
                                        <th style="padding: 16px 24px; font-weight: 500; color: var(--text-muted, #aaa); border-bottom: 1px solid var(--border, #333);">No.</th>
                                        <th style="padding: 16px 24px; font-weight: 500; color: var(--text-muted, #aaa); border-bottom: 1px solid var(--border, #333);">Loan ID</th>
                                        <th style="padding: 16px 24px; font-weight: 500; color: var(--text-muted, #aaa); border-bottom: 1px solid var(--border, #333);">Date</th>
                                        <th style="padding: 16px 24px; font-weight: 500; color: var(--text-muted, #aaa); border-bottom: 1px solid var(--border, #333);">Amount</th>
                                        <th style="padding: 16px 24px; font-weight: 500; color: var(--text-muted, #aaa); border-bottom: 1px solid var(--border, #333);">Type</th>
                                        <th style="padding: 16px 24px; font-weight: 500; color: var(--text-muted, #aaa); border-bottom: 1px solid var(--border, #333);">Status</th>
                                        <th style="padding: 16px 24px; font-weight: 500; color: var(--text-muted, #aaa); border-bottom: 1px solid var(--border, #333);">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.all_loans && data.all_loans.length > 0 ? data.all_loans.map((l, index) => {
                const statusColor = l.status === 'active' ? '#ff6b6b' : '#4cd137';
                const statusBg = l.status === 'active' ? 'rgba(255, 107, 107, 0.1)' : 'rgba(76, 209, 55, 0.1)';
                let goldTypeStr = '';
                if (l.type === 'collateral' && data.current_kept_gold) {
                    const types = [];
                    if (data.current_kept_gold.refined_grams > 0) types.push('Refined');
                    if (data.current_kept_gold.balls_grams > 0) types.push('Balls');
                    if (types.length > 0) {
                        goldTypeStr = ` (${types.join(' & ')})`;
                    }
                }
                return `
                                        <tr style="border-bottom: 1px solid var(--border, #333); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                            <td style="padding: 16px 24px; color: var(--text-muted);">${index + 1}</td>
                                            <td style="padding: 16px 24px; font-weight: 500;"><a href="#" onclick="window.openLoanDetailsModal(${l.id}); return false;" style="color: var(--gold-primary); text-decoration: none;">${l.loan_uid || 'LN-'+l.id}</a></td>
                                            <td style="padding: 16px 24px;">${new Date(l.created_at).toLocaleDateString()}</td>
                                            <td style="padding: 16px 24px; font-weight: 600;">GHS ${parseFloat(l.principal_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td style="padding: 16px 24px; text-transform: capitalize;">${l.type}${goldTypeStr}</td>
                                            <td style="padding: 16px 24px;">
                                                <span style="background: ${statusBg}; color: ${statusColor}; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">
                                                    ${l.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style="padding: 16px 24px;">
                                                ${l.status === 'active' ? `<button class="btn btn-sm btn-outline" onclick="window.openCustomerSettleModal(${l.id}, ${data.profile.id}, '${l.type}', ${l.principal_amount})" style="font-size: 0.8rem; padding: 4px 12px; border-color: var(--success); color: var(--success);">Settle</button>` : '-'}
                                            </td>
                                        </tr>
                                        `}).join('') : `<tr><td colspan="7" style="padding: 32px; text-align: center; color: var(--text-muted);">No loan history found.</td></tr>`}
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

    window.openEditCustomerModal = (profile) => {
        document.getElementById('modal-title').textContent = 'Update Customer Details';
        const modalBody = document.getElementById('modal-body');

        modalBody.innerHTML = `
            <form id="edit-customer-form" onsubmit="window.submitEditCustomer(event, ${profile.id})">
                <div class="form-group">
                    <label>Customer Full Name <span style="color: var(--danger);">*</span></label>
                    <input type="text" id="edit_customer_name" required value="${profile.name}">
                </div>
                
                <div class="form-group">
                    <label>Business Name <span style="color: var(--text-muted); font-size: 0.8rem;">(Optional)</span></label>
                    <input type="text" id="edit_customer_business" value="${profile.business_name || ''}">
                </div>

                <div class="form-group">
                    <label>Entity Type</label>
                    <select id="edit_customer_entity" required>
                        <option value="individual" ${profile.entity_type === 'individual' ? 'selected' : ''}>Individual</option>
                        <option value="group" ${profile.entity_type === 'group' ? 'selected' : ''}>Group / Company</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Phone Number <span style="color: var(--danger);">*</span></label>
                    <input type="text" id="edit_customer_phone" required value="${profile.phone || ''}">
                </div>

                <div class="form-group">
                    <label>Email Address <span style="color: var(--text-muted); font-size: 0.8rem;">(Optional)</span></label>
                    <input type="email" id="edit_customer_email" value="${profile.email || ''}">
                </div>
                
                <div class="form-group">
                    <label>Physical Address <span style="color: var(--text-muted); font-size: 0.8rem;">(Optional)</span></label>
                    <textarea id="edit_customer_address" rows="2">${profile.address || ''}</textarea>
                </div>
                
                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 20px;">
                    <span class="material-symbols-outlined">save</span> Save Changes
                </button>
            </form>
        `;

        document.getElementById('global-modal').classList.add('active');
    };

    window.submitEditCustomer = async (event, customerId) => {
        event.preventDefault();
        const btn = event.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Saving...';

        const payload = {
            id: customerId,
            name: document.getElementById('edit_customer_name').value,
            business_name: document.getElementById('edit_customer_business').value,
            entity_type: document.getElementById('edit_customer_entity').value,
            phone: document.getElementById('edit_customer_phone').value,
            email: document.getElementById('edit_customer_email').value,
            address: document.getElementById('edit_customer_address').value
        };

        try {
            await window.api.post('/customers/update.php', payload);
            window.showToast('Customer details updated successfully', 'success');
            window.closeModal();
            // Refresh customer view using the current route to return correctly
            const currentHash = window.location.hash.substring(1) || 'customers';
            window.viewCustomer(customerId, currentHash);
        } catch (error) {
            console.error('Error updating customer:', error);
            window.showToast(error.message || 'Network error', 'error');
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">save</span> Save Changes';
        }
    };

    window.addEventListener('transaction-completed', () => {
        if (currentViewState === 'view' && viewingCustomerId) {
            const currentHash = window.location.hash.substring(1) || 'customers';
            window.viewCustomer(viewingCustomerId, currentHash);
        } else if (currentViewState === 'list') {
            render();
        }
    });

    window.openCustomerIssueLoanModal = (customerId) => {
        if (typeof window.loadTxForm === 'function') {
            window.loadTxForm('issue_loan', { customerId: customerId });
        } else {
            window.showToast('Transactions module not loaded', 'error');
        }
    };

    window._settleWizardState = {
        step: 1,
        loanId: null,
        customerId: null,
        loanType: null,
        principalAmount: 0,
        settleType: '',
        cashAmount: '',
        goldType: 'refined',
        weightGrams: '',
        pricePerPound: '',
        pricePerBall: '',
        calcTotalGhs: 0,
        collateralGoldType: '',
        collateralGramsToUse: '',
        collateralAgreedValue: '',
        availableCollateral: [],
        comment: ''
    };

    window.openCustomerSettleModal = async (loanId, customerId, loanType, principalAmount) => {
        window._settleWizardState = {
            step: 1,
            profile: null,
            loanId: loanId,
            customerId: customerId,
            loanType: loanType,
            principalAmount: parseFloat(principalAmount) || 0,

            settleType: '', // 'cash', 'walkin', 'collateral'

            // Cash State
            cashAmount: parseFloat(principalAmount) || 0,

            // Walk-in State
            goldType: 'refined',
            weightGrams: '',
            volume: '',
            pricePerPound: '',
            pricePerBall: '',
            calculatedPounds: 0,
            calculatedDensity: 0,
            calculatedKarat: 0,
            calculatedBlades: 0,
            calcTotalGhs: 0,

            // Collateral State
            collateralGoldType: '',
            collateralGramsToUse: '',
            collateralAgreedValue: '',
            availableCollateral: [],
            comment: ''
        };

        document.getElementById('modal-title').textContent = 'Settle Loan';
        document.getElementById('modal-body').innerHTML = '<div style="text-align:center; padding: 40px;"><span class="material-symbols-outlined spin gold-text" style="font-size: 2rem;">sync</span><div style="margin-top:10px; color:var(--text-muted);">Fetching details...</div></div>';
        document.getElementById('global-modal').classList.add('active');

        if (loanType === 'collateral') {
            try {
                const res = await window.api.get(`/customers/view.php?customer_id=${customerId}`);
                if (res.status === 'success' && res.data.current_kept_gold) {
                    const available = [];
                    if (res.data.current_kept_gold.balls_grams > 0) {
                        available.push({ gold_type: 'balls', weight_grams: res.data.current_kept_gold.balls_grams });
                    }
                    if (res.data.current_kept_gold.refined_grams > 0) {
                        available.push({ gold_type: 'refined', weight_grams: res.data.current_kept_gold.refined_grams });
                    }
                    window._settleWizardState.availableCollateral = available;
                }
            } catch (e) {
                console.warn('Could not fetch collateral', e);
            }
        }

        window.renderSettleWizardStep();
    };

    window.updateSettleState = (key, value) => {
        window._settleWizardState[key] = value;
        if (key === 'settleType') {
            window.renderSettleWizardStep();
        } else {
            if (window.validateSettleWizardStep) window.validateSettleWizardStep();
        }
    };

    window.validateSettleWizardStep = () => {
        const s = window._settleWizardState;
        const btn = document.getElementById('btn-preview-summary');
        if (!btn) return;

        let canProceed = false;
        if (s.settleType === 'cash' && parseFloat(s.cashAmount) > 0) canProceed = true;
        if (s.settleType === 'walkin' && parseFloat(s.weightGrams) > 0 && s.calcTotalGhs > 0) canProceed = true;
        if (s.settleType === 'collateral' && s.collateralGoldType && parseFloat(s.collateralGramsToUse) > 0 && parseFloat(s.collateralAgreedValue) > 0) canProceed = true;

        btn.disabled = !canProceed;
    };

    window.handleSettleGoldTypeChange = (type) => {
        window.updateSettleState('goldType', type);
        window.updateSettleState('weightGrams', '');
        window.updateSettleState('volume', '');
        window.updateSettleState('pricePerPound', '');
        window.updateSettleState('pricePerBall', '');
        window.calcSettleMath();
        window.renderSettleWizardStep();
    };

    window.calcSettleMath = () => {
        const s = window._settleWizardState;
        const weight = parseFloat(s.weightGrams) || 0;
        const truncate2 = (num) => Math.floor(num * 100) / 100;
        let total = 0;

        if (s.goldType === 'refined') {
            const volume = parseFloat(s.volume) || 0;
            const price = parseFloat(s.pricePerPound) || 0;

            s.calculatedPounds = truncate2(weight / 7.75);
            s.calculatedDensity = volume > 0 ? truncate2(weight / volume) : 0;

            if (s.calculatedDensity > 0) {
                s.calculatedKarat = truncate2(((s.calculatedDensity - 10.51) * 52.838) / s.calculatedDensity);
            } else {
                s.calculatedKarat = 0;
            }
            total = (s.calculatedKarat * price / 23) * s.calculatedPounds;

            if (document.getElementById('settle_calc_density')) document.getElementById('settle_calc_density').textContent = s.calculatedDensity.toFixed(2);
            if (document.getElementById('settle_calc_pounds')) document.getElementById('settle_calc_pounds').textContent = s.calculatedPounds.toFixed(2);
            if (document.getElementById('settle_calc_karat')) document.getElementById('settle_calc_karat').textContent = typeof s.calculatedKarat === 'number' ? s.calculatedKarat.toFixed(2) : '0.00';
        } else {
            const price = parseFloat(s.pricePerBall) || 0;
            s.calculatedBlades = weight / 0.8;
            total = s.calculatedBlades * price;

            if (document.getElementById('settle_calc_blades')) document.getElementById('settle_calc_blades').textContent = s.calculatedBlades.toFixed(4);
        }

        s.calcTotalGhs = total;

        const displayEl = document.getElementById('settle_calc_total');
        if (displayEl) {
            displayEl.textContent = total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        if (window.validateSettleWizardStep) window.validateSettleWizardStep();
    };

    window.autoFillCollateral = () => {
        const s = window._settleWizardState;
        if (!s.collateralGoldType) return;

        const match = s.availableCollateral.find(v => v.gold_type === s.collateralGoldType);
        if (match) {
            s.collateralGramsToUse = match.weight_grams;
            const inputEl = document.getElementById('sc_grams');
            if (inputEl) {
                inputEl.value = match.weight_grams;
            }
        }
    };

    window.renderSettleWizardStep = () => {
        const s = window._settleWizardState;
        const body = document.getElementById('modal-body');
        let html = '';

        if (s.step === 1) {
            html += `
                <div style="margin-bottom: 24px; text-align: center;">
                    <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem;">Outstanding Principal Amount</p>
                    <h2 style="margin: 5px 0 0 0; color: var(--text-color); font-size: 2rem;">GH₵ ${s.principalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                </div>
                
                <h3 style="margin: 0 0 16px 0; font-size: initial;">Select Settlement Method</h3>
                <div style="display: flex; gap: 12px; margin-bottom: 24px;">
                    <button class="btn btn-outline" style="flex: 1; padding: 16px; ${s.settleType === 'cash' ? 'background: rgba(33, 150, 243, 0.1); border-color: var(--info);' : ''}" onclick="window.updateSettleState('settleType', 'cash')">
                        <span class="material-symbols-outlined" style="display: block; font-size: 24px; margin-bottom: 8px; color: var(--info);">payments</span>
                        Cash Repayment
                    </button>
                    <button class="btn btn-outline" style="flex: 1; padding: 16px; ${s.settleType === 'walkin' ? 'background: rgba(76, 175, 80, 0.1); border-color: var(--success);' : ''}" onclick="window.updateSettleState('settleType', 'walkin')">
                        <span class="material-symbols-outlined" style="display: block; font-size: 24px; margin-bottom: 8px; color: var(--success);">balance</span>
                        Walk-in Gold
                    </button>
                    ${s.loanType === 'collateral' ? `
                    <button class="btn btn-outline" style="flex: 1; padding: 16px; ${s.settleType === 'collateral' ? 'background: rgba(255, 193, 7, 0.1); border-color: var(--gold-primary);' : ''}" onclick="window.updateSettleState('settleType', 'collateral')">
                        <span class="material-symbols-outlined" style="display: block; font-size: 24px; margin-bottom: 8px; color: var(--gold-primary);">key</span>
                        Vault Collateral
                    </button>
                    ` : ''}
                </div>
                
                <button class="btn btn-primary btn-block" ${!s.settleType ? 'disabled' : ''} onclick="window._settleWizardState.step = 2; window.renderSettleWizardStep()">Next Step <span class="material-symbols-outlined">arrow_forward</span></button>
            `;
        }
        else if (s.step === 2) {
            html += `
                <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                    <button class="btn btn-icon" style="padding: 4px;" onclick="window._settleWizardState.step = 1; window.renderSettleWizardStep()"><span class="material-symbols-outlined">arrow_back</span></button>
                    <h3 style="margin: 0;">Enter Settlement Details</h3>
                </div>
            `;

            if (s.settleType === 'cash') {
                html += `
                    <div class="form-group">
                        <label style="display: flex; justify-content: space-between; align-items: center;">
                            <span>Amount Paid (GHS) <span style="color: var(--danger);">*</span></span>
                            <button class="btn btn-sm btn-text" style="padding: 0; color: var(--info);" onclick="window.updateSettleState('cashAmount', ${s.principalAmount}); window.renderSettleWizardStep()">Pay All</button>
                        </label>
                        <input type="number" step="0.01" min="0" max="${s.principalAmount}" value="${s.cashAmount}" oninput="if(this.value < 0) this.value = 0; if(this.value > ${s.principalAmount}) this.value = ${s.principalAmount}; window.updateSettleState('cashAmount', this.value)" placeholder="Max GH₵ ${s.principalAmount}">
                    </div>
                `;
            } else if (s.settleType === 'walkin') {
                html += `
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="margin-bottom: 8px;">Gold Type</label>
                        <div class="segmented-control">
                            <label class="segment-label">
                                <input type="radio" name="sw_gold_type" value="refined" ${s.goldType === 'refined' ? 'checked' : ''} onchange="window.handleSettleGoldTypeChange('refined')"> 
                                <span>Refined Gold</span>
                            </label>
                            <label class="segment-label">
                                <input type="radio" name="sw_gold_type" value="balls" ${s.goldType === 'balls' ? 'checked' : ''} onchange="window.handleSettleGoldTypeChange('balls')"> 
                                <span>Gold Balls</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Weight (Grams)</label>
                        <input type="number" step="0.01" min="0" value="${s.weightGrams}" oninput="if(this.value < 0) this.value = 0; window.updateSettleState('weightGrams', this.value); window.calcSettleMath()">
                    </div>
                    
                    ${s.goldType === 'refined' ? `
                        <div class="form-group">
                            <label>Volume</label>
                            <input type="number" step="0.01" min="0" value="${s.volume}" oninput="if(this.value < 0) this.value = 0; window.updateSettleState('volume', this.value); window.calcSettleMath()">
                        </div>
                        <div class="form-group">
                            <label>Current Local Price (GHS)</label>
                            <input type="number" step="0.01" min="0" value="${s.pricePerPound}" oninput="if(this.value < 0) this.value = 0; window.updateSettleState('pricePerPound', this.value); window.calcSettleMath()">
                        </div>
                    ` : `
                        <div class="form-group">
                            <label>Price per Blade (GHS)</label>
                            <input type="number" step="0.01" min="0" value="${s.pricePerBall}" oninput="if(this.value < 0) this.value = 0; window.updateSettleState('pricePerBall', this.value); window.calcSettleMath()">
                        </div>
                    `}
                    
                    ${s.goldType === 'refined' ? `
                    <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                        <div style="flex: 1; background: rgba(0,0,0,0.03); padding: 10px; border-radius: 6px; text-align: center;">
                            <div style="font-size: 0.8rem; color: var(--text-muted);">Pounds</div>
                            <div id="settle_calc_pounds" style="font-weight: 600;">${(Number(s.calculatedPounds) || 0).toFixed(2)}</div>
                        </div>
                        <div style="flex: 1; background: rgba(0,0,0,0.03); padding: 10px; border-radius: 6px; text-align: center;">
                            <div style="font-size: 0.8rem; color: var(--text-muted);">Density</div>
                            <div id="settle_calc_density" style="font-weight: 600;">${(Number(s.calculatedDensity) || 0).toFixed(2)}</div>
                        </div>
                        <div style="flex: 1; background: rgba(0,0,0,0.03); padding: 10px; border-radius: 6px; text-align: center;">
                            <div style="font-size: 0.8rem; color: var(--text-muted);">Karat</div>
                            <div id="settle_calc_karat" style="font-weight: 600;">${(Number(s.calculatedKarat) || 0).toFixed(2)}</div>
                        </div>
                    </div>
                    ` : `
                    <div style="background: rgba(0,0,0,0.03); padding: 10px; border-radius: 6px; text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Total Blades</div>
                        <div id="settle_calc_blades" style="font-weight: 600;">${(Number(s.calculatedBlades) || 0).toFixed(4)}</div>
                    </div>
                    `}
                    
                    <div style="background: rgba(255, 193, 7, 0.1); border: 1px dashed var(--gold-primary); padding: 16px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
                        <div style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 4px;">Calculated Total Value</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--gold-primary);">GH₵ <span id="settle_calc_total">${s.calcTotalGhs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    </div>
                `;
            } else if (s.settleType === 'collateral') {
                if (s.availableCollateral.length === 0) {
                    html += `<div style="padding: 20px; background: rgba(244, 67, 54, 0.1); color: var(--danger); border-radius: 8px; margin-bottom: 20px;">No active collateral found in the vault for this customer.</div>`;
                } else {
                    html += `
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label style="margin-bottom: 8px;">Select Collateral Type to Use</label>
                            <div class="segmented-control">
                                ${s.availableCollateral.map(c => `
                                    <label class="segment-label">
                                        <input type="radio" name="sc_col_type" value="${c.gold_type}" ${s.collateralGoldType === c.gold_type ? 'checked' : ''} onchange="window.updateSettleState('collateralGoldType', '${c.gold_type}')">
                                        <span style="text-transform: capitalize;">${c.gold_type} (${c.weight_grams}g)</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label style="display: flex; justify-content: space-between; align-items: center;">
                                Grams to Use 
                                ${s.collateralGoldType ? `<button class="btn btn-sm btn-text" style="padding: 0; color: var(--gold-primary);" onclick="window.autoFillCollateral()">Use All Available</button>` : ''}
                            </label>
                            <input type="number" step="0.01" min="0" id="sc_grams" value="${s.collateralGramsToUse}" oninput="if(this.value < 0) this.value = 0; window.updateSettleState('collateralGramsToUse', this.value)">
                        </div>
                        <div class="form-group">
                            <label>Agreed Value (GHS)</label>
                            <input type="number" step="0.01" min="0" value="${s.collateralAgreedValue}" oninput="if(this.value < 0) this.value = 0; window.updateSettleState('collateralAgreedValue', this.value)">
                        </div>
                    `;

                    if (!s.collateralGoldType && s.availableCollateral.length === 1) {
                        setTimeout(() => {
                            window.updateSettleState('collateralGoldType', s.availableCollateral[0].gold_type);
                            window.renderSettleWizardStep();
                        }, 50);
                    }
                }
            }

            html += `
                <div class="form-group">
                    <label>Settlement Note / Comment <span style="color: var(--text-muted); font-size: 0.8rem;">(Optional)</span></label>
                    <textarea rows="2" placeholder="Add a comment for this settlement" oninput="window.updateSettleState('comment', this.value)">${s.comment}</textarea>
                </div>
            `;

            let canProceed = false;
            if (s.settleType === 'cash' && parseFloat(s.cashAmount) > 0) canProceed = true;
            if (s.settleType === 'walkin' && parseFloat(s.weightGrams) > 0 && s.calcTotalGhs > 0) canProceed = true;
            if (s.settleType === 'collateral' && s.collateralGoldType && parseFloat(s.collateralGramsToUse) > 0 && parseFloat(s.collateralAgreedValue) > 0) canProceed = true;

            html += `<button id="btn-preview-summary" class="btn btn-primary btn-block" ${!canProceed ? 'disabled' : ''} onclick="window._settleWizardState.step = 3; window.renderSettleWizardStep()">Preview Summary <span class="material-symbols-outlined">arrow_forward</span></button>`;
        }
        else if (s.step === 3) {
            let typeLabel = '';
            let amountGhs = 0;
            let themeColor = '';

            if (s.settleType === 'cash') {
                typeLabel = 'Cash Repayment';
                amountGhs = parseFloat(s.cashAmount);
                themeColor = '#212121';
            } else if (s.settleType === 'walkin') {
                typeLabel = 'Walk-in Gold Offset';
                amountGhs = s.calcTotalGhs;
                themeColor = 'var(--success)';
            } else {
                typeLabel = 'Vault Collateral Offset';
                amountGhs = parseFloat(s.collateralAgreedValue);
                themeColor = 'var(--gold-primary)';
            }

            const newBal = Math.max(0, s.principalAmount - amountGhs);
            const statusBadge = newBal === 0 ? '<span style="background: rgba(76,175,80,0.2); color: #4caf50; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">FULLY SETTLED</span>' : '<span style="background: rgba(33,150,243,0.2); color: #2196f3; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">PARTIAL PAYMENT</span>';

            let detailsStr = '';
            if (s.settleType === 'walkin') {
                if (s.goldType === 'refined') {
                    detailsStr = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem;">
                        <span style="color: var(--text-muted);">Weight & Volume</span>
                        <span>${s.weightGrams}g / ${s.volume}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem;">
                        <span style="color: var(--text-muted);">Density & Karat</span>
                        <span>${s.calculatedDensity.toFixed(2)} / ${typeof s.calculatedKarat === 'number' ? s.calculatedKarat.toFixed(2) : '0.00'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.9rem; padding-bottom: 12px; border-bottom: 1px dashed var(--border);">
                        <span style="color: var(--text-muted);">Pounds & Price</span>
                        <span>${s.calculatedPounds.toFixed(2)} @ ₵${s.pricePerPound}</span>
                    </div>`;
                } else {
                    detailsStr = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem;">
                        <span style="color: var(--text-muted);">Weight</span>
                        <span>${s.weightGrams}g</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.9rem; padding-bottom: 12px; border-bottom: 1px dashed var(--border);">
                        <span style="color: var(--text-muted);">Blades & Price</span>
                        <span>${s.calculatedBlades.toFixed(4)} @ ₵${s.pricePerBall}</span>
                    </div>`;
                }
            }

            html += `
                <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                    <button class="btn btn-icon" style="padding: 4px;" onclick="window._settleWizardState.step = 2; window.renderSettleWizardStep()"><span class="material-symbols-outlined">arrow_back</span></button>
                    <h3 style="margin: 0;">Summary & Confirm</h3>
                </div>
                
                <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <span style="color: var(--text-muted);">Action</span>
                        <span style="font-weight: 600;">${typeLabel}</span>
                    </div>
                    ${detailsStr}
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <span style="color: var(--text-muted);">Previous Owed</span>
                        <span>GH₵ ${s.principalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed var(--border);">
                        <span style="color: var(--text-muted);">Payment/Value</span>
                        <span style="color: ${s.settleType === 'cash' ? 'var(--info)' : 'var(--success)'}; font-weight: 600;">- GH₵ ${amountGhs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: var(--text-muted);">New Balance</span>
                        <div style="text-align: right;">
                            <div style="font-weight: 700; font-size: 1.2rem;">GH₵ ${newBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            ${statusBadge}
                        </div>
                    </div>
                    ${s.comment ? `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed var(--border); font-size: 0.9rem; color: var(--text-muted);"><em>" ${s.comment} "</em></div>` : ''}
                </div>
                
                <button id="btn-submit-settle" class="btn btn-block" style="background: ${themeColor}; color: #fff; padding: 14px; font-size: 1.05rem; font-weight: 600;" onclick="window.submitSettleWizard()">
                    Confirm & Settle Loan
                </button>
            `;
        }
        body.innerHTML = html;
    };

    window.submitSettleWizard = async () => {
        const s = window._settleWizardState;
        const btn = document.getElementById('btn-submit-settle');
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';

        try {
            let endpoint = '';
            let payload = {};

            if (s.settleType === 'cash') {
                endpoint = '/loans/repay_cash.php';
                payload = {
                    loan_id: s.loanId,
                    amount_paid_ghs: parseFloat(s.cashAmount),
                    comment: s.comment
                };
            } else if (s.settleType === 'walkin') {
                endpoint = '/loans/offset.php';
                payload = {
                    loan_id: s.loanId,
                    customer_id: s.customerId,
                    gold_type: s.goldType,
                    weight_grams: parseFloat(s.weightGrams),
                    gold_value_ghs: s.calcTotalGhs,
                    comment: s.comment
                };
                if (s.goldType === 'refined') {
                    payload.volume = parseFloat(s.volume) || 0;
                    payload.current_local_price = parseFloat(s.pricePerPound) || 0;
                    payload.pounds = s.calculatedPounds || 0;
                    payload.density = s.calculatedDensity || 0;
                    payload.karat = s.calculatedKarat || 0;
                } else if (s.goldType === 'balls') {
                    payload.price_per_blade = parseFloat(s.pricePerBall) || 0;
                    payload.total_blades = s.calculatedBlades || 0;
                }
            } else if (s.settleType === 'collateral') {
                endpoint = '/loans/offset_collateral.php';
                payload = {
                    loan_id: s.loanId,
                    customer_id: s.customerId,
                    gold_type: s.collateralGoldType,
                    grams_to_use: parseFloat(s.collateralGramsToUse),
                    agreed_value_ghs: parseFloat(s.collateralAgreedValue),
                    comment: s.comment
                };
            }

            await window.api.post(endpoint, payload);
            window.showToast('Loan settled successfully!', 'success');
            window.closeModal();
            window.dispatchEvent(new Event('transaction-completed'));

        } catch (e) {
            window.showToast(e.message || 'Error settling loan', 'error');
            btn.disabled = false;
            btn.innerHTML = 'Confirm & Settle Loan';
        }
    };
});
