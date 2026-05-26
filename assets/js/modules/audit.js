// assets/js/modules/audit.js

window.addEventListener('route-changed', async (e) => {
    const route = e.detail.route;
    const container = e.detail.container;

    if (route === 'ledger') {
        container.innerHTML = `
            <div class="glass-panel" style="padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2>Capital Ledger (Cash Flow)</h2>
                    <div id="ledger-balance" style="font-size: 1.5rem; font-weight: 700; color: var(--gold-primary);">...</div>
                </div>
                
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Tx ID</th>
                                <th>Type</th>
                                <th>Ref ID</th>
                                <th>Amount (GHS)</th>
                            </tr>
                        </thead>
                        <tbody id="ledger-tbody">
                            <tr><td colspan="5" style="text-align: center;">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        try {
            const data = await window.api.get('/ledger/history.php?limit=100');
            
            const balFmt = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(data.current_running_balance_ghs);
            document.getElementById('ledger-balance').textContent = `Total Balance: ${balFmt}`;

            const tbody = document.getElementById('ledger-tbody');
            if (data.transactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No transactions found.</td></tr>';
                return;
            }

            tbody.innerHTML = data.transactions.map(tx => {
                const isPositive = tx.amount_ghs >= 0;
                const color = isPositive ? 'var(--success)' : 'var(--danger)';
                const sign = isPositive ? '+' : '';
                return `
                <tr>
                    <td>${new Date(tx.date).toLocaleString()}</td>
                    <td>#${tx.id}</td>
                    <td><span class="badge badge-outline">${tx.type.replace(/_/g, ' ')}</span></td>
                    <td>${tx.reference_id ? '#' + tx.reference_id : '-'}</td>
                    <td style="color: ${color}; font-weight: 600;">${sign}${tx.amount_ghs.toFixed(2)}</td>
                </tr>
            `}).join('');

        } catch (error) {
            document.getElementById('ledger-tbody').innerHTML = `<tr><td colspan="5" class="danger-text" style="text-align: center;">Error loading ledger</td></tr>`;
        }
    } 
    else if (route === 'audit') {
        container.innerHTML = `
            <div class="glass-panel" style="padding: 24px;">
                <h2>Global Audit Trail</h2>
                <p style="margin-bottom: 24px;">Immutable log of all business operations.</p>
                
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Staff Member</th>
                                <th>Action</th>
                                <th>Table & ID</th>
                                <th>Payload Difference</th>
                            </tr>
                        </thead>
                        <tbody id="audit-tbody">
                            <tr><td colspan="5" style="text-align: center;">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        try {
            const data = await window.api.get('/logs/view.php?limit=50');
            const tbody = document.getElementById('audit-tbody');
            
            if (data.logs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No logs found.</td></tr>';
                return;
            }

            tbody.innerHTML = data.logs.map(log => {
                // Formatting payload simply
                const newPayload = log.new_data ? JSON.stringify(log.new_data).replace(/[{""}]/g, ' ').trim() : 'N/A';
                
                return `
                <tr>
                    <td style="font-size: 0.85rem; color: var(--text-muted);">${new Date(log.timestamp).toLocaleString()}</td>
                    <td style="font-weight: 600;">${log.staff_name}</td>
                    <td><span class="badge" style="background: rgba(59, 130, 246, 0.2); color: var(--info);">${log.action}</span></td>
                    <td><code>${log.table_affected} #${log.record_id}</code></td>
                    <td style="font-size: 0.8rem; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${newPayload}">
                        ${newPayload}
                    </td>
                </tr>
            `}).join('');

        } catch (error) {
            document.getElementById('audit-tbody').innerHTML = `<tr><td colspan="5" class="danger-text" style="text-align: center;">Error loading logs. Are you an Admin?</td></tr>`;
        }
    }
});
