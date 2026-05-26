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
                    <td>${c.contact_info || 'N/A'}</td>
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
                        <label>Full Name or Business Name</label>
                        <input type="text" id="cust-name" required placeholder="e.g. Kwame Mensah">
                    </div>
                    
                    <div class="form-group">
                        <label>Entity Type</label>
                        <select id="cust-type" required>
                            <option value="individual">Individual</option>
                            <option value="group">Group / Company</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Contact Information</label>
                        <textarea id="cust-contact" rows="3" placeholder="Phone number, address, etc."></textarea>
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
                    type: document.getElementById('cust-type').value,
                    contact_info: document.getElementById('cust-contact').value
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
    window.viewCustomer = async (id) => {
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
                <div style="max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px;">
                    <!-- Header Bar -->
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--gold-primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold;">
                                ${data.profile.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 style="font-size: 2rem; margin-bottom: 4px;">${data.profile.name}</h2>
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    <span class="badge badge-outline">${data.profile.type}</span>
                                    <span style="color: var(--text-muted); font-size: 0.9rem;">Joined ${new Date(data.profile.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-outline" onclick="window.location.hash = '#customers'; window.dispatchEvent(new CustomEvent('route-changed', {detail:{route:'customers', container: document.getElementById('view-container')}}))">
                            <span class="material-symbols-outlined">arrow_back</span> Return
                        </button>
                    </div>

                    <!-- Main Content Grid -->
                    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 24px;">
                        
                        <!-- Left Sidebar (Contact & Inventory) -->
                        <div style="display: flex; flex-direction: column; gap: 24px;">
                            <div class="glass-panel" style="padding: 24px;">
                                <h3 style="font-size: 1.1rem; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 16px;">Contact Information</h3>
                                <div style="display: flex; align-items: flex-start; gap: 12px;">
                                    <span class="material-symbols-outlined" style="color: var(--text-muted);">contact_phone</span>
                                    <div style="line-height: 1.5; color: var(--text-main);">
                                        ${data.profile.contact_info ? data.profile.contact_info.replace(/\n/g, '<br>') : '<span style="color: var(--text-muted);">No contact provided</span>'}
                                    </div>
                                </div>
                            </div>

                            <div class="glass-panel" style="padding: 24px;">
                                <h3 style="font-size: 1.1rem; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 16px;">Vault Inventory</h3>
                                <div style="display: flex; flex-direction: column; gap: 16px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="color: var(--text-muted);">Balls Gold</span>
                                        <strong style="font-size: 1.1rem;">${parseFloat(data.current_kept_gold.balls_grams).toFixed(2)} g</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="color: var(--text-muted);">Refined Gold</span>
                                        <strong style="font-size: 1.1rem;">${parseFloat(data.current_kept_gold.refined_grams).toFixed(2)} g</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Right Main Content (Debt & History) -->
                        <div style="display: flex; flex-direction: column; gap: 24px;">
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <div class="glass-panel" style="padding: 24px; border-top: 4px solid var(--danger);">
                                    <div style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 8px;">Total Active Debt</div>
                                    <div style="font-size: 2rem; font-weight: bold; color: var(--danger);">GHS ${Number(data.active_debt.total_amount_ghs).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 8px;">Spread across ${data.active_debt.loans ? data.active_debt.loans.length : 0} active loan(s)</div>
                                </div>
                                <div class="glass-panel" style="padding: 24px; border-top: 4px solid var(--success);">
                                    <div style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 8px;">Total Settled Loans</div>
                                    <div style="font-size: 2rem; font-weight: bold; color: var(--success);">GHS ${Number(data.total_settled_ghs || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 8px;">Historical lifetime value</div>
                                </div>
                            </div>

                            <div style="margin-top: 8px;">
                                <h3 style="font-size: 1.1rem; border-bottom: 1px solid var(--border); padding-bottom: 12px;">Complete Loan History</h3>
                                ${loansHtml}
                            </div>
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
