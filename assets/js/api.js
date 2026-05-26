// assets/js/api.js

/**
 * Core API Wrapper for Qwik Gold
 * Handles all fetch requests, automatically injects the Bearer token,
 * and standardizes error handling across the application.
 */
class ApiClient {
    constructor() {
        this.baseUrl = '/qwik-gold/api';
        this.token = localStorage.getItem('qwik_gold_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('qwik_gold_token', token);
        } else {
            localStorage.removeItem('qwik_gold_token');
        }
    }

    clearSession() {
        this.setToken(null);
        localStorage.removeItem('qwik_gold_user');
        window.dispatchEvent(new Event('auth-logout'));
    }

    async request(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const options = {
            method,
            headers
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, options);
            
            // Handle 401 Unauthorized globally
            if (response.status === 401) {
                this.clearSession();
                throw new Error("Session expired or unauthorized. Please log in.");
            }

            const data = await response.json();

            if (!response.ok || data.status === 'error') {
                throw new Error(data.message || 'API Error occurred');
            }

            return data.data;

        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]:`, error);
            throw error;
        }
    }

    // Convenience methods
    get(endpoint) { return this.request(endpoint, 'GET'); }
    post(endpoint, body) { return this.request(endpoint, 'POST', body); }
}

// Instantiate globally
window.api = new ApiClient();
