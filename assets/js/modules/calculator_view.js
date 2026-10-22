// assets/js/modules/calculator_view.js

/**
 * Dedicated Full-Screen Water Density Gold Calculator
 * Mimics the clean, soft, high-fidelity UI of NWDGC (https://nwdgc.vercel.app/)
 */
(function() {
    let currentGoldType = 'refined';

    window.addEventListener('route-changed', (e) => {
        if (e.detail.route !== 'calculator') return;
        renderCalculatorView(e.detail.container);
    });

    function renderCalculatorView(container) {
        const discountPercent = window.GoldMath ? window.GoldMath.getDiscountPercent() : 0.70;

        container.innerHTML = `
            <div class="nwdgc-container" style="padding: 10px 0 30px 0;">
                <!-- Header: Blue Badge Logo + Reset Button -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
                    <div class="nwdgc-badge">
                        <div class="nwdgc-badge-title">
                            nwdgc<span style="color: #FACC15; font-size: 1.15rem; vertical-align: middle;">💧</span>
                        </div>
                        <div class="nwdgc-badge-sub">New Water Density Gold Calculator for Ghana</div>
                    </div>

                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button id="nwdgc_btn_new" class="btn" style="padding: 6px 16px; font-size: 0.82rem; font-weight: 600; background: #EEF2FF; color: #2D5BFF; border-radius: 9999px; border: none; display: inline-flex; align-items: center; gap: 4px; box-shadow: none;">
                            <span class="material-symbols-outlined" style="font-size: 1.05rem; font-weight: 700;">add</span> New
                        </button>
                    </div>
                </div>

                <!-- Mode Switcher (Refined Gold vs Gold Balls) -->
                <div style="display: flex; justify-content: center; margin-bottom: 14px;">
                    <div style="background: #FFFFFF; padding: 3px; border-radius: var(--radius-pill); border: 1.5px solid #E2E8F0; display: inline-flex; gap: 3px; box-shadow: 0 1px 4px rgba(0,0,0,0.02);">
                        <button id="calc_toggle_refined" class="btn ${currentGoldType === 'refined' ? 'btn-primary' : 'btn-text'}" style="padding: 6px 14px; font-size: 0.8rem; border-radius: var(--radius-pill);">
                            <span class="material-symbols-outlined" style="font-size: 1rem;">diamond</span> Refined Gold
                        </button>
                        <button id="calc_toggle_balls" class="btn ${currentGoldType === 'balls' ? 'btn-primary' : 'btn-text'}" style="padding: 6px 14px; font-size: 0.8rem; border-radius: var(--radius-pill);">
                            <span class="material-symbols-outlined" style="font-size: 1rem;">scatter_plot</span> Gold Balls
                        </button>
                    </div>
                </div>

                <!-- CARD 1: Input details of gold below (Soft Pastel Yellow) -->
                <div class="nwdgc-input-card">
                    <div class="nwdgc-input-header">
                        <span class="nwdgc-dot-yellow"></span>
                        <span><strong>Input</strong> details of gold below.</span>
                    </div>

                    ${currentGoldType === 'refined' ? `
                        <!-- Refined Gold Inputs -->
                        <div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px; margin-bottom: 10px;">
                            <!-- Top Weight -->
                            <div class="nwdgc-white-tile">
                                <label class="nwdgc-tile-label" for="calc_inp_weight">Top Weight</label>
                                <div class="nwdgc-tile-field">
                                    <input type="number" step="any" id="calc_inp_weight" class="nwdgc-tile-input" placeholder="0" autocomplete="off">
                                    <span class="nwdgc-tile-unit">grams</span>
                                </div>
                            </div>
                            <!-- Down Weight (Volume) -->
                            <div class="nwdgc-white-tile">
                                <label class="nwdgc-tile-label" for="calc_inp_volume">Down Weight</label>
                                <div class="nwdgc-tile-field">
                                    <input type="number" step="any" id="calc_inp_volume" class="nwdgc-tile-input" placeholder="0" autocomplete="off">
                                    <span class="nwdgc-tile-unit">grams</span>
                                </div>
                            </div>
                        </div>

                        <!-- Goldbod Price -->
                        <div class="nwdgc-white-tile">
                            <label class="nwdgc-tile-label" for="calc_inp_price">Goldbod Price</label>
                            <div class="nwdgc-tile-field">
                                <input type="number" step="any" id="calc_inp_price" class="nwdgc-tile-input" placeholder="0" autocomplete="off">
                                <span class="nwdgc-tile-unit">GHS</span>
                            </div>
                        </div>
                    ` : `
                        <!-- Gold Balls Inputs -->
                        <div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px; margin-bottom: 10px;">
                            <!-- Weight -->
                            <div class="nwdgc-white-tile">
                                <label class="nwdgc-tile-label" for="calc_inp_weight">Top Weight</label>
                                <div class="nwdgc-tile-field">
                                    <input type="number" step="any" id="calc_inp_weight" class="nwdgc-tile-input" placeholder="0" autocomplete="off">
                                    <span class="nwdgc-tile-unit">grams</span>
                                </div>
                            </div>
                            <!-- Calculated Blades -->
                            <div class="nwdgc-white-tile" style="background: #F8FAFC;">
                                <label class="nwdgc-tile-label">Calculated Blades</label>
                                <div class="nwdgc-tile-field">
                                    <span id="calc_lbl_blades" class="nwdgc-tile-input" style="color: #64748B;">0.0000</span>
                                    <span class="nwdgc-tile-unit">blades</span>
                                </div>
                            </div>
                        </div>

                        <!-- Price per Blade -->
                        <div class="nwdgc-white-tile">
                            <label class="nwdgc-tile-label" for="calc_inp_price_blade">Price per Blade</label>
                            <div class="nwdgc-tile-field">
                                <input type="number" step="any" id="calc_inp_price_blade" class="nwdgc-tile-input" placeholder="0" autocomplete="off">
                                <span class="nwdgc-tile-unit">GHS</span>
                            </div>
                        </div>
                    `}
                </div>

                <!-- CARD 2: Results can be found below (Vibrant Royal Blue) -->
                <div class="nwdgc-results-card">
                    <div class="nwdgc-results-header">
                        <span class="nwdgc-dot-yellow"></span>
                        <span><strong>Results</strong> can be found below.</span>
                    </div>

                    <!-- Dynamic Low Karat Warning Banner -->
                    <div id="calc_warn_banner" class="nwdgc-warning-banner hidden">
                        <span class="material-symbols-outlined" style="font-size: 1.15rem; color: #D97706;">error</span>
                        <span>Low karat reading. Confirm the sample before saving.</span>
                    </div>

                    ${currentGoldType === 'refined' ? `
                        <!-- 2x2 Metric Grid -->
                        <div class="nwdgc-metric-grid">
                            <div class="nwdgc-metric-tile">
                                <div class="nwdgc-metric-label">Pounds</div>
                                <div id="calc_res_pounds" class="nwdgc-metric-val">0.00</div>
                            </div>
                            <div class="nwdgc-metric-tile">
                                <div class="nwdgc-metric-label">Density</div>
                                <div id="calc_res_density" class="nwdgc-metric-val">0.00</div>
                            </div>
                            <div class="nwdgc-metric-tile">
                                <div class="nwdgc-metric-label">Karat Used</div>
                                <div id="calc_res_karat" class="nwdgc-metric-val">0.00</div>
                            </div>
                            <div class="nwdgc-metric-tile">
                                <div class="nwdgc-metric-label">Purity</div>
                                <div id="calc_res_purity" class="nwdgc-metric-val">0.00%</div>
                            </div>
                        </div>
                    ` : `
                        <!-- Gold Balls 2x2 Metric Grid -->
                        <div class="nwdgc-metric-grid">
                            <div class="nwdgc-metric-tile">
                                <div class="nwdgc-metric-label">Total Grams</div>
                                <div id="calc_res_grams" class="nwdgc-metric-val">0.00</div>
                            </div>
                            <div class="nwdgc-metric-tile">
                                <div class="nwdgc-metric-label">Conversion</div>
                                <div class="nwdgc-metric-val" style="font-size: 1.25rem;">0.80g / blade</div>
                            </div>
                            <div class="nwdgc-metric-tile">
                                <div class="nwdgc-metric-label">Blades</div>
                                <div id="calc_res_blades" class="nwdgc-metric-val">0.00</div>
                            </div>
                            <div class="nwdgc-metric-tile">
                                <div class="nwdgc-metric-label">Price / Blade</div>
                                <div id="calc_res_blade_price" class="nwdgc-metric-val">GHS 0.00</div>
                            </div>
                        </div>
                    `}

                    <!-- Full Width White Payout Box -->
                    <div class="nwdgc-payout-box">
                        <div class="nwdgc-payout-label">Amount to be paid to the seller</div>
                        <div id="calc_res_payout" class="nwdgc-payout-amount">GHS 0.00</div>
                    </div>
                </div>

                <!-- Footer Text & Discount Indicator -->
                <div style="text-align: center; margin-top: 18px;">
                    <div style="font-size: 1.05rem; font-weight: 800; color: #121926; letter-spacing: -0.2px; margin-bottom: 3px;">
                        ${discountPercent}% Purity Discount Applied
                    </div>
                    <div style="font-size: 0.76rem; color: #94A3B8; font-weight: 600;">
                        Powered by Qwik Gold & Gold Traders
                    </div>
                </div>

                <!-- Quick Action: Convert to Walk-In Purchase -->
                <div style="text-align: center; margin-top: 18px;">
                    <button id="calc_btn_create_purchase" class="btn btn-primary" style="padding: 9px 22px; font-size: 0.84rem; border-radius: var(--radius-pill); box-shadow: 0 4px 14px rgba(45, 91, 255, 0.2);">
                        <span class="material-symbols-outlined" style="font-size: 1.1rem;">add_shopping_cart</span> Create Walk-In Purchase Record
                    </button>
                </div>
            </div>
        `;

        setupCalculatorEvents(container);
    }

    function setupCalculatorEvents(container) {
        const toggleRefined = document.getElementById('calc_toggle_refined');
        const toggleBalls = document.getElementById('calc_toggle_balls');
        const btnNew = document.getElementById('nwdgc_btn_new');
        const btnCreatePurchase = document.getElementById('calc_btn_create_purchase');

        if (toggleRefined) {
            toggleRefined.addEventListener('click', () => {
                currentGoldType = 'refined';
                renderCalculatorView(container);
            });
        }

        if (toggleBalls) {
            toggleBalls.addEventListener('click', () => {
                currentGoldType = 'balls';
                renderCalculatorView(container);
            });
        }

        if (btnNew) {
            btnNew.addEventListener('click', () => {
                renderCalculatorView(container);
            });
        }

        // Live input calculation
        const weightInput = document.getElementById('calc_inp_weight');
        const volumeInput = document.getElementById('calc_inp_volume');
        const priceInput = document.getElementById('calc_inp_price');
        const priceBladeInput = document.getElementById('calc_inp_price_blade');

        const doCalc = () => {
            const grams = parseFloat(weightInput?.value) || 0;

            if (currentGoldType === 'refined') {
                const volume = parseFloat(volumeInput?.value) || 0;
                const price = parseFloat(priceInput?.value) || 0;

                const res = window.GoldMath.calculate({
                    grams,
                    volume,
                    pricePerPound: price
                });

                // Update metrics
                const elPounds = document.getElementById('calc_res_pounds');
                const elDensity = document.getElementById('calc_res_density');
                const elKarat = document.getElementById('calc_res_karat');
                const elPurity = document.getElementById('calc_res_purity');
                const elPayout = document.getElementById('calc_res_payout');
                const warnBanner = document.getElementById('calc_warn_banner');

                if (elPounds) {
                    elPounds.textContent = res.pounds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    elPounds.title = res.pounds.toString();
                }
                if (elDensity) {
                    elDensity.textContent = res.density.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    elDensity.title = res.density.toString();
                }
                if (elKarat) {
                    elKarat.textContent = res.payableKarat.toFixed(2);
                    elKarat.title = res.payableKarat.toString();
                }
                if (elPurity) {
                    elPurity.textContent = res.purityPercent.toFixed(2) + '%';
                    elPurity.title = res.purityPercent.toString() + '%';
                }
                if (elPayout) {
                    elPayout.textContent = 'GHS ' + res.totalPayout.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                    elPayout.title = 'GHS ' + res.totalPayout.toLocaleString();
                }

                // Low karat banner (< 14 karat when weight & volume are present)
                if (warnBanner) {
                    if (res.density > 0 && res.payableKarat > 0 && res.payableKarat < 14.0) {
                        warnBanner.classList.remove('hidden');
                    } else {
                        warnBanner.classList.add('hidden');
                    }
                }
            } else {
                // Gold Balls
                const priceBlade = parseFloat(priceBladeInput?.value) || 0;
                const blades = grams > 0 ? (grams / 0.8) : 0;
                const payout = Math.floor(blades * priceBlade);

                const lblBlades = document.getElementById('calc_lbl_blades');
                const elGrams = document.getElementById('calc_res_grams');
                const elBlades = document.getElementById('calc_res_blades');
                const elBladePrice = document.getElementById('calc_res_blade_price');
                const elPayout = document.getElementById('calc_res_payout');

                if (lblBlades) {
                    lblBlades.textContent = blades.toFixed(4);
                    lblBlades.title = blades.toString();
                }
                if (elGrams) {
                    elGrams.textContent = grams.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    elGrams.title = grams.toString();
                }
                if (elBlades) {
                    elBlades.textContent = blades.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    elBlades.title = blades.toString();
                }
                if (elBladePrice) {
                    elBladePrice.textContent = 'GHS ' + priceBlade.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    elBladePrice.title = 'GHS ' + priceBlade.toString();
                }
                if (elPayout) {
                    elPayout.textContent = 'GHS ' + payout.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                    elPayout.title = 'GHS ' + payout.toLocaleString();
                }
            }
        };

        [weightInput, volumeInput, priceInput, priceBladeInput].forEach(inp => {
            if (inp) {
                inp.addEventListener('input', doCalc);
            }
        });

        // Fast transfer to purchase record
        if (btnCreatePurchase) {
            btnCreatePurchase.addEventListener('click', async () => {
                const grams = parseFloat(weightInput?.value) || 0;
                if (grams <= 0) {
                    window.showToast('Please enter a gold weight first', 'error');
                    return;
                }

                // Open purchase modal
                await window.openNewPurchaseModal();

                // Prefill state
                const state = window._wizardState;
                if (state) {
                    state.goldType = currentGoldType;
                    state.grams = grams;
                    if (currentGoldType === 'refined') {
                        state.volume = parseFloat(volumeInput?.value) || 0;
                        state.pricePerPound = parseFloat(priceInput?.value) || 0;
                    } else {
                        state.pricePerBlade = parseFloat(priceBladeInput?.value) || 0;
                    }
                }
            });
        }
    }
})();
