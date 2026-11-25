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

    const eventSection = document.getElementById('eventSection');
    const eventFolderSelect = document.getElementById('eventFolder');
    const newFolderGroup = document.getElementById('newFolderGroup');
    const newFolderNameInput = document.getElementById('newFolderName');
    const eventFilesInput = document.getElementById('eventFiles');
    const eventFilesList = document.getElementById('eventFilesList');
    const eventCaptionInput = document.getElementById('eventCaption');
    const eventProgressContainer = document.getElementById('eventProgressContainer');
    const eventProgressBar = document.getElementById('eventProgressBar');
    const eventStatus = document.getElementById('eventStatus');

    const submitBtn = document.getElementById('submitBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    const NEW_FOLDER = '__nova__';
    const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15 MB (mesmo limite do backend)
    const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const VIDEO_EXT = ['mp4', 'webm', 'mov', 'm4v', 'ogg'];

    // Cada item: { id (imagem já salva) | file (nova), previewUrl, alt_text, link }
    let carouselItems = [];
    // Arquivos escolhidos para o evento: { file, previewUrl, erro }
    let eventFiles = [];

    const urlParams = new URLSearchParams(window.location.search);
    const editPostId = urlParams.get('edit');
    // "gallery" era o nome antigo do post de imagem única
    const categoryParam = urlParams.get('category') === 'gallery' ? 'single' : urlParams.get('category');
    const folderParam = urlParams.get('folder');

    postCategory.addEventListener('change', togglePostCategory);
    postType.addEventListener('change', togglePostType);
    addImageBtn.addEventListener('click', addCarouselImage);
    postForm.addEventListener('submit', savePost);
    deleteBtn.addEventListener('click', deleteCurrentPost);
    cancelBtn.addEventListener('click', () => window.location.href = 'admin.html');
    btnSalvarVideo.addEventListener('click', fazerUploadVideo);
    eventFolderSelect.addEventListener('change', () => {
        newFolderGroup.style.display = eventFolderSelect.value === NEW_FOLDER ? 'block' : 'none';
        if (eventFolderSelect.value === NEW_FOLDER) newFolderNameInput.focus();
    });
    eventFilesInput.addEventListener('change', addEventFiles);

    singleImageUploadInput.addEventListener('change', () => showFilePreview(singleImageUploadInput, singleImagePreview));
    articleImageUploadInput.addEventListener('change', () => showFilePreview(articleImageUploadInput, articleImagePreview));

    if (['event', 'single', 'carousel', 'article', 'video'].includes(categoryParam)) {
        postCategory.value = categoryParam;
    }

    if (editPostId && (categoryParam === 'single' || categoryParam === 'article')) {
        postCategory.disabled = true; // não é possível trocar a categoria de um post existente
        deleteBtn.style.display = 'inline-block';
        togglePostCategory();
        loadPostForEditing(editPostId, categoryParam === 'article' ? 'article' : 'gallery');
    } else {
        deleteBtn.style.display = 'none';
        togglePostCategory();
    }

    loadEventFolders();

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

    function isGalleryCategory(category) {
        return category === 'single' || category === 'carousel';
    }

    function togglePostCategory() {
        const category = postCategory.value;
        eventSection.style.display = category === 'event' ? 'block' : 'none';
        gallerySections.style.display = isGalleryCategory(category) ? 'block' : 'none';
        articleSection.style.display = category === 'article' ? 'block' : 'none';
        videoSection.style.display = category === 'video' ? 'block' : 'none';
        // O vídeo tem botão próprio, com barra de progresso.
        submitBtn.style.display = category === 'video' ? 'none' : 'inline-block';
        submitBtn.textContent = category === 'event' ? 'Publicar no evento' : 'Salvar Post';

        [articleTitleInput, articleExcerptInput, articleContentInput].forEach(el => {
            el.required = category === 'article';
        });

        if (isGalleryCategory(category)) {
            postType.value = category;
            togglePostType();
        }
    }

    // ---------------- eventos (pastas) ----------------

    async function loadEventFolders() {
        try {
            const res = await fetch(`${API_BASE_URL}event-folders/`);
            if (!res.ok) throw new Error(await readError(res));
            const folders = await res.json();
            eventFolderSelect.innerHTML = '<option value="">Selecione a pasta...</option>' +
                folders.map(f => `<option value="${f.id}" data-slug="${window.escapeHtml(f.slug)}">${window.escapeHtml(f.name)}</option>`).join('') +
                `<option value="${NEW_FOLDER}">+ Criar nova pasta...</option>`;

            if (folderParam) {
                const match = folders.find(f => f.slug === folderParam || String(f.id) === folderParam);
                if (match) eventFolderSelect.value = String(match.id);
            }
        } catch (error) {
            console.error('Erro ao carregar pastas:', error);
            eventFolderSelect.innerHTML = `<option value="">Erro ao carregar pastas</option><option value="${NEW_FOLDER}">+ Criar nova pasta...</option>`;
        }
    }

    function fileExtension(name) {
        return (name.split('.').pop() || '').toLowerCase();
    }

    function formatSize(bytes) {
        return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
    }

    function addEventFiles() {
        const rejected = [];
        Array.from(eventFilesInput.files).forEach(file => {
            const ext = fileExtension(file.name);
            const isImage = IMAGE_EXT.includes(ext);
            const isVideo = VIDEO_EXT.includes(ext);
            if (!isImage && !isVideo) {
                rejected.push(`${file.name}: formato não aceito`);
            } else if (isImage && file.size > MAX_IMAGE_SIZE) {
                rejected.push(`${file.name}: foto maior que 15 MB`);
            } else if (isVideo && file.size > MAX_VIDEO_SIZE) {
                rejected.push(`${file.name}: vídeo maior que 100 MB`);
            } else {
                eventFiles.push({ file, isVideo, previewUrl: isImage ? URL.createObjectURL(file) : null, erro: '' });
            }
        });
        eventFilesInput.value = '';
        renderEventFiles();
        if (rejected.length) alert('Alguns arquivos não foram adicionados:\n' + rejected.join('\n'));
    }

    function renderEventFiles() {
        eventFilesList.innerHTML = '';
        eventFiles.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'event-file' + (item.erro ? ' erro' : '');

            const thumb = item.previewUrl ? document.createElement('img') : document.createElement('div');
            thumb.className = 'thumb';
            if (item.previewUrl) {
                thumb.src = item.previewUrl;
                thumb.alt = '';
            } else {
                thumb.textContent = '🎬';
            }

            const name = document.createElement('div');
            name.className = 'name';
            name.textContent = `${item.file.name} (${formatSize(item.file.size)})`;
            name.title = item.file.name;

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'remove-image';
            remove.textContent = '×';
            remove.setAttribute('aria-label', `Remover ${item.file.name}`);
            remove.addEventListener('click', () => {
                const [removed] = eventFiles.splice(index, 1);
                if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
                renderEventFiles();
            });

            div.append(thumb, name, remove);
            if (item.erro) {
                const erro = document.createElement('div');
                erro.className = 'erro-msg';
                erro.textContent = item.erro;
                div.appendChild(erro);
            }
            eventFilesList.appendChild(div);
        });
    }

    // Envia um FormData mostrando o progresso; resolve com { status, data }.
    function uploadWithProgress(url, formData, onProgress) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', url);
            xhr.setRequestHeader('Authorization', `Bearer ${window.getAccessToken()}`);
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable && onProgress) onProgress(e.loaded, e.total);
            };
            xhr.onload = () => {
                let data = null;
                try { data = JSON.parse(xhr.responseText); } catch (e) { /* resposta não-JSON */ }
                resolve({ status: xhr.status, data });
            };
            xhr.onerror = () => reject(new Error('Falha de conexão durante o envio.'));
            xhr.send(formData);
        });
    }

    function apiErrorMessage(status, data) {
        if (status === 413) return 'Arquivo grande demais para o servidor.';
        if (!data) return `Erro ${status}`;
        if (data.detail) return data.detail;
        if (data.message) return data.message;
        return Object.values(data).flat().join(' ') || `Erro ${status}`;
    }

    async function ensureFolder() {
        if (eventFolderSelect.value !== NEW_FOLDER) {
            const option = eventFolderSelect.selectedOptions[0];
            return { id: eventFolderSelect.value, slug: option ? option.dataset.slug : '' };
        }
        const res = await fetch(`${API_BASE_URL}event-folders/`, {
            method: 'POST',
            headers: window.getAuthHeaders(),
            body: JSON.stringify({ name: newFolderNameInput.value.trim() })
        });
        if (!res.ok) throw new Error('Não foi possível criar a pasta: ' + await readError(res));
        const folder = await res.json();
        // A pasta passa a existir: atualiza a lista para não criar de novo
        const option = new Option(folder.name, folder.id);
        option.dataset.slug = folder.slug;
        eventFolderSelect.add(option, eventFolderSelect.options.length - 1);
        eventFolderSelect.value = String(folder.id);
        newFolderGroup.style.display = 'none';
        return { id: folder.id, slug: folder.slug };
    }

    async function saveEvent() {
        if (!eventFolderSelect.value) {
            alert('Selecione a pasta do evento.');
            return;
        }
        if (eventFolderSelect.value === NEW_FOLDER && !newFolderNameInput.value.trim()) {
            alert('Digite o nome da nova pasta.');
            newFolderNameInput.focus();
            return;
        }
        if (eventFiles.length === 0) {
            alert('Selecione pelo menos uma foto ou vídeo.');
            return;
        }
        if (!(await ensureSession())) return;

        submitBtn.disabled = true;
        eventStatus.style.color = '';
        eventProgressContainer.style.display = 'block';
        eventProgressBar.style.width = '0%';

        let folder;
        try {
            folder = await ensureFolder();
        } catch (error) {
            eventStatus.style.color = 'red';
            eventStatus.textContent = error.message;
            eventProgressContainer.style.display = 'none';
            submitBtn.disabled = false;
            return;
        }

        const caption = eventCaptionInput.value.trim();
        const totalBytes = eventFiles.reduce((sum, item) => sum + item.file.size, 0) || 1;
        let doneBytes = 0;
        const failed = [];

        for (let i = 0; i < eventFiles.length; i++) {
            const item = eventFiles[i];
            eventStatus.textContent = `Enviando ${i + 1} de ${eventFiles.length}: ${item.file.name}`;

            const fd = new FormData();
            fd.append('folder', folder.id);
            fd.append('caption', caption);
            fd.append('file', item.file);

            try {
                const { status, data } = await uploadWithProgress(`${API_BASE_URL}event-media/`, fd, (loaded) => {
                    eventProgressBar.style.width = `${Math.min(99, Math.round(((doneBytes + loaded) / totalBytes) * 100))}%`;
                });
                if (status === 401) {
                    alert('Sua sessão expirou. Faça login novamente.');
                    window.logout();
                    return;
                }
                if (status === 201) {
                    item.erro = '';
                } else {
                    item.erro = apiErrorMessage(status, data);
                    failed.push(item);
                }
            } catch (error) {
                item.erro = error.message;
                failed.push(item);
            }
            doneBytes += item.file.size;
            eventProgressBar.style.width = `${Math.round((doneBytes / totalBytes) * 100)}%`;
        }

        const enviados = eventFiles.length - failed.length;
        eventFiles = failed; // mantém só os que falharam, para tentar de novo
        renderEventFiles();
        submitBtn.disabled = false;

        if (failed.length === 0) {
            eventStatus.style.color = 'green';
            eventStatus.textContent = `${enviados} ${enviados === 1 ? 'arquivo enviado' : 'arquivos enviados'} com sucesso!`;
            setTimeout(() => {
                window.location.href = `galeria.html#pasta-${encodeURIComponent(folder.slug || '')}`;
            }, 1200);
        } else {
            eventStatus.style.color = 'red';
            eventStatus.textContent = `${enviados} enviado(s), ${failed.length} com erro. Veja os arquivos marcados em vermelho e clique em "Publicar no evento" para tentar de novo.`;
        }
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
                postCategory.value = post.post_type; // "single" ou "carousel"
                togglePostCategory();
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
        if (postCategory.value === 'video') {
            fazerUploadVideo();
            return;
        }
        if (postCategory.value === 'event') {
            saveEvent();
            return;
        }
        const category = isGalleryCategory(postCategory.value) ? 'gallery' : 'article';

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

        const endpoint = `${API_BASE_URL}${isGalleryCategory(postCategory.value) ? 'gallery-posts' : 'articles'}/${postIdInput.value}/`;
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
