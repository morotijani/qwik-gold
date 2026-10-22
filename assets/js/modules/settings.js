// assets/js/modules/settings.js

/**
 * System Settings & Company Profile Module
 * Manages company identity, logo branding, gold valuation formulas, and transaction defaults.
 */

window._currentSettings = {};
window._activeSettingsTab = 'company';

window.addEventListener('route-changed', async (e) => {
    if (e.detail.route !== 'settings') return;

    const container = e.detail.container;

    // Show initial loading skeleton
    container.innerHTML = `
        <div style="width: 100%; padding-bottom: 60px; animation: fadeIn 0.3s ease;">
            <div style="margin-bottom: 24px;">
                <h2 style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); margin: 0 0 4px 0;">System Settings</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem; margin: 0;">Configure company profile, branding, and gold valuation formulas.</p>
            </div>
            <div class="glass-panel" style="padding: 40px; text-align: center;">
                <span class="material-symbols-outlined spin" style="font-size: 32px; color: var(--gold-primary);">sync</span>
                <p style="color: var(--text-muted); margin-top: 12px; font-weight: 600;">Loading system settings...</p>
            </div>
        </div>
    `;

    // Fetch current settings from backend
    try {
        const res = await window.api.get('/settings/get.php');
        window._currentSettings = (res && res.data) ? res.data : (res || {});
        if (window._currentSettings.purity_discount_percent !== undefined && window.GoldMath) {
            window.GoldMath.setDiscountPercent(parseFloat(window._currentSettings.purity_discount_percent));
        }
        if (window.applyCompanyProfileUI) {
            window.applyCompanyProfileUI(window._currentSettings);
        }
    } catch (err) {
        console.warn("Using fallback/cached settings:", err);
        window._currentSettings = (window.getCompanySettings && window.getCompanySettings()) || {
            company_name: 'Qwik Gold',
            company_tagline: 'Enterprise Precious Metals Ledger',
            company_address: 'Accra Gold Market, Greater Accra, Ghana',
            company_phone: '+233 24 123 4567',
            company_email: 'info@qwikgold.com',
            company_website: 'https://qwikgold.com',
            company_currency: 'GHS',
            company_logo: 'assets/img/logo.png',
            company_receipt_footer: 'Thank you for doing business with Qwik Gold!',
            purity_discount_percent: 0.70
        };
    }

    window.renderSettingsUI(container);
});

/**
 * Render the entire settings page
 */
window.renderSettingsUI = (container) => {
    const s = window._currentSettings || {};
    const companyName = s.company_name || 'Qwik Gold';
    const companyTagline = s.company_tagline || 'Enterprise Precious Metals Ledger';
    const companyPhone = s.company_phone || '+233 24 123 4567';
    const companyEmail = s.company_email || 'info@qwikgold.com';
    const companyAddress = s.company_address || 'Accra Gold Market, Greater Accra, Ghana';
    const companyWebsite = s.company_website || 'https://qwikgold.com';
    const companyCurrency = s.company_currency || 'GHS';
    const companyLogo = s.company_logo || 'assets/img/logo.png';
    const receiptFooter = s.company_receipt_footer || 'Thank you for doing business with Qwik Gold!';
    const currentDiscount = parseFloat(s.purity_discount_percent !== undefined ? s.purity_discount_percent : 0.70);

    const isAdmin = window.isAdmin ? window.isAdmin() : true;

    container.innerHTML = `
        <div style="width: 100%; padding-bottom: 60px; animation: fadeIn 0.3s ease;">
            
            <!-- Page Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; flex-wrap: wrap; gap: 16px;">
                <div>
                    <h2 style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); margin: 0 0 4px 0; display: flex; align-items: center; gap: 10px;">
                        <span class="material-symbols-outlined" style="color: var(--gold-primary); font-size: 32px;">tune</span>
                        System Settings
                    </h2>
                    <p style="color: var(--text-muted); font-size: 0.95rem; margin: 0;">
                        Manage your company identity, branding logo, official contact info, and gold valuation formulas.
                    </p>
                </div>
                ${isAdmin ? `
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-primary" id="btn_save_all_settings" onclick="window.saveAllSettings()" style="display: flex; align-items: center; gap: 8px; padding: 10px 22px; font-weight: 700; box-shadow: 0 4px 14px rgba(45, 91, 255, 0.25);">
                            <span class="material-symbols-outlined">save</span> Save All Settings
                        </button>
                    </div>
                ` : `
                    <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); color: #d97706; padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                        <span class="material-symbols-outlined" style="font-size: 16px;">lock</span> View Only Mode
                    </div>
                `}
            </div>

            <!-- Settings Navigation Tabs -->
            <div class="settings-tabs">
                <button type="button" class="settings-tab-btn ${window._activeSettingsTab === 'company' ? 'active' : ''}" id="tab_btn_company" onclick="window.switchSettingsTab('company')">
                    <span class="material-symbols-outlined">business</span>
                    <span>Company Profile & Branding</span>
                </button>
                <button type="button" class="settings-tab-btn ${window._activeSettingsTab === 'valuation' ? 'active' : ''}" id="tab_btn_valuation" onclick="window.switchSettingsTab('valuation')">
                    <span class="material-symbols-outlined">tune</span>
                    <span>Gold Valuation & Standards</span>
                </button>
            </div>

            <!-- ========================================================= -->
            <!-- TAB PANE 1: COMPANY PROFILE & BRANDING                   -->
            <!-- ========================================================= -->
            <div id="settings_pane_company" style="display: ${window._activeSettingsTab === 'company' ? 'block' : 'none'};">
                <div style="display: grid; grid-template-columns: minmax(320px, 1fr) minmax(380px, 1.4fr); gap: 24px; align-items: start;">
                    
                    <!-- Left Column: Logo & Visual Identity + Live Receipt Preview -->
                    <div style="display: flex; flex-direction: column; gap: 24px;">
                        
                        <!-- Logo Upload Card -->
                        <div class="glass-panel" style="padding: 24px; border-radius: 16px; background: var(--bg-panel); border: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 18px;">
                                <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(45, 91, 255, 0.1); color: var(--gold-primary); display: flex; align-items: center; justify-content: center;">
                                    <span class="material-symbols-outlined" style="font-size: 22px;">photo_camera</span>
                                </div>
                                <div>
                                    <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin: 0;">Company Logo</h3>
                                    <p style="color: var(--text-muted); font-size: 0.8rem; margin: 2px 0 0 0;">Appears on navigation, login card, and printed receipts</p>
                                </div>
                            </div>

                            <div style="display: flex; gap: 18px; align-items: center; margin-bottom: 16px;">
                                <div class="logo-preview-container" title="Current Logo Preview">
                                    <img id="setting_logo_preview" src="${companyLogo}" alt="Company Logo" class="logo-preview-img" onerror="this.src='assets/img/logo.png'">
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-main); margin-bottom: 4px;">Brand Emblem</div>
                                    <div style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 12px;">
                                        Recommended: Transparent PNG, SVG, or WEBP up to 5MB.
                                    </div>
                                    ${isAdmin ? `
                                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                            <input type="file" id="company_logo_file" accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif" style="display: none;" onchange="window.handleLogoFileInput(this)">
                                            <button type="button" class="btn btn-sm btn-primary" onclick="document.getElementById('company_logo_file').click()" style="display: flex; align-items: center; gap: 6px; padding: 7px 14px; font-size: 0.82rem; font-weight: 700;">
                                                <span class="material-symbols-outlined" style="font-size: 16px;">upload</span> Choose Image
                                            </button>
                                            <button type="button" class="btn btn-sm btn-outline" onclick="window.resetCompanyLogo()" style="font-size: 0.82rem; font-weight: 600; padding: 7px 12px;">
                                                Reset Default
                                            </button>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>

                            <!-- Drag and drop zone -->
                            ${isAdmin ? `
                                <div class="logo-dropzone" id="logo_dropzone" onclick="document.getElementById('company_logo_file').click()">
                                    <span class="material-symbols-outlined" style="font-size: 28px; color: var(--gold-primary); margin-bottom: 4px;">cloud_upload</span>
                                    <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-main);">Click or Drag & Drop new logo here</div>
                                    <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">PNG, JPG, SVG, or WEBP (Max 5MB)</div>
                                </div>
                            ` : ''}
                            <input type="hidden" id="setting_company_logo" value="${companyLogo}">
                        </div>

                        <!-- Live Customer Receipt Preview -->
                        <div class="glass-panel" style="padding: 24px; border-radius: 16px; background: var(--bg-panel); border: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span class="material-symbols-outlined" style="color: #059669; font-size: 20px;">receipt_long</span>
                                    <h4 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--text-main);">Live Receipt Preview</h4>
                                </div>
                                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600; background: var(--bg-main); padding: 3px 8px; border-radius: 8px;">Auto-Updates</span>
                            </div>

                            <!-- Styled mini receipt card -->
                            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); font-size: 0.82rem;">
                                <div style="text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 12px; margin-bottom: 12px;">
                                    <img id="preview_receipt_logo" src="${companyLogo}" style="max-height: 36px; max-width: 120px; object-fit: contain; margin-bottom: 4px;" onerror="this.style.display='none'">
                                    <div id="preview_receipt_name" style="font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 800; color: var(--gold-primary); text-transform: uppercase; letter-spacing: -0.2px;">
                                        ${companyName}
                                    </div>
                                    <div id="preview_receipt_tagline" style="font-size: 0.72rem; color: var(--text-muted); font-weight: 500; margin-top: 2px;">
                                        ${companyTagline}
                                    </div>
                                    <div id="preview_receipt_address" style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">
                                        ${companyAddress}
                                    </div>
                                    <div id="preview_receipt_contacts" style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">
                                        ${[companyPhone, companyEmail].filter(Boolean).join(' &bull; ')}
                                    </div>
                                    <div style="margin-top: 6px; font-weight: 700; font-size: 0.75rem; color: var(--text-main);">
                                        Purchase Receipt - <span style="color: var(--gold-primary);">Customer Copy</span>
                                    </div>
                                </div>

                                <table style="width: 100%; font-size: 0.78rem; margin-bottom: 10px;">
                                    <tr>
                                        <td style="color: var(--text-muted); padding: 2px 0;">Sample Txn:</td>
                                        <td style="text-align: right; font-weight: 600; font-family: monospace;">#TXN-DEMO</td>
                                    </tr>
                                    <tr>
                                        <td style="color: var(--text-muted); padding: 2px 0;">Gold Type:</td>
                                        <td style="text-align: right; font-weight: 600;">Refined (Smelted)</td>
                                    </tr>
                                    <tr>
                                        <td style="color: var(--text-muted); padding: 2px 0;">Weight / Assay:</td>
                                        <td style="text-align: right; font-weight: 600;">65.01 g &bull; 21.8k</td>
                                    </tr>
                                </table>

                                <div style="background: var(--bg-main); border-radius: 8px; padding: 8px 10px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <span style="font-weight: 700; font-size: 0.78rem; color: var(--text-muted);">Payout:</span>
                                    <span style="font-weight: 800; font-size: 0.95rem; color: var(--danger);" id="preview_receipt_amount">₵ 75,410</span>
                                </div>

                                <div id="preview_receipt_footer" style="text-align: center; color: var(--text-muted); font-size: 0.72rem; font-style: italic; border-top: 1px dashed #e2e8f0; padding-top: 8px;">
                                    ${receiptFooter}
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- Right Column: Company Information Form -->
                    <div class="glass-panel" style="padding: 28px; border-radius: 16px; background: var(--bg-panel); border: 1px solid var(--border);">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 22px;">
                            <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(16, 185, 129, 0.1); color: #059669; display: flex; align-items: center; justify-content: center;">
                                <span class="material-symbols-outlined" style="font-size: 22px;">storefront</span>
                            </div>
                            <div>
                                <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin: 0;">Business & Contact Details</h3>
                                <p style="color: var(--text-muted); font-size: 0.82rem; margin: 2px 0 0 0;">Official trading information registered across all ERP reports</p>
                            </div>
                        </div>

                        <form id="company-profile-form" onsubmit="event.preventDefault(); window.saveCompanyProfile();">
                            
                            <!-- Company Name -->
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label style="display: block; font-weight: 700; color: var(--text-main); margin-bottom: 6px; font-size: 0.84rem;">
                                    Company Name <span style="color: var(--danger);">*</span>
                                </label>
                                <input type="text" id="setting_company_name" value="${companyName}" required
                                    style="width: 100%; padding: 11px 14px; border: 1.5px solid var(--border); border-radius: 10px; background: var(--bg-main); font-size: 0.95rem; font-weight: 600; color: var(--text-main); outline: none; transition: all 0.2s; box-sizing: border-box;"
                                    onfocus="this.style.borderColor='var(--gold-primary)'; this.style.background='#ffffff';"
                                    onblur="this.style.borderColor='var(--border)'; this.style.background='var(--bg-main)';"
                                    oninput="window.updateCompanyPreview()" ${!isAdmin ? 'disabled' : ''}>
                            </div>

                            <!-- Tagline / Subtitle -->
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label style="display: block; font-weight: 700; color: var(--text-main); margin-bottom: 6px; font-size: 0.84rem;">
                                    Tagline / Business Nature
                                </label>
                                <input type="text" id="setting_company_tagline" value="${companyTagline}" placeholder="e.g. Precious Metals & Gold Trading"
                                    style="width: 100%; padding: 11px 14px; border: 1.5px solid var(--border); border-radius: 10px; background: var(--bg-main); font-size: 0.92rem; color: var(--text-main); outline: none; transition: all 0.2s; box-sizing: border-box;"
                                    onfocus="this.style.borderColor='var(--gold-primary)'; this.style.background='#ffffff';"
                                    onblur="this.style.borderColor='var(--border)'; this.style.background='var(--bg-main)';"
                                    oninput="window.updateCompanyPreview()" ${!isAdmin ? 'disabled' : ''}>
                            </div>

                            <!-- Two Columns: Phone & Email -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
                                <div class="form-group">
                                    <label style="display: block; font-weight: 700; color: var(--text-main); margin-bottom: 6px; font-size: 0.84rem;">
                                        Phone Number(s)
                                    </label>
                                    <input type="text" id="setting_company_phone" value="${companyPhone}" placeholder="+233 24 123 4567"
                                        style="width: 100%; padding: 11px 14px; border: 1.5px solid var(--border); border-radius: 10px; background: var(--bg-main); font-size: 0.92rem; color: var(--text-main); outline: none; transition: all 0.2s; box-sizing: border-box;"
                                        onfocus="this.style.borderColor='var(--gold-primary)'; this.style.background='#ffffff';"
                                        onblur="this.style.borderColor='var(--border)'; this.style.background='var(--bg-main)';"
                                        oninput="window.updateCompanyPreview()" ${!isAdmin ? 'disabled' : ''}>
                                </div>
                                <div class="form-group">
                                    <label style="display: block; font-weight: 700; color: var(--text-main); margin-bottom: 6px; font-size: 0.84rem;">
                                        Official Email
                                    </label>
                                    <input type="email" id="setting_company_email" value="${companyEmail}" placeholder="info@qwikgold.com"
                                        style="width: 100%; padding: 11px 14px; border: 1.5px solid var(--border); border-radius: 10px; background: var(--bg-main); font-size: 0.92rem; color: var(--text-main); outline: none; transition: all 0.2s; box-sizing: border-box;"
                                        onfocus="this.style.borderColor='var(--gold-primary)'; this.style.background='#ffffff';"
                                        onblur="this.style.borderColor='var(--border)'; this.style.background='var(--bg-main)';"
                                        oninput="window.updateCompanyPreview()" ${!isAdmin ? 'disabled' : ''}>
                                </div>
                            </div>

                            <!-- Physical Address -->
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label style="display: block; font-weight: 700; color: var(--text-main); margin-bottom: 6px; font-size: 0.84rem;">
                                    Physical Address / Trading Location
                                </label>
                                <textarea id="setting_company_address" rows="2" placeholder="e.g. Suite 4, Derby Avenue, Accra Gold Market, Greater Accra, Ghana"
                                    style="width: 100%; padding: 10px 14px; border: 1.5px solid var(--border); border-radius: 10px; background: var(--bg-main); font-size: 0.92rem; color: var(--text-main); outline: none; resize: vertical; transition: all 0.2s; box-sizing: border-box; font-family: inherit;"
                                    onfocus="this.style.borderColor='var(--gold-primary)'; this.style.background='#ffffff';"
                                    onblur="this.style.borderColor='var(--border)'; this.style.background='var(--bg-main)';"
                                    oninput="window.updateCompanyPreview()" ${!isAdmin ? 'disabled' : ''}>${companyAddress}</textarea>
                            </div>

                            <!-- Two Columns: Website & Currency -->
                            <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; margin-bottom: 16px;">
                                <div class="form-group">
                                    <label style="display: block; font-weight: 700; color: var(--text-main); margin-bottom: 6px; font-size: 0.84rem;">
                                        Website URL
                                    </label>
                                    <input type="text" id="setting_company_website" value="${companyWebsite}" placeholder="https://qwikgold.com"
                                        style="width: 100%; padding: 11px 14px; border: 1.5px solid var(--border); border-radius: 10px; background: var(--bg-main); font-size: 0.92rem; color: var(--text-main); outline: none; transition: all 0.2s; box-sizing: border-box;"
                                        onfocus="this.style.borderColor='var(--gold-primary)'; this.style.background='#ffffff';"
                                        onblur="this.style.borderColor='var(--border)'; this.style.background='var(--bg-main)';"
                                        oninput="window.updateCompanyPreview()" ${!isAdmin ? 'disabled' : ''}>
                                </div>
                                <div class="form-group">
                                    <label style="display: block; font-weight: 700; color: var(--text-main); margin-bottom: 6px; font-size: 0.84rem;">
                                        Base Currency
                                    </label>
                                    <input type="text" id="setting_company_currency" value="${companyCurrency}" placeholder="GHS (₵)"
                                        style="width: 100%; padding: 11px 14px; border: 1.5px solid var(--border); border-radius: 10px; background: var(--bg-main); font-size: 0.92rem; font-weight: 700; color: var(--text-main); outline: none; transition: all 0.2s; box-sizing: border-box;"
                                        onfocus="this.style.borderColor='var(--gold-primary)'; this.style.background='#ffffff';"
                                        onblur="this.style.borderColor='var(--border)'; this.style.background='var(--bg-main)';"
                                        ${!isAdmin ? 'disabled' : ''}>
                                </div>
                            </div>

                            <!-- Receipt Footer Note -->
                            <div class="form-group" style="margin-bottom: 24px;">
                                <label style="display: block; font-weight: 700; color: var(--text-main); margin-bottom: 6px; font-size: 0.84rem;">
                                    Receipt & Printout Note
                                </label>
                                <input type="text" id="setting_company_receipt_footer" value="${receiptFooter}" placeholder="e.g. Thank you for doing business with Qwik Gold!"
                                    style="width: 100%; padding: 11px 14px; border: 1.5px solid var(--border); border-radius: 10px; background: var(--bg-main); font-size: 0.92rem; color: var(--text-main); outline: none; transition: all 0.2s; box-sizing: border-box;"
                                    onfocus="this.style.borderColor='var(--gold-primary)'; this.style.background='#ffffff';"
                                    onblur="this.style.borderColor='var(--border)'; this.style.background='var(--bg-main)';"
                                    oninput="window.updateCompanyPreview()" ${!isAdmin ? 'disabled' : ''}>
                            </div>

                            <!-- Save Button -->
                            ${isAdmin ? `
                                <div style="display: flex; justify-content: flex-end; gap: 10px;">
                                    <button type="submit" class="btn btn-primary" id="btn_save_company" style="display: flex; align-items: center; gap: 8px; padding: 11px 24px; font-weight: 700; box-shadow: 0 4px 14px rgba(45, 91, 255, 0.2);">
                                        <span class="material-symbols-outlined">save</span> Save Company Profile
                                    </button>
                                </div>
                            ` : ''}
                        </form>
                    </div>

                </div>
            </div>

            <!-- ========================================================= -->
            <!-- TAB PANE 2: GOLD VALUATION & STANDARDS                  -->
            <!-- ========================================================= -->
            <div id="settings_pane_valuation" style="display: ${window._activeSettingsTab === 'valuation' ? 'block' : 'none'};">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 24px;">

                    <!-- Card 1: Gold Valuation & Ghana Purity Discount -->
                    <div class="glass-panel" style="padding: 28px; border-radius: 16px; background: var(--bg-panel); border: 1px solid var(--border); box-shadow: var(--shadow-sm);">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                            <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(245, 158, 11, 0.12); color: var(--gold-primary); display: flex; align-items: center; justify-content: center;">
                                <span class="material-symbols-outlined" style="font-size: 24px;">percent</span>
                            </div>
                            <div>
                                <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin: 0;">Refined Gold Purity Discount</h3>
                                <p style="color: var(--text-muted); font-size: 0.82rem; margin: 2px 0 0 0;">Ghana Water Density standard buyer deduction</p>
                            </div>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label style="display: block; font-weight: 700; color: var(--text-main); margin-bottom: 8px; font-size: 0.9rem;">
                                Purity Discount Rate (%) <span style="color: var(--danger);">*</span>
                            </label>
                            <div style="position: relative; margin-bottom: 12px;">
                                <input type="number" step="0.01" min="0" max="25" id="setting_purity_discount" value="${currentDiscount.toFixed(2)}"
                                    style="width: 100%; padding: 14px 50px 14px 16px; border: 2px solid var(--border); border-radius: 12px; background: var(--bg-main); font-size: 1.25rem; font-weight: 800; color: var(--text-main); outline: none; transition: border-color 0.2s;"
                                    onfocus="this.style.borderColor='var(--gold-primary)'"
                                    onblur="this.style.borderColor='var(--border)'"
                                    oninput="window.updateSettingsPreview()" ${!isAdmin ? 'disabled' : ''}>
                                <span style="position: absolute; right: 18px; top: 50%; transform: translateY(-50%); font-weight: 800; color: var(--text-muted); font-size: 1.1rem; pointer-events: none;">%</span>
                            </div>

                            <!-- Preset Quick Buttons -->
                            ${isAdmin ? `
                                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                    <button type="button" class="btn btn-sm btn-outline" onclick="window.applyDiscountPreset(0.0)" style="font-size: 0.78rem; font-weight: 600; padding: 4px 10px; border-radius: 8px;">
                                        0.0% (Gross Only)
                                    </button>
                                    <button type="button" class="btn btn-sm btn-outline" onclick="window.applyDiscountPreset(0.5)" style="font-size: 0.78rem; font-weight: 600; padding: 4px 10px; border-radius: 8px;">
                                        0.50%
                                    </button>
                                    <button type="button" class="btn btn-sm" onclick="window.applyDiscountPreset(0.7)" style="background: rgba(16, 185, 129, 0.15); color: #059669; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 0.78rem; font-weight: 700; padding: 4px 10px; border-radius: 8px;">
                                        ★ 0.70% (Ghana Market / NWDGC)
                                    </button>
                                    <button type="button" class="btn btn-sm btn-outline" onclick="window.applyDiscountPreset(1.0)" style="font-size: 0.78rem; font-weight: 600; padding: 4px 10px; border-radius: 8px;">
                                        1.00%
                                    </button>
                                </div>
                            ` : ''}
                        </div>

                        <!-- Market Context Notice -->
                        <div style="background: rgba(45, 91, 255, 0.05); border: 1px solid rgba(45, 91, 255, 0.15); border-radius: 12px; padding: 14px; font-size: 0.83rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 20px;">
                            <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; color: var(--gold-primary); margin-bottom: 4px;">
                                <span class="material-symbols-outlined" style="font-size: 16px;">info</span>
                                Why a Purity Discount?
                            </div>
                            In the Ghanaian gold trade (e.g. <em>nwdgc.vercel.app</em> / Gold Traders), buyers apply a standard <strong>0.7% purity discount</strong> on water density calculations to buffer for smelting slag loss and assay tolerances.
                            Setting this to <strong>0.00%</strong> uses the pure unadjusted Archimedes formula.
                        </div>

                        ${isAdmin ? `
                            <button type="button" class="btn btn-primary" id="btn_save_valuation" onclick="window.saveValuationSettings()" style="display: flex; align-items: center; gap: 8px; padding: 10px 20px; font-weight: 700;">
                                <span class="material-symbols-outlined">save</span> Save Valuation Setting
                            </button>
                        ` : ''}
                    </div>

                    <!-- Card 2: Interactive Real-Time Calculator Preview Sandbox -->
                    <div class="glass-panel" style="padding: 28px; border-radius: 16px; background: var(--bg-panel); border: 1px solid var(--border); box-shadow: var(--shadow-sm);">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                            <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(16, 185, 129, 0.12); color: #059669; display: flex; align-items: center; justify-content: center;">
                                <span class="material-symbols-outlined" style="font-size: 24px;">calculate</span>
                            </div>
                            <div>
                                <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin: 0;">Live Calculation Sandbox</h3>
                                <p style="color: var(--text-muted); font-size: 0.82rem; margin: 2px 0 0 0;">Verify payout changes in real-time before saving</p>
                            </div>
                        </div>

                        <!-- Sandbox Inputs -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 10px; margin-bottom: 16px;">
                            <div>
                                <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 4px;">Weight (g)</label>
                                <input type="number" step="0.01" id="sandbox_grams" value="65.01" oninput="window.updateSettingsPreview()"
                                    style="width: 100%; padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 0.95rem; font-weight: 700; background: var(--bg-main);">
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 4px;">Volume (v)</label>
                                <input type="number" step="0.01" id="sandbox_volume" value="3.70" oninput="window.updateSettingsPreview()"
                                    style="width: 100%; padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 0.95rem; font-weight: 700; background: var(--bg-main);">
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 4px;">Price/Pound (GHS)</label>
                                <input type="number" step="1" id="sandbox_price" value="10900" oninput="window.updateSettingsPreview()"
                                    style="width: 100%; padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 0.95rem; font-weight: 700; background: var(--bg-main);">
                            </div>
                        </div>

                        <!-- Realtime Results Container -->
                        <div id="sandbox_results_card" style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 14px; padding: 18px; text-align: center;">
                            <!-- Injected by updateSettingsPreview -->
                        </div>
                    </div>

                </div>
            </div>

        </div>
    `;

    // Setup drag and drop for logo
    window.setupLogoDropzone();

    // Trigger initial previews
    window.updateCompanyPreview();
    window.updateSettingsPreview();
};

/**
 * Switch between settings tabs
 */
window.switchSettingsTab = (tab) => {
    window._activeSettingsTab = tab;
    const btnCompany = document.getElementById('tab_btn_company');
    const btnValuation = document.getElementById('tab_btn_valuation');
    const paneCompany = document.getElementById('settings_pane_company');
    const paneValuation = document.getElementById('settings_pane_valuation');

    if (tab === 'company') {
        btnCompany?.classList.add('active');
        btnValuation?.classList.remove('active');
        if (paneCompany) paneCompany.style.display = 'block';
        if (paneValuation) paneValuation.style.display = 'none';
    } else {
        btnValuation?.classList.add('active');
        btnCompany?.classList.remove('active');
        if (paneValuation) paneValuation.style.display = 'block';
        if (paneCompany) paneCompany.style.display = 'none';
        window.updateSettingsPreview();
    }
};

/**
 * Setup drag-and-drop file upload for company logo
 */
window.setupLogoDropzone = () => {
    const dropzone = document.getElementById('logo_dropzone');
    if (!dropzone) return;

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('dragover');
        }, false);
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            window.uploadLogoFile(files[0]);
        }
    }, false);
};

/**
 * Handle file input selection
 */
window.handleLogoFileInput = (input) => {
    if (input.files && input.files.length > 0) {
        window.uploadLogoFile(input.files[0]);
    }
};

/**
 * Upload logo file to backend
 */
window.uploadLogoFile = async (file) => {
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        return window.showToast('Logo file size must be less than 5MB.', 'error');
    }

    // Validate mime
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!allowed.includes(file.type)) {
        return window.showToast('Invalid image type. Please choose PNG, JPG, WEBP, or SVG.', 'error');
    }

    // Immediate local preview via FileReader
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewEl = document.getElementById('setting_logo_preview');
        const receiptLogoEl = document.getElementById('preview_receipt_logo');
        if (previewEl) previewEl.src = e.target.result;
        if (receiptLogoEl) {
            receiptLogoEl.src = e.target.result;
            receiptLogoEl.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);

    window.showToast('Uploading new company logo...', 'info');

    try {
        const formData = new FormData();
        formData.append('logo', file);

        const res = await window.api.postForm('/settings/upload_logo.php', formData);
        const newLogoUrl = res.logo_url;

        // Update hidden field & in-memory settings
        const logoHidden = document.getElementById('setting_company_logo');
        if (logoHidden) logoHidden.value = newLogoUrl;

        if (window._currentSettings) {
            window._currentSettings.company_logo = newLogoUrl;
        }

        // Apply globally across navbar and app shell
        if (window.applyCompanyProfileUI) {
            window.applyCompanyProfileUI(window._currentSettings);
        }

        window.showToast('Company logo updated successfully!', 'success');
    } catch (err) {
        console.error("Logo upload failed:", err);
        window.showToast(err.message || 'Failed to upload logo image', 'error');
    }
};

/**
 * Reset logo back to default assets/img/logo.png
 */
window.resetCompanyLogo = async () => {
    const defaultLogo = 'assets/img/logo.png';
    const previewEl = document.getElementById('setting_logo_preview');
    const receiptLogoEl = document.getElementById('preview_receipt_logo');
    const logoHidden = document.getElementById('setting_company_logo');

    if (previewEl) previewEl.src = defaultLogo;
    if (receiptLogoEl) receiptLogoEl.src = defaultLogo;
    if (logoHidden) logoHidden.value = defaultLogo;

    if (window._currentSettings) {
        window._currentSettings.company_logo = defaultLogo;
    }

    try {
        await window.api.post('/settings/update.php', {
            company_logo: defaultLogo
        });
        if (window.applyCompanyProfileUI) {
            window.applyCompanyProfileUI(window._currentSettings);
        }
        window.showToast('Company logo reset to default.', 'success');
    } catch (err) {
        window.showToast(err.message || 'Failed to reset logo', 'error');
    }
};

/**
 * Real-time update for live receipt preview
 */
window.updateCompanyPreview = () => {
    const nameInput = document.getElementById('setting_company_name');
    const taglineInput = document.getElementById('setting_company_tagline');
    const phoneInput = document.getElementById('setting_company_phone');
    const emailInput = document.getElementById('setting_company_email');
    const addressInput = document.getElementById('setting_company_address');
    const footerInput = document.getElementById('setting_company_receipt_footer');

    const previewName = document.getElementById('preview_receipt_name');
    const previewTagline = document.getElementById('preview_receipt_tagline');
    const previewAddress = document.getElementById('preview_receipt_address');
    const previewContacts = document.getElementById('preview_receipt_contacts');
    const previewFooter = document.getElementById('preview_receipt_footer');

    const name = nameInput ? nameInput.value.trim() : 'Qwik Gold';
    const tagline = taglineInput ? taglineInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const address = addressInput ? addressInput.value.trim() : '';
    const footer = footerInput ? footerInput.value.trim() : 'Thank you for doing business with Qwik Gold!';

    if (previewName) previewName.textContent = name || 'QWIK GOLD';
    if (previewTagline) previewTagline.textContent = tagline;
    if (previewAddress) previewAddress.textContent = address;
    if (previewContacts) previewContacts.textContent = [phone, email].filter(Boolean).join(' • ');
    if (previewFooter) previewFooter.textContent = footer;
};

/**
 * Save Company Profile Form
 */
window.saveCompanyProfile = async () => {
    const btn = document.getElementById('btn_save_company');
    const nameInput = document.getElementById('setting_company_name');
    const taglineInput = document.getElementById('setting_company_tagline');
    const phoneInput = document.getElementById('setting_company_phone');
    const emailInput = document.getElementById('setting_company_email');
    const addressInput = document.getElementById('setting_company_address');
    const websiteInput = document.getElementById('setting_company_website');
    const currencyInput = document.getElementById('setting_company_currency');
    const footerInput = document.getElementById('setting_company_receipt_footer');
    const logoInput = document.getElementById('setting_company_logo');

    if (!nameInput || !nameInput.value.trim()) {
        return window.showToast('Company Name is required.', 'error');
    }

    const payload = {
        company_name: nameInput.value.trim(),
        company_tagline: taglineInput ? taglineInput.value.trim() : '',
        company_phone: phoneInput ? phoneInput.value.trim() : '',
        company_email: emailInput ? emailInput.value.trim() : '',
        company_address: addressInput ? addressInput.value.trim() : '',
        company_website: websiteInput ? websiteInput.value.trim() : '',
        company_currency: currencyInput ? currencyInput.value.trim() : 'GHS',
        company_receipt_footer: footerInput ? footerInput.value.trim() : '',
        company_logo: logoInput ? logoInput.value.trim() : 'assets/img/logo.png'
    };

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Saving...';
    }

    try {
        const res = await window.api.post('/settings/update.php', payload);
        window._currentSettings = (res && res.data) ? res.data : (res || payload);

        // Apply globally to navbar and local cache
        if (window.applyCompanyProfileUI) {
            window.applyCompanyProfileUI(window._currentSettings);
        }

        window.showToast('Company profile settings saved successfully!', 'success');
    } catch (err) {
        console.error("Save company profile error:", err);
        window.showToast(err.message || 'Failed to save company profile', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">save</span> Save Company Profile';
        }
    }
};

/**
 * Save Gold Valuation & Purity Discount
 */
window.saveValuationSettings = async () => {
    const btn = document.getElementById('btn_save_valuation');
    const discountInput = document.getElementById('setting_purity_discount');

    if (!discountInput) return;

    const discountVal = parseFloat(discountInput.value);
    if (isNaN(discountVal) || discountVal < 0 || discountVal > 50) {
        return window.showToast('Please enter a valid discount percentage between 0% and 50%', 'error');
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Saving...';
    }

    try {
        const res = await window.api.post('/settings/update.php', {
            purity_discount_percent: discountVal
        });

        if (window._currentSettings) {
            window._currentSettings.purity_discount_percent = discountVal;
        }

        if (window.GoldMath) {
            window.GoldMath.setDiscountPercent(discountVal);
        }

        window.showToast(`Valuation settings saved! Refined gold discount is ${discountVal.toFixed(2)}%`, 'success');
    } catch (err) {
        console.error('Settings save error:', err);
        window.showToast(err.message || 'Failed to save valuation settings', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">save</span> Save Valuation Setting';
        }
    }
};

/**
 * Save All Settings (Top Header button)
 */
window.saveAllSettings = async () => {
    const btn = document.getElementById('btn_save_all_settings');

    const nameInput = document.getElementById('setting_company_name');
    const taglineInput = document.getElementById('setting_company_tagline');
    const phoneInput = document.getElementById('setting_company_phone');
    const emailInput = document.getElementById('setting_company_email');
    const addressInput = document.getElementById('setting_company_address');
    const websiteInput = document.getElementById('setting_company_website');
    const currencyInput = document.getElementById('setting_company_currency');
    const footerInput = document.getElementById('setting_company_receipt_footer');
    const logoInput = document.getElementById('setting_company_logo');
    const discountInput = document.getElementById('setting_purity_discount');

    if (!nameInput || !nameInput.value.trim()) {
        return window.showToast('Company Name is required.', 'error');
    }

    const discountVal = discountInput ? parseFloat(discountInput.value) : 0.70;
    if (isNaN(discountVal) || discountVal < 0 || discountVal > 50) {
        return window.showToast('Please enter a valid discount percentage between 0% and 50%', 'error');
    }

    const payload = {
        company_name: nameInput.value.trim(),
        company_tagline: taglineInput ? taglineInput.value.trim() : '',
        company_phone: phoneInput ? phoneInput.value.trim() : '',
        company_email: emailInput ? emailInput.value.trim() : '',
        company_address: addressInput ? addressInput.value.trim() : '',
        company_website: websiteInput ? websiteInput.value.trim() : '',
        company_currency: currencyInput ? currencyInput.value.trim() : 'GHS',
        company_receipt_footer: footerInput ? footerInput.value.trim() : '',
        company_logo: logoInput ? logoInput.value.trim() : 'assets/img/logo.png',
        purity_discount_percent: discountVal
    };

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Saving All...';
    }

    try {
        const res = await window.api.post('/settings/update.php', payload);
        window._currentSettings = (res && res.data) ? res.data : (res || payload);

        if (window.applyCompanyProfileUI) {
            window.applyCompanyProfileUI(window._currentSettings);
        }
        if (window.GoldMath) {
            window.GoldMath.setDiscountPercent(discountVal);
        }

        window.showToast('All system & company settings saved successfully!', 'success');
    } catch (err) {
        console.error("Save all settings error:", err);
        window.showToast(err.message || 'Failed to save settings', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">save</span> Save All Settings';
        }
    }
};

/**
 * Quick button presets for discount
 */
window.applyDiscountPreset = (val) => {
    const input = document.getElementById('setting_purity_discount');
    if (input) {
        input.value = parseFloat(val).toFixed(2);
        window.updateSettingsPreview();
    }
};

/**
 * Real-time calculation updater for settings sandbox
 */
window.updateSettingsPreview = () => {
    const discountInput = document.getElementById('setting_purity_discount');
    const gramsInput = document.getElementById('sandbox_grams');
    const volumeInput = document.getElementById('sandbox_volume');
    const priceInput = document.getElementById('sandbox_price');
    const resultsContainer = document.getElementById('sandbox_results_card');

    if (!discountInput || !resultsContainer || !window.GoldMath) return;

    const discount = Math.max(0, parseFloat(discountInput.value) || 0);
    const grams = parseFloat(gramsInput?.value) || 65.01;
    const volume = parseFloat(volumeInput?.value) || 3.70;
    const price = parseFloat(priceInput?.value) || 10900;

    // Run math using GoldMath
    const calc = window.GoldMath.calculate({
        grams,
        volume,
        pricePerPound: price,
        discountPercent: discount
    });

    // Run gross calculation (0 discount) for comparison
    const grossCalc = window.GoldMath.calculate({
        grams,
        volume,
        pricePerPound: price,
        discountPercent: 0
    });

    const diff = calc.totalPayout - grossCalc.totalPayout;

    resultsContainer.innerHTML = `
        <div style="font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
            Payable Amount to Seller
        </div>
        <div style="font-size: 2.2rem; font-weight: 800; color: var(--danger); line-height: 1.1; margin-bottom: 8px;">
            <span style="font-size: 1.4rem; color: #94a3b8;">₵</span>${calc.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </div>
        
        ${discount > 0 ? `
            <div style="font-size: 0.78rem; color: #64748b; margin-bottom: 12px;">
                Gross Payout: ₵${grossCalc.totalPayout.toLocaleString()} &bull; 
                <span style="color: #059669; font-weight: 700;">-${Math.abs(diff).toLocaleString()} GHS (-${discount}%)</span>
            </div>
        ` : `
            <div style="font-size: 0.78rem; color: #059669; font-weight: 700; margin-bottom: 12px;">
                Standard Full Value (No Discount Deducted)
            </div>
        `}

        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-size: 0.82rem;">
            <div>
                <div style="font-weight: 800; color: #334155;">${calc.pounds.toFixed(2)}</div>
                <div style="font-size: 0.68rem; color: #64748b; text-transform: uppercase;">Pounds</div>
            </div>
            <div>
                <div style="font-weight: 800; color: #334155;">${calc.density.toFixed(2)}</div>
                <div style="font-size: 0.68rem; color: #64748b; text-transform: uppercase;">Density</div>
            </div>
            <div>
                <div style="font-weight: 800; color: #64748b;">${calc.rawKarat.toFixed(2)}k</div>
                <div style="font-size: 0.68rem; color: #64748b; text-transform: uppercase;">Gross Karat</div>
            </div>
            <div style="background: rgba(45, 91, 255, 0.1); border-radius: 6px; padding: 2px;">
                <div style="font-weight: 800; color: #1d4ed8;">${calc.payableKarat.toFixed(2)}k</div>
                <div style="font-size: 0.68rem; color: #1d4ed8; text-transform: uppercase; font-weight: 700;">Payable</div>
            </div>
            <div>
                <div style="font-weight: 800; color: #059669;">${calc.purityPercent.toFixed(2)}%</div>
                <div style="font-size: 0.68rem; color: #059669; text-transform: uppercase;">Purity</div>
            </div>
        </div>
    `;
};
