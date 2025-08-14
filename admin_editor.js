document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'https://joaodevpsi.pythonanywhere.com/api/    ';
    const postForm = document.getElementById('postForm');
    const postIdInput = document.getElementById('postId');
    const postCategory = document.getElementById('postCategory');
    const gallerySections = document.getElementById('gallerySections');
    const articleSection = document.getElementById('articleSection');

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

        if (type === 'single' && postCategory.value === 'gallery') {
        } else if (type === 'carousel' && postCategory.value === 'gallery') {
        }
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
                    imageUrlInput.value = post.image_main || '';
                    imageAltInput.value = post.alt_text || '';
                    imageLinkInput.value = post.link || '';
                } else if (post.post_type === 'carousel') {
                    carouselItems = post.images.map(img => ({
                        image: img.image,
                        alt_text: img.alt_text,
                        link: (img.link === '#') ? '' : (img.link || '') // AQUI: Limpa o link se for '#'
                    }));
                    renderCarouselImages();
                }
                togglePostType();
            } else if (category === 'article') {
                articleTitleInput.value = post.title;
                articleExcerptInput.value = post.excerpt;
                articleContentInput.value = post.content;
                articleImageUrlInput.value = post.image || '';
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
                    alert('Para Imagem Única, você deve fazer upload de uma imagem ou fornecer uma URL.');
                    return;
                }

                let singleImageLink = imageLinkInput.value.trim();
                if (singleImageLink === '#') {
                    singleImageLink = '';
                }
                formData.append('alt_text', imageAltInput.value.trim() || '');
                formData.append('link', singleImageLink);

            } else { 
                if (carouselItems.length === 0) {
                    if (method === 'POST') {
                        alert('Adicione pelo menos uma imagem ao carrossel.');
                        return;
                    }
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
        } else {
            const imageFile = articleImageUploadInput.files[0];
            const imageUrl = articleImageUrlInput.value.trim();

            if (imageFile) {
                formData.append('image', imageFile);
            } else if (imageUrl) {
                formData.append('image', imageUrl);
            } else if (method === 'PATCH') {
                formData.append('image', '');
            } else {
                alert('Para Artigos, você deve fazer upload de uma imagem ou fornecer uma URL.');
                return;
            }

            if (!articleTitleInput.value.trim() || !articleExcerptInput.value.trim() || !articleContentInput.value.trim()) {
                alert('Título, Resumo e Conteúdo do artigo são obrigatórios.');
                return;
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
                console.error('Erro da API:', errorData);
                let errorMessage = `Erro ao salvar: ${response.status} ${response.statusText}`;
                if (errorData.detail) errorMessage += ` - ${errorData.detail}`;
                if (errorData.image_main && errorData.image_main[0]) errorMessage += ` - Imagem Principal: ${errorData.image_main[0]}`;
                if (errorData.images && errorData.images[0]) errorMessage += ` - Imagens carrossel: ${JSON.stringify(errorData.images)}`;
                if (errorData.images_meta && errorData.images_meta[0]) errorMessage += ` - Metadados de Imagens: ${JSON.stringify(errorData.images_meta)}`;

                alert(errorMessage);
                return;
            }

            alert(`${category === 'gallery' ? 'Post da Galeria' : 'Artigo'} salvo com sucesso no back-end!`);
            window.location.href = 'admin.html';
        } catch (error) {
            console.error('Erro na requisição Fetch:', error);
            alert(`Erro na comunicação: ${error.message}. Verifique sua conexão ou o console.`);
        }
    }

    async function deleteCurrentPost() {
        if (!currentPost || !confirm('Tem certeza que deseja excluir este post permanentemente do servidor?')) {
            return;
        }

        let apiEndpoint;
        if (currentPost.post_type === 'article' || currentPost.type === 'article') {
            apiEndpoint = `${API_BASE_URL}articles/${currentPost.id}/`;
        } else {
            apiEndpoint = `${API_BASE_URL}gallery-posts/${currentPost.id}/`;
        }

        try {
            const response = await fetch(apiEndpoint, {
                method: 'DELETE',
                headers: window.getAuthHeaders(),
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    alert('Não autorizado a excluir o post. Faça login novamente.');
                    window.logout();
                } else if (response.status === 404) {
                    alert('Post não encontrado no servidor.');
                } else {
                    throw new Error(`Erro ao excluir post: ${response.status} ${response.statusText}`);
                }
            }

            alert('Post excluído com sucesso do back-end!');
            window.location.href = 'admin.html';
        } catch (error) {
            console.error('Erro na requisição DELETE:', error);
            alert(`Erro ao excluir: ${error.message}`);
        }
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
});
