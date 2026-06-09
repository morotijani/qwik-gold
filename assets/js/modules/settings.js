// assets/js/modules/settings.js

window.addEventListener('route-changed', (e) => {
    if (e.detail.route === 'settings') {
        const container = e.detail.container;

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; animation: fadeIn 0.3s ease;">
                <h2 style="font-size: 1.8rem; font-weight: 700; color: var(--text-main); margin: 0;">System Settings</h2>
            </div>
            
            <div class="glass-panel" style="text-align: center; padding: 64px 24px; animation: slideUp 0.4s ease;">
                <div style="display: inline-flex; background: rgba(255, 215, 0, 0.1); color: var(--gold-primary); padding: 24px; border-radius: 50%; margin-bottom: 24px;">
                    <span class="material-symbols-outlined" style="font-size: 48px;">construction</span>
                </div>
                <h3 style="font-size: 1.5rem; color: var(--text-main); margin: 0 0 12px 0;">Settings Module in Development</h3>
                <p style="color: var(--text-muted); font-size: 1.1rem; max-width: 500px; margin: 0 auto;">
                    We're currently building out the settings module where you'll be able to configure system preferences, notifications, and gold rates.
                </p>
            </div>
        `;
    }
});
