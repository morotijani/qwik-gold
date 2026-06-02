// assets/js/modules/loans.js

(function () {
    window.addEventListener('route-changed', async (e) => {
        if (e.detail.route !== 'loans') return;

        const container = e.detail.container;

        // Initial Skeleton
        container.innerHTML = `
            <div style="max-width: 1100px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 class="page-title" style="font-size: initial; font-weight: 600; margin: 0;">Loan Portfolio</h2>
                    <button class="btn-text" style="display: flex; align-items: center; gap: 6px; font-weight: 500; font-size: 0.95rem; color: var(--text-main); border: none; cursor: pointer; padding: 6px 12px; transition: background 0.2s; border-radius: 6px;" onclick="window.openIssueLoanModal()">
                        <span class="material-symbols-outlined" style="font-size: 18px; font-weight: 300;">add</span> Issue New Loan
                    </button>
                </div>
                
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Loan ID</th>
                                <th>Customer Name</th>
                                <th>Principal Amount</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Date Issued</th>
                            </tr>
                        </thead>
                        <tbody id="loans-table-body">
                            <tr><td colspan="6" style="text-align:center; padding: 32px;"><span class="material-symbols-outlined spin">sync</span> Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        await loadLoansData();
    });

    async function loadLoansData() {
        try {
            const res = await window.api.get('/loans/list.php');
            const tbody = document.getElementById('loans-table-body');

            if (!res || res.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">No loans found.</td></tr>';
                return;
            }

            let html = '';
            res.forEach((loan, index) => {
                const date = new Date(loan.created_at).toLocaleDateString();
                const typeBadge = loan.type === 'collateral'
                    ? '<span class="badge" style="background: rgba(245, 158, 11, 0.1); color: #d97706;">Collateral</span>'
                    : '<span class="badge" style="background: var(--info-bg); color: var(--info);">Standard</span>';

                const statusBadge = loan.status === 'active'
                    ? '<span class="status-active">Active</span>'
                    : '<span class="status-settled">Settled</span>';

                html += `
                    <tr>
                        <td style="color: var(--text-muted);">${index + 1}</td>
                        <td style="color: var(--text-main); font-weight: 500;">${loan.loan_uid || 'LN-'+loan.id}</td>
                        <td style="font-weight: 600;"><a href="#" onclick="window.previewCustomerLoans(${loan.customer_id}); return false;" style="color: var(--gold-primary); text-decoration: none;">${loan.customer_name}</a></td>
                        <td>GHS ${parseFloat(loan.principal_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td>${typeBadge}</td>
                        <td>${statusBadge}</td>
                        <td>${date}</td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } catch (error) {
            document.getElementById('loans-table-body').innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--danger); padding: 32px;">Failed to load data: ${error.message}</td></tr>`;
        }
    }

    window.previewCustomerLoans = (customerId) => {
        // Close any open modals just in case
        if (typeof window.closeModal === 'function') {
            window.closeModal();
        }

        // Navigate to the customers tab
        window.location.hash = '#customers';

        // Wait briefly for the routing to finish initializing the customers view,
        // then trigger the specific customer profile view
        setTimeout(() => {
            if (typeof window.viewCustomer === 'function') {
                window.viewCustomer(customerId, 'loans');
            } else {
                window.showToast('Unable to load customer profile.', 'error');
            }
        }, 100);
    };

    // Attach to window so the button can call it, and modal can use it to refresh
    window.openIssueLoanModal = () => {
        // We reuse the loadTxForm from transactions.js to generate the modal
        if (typeof window.loadTxForm === 'function') {
            window.loadTxForm('issue_loan');

            // We need to override wizSubmit temporarily or hook into it so we can refresh the table
            const originalWizSubmit = window.wizSubmit;
            window.wizSubmit = async () => {
                const btn = document.getElementById('wiz-btn-confirm');
                btn.disabled = true;
                btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';

                const payload = {
                    customer_id: parseInt(window.wizardState.customerId),
                    principal_amount: parseFloat(window.wizardState.amount),
                    has_collateral: window.wizardState.type === 'collateral'
                };

                if (payload.has_collateral) {
                    payload.gold_type = window.wizardState.goldType;
                    payload.weight_grams = parseFloat(window.wizardState.weight);
                }

                try {
                    await window.api.post('/loans/issue.php', payload);
                    window.showToast('Loan successfully issued', 'success');
                    document.getElementById('issue-loan-modal').remove();
                    // Refresh the table!
                    if (document.getElementById('loans-table-body')) {
                        loadLoansData();
                    }
                } catch (e) {
                    window.showToast(e.message, 'error');
                    btn.disabled = false;
                    btn.innerHTML = 'Confirm & Issue Loan';
                }
            };
        } else {
            window.showToast('Transactions module not loaded', 'error');
        }
    };
})();
