// assets/js/modules/profile.js

window.addEventListener('route-changed', async (e) => {
    if (e.detail.route !== 'profile') return;

    const container = e.detail.container;
    
    // Initial loading state
    container.innerHTML = '<div style="text-align:center; padding: 50px;"><span class="material-symbols-outlined spin gold-text" style="font-size: 2rem;">sync</span></div>';

    try {
        const response = await window.api.get('/auth/me.php');
        const user = response.user;

        container.innerHTML = `
            <div class="module-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <div>
                    <h2 style="margin: 0 0 8px 0; font-size: 1.5rem; color: var(--text-main); font-weight: 700;">My Profile</h2>
                    <p style="margin: 0; color: var(--text-muted);">Manage your personal information and security settings.</p>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 24px;">
                <!-- Profile Details Form -->
                <div style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; padding: 24px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                        <span class="material-symbols-outlined" style="font-size: 28px; color: var(--gold-primary);">account_circle</span>
                        <h3 style="margin: 0; font-size: 1.2rem; color: var(--text-main); font-weight: 600;">Personal Information</h3>
                    </div>
                    <form id="update-profile-form" style="display: flex; flex-direction: column; gap: 20px;">
                        <div class="form-group">
                            <label for="profile-name">Full Name</label>
                            <input type="text" id="profile-name" value="${user.name}" required style="padding: 12px; font-size: 1rem;">
                        </div>
                        <div class="form-group">
                            <label for="profile-username">Username</label>
                            <input type="text" id="profile-username" value="${user.username}" required style="padding: 12px; font-size: 1rem;">
                        </div>
                        <div class="form-group">
                            <label>Role</label>
                            <input type="text" value="${user.role}" disabled style="padding: 12px; font-size: 1rem; background: var(--bg-main); text-transform: capitalize;">
                        </div>
                        <button type="submit" class="btn btn-primary" style="align-self: flex-start; padding: 12px 24px; font-size: 1rem;">
                            <span class="material-symbols-outlined">save</span> Update Profile
                        </button>
                    </form>
                </div>

                <!-- Security Form -->
                <div style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; padding: 24px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                        <span class="material-symbols-outlined" style="font-size: 28px; color: var(--danger);">lock</span>
                        <h3 style="margin: 0; font-size: 1.2rem; color: var(--text-main); font-weight: 600;">Security</h3>
                    </div>
                    <form id="change-password-form" style="display: flex; flex-direction: column; gap: 20px;">
                        <div class="form-group">
                            <label for="current-password">Current Password</label>
                            <input type="password" id="current-password" required style="padding: 12px; font-size: 1rem;">
                        </div>
                        <div class="form-group">
                            <label for="new-password">New Password</label>
                            <input type="password" id="new-password" required minlength="6" style="padding: 12px; font-size: 1rem;">
                        </div>
                        <div class="form-group">
                            <label for="confirm-password">Confirm New Password</label>
                            <input type="password" id="confirm-password" required minlength="6" style="padding: 12px; font-size: 1rem;">
                        </div>
                        <button type="submit" class="btn" style="background: var(--danger); color: white; align-self: flex-start; padding: 12px 24px; font-size: 1rem;">
                            <span class="material-symbols-outlined">key</span> Change Password
                        </button>
                    </form>
                </div>
            </div>
        `;

        // Profile Update Handler
        document.getElementById('update-profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Updating...';

            try {
                const payload = {
                    name: document.getElementById('profile-name').value,
                    username: document.getElementById('profile-username').value
                };

                const res = await window.api.post('/auth/update_profile.php', payload);
                window.showToast(res.message || 'Profile updated successfully', 'success');

                // Update local storage and UI
                localStorage.setItem('qwik_gold_user', JSON.stringify(res.user));
                const userNameEl = document.getElementById('current-user-name');
                if (userNameEl) {
                    userNameEl.textContent = res.user.name;
                }

            } catch (error) {
                window.showToast(error.message || 'Failed to update profile', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<span class="material-symbols-outlined">save</span> Update Profile';
            }
        });

        // Password Change Handler
        document.getElementById('change-password-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword !== confirmPassword) {
                window.showToast('New passwords do not match', 'error');
                return;
            }

            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Changing...';

            try {
                const payload = {
                    current_password: document.getElementById('current-password').value,
                    new_password: newPassword
                };

                const res = await window.api.post('/auth/change_password.php', payload);
                window.showToast(res.message || 'Password changed successfully', 'success');
                e.target.reset(); // clear the form
            } catch (error) {
                window.showToast(error.message || 'Failed to change password', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<span class="material-symbols-outlined">key</span> Change Password';
            }
        });

    } catch (error) {
        container.innerHTML = `
            <div style="text-align:center; padding: 50px; color: var(--danger);">
                <span class="material-symbols-outlined" style="font-size: 3rem; margin-bottom: 16px;">error</span>
                <h3>Failed to load profile</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
});
