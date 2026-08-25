const fs = require('fs');

const res = {
    "sale": {
        "id": 4,
        "sale_uid": "MRG-1787599665-632",
        "status": "completed",
        "gold_type": "refined",
        "total_grams": "86.4000",
        "total_volume": "3.4000",
        "total_blades": "0.0000",
        "estimated_local_price": "0.00",
        "actual_local_price": "10900.00",
        "actual_grams_market": "86.5000",
        "actual_volume_market": "3.4000",
        "actual_blades_market": "0.0000",
        "estimated_cash": "130200.00",
        "actual_cash": "164027.35",
        "notes": null,
        "created_at": "2026-08-24 19:27:45",
        "handler_id": 1,
        "cost_basis_ghs": "130163.00",
        "net_profit_ghs": "33864.35",
        "is_merged": 1,
        "merged_into_id": null
    },
    "merged_sales": [
        {
            "id": 2,
            "sale_uid": "SALE-6A8C9AE09A218",
            "status": "completed",
            "gold_type": "balls",
            "total_grams": "22.0000",
            "total_volume": "0.0000",
            "total_blades": "27.5000",
            "estimated_local_price": "1001.00",
            "actual_local_price": "0.00",
            "actual_grams_market": "0.0000",
            "actual_volume_market": "0.0000",
            "actual_blades_market": "0.0000",
            "estimated_cash": "27527.00",
            "actual_cash": "0.00",
            "notes": "",
            "created_at": "2026-08-24 19:26:24",
            "handler_id": 1,
            "cost_basis_ghs": "27500.00",
            "net_profit_ghs": "0.00",
            "is_merged": 0,
            "merged_into_id": 4
        }
    ],
    "constituents": {
        "smelted": {
            "count": 0,
            "grams": 0
        },
        "direct_purchased": {
            "count": 3,
            "grams": 86.4
        },
        "total_items": 3
    }
};

try {
            const s = res.sale;
            const consts = res.constituents;
            
            const costBasis = parseFloat(s.cost_basis_ghs) || 0;
            const actualCash = parseFloat(s.actual_cash) || 0;
            
            const diff = s.net_profit_ghs !== null ? parseFloat(s.net_profit_ghs) : (actualCash - costBasis);
            const diffColor = diff >= 0 ? 'var(--success)' : 'var(--danger)';
            const diffBg = diff >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
            const diffBorder = diff >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';
            const diffLabel = diff >= 0 ? 'True Net Profit' : 'Net Loss';
            
            const costBasisFmt = costBasis.toLocaleString(undefined, { minimumFractionDigits: 2 });
            const actCashFmt = actualCash.toLocaleString(undefined, { minimumFractionDigits: 2 });
            const diffCashFmt = Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 2 });
            
            const actGramsFmt = Number(s.actual_grams_market || s.total_grams).toFixed(4) + 'g';
            const actVolBladesFmt = Number(s.gold_type === 'balls' ? (s.actual_blades_market || s.total_blades) : (s.actual_volume_market || s.total_volume)).toFixed(4);
            const actPriceFmt = 'GHS ' + Number(s.actual_local_price || s.estimated_local_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

            const dateStr = new Date(s.created_at).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            let sourceBreakdownHtml = '';
            if (consts.total_items > 0) {
                sourceBreakdownHtml = `
                    <div style="background: rgba(71, 85, 105, 0.05); border: 1px solid rgba(71, 85, 105, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                        <h4 style="margin: 0 0 12px 0; font-size: 0.9rem; color: var(--text-muted); text-transform: uppercase;">Stock Origins</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            ${consts.smelted.count > 0 ? `
                            <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                                <div style="font-size: 0.8rem; color: #f59e0b; font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 14px;">local_fire_department</span> Converted/Smelted</div>
                                <div style="font-weight: 600; color: var(--text-main); font-size: 1.05rem;">${Number(consts.smelted.grams).toFixed(2)}g</div>
                            </div>
                            ` : ''}
                            ${consts.direct_purchased.count > 0 ? `
                            <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                                <div style="font-size: 0.8rem; color: #3b82f6; font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 14px;">shopping_bag</span> Direct Purchased</div>
                                <div style="font-weight: 600; color: var(--text-main); font-size: 1.05rem;">${Number(consts.direct_purchased.grams).toFixed(2)}g</div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }

            if (res.merged_sales && res.merged_sales.length > 0) {
                sourceBreakdownHtml += `
                    <div style="background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                        <h4 style="margin: 0 0 12px 0; font-size: 0.9rem; color: #8b5cf6; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
                            <span class="material-symbols-outlined" style="font-size: 16px;">call_merge</span> Merged From (${res.merged_sales.length} Sales)
                        </h4>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${res.merged_sales.map(ms => `
                                <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <div style="font-weight: 600; color: var(--text-main); text-transform: capitalize;">${ms.gold_type} Sale</div>
                                        <div style="font-size: 0.8rem; color: var(--text-muted);">${Number(ms.total_grams).toFixed(4)}g &bull; Cap: GHS ${Number(ms.cost_basis_ghs).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-weight: 600; color: var(--text-main);">Est: GHS ${Number(ms.estimated_cash).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            const html = `
                <div style="font-family: var(--font-main);">
                    
                    <!-- Header -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                <span class="material-symbols-outlined" style="color: var(--primary);">receipt_long</span>
                                <div style="font-size: 1.2rem; font-weight: 700; color: var(--text-main);">${s.transaction_ref || s.sale_uid || 'N/A'}</div>
                            </div>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">${dateStr} &bull; <span style="text-transform: capitalize; font-weight: 600;">${s.gold_type}</span></div>
                        </div>
                        <div>
                            <span style="background: var(--success-light); color: var(--success); padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 14px;">check_circle</span> COMPLETED</span>
                        </div>
                    </div>

                    ${sourceBreakdownHtml}

                    <!-- Financial Summary Cards -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                        
                        <div style="background: white; border: 1px solid var(--border); border-radius: 12px; padding: 20px;">
                            <h4 style="margin: 0 0 16px 0; font-size: 0.95rem; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                                <span class="material-symbols-outlined" style="color: var(--warning); font-size: 18px;">account_balance_wallet</span> 
                                Initial Capital Spent
                            </h4>
                            
                            <div style="border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 12px;">
                                <div style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 4px;">Total Direct Capital</div>
                                <div style="font-size: 1.2rem; font-weight: 700; color: var(--text-main);">GHS ${costBasisFmt}</div>
                            </div>
                            
                            <div>
                                <div style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 4px;">Estimated Return</div>
                                <div style="font-size: 1rem; font-weight: 600; color: var(--text-main);">GHS ${Number(s.estimated_cash || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                            </div>
                        </div>

                        <div style="background: white; border: 1px solid var(--border); border-radius: 12px; padding: 20px;">
                            <h4 style="margin: 0 0 16px 0; font-size: 0.95rem; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                                <span class="material-symbols-outlined" style="color: var(--success); font-size: 18px;">storefront</span> 
                                Market Final Actuals
                            </h4>
                            
                            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: var(--text-muted); font-size: 0.85rem;">Weight</span>
                                    <span style="font-weight: 600; color: var(--text-main);">${actGramsFmt}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: var(--text-muted); font-size: 0.85rem;">${s.gold_type === 'refined' ? 'Volume' : 'Blades'}</span>
                                    <span style="font-weight: 600; color: var(--text-main);">${actVolBladesFmt}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: var(--text-muted); font-size: 0.85rem;">Price ${s.gold_type === 'refined' ? '' : '/ Blade'}</span>
                                    <span style="font-weight: 600; color: var(--text-main);">${actPriceFmt}</span>
                                </div>
                            </div>
                            
                            <div style="border-top: 1px dashed rgba(16, 185, 129, 0.3); padding-top: 12px;">
                                <div style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 4px;">Actual Brought In</div>
                                <div style="font-size: 1.2rem; font-weight: 700; color: var(--success);">GHS ${actCashFmt}</div>
                            </div>
                        </div>
                        
                    </div>

                    <!-- Variance -->
                    <div style="background: ${diffBg}; border: 1px solid ${diffBorder}; padding: 16px; border-radius: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600; font-size: 1.1rem; color: ${diffColor}; text-transform: uppercase;">${diffLabel}</div>
                        </div>
                        <div style="font-size: 1.6rem; font-weight: 800; color: ${diffColor};">${diff > 0 ? '+' : ''}${diff === 0 ? '' : 'GHS '}${diffCashFmt}</div>
                    </div>

                </div>
                <div style="text-align: right;">
                    <button type="button" class="btn btn-outline" onclick="window.closeModal()">Close Details</button>
                </div>
            `;
            console.log("SUCCESS!");
} catch (e) {
    console.error("ERROR:", e);
}
