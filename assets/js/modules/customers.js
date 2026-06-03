// assets/js/modules/customers.js

window.addEventListener('route-changed', async (e) => {
    if (e.detail.route !== 'customers') return;
    const container = e.detail.container;

    container.innerHTML = `
        <div style="display: flex; justify-content: center; padding: 40px;">
            <span class="material-symbols-outlined spin" style="font-size: 2rem; color: var(--gold-primary);">sync</span>
        </div>
    `;

    const render = async () => {
        try {
            const customers = await window.api.get('/customers/list.php');

            container.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 class="page-title" style="margin: 0;">Customer Directory</h2>
                    <button class="btn btn-primary" onclick="window.openCreateCustomerModal()">
                        <span class="material-symbols-outlined">person_add</span> Add Contact
                    </button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 16px;">
                    ${customers.length === 0 ? '<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center;">No customers found.</p>' : ''}
                    ${customers.map(c => `
                        <div class="contact-card">
                            <div class="contact-left">
                                <div class="contact-avatar" style="background: var(--info-bg); color: var(--info);">
                                    ${c.name.charAt(0).toUpperCase()}
                                </div>
                                <div class="contact-info">
                                    <div class="contact-name">${c.name}</div>
                                    <div class="contact-meta">${c.phone || 'No phone'} ${c.business_name ? `• ${c.business_name}` : ''}</div>
                                    <div class="contact-meta" style="font-size: 0.75rem; margin-top: 4px;">
                                        <span style="background: var(--bg-main); padding: 2px 6px; border-radius: 4px;">${c.customer_uid || '#' + c.id}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="contact-right">
                                <button class="btn btn-outline" style="border-radius: var(--radius-pill); padding: 6px 12px; font-size: 0.8rem;" onclick="window.viewCustomer(${c.id})">
                                    View Journey
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            console.error('Failed to load customers', error);
            container.innerHTML = `<div class="alert alert-danger">Failed to load directory.</div>`;
        }
    };

    window.openCreateCustomerModal = () => {
        const html = `
            <form id="create-customer-form">
                <div class="form-group">
                    <label>Full Name <span style="color: var(--danger);">*</span></label>
                    <input type="text" id="cust-name" required placeholder="e.g. Kwame Mensah">
                </div>
                
                <div class="form-group">
                    <label>Business Name <span style="color: var(--text-muted); font-size: 0.8rem; text-transform: none;">(Optional)</span></label>
                    <input type="text" id="cust-business" placeholder="e.g. Kwame Gold Enterprise">
                </div>
                
                <div style="display: flex; gap: 16px;">
                    <div class="form-group" style="flex: 1;">
                        <label>Phone Number</label>
                        <input type="tel" id="cust-phone" placeholder="e.g. 0244123456">
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label>Email Address</label>
                        <input type="email" id="cust-email" placeholder="e.g. kwame@example.com">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Physical Address</label>
                    <textarea id="cust-address" rows="3" placeholder="Enter full address"></textarea>
                </div>
                
                <div class="form-group">
                    <label>Customer Type</label>
                    <select id="cust-type">
                        <option value="individual" selected>Individual</option>
                        <option value="group">Group / Company</option>
                    </select>
                </div>
                
                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 24px;">
                    <span class="material-symbols-outlined">person_add</span> Register Contact
                </button>
            </form>
        `;

        window.openModal('Register New Contact', html);

        document.getElementById('create-customer-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Saving...';

            const payload = {
                name: document.getElementById('cust-name').value,
                business_name: document.getElementById('cust-business').value,
                phone: document.getElementById('cust-phone').value,
                email: document.getElementById('cust-email').value,
                address: document.getElementById('cust-address').value,
                type: document.getElementById('cust-type').value,
                entity_type: document.getElementById('cust-type').value, // Fallback to avoid breaking API
            };

            try {
                await window.api.post('/customers/create.php', payload);
                window.showToast('Contact successfully registered', 'success');
                window.closeModal();
                render();
            } catch (error) {
                window.showToast(error.message, 'error');
                btn.disabled = false;
                btn.innerHTML = '<span class="material-symbols-outlined">person_add</span> Register Contact';
            }
        });
    };

    window.viewCustomer = async (id, returnRoute = 'customers') => {
        container.innerHTML = `
            <div style="display: flex; justify-content: center; padding: 40px;">
                <span class="material-symbols-outlined spin" style="font-size: 2rem; color: var(--gold-primary);">sync</span>
            </div>
        `;
        try {
            const data = await window.api.get(`/customers/view.php?customer_id=${id}`);

            // Build Journey Map
            let journeyNodes = [];

            // Combine loans and sales into a unified timeline
            if (data.loans) {
                data.loans.forEach(loan => journeyNodes.push({ ...loan, _type: 'loan', _date: loan.created_at }));
            }
            if (data.sales) {
                data.sales.forEach(sale => journeyNodes.push({ ...sale, _type: 'sale', _date: sale.transaction_date }));
            }

            // Sort by most recent
            journeyNodes.sort((a, b) => new Date(b._date) - new Date(a._date));

            container.innerHTML = `
                <div style="max-width: 900px; margin: 0 auto; padding-bottom: 40px;">
                    <!-- Header Actions -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
                        <button class="btn btn-text" onclick="window.location.hash = '#${returnRoute}'; window.dispatchEvent(new CustomEvent('route-changed', {detail:{route:'${returnRoute}', container: document.getElementById('view-container')}}))">
                            <span class="material-symbols-outlined">arrow_back</span> Return to Directory
                        </button>
                        <div style="display: flex; gap: 12px;">
                            <button class="btn btn-outline" onclick='window.openEditCustomerModal(${JSON.stringify(data.profile).replace(/'/g, "&#39;")})' style="background: #ffffff;">
                                <span class="material-symbols-outlined">edit</span> Edit Contact
                            </button>
                            <button class="btn btn-primary" onclick="window.openCustomerIssueLoanModal(${data.profile.id})">
                                <span class="material-symbols-outlined">payments</span> Issue Loan
                            </button>
                        </div>
                    </div>

                    <!-- Profile Card -->
                    <div class="glass-panel" style="margin-bottom: 40px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 24px;">
                        <div style="display: flex; align-items: center; gap: 24px;">
                            <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--info-bg); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: var(--info); font-weight: 700;">
                                ${data.profile.name.charAt(0).toUpperCase()}
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <h3 style="font-size: 1.5rem; font-weight: 700; margin: 0; color: var(--text-main);">${data.profile.name}</h3>
                                <div style="display: flex; align-items: center; gap: 12px; color: var(--text-muted); font-size: 0.95rem;">
                                    <span>${data.profile.phone || 'No phone'}</span>
                                    ${data.profile.business_name ? `<span>• ${data.profile.business_name}</span>` : ''}
                                </div>
                                <div style="margin-top: 8px;">
                                    <span class="badge badge-outline">${data.profile.customer_uid || '#' + data.profile.id}</span>
                                    <span class="badge" style="background: var(--success-bg); color: var(--success); margin-left: 8px;">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Journey Flow -->
                    <h3 style="font-size: 1.1rem; margin-bottom: 24px; color: var(--text-main);">Customer Financial Journey</h3>
                    
                    <div class="journey-stream">
                        ${journeyNodes.length === 0 ? '<p style="color: var(--text-muted);">This customer has not started their financial journey yet.</p>' : ''}
                        ${journeyNodes.map(node => {
                if (node._type === 'loan') {
                    return `
                                <div class="journey-node">
                                    <div class="journey-dot warning"></div>
                                    <div class="journey-card" style="cursor: pointer;" onclick="window.viewLoanDetails(${node.id})">
                                        <div class="journey-card-left">
                                            <div class="journey-icon" style="background: var(--warning-bg); color: var(--warning);">
                                                <span class="material-symbols-outlined">account_balance_wallet</span>
                                            </div>
                                            <div class="journey-details">
                                                <div class="journey-title">Loan Issued</div>
                                                <div class="journey-date">${new Date(node.created_at).toLocaleString()}</div>
                                            </div>
                                        </div>
                                        <div class="journey-card-right">
                                            <div class="journey-amount" style="color: var(--warning);">${parseFloat(node.principal_ghs).toLocaleString(undefined, { minimumFractionDigits: 2 })} GHS</div>
                                            <div class="journey-ref" style="display: flex; gap: 8px; align-items: center;">
                                                <span class="badge badge-outline" style="font-size: 0.65rem;">${node.status.toUpperCase()}</span>
                                                <span style="background: var(--bg-main); padding: 2px 6px; border-radius: 4px;">LN-${String(node.id).padStart(6, '0')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                `;
                } else if (node._type === 'sale') {
                    return `
                                <div class="journey-node">
                                    <div class="journey-dot info"></div>
                                    <div class="journey-card">
                                        <div class="journey-card-left">
                                            <div class="journey-icon" style="background: var(--info-bg); color: var(--info);">
                                                <span class="material-symbols-outlined">add_shopping_cart</span>
                                            </div>
                                            <div class="journey-details">
                                                <div class="journey-title">Walk-In Sale (Gold)</div>
                                                <div class="journey-date">${new Date(node.transaction_date).toLocaleString()}</div>
                                            </div>
                                        </div>
                                        <div class="journey-card-right">
                                            <div class="journey-amount" style="color: var(--info);">${parseFloat(node.amount_paid_ghs).toLocaleString(undefined, { minimumFractionDigits: 2 })} GHS</div>
                                            <div class="journey-ref" style="display: flex; gap: 8px;">
                                                <span style="color: var(--text-muted);">${node.weight_grams}g @ ${node.density}</span>
                                                <span style="background: var(--bg-main); padding: 2px 6px; border-radius: 4px;">SL-${String(node.id).padStart(6, '0')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                `;
                }
            }).join('')}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error(error);
            container.innerHTML = `<div class="alert alert-danger" style="margin: 40px; text-align: center;">Failed to load profile.</div>`;
        }
    };

    render();
});

// Global functions for modals
window.openEditCustomerModal = (customer) => {
    const html = `
        <form id="edit-customer-form">
            <input type="hidden" id="edit-cust-id" value="${customer.id}">
            <div class="form-group">
                <label>Full Name <span style="color: var(--danger);">*</span></label>
                <input type="text" id="edit-cust-name" required value="${customer.name}">
            </div>
            
            <div class="form-group">
                <label>Business Name</label>
                <input type="text" id="edit-cust-business" value="${customer.business_name || ''}">
            </div>
            
            <div style="display: flex; gap: 16px;">
                <div class="form-group" style="flex: 1;">
                    <label>Phone Number</label>
                    <input type="tel" id="edit-cust-phone" value="${customer.phone || ''}">
                </div>
                <div class="form-group" style="flex: 1;">
                    <label>Email Address</label>
                    <input type="email" id="edit-cust-email" value="${customer.email || ''}">
                </div>
            </div>
            
            <div class="form-group">
                <label>Physical Address</label>
                <textarea id="edit-cust-address" rows="3">${customer.address || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label>Customer Type</label>
                <select id="edit-cust-type">
                    <option value="individual" ${customer.type === 'individual' || customer.entity_type === 'individual' ? 'selected' : ''}>Individual</option>
                    <option value="group" ${customer.type === 'group' || customer.entity_type === 'group' ? 'selected' : ''}>Group / Company</option>
                </select>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block" style="margin-top: 24px;">
                <span class="material-symbols-outlined">save</span> Update Contact
            </button>
        </form>
    `;

    window.openModal('Edit Customer Profile', html);

    document.getElementById('edit-customer-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Saving...';

        const payload = {
            id: document.getElementById('edit-cust-id').value,
            name: document.getElementById('edit-cust-name').value,
            business_name: document.getElementById('edit-cust-business').value,
            phone: document.getElementById('edit-cust-phone').value,
            email: document.getElementById('edit-cust-email').value,
            address: document.getElementById('edit-cust-address').value,
            entity_type: document.getElementById('edit-cust-type').value,
            type: document.getElementById('edit-cust-type').value
        };

        try {
            await window.api.post('/customers/update.php', payload);
            window.showToast('Contact updated successfully', 'success');
            window.closeModal();
            window.viewCustomer(payload.id); // Refresh profile
        } catch (error) {
            window.showToast(error.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">save</span> Update Contact';
        }
    });
};

window.openCustomerIssueLoanModal = (customerId) => {
    const html = `
        <form id="issue-loan-form">
            <input type="hidden" id="loan-cust-id" value="${customerId}">
            <div style="background: var(--warning-bg); color: #b45309; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; font-size: 0.9rem; display: flex; gap: 8px; align-items: center;">
                <span class="material-symbols-outlined">info</span>
                This amount will be directly deducted from the Capital Ledger.
            </div>
            
            <div class="form-group">
                <label>Principal Amount (GHS) <span style="color: var(--danger);">*</span></label>
                <input type="number" id="loan-amount" required step="0.01" min="0.01" placeholder="e.g. 10000">
            </div>
            
            <div class="form-group">
                <label>Interest Rate (%) <span style="color: var(--danger);">*</span></label>
                <input type="number" id="loan-interest" required step="0.01" min="0" value="5">
            </div>
            
            <div class="form-group">
                <label>Terms & Conditions (Optional)</label>
                <textarea id="loan-terms" rows="3" placeholder="e.g. Repayment due in 30 days via Gold offset"></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block" style="margin-top: 24px; background: var(--warning); color: white; border: none;">
                <span class="material-symbols-outlined">payments</span> Issue Loan
            </button>
        </form>
    `;

    window.openModal('Issue New Loan', html);

    document.getElementById('issue-loan-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';

        const payload = {
            customer_id: document.getElementById('loan-cust-id').value,
            principal_ghs: document.getElementById('loan-amount').value,
            interest_rate_percent: document.getElementById('loan-interest').value,
            terms: document.getElementById('loan-terms').value
        };

        try {
            await window.api.post('/loans/create.php', payload);
            window.showToast('Loan issued successfully!', 'success');
            window.closeModal();
            window.viewCustomer(payload.customer_id); // Refresh profile
        } catch (error) {
            window.showToast(error.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">payments</span> Issue Loan';
        }
    });
};
