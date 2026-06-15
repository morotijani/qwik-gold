// assets/js/modules/users.js

(function () {
    window.addEventListener('route-changed', async (e) => {
        if (e.detail.route !== 'users') return;

        const container = e.detail.container;

        container.innerHTML = `
            <div>
                <!-- Header Banner -->
                <div style="background: linear-gradient(145deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.03) 100%); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 20px; padding: clamp(24px, 5vw, 40px); position: relative; overflow: hidden; margin-bottom: 32px; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.05);">
                    <div style="position: absolute; top: -50px; right: -50px; width: 250px; height: 250px; background: rgba(16, 185, 129, 0.1); border-radius: 50%; filter: blur(40px);"></div>
                    <div style="position: absolute; bottom: -30px; left: -30px; width: 150px; height: 150px; background: rgba(16, 185, 129, 0.1); border-radius: 50%; filter: blur(30px);"></div>
                    <div style="position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
                        <div>
                            <div style="color: #059669; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; font-size: 0.95rem; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                                <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3); margin-right: 4px;">
                                    <span class="material-symbols-outlined" style="font-size: 18px;">admin_panel_settings</span>
                                </div>
                                Access Control
                            </div>
                            <h2 style="margin: 0 0 12px 0; font-size: clamp(1.8rem, 6vw, 2.2rem); font-weight: 800; color: var(--text-main);">System Users</h2>
                            <p style="margin: 0; color: var(--text-muted); font-size: clamp(0.95rem, 3vw, 1.05rem); max-width: 500px; line-height: 1.5;">Manage administrative access, roles, and security credentials for staff members.</p>
                        </div>
                        <button class="btn btn-primary" onclick="window.openCreateUserModal()" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; font-weight: 700; padding: clamp(12px, 3vw, 14px) clamp(20px, 4vw, 28px); box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3); display: flex; align-items: center; gap: 8px; font-size: clamp(0.95rem, 3vw, 1.05rem); border-radius: 12px; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                            <span class="material-symbols-outlined">person_add</span> Create User
                        </button>
                    </div>
                </div>
                
                <div style="background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow-x: auto; border: 1px solid var(--border);">
                    <div style="padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px;">
                        <span class="material-symbols-outlined" style="color: var(--text-muted);">group</span>
                        <h3 style="font-size: 1.1rem; margin: 0; color: var(--text-main); font-weight: 700;">Active System Users</h3>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; min-width: 900px;">
                        <thead>
                            <tr style="background: var(--bg-main); color: var(--text-muted); font-size: 0.85rem; text-align: left; text-transform: uppercase;">
                                <th style="padding: 16px 24px; font-weight: 600; border-bottom: 1px solid var(--border); width: 50px;">#</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Name</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Username</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Role</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Status</th>
                                <th style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--border);">Date Added</th>
                                <th style="padding: 16px 24px; font-weight: 600; border-bottom: 1px solid var(--border); text-align: right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="users-table-body">
                            <tr><td colspan="7" style="text-align:center; padding: 48px;"><span class="material-symbols-outlined spin" style="font-size: 2rem; color: #10b981;">sync</span></td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        await loadUsersData();
    });

    async function loadUsersData() {
        try {
            const res = await window.api.get('/users/list.php');
            const tbody = document.getElementById('users-table-body');

            if (!res || res.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">No users found.</td></tr>';
                return;
            }

            let html = '';
            res.forEach((user, index) => {
                const date = new Date(user.created_at).toLocaleDateString();

                let roleBadge = '';
                if (user.role === 'admin') {
                    roleBadge = `<span style="background: rgba(16, 185, 129, 0.1); color: #059669; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; text-transform: uppercase;"><span class="material-symbols-outlined" style="font-size: 14px;">admin_panel_settings</span> Admin</span>`;
                } else if (user.role === 'salesperson') {
                    roleBadge = `<span style="background: rgba(245, 158, 11, 0.1); color: #d97706; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; text-transform: uppercase;"><span class="material-symbols-outlined" style="font-size: 14px;">point_of_sale</span> Sales</span>`;
                } else {
                    roleBadge = `<span style="background: rgba(59, 130, 246, 0.1); color: #2563eb; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; text-transform: uppercase;"><span class="material-symbols-outlined" style="font-size: 14px;">badge</span> Staff</span>`;
                }

                let statusBadge = user.status === 'active'
                    ? `<span style="color: #10b981; font-weight: 600; display: flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 16px;">check_circle</span> Active</span>`
                    : `<span style="color: #ef4444; font-weight: 600; display: flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 16px;">block</span> Suspended</span>`;

                const isCurrentUser = user.id === JSON.parse(localStorage.getItem('qwik_gold_user')).id;

                let actionBtn = isCurrentUser ? `<span style="color: var(--text-muted); font-size: 0.85rem; font-style: italic;">(You)</span>` :
                    `<button class="btn btn-outline" onclick="window.toggleUserStatus(${user.id}, '${user.status}', '${user.name.replace(/'/g, "\\'")}')" style="padding: 6px 12px; font-size: 0.85rem; border-color: ${user.status === 'active' ? 'var(--danger)' : 'var(--success)'}; color: ${user.status === 'active' ? 'var(--danger)' : 'var(--success)'}; border-radius: 8px;">
                        ${user.status === 'active' ? 'Suspend' : 'Reactivate'}
                    </button>`;

                html += `
                    <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='white'">
                        <td style="padding: 16px 24px; color: var(--text-muted); font-weight: 500;">${index + 1}</td>
                        <td style="padding: 16px; font-weight: 700; color: var(--text-main); font-size: 1.05rem;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 32px; height: 32px; border-radius: 8px; background: var(--bg-main); display: flex; align-items: center; justify-content: center; font-weight: 800; color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2);">
                                    ${user.name.charAt(0).toUpperCase()}
                                </div>
                                ${user.name}
                            </div>
                        </td>
                        <td style="padding: 16px; font-weight: 600; color: var(--text-muted);">@${user.username}</td>
                        <td style="padding: 16px;">${roleBadge}</td>
                        <td style="padding: 16px;">${statusBadge}</td>
                        <td style="padding: 16px; color: var(--text-muted); font-size: 0.95rem;">${date}</td>
                        <td style="padding: 16px 24px; text-align: right;">${actionBtn}</td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } catch (error) {
            document.getElementById('users-table-body').innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--danger); padding: 32px;">Failed to load users: ${error.message}</td></tr>`;
        }
    }

    window.openCreateUserModal = () => {
        const html = `
            <form onsubmit="window.submitCreateUser(event)">
                <div style="background: linear-gradient(145deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.02) 100%); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 16px; padding: 20px; margin-bottom: 24px; display: flex; gap: 16px; align-items: center;">
                    <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #10b981, #059669); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                        <span class="material-symbols-outlined" style="font-size: 1.6rem;">how_to_reg</span>
                    </div>
                    <div>
                        <h4 style="margin: 0 0 4px 0; font-size: 1.1rem; font-weight: 700; color: var(--text-main);">New System User</h4>
                        <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted);">Create credentials and assign a role to provide system access.</p>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px;">Full Name</label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">badge</span>
                        <input type="text" id="new_user_name" required placeholder="E.g., Kofi Agyei" style="padding-left: 44px; width: 100%;">
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px;">Username</label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">account_circle</span>
                        <input type="text" id="new_user_username" required placeholder="E.g., kofiagyei" style="padding-left: 44px; width: 100%;">
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px;">Password</label>
                    <div class="input-with-icon">
                        <span class="material-symbols-outlined">lock</span>
                        <input type="password" id="new_user_password" required placeholder="Enter secure password" style="padding-left: 44px; width: 100%;">
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 28px;">
                    <label style="display: block; font-weight: 600; color: var(--text-main); margin-bottom: 8px;">Access Role</label>
                    <select id="new_user_role" class="form-control" style="width: 100%; border-radius: 8px; border: 1px solid var(--border); padding: 12px; appearance: auto; background: var(--bg-main);">
                        <option value="staff">General Staff</option>
                        <option value="salesperson">Salesperson</option>
                        <option value="admin">Administrator</option>
                    </select>
                </div>

                <button type="submit" class="btn" style="width: 100%; background: #10b981; color: white; padding: 16px; font-size: 1.05rem; font-weight: 700; border: none; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
                    <span class="material-symbols-outlined">person_add</span> Register User
                </button>
            </form>
        `;
        window.openModal('Register New User', html);
    };

    window.submitCreateUser = async (event) => {
        event.preventDefault();
        const btn = event.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';

        const payload = {
            name: document.getElementById('new_user_name').value,
            username: document.getElementById('new_user_username').value,
            password: document.getElementById('new_user_password').value,
            role: document.getElementById('new_user_role').value
        };

        try {
            await window.api.post('/users/create.php', payload);
            window.showToast('User created successfully', 'success');
            window.closeModal();
            window.dispatchEvent(new Event('hashchange')); // Refresh list
        } catch (error) {
            console.error(error);
            window.showToast(error.message || 'Error creating user', 'error');
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">person_add</span> Register User';
        }
    };

    window.toggleUserStatus = async (userId, currentStatus, userName) => {
        const actionText = currentStatus === 'active' ? 'suspend' : 'reactivate';
        const modalHtml = `
            <div style="text-align: center; padding: 20px 0;">
                <div style="width: 64px; height: 64px; background: ${currentStatus === 'active' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; color: ${currentStatus === 'active' ? '#ef4444' : '#10b981'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
                    <span class="material-symbols-outlined" style="font-size: 32px;">${currentStatus === 'active' ? 'warning' : 'task_alt'}</span>
                </div>
                <h3 style="margin: 0 0 12px 0; font-size: 1.5rem; color: var(--text-main);">Confirm Action</h3>
                <p style="margin: 0 0 24px 0; color: var(--text-muted); font-size: 1.05rem;">
                    Are you sure you want to <strong>${actionText}</strong> the account for <strong style="color: var(--text-main);">${userName}</strong>?
                </p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button class="btn btn-outline" onclick="window.closeModal()" style="padding: 12px 24px; border-radius: 24px; flex: 1;">Cancel</button>
                    <button class="btn" id="confirm-status-btn" style="padding: 12px 24px; border-radius: 24px; flex: 1; background: ${currentStatus === 'active' ? '#ef4444' : '#10b981'}; color: white; border: none; font-weight: 700; box-shadow: 0 4px 12px ${currentStatus === 'active' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'};">
                        Yes, ${actionText}
                    </button>
                </div>
            </div>
        `;

        window.openModal('Change Access Status', modalHtml);

        document.getElementById('confirm-status-btn').onclick = async function () {
            const btn = this;
            btn.disabled = true;
            btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';

            try {
                await window.api.post('/users/toggle_status.php', { user_id: userId });
                window.showToast('User status updated successfully', 'success');
                window.closeModal();
                window.dispatchEvent(new Event('hashchange'));
            } catch (error) {
                console.error(error);
                window.showToast(error.message || 'Error updating status', 'error');
                btn.disabled = false;
                btn.innerHTML = `Yes, ${actionText}`;
            }
        };
    };
})();
