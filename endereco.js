document.addEventListener('DOMContentLoaded', function() {
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
            lightbox.style.display = 'flex';
            showImage(currentIndex);
        });
    });

    closeBtn.addEventListener('click', () => {
        lightbox.style.display = 'none';
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
            lightbox.style.display = 'none';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (lightbox.style.display === 'flex') {
            if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
            if (e.key === 'ArrowRight') showImage(currentIndex + 1);
            if (e.key === 'Escape') lightbox.style.display = 'none';
        }
    });

    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
});