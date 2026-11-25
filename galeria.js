document.addEventListener('DOMContentLoaded', async function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav-list');

    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            navList.classList.toggle('active');
        });
    }

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
            <span>Modo Admin</span>
            <div>
                <button id="addPostBtn" style="margin-right: 10px; background-color: #0c4c7d; color: white; border: none; padding: 5px 10px; cursor: pointer;">+ Novo Post / Vídeo</button>
                <button id="logoutBtnGaleria" style="background-color: #dc3545; color: white; border: none; padding: 5px 10px; cursor: pointer;">Sair</button>
            </div>
        `;

        document.body.prepend(adminBar);
        document.getElementById('logoutBtnGaleria').addEventListener('click', window.logout);
        document.getElementById('addPostBtn').addEventListener('click', () => {
            window.location.href = 'admin_editor.html';
        });
    }

    const galleryContainer = document.getElementById('galleryContainer');
    if (galleryContainer) {
        try {
            const esc = window.escapeHtml;
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

            if (posts.length === 0 && videos.length === 0) {
                galleryContainer.innerHTML = '<p style="text-align: center; color: #555; grid-column: 1 / -1;">Nenhuma mídia disponível.</p>';
            }

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
                                <button class="carousel-prev">❮</button>
                                <button class="carousel-next">❯</button>
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
            galleryContainer.innerHTML = '<p style="color:red; text-align:center; grid-column:1/-1;">Erro ao carregar mídias.</p>';
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

    const allImages = Array.from(document.querySelectorAll('.photos-container img'));
    if (allImages.length > 0) {
        let currentImgIdx = 0;
        const lightboxHTML = `
            <div id="clinicLightbox" class="lightbox">
                <span class="lightbox-close">&times;</span>
                <div class="lightbox-content-wrapper">
                    <img class="lightbox-content" id="lightboxImage">
                    <p class="lightbox-caption" id="lightboxCaption"></p>
                </div>
                <a class="lightbox-nav-btn lightbox-prev">&#10094;</a>
                <a class="lightbox-nav-btn lightbox-next">&#10095;</a>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', lightboxHTML);

        const lb = document.getElementById('clinicLightbox');
        const lbImg = document.getElementById('lightboxImage');
        const lbCap = document.getElementById('lightboxCaption');

        const updateLb = (idx) => {
            currentImgIdx = idx;
            lbImg.src = allImages[idx].src;
            lbCap.textContent = allImages[idx].alt;
        };

        allImages.forEach((img, i) => {
            img.addEventListener('click', () => {
                updateLb(i);
                lb.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });

        document.querySelector('.lightbox-close').onclick = () => {
            lb.classList.remove('active');
            document.body.style.overflow = '';
        };

        document.querySelector('.lightbox-next').onclick = () => updateLb((currentImgIdx + 1) % allImages.length);
        document.querySelector('.lightbox-prev').onclick = () => updateLb((currentImgIdx - 1 + allImages.length) % allImages.length);
    }
});