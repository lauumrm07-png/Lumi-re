// =========================================================
// SCRIPT PRINCIPAL - LUMINA
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    inicializarMenu();
    inicializarObserver();
    inicializarHeroEfectos();
    cargarGaleria(); // 1. Primero cargamos la galería
});

// 1. MENU MOBILE
function inicializarMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => navLinks.classList.toggle('active'));
    }
}

// 2. MOTOR DE GALERÍA (Corregido a gallery.json)
async function cargarGaleria() {
    const container = document.getElementById('gallery-container');
    if (!container) return;

    try {
        const response = await fetch('gallery.json');
        const data = await response.json();
        
        container.innerHTML = data.map(item => `
            <div class="photo hidden">
                <img src="${item.src}" alt="${item.titulo}" loading="lazy">
                <div class="photo-info">
                    <h3>${item.titulo}</h3>
                    <p>${item.desc}</p>
                </div>
            </div>
        `).join('');

        // Reiniciamos animaciones
        inicializarObserver();
        // ACTIVAR LIGHTBOX DINÁMICO
        activarLightbox(); 
    } catch (error) {
        console.warn('Error cargando la galería:', error);
    }
}

// 3. LIGHTBOX DINÁMICO (La solución para elementos dinámicos)
function activarLightbox() {
    const lightbox = document.querySelector('.lightbox');
    const lightboxImg = document.querySelector('.lightbox-img');
    const closeBtn = document.querySelector('.close');

    // Usamos delegación: detectamos el clic en el contenedor padre
    const galleryContainer = document.getElementById('gallery-container');
    galleryContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG') {
            lightbox.style.display = 'flex';
            lightboxImg.src = e.target.src;
        }
    });

    closeBtn.addEventListener('click', () => {
        lightbox.style.display = 'none';
    });
}

// 4. SCROLL ANIMATION
function inicializarObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('show');
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.hidden').forEach(el => observer.observe(el));
}

// 5. LOADER
window.addEventListener('load', () => {
    const loader = document.querySelector('.loader');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 1000);
        }, 2000);
    }
});

// 6. HERO Y PARALLAX (Simplificado)
function inicializarHeroEfectos() {
    const hero = document.querySelector('.hero');
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (hero && window.scrollY < window.innerHeight) {
            hero.style.transform = `translateY(${window.scrollY * 0.15}px)`;
        }
        if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
}
