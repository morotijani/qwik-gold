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
                <div style="background: linear-gradient(145deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 100%); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 20px; padding: 40px; position: relative; overflow: hidden; margin-bottom: 32px; box-shadow: 0 10px 30px rgba(245, 158, 11, 0.1);">
                    <div style="position: absolute; top: -50px; right: -50px; width: 250px; height: 250px; background: rgba(245, 158, 11, 0.1); border-radius: 50%; filter: blur(40px);"></div>
                    <div style="position: absolute; bottom: -30px; left: -30px; width: 150px; height: 150px; background: rgba(245, 158, 11, 0.1); border-radius: 50%; filter: blur(30px);"></div>
                    <div style="position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="color: #d97706; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; font-size: 0.95rem; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                                <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3); margin-right: 4px;">
                                    <span class="material-symbols-outlined" style="font-size: 18px;">contacts</span>
                                </div>
                                Network
                            </div>
                            <h2 style="margin: 0 0 12px 0; font-size: 2.2rem; font-weight: 800; color: var(--text-main);">Customer Directory</h2>
                            <p style="margin: 0; color: var(--text-muted); font-size: 1.05rem; max-width: 500px; line-height: 1.5;">Manage all your suppliers, track their interactions, and build deep relationships through comprehensive profile tracking.</p>
                        </div>
                        <button class="btn btn-primary" onclick="window.openCreateCustomerModal()" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; font-weight: 700; padding: 14px 28px; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3); display: flex; align-items: center; gap: 8px; font-size: 1.05rem; border-radius: 12px; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                            <span class="material-symbols-outlined">person_add</span> Add Contact
                        </button>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px;">
                    ${customers.length === 0 ? '<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center; padding: 40px; background: white; border-radius: 16px; border: 1px dashed var(--border);">No customers found.</p>' : ''}
                    ${customers.map(c => `
                        <div class="contact-card" style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.06)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.03)';">
                            <div class="contact-left" style="display: flex; align-items: center; gap: 16px;">
                                <div class="contact-avatar" style="width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; box-shadow: inset 0 -2px 4px rgba(0,0,0,0.05);">
                                    ${c.name.charAt(0).toUpperCase()}
                                </div>
                                <div class="contact-info">
                                    <div class="contact-name" style="font-weight: 700; font-size: 1.1rem; color: var(--text-main); margin-bottom: 4px;">${c.name}</div>
                                    <div class="contact-meta" style="color: var(--text-muted); font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
                                        <span class="material-symbols-outlined" style="font-size: 14px;">call</span> ${c.phone || 'No phone'} ${c.business_name ? `• ${c.business_name}` : ''}
                                    </div>
                                    <div class="contact-meta" style="margin-top: 8px;">
                                        <span style="background: var(--bg-main); border: 1px solid var(--border); padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px;">
                                            <span class="material-symbols-outlined" style="font-size: 12px;">tag</span> ${c.customer_uid || '#' + c.id}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div class="contact-right">
                                <button class="btn btn-outline" style="border-radius: 12px; padding: 10px 16px; font-size: 0.9rem; font-weight: 600; display: flex; align-items: center; gap: 6px; border-color: var(--border); color: var(--text-main); background: white; transition: all 0.2s;" onmouseover="this.style.background='var(--bg-main)'" onmouseout="this.style.background='white'" onclick="window.viewCustomer(${c.id})">
                                    Journey <span class="material-symbols-outlined" style="font-size: 16px;">arrow_forward</span>
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
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; color: #334155; padding: 16px 20px; border-radius: 16px; margin-bottom: 24px; display: flex; gap: 16px; align-items: center;">
                    <div style="background: #e2e8f0; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #475569; flex-shrink: 0;">
                        <span class="material-symbols-outlined" style="font-size: 24px;">badge</span>
                    </div>
                    <div>
                        <strong style="display: block; font-size: 0.95rem; margin-bottom: 2px; color: #0f172a;">Customer Profile</strong>
                        <span style="font-size: 0.85rem; line-height: 1.4; color: #64748b; display: block;">Add a new entity to your directory to track their gold supply and financial journey.</span>
                    </div>
                </div>

                <div class="form-group">
                    <label>Full Name <span style="color: var(--danger);">*</span></label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">person</span>
                        <input type="text" id="cust-name" required placeholder="e.g. Kwame Mensah">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Business Name <span style="color: var(--text-muted); font-size: 0.8rem; text-transform: none;">(Optional)</span></label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">storefront</span>
                        <input type="text" id="cust-business" placeholder="e.g. Kwame Gold Enterprise">
                    </div>
                </div>
                
                <div style="display: flex; gap: 16px;">
                    <div class="form-group" style="flex: 1;">
                        <label>Phone Number</label>
                        <div class="input-with-icon">
                            <span class="material-symbols-outlined">call</span>
                            <input type="tel" id="cust-phone" placeholder="e.g. 0244123456">
                        </div>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label>Email Address</label>
                        <div class="input-with-icon">
                            <span class="material-symbols-outlined">mail</span>
                            <input type="email" id="cust-email" placeholder="e.g. kwame@example.com">
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Physical Address</label>
                    <div style="position: relative;">
                        <span class="material-symbols-outlined" style="position: absolute; left: 16px; top: 16px; color: var(--text-muted); font-size: 1.2rem;">location_on</span>
                        <textarea id="cust-address" rows="3" placeholder="Enter full address" style="padding-left: 44px;"></textarea>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Customer Type</label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">category</span>
                        <select id="cust-type" style="padding-left: 44px; appearance: none; -webkit-appearance: none; background-image: url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'24\\' height=\\'24\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%2364748b\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><polyline points=\\'6 9 12 15 18 9\\'></polyline></svg>'); background-repeat: no-repeat; background-position: right 16px center; background-size: 16px;">
                            <option value="individual" selected>Individual</option>
                            <option value="group">Group / Company</option>
                        </select>
                    </div>
                </div>
                
                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 32px; background: var(--gold-primary); border: none; padding: 16px; font-size: 1.05rem; border-radius: 14px; box-shadow: 0 10px 25px rgba(30, 41, 59, 0.2); transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 15px 35px rgba(30, 41, 59, 0.3)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 10px 25px rgba(30, 41, 59, 0.2)';">
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

            // Fix API payload names to populate Journey
            if (data.all_loans) {
                data.all_loans.forEach(loan => journeyNodes.push({ ...loan, _type: 'loan', _date: loan.created_at }));
            }
            if (data.all_purchases) {
                data.all_purchases.forEach(sale => journeyNodes.push({ ...sale, _type: 'sale', _date: sale.created_at }));
            }

            // Sort by most recent
            journeyNodes.sort((a, b) => new Date(b._date) - new Date(a._date));

            // Calculate Dynamic Stats
            let totalGoldSold = 0;
            let totalRevenuePaid = 0;
            if (data.all_purchases) {
                data.all_purchases.forEach(sale => {
                    totalGoldSold += parseFloat(sale.weight_grams) || 0;
                    totalRevenuePaid += parseFloat(sale.total_paid_ghs) || 0;
                });
            }

            const hasLoans = (data.all_loans && data.all_loans.length > 0) || parseFloat(data.active_debt.total_amount_ghs) > 0 || parseFloat(data.total_settled_ghs) > 0;
            const hasKeptGold = parseFloat(data.current_kept_gold.balls_grams) > 0 || parseFloat(data.current_kept_gold.refined_grams) > 0;
            const hasSales = data.all_purchases && data.all_purchases.length > 0;

            container.innerHTML = `
                <div style="width: 100%; padding-bottom: 60px;">
                    <!-- Header -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <button class="btn btn-text" onclick="window.location.hash = '#${returnRoute}'; window.dispatchEvent(new CustomEvent('route-changed', {detail:{route:'${returnRoute}', container: document.getElementById('view-container')}}))" style="display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-weight: 600; padding: 8px 16px; border-radius: 12px; transition: background 0.2s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='transparent'">
                            <span class="material-symbols-outlined">arrow_back</span> Back to Directory
                        </button>
                        <div style="display: flex; gap: 12px;">
                            <button class="btn btn-outline" onclick='window.openEditCustomerModal(${JSON.stringify(data.profile).replace(/'/g, "&#39;")})' style="background: white; border-color: var(--border); border-radius: 12px; font-weight: 600;">
                                <span class="material-symbols-outlined" style="font-size: 18px;">edit</span> Edit Profile
                            </button>
                            <button class="btn btn-primary" onclick="window.openCustomerIssueLoanModal(${data.profile.id})" style="background: linear-gradient(135deg, var(--warning), #d97706); border: none; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); border-radius: 12px; font-weight: 600;">
                                <span class="material-symbols-outlined" style="font-size: 18px;">payments</span> Issue New Loan
                            </button>
                        </div>
                    </div>

                    <!-- Main Profile Card -->
                    <div style="background: linear-gradient(145deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 100%); border-radius: 20px; padding: 40px; box-shadow: 0 10px 30px rgba(245, 158, 11, 0.05); display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; border: 1px solid rgba(245, 158, 11, 0.2); position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: rgba(245, 158, 11, 0.1); border-radius: 50%; filter: blur(30px);"></div>
                        <div style="display: flex; align-items: center; gap: 32px; position: relative; z-index: 1;">
                            <div style="width: 100px; height: 100px; border-radius: 24px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); display: flex; align-items: center; justify-content: center; font-size: 3rem; color: white; font-weight: 800; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3);">
                                ${data.profile.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 style="font-size: 2.2rem; font-weight: 800; margin: 0 0 12px 0; color: var(--text-main); display: flex; align-items: center; gap: 16px;">
                                    ${data.profile.name}
                                    <span style="font-size: 0.85rem; padding: 6px 14px; background: rgba(16, 185, 129, 0.1); color: #10b981; border-radius: 20px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.2);"><span class="material-symbols-outlined" style="font-size: 14px;">check_circle</span> Active</span>
                                    <span style="font-size: 0.85rem; padding: 6px 14px; background: var(--bg-hover); color: var(--text-muted); border-radius: 20px; font-weight: 700; text-transform: capitalize; box-shadow: inset 0 0 0 1px var(--border);"><span class="material-symbols-outlined" style="font-size: 14px;">storefront</span> ${data.profile.type}</span>
                                </h3>
                                <div style="display: flex; align-items: center; gap: 24px; color: var(--text-muted); font-size: 1rem; font-weight: 500;">
                                    <span style="display: flex; align-items: center; gap: 8px; background: var(--bg-main); padding: 6px 12px; border-radius: 8px; border: 1px solid var(--border);"><span class="material-symbols-outlined" style="font-size: 18px; color: #0284c7;">badge</span> ${data.profile.customer_uid || '#' + data.profile.id}</span>
                                    <span style="display: flex; align-items: center; gap: 8px;"><span class="material-symbols-outlined" style="font-size: 18px;">call</span> ${data.profile.phone || 'No phone'}</span>
                                    ${data.profile.business_name ? `<span style="display: flex; align-items: center; gap: 8px;"><span class="material-symbols-outlined" style="font-size: 18px;">store</span> ${data.profile.business_name}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Financial Stats Grid -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; margin-bottom: 48px;">
                        
                        ${hasLoans ? `
                            <!-- Active Debt -->
                            <div style="background: linear-gradient(145deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.03) 100%); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 20px; padding: 20px; box-shadow: 0 4px 20px rgba(239, 68, 68, 0.05); position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 12px;">
                                <div style="position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; background: rgba(239, 68, 68, 0.1); border-radius: 50%; filter: blur(20px);"></div>
                                <div style="display: flex; align-items: center; gap: 10px; position: relative; z-index: 1;">
                                    <div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #ef4444, #dc2626); display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);">
                                        <span class="material-symbols-outlined" style="font-size: 20px;">money_off</span>
                                    </div>
                                    <div style="color: #dc2626; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2;">Active Debt</div>
                                </div>
                                <div style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); display: flex; align-items: baseline; gap: 6px; white-space: nowrap; position: relative; z-index: 1;">
                                    <span style="font-size: 1rem; color: var(--text-muted); font-weight: 600;">GHS</span> ${parseFloat(data.active_debt.total_amount_ghs).toLocaleString(undefined, {minimumFractionDigits:2})}
                                </div>
                            </div>
                            
                            <!-- Total Settled -->
                            <div style="background: linear-gradient(145deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.03) 100%); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 20px; padding: 20px; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.05); position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 12px;">
                                <div style="position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; background: rgba(16, 185, 129, 0.1); border-radius: 50%; filter: blur(20px);"></div>
                                <div style="display: flex; align-items: center; gap: 10px; position: relative; z-index: 1;">
                                    <div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);">
                                        <span class="material-symbols-outlined" style="font-size: 20px;">task_alt</span>
                                    </div>
                                    <div style="color: #059669; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2;">Total Settled</div>
                                </div>
                                <div style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); display: flex; align-items: baseline; gap: 6px; white-space: nowrap; position: relative; z-index: 1;">
                                    <span style="font-size: 1rem; color: var(--text-muted); font-weight: 600;">GHS</span> ${parseFloat(data.total_settled_ghs).toLocaleString(undefined, {minimumFractionDigits:2})}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${hasKeptGold ? `
                            <!-- Kept Gold -->
                            <div style="background: linear-gradient(145deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 100%); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 20px; padding: 20px; box-shadow: 0 4px 20px rgba(245, 158, 11, 0.05); position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 12px;">
                                <div style="position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; background: rgba(245, 158, 11, 0.1); border-radius: 50%; filter: blur(20px);"></div>
                                <div style="display: flex; align-items: center; gap: 10px; position: relative; z-index: 1;">
                                    <div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #f59e0b, #d97706); display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3);">
                                        <span class="material-symbols-outlined" style="font-size: 20px;">inventory_2</span>
                                    </div>
                                    <div style="color: #d97706; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2;">Vault Balance</div>
                                </div>
                                <div style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); display: flex; align-items: baseline; gap: 6px; white-space: nowrap; position: relative; z-index: 1;">
                                    ${parseFloat(data.current_kept_gold.balls_grams + data.current_kept_gold.refined_grams).toFixed(2)} <span style="font-size: 1rem; color: var(--text-muted); font-weight: 600;">g</span>
                                </div>
                            </div>
                        ` : ''}

                        ${hasSales ? `
                            <!-- Total Gold Supplied -->
                            <div style="background: linear-gradient(145deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.03) 100%); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 20px; padding: 20px; box-shadow: 0 4px 20px rgba(59, 130, 246, 0.05); position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 12px;">
                                <div style="position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; background: rgba(59, 130, 246, 0.1); border-radius: 50%; filter: blur(20px);"></div>
                                <div style="display: flex; align-items: center; gap: 10px; position: relative; z-index: 1;">
                                    <div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #3b82f6, #2563eb); display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);">
                                        <span class="material-symbols-outlined" style="font-size: 20px;">diamond</span>
                                    </div>
                                    <div style="color: #2563eb; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2;">Gold Supplied</div>
                                </div>
                                <div style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); display: flex; align-items: baseline; gap: 6px; white-space: nowrap; position: relative; z-index: 1;">
                                    ${totalGoldSold.toFixed(2)} <span style="font-size: 1rem; color: var(--text-muted); font-weight: 600;">g</span>
                                </div>
                            </div>

                            <!-- Total Revenue Paid -->
                            <div style="background: linear-gradient(145deg, rgba(202, 138, 4, 0.15) 0%, rgba(202, 138, 4, 0.03) 100%); border: 1px solid rgba(202, 138, 4, 0.2); border-radius: 20px; padding: 20px; box-shadow: 0 4px 20px rgba(202, 138, 4, 0.05); position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 12px;">
                                <div style="position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; background: rgba(202, 138, 4, 0.1); border-radius: 50%; filter: blur(20px);"></div>
                                <div style="display: flex; align-items: center; gap: 10px; position: relative; z-index: 1;">
                                    <div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #eab308, #ca8a04); display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; box-shadow: 0 4px 10px rgba(202, 138, 4, 0.3);">
                                        <span class="material-symbols-outlined" style="font-size: 20px;">payments</span>
                                    </div>
                                    <div style="color: #ca8a04; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2;">Total Revenue</div>
                                </div>
                                <div style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); display: flex; align-items: baseline; gap: 6px; white-space: nowrap; position: relative; z-index: 1;">
                                    <span style="font-size: 1rem; color: var(--text-muted); font-weight: 600;">GHS</span> ${totalRevenuePaid.toLocaleString(undefined, {minimumFractionDigits:2})}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${(!hasLoans && !hasKeptGold && !hasSales) ? `
                            <!-- No Activity Yet -->
                            <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.03); border: 1px dashed var(--border); grid-column: 1 / -1; text-align: center;">
                                <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--bg-main); display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 2rem; margin: 0 auto 16px auto;">
                                    <span class="material-symbols-outlined">new_releases</span>
                                </div>
                                <div style="color: var(--text-main); font-size: 1.2rem; font-weight: 700;">Brand New Contact</div>
                                <div style="font-size: 1rem; color: var(--text-muted); margin-top: 8px;">This profile has no financial history or interactions yet.</div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Journey Flow Table -->
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                        <span class="material-symbols-outlined" style="color: var(--text-muted); font-size: 28px;">timeline</span>
                        <h3 style="font-size: 1.4rem; margin: 0; color: var(--text-main); font-weight: 800;">Financial Journey</h3>
                    </div>
                    
                    <div style="background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); overflow-x: auto; border: 1px solid var(--border);">
                        <table style="width: 100%; border-collapse: collapse; min-width: 900px;">
                            <thead>
                                <tr style="background: var(--bg-main); color: var(--text-muted); font-size: 0.85rem; text-align: left; text-transform: uppercase;">
                                    <th style="padding: 20px 24px; font-weight: 700; border-bottom: 1px solid var(--border);">Date & Time</th>
                                    <th style="padding: 20px 16px; font-weight: 700; border-bottom: 1px solid var(--border);">Action</th>
                                    <th style="padding: 20px 16px; font-weight: 700; border-bottom: 1px solid var(--border);">Type</th>
                                    <th style="padding: 20px 16px; font-weight: 700; border-bottom: 1px solid var(--border);">Reference</th>
                                    <th style="padding: 20px 16px; font-weight: 700; border-bottom: 1px solid var(--border); text-align: right;">Amount</th>
                                    <th style="padding: 20px 24px; font-weight: 700; border-bottom: 1px solid var(--border); text-align: right;">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${journeyNodes.length === 0 ? `
                                    <tr>
                                        <td colspan="6" style="padding: 48px; text-align: center; color: var(--text-muted); font-size: 1.05rem;">
                                            <span class="material-symbols-outlined" style="font-size: 48px; color: var(--border); margin-bottom: 16px; display: block;">hourglass_empty</span>
                                            Journey has not started yet.
                                        </td>
                                    </tr>
                                ` : journeyNodes.map(node => {
                                    if (node._type === 'loan') {
                                        return `
                                            <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='white'">
                                                <td style="padding: 20px 24px; color: var(--text-main); font-weight: 600;">
                                                    ${new Date(node.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} 
                                                    <div style="color: var(--text-muted); font-size: 0.85rem; font-weight: 500; margin-top: 4px;">${new Date(node.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                                                </td>
                                                <td style="padding: 20px 16px;">
                                                    <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: rgba(245, 158, 11, 0.1); color: #d97706; border-radius: 20px; font-size: 0.85rem; font-weight: 700; box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.2);">
                                                        <span class="material-symbols-outlined" style="font-size: 16px;">account_balance_wallet</span> Loan Issued
                                                    </span>
                                                </td>
                                                <td style="padding: 20px 16px; font-weight: 700; color: var(--text-main); font-size: 0.9rem; text-transform: capitalize;">
                                                    ${node.type || 'standard'}
                                                </td>
                                                <td style="padding: 20px 16px; font-weight: 600; color: var(--text-muted);">
                                                    <span style="background: var(--bg-main); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); font-size: 0.85rem;">${node.loan_uid || 'LN-' + String(node.id).padStart(6, '0')}</span>
                                                </td>
                                                <td style="padding: 20px 16px; font-weight: 800; color: var(--text-main); text-align: right; font-size: 1.1rem;">
                                                    GHS ${parseFloat(node.principal_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td style="padding: 20px 24px; text-align: right;">
                                                    ${node.status === 'active' 
                                                        ? `<span style="padding: 6px 12px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border-radius: 20px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase;">Unpaid</span>` 
                                                        : `<span style="padding: 6px 12px; background: rgba(16, 185, 129, 0.1); color: #10b981; border-radius: 20px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase;">Settled</span>`}
                                                    <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem; font-weight: 600; border-radius: 8px; margin-left: 12px;" onclick="window.openLoanDetailsModal(${node.id})">Details</button>
                                                </td>
                                            </tr>
                                        `;
                                    } else if (node._type === 'sale') {
                                        return `
                                            <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='white'">
                                                <td style="padding: 20px 24px; color: var(--text-main); font-weight: 600;">
                                                    ${new Date(node.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} 
                                                    <div style="color: var(--text-muted); font-size: 0.85rem; font-weight: 500; margin-top: 4px;">${new Date(node.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                                                </td>
                                                <td style="padding: 20px 16px;">
                                                    <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: rgba(16, 185, 129, 0.1); color: #10b981; border-radius: 20px; font-size: 0.85rem; font-weight: 700; box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.2);">
                                                        <span class="material-symbols-outlined" style="font-size: 16px;">diamond</span> Gold Sold
                                                    </span>
                                                </td>
                                                <td style="padding: 20px 16px; font-weight: 700; color: var(--text-main); font-size: 0.9rem; text-transform: capitalize;">
                                                    ${node.gold_type || 'N/A'}
                                                </td>
                                                <td style="padding: 20px 16px; font-weight: 600; color: var(--text-muted);">
                                                    <span style="background: var(--bg-main); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); font-size: 0.85rem;">${node.transaction_ref || 'SL-' + String(node.id).padStart(6, '0')}</span>
                                                </td>
                                                <td style="padding: 20px 16px; font-weight: 800; color: var(--text-main); text-align: right; font-size: 1.1rem;">
                                                    GHS ${parseFloat(node.total_paid_ghs).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td style="padding: 20px 24px; color: var(--text-muted); font-size: 1rem; font-weight: 700; text-align: right;">
                                                    ${parseFloat(node.weight_grams).toFixed(2)}g
                                                </td>
                                            </tr>
                                        `;
                                    }
                                }).join('')}
                            </tbody>
                        </table>
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
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; color: #334155; padding: 16px 20px; border-radius: 16px; margin-bottom: 24px; display: flex; gap: 16px; align-items: center;">
                <div style="background: #e2e8f0; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #475569; flex-shrink: 0;">
                    <span class="material-symbols-outlined" style="font-size: 24px;">manage_accounts</span>
                </div>
                <div>
                    <strong style="display: block; font-size: 0.95rem; margin-bottom: 2px; color: #0f172a;">Edit Customer Profile</strong>
                    <span style="font-size: 0.85rem; line-height: 1.4; color: #64748b; display: block;">Update contact information or entity details for this customer.</span>
                </div>
            </div>

            <div class="form-group">
                <label>Full Name <span style="color: var(--danger);">*</span></label>
                <div class="input-with-icon">
                    <span class="material-symbols-outlined">person</span>
                    <input type="text" id="edit-cust-name" required value="${customer.name}">
                </div>
            </div>
            
            <div class="form-group">
                <label>Business Name <span style="color: var(--text-muted); font-size: 0.8rem; text-transform: none;">(Optional)</span></label>
                <div class="input-with-icon">
                    <span class="material-symbols-outlined">storefront</span>
                    <input type="text" id="edit-cust-business" value="${customer.business_name || ''}">
                </div>
            </div>
            
            <div style="display: flex; gap: 16px;">
                <div class="form-group" style="flex: 1;">
                    <label>Phone Number</label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">call</span>
                        <input type="tel" id="edit-cust-phone" value="${customer.phone || ''}">
                    </div>
                </div>
                <div class="form-group" style="flex: 1;">
                    <label>Email Address</label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">mail</span>
                        <input type="email" id="edit-cust-email" value="${customer.email || ''}">
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label>Physical Address</label>
                <div style="position: relative;">
                    <span class="material-symbols-outlined" style="position: absolute; left: 16px; top: 16px; color: var(--text-muted); font-size: 1.2rem;">location_on</span>
                    <textarea id="edit-cust-address" rows="3" style="padding-left: 44px;">${customer.address || ''}</textarea>
                </div>
            </div>
                
            <div class="form-group">
                <label>Customer Type</label>
                <div class="input-with-icon">
                    <span class="material-symbols-outlined">category</span>
                    <select id="edit-cust-type" style="padding-left: 44px; appearance: none; -webkit-appearance: none; background-image: url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'24\\' height=\\'24\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%2364748b\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><polyline points=\\'6 9 12 15 18 9\\'></polyline></svg>'); background-repeat: no-repeat; background-position: right 16px center; background-size: 16px;">
                        <option value="individual" ${customer.type === 'individual' || customer.entity_type === 'individual' ? 'selected' : ''}>Individual</option>
                        <option value="group" ${customer.type === 'group' || customer.entity_type === 'group' ? 'selected' : ''}>Group / Company</option>
                    </select>
                </div>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block" style="margin-top: 32px; background: var(--info); border: none; padding: 16px; font-size: 1.05rem; border-radius: 14px; box-shadow: 0 10px 25px rgba(59, 130, 246, 0.2); transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 15px 35px rgba(59, 130, 246, 0.3)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 10px 25px rgba(59, 130, 246, 0.2)';">
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

window._loanWizardState = { step: 1 };

window.openCustomerIssueLoanModal = async (customerId = null) => {
    window._loanWizardState = {
        step: 1,
        customerId: customerId,
        customersList: [],
        principal: '',
        hasCollateral: false,
        goldType: 'balls',
        grams: '',
        volume: '',
        blades: 0,
        density: 0,
        pounds: 0,
        karat: 0,
        notes: ''
    };
    
    if (!customerId) {
        try {
            const res = await window.api.get('/customers/list.php');
            window._loanWizardState.customersList = Array.isArray(res) ? res : (res.customers || []);
        } catch (e) {
            console.error('Failed to load customers for loan modal', e);
        }
    }
    
    window.renderLoanWizard();
};

window.setLoanGoldType = (type) => {
    if (window._loanWizardState.goldType !== type) {
        window._loanWizardState.goldType = type;
        window._loanWizardState.grams = '';
        window._loanWizardState.volume = '';
        window.calculateLoanCollateral();
        window.renderLoanWizard();
    }
};

window.calculateLoanCollateral = () => {
    const s = window._loanWizardState;
    const grams = parseFloat(s.grams) || 0;
    const volume = parseFloat(s.volume) || 0;
    
    if (s.goldType === 'balls') {
        s.blades = grams / 0.8;
        const domBlades = document.getElementById('calc-loan-blades');
        if (domBlades) domBlades.innerText = s.blades.toFixed(4);
    } else {
        const truncate2 = (num) => Math.floor(num * 100) / 100;
        s.pounds = truncate2(grams / 7.75);
        s.density = volume > 0 ? truncate2(grams / volume) : 0;
        s.karat = s.density > 0 ? truncate2(((s.density - 10.51) * 52.838) / s.density) : 0;
        
        const domDensity = document.getElementById('calc-loan-density');
        const domKarat = document.getElementById('calc-loan-karat');
        const domPounds = document.getElementById('calc-loan-pounds');
        if (domDensity) domDensity.innerText = s.density.toFixed(2);
        if (domKarat) domKarat.innerText = s.karat.toFixed(2);
        if (domPounds) domPounds.innerText = s.pounds.toFixed(2);
    }
};

window.renderLoanWizard = () => {
    const s = window._loanWizardState;
    let html = '';
    
    if (s.step === 1) {
        html = `
            <div style="display: flex; flex-direction: column; gap: 24px;">
                <div style="background: linear-gradient(to right, #fffbeb, #fef3c7); border: 1px solid #fde68a; padding: 16px 20px; border-radius: 16px; display: flex; gap: 16px; align-items: center; box-shadow: 0 4px 6px -1px rgba(217, 119, 6, 0.05);">
                    <div style="background: #f59e0b; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.2);">
                        <span class="material-symbols-outlined" style="font-size: 24px;">account_balance_wallet</span>
                    </div>
                    <div>
                        <strong style="display: block; font-size: 0.95rem; margin-bottom: 2px; color: #92400e;">Capital Deduction</strong>
                        <span style="font-size: 0.85rem; line-height: 1.4; color: #b45309; display: block;">This principal amount will be directly deducted from the company's Capital Ledger upon issuance.</span>
                    </div>
                </div>
                
                ${s.customersList && s.customersList.length > 0 ? `
                <div class="form-group">
                    <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px; font-size: 0.95rem;">Select Customer <span style="color: var(--danger);">*</span></label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">person</span>
                        <select id="loan-customer-id" required
                                onchange="window._loanWizardState.customerId = this.value"
                                style="padding-left: 44px; appearance: none; -webkit-appearance: none; background-image: url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'24\\' height=\\'24\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%2364748b\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><polyline points=\\'6 9 12 15 18 9\\'></polyline></svg>'); background-repeat: no-repeat; background-position: right 16px center; background-size: 16px;">
                            <option value="" disabled ${!s.customerId ? 'selected' : ''}>-- Choose Customer --</option>
                            ${s.customersList.map(c => `<option value="${c.id}" ${s.customerId == c.id ? 'selected' : ''}>${c.name} (${c.phone})</option>`).join('')}
                        </select>
                    </div>
                </div>
                ` : ''}
                
                <div class="form-group" style="margin-bottom: 32px;">
                    <label style="display: block; font-weight: 800; color: var(--text-muted); margin-bottom: 12px; font-size: 0.85rem; text-align: center; letter-spacing: 1.5px; text-transform: uppercase;">Principal Amount <span style="color: var(--danger);">*</span></label>
                    <div style="position: relative;">
                        <span style="position: absolute; left: 24px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-weight: 700; font-size: 1.8rem; pointer-events: none;">₵</span>
                        <input type="number" id="loan-amount" required step="0.01" min="0.01" placeholder="0.00" value="${s.principal}" 
                               oninput="window._loanWizardState.principal = this.value"
                               style="width: 100%; padding: 24px 64px 24px 64px; font-size: 2.8rem; font-weight: 800; border: 2px solid #e2e8f0; border-radius: 20px; background: #f8fafc; transition: all 0.3s; text-align: center; color: var(--warning); letter-spacing: -1px; box-shadow: inset 0 2px 6px rgba(0,0,0,0.02);"
                               onfocus="this.style.borderColor='var(--warning)'; this.style.background='white'; this.style.boxShadow='0 0 0 4px rgba(245, 158, 11, 0.1), inset 0 2px 4px rgba(0,0,0,0.02)';" 
                               onblur="this.style.borderColor='#e2e8f0'; this.style.background='#f8fafc'; this.style.boxShadow='inset 0 2px 6px rgba(0,0,0,0.02)';">
                    </div>
                </div>
                
                <div style="background: white; border: 1px solid var(--border); border-radius: 16px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);">
                    <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" 
                         onclick="window._loanWizardState.hasCollateral = !window._loanWizardState.hasCollateral; window.renderLoanWizard()">
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <div style="background: ${s.hasCollateral ? 'var(--warning-bg)' : '#f1f5f9'}; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: ${s.hasCollateral ? 'var(--warning)' : '#64748b'}; transition: all 0.3s;">
                                <span class="material-symbols-outlined" style="font-size: 20px;">workspace_premium</span>
                            </div>
                            <div>
                                <h4 style="margin: 0 0 2px 0; font-size: 1rem; color: var(--text-main);">Gold Collateral</h4>
                                <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted);">Is this loan backed by physical gold?</p>
                            </div>
                        </div>
                        <label class="switch" style="position: relative; display: inline-block; width: 50px; height: 28px; margin: 0; pointer-events: none;">
                            <input type="checkbox" ${s.hasCollateral ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                            <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${s.hasCollateral ? 'var(--warning)' : '#e2e8f0'}; transition: .3s; border-radius: 28px;">
                                <span class="slider-dot" style="position: absolute; height: 20px; width: 20px; bottom: 4px; background-color: white; transition: .3s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transform: ${s.hasCollateral ? 'translateX(26px)' : 'translateX(4px)'}"></span>
                            </span>
                        </label>
                    </div>
                    
                    ${s.hasCollateral ? `
                    <div style="margin-top: 24px; padding-top: 20px; border-top: 1px dashed var(--border); animation: slideDown 0.3s ease-out forwards;">
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="font-size: 0.9rem; margin-bottom: 12px; display: block; font-weight: 600;">Gold Type</label>
                            
                            <div style="display: flex; gap: 12px;">
                                <!-- Gold Balls Card -->
                                <div style="flex: 1; border: 2px solid ${s.goldType === 'balls' ? 'var(--warning)' : 'var(--border)'}; background: ${s.goldType === 'balls' ? 'var(--warning-bg)' : 'white'}; border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden;" 
                                     onclick="window.setLoanGoldType('balls')">
                                    ${s.goldType === 'balls' ? '<div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--warning);"></div>' : ''}
                                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                                        <div style="background: ${s.goldType === 'balls' ? 'var(--warning)' : 'var(--bg-hover)'}; color: ${s.goldType === 'balls' ? 'white' : 'var(--text-muted)'}; height: 40px; width: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.3s;">
                                            <span class="material-symbols-outlined">scatter_plot</span>
                                        </div>
                                        <div style="height: 20px; width: 20px; border-radius: 50%; border: 2px solid ${s.goldType === 'balls' ? 'var(--warning)' : '#cbd5e1'}; background: ${s.goldType === 'balls' ? 'var(--warning)' : 'transparent'}; display: flex; align-items: center; justify-content: center; transition: all 0.3s;">
                                            ${s.goldType === 'balls' ? '<div style="height: 8px; width: 8px; background: white; border-radius: 50%;"></div>' : ''}
                                        </div>
                                    </div>
                                    <div style="font-weight: 700; color: var(--text-main); font-size: 0.95rem;">Gold Balls</div>
                                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Unrefined / Sponge</div>
                                </div>
                                
                                <!-- Refined Gold Card -->
                                <div style="flex: 1; border: 2px solid ${s.goldType === 'refined' ? 'var(--warning)' : 'var(--border)'}; background: ${s.goldType === 'refined' ? 'var(--warning-bg)' : 'white'}; border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden;" 
                                     onclick="window.setLoanGoldType('refined')">
                                    ${s.goldType === 'refined' ? '<div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--warning);"></div>' : ''}
                                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                                        <div style="background: ${s.goldType === 'refined' ? 'var(--warning)' : 'var(--bg-hover)'}; color: ${s.goldType === 'refined' ? 'white' : 'var(--text-muted)'}; height: 40px; width: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.3s;">
                                            <span class="material-symbols-outlined">diamond</span>
                                        </div>
                                        <div style="height: 20px; width: 20px; border-radius: 50%; border: 2px solid ${s.goldType === 'refined' ? 'var(--warning)' : '#cbd5e1'}; background: ${s.goldType === 'refined' ? 'var(--warning)' : 'transparent'}; display: flex; align-items: center; justify-content: center; transition: all 0.3s;">
                                            ${s.goldType === 'refined' ? '<div style="height: 8px; width: 8px; background: white; border-radius: 50%;"></div>' : ''}
                                        </div>
                                    </div>
                                    <div style="font-weight: 700; color: var(--text-main); font-size: 0.95rem;">Refined Gold</div>
                                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Processed Bars</div>
                                </div>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 16px; margin-top: 16px;">
                            <div class="form-group" style="flex: 1; margin: 0;">
                                <label style="font-size: 0.9rem;">Weight (Grams)</label>
                                <div style="position: relative;">
                                    <input type="number" step="0.01" min="0" placeholder="0.00" value="${s.grams}" 
                                           oninput="window._loanWizardState.grams = this.value; window.calculateLoanCollateral()"
                                           style="padding-right: 40px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
                                    <span style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.9rem; font-weight: 700;">g</span>
                                </div>
                            </div>
                            ${s.goldType === 'refined' ? `
                            <div class="form-group" style="flex: 1; margin: 0;">
                                <label style="font-size: 0.9rem;">Volume</label>
                                <div style="position: relative;">
                                    <input type="number" step="0.01" min="0" placeholder="0.00" value="${s.volume}" 
                                           oninput="window._loanWizardState.volume = this.value; window.calculateLoanCollateral()"
                                           style="padding-right: 40px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
                                    <span style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.9rem; font-weight: 700;">v</span>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                        
                        <!-- Calculations Box -->
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin-top: 16px;">
                            ${s.goldType === 'balls' ? `
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 0.9rem; color: #475569; font-weight: 500;">Total Balls / Blades</span>
                                    <span style="font-weight: 800; color: var(--text-main); font-size: 1.15rem; background: white; padding: 4px 12px; border-radius: 8px; border: 1px solid #cbd5e1;" id="calc-loan-blades">${s.blades.toFixed(4)}</span>
                                </div>
                            ` : `
                                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center;">
                                    <span style="font-size: 0.85rem; color: #475569; font-weight: 500;">Density</span>
                                    <span style="font-weight: 800; color: var(--text-main); background: white; padding: 2px 8px; border-radius: 6px; border: 1px solid #e2e8f0;" id="calc-loan-density">${s.density.toFixed(2)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center;">
                                    <span style="font-size: 0.85rem; color: #475569; font-weight: 500;">Karat</span>
                                    <span style="font-weight: 800; color: var(--text-main); background: white; padding: 2px 8px; border-radius: 6px; border: 1px solid #e2e8f0;" id="calc-loan-karat">${s.karat.toFixed(2)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 0.85rem; color: #475569; font-weight: 500;">Pounds</span>
                                    <span style="font-weight: 800; color: var(--text-main); background: white; padding: 2px 8px; border-radius: 6px; border: 1px solid #e2e8f0;" id="calc-loan-pounds">${s.pounds.toFixed(2)}</span>
                                </div>
                            `}
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <div class="form-group">
                    <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px; font-size: 0.95rem;">Notes / Comments <span style="color: var(--text-muted); font-size: 0.8rem; text-transform: none;">(Optional)</span></label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">notes</span>
                        <input type="text" placeholder="e.g. Approved by Director..." value="${s.notes}" 
                               oninput="window._loanWizardState.notes = this.value">
                    </div>
                </div>
                
                <button type="button" class="btn btn-primary btn-block" style="margin-top: 8px; background: linear-gradient(135deg, #f59e0b, #d97706); border: none; padding: 16px; font-size: 1.05rem; border-radius: 14px; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.25); transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 15px 35px rgba(245, 158, 11, 0.35)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 10px 25px rgba(245, 158, 11, 0.25)';" onclick="
                    if(!window._loanWizardState.principal || window._loanWizardState.principal <= 0) return window.showToast('Enter valid principal amount', 'error');
                    if(window._loanWizardState.hasCollateral) {
                        if(!window._loanWizardState.grams || window._loanWizardState.grams <= 0) return window.showToast('Enter collateral weight', 'error');
                        if(window._loanWizardState.goldType === 'refined' && (!window._loanWizardState.volume || window._loanWizardState.volume <= 0)) return window.showToast('Enter gold volume', 'error');
                    }
                    window._loanWizardState.step = 2; window.renderLoanWizard();
                ">
                    Review Details <span class="material-symbols-outlined">arrow_forward</span>
                </button>
            </div>
        `;
    } else if (s.step === 2) {
        html = `
            <div style="display: flex; flex-direction: column; gap: 24px;">
                <div style="text-align: center;">
                    <div style="background: #fffbeb; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #f59e0b; margin: 0 auto 16px auto; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.1);">
                        <span class="material-symbols-outlined" style="font-size: 32px;">fact_check</span>
                    </div>
                    <h3 style="margin: 0 0 8px 0; color: var(--text-main); font-size: 1.2rem;">Confirm Loan Issuance</h3>
                    <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem;">Please review the details before finalizing.</p>
                </div>
                
                <div style="background: white; border: 1px solid var(--border); border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px dashed var(--border);">
                        <span style="color: #64748b; font-weight: 500;">Principal Amount</span>
                        <span style="font-weight: 800; font-size: 1.2rem; color: #d97706;">GHS ${parseFloat(s.principal).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    
                    ${s.hasCollateral ? `
                        <div style="margin-bottom: 16px; font-weight: 700; color: var(--text-main); font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
                            <span class="material-symbols-outlined" style="color: var(--warning); font-size: 18px;">workspace_premium</span> Collateral Details
                        </div>
                        <div style="background: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                <span style="color: #64748b; font-size: 0.9rem;">Type</span>
                                <span style="font-weight: 600; font-size: 0.9rem; text-transform: capitalize; color: var(--text-main);">${s.goldType}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: ${s.goldType === 'balls' ? '12px' : '12px'};">
                                <span style="color: #64748b; font-size: 0.9rem;">Weight</span>
                                <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-main);">${parseFloat(s.grams).toFixed(4)} g</span>
                            </div>
                            ${s.goldType === 'balls' ? `
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: #64748b; font-size: 0.9rem;">Total Balls</span>
                                    <span style="font-weight: 700; font-size: 0.9rem; color: var(--text-main);">${s.blades.toFixed(4)}</span>
                                </div>
                            ` : `
                                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                    <span style="color: #64748b; font-size: 0.9rem;">Density</span>
                                    <span style="font-weight: 700; font-size: 0.9rem; color: var(--text-main);">${s.density.toFixed(2)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                    <span style="color: #64748b; font-size: 0.9rem;">Karat</span>
                                    <span style="font-weight: 700; font-size: 0.9rem; color: var(--text-main);">${s.karat.toFixed(2)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: #64748b; font-size: 0.9rem;">Pounds</span>
                                    <span style="font-weight: 700; font-size: 0.9rem; color: var(--text-main);">${s.pounds.toFixed(2)}</span>
                                </div>
                            `}
                        </div>
                    ` : `
                        <div style="text-align: center; color: #94a3b8; font-size: 0.9rem; padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">
                            <span class="material-symbols-outlined" style="font-size: 20px; display: block; margin-bottom: 4px; opacity: 0.5;">money_off</span>
                            No collateral attached (Standard Loan)
                        </div>
                    `}
                    
                    ${s.notes ? `
                        <div style="margin-top: 20px;">
                            <div style="font-weight: 600; color: var(--text-main); margin-bottom: 8px; font-size: 0.9rem;">Notes</div>
                            <div style="color: #64748b; font-size: 0.85rem; font-style: italic; background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 3px solid #cbd5e1;">"${s.notes}"</div>
                        </div>
                    ` : ''}
                </div>
                
                <div style="display: flex; gap: 12px; margin-top: 8px;">
                    <button type="button" class="btn btn-outline" style="flex: 1; border-radius: 12px; font-weight: 600; color: #64748b; border-color: #cbd5e1;" onclick="window._loanWizardState.step = 1; window.renderLoanWizard()">Back to Edit</button>
                    <button type="button" class="btn btn-primary" id="btn-submit-loan" style="flex: 2; background: linear-gradient(135deg, #f59e0b, #d97706); border: none; color: white; border-radius: 12px; font-weight: 600; font-size: 1.05rem; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.25);" onclick="window.submitLoanWizard()">
                        <span class="material-symbols-outlined" style="font-size: 20px;">check_circle</span> Confirm Issue
                    </button>
                </div>
            </div>
        `;
    }
    
    // Only open modal if it isn't already (or update contents if it is)
    const existingBody = document.getElementById('modal-body');
    if (existingBody && document.getElementById('global-modal').classList.contains('active')) {
        existingBody.innerHTML = html;
    } else {
        window.openModal('Issue New Loan', html);
    }
};

window.submitLoanWizard = async () => {
    const s = window._loanWizardState;
    const btn = document.getElementById('btn-submit-loan');
    if(btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';
    }
    
    const payload = {
        customer_id: s.customerId,
        principal_amount: s.principal,
        has_collateral: s.hasCollateral,
        notes: s.notes
    };

    if (s.hasCollateral) {
        payload.gold_type = s.goldType;
        payload.weight_grams = s.grams;
        if(s.goldType === 'refined') {
            payload.volume = s.volume;
        } else {
            payload.total_blades = s.blades;
        }
    }

    try {
        await window.api.post('/loans/issue.php', payload);
        window.showToast('Loan issued successfully!', 'success');
        window.closeModal();
        
        if (window.location.hash === '#loans') {
            if (typeof window.loadLoansData === 'function') {
                window.loadLoansData();
            }
        } else {
            if (typeof window.viewCustomer === 'function') {
                window.viewCustomer(s.customerId); // Refresh profile
            }
        }
    } catch (error) {
        window.showToast(error.message, 'error');
        if(btn) {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Confirm Issue';
        }
    }
};
window._settleWizardState = {};

window.openSettleLoanWizard = async (loanId, customerId, loanType, principalAmount) => {
    window._settleWizardState = {
        step: 1,
        loanId: loanId,
        customerId: customerId,
        loanType: loanType, // 'standard' or 'collateral'
        principal: parseFloat(principalAmount),
        settleMethod: null, // 'cash', 'gold', 'collateral'
        notes: '',
        
        // Cash specific
        amountPaid: '',
        
        // Gold specific
        goldType: 'refined', // 'refined' or 'balls'
        grams: '',
        pricePerBlade: '',
        totalBlades: 0,
        currentLocalPrice: '',
        volume: '',
        density: 0,
        karat: 0,
        pounds: 0,
        agreedValue: 0,
        
        // Collateral specific
        collateralData: null // Will be populated from API
    };
    
    if (loanType === 'collateral') {
        document.getElementById('global-modal').classList.add('active');
        document.getElementById('modal-title').textContent = 'Loading...';
        document.getElementById('modal-body').innerHTML = '<div style="text-align:center; padding: 40px;"><span class="material-symbols-outlined spin">sync</span></div>';
        
        try {
            const data = await window.api.get(`/customers/view.php?customer_id=${customerId}`);
            window._settleWizardState.collateralData = data.current_kept_gold;
        } catch(e) {
            window.showToast('Failed to fetch customer vault details', 'error');
            window.closeModal();
            return;
        }
    }
    
    window.renderSettleLoanWizard();
};

window.calculateSettleGold = () => {
    const s = window._settleWizardState;
    const truncate2 = (num) => Math.floor(num * 100) / 100;

    const grams = parseFloat(s.grams) || 0;

    if (s.goldType === 'balls') {
        const ppb = parseFloat(s.pricePerBlade) || 0;
        
        // If it's collateral, we already have totalBlades, don't recalculate it from grams
        if (s.settleMethod !== 'collateral' || !s.totalBlades) {
            s.totalBlades = grams / 0.8;
        }
        
        s.agreedValue = s.totalBlades * ppb;
        
        if (document.getElementById('calc_blades')) document.getElementById('calc_blades').innerText = s.totalBlades.toFixed(4);
    } else {
        const vol = parseFloat(s.volume) || 0;
        const clp = parseFloat(s.currentLocalPrice) || 0;
        
        s.pounds = truncate2(grams / 7.75);
        s.density = vol > 0 ? truncate2(grams / vol) : 0;
        if (s.density > 0) {
            s.karat = truncate2(((s.density - 10.51) * 52.838) / s.density);
        } else {
            s.karat = 0;
        }
        s.agreedValue = (s.karat * clp / 23) * s.pounds;
        
        if (document.getElementById('calc_density')) document.getElementById('calc_density').innerText = s.density.toFixed(2);
        if (document.getElementById('calc_karat')) document.getElementById('calc_karat').innerText = s.karat.toFixed(2);
        if (document.getElementById('calc_pounds')) document.getElementById('calc_pounds').innerText = s.pounds.toFixed(2) + ' lbs';
    }
    
    if (document.getElementById('calc_agreed_value_text')) {
        document.getElementById('calc_agreed_value_text').innerText = 'GHS ' + s.agreedValue.toLocaleString(undefined, {minimumFractionDigits: 2});
    }
    
    if (document.getElementById('calc_agreed_value_input')) {
        document.getElementById('calc_agreed_value_input').value = s.agreedValue;
    }
};

window.renderSettleLoanWizard = () => {
    const s = window._settleWizardState;
    let html = '';

    if (s.step === 1) {
        // Selection Phase
        const isCollateral = s.loanType === 'collateral';
        
        html = `
            <div style="display: flex; flex-direction: column; gap: 24px;">
                <div style="text-align: center;">
                    <div style="color: var(--text-muted); font-size: 0.9rem; text-transform: uppercase; font-weight: 600;">Outstanding Balance</div>
                    <div style="font-size: 2rem; font-weight: 700; color: var(--warning);">GHS ${s.principal.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                </div>
                
                <h3 style="margin: 0; color: var(--text-main); font-size: 1.1rem; text-align: center;">Select Settlement Method</h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px;">
                    <div onclick="window._settleWizardState.settleMethod = 'cash'; window._settleWizardState.step = 2; window.renderSettleLoanWizard();" 
                         style="background: white; border: 2px solid var(--border); border-radius: 12px; padding: 24px; text-align: center; cursor: pointer; transition: all 0.2s;"
                         onmouseover="this.style.borderColor='var(--info)'" onmouseout="this.style.borderColor='var(--border)'">
                        <span class="material-symbols-outlined" style="font-size: 32px; color: var(--info); margin-bottom: 12px; display: block;">payments</span>
                        <div style="font-weight: 600; color: var(--text-main);">Cash Repayment</div>
                    </div>
                    
                    <div onclick="window._settleWizardState.settleMethod = 'gold'; window._settleWizardState.step = 2; window.renderSettleLoanWizard();" 
                         style="background: white; border: 2px solid var(--border); border-radius: 12px; padding: 24px; text-align: center; cursor: pointer; transition: all 0.2s;"
                         onmouseover="this.style.borderColor='var(--success)'" onmouseout="this.style.borderColor='var(--border)'">
                        <span class="material-symbols-outlined" style="font-size: 32px; color: var(--success); margin-bottom: 12px; display: block;">balance</span>
                        <div style="font-weight: 600; color: var(--text-main);">Walk-in Gold</div>
                    </div>
                    
                    ${isCollateral ? `
                    <div onclick="window._settleWizardState.settleMethod = 'collateral'; window._settleWizardState.step = 2; window.renderSettleLoanWizard();" 
                         style="background: white; border: 2px solid var(--border); border-radius: 12px; padding: 24px; text-align: center; cursor: pointer; transition: all 0.2s;"
                         onmouseover="this.style.borderColor='var(--gold-primary)'" onmouseout="this.style.borderColor='var(--border)'">
                        <span class="material-symbols-outlined" style="font-size: 32px; color: var(--gold-primary); margin-bottom: 12px; display: block;">key</span>
                        <div style="font-weight: 600; color: var(--text-main);">Vault Collateral</div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    } 
    else if (s.step === 2) {
        // Details Phase
        
        let detailsHtml = '';
        
        if (s.settleMethod === 'cash') {
            detailsHtml = `
                <div class="form-group" style="margin-bottom: 24px;">
                    <label>Amount Paid (GHS) <span style="color: red;">*</span></label>
                    <input type="number" step="0.01" min="0" max="${s.principal}" value="${s.amountPaid}" 
                           oninput="
                           if(parseFloat(this.value) > ${s.principal}) this.value = ${s.principal};
                           if(parseFloat(this.value) < 0) this.value = Math.abs(this.value);
                           window._settleWizardState.amountPaid = this.value;
                           " 
                           placeholder="Enter amount" style="font-size: 1.2rem; padding: 12px;">
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 6px;">Max allowable: GHS ${s.principal.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                </div>
            `;
        } 
        else if (s.settleMethod === 'gold') {
            detailsHtml = `
                <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                    <button class="btn ${s.goldType === 'refined' ? 'btn-primary' : 'btn-outline'}" style="flex: 1; padding: 12px;" 
                            onclick="
                                if(window._settleWizardState.goldType !== 'refined') {
                                    window._settleWizardState.grams = '';
                                    window._settleWizardState.volume = '';
                                    window._settleWizardState.currentLocalPrice = '';
                                    window._settleWizardState.agreedValue = 0;
                                }
                                window._settleWizardState.goldType = 'refined'; 
                                window.calculateSettleGold(); 
                                window.renderSettleLoanWizard();
                            ">Refined Gold</button>
                    <button class="btn ${s.goldType === 'balls' ? 'btn-primary' : 'btn-outline'}" style="flex: 1; padding: 12px;" 
                            onclick="
                                if(window._settleWizardState.goldType !== 'balls') {
                                    window._settleWizardState.grams = '';
                                    window._settleWizardState.pricePerBlade = '';
                                    window._settleWizardState.agreedValue = 0;
                                }
                                window._settleWizardState.goldType = 'balls'; 
                                window.calculateSettleGold(); 
                                window.renderSettleLoanWizard();
                            ">Gold Balls</button>
                </div>
                
                <div class="form-group">
                    <label>Weight (Grams) <span style="color: red;">*</span></label>
                    <input type="number" step="0.01" min="0" value="${s.grams}" oninput="if(parseFloat(this.value) < 0) this.value = Math.abs(this.value); window._settleWizardState.grams = this.value; window.calculateSettleGold();" placeholder="0.00">
                </div>
                
                ${s.goldType === 'refined' ? `
                    <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                        <div class="form-group" style="flex: 1; margin-bottom: 0;">
                            <label>Volume <span style="color: red;">*</span></label>
                            <input type="number" step="0.01" min="0" value="${s.volume}" oninput="if(parseFloat(this.value) < 0) this.value = Math.abs(this.value); window._settleWizardState.volume = this.value; window.calculateSettleGold();" placeholder="0.00">
                        </div>
                        <div class="form-group" style="flex: 1; margin-bottom: 0;">
                            <label>Current Local Price (GHS) <span style="color: red;">*</span></label>
                            <input type="number" step="0.01" min="0" value="${s.currentLocalPrice}" oninput="if(parseFloat(this.value) < 0) this.value = Math.abs(this.value); window._settleWizardState.currentLocalPrice = this.value; window.calculateSettleGold();" placeholder="0.00">
                        </div>
                    </div>
                    <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; font-size: 0.9rem; margin-bottom: 16px; border: 1px solid var(--border);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Pounds:</span> <span id="calc_pounds" style="font-weight: 600;">${s.pounds.toFixed(2)} lbs</span></div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Density:</span> <span id="calc_density" style="font-weight: 600;">${s.density.toFixed(2)}</span></div>
                        <div style="display: flex; justify-content: space-between;"><span>Karat:</span> <span id="calc_karat" style="font-weight: 600;">${s.karat.toFixed(2)}</span></div>
                    </div>
                ` : `
                    <div class="form-group">
                        <label>Price Per Blade (GHS) <span style="color: red;">*</span></label>
                        <input type="number" step="0.01" min="0" value="${s.pricePerBlade}" oninput="if(parseFloat(this.value) < 0) this.value = Math.abs(this.value); window._settleWizardState.pricePerBlade = this.value; window.calculateSettleGold();" placeholder="0.00">
                    </div>
                    <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; font-size: 0.9rem; margin-bottom: 16px; border: 1px solid var(--border);">
                        <div style="display: flex; justify-content: space-between;"><span>Total Blades:</span> <span id="calc_blades" style="font-weight: 600;">${s.totalBlades.toFixed(4)}</span></div>
                    </div>
                `}
                
                <div style="background: rgba(245, 158, 11, 0.1); padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 24px; border: 1px solid rgba(245, 158, 11, 0.3);">
                    <div style="color: var(--warning); font-size: 0.85rem; text-transform: uppercase; font-weight: 600;">Calculated Value</div>
                    <div style="font-size: 1.8rem; font-weight: 700; color: var(--text-main);"><span id="calc_agreed_value_text">GHS ${s.agreedValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                </div>
            `;
        }
        else if (s.settleMethod === 'collateral') {
            const c = s.collateralData;
            
            const hasRefined = c && parseFloat(c.refined_grams) > 0;
            const hasBalls = c && parseFloat(c.balls_grams) > 0;
            
            if (!hasRefined && !hasBalls) {
                detailsHtml = `
                    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
                        <span class="material-symbols-outlined" style="font-size: 32px; color: var(--danger); margin-bottom: 8px;">error</span>
                        <div style="color: var(--danger); font-weight: 600; font-size: 1.1rem;">No Collateral Found</div>
                        <div style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">This customer has no gold held in the vault. Please select another settlement method.</div>
                    </div>
                `;
            } else {
                detailsHtml = `
                    <div style="margin-bottom: 8px; font-weight: 600; color: var(--text-main);">Available Vault Collateral (Select one):</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                        ${hasRefined ? `
                        <div onclick="
                                window._settleWizardState.goldType = 'refined';
                                window._settleWizardState.grams = '${c.refined_grams}';
                                window._settleWizardState.volume = '${c.refined_volume}';
                                window._settleWizardState.currentLocalPrice = '';
                                window._settleWizardState.agreedValue = 0;
                                window.calculateSettleGold();
                                window.renderSettleLoanWizard();
                             "
                             style="padding: 16px; border: 2px solid ${s.goldType === 'refined' ? 'var(--gold-primary)' : 'var(--border)'}; border-radius: 8px; cursor: pointer; transition: all 0.2s; background: ${s.goldType === 'refined' ? 'var(--gold-light)' : 'white'};">
                            <div style="font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Refined Gold</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">${parseFloat(c.refined_grams).toFixed(2)} g &bull; Vol: ${parseFloat(c.refined_volume).toFixed(2)}</div>
                        </div>
                        ` : ''}
                        
                        ${hasBalls ? `
                        <div onclick="
                                window._settleWizardState.goldType = 'balls';
                                window._settleWizardState.grams = '${c.balls_grams}';
                                window._settleWizardState.totalBlades = '${c.balls_blades}';
                                window._settleWizardState.pricePerBlade = '';
                                window._settleWizardState.agreedValue = 0;
                                window.calculateSettleGold();
                                window.renderSettleLoanWizard();
                             "
                             style="padding: 16px; border: 2px solid ${s.goldType === 'balls' ? 'var(--gold-primary)' : 'var(--border)'}; border-radius: 8px; cursor: pointer; transition: all 0.2s; background: ${s.goldType === 'balls' ? 'var(--gold-light)' : 'white'};">
                            <div style="font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Gold Balls</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">${parseFloat(c.balls_grams).toFixed(2)} g &bull; Blades: ${parseFloat(c.balls_blades).toFixed(4)}</div>
                        </div>
                        ` : ''}
                    </div>
                `;
                
                // Show inputs based on selection
                if (s.goldType === 'refined' && hasRefined) {
                    detailsHtml += `
                        <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                            <div class="form-group" style="flex: 1; margin-bottom: 0;">
                                <label>Weight (Grams)</label>
                                <input type="number" value="${s.grams}" readonly style="background: #f3f4f6; color: #6b7280; border-color: #d1d5db; cursor: not-allowed;">
                            </div>
                            <div class="form-group" style="flex: 1; margin-bottom: 0;">
                                <label>Volume</label>
                                <input type="number" value="${s.volume}" readonly style="background: #f3f4f6; color: #6b7280; border-color: #d1d5db; cursor: not-allowed;">
                            </div>
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label>Current Local Price (GHS) <span style="color: red;">*</span></label>
                            <input type="number" step="0.01" min="0" value="${s.currentLocalPrice}" oninput="if(parseFloat(this.value) < 0) this.value = Math.abs(this.value); window._settleWizardState.currentLocalPrice = this.value; window.calculateSettleGold();" placeholder="Enter daily price">
                        </div>
                        
                        <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; font-size: 0.9rem; margin-bottom: 16px; border: 1px solid var(--border);">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Pounds:</span> <span id="calc_pounds" style="font-weight: 600;">${s.pounds.toFixed(2)} lbs</span></div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Density:</span> <span id="calc_density" style="font-weight: 600;">${s.density.toFixed(2)}</span></div>
                            <div style="display: flex; justify-content: space-between;"><span>Karat:</span> <span id="calc_karat" style="font-weight: 600;">${s.karat.toFixed(2)}</span></div>
                        </div>
                    `;
                } else if (s.goldType === 'balls' && hasBalls) {
                    detailsHtml += `
                        <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                            <div class="form-group" style="flex: 1; margin-bottom: 0;">
                                <label>Weight (Grams)</label>
                                <input type="number" value="${s.grams}" readonly style="background: #f3f4f6; color: #6b7280; border-color: #d1d5db; cursor: not-allowed;">
                            </div>
                            <div class="form-group" style="flex: 1; margin-bottom: 0;">
                                <label>Total Blades</label>
                                <input type="number" value="${s.totalBlades}" readonly style="background: #f3f4f6; color: #6b7280; border-color: #d1d5db; cursor: not-allowed;">
                            </div>
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label>Price Per Blade (GHS) <span style="color: red;">*</span></label>
                            <input type="number" step="0.01" min="0" value="${s.pricePerBlade}" oninput="if(parseFloat(this.value) < 0) this.value = Math.abs(this.value); window._settleWizardState.pricePerBlade = this.value; window.calculateSettleGold();" placeholder="Enter blade price">
                        </div>
                    `;
                }
                
                detailsHtml += `
                    <div style="background: rgba(245, 158, 11, 0.1); padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 24px; border: 1px solid rgba(245, 158, 11, 0.3);">
                        <div style="color: var(--warning); font-size: 0.85rem; text-transform: uppercase; font-weight: 600;">Calculated Value</div>
                        <div style="font-size: 1.8rem; font-weight: 700; color: var(--text-main);"><span id="calc_agreed_value_text">GHS ${s.agreedValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                    </div>
                `;
            }
        }
        
        html = `
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <h3 style="margin: 0; color: var(--text-main); font-size: 1.1rem;">Provide Details (${s.settleMethod === 'cash' ? 'Cash' : s.settleMethod === 'gold' ? 'Walk-in Gold' : 'Collateral'})</h3>
                
                ${detailsHtml}
                
                <div class="form-group" style="margin-top: 8px;">
                    <label>Notes / Comments (Optional)</label>
                    <input type="text" value="${s.notes}" oninput="window._settleWizardState.notes = this.value;" placeholder="e.g. Paid in full...">
                </div>
                
                <div style="display: flex; gap: 12px; margin-top: 12px;">
                    <button class="btn btn-outline" style="flex: 1;" onclick="window._settleWizardState.step = 1; window.renderSettleLoanWizard();">Back</button>
                    <button class="btn btn-primary" style="flex: 2; ${s.settleMethod === 'cash' ? 'background: var(--text-main); border-color: var(--text-main);' : ''}" onclick="
                        if(window._settleWizardState.settleMethod === 'cash' && (!window._settleWizardState.amountPaid || parseFloat(window._settleWizardState.amountPaid) <= 0)) return window.showToast('Enter valid amount', 'error');
                        if((window._settleWizardState.settleMethod === 'gold' || window._settleWizardState.settleMethod === 'collateral') && (!window._settleWizardState.grams || parseFloat(window._settleWizardState.grams) <= 0)) return window.showToast('Enter valid grams or select collateral', 'error');
                        if((window._settleWizardState.settleMethod === 'gold' || window._settleWizardState.settleMethod === 'collateral') && (!window._settleWizardState.agreedValue || parseFloat(window._settleWizardState.agreedValue) <= 0)) return window.showToast('Enter valid price to compute value', 'error');
                        
                        window._settleWizardState.step = 3; 
                        window.renderSettleLoanWizard();
                    ">Review & Confirm <span class="material-symbols-outlined" style="font-size: 18px; vertical-align: middle;">arrow_forward</span></button>
                </div>
            </div>
        `;
    }
    else if (s.step === 3) {
        // Summary & Confirmation Phase
        
        let displayAmount = 0;
        let diff = 0;
        if(s.settleMethod === 'cash') {
            displayAmount = parseFloat(s.amountPaid);
            diff = s.principal - displayAmount;
        } else {
            displayAmount = parseFloat(s.agreedValue);
            diff = s.principal - displayAmount; // if < 0, customer gets change
        }
        
        html = `
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <h3 style="margin: 0; text-align: center; color: var(--text-main); font-size: 1.1rem;">Confirm Settlement</h3>
                
                <div style="background: var(--bg-main); border: 1px solid var(--border); border-radius: 8px; padding: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
                        <span style="color: var(--text-muted); font-weight: 500;">Method</span>
                        <span style="font-weight: 700; text-transform: capitalize;">${s.settleMethod === 'gold' ? 'Walk-in Gold' : s.settleMethod}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <span style="color: var(--text-muted); font-weight: 500;">Original Balance</span>
                        <span style="font-weight: 600;">GHS ${s.principal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <span style="color: var(--text-muted); font-weight: 500;">Value Provided</span>
                        <span style="font-weight: 700; color: var(--success);">GHS ${displayAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    
                    ${(s.settleMethod === 'gold' || s.settleMethod === 'collateral') ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-top: 1px dashed var(--border); padding-top: 12px;">
                            <span style="color: var(--text-muted); font-weight: 500;">Gold Weight Used</span>
                            <span style="font-weight: 600;">${parseFloat(s.grams).toFixed(2)} g</span>
                        </div>
                        ${s.goldType === 'refined' ? `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                <span style="color: var(--text-muted); font-weight: 500;">Volume</span>
                                <span style="font-weight: 600;">${parseFloat(s.volume).toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                <span style="color: var(--text-muted); font-weight: 500;">Current Local Price</span>
                                <span style="font-weight: 600;">GHS ${parseFloat(s.currentLocalPrice).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                <span style="color: var(--text-muted); font-weight: 500;">Pounds (Lbs)</span>
                                <span style="font-weight: 600;">${s.pounds}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                <span style="color: var(--text-muted); font-weight: 500;">Density</span>
                                <span style="font-weight: 600;">${s.density}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                <span style="color: var(--text-muted); font-weight: 500;">Karat</span>
                                <span style="font-weight: 600;">${s.karat}K</span>
                            </div>
                        ` : ''}
                        ${s.goldType === 'balls' ? `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                <span style="color: var(--text-muted); font-weight: 500;">Total Blades</span>
                                <span style="font-weight: 600;">${parseFloat(s.totalBlades).toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                <span style="color: var(--text-muted); font-weight: 500;">Price per Blade</span>
                                <span style="font-weight: 600;">GHS ${parseFloat(s.pricePerBlade).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                            </div>
                        ` : ''}
                    ` : ''}
                    
                    <div style="display: flex; justify-content: space-between; margin-top: 16px; border-top: 2px solid var(--border); padding-top: 16px;">
                        <span style="color: var(--text-main); font-weight: 600;">${diff < 0 ? 'Change Due to Customer' : 'Remaining Balance'}</span>
                        <span style="font-weight: 700; font-size: 1.1rem; color: ${diff < 0 ? 'var(--info)' : 'var(--warning)'};">
                            GHS ${Math.abs(diff).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </span>
                    </div>
                    
                    ${s.notes ? `
                        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px dashed var(--border);">
                            <div style="color: var(--text-muted); font-size: 0.85rem; font-style: italic;">"${s.notes}"</div>
                        </div>
                    ` : ''}
                </div>
                
                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-outline" style="flex: 1;" onclick="window._settleWizardState.step = 2; window.renderSettleLoanWizard();">Back</button>
                    <button class="btn btn-primary" id="btn-submit-settle" style="flex: 2; ${s.settleMethod === 'cash' ? 'background: var(--text-main); border-color: var(--text-main);' : 'background: var(--success); border-color: var(--success);'} color: white;" onclick="window.submitSettleLoanWizard()">
                        <span class="material-symbols-outlined" style="font-size: 18px; vertical-align: middle;">check_circle</span> Process Settlement
                    </button>
                </div>
            </div>
        `;
    }

    const existingBody = document.getElementById('modal-body');
    if (existingBody && document.getElementById('global-modal').classList.contains('active')) {
        existingBody.innerHTML = html;
        document.getElementById('modal-title').textContent = 'Settle Loan';
    } else {
        window.openModal('Settle Loan', html);
    }
};

window.submitSettleLoanWizard = async () => {
    const s = window._settleWizardState;
    const btn = document.getElementById('btn-submit-settle');
    if(btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';
    }
    
    let endpoint = '';
    let payload = {};
    
    if (s.settleMethod === 'cash') {
        endpoint = '/loans/repay_cash.php';
        payload = {
            loan_id: s.loanId,
            customer_id: s.customerId,
            amount_paid_ghs: parseFloat(s.amountPaid),
            comment: s.notes
        };
    } else if (s.settleMethod === 'gold') {
        endpoint = '/loans/offset.php';
        payload = {
            loan_id: s.loanId,
            customer_id: s.customerId,
            gold_type: s.goldType,
            weight_grams: parseFloat(s.grams),
            gold_value_ghs: parseFloat(s.agreedValue),
            comment: s.notes,
            
            current_local_price: parseFloat(s.currentLocalPrice) || null,
            volume: parseFloat(s.volume) || null,
            pounds: s.pounds,
            density: s.density,
            karat: s.karat,
            price_per_blade: parseFloat(s.pricePerBlade) || null,
            total_blades: s.totalBlades
        };
    } else if (s.settleMethod === 'collateral') {
        endpoint = '/loans/offset_collateral.php';
        payload = {
            loan_id: s.loanId,
            customer_id: s.customerId,
            gold_type: s.goldType,
            grams_to_use: parseFloat(s.grams),
            agreed_value_ghs: parseFloat(s.agreedValue),
            comment: s.notes,
            
            // Re-submit collateral details for record keeping
            current_local_price: parseFloat(s.currentLocalPrice) || null,
            volume: parseFloat(s.volume) || null,
            total_blades: parseFloat(s.totalBlades) || null,
            pounds: s.pounds,
            density: s.density,
            karat: s.karat,
            price_per_blade: parseFloat(s.pricePerBlade) || null
        };
    }

    try {
        await window.api.post(endpoint, payload);
        window.showToast('Loan settlement processed successfully!', 'success');
        window.closeModal();
        window.viewCustomer(s.customerId); // Refresh profile
    } catch (error) {
        window.showToast(error.message, 'error');
        if(btn) {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Process Settlement';
        }
    }
};


