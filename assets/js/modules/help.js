// assets/js/modules/help.js

(function () {
    window.addEventListener('route-changed', (e) => {
        if (e.detail.route !== 'help') return;

        const container = e.detail.container;
        const activeFormula = (window.GoldMath && typeof window.GoldMath.getCalculationFormula === 'function')
            ? window.GoldMath.getCalculationFormula()
            : 'mayrocy';
        const activeDiscount = (window.GoldMath && typeof window.GoldMath.getDiscountPercent === 'function')
            ? window.GoldMath.getDiscountPercent()
            : 0.70;
        const activeFormulaLabel = activeFormula === 'nwdgc' ? 'NWDGC Legacy (nwdgc.vercel.app)' : 'Mayrocy Standard (Default)';

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
            formulas: {
                title: 'Valuation & Formulas',
                icon: 'calculate',
                content: `
                    <h3>Gold Valuation &amp; Formula Reference</h3>
                    <p style="color: var(--text-muted);">All calculations across the Gold Calculator, Walk-In Purchases, Keepers, Loans, and Market Sales use a unified formula engine configurable in <strong>Settings &rarr; Gold Valuation &amp; Standards</strong>.</p>

                    <div style="background: rgba(45, 91, 255, 0.06); border: 1px solid rgba(45, 91, 255, 0.2); border-radius: 12px; padding: 14px 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <div style="font-size: 0.9rem; color: var(--text-main);">
                            <strong>Active Standard:</strong> <span style="color: var(--gold-primary); font-weight: 800;">${activeFormulaLabel}</span>
                        </div>
                        <div style="font-size: 0.85rem; font-weight: 700; color: #059669; background: rgba(16, 185, 129, 0.12); padding: 4px 12px; border-radius: 20px;">
                            Purity Discount: ${Number(activeDiscount).toFixed(2)}%
                        </div>
                    </div>

                    <h4>1. Gold Balls (Raw / Unsmelted Gold)</h4>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.9rem;">
                        <tr style="border-bottom: 1px solid var(--border); background: var(--bg-main);">
                            <th style="padding: 10px 12px; text-align: left;">Metric / Unit</th>
                            <th style="padding: 10px 12px; text-align: left;">Formula / Conversion</th>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px 12px;"><strong>Unit Conversions</strong></td>
                            <td style="padding: 10px 12px;"><code>1 Match = 0.08 g</code> &bull; <code>1 Blade = 0.80 g (10 matches)</code> &bull; <code>1 Pound = 8.00 g (10 blades)</code></td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px 12px;"><strong>Total Blades</strong></td>
                            <td style="padding: 10px 12px;"><code>Weight (g) &divide; 0.8</code></td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px 12px;"><strong>Payable Amount (GHS)</strong></td>
                            <td style="padding: 10px 12px;"><code>floor(Total Blades &times; Price per Blade)</code></td>
                        </tr>
                    </table>

                    <h4>2. Refined Gold (Smelted) &mdash; Mayrocy Standard (Default)</h4>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Used by most gold buyers in Ghana. Applies Archimedes water-displacement density with a direct percentage-point purity deduction.</p>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.9rem;">
                        <tr style="border-bottom: 1px solid var(--border); background: var(--bg-main);">
                            <th style="padding: 10px 12px; text-align: left;">Step</th>
                            <th style="padding: 10px 12px; text-align: left;">Formula</th>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px 12px;"><strong>Pounds</strong></td>
                            <td style="padding: 10px 12px;"><code>floor2(Weight (g) &divide; 7.75)</code> <span style="color: var(--text-muted); font-size: 0.82rem;">(truncated to 2 decimal places)</span></td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px 12px;"><strong>Raw Density &amp; Display Density</strong></td>
                            <td style="padding: 10px 12px;"><code>Raw Density = Weight &divide; Water Volume</code> &bull; <code>Display = round2(Raw Density)</code></td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px 12px;"><strong>Raw Karat (Without Discount)</strong></td>
                            <td style="padding: 10px 12px;"><code>floor2(((Raw Density &minus; 10.51) &times; 52.838) &divide; Raw Density)</code> <span style="color: var(--text-muted); font-size: 0.82rem;">(clamped 0&ndash;24)</span></td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px 12px;"><strong>Raw Purity (%)</strong></td>
                            <td style="padding: 10px 12px;"><code>round2((Raw Karat &divide; 24) &times; 100)</code></td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px 12px;"><strong>Discounted Purity (%)</strong></td>
                            <td style="padding: 10px 12px;"><code>max(0, round2(Raw Purity &minus; Discount %))</code> <span style="color: var(--text-muted); font-size: 0.82rem;">(e.g. minus 0.70%)</span></td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px 12px;"><strong>Payable Karat</strong></td>
                            <td style="padding: 10px 12px;"><code>round2((Discounted Purity &divide; 100) &times; 24)</code></td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px 12px;"><strong>Effective Price per Pound</strong></td>
                            <td style="padding: 10px 12px;"><code>round2((Payable Karat &times; Price 23kt) &divide; 23)</code></td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px 12px;"><strong>Payable Amount (With Discount)</strong></td>
                            <td style="padding: 10px 12px;"><code>floor((Payable Karat &times; Price 23kt &divide; 23) &times; Pounds)</code></td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px 12px;"><strong>Gross Amount (Without Discount)</strong></td>
                            <td style="padding: 10px 12px;"><code>floor((Raw Karat &times; Price 23kt &divide; 23) &times; Pounds)</code></td>
                        </tr>
                    </table>

                    <div style="background: rgba(16, 185, 129, 0.06); border-left: 4px solid var(--success); padding: 14px 16px; border-radius: 4px 12px 12px 4px; margin-bottom: 24px; font-size: 0.88rem;">
                        <strong style="color: var(--success); display: block; margin-bottom: 6px;">Worked Example (Mayrocy Standard @ 0.70% Discount)</strong>
                        Inputs: <code>Weight = 32.59 g</code>, <code>Water = 1.77</code>, <code>Price (23kt) = GH&#8373; 11,517</code><br>
                        &bull; Pounds: <code>floor2(32.59 / 7.75) = 4.20</code> &bull; Density: <code>round2(32.59 / 1.77) = 18.41</code><br>
                        &bull; Raw Karat: <code>22.67 kt</code> &bull; Raw Purity: <code>94.46%</code> &rarr; Minus 0.70%: <code>93.76%</code> &rarr; Payable Karat: <code>22.50 kt</code><br>
                        &bull; Price/lb: <code>GH&#8373; 11,266.63</code> &bull; <strong>Payable: GH&#8373; 47,319.00</strong> (Without discount: <code>GH&#8373; 47,677.00</code>, Difference: <code>-GH&#8373; 358.00</code>)
                    </div>

                    <h4>3. Formula Comparison: Mayrocy Standard vs. NWDGC Legacy</h4>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 0.88rem;">
                        <tr style="border-bottom: 1px solid var(--border); background: var(--bg-main);">
                            <th style="padding: 10px 12px; text-align: left;">Step</th>
                            <th style="padding: 10px 12px; text-align: left;">Mayrocy Standard (Default)</th>
                            <th style="padding: 10px 12px; text-align: left;">NWDGC Legacy (nwdgc.vercel.app)</th>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px 12px;"><strong>Pounds</strong></td>
                            <td style="padding: 10px 12px;"><code>floor2(grams / 7.75)</code></td>
                            <td style="padding: 10px 12px;"><code>floor2(grams / 7.75)</code></td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px 12px;"><strong>Density (Display)</strong></td>
                            <td style="padding: 10px 12px;"><code>round2(grams / volume)</code></td>
                            <td style="padding: 10px 12px;"><code>floor2(grams / volume)</code></td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px 12px;"><strong>Raw Karat</strong></td>
                            <td style="padding: 10px 12px;">Uses full-precision <code>grams / volume</code></td>
                            <td style="padding: 10px 12px;">Uses truncated <code>floor2(grams / volume)</code></td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px 12px;"><strong>Discount Applied</strong></td>
                            <td style="padding: 10px 12px;"><strong>Subtractive on Purity %:</strong> <code>round2(rawPurity &minus; discount%)</code></td>
                            <td style="padding: 10px 12px;"><strong>Multiplicative on Karat:</strong> <code>floor2(rawKarat &times; (100 &minus; discount%) / 100)</code></td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px 12px;"><strong>Payable Karat</strong></td>
                            <td style="padding: 10px 12px;"><code>round2((purityPercent / 100) &times; 24)</code></td>
                            <td style="padding: 10px 12px;">Derived directly above</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px 12px;"><strong>Payout</strong></td>
                            <td style="padding: 10px 12px;"><code>floor((payableKarat &times; price23kt / 23) &times; pounds)</code></td>
                            <td style="padding: 10px 12px;"><code>floor((payableKarat &times; price23kt / 23) &times; pounds)</code></td>
                        </tr>
                    </table>

                    <h4>4. Market Sales &amp; Net Profit</h4>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0;"><code>Net Profit = Market Sale Payout &minus; Sum of Cost Basis (guessed_value_ghs of sold vault items)</code></p>
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
                    <div class="help-tab ${isActive ? 'active' : ''}" onclick="window.selectHelpTab('${key}')" style="padding: 16px; margin-bottom: 8px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: all 0.2s; ${isActive ? 'background: rgba(45, 91, 255, 0.08); border-left: 4px solid var(--gold-primary); color: var(--gold-primary); font-weight: 700;' : 'color: var(--text-muted); border-left: 4px solid transparent;'}">
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
                <div class="page-header-card">
                    <div>
                        <div style="color: var(--gold-primary); font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; font-size: 0.85rem; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                            <div class="page-header-icon">
                                <span class="material-symbols-outlined" style="font-size: 20px;">menu_book</span>
                            </div>
                            Knowledge Base
                        </div>
                        <h2 class="page-header-title">Help & Documentation</h2>
                        <p class="page-header-subtitle">Learn how to navigate the Qwik Gold system, understand automated ledger calculations, and follow operational best practices.</p>
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
