// assets/js/modules/help.js

(function () {
    window.addEventListener('route-changed', (e) => {
        if (e.detail.route !== 'help') return;

        const container = e.detail.container;

        const sections = {
            overview: {
                title: 'System Overview',
                icon: 'auto_awesome',
                content: `
                    <h3>Welcome to Qwik Gold</h3>
                    <p>Qwik Gold is an integrated enterprise resource planning system designed specifically for the gold trading and purchasing industry. This manual will guide you through the various modules of the system.</p>
                    
                    <div style="background: rgba(16, 185, 129, 0.05); border-left: 4px solid var(--success); padding: 16px; border-radius: 4px 12px 12px 4px; margin-bottom: 24px;">
                        <h4 style="margin: 0 0 8px 0; color: var(--success); display: flex; align-items: center; gap: 8px;"><span class="material-symbols-outlined" style="font-size: 18px;">lightbulb</span> Single Source of Truth</h4>
                        <p style="margin: 0; color: var(--text-main); font-size: 0.95rem;">The system is built around two primary concepts: The <strong>Capital Ledger</strong> (which tracks every cedi that moves in and out of the business) and the <strong>Gold Vault</strong> (which tracks physical gold inventory). Everything you do affects one or both of these systems.</p>
                    </div>

                    <h4>Key Roles</h4>
                    <ul style="line-height: 1.8; color: var(--text-muted);">
                        <li><strong>Administrator:</strong> Has full access to all features, including deleting voided transactions, managing users, and viewing sensitive audit trails.</li>
                        <li><strong>Staff:</strong> Can perform daily operations such as logging expenses, registering customers, and purchasing gold.</li>
                        <li><strong>Salesperson:</strong> Restricted mainly to point-of-sale activities and viewing relevant operational data.</li>
                    </ul>
                `
            },
            ledger: {
                title: 'Capital Ledger',
                icon: 'account_balance',
                content: `
                    <h3>The Capital Ledger</h3>
                    <p>The Capital Ledger is the financial heart of the business. It tracks the real-time balance of cash available to the company.</p>
                    
                    <h4>Transaction Types</h4>
                    <p>The following actions automatically post entries to the ledger:</p>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                        <tr style="border-bottom: 1px solid var(--border); background: var(--bg-main);">
                            <th style="padding: 12px; text-align: left;">Action</th>
                            <th style="padding: 12px; text-align: left;">Ledger Impact</th>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 12px;"><strong>External Capital In</strong></td>
                            <td style="padding: 12px; color: var(--success);">Increases Balance</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 12px;"><strong>Gold Purchase</strong></td>
                            <td style="padding: 12px; color: var(--danger);">Decreases Balance</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 12px;"><strong>Loan Issued</strong></td>
                            <td style="padding: 12px; color: var(--danger);">Decreases Balance</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 12px;"><strong>Loan Repaid</strong></td>
                            <td style="padding: 12px; color: var(--success);">Increases Balance</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 12px;"><strong>Expense Logged</strong></td>
                            <td style="padding: 12px; color: var(--danger);">Decreases Balance</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 12px;"><strong>Expense Voided</strong></td>
                            <td style="padding: 12px; color: var(--success);">Refunds/Increases Balance</td>
                        </tr>
                    </table>

                    <div style="background: rgba(245, 158, 11, 0.05); border-left: 4px solid var(--warning); padding: 16px; border-radius: 4px 12px 12px 4px;">
                        <h4 style="margin: 0 0 8px 0; color: var(--warning); display: flex; align-items: center; gap: 8px;"><span class="material-symbols-outlined" style="font-size: 18px;">warning</span> Manual Ledger Adjustments</h4>
                        <p style="margin: 0; color: var(--text-main); font-size: 0.95rem;">You should rarely need to manually adjust the ledger. The system is designed so that normal operational activities (buying gold, issuing loans) naturally calculate the ledger balance in real time.</p>
                    </div>
                `
            },
            purchases: {
                title: 'Gold Purchasing',
                icon: 'shopping_cart',
                content: `
                    <h3>Gold Purchasing Process</h3>
                    <p>When purchasing gold from a customer or keeper, the system calculates the accurate price based on physical properties.</p>

                    <h4>Important Calculations</h4>
                    <ul style="line-height: 1.8; color: var(--text-muted); margin-bottom: 24px;">
                        <li><strong>Weight (g):</strong> The raw scale weight of the gold.</li>
                        <li><strong>Density (Specific Gravity):</strong> Measured via water displacement. High density indicates higher purity.</li>
                        <li><strong>Karat Value:</strong> Derived directly from the density reading.</li>
                        <li><strong>Price Per Gram:</strong> Based on the daily global spot price adjusted for the calculated karat purity.</li>
                    </ul>

                    <h4>Origin of Gold</h4>
                    <p>When logging a purchase, you must select the origin:</p>
                    <ol style="line-height: 1.8; color: var(--text-muted);">
                        <li><strong>Walk-In:</strong> Standard customer bringing in gold. Cash is deducted from the Capital Ledger to pay them immediately.</li>
                        <li><strong>From Keeper:</strong> A registered Keeper is supplying the gold.</li>
                        <li><strong>Loan Offset:</strong> A Keeper is supplying gold specifically to pay down an active loan. The system calculates the gold's cash value and applies it directly to the loan balance instead of handing cash to the Keeper.</li>
                    </ol>
                `
            },
            keepers: {
                title: 'Keepers & Loans',
                icon: 'handshake',
                content: `
                    <h3>Keepers & Loan Management</h3>
                    <p><strong>Keepers</strong> are special trusted partners who operate on behalf of the company and are eligible for financial loans to pre-fund their operations.</p>

                    <h4>Issuing a Loan</h4>
                    <ol style="line-height: 1.8; color: var(--text-muted); margin-bottom: 24px;">
                        <li>Navigate to the <strong>Keepers</strong> page.</li>
                        <li>Click "View Profile" on the specific Keeper.</li>
                        <li>Click "Issue New Loan".</li>
                        <li>Enter the Principal amount. This cash is instantly deducted from the Capital Ledger.</li>
                    </ol>

                    <h4>Loan Repayment via Gold (Offsets)</h4>
                    <p style="color: var(--text-muted);">The most common way Keepers repay loans is by bringing in gold. During the Gold Purchase process, select <strong>Loan Offset</strong>. The system will value the gold and automatically apply the total value against their outstanding loan principal.</p>

                    <div style="background: rgba(59, 130, 246, 0.05); border-left: 4px solid var(--primary); padding: 16px; border-radius: 4px 12px 12px 4px;">
                        <h4 style="margin: 0 0 8px 0; color: var(--primary); display: flex; align-items: center; gap: 8px;"><span class="material-symbols-outlined" style="font-size: 18px;">info</span> Active Loan Rules</h4>
                        <p style="margin: 0; color: var(--text-main); font-size: 0.95rem;">A Keeper can only have <strong>one active loan</strong> at a time. If they need more capital, the current loan must be fully repaid or "offset" to a zero balance before a new loan can be issued.</p>
                    </div>
                `
            },
            vault: {
                title: 'Vault & Inventory',
                icon: 'inventory_2',
                content: `
                    <h3>Vault Inventory</h3>
                    <p>The Vault acts as the physical repository tracking all gold held by the company.</p>

                    <h4>Gold Ownership Status</h4>
                    <ul style="line-height: 1.8; color: var(--text-muted);">
                        <li><strong>Company Owned:</strong> Gold that was purchased outright via the Capital Ledger. This gold is completely owned by the business and is ready to be sold to the main market.</li>
                        <li><strong>Keeper Held:</strong> Gold that physically exists but is assigned to a Keeper's profile (usually for safe-keeping or processing) before final acquisition.</li>
                    </ul>

                    <h4>Market Sales</h4>
                    <p style="color: var(--text-muted);">When the company accumulates enough gold, it is sold in bulk to the Main Market. This action removes the physical gold from the Vault and injects the resulting cash revenue back into the Capital Ledger.</p>
                `
            },
            expenses: {
                title: 'Expense Management',
                icon: 'payments',
                content: `
                    <h3>Expenses</h3>
                    <p>All daily operational expenditures must be logged in the Expenses module to keep the Capital Ledger perfectly balanced.</p>

                    <h4>Voiding an Expense</h4>
                    <p style="color: var(--text-muted);">If a mistake is made, you cannot simply "delete" an expense, as this breaks accounting rules. Instead, you <strong>Void</strong> the expense.</p>
                    <p style="color: var(--text-muted);">Voiding an expense keeps a permanent historical record of the mistake, but automatically issues an <strong>Expense Refund</strong> transaction to the Capital Ledger, returning the cash to the company balance.</p>
                `
            }
        };

        let currentSection = 'overview';

        function renderTabs() {
            let tabsHtml = '';
            for (const [key, data] of Object.entries(sections)) {
                const isActive = key === currentSection;
                tabsHtml += `
                    <div class="help-tab ${isActive ? 'active' : ''}" onclick="window.selectHelpTab('${key}')" style="padding: 16px; margin-bottom: 8px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: all 0.2s; ${isActive ? 'background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.02)); border-left: 4px solid var(--gold-primary); color: var(--gold-primary); font-weight: 700;' : 'color: var(--text-muted); border-left: 4px solid transparent; hover: background: var(--bg-hover);'}">
                        <span class="material-symbols-outlined" style="${isActive ? 'color: var(--gold-primary);' : ''}">${data.icon}</span>
                        ${data.title}
                    </div>
                `;
            }
            return tabsHtml;
        }

        window.selectHelpTab = (key) => {
            currentSection = key;
            document.getElementById('help-tabs-container').innerHTML = renderTabs();
            document.getElementById('help-content-container').innerHTML = sections[key].content;
        };

        container.innerHTML = `
            <div>
                <!-- Header Banner -->
                <div style="background: linear-gradient(145deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.03) 100%); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 20px; padding: 40px; position: relative; overflow: hidden; margin-bottom: 32px; box-shadow: 0 10px 30px rgba(59, 130, 246, 0.05);">
                    <div style="position: absolute; top: -50px; right: -50px; width: 250px; height: 250px; background: rgba(59, 130, 246, 0.1); border-radius: 50%; filter: blur(40px);"></div>
                    <div style="position: absolute; bottom: -30px; left: 100px; width: 150px; height: 150px; background: rgba(59, 130, 246, 0.05); border-radius: 50%; filter: blur(20px);"></div>
                    
                    <div style="position: relative; z-index: 1;">
                        <div style="color: #2563eb; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; font-size: 0.95rem; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                            <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3); margin-right: 4px;">
                                <span class="material-symbols-outlined" style="font-size: 18px;">menu_book</span>
                            </div>
                            Knowledge Base
                        </div>
                        <h2 style="margin: 0 0 12px 0; font-size: 2.2rem; font-weight: 800; color: var(--text-main);">Help & Documentation</h2>
                        <p style="margin: 0; color: var(--text-muted); font-size: 1.05rem; max-width: 600px; line-height: 1.5;">Learn how to navigate the Qwik Gold system, understand automated ledger calculations, and follow operational best practices.</p>
                    </div>
                </div>
                
                <div style="display: flex; gap: 32px; align-items: flex-start; flex-wrap: wrap;">
                    
                    <!-- Sidebar Tabs -->
                    <div style="flex: 0 0 280px; background: white; border-radius: 16px; padding: 16px; border: 1px solid var(--border); box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                        <h4 style="margin: 0 0 16px 8px; color: var(--text-main); font-size: 0.95rem; text-transform: uppercase; letter-spacing: 1px;">Topics</h4>
                        <div id="help-tabs-container">
                            ${renderTabs()}
                        </div>
                    </div>

                    <!-- Content Area -->
                    <div style="flex: 1; min-width: 400px; background: white; border-radius: 16px; padding: 40px; border: 1px solid var(--border); box-shadow: 0 4px 12px rgba(0,0,0,0.02); line-height: 1.6; color: var(--text-main);">
                        <div id="help-content-container">
                            ${sections['overview'].content}
                        </div>
                    </div>

                </div>
            </div>
        `;
    });
})();
