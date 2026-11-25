document.addEventListener('DOMContentLoaded', async function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav-list');

    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            navList.classList.toggle('active');
        });
    }

    const esc = window.escapeHtml;

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
        adminBar.style.cssText = 'position:fixed; top:0; left:0; right:0; background:#3897f0; color:white; padding:10px; z-index:1000; display:flex; flex-wrap:wrap; gap:8px; justify-content:space-between; align-items:center;';
        adminBar.innerHTML = `
            <span>Modo Admin</span>
            <div style="display:flex; flex-wrap:wrap; gap:8px;">
                <button id="addEventBtn" style="background-color:#0c4c7d; color:white; border:none; padding:5px 10px; cursor:pointer;">+ Novo Evento</button>
                <button id="addPostBtn" style="background-color:#0c4c7d; color:white; border:none; padding:5px 10px; cursor:pointer;">+ Post / Vídeo</button>
                <button id="logoutBtnGaleria" style="background-color:#dc3545; color:white; border:none; padding:5px 10px; cursor:pointer;">Sair</button>
            </div>
        `;
        document.body.prepend(adminBar);
        document.getElementById('logoutBtnGaleria').addEventListener('click', window.logout);
        document.getElementById('addEventBtn').addEventListener('click', () => {
            window.location.href = 'admin_editor.html?category=event';
        });
        document.getElementById('addPostBtn').addEventListener('click', () => {
            window.location.href = 'admin_editor.html?category=single';
        });
    }

    await Promise.all([carregarEventos(), carregarPosts()]);

    // ------------------------------------------------------------------
    // Pastas de eventos (fotos fixas do HTML + enviadas pelo painel admin)
    // ------------------------------------------------------------------
    async function carregarEventos() {
        const container = document.getElementById('eventFolders');
        if (!container || !window.Pastas) return;

        const fixas = window.Pastas.lerTemplate(document.getElementById('eventosFixos'));

        let daApi = [];
        try {
            const res = await fetch(`${window.API_BASE_URL}event-folders/`);
            if (res.ok) daApi = await res.json();
        } catch (e) {
            console.error('Erro ao buscar pastas de eventos:', e);
        }

        const pastas = daApi.map(p => {
            const fixa = fixas.find(f => f.slug === p.slug);
            return {
                slug: p.slug,
                titulo: p.name,
                itens: [
                    ...(p.media || []).map(m => ({
                        id: m.id,
                        tipo: m.media_type,
                        src: m.url,
                        legenda: m.caption || '',
                        alt: m.caption || p.name,
                        removivel: true
                    })),
                    ...(fixa ? fixa.itens : [])
                ]
            };
        });
        // Pastas fixas que (ainda) não existem no sistema continuam aparecendo
        fixas.forEach(f => {
            if (!pastas.some(p => p.slug === f.slug)) pastas.push(f);
        });

        window.Pastas.render(container, pastas, {
            textoVazio: 'Em breve, fotos dos nossos eventos.',
            mostrarVazias: isAdmin,
            linkAdmin: isAdmin ? (p => `admin_editor.html?category=event&folder=${encodeURIComponent(p.slug)}`) : null,
            aoExcluir: isAdmin ? excluirMidiaEvento : null
        });
        window.Pastas.abrirPeloEndereco();
    }

    async function excluirMidiaEvento(item) {
        const res = await fetch(`${window.API_BASE_URL}event-media/${item.id}/`, {
            method: 'DELETE',
            headers: window.getAuthHeaders()
        });
        if (res.status === 401) {
            alert('Sua sessão expirou. Faça login novamente.');
            window.logout();
            throw new Error('Sessão expirada.');
        }
        if (!res.ok && res.status !== 404) {
            throw new Error(`Erro ao excluir (${res.status}).`);
        }
    }

    // ------------------------------------------------------------------
    // Posts (imagem única / carrossel) e vídeos avulsos
    // ------------------------------------------------------------------
    async function carregarPosts() {
        const galleryContainer = document.getElementById('galleryContainer');
        const postsSection = document.getElementById('postsSection');
        if (!galleryContainer) return;

        try {
            const [posts, videos] = await Promise.all([
                window.fetchAllPages(`${window.API_BASE_URL}gallery-posts/`).catch(err => {
                    console.error('Erro ao buscar posts da galeria:', err);
                    return [];
                }),
                fetch(`${window.API_BASE_URL}upload-video/`)
                    .then(res => res.ok ? res.json() : [])
                    .then(data => Array.isArray(data) ? data : (data.results || []))
                    .catch(err => {
                        console.error('Erro ao buscar vídeos:', err);
                        return [];
                    })
            ]);

            galleryContainer.innerHTML = '';
            if (postsSection) postsSection.hidden = posts.length === 0 && videos.length === 0;

            const adminActions = (id, category) => isAdmin ? `
                <div class="post-actions">
                    ${category === 'gallery' ? `<button class="edit-post" data-id="${esc(id)}">✏️</button>` : ''}
                    <button class="delete-post" data-id="${esc(id)}" data-category="${category}">🗑️</button>
                </div>
            ` : '';

            const linkAttrs = (link) => link ? `href="${esc(link)}" target="_blank" rel="noopener"` : '';

            videos.forEach(video => {
                const videoElement = document.createElement('div');
                videoElement.className = 'instagram-single video-wrapper';
                videoElement.innerHTML = `
                    <video controls playsinline preload="metadata" class="gallery-video-item" style="width:100%; height:100%; object-fit:cover; background:#000;">
                        <source src="${esc(video.video_file)}">
                        Seu navegador não suporta vídeos.
                    </video>
                    <div class="video-title-tag">${esc(video.titulo)}</div>
                    ${adminActions(video.id, 'video')}
                `;
                galleryContainer.appendChild(videoElement);
            });

            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.setAttribute('data-id', post.id);

                if (post.post_type === 'single' && post.image_main_url) {
                    postElement.className = 'instagram-single';
                    postElement.innerHTML = `
                        <a ${linkAttrs(post.link)}>
                            <img src="${esc(post.image_main_url)}" alt="${esc(post.alt_text || 'Imagem')}" loading="lazy">
                        </a>
                        ${adminActions(post.id, 'gallery')}
                    `;
                } else if (post.post_type === 'carousel' && post.images && post.images.length > 0) {
                    postElement.className = 'instagram-carousel-wrapper';
                    postElement.innerHTML = `
                        <div class="instagram-carousel">
                            <div class="carousel-content-wrapper">
                                ${post.images.map((img, i) => `
                                    <div class="carousel-slide ${i === 0 ? 'active' : ''}">
                                        <a ${linkAttrs(img.link)}>
                                            <img src="${esc(img.image_url)}" alt="${esc(img.alt_text || 'Imagem')}" loading="lazy">
                                        </a>
                                    </div>
                                `).join('')}
                            </div>
                            ${post.images.length > 1 ? `
                                <button class="carousel-prev" aria-label="Imagem anterior">❮</button>
                                <button class="carousel-next" aria-label="Próxima imagem">❯</button>
                            ` : ''}
                        </div>
                        ${adminActions(post.id, 'gallery')}
                    `;
                } else {
                    return; // post sem imagem: não exibe
                }

                galleryContainer.appendChild(postElement);
            });

            initializeCarousels();

            if (isAdmin) {
                document.querySelectorAll('.delete-post').forEach(btn => {
                    btn.addEventListener('click', async function() {
                        const id = this.dataset.id;
                        const isVideo = this.dataset.category === 'video';
                        if (!confirm(`Excluir este ${isVideo ? 'vídeo' : 'post'} permanentemente?`)) return;

                        const url = isVideo
                            ? `${window.API_BASE_URL}upload-video/${id}/`
                            : `${window.API_BASE_URL}gallery-posts/${id}/`;
                        try {
                            const res = await fetch(url, { method: 'DELETE', headers: window.getAuthHeaders() });
                            if (res.ok || res.status === 404) {
                                location.reload();
                            } else if (res.status === 401) {
                                alert('Sua sessão expirou. Faça login novamente.');
                                window.logout();
                            } else {
                                alert(`Erro ao excluir (${res.status}).`);
                            }
                        } catch (e) {
                            alert('Falha de conexão ao excluir.');
                        }
                    });
                });

                document.querySelectorAll('.edit-post').forEach(btn => {
                    btn.addEventListener('click', function() {
                        window.location.href = `admin_editor.html?edit=${encodeURIComponent(this.dataset.id)}&category=gallery`;
                    });
                });
            }
        } catch (error) {
            console.error('Erro na galeria:', error);
            if (postsSection) postsSection.hidden = true;
        }
    }

    function initializeCarousels() {
        document.querySelectorAll('.instagram-carousel').forEach(carousel => {
            const slides = carousel.querySelectorAll('.carousel-slide');
            const next = carousel.querySelector('.carousel-next');
            const prev = carousel.querySelector('.carousel-prev');
            let current = 0;

            const showSlide = (n) => {
                slides[current].classList.remove('active');
                current = (n + slides.length) % slides.length;
                slides[current].classList.add('active');
            };

            if (next) next.addEventListener('click', () => showSlide(current + 1));
            if (prev) prev.addEventListener('click', () => showSlide(current - 1));
        });
    }
});
