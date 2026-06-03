// assets/js/modules/loans.js

(function () {
    window.addEventListener('route-changed', async (e) => {
        if (e.detail.route !== 'loans') return;

        const container = e.detail.container;

        // Initial Skeleton
        container.innerHTML = `
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 class="page-title" style="margin: 0; font-size: initial; font-weight: 700; color: var(--text-main);">Loan Portfolio</h2>
                    <button class="btn btn-primary" onclick="window.openIssueLoanModal()">
                        <span class="material-symbols-outlined" style="font-size: 20px; font-weight: 300;">add</span> Issue New Loan
                    </button>
                </div>
                
                <div style="background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow-x: auto; border: 1px solid var(--border);">
                    <div style="padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px;">
                        <span class="material-symbols-outlined" style="color: var(--text-muted);">account_balance_wallet</span>
                        <h3 style="font-size: 1.1rem; margin: 0; color: var(--text-main); font-weight: 700;">All Issued Loans</h3>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
                        <thead>
                            <tr style="background: var(--bg-main); color: var(--text-muted); font-size: 0.85rem; text-align: left; text-transform: uppercase;">
                                <th style="padding: 16px 24px; font-weight: 600; border-bottom: 1px solid var(--border);">No.</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Loan ID</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Customer Name</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Principal Amount</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Type</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Status</th>
                                <th style="padding: 16px 24px; font-weight: 600; border-bottom: 1px solid var(--border);">Date Issued</th>
                            </tr>
                        </thead>
                        <tbody id="loans-table-body">
                            <tr><td colspan="7" style="text-align:center; padding: 48px;"><span class="material-symbols-outlined spin" style="font-size: 2rem; color: var(--gold-primary);">sync</span></td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        await window.loadLoansData();
    });

    window.loadLoansData = async () => {
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
                    <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='white'">
                        <td style="padding: 16px 24px; color: var(--text-muted);">${index + 1}</td>
                        <td style="padding: 16px; font-weight: 600;"><a href="#" onclick="window.openLoanDetailsModal(${loan.id}); return false;" style="color: var(--gold-primary); text-decoration: none;">${loan.loan_uid || 'LN-'+loan.id}</a></td>
                        <td style="padding: 16px; font-weight: 600;"><a href="#" onclick="window.previewCustomerLoans(${loan.customer_id}); return false;" style="color: var(--text-main); text-decoration: none;">${loan.customer_name}</a></td>
                        <td style="padding: 16px; font-weight: 700; color: var(--text-main);">GHS ${parseFloat(loan.principal_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td style="padding: 16px;">${typeBadge}</td>
                        <td style="padding: 16px;">${statusBadge}</td>
                        <td style="padding: 16px 24px; color: var(--text-muted); font-size: 0.9rem;">${date}</td>
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
        if (typeof window.openCustomerIssueLoanModal === 'function') {
            window.openCustomerIssueLoanModal(null);
        } else {
            window.showToast('Customers module not fully loaded. Please refresh.', 'error');
        }
    };
})();
