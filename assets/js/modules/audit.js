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
            <div style="width: 100%; padding-bottom: 60px;">
                <!-- Hero Banner -->
                <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 20px; padding: 40px; position: relative; overflow: hidden; margin-bottom: 32px; box-shadow: 0 15px 35px rgba(15, 23, 42, 0.2);">
                    <div style="position: absolute; top: -50px; right: -50px; width: 250px; height: 250px; background: rgba(255,255,255,0.02); border-radius: 50%; filter: blur(40px);"></div>
                    <div style="position: absolute; bottom: -30px; left: -30px; width: 150px; height: 150px; background: rgba(148, 163, 184, 0.1); border-radius: 50%; filter: blur(30px);"></div>
                    <div style="position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; font-size: 0.9rem; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                                <span class="material-symbols-outlined" style="font-size: 18px;">policy</span> Security & Compliance
                            </div>
                            <h2 style="margin: 0 0 12px 0; font-size: 2.2rem; font-weight: 800; color: white;">Global Audit Trail</h2>
                            <p style="margin: 0; color: #cbd5e1; font-size: 1.05rem; max-width: 500px; line-height: 1.5;">Immutable log of all business operations and data mutations across the entire Qwik Gold platform.</p>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 16px 24px; border-radius: 12px; text-align: center;">
                            <span class="material-symbols-outlined" style="font-size: 32px; color: #94a3b8; margin-bottom: 8px; display: block;">security</span>
                            <div style="color: white; font-weight: 700; font-size: 1.1rem;">Secured</div>
                        </div>
                    </div>
                </div>
                
                <div style="background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid var(--border); overflow: hidden; margin-bottom: 24px;">
                    <div style="padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: #fafafa;">
                        <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-main); font-weight: 700; display: flex; align-items: center; gap: 8px;">
                            <span class="material-symbols-outlined" style="color: var(--text-muted);">history</span> System Activity Logs
                        </h3>
                    </div>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; min-width: 900px;">
                            <thead>
                                <tr style="background: var(--bg-main); color: var(--text-muted); font-size: 0.85rem; text-align: left; text-transform: uppercase;">
                                    <th style="padding: 16px 24px; font-weight: 700; border-bottom: 1px solid var(--border);">Timestamp</th>
                                    <th style="padding: 16px; font-weight: 700; border-bottom: 1px solid var(--border);">Staff Member</th>
                                    <th style="padding: 16px; font-weight: 700; border-bottom: 1px solid var(--border);">Action</th>
                                    <th style="padding: 16px; font-weight: 700; border-bottom: 1px solid var(--border);">Target Entity</th>
                                    <th style="padding: 16px 24px; font-weight: 700; border-bottom: 1px solid var(--border);">Data Payload</th>
                                </tr>
                            </thead>
                            <tbody id="audit-tbody">
                                <tr><td colspan="5" style="padding: 48px; text-align: center; color: var(--text-muted); font-size: 1.05rem;">
                                    <span class="material-symbols-outlined spin" style="font-size: 32px; color: var(--border); margin-bottom: 16px; display: block;">sync</span>
                                    Loading logs...
                                </td></tr>
                            </tbody>
                        </table>
                    </div>
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
                const newPayload = log.new_data ? JSON.stringify(log.new_data).replace(/[{""}]/g, ' ').trim() : 'No data recorded';

                let actionColor = 'rgba(100, 116, 139, 0.1)';
                let actionText = '#64748b';
                
                if (log.action.toUpperCase().includes('CREATE') || log.action.toUpperCase().includes('ADD')) {
                    actionColor = 'rgba(16, 185, 129, 0.1)';
                    actionText = '#10b981';
                } else if (log.action.toUpperCase().includes('UPDATE') || log.action.toUpperCase().includes('EDIT') || log.action.toUpperCase().includes('APPROVE') || log.action.toUpperCase().includes('SETTLE')) {
                    actionColor = 'rgba(59, 130, 246, 0.1)';
                    actionText = '#2563eb';
                } else if (log.action.toUpperCase().includes('DELETE') || log.action.toUpperCase().includes('REMOVE') || log.action.toUpperCase().includes('CANCEL')) {
                    actionColor = 'rgba(239, 68, 68, 0.1)';
                    actionText = '#ef4444';
                }

                return `
                <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='white'">
                    <td style="padding: 16px 24px; color: var(--text-main); font-weight: 500;">
                        ${new Date(log.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 4px;">${new Date(log.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                    </td>
                    <td style="padding: 16px;">
                        <div style="font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
                            <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--bg-hover); display: flex; align-items: center; justify-content: center; color: var(--text-muted);">
                                <span class="material-symbols-outlined" style="font-size: 16px;">person</span>
                            </div>
                            ${log.staff_name}
                        </div>
                    </td>
                    <td style="padding: 16px;">
                        <span style="padding: 4px 10px; background: ${actionColor}; color: ${actionText}; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${log.action}</span>
                    </td>
                    <td style="padding: 16px;">
                        <div style="font-family: monospace; font-weight: 600; color: var(--text-main); background: var(--bg-main); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); display: inline-block; font-size: 0.85rem;">
                            ${log.table_affected} <span style="color: var(--gold-primary);">#${log.record_id}</span>
                        </div>
                    </td>
                    <td style="padding: 16px 24px; font-size: 0.8rem; max-width: 300px;">
                        <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-muted); font-family: monospace;" title="${newPayload}">
                            ${newPayload}
                        </div>
                    </td>
                </tr>
            `}).join('');

        } catch (error) {
            document.getElementById('audit-tbody').innerHTML = `<tr><td colspan="5" class="danger-text" style="text-align: center;">Error loading logs. Are you an Admin?</td></tr>`;
        }
    }
});
