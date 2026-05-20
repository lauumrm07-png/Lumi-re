// --- 1. SELECTORES ---
const navbar = document.querySelector('.navbar');
const hero = document.querySelector('.hero');
const galleryImages = document.querySelectorAll('.photo img');
const hiddenElements = document.querySelectorAll('.hidden');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const galleryGrid = document.querySelector('.gallery-grid');
const lightbox = document.querySelector('.lightbox');
const lightboxImg = document.querySelector('.lightbox-img');
const closeBtn = document.querySelector('.close');
const cursor = document.querySelector('.cursor');
const magneticButton = document.querySelector('.hero-content button');

// --- 2. LÓGICA DE SCROLL (Optimizada con requestAnimationFrame) ---
function handleScroll() {
    const scrollY = window.scrollY;

    // Navbar
    if (scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');

    // Hero Parallax
    if (scrollY < window.innerHeight) {
        hero.style.transform = `translateY(${scrollY * 0.15}px)`;
    }

    // Gallery Parallax
    galleryImages.forEach((img) => {
        img.style.transform = `translateY(${scrollY * 0.02}px) scale(1.05)`;
    });
}

window.addEventListener('scroll', () => {
    window.requestAnimationFrame(handleScroll);
});

// --- 3. ANIMACIONES Y EVENTOS ---

// Intersection Observer
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('show');
    });
}, { threshold: 0.1 });
hiddenElements.forEach((el) => observer.observe(el));

// Menu Mobile
menuToggle.addEventListener('click', () => navLinks.classList.toggle('active'));

// Lightbox (Delegación de eventos)
if (galleryGrid) {
    galleryGrid.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG') {
            lightbox.style.display = 'flex';
            lightboxImg.src = e.target.src;
        }
    });
}
closeBtn.addEventListener('click', () => lightbox.style.display = 'none');

// Loader
window.addEventListener('load', () => {
    const loader = document.querySelector('.loader');
    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 1000);
    }, 2000);
});

// Cursor
document.addEventListener('mousemove', (e) => {
    if(cursor) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    }
});

// Magnet Button
magneticButton.addEventListener('mousemove', (e) => {
    const rect = magneticButton.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    magneticButton.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
});
magneticButton.addEventListener('mouseleave', () => {
    magneticButton.style.transform = 'translate(0,0)';
});