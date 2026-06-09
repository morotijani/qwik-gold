// assets/js/modules/expenses.js

window.addEventListener('route-changed', async (e) => {
    if (e.detail.route !== 'expenses') return;
    const container = e.detail.container;

    if (!window._expensesState) {
        window._expensesState = { statusFilter: 'active', page: 1, limit: 50 };
    }

    window.setExpenseFilter = (status) => {
        window._expensesState.statusFilter = status;
        window._expensesState.page = 1; // Reset to first page on filter change
        window.loadExpensesDashboard();
    };

    window.changeExpensesPage = (newPage) => {
        window._expensesState.page = newPage;
        window.loadExpensesDashboard();
    };

    // Loading State
    container.innerHTML = `
        <div style="display: flex; justify-content: center; padding: 40px;">
            <span class="material-symbols-outlined spin" style="font-size: 2rem; color: var(--gold-primary);">sync</span>
        </div>
    `;

    window.loadExpensesDashboard = async () => {
        try {
            const status = window._expensesState.statusFilter;
            const limit = window._expensesState.limit;
            const offset = (window._expensesState.page - 1) * limit;

            const response = await window.api.get(`/expenses/list.php?status=${status}&limit=${limit}&offset=${offset}`);

            let expensesHtml = '';
            if (!response.expenses || response.expenses.length === 0) {
                expensesHtml = `
                    <tr>
                        <td colspan="6" style="padding: 48px 24px; text-align: center; color: var(--text-muted);">
                            <span class="material-symbols-outlined" style="font-size: 3rem; color: var(--border); margin-bottom: 12px; display: block;">receipt_long</span>
                            <p style="margin: 0; font-size: 1rem;">No expenses found.</p>
                        </td>
                    </tr>
                `;
            } else {
                expensesHtml = response.expenses.map((exp, index) => {
                    const isVoided = exp.status === 'voided';
                    const rowStyle = isVoided ? 'background: #fafafa; opacity: 0.7;' : 'background: white;';
                    const textStyle = isVoided ? 'text-decoration: line-through; color: var(--text-muted);' : 'color: #f43f5e;';
                    const rowNumber = offset + index + 1;

                    let actionsHtml = '';
                    if (isVoided) {
                        actionsHtml = `
                            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem; border-color: #fca5a5; color: #ef4444; border-radius: 8px; background: white;" onclick="window.confirmPermanentDeleteExpense(${exp.id}, ${exp.amount_ghs}, '${exp.description.replace(/'/g, "\\'")}')">
                                <span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle;">delete_forever</span> Perm Delete
                            </button>
                        `;
                    } else {
                        actionsHtml = `
                            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem; border-color: #fcd34d; color: #d97706; border-radius: 8px; background: white;" onclick="window.confirmDeleteExpense(${exp.id}, ${exp.amount_ghs}, '${exp.description.replace(/'/g, "\\'")}')">
                                <span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle;">block</span> Void
                            </button>
                        `;
                    }

                    return `
                    <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s; ${rowStyle}" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='${isVoided ? '#fafafa' : 'white'}'">
                        <td style="padding: 16px 24px; color: var(--text-muted); font-weight: 500; width: 50px;">
                            ${rowNumber}
                        </td>
                        <td style="padding: 16px; color: var(--text-main); font-weight: 500;">
                            ${new Date(exp.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td style="padding: 16px; font-weight: 600; color: var(--text-muted);">
                            <span style="background: var(--bg-main); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); font-size: 0.85rem;">EXP-${String(exp.id).padStart(6, '0')}</span>
                            ${isVoided ? '<span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 4px 8px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; margin-left: 8px; display: inline-flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 12px;">cancel</span> VOIDED</span>' : ''}
                        </td>
                        <td style="padding: 16px; font-weight: 500; color: var(--text-main); font-size: 0.95rem;">
                            ${exp.description}
                        </td>
                        <td style="padding: 16px 24px; font-weight: 800; ${textStyle} text-align: right; font-size: 1.05rem;">
                            - ${Number(exp.amount_ghs).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td style="padding: 16px; text-align: right;">
                            ${actionsHtml}
                        </td>
                    </tr>
                `;
                }).join('');
            }

            container.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 class="page-title" style="margin: 0; font-size: initial; font-weight: 700; color: var(--text-main);">Office Expenditures</h2>
                    <button class="btn btn-primary" onclick="window.openRecordExpenseModal()">
                        <span class="material-symbols-outlined" style="font-size: 20px; font-weight: 300;">add</span> Record Expense
                    </button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-bottom: 32px;">
                    
                    <!-- Total Lifetime -->
                    <div style="background: linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%); border-radius: 20px; padding: 28px; position: relative; overflow: hidden; box-shadow: 0 10px 25px rgba(185, 28, 28, 0.2);">
                        <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(255,255,255,0.1); border-radius: 50%; filter: blur(30px);"></div>
                        <div style="position: relative; z-index: 1;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                                <div style="color: #fecaca; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Lifetime Expenses</div>
                                <div style="background: rgba(255,255,255,0.15); width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                                    <span class="material-symbols-outlined" style="color: white; font-size: 24px;">receipt_long</span>
                                </div>
                            </div>
                            <div style="font-size: 2.2rem; font-weight: 800; color: white; display: flex; align-items: center; gap: 8px; line-height: 1; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                <span style="font-size: 1.2rem; opacity: 0.8; font-weight: 600;">GHS</span> 
                                ${Number(response.total_lifetime_ghs || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>

                    <!-- Expenses This Month -->
                    <div style="background: linear-gradient(135deg, #78350f 0%, #d97706 100%); border-radius: 20px; padding: 28px; position: relative; overflow: hidden; box-shadow: 0 10px 25px rgba(217, 119, 6, 0.2);">
                        <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(255,255,255,0.1); border-radius: 50%; filter: blur(30px);"></div>
                        <div style="position: relative; z-index: 1;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                                <div style="color: #fde68a; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Expenses This Month</div>
                                <div style="background: rgba(255,255,255,0.15); width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                                    <span class="material-symbols-outlined" style="color: white; font-size: 24px;">calendar_month</span>
                                </div>
                            </div>
                            <div style="font-size: 2.2rem; font-weight: 800; color: white; display: flex; align-items: center; gap: 8px; line-height: 1; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                <span style="font-size: 1.2rem; opacity: 0.8; font-weight: 600;">GHS</span> 
                                ${Number(response.total_month_ghs || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>

                    <!-- Expenses Today -->
                    <div style="background: linear-gradient(135deg, #064e3b 0%, #059669 100%); border-radius: 20px; padding: 28px; position: relative; overflow: hidden; box-shadow: 0 10px 25px rgba(5, 150, 105, 0.2);">
                        <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(255,255,255,0.1); border-radius: 50%; filter: blur(30px);"></div>
                        <div style="position: relative; z-index: 1;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                                <div style="color: #a7f3d0; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Expenses Today</div>
                                <div style="background: rgba(255,255,255,0.15); width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                                    <span class="material-symbols-outlined" style="color: white; font-size: 24px;">today</span>
                                </div>
                            </div>
                            <div style="font-size: 2.2rem; font-weight: 800; color: white; display: flex; align-items: center; gap: 8px; line-height: 1; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                <span style="font-size: 1.2rem; opacity: 0.8; font-weight: 600;">GHS</span> 
                                ${Number(response.total_today_ghs || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>
                </div>

                <div style="background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow-x: auto; border: 1px solid var(--border);">
                    <div style="padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="material-symbols-outlined" style="color: var(--text-muted);">history</span>
                            <h3 style="font-size: 1.1rem; margin: 0; color: var(--text-main); font-weight: 700;">Expenditure History</h3>
                        </div>
                        <div style="display: flex; background: var(--bg-main); border-radius: 12px; padding: 4px; border: 1px solid var(--border);">
                            <button class="btn" style="padding: 8px 16px; font-size: 0.85rem; font-weight: 600; border-radius: 8px; transition: all 0.2s; border: none; ${window._expensesState.statusFilter === 'active' ? 'background: white; color: var(--text-main); box-shadow: 0 2px 4px rgba(0,0,0,0.05);' : 'background: transparent; color: var(--text-muted);'}" onclick="window.setExpenseFilter('active')">Active</button>
                            <button class="btn" style="padding: 8px 16px; font-size: 0.85rem; font-weight: 600; border-radius: 8px; transition: all 0.2s; border: none; ${window._expensesState.statusFilter === 'voided' ? 'background: white; color: var(--danger); box-shadow: 0 2px 4px rgba(0,0,0,0.05);' : 'background: transparent; color: var(--text-muted);'}" onclick="window.setExpenseFilter('voided')">Voided</button>
                            <button class="btn" style="padding: 8px 16px; font-size: 0.85rem; font-weight: 600; border-radius: 8px; transition: all 0.2s; border: none; ${window._expensesState.statusFilter === 'all' ? 'background: white; color: var(--primary); box-shadow: 0 2px 4px rgba(0,0,0,0.05);' : 'background: transparent; color: var(--text-muted);'}" onclick="window.setExpenseFilter('all')">All</button>
                        </div>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; min-width: 700px;">
                        <thead>
                            <tr style="background: var(--bg-main); color: var(--text-muted); font-size: 0.85rem; text-align: left; text-transform: uppercase;">
                                <th style="padding: 16px 24px; font-weight: 600; border-bottom: 1px solid var(--border); width: 50px;">#</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Date</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Reference</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Description</th>
                                <th style="padding: 16px 24px; font-weight: 600; border-bottom: 1px solid var(--border); text-align: right;">Amount (GHS)</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border); text-align: right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${expensesHtml}
                        </tbody>
                    </table>
                    
                    ${response.total_count > limit ? `
                    <div style="padding: 16px 24px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: var(--bg-main); border-radius: 0 0 12px 12px;">
                        <span style="font-size: 0.85rem; color: var(--text-muted);">
                            Showing ${offset + 1} to ${Math.min(offset + limit, response.total_count)} of ${response.total_count} expenses
                        </span>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.85rem;" 
                                ${window._expensesState.page === 1 ? 'disabled' : ''} 
                                onclick="window.changeExpensesPage(${window._expensesState.page - 1})">Previous</button>
                            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.85rem;" 
                                ${offset + limit >= response.total_count ? 'disabled' : ''} 
                                onclick="window.changeExpensesPage(${window._expensesState.page + 1})">Next</button>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
        } catch (error) {
            console.error('Failed to load expenses', error);
            container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--danger);">Failed to load expenses.</div>`;
        }
    };

    window.openRecordExpenseModal = () => {
        const html = `
            <form id="record-expense-form" onsubmit="window.submitExpense(event)">
                <!-- Info Banner -->
                <div style="background: linear-gradient(145deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.02) 100%); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 16px; padding: 20px; margin-bottom: 32px; display: flex; gap: 16px; align-items: center; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.05);">
                    <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, var(--danger), #b91c1c); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">
                        <span class="material-symbols-outlined" style="font-size: 1.6rem;">account_balance_wallet</span>
                    </div>
                    <div>
                        <div style="font-size: 0.95rem; font-weight: 800; color: var(--danger); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Ledger Deduction</div>
                        <div style="font-size: 0.85rem; color: var(--text-main); line-height: 1.4;">This amount will be directly deducted from the Capital Ledger. Ensure the amount and date are correct before proceeding.</div>
                    </div>
                </div>

                <style>
                    #expense_amount::-webkit-outer-spin-button,
                    #expense_amount::-webkit-inner-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                    }
                    #expense_amount[type=number] {
                        -moz-appearance: textfield;
                    }
                </style>

                <!-- Amount Input -->
                <div class="form-group" style="margin-bottom: 32px;">
                    <label style="display: block; font-weight: 800; color: var(--text-muted); margin-bottom: 12px; font-size: 0.85rem; text-align: center; letter-spacing: 1.5px; text-transform: uppercase;">Expense Amount <span style="color: var(--danger);">*</span></label>
                    <div style="position: relative;">
                        <span style="position: absolute; left: 24px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-weight: 700; font-size: 1.8rem; pointer-events: none;">₵</span>
                        <input type="number" id="expense_amount" required step="0.01" min="0.01" placeholder="0.00" 
                               style="width: 100%; padding: 24px 64px; font-size: 2.8rem; font-weight: 800; border: 2px solid #e2e8f0; border-radius: 20px; background: #f8fafc; transition: all 0.3s; text-align: center; color: var(--danger); letter-spacing: -1px; box-shadow: inset 0 2px 6px rgba(0,0,0,0.02);"
                               onfocus="this.style.borderColor='var(--danger)'; this.style.background='white'; this.style.boxShadow='0 0 0 4px rgba(239, 68, 68, 0.1), inset 0 2px 4px rgba(0,0,0,0.02)';" 
                               onblur="this.style.borderColor='#e2e8f0'; this.style.background='#f8fafc'; this.style.boxShadow='inset 0 2px 6px rgba(0,0,0,0.02)';">
                    </div>
                </div>

                <!-- Description & Date Inputs -->
                <div style="margin-bottom: 32px;">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px; font-size: 0.95rem;">Description <span style="color: var(--danger);">*</span></label>
                        <div style="position: relative;">
                            <span class="material-symbols-outlined" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none;">edit_note</span>
                            <input type="text" id="expense_description" required placeholder="e.g. Fuel, Light Bill..." 
                                   style="width: 100%; padding: 14px 16px 14px 48px; border: 2px solid var(--border); border-radius: 12px; background: var(--bg-main); font-size: 1rem; transition: all 0.2s;"
                                   onfocus="this.style.borderColor='var(--info)'; this.style.background='white';" onblur="this.style.borderColor='var(--border)'; this.style.background='var(--bg-main)';">
                        </div>
                    </div>
                </div>
                
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px; font-size: 0.95rem;">Date</label>
                    <div style="position: relative;">
                        <span class="material-symbols-outlined" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none;">calendar_today</span>
                        <input type="date" id="expense_date" 
                                style="width: 100%; padding: 14px 16px 14px 48px; border: 2px solid var(--border); border-radius: 12px; background: var(--bg-main); font-size: 1rem; transition: all 0.2s; font-family: inherit;"
                                onfocus="this.style.borderColor='var(--info)'; this.style.background='white';" onblur="this.style.borderColor='var(--border)'; this.style.background='var(--bg-main)';">
                    </div>
                </div>

                <div style="text-align: right; margin-top: -24px; margin-bottom: 32px;">
                    <small style="color: var(--text-muted); font-size: 0.8rem; font-weight: 500;">Leave date empty to use today's date</small>
                </div>
                
                <!-- Submit Action -->
                <div style="padding-top: 24px; border-top: 1px dashed var(--border); margin-top: 16px;">
                    <button type="submit" class="btn" style="width: 100%; background: linear-gradient(135deg, var(--danger), #b91c1c); color: white; border: none; font-weight: 700; padding: 16px; font-size: 1.1rem; border-radius: 12px; box-shadow: 0 8px 20px rgba(239, 68, 68, 0.25); display: flex; align-items: center; justify-content: center; gap: 8px; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='none'">
                        <span class="material-symbols-outlined">payments</span> Deduct from Ledger
                    </button>
                </div>
            </form>
        `;

        window.openModal('Record Office Expense', html, { maxWidth: '600px' });
    };

    window.submitExpense = async (event) => {
        event.preventDefault();
        const btn = event.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';

        const payload = {
            description: document.getElementById('expense_description').value,
            amount_ghs: document.getElementById('expense_amount').value,
            date: document.getElementById('expense_date').value
        };

        try {
            await window.api.post('/expenses/create.php', payload);
            window.showToast('Expense recorded and ledger updated!', 'success');
            window.closeModal();
            window.loadExpensesDashboard();
        } catch (error) {
            window.showToast(error.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">payments</span> Deduct from Ledger';
        }
    };

    window.confirmDeleteExpense = (id, amount, description) => {
        const html = `
            <div style="text-align: center; padding: 10px 0;">
                <div style="width: 64px; height: 64px; background: var(--warning-bg); color: var(--warning); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
                    <span class="material-symbols-outlined" style="font-size: 32px;">block</span>
                </div>
                <h3 style="margin-top: 0;">Void Expense</h3>
                <p style="color: var(--text-muted); margin-bottom: 24px;">
                    Are you sure you want to void <strong>${description}</strong> for <strong>GHS ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>?<br><br>
                    This will mark the record as voided and refund the amount back to the Capital Ledger.
                </p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button class="btn btn-outline" style="flex: 1;" onclick="window.closeModal()">Cancel</button>
                    <button class="btn btn-primary" id="btn-confirm-delete" style="flex: 1; background: var(--danger); border-color: var(--danger); color: white;" onclick="window.executeDeleteExpense(${id})">Yes, Void It</button>
                </div>
            </div>
        `;
        window.openModal('Confirm Action', html, { maxWidth: '450px' });
    };

    window.executeDeleteExpense = async (id) => {
        const btn = document.getElementById('btn-confirm-delete');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Voiding...';
        }

        try {
            await window.api.post('/expenses/delete.php', { expense_id: id, permanent: false });
            window.showToast('Expense voided and ledger refunded.', 'success');
            window.closeModal();
            window.loadExpensesDashboard();
        } catch (e) {
            window.showToast(e.message || 'Failed to void expense', 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'Yes, Void It';
            }
        }
    };

    window.confirmPermanentDeleteExpense = (id, amount, description) => {
        const html = `
            <div style="text-align: center; padding: 10px 0;">
                <div style="width: 64px; height: 64px; background: var(--danger-bg); color: var(--danger); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
                    <span class="material-symbols-outlined" style="font-size: 32px;">delete_forever</span>
                </div>
                <h3 style="margin-top: 0;">Permanently Delete</h3>
                <p style="color: var(--text-muted); margin-bottom: 24px;">
                    Are you sure you want to permanently delete <strong>${description}</strong>?<br><br>
                    This action cannot be undone. It will remove the record entirely from the database.
                </p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button class="btn btn-outline" style="flex: 1;" onclick="window.closeModal()">Cancel</button>
                    <button class="btn btn-primary" id="btn-confirm-perm-delete" style="flex: 1; background: var(--danger); border-color: var(--danger); color: white;" onclick="window.executePermanentDeleteExpense(${id})">Permanently Delete</button>
                </div>
            </div>
        `;
        window.openModal('Confirm Permanent Delete', html, { maxWidth: '450px' });
    };

    window.executePermanentDeleteExpense = async (id) => {
        const btn = document.getElementById('btn-confirm-perm-delete');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Deleting...';
        }

        try {
            await window.api.post('/expenses/delete.php', { expense_id: id, permanent: true });
            window.showToast('Expense permanently deleted.', 'success');
            window.closeModal();
            window.loadExpensesDashboard();
        } catch (e) {
            window.showToast(e.message || 'Failed to delete expense', 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'Permanently Delete';
            }
        }
    };

    window.loadExpensesDashboard();
});
