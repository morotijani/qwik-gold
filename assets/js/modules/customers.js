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
            
            // Render Profile
            container.innerHTML = `
                <div style="display: flex; gap: 24px; flex-wrap: wrap;">
                    <!-- Left: Profile Info -->
                    <div class="glass-panel" style="padding: 24px; flex: 1; min-width: 300px;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <h2 style="font-size: 2rem; margin-bottom: 8px;">${data.profile.name}</h2>
                                <span class="badge badge-outline" style="margin-bottom: 16px; display: inline-block;">${data.profile.type}</span>
                            </div>
                            <button class="btn btn-outline" onclick="window.dispatchEvent(new CustomEvent('route-changed', {detail:{route:'customers', container: document.getElementById('view-container')}}))">
                                <span class="material-symbols-outlined">arrow_back</span> Back
                            </button>
                        </div>
                        <p style="margin-bottom: 24px;"><strong>Contact:</strong> <br>${data.profile.contact_info || 'No contact provided'}</p>
                        <p style="font-size: 0.8rem;">Joined: ${new Date(data.profile.created_at).toLocaleDateString()}</p>
                    </div>

                    <!-- Right: Financial Summary -->
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 24px; min-width: 300px;">
                        
                        <!-- Debt Card -->
                        <div class="glass-panel" style="padding: 24px; border-left: 4px solid var(--danger);">
                            <h3 style="margin-bottom: 8px;">Active Debt</h3>
                            <div style="font-size: 2rem; font-weight: 700; color: var(--danger); margin-bottom: 8px;">
                                GHS ${Number(data.active_debt.total_amount_ghs).toFixed(2)}
                            </div>
                            <div style="font-size: 0.9rem; color: var(--text-muted);">
                                Spread across ${data.active_debt.loans.length} active loan(s)
                            </div>
                        </div>

                        <!-- Kept Gold Card -->
                        <div class="glass-panel" style="padding: 24px; border-left: 4px solid var(--gold-primary);">
                            <h3 style="margin-bottom: 8px;">Vault Inventory</h3>
                            <div style="display: flex; justify-content: space-between; margin-top: 16px;">
                                <div>
                                    <div style="font-size: 0.9rem; color: var(--text-muted);">Balls</div>
                                    <div style="font-size: 1.5rem; font-weight: 600;">${data.current_kept_gold.balls_grams.toFixed(2)} g</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.9rem; color: var(--text-muted);">Refined</div>
                                    <div style="font-size: 1.5rem; font-weight: 600;">${data.current_kept_gold.refined_grams.toFixed(2)} g</div>
                                </div>
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
