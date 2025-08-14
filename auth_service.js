window.API_BASE_URL = 'https://joaodevpsi.pythonanywhere.com/api/';
window.TOKEN_KEY = 'accessToken';
window.REFRESH_TOKEN_KEY = 'refreshToken';
window.AUTH_STORAGE_TYPE_KEY = 'authStorageType';

function decodeToken(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

function isTokenExpired(token) {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
        return true;
    }
    const expirationDate = new Date(decoded.exp * 1000);
    return expirationDate < Date.now();
}

window.getStorage = function() {
    const storageType = localStorage.getItem(window.AUTH_STORAGE_TYPE_KEY);
    return storageType === 'localStorage' ? localStorage : sessionStorage;
};

window.login = async function(username, password, rememberMe = false) {
    try {
        const response = await fetch(`${window.API_BASE_URL}token/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Falha na autenticação');
        }

        const data = await response.json();
        
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem(window.TOKEN_KEY, data.access);
        storage.setItem(window.REFRESH_TOKEN_KEY, data.refresh);
        
        localStorage.setItem(window.AUTH_STORAGE_TYPE_KEY, rememberMe ? 'localStorage' : 'sessionStorage');

        return true;
    } catch (error) {
        console.error('Erro de login:', error);
        throw error;
    }
};

window.refreshAccessToken = async function() {
    const storage = window.getStorage();
    const refreshToken = storage.getItem(window.REFRESH_TOKEN_KEY);
    
    if (!refreshToken) {
        window.logout(); 
        return false;
    }

    try {
        const response = await fetch(`${window.API_BASE_URL}token/refresh/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        if (!response.ok) {
            console.warn('Falha ao renovar token. Refresh token inválido ou expirado.');
            window.logout(); 
            return false;
        }

        const data = await response.json();
        storage.setItem(window.TOKEN_KEY, data.access); 
        return true;
    } catch (error) {
        console.error('Erro ao renovar token:', error);
        window.logout();
        return false;
    }
};

window.isAuthenticated = async function() {
    const storage = window.getStorage();
    const accessToken = storage.getItem(window.TOKEN_KEY);
    
    if (!accessToken) {
        return false;
    }

    if (isTokenExpired(accessToken)) {
        console.log("Token expirado localmente, tentando renovar.");
        const refreshed = await window.refreshAccessToken();
        return refreshed;
    }
    
    return true;
};

window.getAccessToken = function() {
    const storage = window.getStorage();
    const accessToken = storage.getItem(window.TOKEN_KEY);
    
    if (!accessToken || isTokenExpired(accessToken)) {
        return null;
    }

    return accessToken;
};

window.logout = function() {
    const storage = window.getStorage();
    storage.removeItem(window.TOKEN_KEY);
    storage.removeItem(window.REFRESH_TOKEN_KEY);
    localStorage.removeItem(window.AUTH_STORAGE_TYPE_KEY);
    window.location.href = 'login.html';
};

window.getAuthHeaders = function(isFormData = false) {
    const token = window.getAccessToken();
    const headers = {};

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Apenas adiciona o Content-Type se não for FormData.
    // O navegador se encarrega de definir o cabeçalho Content-Type para FormData.
    if (!isFormData) {
        headers['Content-Type'] = 'application/json'; 
    }

    return headers; 
};