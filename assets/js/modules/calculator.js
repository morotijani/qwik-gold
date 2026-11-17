// assets/js/modules/calculator.js

/**
 * Global Ghana Water Density Gold Calculation Utility
 * Standardized across Purchases, Sales, Vault, Loans, and Keepers.
 *
 * Supports:
 *  - 'mayrocy' (Default): Full-precision raw density for raw karat, rounded display density,
 *    and subtractive purity discount directly from purity % (rawPurity - discount%).
 *  - 'nwdgc' (Legacy): Truncated density, and multiplicative discount on raw karat.
 */
window.GoldMath = {
    purityDiscountPercent: 0.70,
    calculationFormula: 'mayrocy',
    isLoaded: false,

    async init() {
        const cachedDisc = localStorage.getItem('purity_discount_percent');
        if (cachedDisc !== null && !isNaN(parseFloat(cachedDisc))) {
            this.purityDiscountPercent = parseFloat(cachedDisc);
        }

        const cachedFormula = localStorage.getItem('calculation_formula');
        if (cachedFormula === 'mayrocy' || cachedFormula === 'nwdgc') {
            this.calculationFormula = cachedFormula;
        }

        if (window.api && typeof window.api.get === 'function') {
            try {
                const res = await window.api.get('/settings/get.php');
                const settings = (res && res.data) ? res.data : res;
                if (settings) {
                    if (settings.purity_discount_percent !== undefined) {
                        this.setDiscountPercent(settings.purity_discount_percent);
                    }
                    if (settings.calculation_formula) {
                        this.setCalculationFormula(settings.calculation_formula);
                    }
                }
            } catch (err) {
                // Silently fallback to cached/default
            }
        }
        this.isLoaded = true;
    },

    getDiscountPercent() {
        if (typeof this.purityDiscountPercent === 'number' && !isNaN(this.purityDiscountPercent)) {
            return this.purityDiscountPercent;
        }
        const cached = localStorage.getItem('purity_discount_percent');
        return cached !== null ? parseFloat(cached) : 0.70;
    },

    setDiscountPercent(val) {
        this.purityDiscountPercent = Math.max(0, parseFloat(val) || 0);
        localStorage.setItem('purity_discount_percent', this.purityDiscountPercent);
    },

    getCalculationFormula() {
        if (this.calculationFormula === 'mayrocy' || this.calculationFormula === 'nwdgc') {
            return this.calculationFormula;
        }
        const cached = localStorage.getItem('calculation_formula');
        return (cached === 'mayrocy' || cached === 'nwdgc') ? cached : 'mayrocy';
    },

    setCalculationFormula(val) {
        const normalized = String(val || '').trim().toLowerCase();
        this.calculationFormula = (normalized === 'nwdgc') ? 'nwdgc' : 'mayrocy';
        localStorage.setItem('calculation_formula', this.calculationFormula);
    },

    truncate2(num) {
        return Math.floor((Number(num) + 0.00000001) * 100) / 100;
    },

    round2(num) {
        return Math.round((Number(num) + 1e-12 + Number.EPSILON) * 100) / 100;
    },

    /**
     * Compute full water density metrics for Refined Gold
     */
    calculate({ grams = 0, volume = 0, pricePerPound = 0, discountPercent = null, formula = null }) {
        const g = parseFloat(grams) || 0;
        const v = parseFloat(volume) || 0;
        const p = parseFloat(pricePerPound) || 0;

        const disc = discountPercent !== null && discountPercent !== undefined
            ? Math.max(0, parseFloat(discountPercent) || 0)
            : this.getDiscountPercent();

        const activeFormula = (formula === 'mayrocy' || formula === 'nwdgc')
            ? formula
            : this.getCalculationFormula();

        const pounds = g > 0 ? this.truncate2(g / 7.75) : 0;
        const rawDensity = (g > 0 && v > 0) ? (g / v) : 0;

        let density = 0;
        let rawKarat = 0;
        let rawPurity = 0;
        let payableKarat = 0;
        let purityPercent = 0;

        if (activeFormula === 'nwdgc') {
            density = rawDensity > 0 ? this.truncate2(rawDensity) : 0;
            if (density > 0) {
                rawKarat = this.truncate2(((density - 10.51) * 52.838) / density);
                rawKarat = Math.max(0, Math.min(24, rawKarat));
            }
            rawPurity = rawKarat > 0 ? Math.min(100, this.round2((rawKarat / 24) * 100)) : 0;

            const discountFactor = (100 - disc) / 100;
            if (rawKarat > 0) {
                payableKarat = disc > 0
                    ? this.truncate2(rawKarat * discountFactor)
                    : rawKarat;
                payableKarat = Math.max(0, Math.min(24, payableKarat));
            }
            purityPercent = payableKarat > 0 ? Math.min(100, this.round2((payableKarat / 24) * 100)) : 0;
        } else {
            // Mayrocy Standard (Default)
            density = rawDensity > 0 ? this.round2(rawDensity) : 0;
            if (rawDensity > 0) {
                rawKarat = this.truncate2(((rawDensity - 10.51) * 52.838) / rawDensity);
                rawKarat = Math.max(0, Math.min(24, rawKarat));
            }
            rawPurity = rawKarat > 0 ? Math.min(100, this.round2((rawKarat / 24) * 100)) : 0;

            purityPercent = rawPurity > 0
                ? Math.max(0, Math.min(100, this.round2(rawPurity - disc)))
                : 0;

            payableKarat = purityPercent > 0
                ? Math.max(0, Math.min(24, this.round2((purityPercent / 100) * 24)))
                : 0;
        }

        const adjustedPricePerPound = (payableKarat > 0 && p > 0) ? this.round2((payableKarat * p) / 23) : 0;
        const totalPayout = (payableKarat > 0 && p > 0 && pounds > 0) ? Math.floor((payableKarat * p / 23) * pounds) : 0;
        const grossPayout = (rawKarat > 0 && p > 0 && pounds > 0) ? Math.floor((rawKarat * p / 23) * pounds) : 0;
        const discountSaved = Math.max(0, grossPayout - totalPayout);

        return {
            formula: activeFormula,
            grams: g,
            volume: v,
            pricePerPound: p,
            adjustedPricePerPound,
            discountPercent: disc,
            discountFactor: (100 - disc) / 100,
            pounds,
            density,
            rawKarat,
            rawPurity,
            payableKarat,
            purityPercent,
            totalPayout,
            grossPayout,
            discountSaved
        };
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.GoldMath.init();
});
