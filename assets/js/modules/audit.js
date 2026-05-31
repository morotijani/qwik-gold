// assets/js/modules/audit.js

window.renderLedgerTable = () => {
    const tbody = document.getElementById('ledger-tbody');
    const paginationContainer = document.getElementById('ledger-pagination');

    if (!tbody) return;

    if (!window._ledgerTransactions || window._ledgerTransactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No transactions found.</td></tr>';
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    const totalItems = window._ledgerTransactions.length;
    const totalPages = Math.ceil(totalItems / window._ledgerItemsPerPage);

    if (window._ledgerCurrentPage < 1) window._ledgerCurrentPage = 1;
    if (window._ledgerCurrentPage > totalPages) window._ledgerCurrentPage = totalPages;

    const startIndex = (window._ledgerCurrentPage - 1) * window._ledgerItemsPerPage;
    const endIndex = startIndex + window._ledgerItemsPerPage;
    const currentItems = window._ledgerTransactions.slice(startIndex, endIndex);

    tbody.innerHTML = currentItems.map((tx, index) => {
        const globalIndex = startIndex + index + 1;
        const isPositive = tx.amount_ghs >= 0;
        const color = isPositive ? 'var(--success)' : 'var(--danger)';
        const sign = isPositive ? '+' : '';
        return `
            <tr>
                <td style="font-weight: 500; color: var(--text-muted);">${globalIndex}</td>
                <td>${new Date(tx.date).toLocaleString()}</td>
                <td style="font-family: monospace; font-weight: 600; color: var(--text-muted);">#${tx.id}</td>
                <td><span class="badge badge-outline">${tx.type.replace(/_/g, ' ')}</span></td>
                <td>${tx.reference_id ? '#' + tx.reference_id : '-'}</td>
                <td style="color: ${color}; font-weight: 600;">${sign}₵${Math.abs(tx.amount_ghs).toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    if (paginationContainer) {
        paginationContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
                <div style="font-size: 0.9rem; color: var(--text-muted);">
                    Showing ${startIndex + 1} to ${Math.min(endIndex, totalItems)} of ${totalItems} entries
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.9rem;" 
                            onclick="window._ledgerCurrentPage--; window.renderLedgerTable();" 
                            ${window._ledgerCurrentPage === 1 ? 'disabled' : ''}>Previous</button>
                    <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.9rem;" 
                            onclick="window._ledgerCurrentPage++; window.renderLedgerTable();" 
                            ${window._ledgerCurrentPage === totalPages ? 'disabled' : ''}>Next</button>
                </div>
            </div>
        `;
    }
};

window.addEventListener('route-changed', async (e) => {
    const route = e.detail.route;
    const container = e.detail.container;

    if (route === 'ledger') {
        container.innerHTML = `
            <div style="max-width: 1100px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
                    <h2 style="margin: 0; font-size: initial; font-weight: 600; color: var(--text-main);">Capital Ledger (Cash Flow)</h2>
                    <div id="ledger-balance" style="font-size: 1.25rem; font-weight: 700; color: var(--gold-primary); background: rgba(212,175,55,0.1); padding: 8px 16px; border-radius: 8px;">...</div>
                </div>
                
                <div class="table-container" style="overflow: visible;">
                    <table>
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Date</th>
                                <th>Tx ID</th>
                                <th>Type</th>
                                <th>Ref ID</th>
                                <th>Amount (GHS)</th>
                            </tr>
                        </thead>
                        <tbody id="ledger-tbody">
                            <tr><td colspan="6" style="text-align: center;">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
                <div id="ledger-pagination"></div>
            </div>
        `;

        try {
            const data = await window.api.get('/ledger/history.php?limit=1000');

            const balFmt = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(data.current_running_balance_ghs);
            document.getElementById('ledger-balance').textContent = `Total Balance: ${balFmt}`;

            window._ledgerTransactions = data.transactions || [];
            window._ledgerCurrentPage = 1;
            window._ledgerItemsPerPage = 10;

            window.renderLedgerTable();

        } catch (error) {
            document.getElementById('ledger-tbody').innerHTML = `<tr><td colspan="6" class="danger-text" style="text-align: center;">Error loading ledger</td></tr>`;
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
