document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav-list');

    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            navList.classList.toggle('active');
        });
    }

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const captionText = document.getElementById('caption');
    const closeBtn = document.querySelector('.close-btn');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const triggers = document.querySelectorAll('.lightbox-trigger');

    let currentIndex = 0;
    const images = Array.from(triggers).map(img => ({
        src: img.src,
        alt: img.alt
    }));

    function showImage(index) {
        if (images.length === 0) return;
        
        currentIndex = (index + images.length) % images.length;
        
        lightboxImg.src = images[currentIndex].src;
        captionText.textContent = images[currentIndex].alt;
    }

    triggers.forEach((trigger, index) => {
        trigger.addEventListener('click', () => {
            currentIndex = index;
            lightbox.classList.add('active');
            showImage(currentIndex);
        });
    });

    closeBtn.addEventListener('click', () => {
        lightbox.classList.remove('active');
    });

    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showImage(currentIndex - 1);
    });

    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showImage(currentIndex + 1);
    });

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('active');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('active')) {
            if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
            if (e.key === 'ArrowRight') showImage(currentIndex + 1);
            if (e.key === 'Escape') lightbox.classList.remove('active');
        }
    });

    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
});