// assets/js/modules/expenses.js

window.addEventListener('route-changed', async (e) => {
    if (e.detail.route !== 'expenses') return;
    const container = e.detail.container;

    // Loading State
    container.innerHTML = `
        <div style="display: flex; justify-content: center; padding: 40px;">
            <span class="material-symbols-outlined spin" style="font-size: 2rem; color: var(--gold-primary);">sync</span>
        </div>
    `;

    const render = async () => {
        try {
            const response = await window.api.get('/expenses/list.php');

            let expensesHtml = '';
            if (!response.expenses || response.expenses.length === 0) {
                expensesHtml = `
                    <tr>
                        <td colspan="5" style="padding: 48px 24px; text-align: center; color: var(--text-muted);">
                            <span class="material-symbols-outlined" style="font-size: 3rem; color: var(--border); margin-bottom: 12px; display: block;">receipt_long</span>
                            <p style="margin: 0; font-size: 1rem;">No expenses recorded yet.</p>
                            <p style="margin: 4px 0 0 0; font-size: 0.85rem;">Click "Record Expense" to add your first office expenditure.</p>
                        </td>
                    </tr>
                `;
            } else {
                expensesHtml = response.expenses.map(exp => `
                    <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='white'">
                        <td style="padding: 16px; color: var(--text-main); font-weight: 500;">
                            ${new Date(exp.date).toLocaleDateString()}
                        </td>
                        <td style="padding: 16px; font-weight: 600; color: var(--text-muted); font-size: 0.9rem;">
                            EXP-${String(exp.id).padStart(6, '0')}
                        </td>
                        <td style="padding: 16px; font-weight: 500; color: var(--text-main);">
                            ${exp.description}
                        </td>
                        <td style="padding: 16px; font-weight: 700; color: var(--danger); text-align: right;">
                            - GHS ${Number(exp.amount_ghs).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td style="padding: 16px; text-align: right;">
                            <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem; border-color: var(--danger); color: var(--danger);" onclick="window.confirmDeleteExpense(${exp.id}, ${exp.amount_ghs}, '${exp.description.replace(/'/g, "\\'")}')">
                                <span class="material-symbols-outlined" style="font-size: 1rem; vertical-align: middle;">delete</span> Void
                            </button>
                        </td>
                    </tr>
                `).join('');
            }

            container.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 class="page-title" style="margin: 0; font-size: initial; font-weight: 700; color: var(--text-main);">Office Expenditures</h2>
                    <button class="btn btn-primary" onclick="window.openRecordExpenseModal()">
                        <span class="material-symbols-outlined" style="font-size: 20px; font-weight: 300;">add</span> Record Expense
                    </button>
                </div>
                
                <div class="metric-grid" style="margin-bottom: 32px; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
                    <div class="metric-card" style="background: linear-gradient(145deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.01) 100%); border: 1px solid rgba(239, 68, 68, 0.2);">
                        <div class="metric-icon" style="background: var(--danger-bg); color: var(--danger);">
                            <span class="material-symbols-outlined">receipt_long</span>
                        </div>
                        <div class="metric-content">
                            <h3>Total Lifetime Expenses</h3>
                            <div class="metric-value" style="color: var(--danger);">GHS ${Number(response.total_lifetime_ghs || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>
                    
                    <div class="metric-card" style="background: linear-gradient(145deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.01) 100%); border: 1px solid rgba(245, 158, 11, 0.2);">
                        <div class="metric-icon" style="background: var(--warning-bg); color: var(--warning);">
                            <span class="material-symbols-outlined">calendar_month</span>
                        </div>
                        <div class="metric-content">
                            <h3>Expenses This Month</h3>
                            <div class="metric-value" style="color: var(--warning);">GHS ${Number(response.total_month_ghs || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>

                    <div class="metric-card" style="background: linear-gradient(145deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.01) 100%); border: 1px solid rgba(16, 185, 129, 0.2);">
                        <div class="metric-icon" style="background: #d1fae5; color: #10b981;">
                            <span class="material-symbols-outlined">today</span>
                        </div>
                        <div class="metric-content">
                            <h3>Expenses Today</h3>
                            <div class="metric-value" style="color: #10b981;">GHS ${Number(response.total_today_ghs || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>
                </div>

                <div style="background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow-x: auto; border: 1px solid var(--border);">
                    <div style="padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px;">
                        <span class="material-symbols-outlined" style="color: var(--text-muted);">history</span>
                        <h3 style="font-size: 1.1rem; margin: 0; color: var(--text-main); font-weight: 700;">Expenditure History</h3>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; min-width: 700px;">
                        <thead>
                            <tr style="background: var(--bg-main); color: var(--text-muted); font-size: 0.85rem; text-align: left; text-transform: uppercase;">
                                <th style="padding: 16px 24px; font-weight: 600; border-bottom: 1px solid var(--border);">Date</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Reference</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Description</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border); text-align: right;">Amount (GHS)</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border); text-align: right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${expensesHtml}
                        </tbody>
                    </table>
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
                <div style="background: linear-gradient(145deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.02) 100%); border: 1px solid rgba(245, 158, 11, 0.2); color: #b45309; padding: 16px; border-radius: 8px; margin-bottom: 24px; font-size: 0.9rem; display: flex; gap: 12px; align-items: flex-start;">
                    <span class="material-symbols-outlined" style="margin-top: 2px;">info</span>
                    <div>
                        <strong>Ledger Deduction</strong><br>
                        This amount will be directly deducted from the Capital Ledger. Please ensure the amount and date are correct.
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Expense Description <span style="color: var(--danger);">*</span></label>
                    <input type="text" id="expense_description" required placeholder="e.g. Fuel, Light Bill, Food..." style="padding: 12px; font-size: 1rem;">
                </div>
                
                <div class="form-group">
                    <label>Amount (GHS) <span style="color: var(--danger);">*</span></label>
                    <input type="number" id="expense_amount" required step="0.01" min="0.01" placeholder="0.00" style="padding: 12px; font-size: 1.1rem; font-weight: 600;">
                </div>
                
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" id="expense_date" style="padding: 12px;">
                    <small style="color: var(--text-muted); display: block; margin-top: 4px;">Leave empty to use today's date</small>
                </div>
                
                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 32px; background: var(--danger); border-color: var(--danger); color: white; font-size: 1rem; padding: 14px;">
                    <span class="material-symbols-outlined">payments</span> Deduct from Ledger
                </button>
            </form>
        `;

        window.openModal('Record Office Expense', html);
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
            render();
        } catch (error) {
            window.showToast(error.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">payments</span> Deduct from Ledger';
        }
    };

    window.confirmDeleteExpense = (id, amount, description) => {
        const html = `
            <div style="text-align: center; padding: 10px 0;">
                <div style="width: 64px; height: 64px; background: var(--danger-bg); color: var(--danger); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
                    <span class="material-symbols-outlined" style="font-size: 32px;">warning</span>
                </div>
                <h3 style="margin-top: 0;">Void Expense</h3>
                <p style="color: var(--text-muted); margin-bottom: 24px;">
                    Are you sure you want to void <strong>${description}</strong> for <strong>GHS ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>?<br><br>
                    This will delete the expense record and refund the amount back to the Capital Ledger.
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
            await window.api.post('/expenses/delete.php', { expense_id: id });
            window.showToast('Expense voided and ledger refunded.', 'success');
            window.closeModal();
            render();
        } catch (e) {
            window.showToast(e.message || 'Failed to void expense', 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'Yes, Void It';
            }
        }
    };

    render();
});
