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
                    <h2 class="page-title" style="margin: 0;">Office Expenditures</h2>
                    <button class="btn btn-primary" onclick="window.openRecordExpenseModal()">
                        <span class="material-symbols-outlined">add</span> Record Expense
                    </button>
                </div>
                
                <div class="metric-grid" style="margin-bottom: 24px;">
                    <div class="metric-card">
                        <div class="metric-icon" style="background: rgba(255, 107, 107, 0.1); color: #ff6b6b;">
                            <span class="material-symbols-outlined">receipt_long</span>
                        </div>
                        <div class="metric-content">
                            <h3>Total Lifetime Expenses</h3>
                            <div class="metric-value" style="color: #ff6b6b;">GHS ${Number(response.total_lifetime_ghs || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-icon" style="background: rgba(255, 215, 0, 0.1); color: var(--gold-primary);">
                            <span class="material-symbols-outlined">calendar_month</span>
                        </div>
                        <div class="metric-content">
                            <h3>Expenses This Month</h3>
                            <div class="metric-value">GHS ${Number(response.total_month_ghs || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>
                </div>

                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th style="width: 50px;">No.</th>
                                <th>Date</th>
                                <th>Description</th>
                                <th style="text-align: right;">Amount (GHS)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${response.expenses && response.expenses.length > 0 ? response.expenses.map((exp, index) => `
                                <tr>
                                    <td style="color: var(--text-muted);">${index + 1}</td>
                                    <td>${new Date(exp.date).toLocaleDateString()}</td>
                                    <td style="font-weight: 500;">${exp.description}</td>
                                    <td style="text-align: right; font-weight: 600; color: #ff6b6b;">- ${Number(exp.amount_ghs).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                            `).join('') : '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No expenses recorded yet.</td></tr>'}
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
        document.getElementById('modal-title').textContent = 'Record Office Expense';
        const modalBody = document.getElementById('modal-body');

        modalBody.innerHTML = `
            <form id="record-expense-form" onsubmit="window.submitExpense(event)">
                <div class="alert alert-warning" style="margin-bottom: 20px;">
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
                
                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 24px; background: #ff6b6b; color: white;">
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
