document.addEventListener('DOMContentLoaded', async function() {
    const API_BASE_URL = window.API_BASE_URL;
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB (mesmo limite do backend)

    const loggedIn = await window.requireAuth();
    if (!loggedIn) return;

    const postForm = document.getElementById('postForm');
    const postIdInput = document.getElementById('postId');
    const postCategory = document.getElementById('postCategory');
    const gallerySections = document.getElementById('gallerySections');
    const articleSection = document.getElementById('articleSection');
    const videoSection = document.getElementById('videoSection');

    const postType = document.getElementById('postType');
    const singleImageSection = document.getElementById('singleImageSection');
    const carouselSection = document.getElementById('carouselSection');
    const carouselImages = document.getElementById('carouselImages');
    const addImageBtn = document.getElementById('addImageBtn');

    const singleImageUploadInput = document.getElementById('singleImageUpload');
    const singleImagePreview = document.getElementById('singleImagePreview');
    const imageAltInput = document.getElementById('imageAlt');
    const imageLinkInput = document.getElementById('imageLink');
    const newImageUploadInput = document.getElementById('newImageUpload');
    const newImageAltInput = document.getElementById('newImageAlt');
    const newImageLinkInput = document.getElementById('newImageLink');

    const articleTitleInput = document.getElementById('articleTitle');
    const articleExcerptInput = document.getElementById('articleExcerpt');
    const articleContentInput = document.getElementById('articleContent');
    const articleImageUploadInput = document.getElementById('articleImageUpload');
    const articleImagePreview = document.getElementById('articleImagePreview');

    const videoTitleInput = document.getElementById('videoTitle');
    const videoFileUploadInput = document.getElementById('videoFileUpload');
    const videoStatus = document.getElementById('videoStatus');
    const btnSalvarVideo = document.getElementById('btnSalvarVideo');
    const progressBar = document.getElementById('uploadProgressBar');
    const progressContainer = document.getElementById('uploadProgressContainer');

    const submitBtn = document.getElementById('submitBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    // Cada item: { id (imagem já salva) | file (nova), previewUrl, alt_text, link }
    let carouselItems = [];

    const urlParams = new URLSearchParams(window.location.search);
    const editPostId = urlParams.get('edit');
    const categoryParam = urlParams.get('category');

    postCategory.addEventListener('change', togglePostCategory);
    postType.addEventListener('change', togglePostType);
    addImageBtn.addEventListener('click', addCarouselImage);
    postForm.addEventListener('submit', savePost);
    deleteBtn.addEventListener('click', deleteCurrentPost);
    cancelBtn.addEventListener('click', () => window.location.href = 'admin.html');
    btnSalvarVideo.addEventListener('click', fazerUploadVideo);

    singleImageUploadInput.addEventListener('change', () => showFilePreview(singleImageUploadInput, singleImagePreview));
    articleImageUploadInput.addEventListener('change', () => showFilePreview(articleImageUploadInput, articleImagePreview));

    if (['gallery', 'article', 'video'].includes(categoryParam)) {
        postCategory.value = categoryParam;
    }

    if (editPostId && (categoryParam === 'gallery' || categoryParam === 'article')) {
        postCategory.disabled = true; // não é possível trocar a categoria de um post existente
        deleteBtn.style.display = 'inline-block';
        togglePostCategory();
        loadPostForEditing(editPostId, categoryParam);
    } else {
        deleteBtn.style.display = 'none';
        togglePostCategory();
    }

    // ---------------- auxiliares ----------------

    function showFilePreview(input, imgEl) {
        const file = input.files[0];
        if (file) {
            imgEl.src = URL.createObjectURL(file);
            imgEl.style.display = 'block';
        }
    }

    function setPreview(imgEl, url) {
        if (url) {
            imgEl.src = url;
            imgEl.style.display = 'block';
        } else {
            imgEl.removeAttribute('src');
            imgEl.style.display = 'none';
        }
    }

    async function ensureSession() {
        const ok = await window.isAuthenticated();
        if (!ok) {
            alert('Sua sessão expirou. Faça login novamente.');
            window.logout();
        }
        return ok;
    }

    async function readError(res) {
        try {
            const data = await res.json();
            if (data.message) return data.message;
            if (data.detail) return data.detail;
            return Object.entries(data)
                .map(([campo, msg]) => `${campo}: ${Array.isArray(msg) ? msg.join(' ') : msg}`)
                .join('\n');
        } catch (e) {
            return `${res.status} ${res.statusText}`;
        }
    }

    function togglePostCategory() {
        const category = postCategory.value;
        gallerySections.style.display = category === 'gallery' ? 'block' : 'none';
        articleSection.style.display = category === 'article' ? 'block' : 'none';
        videoSection.style.display = category === 'video' ? 'block' : 'none';
        // O vídeo tem botão próprio, com barra de progresso.
        submitBtn.style.display = category === 'video' ? 'none' : 'inline-block';

        [articleTitleInput, articleExcerptInput, articleContentInput].forEach(el => {
            el.required = category === 'article';
        });

        if (category === 'gallery') togglePostType();
    }

    function togglePostType() {
        const type = postType.value;
        singleImageSection.style.display = type === 'single' ? 'block' : 'none';
        carouselSection.style.display = type === 'carousel' ? 'block' : 'none';
    }

    // ---------------- carrossel ----------------

    function addCarouselImage() {
        const file = newImageUploadInput.files[0];
        if (!file) {
            alert('Selecione uma imagem para adicionar ao carrossel.');
            return;
        }

        carouselItems.push({
            file: file,
            previewUrl: URL.createObjectURL(file),
            alt_text: newImageAltInput.value.trim() || 'Imagem do carrossel',
            link: newImageLinkInput.value.trim()
        });

        renderCarouselImages();
        newImageAltInput.value = '';
        newImageLinkInput.value = '';
        newImageUploadInput.value = '';
    }

    function renderCarouselImages() {
        carouselImages.innerHTML = '';
        carouselItems.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'image-preview';

            const img = document.createElement('img');
            img.src = item.previewUrl;
            img.alt = item.alt_text;
            img.style.maxWidth = '100px';
            img.style.borderRadius = '4px';

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-image';
            removeBtn.textContent = '×';
            removeBtn.style.cssText = 'background:red; color:white; border-radius:50%; border:none; cursor:pointer;';
            removeBtn.addEventListener('click', () => {
                const [removed] = carouselItems.splice(index, 1);
                if (removed.file) URL.revokeObjectURL(removed.previewUrl);
                renderCarouselImages();
            });

            div.appendChild(img);
            div.appendChild(removeBtn);
            carouselImages.appendChild(div);
        });
    }

    // ---------------- carregar para edição ----------------

    async function loadPostForEditing(postId, category) {
        const endpoint = `${API_BASE_URL}${category === 'gallery' ? 'gallery-posts' : 'articles'}/${postId}/`;

        try {
            const response = await fetch(endpoint, { headers: window.getAuthHeaders() });
            if (!response.ok) {
                throw new Error(response.status === 404 ? 'Post não encontrado.' : await readError(response));
            }
            const post = await response.json();
            postIdInput.value = post.id;

            if (category === 'gallery') {
                postType.value = post.post_type;
                if (post.post_type === 'single') {
                    setPreview(singleImagePreview, post.image_main_url);
                    imageAltInput.value = post.alt_text || '';
                    imageLinkInput.value = post.link || '';
                } else {
                    carouselItems = (post.images || []).map(img => ({
                        id: img.id,
                        previewUrl: img.image_url,
                        alt_text: img.alt_text || '',
                        link: img.link || ''
                    }));
                    renderCarouselImages();
                }
                togglePostType();
            } else {
                articleTitleInput.value = post.title;
                articleExcerptInput.value = post.excerpt;
                articleContentInput.value = post.content;
                setPreview(articleImagePreview, post.image_url);
            }
        } catch (error) {
            console.error('Erro ao carregar post:', error);
            alert(`Erro ao carregar o post: ${error.message}`);
        }
    }

    // ---------------- vídeo ----------------

    async function fazerUploadVideo() {
        const file = videoFileUploadInput.files[0];
        const titulo = videoTitleInput.value.trim();

        if (!titulo || !file) {
            alert('Título e arquivo de vídeo são obrigatórios.');
            return;
        }
        if (file.size > MAX_VIDEO_SIZE) {
            alert('O vídeo ultrapassa o limite de 100 MB. Comprima o arquivo antes de enviar.');
            return;
        }
        if (!(await ensureSession())) return;

        const fd = new FormData();
        fd.append('titulo', titulo);
        fd.append('video_file', file);

        btnSalvarVideo.disabled = true;
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
        videoStatus.style.color = '';
        videoStatus.innerText = 'Enviando... 0%';

        // XMLHttpRequest permite acompanhar o progresso real do envio.
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE_URL}upload-video/`);
        xhr.setRequestHeader('Authorization', `Bearer ${window.getAccessToken()}`);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                progressBar.style.width = `${pct}%`;
                videoStatus.innerText = pct < 100 ? `Enviando... ${pct}%` : 'Processando no servidor...';
            }
        };

        xhr.onload = () => {
            if (xhr.status === 201) {
                progressBar.style.width = '100%';
                videoStatus.style.color = 'green';
                videoStatus.innerText = 'Vídeo enviado com sucesso!';
                setTimeout(() => window.location.href = 'galeria.html', 1500);
                return;
            }
            if (xhr.status === 401) {
                alert('Sua sessão expirou. Faça login novamente.');
                window.logout();
                return;
            }
            let message = `Erro ${xhr.status}`;
            try {
                const data = JSON.parse(xhr.responseText);
                message = data.message || data.detail || message;
            } catch (e) { /* resposta não-JSON */ }
            if (xhr.status === 413) message = 'Arquivo grande demais para o servidor.';
            failVideo(message);
        };

        xhr.onerror = () => failVideo('Falha de conexão durante o envio.');
        xhr.send(fd);
    }

    function failVideo(message) {
        videoStatus.style.color = 'red';
        videoStatus.innerText = `Erro no upload: ${message}`;
        progressContainer.style.display = 'none';
        btnSalvarVideo.disabled = false;
    }

    // ---------------- salvar galeria / artigo ----------------

    async function savePost(e) {
        e.preventDefault();
        const category = postCategory.value;
        if (category === 'video') {
            fazerUploadVideo();
            return;
        }

        const isEdit = Boolean(postIdInput.value);
        const formData = new FormData();
        let endpoint = `${API_BASE_URL}${category === 'gallery' ? 'gallery-posts' : 'articles'}/`;
        if (isEdit) endpoint += `${postIdInput.value}/`;

        if (category === 'gallery') {
            formData.append('post_type', postType.value);
            if (postType.value === 'single') {
                const file = singleImageUploadInput.files[0];
                if (!file && !isEdit) {
                    alert('Selecione uma imagem.');
                    return;
                }
                if (file) formData.append('image_main', file);
                formData.append('alt_text', imageAltInput.value.trim());
                formData.append('link', imageLinkInput.value.trim());
            } else {
                if (carouselItems.length === 0) {
                    alert('Adicione pelo menos uma imagem ao carrossel.');
                    return;
                }
                const meta = carouselItems.map((item, idx) => {
                    if (item.file) formData.append(`images_files[${idx}]`, item.file);
                    return { id: item.id || null, alt_text: item.alt_text, link: item.link };
                });
                formData.append('images_meta', JSON.stringify(meta));
            }
        } else {
            const file = articleImageUploadInput.files[0];
            if (!file && !isEdit) {
                alert('Selecione a imagem principal do artigo.');
                return;
            }
            formData.append('title', articleTitleInput.value.trim());
            formData.append('excerpt', articleExcerptInput.value.trim());
            formData.append('content', articleContentInput.value);
            if (file) formData.append('image', file);
        }

        if (!(await ensureSession())) return;

        submitBtn.disabled = true;
        try {
            const res = await fetch(endpoint, {
                method: isEdit ? 'PATCH' : 'POST',
                headers: window.getAuthHeaders(true),
                body: formData
            });
            if (res.ok) {
                alert('Salvo com sucesso!');
                window.location.href = category === 'gallery' ? 'galeria.html' : 'artigos.html';
                return;
            }
            if (res.status === 401) {
                alert('Sua sessão expirou. Faça login novamente.');
                window.logout();
                return;
            }
            alert('Erro ao salvar:\n' + await readError(res));
        } catch (error) {
            console.error(error);
            alert('Falha de conexão ao salvar. Tente novamente.');
        } finally {
            submitBtn.disabled = false;
        }
    }

    async function deleteCurrentPost() {
        if (!postIdInput.value) return;
        if (!confirm('Excluir permanentemente?')) return;
        if (!(await ensureSession())) return;

        const endpoint = `${API_BASE_URL}${postCategory.value === 'gallery' ? 'gallery-posts' : 'articles'}/${postIdInput.value}/`;
        try {
            const res = await fetch(endpoint, { method: 'DELETE', headers: window.getAuthHeaders() });
            if (res.ok) {
                alert('Excluído com sucesso.');
                window.location.href = 'admin.html';
            } else {
                alert('Erro ao excluir:\n' + await readError(res));
            }
        } catch (e) {
            alert('Falha de conexão ao excluir.');
        }
    }
});
