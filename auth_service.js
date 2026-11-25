// Em desenvolvimento local (localhost) usa o backend local; no site publicado, o PythonAnywhere.
(function() {
    const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    window.BASE_URL = isLocal ? 'http://127.0.0.1:8000/' : 'https://joaodevpsi.pythonanywhere.com/';
    window.API_BASE_URL = `${window.BASE_URL}api/`;
})();
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

// Remove os tokens sem redirecionar (usado nas páginas públicas).
window.clearAuth = function() {
    const storage = window.getStorage();
    storage.removeItem(window.TOKEN_KEY);
    storage.removeItem(window.REFRESH_TOKEN_KEY);
    localStorage.removeItem(window.AUTH_STORAGE_TYPE_KEY);
};

window.refreshAccessToken = async function() {
    const storage = window.getStorage();
    const refreshToken = storage.getItem(window.REFRESH_TOKEN_KEY);

    if (!refreshToken) {
        window.clearAuth();
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
            window.clearAuth();
            return false;
        }

        const data = await response.json();
        storage.setItem(window.TOKEN_KEY, data.access);
        return true;
    } catch (error) {
        console.error('Erro ao renovar token:', error);
        return false;
    }
};

// Garante login nas páginas administrativas; redireciona para login.html se não houver.
window.requireAuth = async function() {
    const ok = await window.isAuthenticated();
    if (!ok) {
        window.location.href = 'login.html';
    }
    return ok;
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
    window.clearAuth();
    window.location.href = 'login.html';
};

window.getAuthHeaders = function(isFormData = false) {
    const token = window.getAccessToken();
    const headers = {};

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (!isFormData) {
        headers['Content-Type'] = 'application/json'; 
    }

    return headers; 
};

// Busca todas as páginas de um endpoint paginado do Django REST Framework.
window.fetchAllPages = async function(endpoint) {
    const results = [];
    for (let page = 1; page <= 100; page++) {
        const sep = endpoint.includes('?') ? '&' : '?';
        const response = await fetch(`${endpoint}${sep}page=${page}`, { headers: window.getAuthHeaders() });
        if (!response.ok) {
            throw new Error(`Erro ${response.status} ao buscar ${endpoint}`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
            return data;
        }
        results.push(...(data.results || []));
        if (!data.next) break;
    }
    return results;
};

// Escapa texto antes de inseri-lo em HTML.
window.escapeHtml = function(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

window.getMediaUrl = function(relativePath) {
    if (!relativePath || relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
        return relativePath;
    }
    return `${window.BASE_URL}media/${relativePath}`;
};