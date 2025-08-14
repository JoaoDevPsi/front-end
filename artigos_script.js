async function getArticlesFromAPI() {
    try {
        const response = await fetch(`${window.API_BASE_URL}articles/`, {
            method: 'GET',
            headers: window.getAuthHeaders() 
        });

        if (!response.ok) {
            throw new Error(`Erro ao carregar artigos: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.results || []; 

    } catch (error) {
        console.error('Erro ao buscar artigos da API:', error);
        return []; 
    }
}

async function generateArticleCards() {
    const artigosGrid = document.querySelector('.artigos-grid');
    if (!artigosGrid) return; 

    let isAdmin = false;
    if (window.isAuthenticated) {
        try {
            isAdmin = await window.isAuthenticated();
        } catch (e) {
            console.error("Erro ao verificar autenticação:", e);
            isAdmin = false;
        }
    }
    
    if (isAdmin) {
        const adminBar = document.createElement('div');
        adminBar.style.position = 'fixed';
        adminBar.style.top = '0';
        adminBar.style.left = '0';
        adminBar.style.right = '0';
        adminBar.style.backgroundColor = '#3897f0';
        adminBar.style.color = 'white';
        adminBar.style.padding = '10px';
        adminBar.style.zIndex = '1000';
        adminBar.style.display = 'flex';
        adminBar.style.justifyContent = 'space-between';
        adminBar.style.alignItems = 'center';
        
        adminBar.innerHTML = `
            <span>Modo Admin (${isAdmin ? 'Admin' : 'Usuário'})</span>
            <div>
                <button id="addArticleBtn" style="margin-right: 10px; background-color: #0c4c7d;">+ Novo Artigo</button>
                <button id="logoutBtnArtigos" style="background-color: #dc3545;">Sair</button>
            </div>
        `;
        document.body.prepend(adminBar);

        document.getElementById('logoutBtnArtigos').addEventListener('click', window.logout);
        document.getElementById('addArticleBtn').addEventListener('click', () => {
            window.location.href = 'admin_editor.html?category=article';
        });
    }

    const allArtigos = await getArticlesFromAPI();
    
    artigosGrid.innerHTML = ''; 

    if (allArtigos.length === 0) {
        artigosGrid.innerHTML = '<p style="text-align: center; font-size: 1.2em; color: #555;">Nenhum artigo disponível no momento.</p>';
        return;
    }

    allArtigos.forEach(artigo => {
        const card = document.createElement('a');
        card.href = `artigos_conteudo.html?id=${artigo.id}`; 
        card.classList.add('artigo-card');

        const imageUrl = artigo.image; 

        card.innerHTML = `
            <img src="${imageUrl}" alt="${artigo.title}" class="artigo-card-image">
            <div class="artigo-card-content">
                <h2 class="artigo-card-title">${artigo.title}</h2>
                <p class="artigo-card-excerpt">${artigo.excerpt}</p>
                <span class="artigo-card-readmore">Leia mais &rarr;</span>
            </div>
        `;
        artigosGrid.appendChild(card);
    });
}

async function loadArticleContent() {
    let isAdmin = false;
    if (window.isAuthenticated) {
        try {
            isAdmin = await window.isAuthenticated();
        } catch (e) {
            console.error("Erro ao verificar autenticação:", e);
            isAdmin = false;
        }
    }
    
    if (isAdmin) {
        const adminBar = document.createElement('div');
        adminBar.style.position = 'fixed';
        adminBar.style.top = '0';
        adminBar.style.left = '0';
        adminBar.style.right = '0';
        adminBar.style.backgroundColor = '#3897f0';
        adminBar.style.color = 'white';
        adminBar.style.padding = '10px';
        adminBar.style.zIndex = '1000';
        adminBar.style.display = 'flex';
        adminBar.style.justifyContent = 'space-between';
        adminBar.style.alignItems = 'center';
        
        adminBar.innerHTML = `
            <span>Modo Admin (${isAdmin ? 'Admin' : 'Usuário'})</span>
            <div>
                <button id="editArticleBtn" style="margin-right: 10px; background-color: #0c4c7d;">Editar Artigo</button>
                <button id="logoutBtnArticleContent" style="background-color: #dc3545;">Sair</button>
            </div>
        `;
        document.body.prepend(adminBar);

        document.getElementById('logoutBtnArticleContent').addEventListener('click', window.logout);
        document.getElementById('editArticleBtn').addEventListener('click', () => {
            const articleId = new URLSearchParams(window.location.search).get('id');
            if (articleId) {
                window.location.href = `admin_editor.html?edit=${articleId}&category=article`;
            } else {
                alert('Não foi possível identificar o artigo para edição.');
            }
        });
    }


    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('id');

    if (!articleId) {
        document.getElementById('article-main-title').textContent = 'Artigo não encontrado.';
        document.getElementById('article-text-content').innerHTML = '<p>Por favor, selecione um artigo válido na <a href="artigos.html">página de artigos</a>.</p>';
        document.getElementById('article-main-image').style.display = 'none';
        document.getElementById('article-title-tab').textContent = 'Artigo não encontrado';
        return;
    }

    try {
        const response = await fetch(`${window.API_BASE_URL}articles/${articleId}/`, {
            method: 'GET',
            headers: window.getAuthHeaders() 
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Artigo não encontrado.');
            } else {
                throw new Error(`Erro ao carregar artigo: ${response.status} ${response.statusText}`);
            }
        }

        const artigo = await response.json();

        document.getElementById('article-title-tab').textContent = `${artigo.title} - Arquê`;
        document.getElementById('article-main-title').textContent = artigo.title;
        document.getElementById('article-main-image').src = artigo.image;
        document.getElementById('article-main-image').alt = artigo.title;
        document.getElementById('article-text-content').innerHTML = artigo.content;

    } catch (error) {
        console.error('Erro ao carregar conteúdo do artigo:', error);
        document.getElementById('article-main-title').textContent = 'Artigo não encontrado.';
        document.getElementById('article-text-content').innerHTML = `<p style="color: red;">${error.message}. Por favor, retorne à <a href="artigos.html">página de artigos</a>.</p>`;
        document.getElementById('article-main-image').style.display = 'none';
        document.getElementById('article-title-tab').textContent = 'Artigo não encontrado';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('artigos.html')) {
        generateArticleCards();
    } else if (window.location.pathname.includes('artigos_conteudo.html')) {
        loadArticleContent();
    }
});