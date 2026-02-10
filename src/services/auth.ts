const TOKEN_KEY = 'jwt_token';
const LOGIN_KEY = 'jwt_login';
const FULLNAME_KEY = 'user_fullname'; // Новый ключ

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
    // Добавьте эти методы
    getFullname(): string | null {
        return localStorage.getItem(FULLNAME_KEY);
    },
    setFullname(name: string): void {
        localStorage.setItem(FULLNAME_KEY, name);
    },
    clear(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(LOGIN_KEY);
        localStorage.removeItem(FULLNAME_KEY); // Очищаем и имя тоже
    },
    logout(): void {
        auth.clear();
        console.log('Logged out');
    },
};