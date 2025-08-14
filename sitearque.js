document.addEventListener('DOMContentLoaded', function() {
   
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    
    function alertar() {
        return confirm('Você será redirecionado para um site externo. Deseja continuar?');
    }

    
    class Carousel {
        constructor(container) {
            this.container = container;
            this.items = Array.from(container.querySelectorAll('.carousel-item'));
            this.prevBtn = container.querySelector('.carousel-control.prev');
            this.nextBtn = container.querySelector('.carousel-control.next');
            this.currentIndex = 0;
            this.interval = null;
            this.autoPlayDelay = 5000; 
            this.isPaused = false;

            this.init();
        }

        init() {
            
            this.showItem(this.currentIndex);
            
            
            this.prevBtn.addEventListener('click', () => {
                this.prev();
                this.resetAutoPlay();
            });
            
            this.nextBtn.addEventListener('click', () => {
                this.next();
                this.resetAutoPlay();
            });

            
            this.container.addEventListener('mouseenter', () => this.pause());
            this.container.addEventListener('mouseleave', () => this.play());

            
            this.startAutoPlay();
        }

        showItem(index) {
            
            this.currentIndex = index;
            
            
            this.items.forEach(item => item.classList.remove('active'));
            
            
            this.items[this.currentIndex].classList.add('active');
        }

        next() {
            const newIndex = (this.currentIndex + 1) % this.items.length;
            this.showItem(newIndex);
        }

        prev() {
            const newIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
            this.showItem(newIndex);
        }

        startAutoPlay() {
            if (!this.interval && !this.isPaused) {
                this.interval = setInterval(() => this.next(), this.autoPlayDelay);
            }
        }

        stopAutoPlay() {
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
        }

        resetAutoPlay() {
            this.stopAutoPlay();
            this.startAutoPlay();
        }

        pause() {
            this.isPaused = true;
            this.stopAutoPlay();
        }

        play() {
            this.isPaused = false;
            this.startAutoPlay();
        }
    }

    
    const carouselElement = document.querySelector('.carousel');
    if (carouselElement) {
        new Carousel(carouselElement);
    }
});