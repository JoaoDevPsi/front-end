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
    const progressBar = document.getElementById('uploadProgressBar');
    const progressContainer = document.getElementById('uploadProgressContainer');

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
    cancelBtn.addEventListener('click', () => window.location.href = 'site_arque.html');

    if (btnSalvarVideo) {
        btnSalvarVideo.addEventListener('click', fazerUploadVideo);
    }

    function readImageFileForPreview(event, urlInputTarget) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                urlInputTarget.value = ''; 
            };
            reader.readAsDataURL(file);
        }
    }

    singleImageUploadInput.addEventListener('change', (e) => readImageFileForPreview(e, imageUrlInput));
    newImageUploadInput.addEventListener('change', (e) => readImageFileForPreview(e, newImageUrlInput));
    articleImageUploadInput.addEventListener('change', (e) => readImageFileForPreview(e, articleImageUrlInput));

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
        videoSection.style.display = category === 'video' ? 'block' : 'none';

        const allRequired = document.querySelectorAll('#postForm [required]');
        allRequired.forEach(el => el.removeAttribute('required'));

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
            alert('URL ou upload da imagem é obrigatória.');
            return;
        }

        carouselItems.push({
            image: imageUrlSource,
            file: imageFile,
            alt_text: newImageAltInput.value.trim() || 'Imagem do carrossel',
            link: newImageLinkInput.value.trim() === '#' ? '' : newImageLinkInput.value.trim()
        });

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
            const div = document.createElement('div');
            div.className = 'image-preview';
            div.innerHTML = `
                <img src="${imgSrc}" style="max-width:100px; border-radius:4px;">
                <button type="button" class="remove-image" data-index="${index}" style="background:red; color:white; border-radius:50%; border:none; cursor:pointer;">×</button>
            `;
            carouselImages.appendChild(div);
        });

        document.querySelectorAll('.remove-image').forEach(btn => {
            btn.addEventListener('click', function() {
                carouselItems.splice(parseInt(this.dataset.index), 1);
                renderCarouselImages();
            });
        });
    }

    async function loadPostForEditing(postId, category) {
        postCategory.value = category;
        togglePostCategory();
        let endpoint = `${API_BASE_URL}${category === 'gallery' ? 'gallery-posts' : 'articles'}/${postId}/`;

        try {
            const response = await fetch(endpoint, { headers: window.getAuthHeaders() });
            const post = await response.json();
            currentPost = post;
            postIdInput.value = post.id;

            if (category === 'gallery') {
                postType.value = post.post_type;
                if (post.post_type === 'single') {
                    imageUrlInput.value = post.image_main_url || '';
                    imageAltInput.value = post.alt_text || '';
                    imageLinkInput.value = post.link || '';
                } else {
                    carouselItems = post.images.map(img => ({
                        image: img.image_url,
                        alt_text: img.alt_text,
                        link: img.link === '#' ? '' : img.link
                    }));
                    renderCarouselImages();
                }
                togglePostType();
            } else {
                articleTitleInput.value = post.title;
                articleExcerptInput.value = post.excerpt;
                articleContentInput.value = post.content;
                articleImageUrlInput.value = post.image_url || '';
            }
        } catch (error) {
            console.error('Erro ao carregar post:', error);
        }
    }

    async function fazerUploadVideo() {
        const file = videoFileUploadInput.files[0];
        const titulo = videoTitleInput.value;
        if (!file || !titulo) return alert('Título e arquivo são obrigatórios.');

        btnSalvarVideo.disabled = true;
        progressContainer.style.display = 'block';
        progressBar.style.width = '50%';
        videoStatus.innerText = 'Enviando...';

        const fd = new FormData();
        fd.append('titulo', titulo);
        fd.append('video_file', file);

        try {
            const res = await fetch(`${API_BASE_URL}upload-video/`, { method: 'POST', body: fd });
            if (res.ok) {
                progressBar.style.width = '100%';
                videoStatus.innerText = 'Sucesso!';
                setTimeout(() => window.location.href = 'galeria.html', 1500);
            } else { throw new Error(); }
        } catch (e) {
            videoStatus.innerText = 'Erro no upload.';
            btnSalvarVideo.disabled = false;
        }
    }

    async function savePost(e) {
        e.preventDefault();
        const category = postCategory.value;
        if (category === 'video') return;

        const formData = new FormData();
        let method = postIdInput.value ? 'PATCH' : 'POST';
        let endpoint = `${API_BASE_URL}${category === 'gallery' ? 'gallery-posts' : 'articles'}/`;
        if(postIdInput.value) endpoint += `${postIdInput.value}/`;

        if (category === 'gallery') {
            formData.append('post_type', postType.value);
            if (postType.value === 'single') {
                if (singleImageUploadInput.files[0]) formData.append('image_main', singleImageUploadInput.files[0]);
                else formData.append('image_main', imageUrlInput.value);
                formData.append('alt_text', imageAltInput.value);
                formData.append('link', imageLinkInput.value);
            } else {
                const meta = carouselItems.map((item, idx) => {
                    if (item.file) formData.append(`images_files[${idx}]`, item.file);
                    return { image: item.image, alt_text: item.alt_text, link: item.link, order: idx };
                });
                formData.append('images_meta', JSON.stringify(meta));
            }
        } else {
            formData.append('title', articleTitleInput.value);
            formData.append('excerpt', articleExcerptInput.value);
            formData.append('content', articleContentInput.value);
            if (articleImageUploadInput.files[0]) formData.append('image', articleImageUploadInput.files[0]);
            else formData.append('image', articleImageUrlInput.value);
        }

        try {
            const res = await fetch(endpoint, {
                method: method,
                headers: window.getAuthHeaders(true),
                body: formData
            });
            if (res.ok) {
                alert('Salvo com sucesso!');
                window.location.href = 'site_arque.html';
            } else {
                const err = await res.json();
                alert('Erro: ' + JSON.stringify(err));
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function deleteCurrentPost() {
        if (!confirm('Excluir permanentemente?')) return;
        const endpoint = `${API_BASE_URL}${postCategory.value === 'gallery' ? 'gallery-posts' : 'articles'}/${postIdInput.value}/`;
        try {
            const res = await fetch(endpoint, { method: 'DELETE', headers: window.getAuthHeaders() });
            if (res.ok) window.location.href = 'site_arque.html';
        } catch (e) { alert('Erro ao excluir'); }
    }
});