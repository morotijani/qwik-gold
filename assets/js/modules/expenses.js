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

            container.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 class="page-title" style="margin: 0; font-size: initial; font-weight: 700; color: var(--text-main);">Office Expenditures</h2>
                    <button class="btn btn-primary" onclick="window.openRecordExpenseModal()">
                        <span class="material-symbols-outlined" style="font-size: 20px; font-weight: 300;">add</span> Record Expense
                    </button>
                </div>
                
                <div class="metric-grid" style="margin-bottom: 32px;">
                    <div class="metric-card" style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);">
                        <div class="metric-icon" style="background: var(--danger-bg); color: var(--danger);">
                            <span class="material-symbols-outlined">receipt_long</span>
                        </div>
                        <div class="metric-content">
                            <h3>Total Lifetime Expenses</h3>
                            <div class="metric-value" style="color: var(--danger);">GHS ${Number(response.total_lifetime_ghs || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>
                    
                    <div class="metric-card" style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);">
                        <div class="metric-icon" style="background: var(--warning-bg); color: var(--warning);">
                            <span class="material-symbols-outlined">calendar_month</span>
                        </div>
                        <div class="metric-content">
                            <h3>Expenses This Month</h3>
                            <div class="metric-value">GHS ${Number(response.total_month_ghs || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>
                </div>

                <div class="glass-panel" style="background: transparent; border: none; box-shadow: none; padding: 0;">
                    <h3 style="font-size: 1.1rem; margin-bottom: 16px; color: var(--text-main);">Expenditure History</h3>
                    <div class="journey-stream">
                        ${response.expenses && response.expenses.length > 0 ? response.expenses.map(exp => `
                            <div class="journey-node">
                                <div class="journey-dot danger"></div>
                                <div class="journey-card">
                                    <div class="journey-card-left">
                                        <div class="journey-icon" style="background: var(--danger-bg); color: var(--danger);">
                                            <span class="material-symbols-outlined">payments</span>
                                        </div>
                                        <div class="journey-details">
                                            <div class="journey-title">${exp.description}</div>
                                            <div class="journey-date">${new Date(exp.date).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div class="journey-card-right">
                                        <div class="journey-amount" style="color: var(--danger);">- ${Number(exp.amount_ghs).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                        <div class="journey-ref" style="display: flex; gap: 8px;">
                                            <span style="background: var(--bg-main); padding: 2px 6px; border-radius: 4px;">EXP-${String(exp.id).padStart(6, '0')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('') : '<p style="color: var(--text-muted);">No expenses recorded yet.</p>'}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Failed to load expenses', error);
            container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--danger);">Failed to load expenses.</div>`;
        }
    };

    window.openRecordExpenseModal = () => {
        document.getElementById('modal-title').textContent = 'Record Office Expense';
        const modalBody = document.getElementById('modal-body');

        modalBody.innerHTML = `
            <form id="record-expense-form" onsubmit="window.submitExpense(event)">
                <div style="background: var(--warning-bg); color: #b45309; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; font-size: 0.9rem; display: flex; gap: 8px; align-items: center;">
                    <span class="material-symbols-outlined">info</span>
                    This amount will be directly deducted from the Capital Ledger.
                </div>
                
                <div class="form-group">
                    <label>Expense Description <span style="color: var(--danger);">*</span></label>
                    <input type="text" id="expense_description" required placeholder="e.g. Internet Bill, Fuel, Stationery...">
                </div>
                
                <div class="form-group">
                    <label>Amount (GHS) <span style="color: var(--danger);">*</span></label>
                    <input type="number" id="expense_amount" required step="0.01" min="0.01" placeholder="0.00">
                </div>
                
                <div class="form-group">
                    <label>Date (Optional, defaults to today)</label>
                    <input type="date" id="expense_date">
                </div>
                
                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 32px; background: var(--danger); color: white;">
                    <span class="material-symbols-outlined">payments</span> Deduct from Ledger
                </button>
            </form>
        `;

        document.getElementById('global-modal').classList.add('active');
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

    render();
});
