// src/services/auth.ts
const TOKEN_KEY = 'jwt_token';
const LOGIN_KEY = 'jwt_login'; // Отдельные ключи для простоты (или JSON — как в старом)

export const auth = {
    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    },

    setToken(token: string): void {
        localStorage.setItem(TOKEN_KEY, token);
    },

    getLogin(): string | null {
        return localStorage.getItem(LOGIN_KEY);
    },

    setLogin(login: string): void {
        localStorage.setItem(LOGIN_KEY, login);
    },

    clear(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(LOGIN_KEY);
    },

    async login(loginInput: string): Promise<{ login: string; token: string } | null> {
        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login: loginInput }),
            });

            console.log('Fetch response:', {
                url: response.url,
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`Login failed: ${response.status} ${response.statusText}. Body:`, errorBody);
                return null;
            }

            const data = await response.json();
            auth.setToken(data.token);
            auth.setLogin(data.login);
            console.log('Auth successful:', data.login);
            return data;
        } catch (error) {
            console.error('Login fetch error:', error);
            return null;
        }
    },

    logout(): void {
        auth.clear();
        console.log('Logged out');
    },
};