document.addEventListener('DOMContentLoaded', async function() {
    let isAdmin = false;
    if (window.isAuthenticated) {
        try {
            isAdmin = await window.isAuthenticated();
        } catch (e) {
            console.error("Erro ao verificar autenticação de admin na galeria:", e);
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
                <button id="addPostBtn" style="margin-right: 10px; background-color: #0c4c7d;">+ Novo Post</button>
                <button id="logoutBtnGaleria" style="background-color: #dc3545;">Sair</button>
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
            const response = await fetch(`${window.API_BASE_URL}gallery-posts/`, {
                method: 'GET',
                headers: window.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Erro ao carregar posts da galeria: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const posts = data.results || data;

            galleryContainer.innerHTML = '';

            if (posts.length === 0) {
                galleryContainer.innerHTML = '<p style="text-align: center; color: #555; grid-column: 1 / -1;">Nenhum post da galeria disponível.</p>';
            }

            posts.forEach(post => {
                let postElement;

                if (post.post_type === 'single' && post.image_main) {
                    const imageUrlToDisplay = post.image_main;
                    postElement = document.createElement('div');
                    postElement.className = 'instagram-single';
                    postElement.setAttribute('data-id', post.id);
                    postElement.innerHTML = `
                        <a href="${post.link || '#'}" target="_blank">
                            <img src="${imageUrlToDisplay || 'placeholder.jpg'}" alt="${post.alt_text || 'Imagem da Galeria'}" loading="lazy">
                        </a>
                        ${isAdmin ? `
                            <div class="post-actions">
                                <button class="edit-post" data-id="${post.id}" data-category="gallery">✏️</button>
                                <button class="delete-post" data-id="${post.id}" data-category="gallery">🗑️</button>
                            </div>
                        ` : ''}
                    `;
                } else if (post.post_type === 'carousel') {
                    postElement = document.createElement('div');
                    postElement.className = 'instagram-carousel-wrapper';
                    postElement.setAttribute('data-id', post.id);
                    postElement.innerHTML = `
                        <div class="instagram-carousel">
                            <div class="carousel-content-wrapper">
                                ${post.images.map((img, i) => `
                                    <div class="carousel-slide ${i === 0 ? 'active' : ''}">
                                        <a href="${img.link || '#'}" target="_blank">
                                            <img src="${img.image}" alt="${img.alt_text}" loading="lazy">
                                        </a>
                                    </div>
                                `).join('')}
                            </div>
                            <button class="carousel-prev">❮</button>
                            <button class="carousel-next">❯</button>
                            <div class="carousel-indicators">
                                ${post.images.map((_, i) => `
                                    <button class="carousel-indicator ${i === 0 ? 'active' : ''}" data-slide="${i}"></button>
                                `).join('')}
                            </div>
                        </div>
                        ${isAdmin ? `
                            <div class="post-actions">
                                <button class="edit-post" data-id="${post.id}" data-category="gallery">✏️</button>
                                <button class="delete-post" data-id="${post.id}" data-category="gallery">🗑️</button>
                            </div>
                        ` : ''}
                    `;
                }

                if (postElement) {
                    galleryContainer.appendChild(postElement);
                }
            });

            initializeCarousels();

            if (isAdmin) {
                document.querySelectorAll('.delete-post').forEach(btn => {
                    btn.addEventListener('click', async function() {
                        const postId = this.getAttribute('data-id');
                        const postCategory = this.getAttribute('data-category');
                        if (confirm(`Tem certeza que deseja excluir este post de galeria permanentemente?`)) {
                            try {
                                const response = await fetch(`${window.API_BASE_URL}gallery-posts/${postId}/`, {
                                    method: 'DELETE',
                                    headers: window.getAuthHeaders(),
                                });
                                if (!response.ok) {
                                    throw new Error(`Erro ao excluir: ${response.statusText}`);
                                }
                                alert('Post excluído com sucesso do back-end!');
                                location.reload();
                            } catch (error) {
                                console.error('Erro ao excluir post da galeria:', error);
                                alert(`Falha ao excluir post: ${error.message}`);
                            }
                        }
                    });
                });
                
                document.querySelectorAll('.edit-post').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const postId = this.getAttribute('data-id');
                        const postCategory = this.getAttribute('data-category');
                        window.location.href = `admin_editor.html?edit=${postId}&category=${postCategory}`;
                    });
                });
            }

        } catch (error) {
            console.error('Erro ao carregar posts da galeria:', error);
            galleryContainer.innerHTML = '<p style="text-align: center; color: red; grid-column: 1 / -1;">Erro ao carregar galeria. Verifique o console do navegador e o servidor Django.</p>';
        }
    }

    function initializeCarousels() {
        const carousels = document.querySelectorAll('.instagram-carousel');
        carousels.forEach((carousel) => {
            const slides = carousel.querySelectorAll('.carousel-slide');
            const prevBtn = carousel.querySelector('.carousel-prev');
            const nextBtn = carousel.querySelector('.carousel-next');
            const indicators = carousel.querySelectorAll('.carousel-indicator');
            let currentSlide = 0;
            let autoplayInterval;
            const autoplayDelay = 5000;

            function showSlide(index) {
                slides.forEach((slide, i) => {
                    slide.classList.toggle('active', i === index);
                });
                indicators.forEach((indicator, i) => {
                    indicator.classList.toggle('active', i === index);
                });
                currentSlide = index;
            }
            
            function changeSlide(newIndex) {
                if (newIndex >= slides.length) newIndex = 0;
                if (newIndex < 0) newIndex = slides.length - 1;
                showSlide(newIndex);
            }
            
            function startAutoplay() {
                autoplayInterval = setInterval(() => changeSlide(currentSlide + 1), autoplayDelay);
            }
            
            function resetAutoplay() {
                clearInterval(autoplayInterval);
                startAutoplay();
            }
            
            if (prevBtn) prevBtn.addEventListener('click', () => { changeSlide(currentSlide - 1); resetAutoplay(); });
            if (nextBtn) nextBtn.addEventListener('click', () => { changeSlide(currentSlide + 1); resetAutoplay(); });
            
            indicators.forEach((indicator, index) => {
                indicator.addEventListener('click', () => {
                    changeSlide(index);
                    resetAutoplay();
                });
            });
            
            carousel.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
            carousel.addEventListener('mouseleave', startAutoplay);
            
            showSlide(0);
            startAutoplay();
        });
    }

    const allImages = Array.from(document.querySelectorAll('.photos-container img'));

    if (allImages.length > 0) {
        let currentImageIndex = 0;

        function createLightbox() {
            if (document.getElementById('clinicLightbox')) {
                return;
            }
            const lightboxHTML = `
                <div id="clinicLightbox" class="lightbox">
                    <span class="lightbox-close">&times;</span>
                    <div class="lightbox-content-wrapper">
                        <img class="lightbox-content" id="lightboxImage">
                        <p class="lightbox-caption" id="lightboxCaption"></p>
                    </div>
                    <a class="lightbox-nav-btn lightbox-prev">&#10094;</a>
                    <a class="lightbox-nav-btn lightbox-next">&#10095;</a>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', lightboxHTML);
        }

        createLightbox();

        const lightbox = document.getElementById('clinicLightbox');
        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxCaption = document.getElementById('lightboxCaption');
        const closeBtn = document.querySelector('.lightbox-close');
        const prevBtn = document.querySelector('.lightbox-prev');
        const nextBtn = document.querySelector('.lightbox-next');

        function openLightbox(index) {
            currentImageIndex = index;
            const img = allImages[currentImageIndex];
            lightboxImage.src = img.src;
            lightboxImage.alt = img.alt;
            lightboxCaption.textContent = img.alt;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }

        function nextImage() {
            currentImageIndex = (currentImageIndex + 1) % allImages.length;
            const img = allImages[currentImageIndex];
            lightboxImage.src = img.src;
            lightboxImage.alt = img.alt;
            lightboxCaption.textContent = img.alt;
        }

        function prevImage() {
            currentImageIndex = (currentImageIndex - 1 + allImages.length) % allImages.length;
            const img = allImages[currentImageIndex];
            lightboxImage.src = img.src;
            lightboxImage.alt = img.alt;
            lightboxCaption.textContent = img.alt;
        }

        allImages.forEach((img, index) => {
            img.addEventListener('click', () => openLightbox(index));
        });

        closeBtn.addEventListener('click', closeLightbox);
        prevBtn.addEventListener('click', prevImage);
        nextBtn.addEventListener('click', nextImage);

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                closeLightbox();
            } else if (e.key === 'ArrowRight' && lightbox.classList.contains('active')) {
                nextImage();
            } else if (e.key === 'ArrowLeft' && lightbox.classList.contains('active')) {
                prevImage();
            }
        });
    }
});