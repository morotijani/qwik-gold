// assets/js/modules/calculator.js

/**
 * Global Ghana Water Density Gold Calculation Utility
 * Standardized across Purchases, Sales, Vault, Loans, and Keepers.
 * 
 * Includes the Ghana Market standard 0.7% Purity Discount (or custom setting).
 */
window.GoldMath = {
    // Default discount percentage applied in the Ghanaian gold market (matches NWDGC)
    purityDiscountPercent: 0.70,
    isLoaded: false,

    async init() {
        // Read from localStorage cache first for instant synchronous render
        const cached = localStorage.getItem('purity_discount_percent');
        if (cached !== null && !isNaN(parseFloat(cached))) {
            this.purityDiscountPercent = parseFloat(cached);
        }

        // Fetch fresh settings from server if API client exists
        if (window.api && typeof window.api.get === 'function') {
            try {
                const res = await window.api.get('/settings/get.php');
                if (res && res.data && res.data.purity_discount_percent !== undefined) {
                    this.purityDiscountPercent = parseFloat(res.data.purity_discount_percent);
                    localStorage.setItem('purity_discount_percent', this.purityDiscountPercent);
                }
            } catch (err) {
                // Silently fallback to cached/default if not logged in yet
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

    truncate2(num) {
        return Math.floor((Number(num) + 0.00000001) * 100) / 100;
    },

    round2(num) {
        return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
    },

    /**
     * Compute full water density metrics for Refined Gold
     */
    calculate({ grams = 0, volume = 0, pricePerPound = 0, discountPercent = null }) {
        const g = parseFloat(grams) || 0;
        const v = parseFloat(volume) || 0;
        const p = parseFloat(pricePerPound) || 0;
        
        const disc = discountPercent !== null && discountPercent !== undefined
            ? Math.max(0, parseFloat(discountPercent) || 0)
            : this.getDiscountPercent();

        const pounds = g > 0 ? this.truncate2(g / 7.75) : 0;
        const density = (g > 0 && v > 0) ? this.truncate2(g / v) : 0;

        let rawKarat = 0;
        if (density > 0) {
            rawKarat = this.truncate2(((density - 10.51) * 52.838) / density);
            if (rawKarat < 0) rawKarat = 0;
            if (rawKarat > 24) rawKarat = 24; // Capped at 24K (pure gold maximum)
        }

        const discountFactor = (100 - disc) / 100;
        let payableKarat = 0;
        if (rawKarat > 0) {
            payableKarat = disc > 0 
                ? this.truncate2(rawKarat * discountFactor) 
                : rawKarat;
            if (payableKarat > 24) payableKarat = 24;
        }

        // Purity % is (payableKarat / 24) * 100 capped at 100%
        const purityPercent = payableKarat > 0 ? Math.min(100, this.round2((payableKarat / 24) * 100)) : 0;
        
        // Payout: floor((payableKarat * pricePerPound / 23) * pounds)
        const totalPayout = Math.floor((payableKarat * p / 23) * pounds);

        return {
            grams: g,
            volume: v,
            pricePerPound: p,
            discountPercent: disc,
            discountFactor,
            pounds,
            density,
            rawKarat,
            payableKarat,
            purityPercent,
            totalPayout
        };
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.GoldMath.init();
});
