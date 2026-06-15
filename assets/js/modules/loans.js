// assets/js/modules/loans.js

(function () {
    window.addEventListener('route-changed', async (e) => {
        if (e.detail.route !== 'loans') return;

        const container = e.detail.container;

        // Initial Skeleton
        container.innerHTML = `
            <div>
                <div style="background: linear-gradient(145deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 100%); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 20px; padding: clamp(24px, 5vw, 40px); position: relative; overflow: hidden; margin-bottom: 32px; box-shadow: 0 10px 30px rgba(245, 158, 11, 0.1);">
                    <div style="position: absolute; top: -50px; right: -50px; width: 250px; height: 250px; background: rgba(245, 158, 11, 0.1); border-radius: 50%; filter: blur(40px);"></div>
                    <div style="position: absolute; bottom: -30px; left: -30px; width: 150px; height: 150px; background: rgba(245, 158, 11, 0.1); border-radius: 50%; filter: blur(30px);"></div>
                    <div style="position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
                        <div>
                            <div style="color: #d97706; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; font-size: 0.95rem; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                                <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3); margin-right: 4px;">
                                    <span class="material-symbols-outlined" style="font-size: 18px;">account_balance</span>
                                </div>
                                Enterprise Credit
                            </div>
                            <h2 style="margin: 0 0 12px 0; font-size: clamp(1.8rem, 6vw, 2.2rem); font-weight: 800; color: var(--text-main);">Loan Portfolio</h2>
                            <p style="margin: 0; color: var(--text-muted); font-size: clamp(0.95rem, 3vw, 1.05rem); max-width: 500px; line-height: 1.5;">Manage active credit lines, collateral-backed financing, and track enterprise settlements across all registered keepers.</p>
                        </div>
                        <button class="btn btn-primary" onclick="window.openIssueLoanModal()" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; font-weight: 700; padding: clamp(12px, 3vw, 14px) clamp(20px, 4vw, 28px); box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3); display: flex; align-items: center; gap: 8px; font-size: clamp(0.95rem, 3vw, 1.05rem); border-radius: 12px; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                            <span class="material-symbols-outlined">add</span> Issue New Loan
                        </button>
                    </div>
                </div>
                
                <div style="background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow-x: auto; border: 1px solid var(--border);">
                    <div style="padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px;">
                        <span class="material-symbols-outlined" style="color: var(--text-muted);">receipt_long</span>
                        <h3 style="font-size: 1.1rem; margin: 0; color: var(--text-main); font-weight: 700;">Issued Loans Ledger</h3>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; min-width: 900px;">
                        <thead>
                            <tr style="background: var(--bg-main); color: var(--text-muted); font-size: 0.85rem; text-align: left; text-transform: uppercase;">
                                <th style="padding: 16px 24px; font-weight: 600; border-bottom: 1px solid var(--border); width: 50px;">#</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Loan ID</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Customer Name</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border); text-align: right;">Principal Amount</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Type</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Status</th>
                                <th style="padding: 16px 24px; font-weight: 600; border-bottom: 1px solid var(--border); text-align: right;">Date Issued</th>
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
                const date = new Date(loan.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                const typeBadge = loan.type === 'collateral'
                    ? `<span style="background: rgba(245, 158, 11, 0.1); color: #d97706; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;"><span class="material-symbols-outlined" style="font-size: 14px;">diamond</span> Collateral</span>`
                    : `<span style="background: rgba(59, 130, 246, 0.1); color: #2563eb; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;"><span class="material-symbols-outlined" style="font-size: 14px;">description</span> Standard</span>`;

                const statusBadge = loan.status === 'active'
                    ? `<span style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;"><span class="material-symbols-outlined" style="font-size: 14px;">trending_up</span> Active</span>`
                    : `<span style="background: rgba(100, 116, 139, 0.1); color: #475569; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;"><span class="material-symbols-outlined" style="font-size: 14px;">check_circle</span> Settled</span>`;

                html += `
                    <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='white'">
                        <td style="padding: 16px 24px; color: var(--text-muted); font-weight: 500;">${index + 1}</td>
                        <td style="padding: 16px; font-weight: 600;">
                            <a href="#" onclick="window.openLoanDetailsModal(${loan.id}); return false;" style="background: var(--bg-main); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); font-size: 0.85rem; color: var(--gold-primary); text-decoration: none; transition: border-color 0.2s;" onmouseover="this.style.borderColor='var(--gold-primary)'" onmouseout="this.style.borderColor='var(--border)'">${loan.loan_uid || 'LN-'+String(loan.id).padStart(6, '0')}</a>
                        </td>
                        <td style="padding: 16px; font-weight: 600;">
                            <a href="#" onclick="window.previewCustomerLoans(${loan.customer_id}); return false;" style="color: var(--text-main); text-decoration: none; display: flex; align-items: center; gap: 8px;">
                                <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--gold-light); display: flex; align-items: center; justify-content: center; color: var(--gold-dark); font-size: 0.8rem;">
                                    <span class="material-symbols-outlined" style="font-size: 16px;">person</span>
                                </div>
                                ${loan.customer_name}
                            </a>
                        </td>
                        <td style="padding: 16px; font-weight: 800; color: var(--text-main); text-align: right; font-size: 1.05rem;">GHS ${parseFloat(loan.principal_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td style="padding: 16px;">${typeBadge}</td>
                        <td style="padding: 16px;">${statusBadge}</td>
                        <td style="padding: 16px 24px; color: var(--text-muted); font-size: 0.95rem; text-align: right; font-weight: 500;">${date}</td>
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
