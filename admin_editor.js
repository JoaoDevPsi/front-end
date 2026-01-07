document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'https://joaodevpsi.pythonanywhere.com/api/';
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
    const newImageUploadInput = document.getElementById('newImageUpload');
    const imageUrlInput = document.getElementById('imageUrl');
    const imageAltInput = document.getElementById('imageAlt');
    const imageLinkInput = document.getElementById('imageLink');
    const newImageUrlInput = document.getElementById('newImageUrl');
    const newImageAltInput = document.getElementById('newImageAlt');
    const newImageLinkInput = document.getElementById('newImageLink');

    const articleTitleInput = document.getElementById('articleTitle');
    const articleExcerptInput = document.getElementById('articleExcerpt');
    const articleContentInput = document.getElementById('articleContent');
    const articleImageUploadInput = document.getElementById('articleImageUpload');
    const articleImageUrlInput = document.getElementById('articleImageUrl');

    const videoTitleInput = document.getElementById('videoTitle');
    const videoDescriptionInput = document.getElementById('videoDescription');
    const videoFileUploadInput = document.getElementById('videoFileUpload');
    const videoStatus = document.getElementById('videoStatus');
    const btnSalvarVideo = document.getElementById('btnSalvarVideo');

    const deleteBtn = document.getElementById('deleteBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    let currentPost = null;
    let carouselItems = [];

    const urlParams = new URLSearchParams(window.location.search);
    const editPostId = urlParams.get('edit');
    const editPostCategory = urlParams.get('category');

    postCategory.addEventListener('change', togglePostCategory);
    postType.addEventListener('change', togglePostType);
    addImageBtn.addEventListener('click', addCarouselImage);
    postForm.addEventListener('submit', savePost);
    deleteBtn.addEventListener('click', deleteCurrentPost);
    cancelBtn.addEventListener('click', () => window.location.href = 'admin.html');

    if (btnSalvarVideo) {
        btnSalvarVideo.addEventListener('click', fazerUploadVideo);
    }

    singleImageUploadInput.addEventListener('change', (event) => readImageFileForPreview(event, imageUrlInput));
    newImageUploadInput.addEventListener('change', (event) => readImageFileForPreview(event, newImageUrlInput));
    articleImageUploadInput.addEventListener('change', (event) => readImageFileForPreview(event, articleImageUrlInput));

    function readImageFileForPreview(event, urlInputTarget) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                urlInputTarget.value = '';
            };
            reader.readAsDataURL(file);
        } else {
            urlInputTarget.value = '';
        }
    }

    if (editPostId && editPostCategory) {
        loadPostForEditing(editPostId, editPostCategory);
        deleteBtn.style.display = 'inline-block';
    } else {
        deleteBtn.style.display = 'none';
        togglePostCategory();
        togglePostType();
    }

    function togglePostCategory() {
        const category = postCategory.value;
        gallerySections.style.display = category === 'gallery' ? 'block' : 'none';
        articleSection.style.display = category === 'article' ? 'block' : 'none';
        if (videoSection) videoSection.style.display = category === 'video' ? 'block' : 'none';

        const allRequiredFields = document.querySelectorAll('#postForm [required]');
        allRequiredFields.forEach(el => {
            el.removeAttribute('required');
        });

        if (category === 'gallery') {
            postType.setAttribute('required', 'required');
            togglePostType();
        } else if (category === 'article') {
            articleTitleInput.setAttribute('required', 'required');
            articleExcerptInput.setAttribute('required', 'required');
            articleContentInput.setAttribute('required', 'required');
        }
    }

    function togglePostType() {
        const type = postType.value;
        singleImageSection.style.display = type === 'single' ? 'block' : 'none';
        carouselSection.style.display = type === 'carousel' ? 'block' : 'none';

        Array.from(singleImageSection.querySelectorAll('[required]')).forEach(el => {
            el.removeAttribute('required');
        });
        Array.from(carouselSection.querySelectorAll('[required]')).forEach(el => {
            el.removeAttribute('required');
        });
    }

    function addCarouselImage() {
        let imageUrlSource = null;
        let imageFile = null;

        if (newImageUploadInput.files.length > 0) {
            imageFile = newImageUploadInput.files[0];
            imageUrlSource = URL.createObjectURL(imageFile);
        } else if (newImageUrlInput.value.trim()) {
            imageUrlSource = newImageUrlInput.value.trim();
        } else {
            alert('URL ou upload da imagem é obrigatória para carrossel.');
            return;
        }

        const alt = newImageAltInput.value.trim();
        let link = newImageLinkInput.value.trim();
        if (link === '#') {
            link = '';
        }

        const newImage = {
            image: imageUrlSource,
            file: imageFile,
            alt_text: alt || 'Imagem do carrossel',
            link: link
        };

        carouselItems.push(newImage);
        renderCarouselImages();

        newImageUrlInput.value = '';
        newImageAltInput.value = '';
        newImageLinkInput.value = '';
        newImageUploadInput.value = '';
    }

    function renderCarouselImages() {
        carouselImages.innerHTML = '';
        carouselItems.forEach((item, index) => {
            const imgSrc = item.file ? URL.createObjectURL(item.file) : item.image;
            const imageDiv = document.createElement('div');
            imageDiv.className = 'image-preview';
            imageDiv.innerHTML = `
                <img src="${imgSrc}" alt="${item.alt_text}">
                <button class="remove-image" data-index="${index}">×</button>
            `;
            carouselImages.appendChild(imageDiv);
        });

        document.querySelectorAll('.remove-image').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                carouselItems.splice(index, 1);
                renderCarouselImages();
            });
        });
    }

    async function loadPostForEditing(postId, category) {
        postCategory.value = category;
        togglePostCategory();

        let apiEndpoint;
        if (category === 'gallery') {
            apiEndpoint = `${API_BASE_URL}gallery-posts/${postId}/`;
        } else if (category === 'article') {
            apiEndpoint = `${API_BASE_URL}articles/${postId}/`;
        }

        try {
            const response = await fetch(apiEndpoint, {
                method: 'GET',
                headers: window.getAuthHeaders()
            });
            if (!response.ok) {
                if (response.status === 404) {
                    alert('Post não encontrado no servidor.');
                } else if (response.status === 401 || response.status === 403) {
                    alert('Não autorizado a carregar o post. Faça login novamente.');
                    window.location.href = 'login.html';
                } else {
                    throw new Error(`Erro ao carregar post: ${response.statusText}`);
                }
            }
            const post = await response.json();
            currentPost = post;
            postIdInput.value = post.id;

            if (category === 'gallery') {
                postType.value = post.post_type;
                if (post.post_type === 'single') {
                    imageUrlInput.value = post.image_main_url || '';
                    imageAltInput.value = post.alt_text || '';
                    imageLinkInput.value = post.link || '';
                } else if (post.post_type === 'carousel') {
                    carouselItems = post.images.map(img => ({
                        image: img.image_url,
                        alt_text: img.alt_text,
                        link: (img.link === '#') ? '' : (img.link || '')
                    }));
                    renderCarouselImages();
                }
                togglePostType();
            } else if (category === 'article') {
                articleTitleInput.value = post.title;
                articleExcerptInput.value = post.excerpt;
                articleContentInput.value = post.content;
                articleImageUrlInput.value = post.image_url || '';
            }
        } catch (error) {
            console.error('Erro ao carregar post para edição:', error);
            alert('Erro ao carregar post para edição. Verifique o console.');
            window.location.href = 'admin.html';
        }
    }

    async function savePost(e) {
        e.preventDefault();
        const category = postCategory.value;
        if (category === 'video') return; 

        let apiEndpoint;
        let method;
        const formData = new FormData();

        if (postIdInput.value) {
            method = 'PATCH';
            apiEndpoint = `${API_BASE_URL}${category === 'gallery' ? 'gallery-posts' : 'articles'}/${postIdInput.value}/`;
        } else {
            method = 'POST';
            apiEndpoint = `${API_BASE_URL}${category === 'gallery' ? 'gallery-posts' : 'articles'}/`;
        }

        if (category === 'gallery') {
            const type = postType.value;
            formData.append('post_type', type);

            if (type === 'single') {
                const imageFile = singleImageUploadInput.files[0];
                const imageUrl = imageUrlInput.value.trim();

                if (imageFile) {
                    formData.append('image_main', imageFile);
                } else if (imageUrl) {
                    formData.append('image_main', imageUrl);
                } else if (method === 'PATCH') {
                    formData.append('image_main', '');
                } else {
                    alert('Forneça uma imagem ou URL.');
                    return;
                }

                formData.append('alt_text', imageAltInput.value.trim() || '');
                formData.append('link', imageLinkInput.value.trim() === '#' ? '' : imageLinkInput.value.trim());

            } else {
                if (carouselItems.length === 0 && method === 'POST') {
                    alert('Adicione pelo menos uma imagem ao carrossel.');
                    return;
                }

                const carouselImagesData = [];
                carouselItems.forEach((item, index) => {
                    if (item.file) {
                        formData.append(`images_files[${index}]`, item.file);
                    }
                    carouselImagesData.push({
                        image: item.image,
                        alt_text: item.alt_text,
                        link: item.link,
                        order: index,
                    });
                });
                formData.append('images_meta', JSON.stringify(carouselImagesData));
            }
        } else if (category === 'article') {
            const imageFile = articleImageUploadInput.files[0];
            const imageUrl = articleImageUrlInput.value.trim();

            if (imageFile) {
                formData.append('image', imageFile);
            } else if (imageUrl) {
                formData.append('image', imageUrl);
            }

            formData.append('title', articleTitleInput.value.trim());
            formData.append('excerpt', articleExcerptInput.value.trim());
            formData.append('content', articleContentInput.value.trim());
        }

        try {
            const response = await fetch(apiEndpoint, {
                method: method,
                headers: window.getAuthHeaders(true),
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(`Erro ao salvar: ${JSON.stringify(errorData)}`);
                return;
            }

            alert('Salvo com sucesso!');
            window.location.href = 'admin.html';
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro na comunicação.');
        }
    }

    async function fazerUploadVideo() {
        const titulo = videoTitleInput.value;
        const descricao = videoDescriptionInput.value;
        const videoFile = videoFileUploadInput.files[0];

        if (!videoFile) {
            videoStatus.innerHTML = '<p style="color: orange">Selecione um vídeo.</p>';
            return;
        }

        videoStatus.innerHTML = '<p style="color: blue">Enviando vídeo...</p>';

        const formData = new FormData();
        formData.append('titulo', titulo);
        formData.append('descricao', descricao);
        formData.append('video_file', videoFile);

        try {
            const response = await fetch(`${API_BASE_URL}upload-video/`, {
                method: 'POST',
                body: formData,
            });

            const resultado = await response.json();

            if (response.ok) {
                videoStatus.innerHTML = `<p style="color: green">✅ Sucesso! <a href="${resultado.url}" target="_blank">Ver vídeo</a></p>`;
                videoTitleInput.value = '';
                videoDescriptionInput.value = '';
                videoFileUploadInput.value = '';
            } else {
                videoStatus.innerHTML = `<p style="color: red">❌ Erro: ${resultado.message || 'Falha'}</p>`;
            }
        } catch (erro) {
            videoStatus.innerHTML = `<p style="color: red">❌ Falha na conexão.</p>`;
        }
    }

    async function deleteCurrentPost() {
        if (!currentPost || !confirm('Excluir permanentemente?')) return;

        let apiEndpoint = `${API_BASE_URL}${currentPost.title ? 'articles' : 'gallery-posts'}/${currentPost.id}/`;

        try {
            const response = await fetch(apiEndpoint, {
                method: 'DELETE',
                headers: window.getAuthHeaders(),
            });

            if (response.ok) {
                alert('Excluído!');
                window.location.href = 'admin.html';
            }
        } catch (error) {
            alert('Erro ao excluir.');
        }
    }
});