const API = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  ? 'http://localhost:5001/api'
  : '/api';

let token = localStorage.getItem('lumina_token');
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  inicializarLenis();
  inicializarMenu();
  inicializarObserver();
  inicializarHeroEfectos();
  cargarGaleria();
  cargarMentorias();
  inicializarScrollProgress();
  inicializarCounters();
  inicializarAuth();
  inicializarUpload();
  inicializarBusqueda();
  inicializarNotificaciones();
});

// =========================
// 0. LENIS SMOOTH SCROLL
// =========================

let lenis;

function inicializarLenis() {
  lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.5,
    infinite: false,
  });

  lenis.on('scroll', (e) => {
    actualizarScrollProgress(e.progress);
    actualizarHeroParallax(e);
    actualizarNavbar(e);
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

// =========================
// 1. MENU MOBILE
// =========================

function inicializarMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => navLinks.classList.toggle('active'));
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', (e) => {
        navLinks.classList.remove('active');
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target && lenis) {
            lenis.scrollTo(target, { offset: -80, duration: 1.2 });
          }
        }
      });
    });
  }
}

// =========================
// 2. GALERÍA
// =========================

const tags = ['Fotografía', 'Arte Visual', 'Documental', 'Abstracto', 'Retrato', 'Paisaje'];

async function cargarGaleria() {
  const container = document.getElementById('gallery-container');
  if (!container) return;

  try {
    const res = await fetch(`${API}/artworks?limit=12&sort=-createdAt`);
    const json = await res.json();

    if (json.artworks && json.artworks.length) {
      renderGaleria(json.artworks);
      return;
    }
  } catch {}

  try {
    const response = await fetch('gallery.json');
    const data = await response.json();
    renderGaleria(data, true);
  } catch (error) {
    console.warn('Error cargando la galería:', error);
  }
}

function renderGaleria(items, isLocal) {
  const container = document.getElementById('gallery-container');
  if (!container) return;

  const countEl = document.getElementById('gallery-count');
  if (countEl) countEl.textContent = `${items.length} obras`;

  container.innerHTML = items.map((item, i) => {
    const src = isLocal ? item.src : (item.image || item.src);
    const titulo = item.titulo || item.title;
    const desc = item.desc || item.description || '';

    let artistHtml = `<span class="photo-tag">${tags[i % tags.length]}</span>`;
    if (!isLocal && item.artist && typeof item.artist === 'object' && item.artist.name) {
      const artistId = item.artist._id || item.artist.id;
      artistHtml = `<a href="perfil.html?id=${artistId}" class="photo-artist-link" onclick="event.stopPropagation()">${item.artist.name}</a>`;
    }

    return `
      <div class="photo hidden" data-index="${i}">
        <div class="photo-inner">
          <div class="photo-img-wrapper" style="background-image: url(${src})">
          </div>
          <div class="photo-overlay">
            ${artistHtml}
            <h3>${titulo}</h3>
            <p>${desc}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');

  inicializarObserver();
  inicializarTilt();
  activarLightbox(items, isLocal);
}

// =========================
// 2B. TILT 3D
// =========================

function inicializarTilt() {
  document.querySelectorAll('.photo').forEach(photo => {
    const inner = photo.querySelector('.photo-inner');

    photo.addEventListener('mousemove', (e) => {
      const rect = photo.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;
      inner.style.transform = `translateY(-8px) scale(1.01) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    photo.addEventListener('mouseleave', () => {
      inner.style.transform = '';
    });
  });
}

// =========================
// 3. MENTORÍAS
// =========================

async function cargarMentorias() {
  const container = document.getElementById('mentorship-container');
  if (!container) return;

  try {
    const res = await fetch(`${API}/mentorships?limit=6&sort=-createdAt`);
    const json = await res.json();

    if (json.mentorships && json.mentorships.length) {
      renderMentorias(json.mentorships);
      return;
    }
  } catch {}

  try {
    const response = await fetch('mentorships.json');
    const data = await response.json();
    renderMentorias(data, true);
  } catch (error) {
    console.warn('Error cargando mentorías:', error);
  }
}

function renderMentorias(items, isLocal) {
  const container = document.getElementById('mentorship-container');
  if (!container) return;

  const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" fill="%23222"%3E%3Crect width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" fill="%23555" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="16"%3ESin imagen%3C/text%3E%3C/svg%3E';

  container.innerHTML = items.map((item, i) => {
    const rawSrc = isLocal ? item.src : (item.image || item.src);
    const src = rawSrc || PLACEHOLDER;
    const name = item.name || (item.mentor?.name || 'Artista');
    const category = item.category;
    const description = item.description;
    const price = isLocal ? item.price : `$${item.price}/${item.duration}min`;
    const skills = item.skills || [];
    const id = item._id || item.id || '';
    const avgRating = item.averageRating || 0;
    const reviewCount = item.reviewCount || 0;
    const stars = Math.round(avgRating);
    const starsHtml = '<span class="stars">' + [1,2,3,4,5].map(s => `<span class="star ${s <= stars ? 'filled' : ''}">★</span>`).join('') + '</span>';
    const ratingHtml = reviewCount > 0
      ? `<div class="mentorship-rating">${starsHtml} <span class="rating-text">${avgRating} (${reviewCount} ${reviewCount === 1 ? 'reseña' : 'reseñas'})</span></div>`
      : '';

    let nameHtml = name;
    if (!isLocal && item.mentor && typeof item.mentor === 'object' && item.mentor._id) {
      nameHtml = `<a href="perfil.html?id=${item.mentor._id}" class="mentor-link">${name}</a>`;
    }

    return `
      <div class="mentorship-card hidden" data-stagger="${i * 100}">
        <div class="mentorship-card-img">
          <img src="${src}" alt="${name}" loading="lazy">
          <div class="mentorship-card-overlay"></div>
          <span class="mentorship-card-tag">${category}</span>
        </div>
        <div class="mentorship-info">
          <h3>${nameHtml}</h3>
          <p>${description}</p>
          ${ratingHtml}
          <div class="mentorship-price-row">
            <span class="mentorship-price-label">Desde</span>
            <span class="mentorship-price-value">${price}</span>
          </div>
          <div class="skills">
            ${skills.map(skill => `<span>${skill}</span>`).join('')}
          </div>
          <button class="mentorship-btn" data-id="${id}">Agendar Mentoría</button>
        </div>
      </div>
    `;
  }).join('');

  inicializarObserver();
}

// Payment handler for mentorship cards (delegated)
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.mentorship-btn');
  if (!btn) return;
  const mentorshipId = btn.dataset.id;
  if (!mentorshipId) return;

  btn.disabled = true;
  btn.textContent = 'Procesando...';

  const tok = localStorage.getItem('lumina_token');
  if (!tok) {
    abrirModal('auth-modal');
    btn.disabled = false;
    btn.textContent = 'Agendar Mentoría';
    return;
  }

  try {
    const res = await fetch(`${API}/payments/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tok}`,
      },
      body: JSON.stringify({ mentorshipId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error');
    window.location.href = data.url;
  } catch (err) {
    alert(err.message);
    btn.disabled = false;
    btn.textContent = 'Agendar Mentoría';
  }
});

// =========================
// 4. BÚSQUEDA GLOBAL
// =========================

let searchTimeout = null;

function inicializarBusqueda() {
  const btn = document.getElementById('nav-search-btn');
  const searchBox = document.getElementById('nav-search-box');
  const input = document.getElementById('search-input');
  const closeBtn = document.getElementById('search-close-btn');
  const dropdown = document.getElementById('search-dropdown');

  if (!btn) return;

  function abrir() {
    btn.style.display = 'none';
    searchBox.style.display = 'flex';
    searchBox.classList.add('open');
    setTimeout(() => input?.focus(), 100);
  }

  function cerrar() {
    btn.style.display = '';
    searchBox.style.display = 'none';
    searchBox.classList.remove('open');
    dropdown.classList.remove('open');
    dropdown.innerHTML = '';
    if (input) input.value = '';
  }

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    abrir();
  });
  closeBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    cerrar();
  });

  input?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const q = input.value.trim();
    if (!q) {
      dropdown.classList.remove('open');
      dropdown.innerHTML = '';
      return;
    }
    searchTimeout = setTimeout(() => ejecutarBusqueda(q), 300);
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrar();
    if (e.key === 'Enter') {
      clearTimeout(searchTimeout);
      const q = input.value.trim();
      if (q) ejecutarBusqueda(q);
    }
  });
}

async function ejecutarBusqueda(q) {
  const dropdown = document.getElementById('search-dropdown');
  if (!dropdown) return;

  dropdown.innerHTML = `
    <div class="search-status">
      <div class="search-status-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </div>
      <p class="search-status-text">Buscando...</p>
    </div>`;
  dropdown.classList.add('open');

  try {
    const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}&limit=8`);
    const data = await res.json();

    if (!data.total) {
      dropdown.innerHTML = `
        <div class="search-status">
          <div class="search-status-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <p class="search-status-text">Sin resultados</p>
          <p class="search-status-sub">No encontramos nada para "${q}"</p>
        </div>`;
      return;
    }

    let html = '';

    if (data.artworks.length) {
      html += `<div class="search-section"><h4>Obras (${data.artworks.length})</h4>`;
      html += data.artworks.map(a =>
        `<a href="#galeria" class="search-item" data-section="galeria" data-title="${a.title.replace(/"/g, '&quot;')}">
          <div class="search-item-inner">
            <div class="search-item-thumb">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div class="search-item-info">
              <div class="search-item-title">${a.title}</div>
              <div class="search-item-meta">${a.artist?.name || 'Artista'} · ${a.category}</div>
            </div>
          </div>
        </a>`
      ).join('');
      html += '</div>';
    }

    if (data.mentorships.length) {
      html += `<div class="search-section"><h4>Mentorías (${data.mentorships.length})</h4>`;
      html += data.mentorships.map(m =>
        `<a href="#mentorias" class="search-item" data-section="mentorias" data-title="${m.title.replace(/"/g, '&quot;')}">
          <div class="search-item-inner">
            <div class="search-item-thumb">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="search-item-info">
              <div class="search-item-title">${m.title}</div>
              <div class="search-item-meta">${m.mentor?.name || 'Artista'} · $${m.price}/${m.duration}min</div>
            </div>
          </div>
        </a>`
      ).join('');
      html += '</div>';
    }

    if (data.artists.length) {
      html += `<div class="search-section"><h4>Artistas (${data.artists.length})</h4>`;
      html += data.artists.map(u =>
        `<a href="perfil.html?id=${u._id || u.id}" class="search-item" data-section="perfil">
          <div class="search-item-inner">
            <div class="search-item-thumb">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div class="search-item-info">
              <div class="search-item-title">${u.name}</div>
              <div class="search-item-meta">${u.specialties?.join(', ') || u.bio?.slice(0, 60) || ''}</div>
            </div>
          </div>
        </a>`
      ).join('');
      html += '</div>';
    }

    dropdown.innerHTML = html;

    dropdown.querySelectorAll('.search-item').forEach(el => {
      el.addEventListener('click', (e) => {
        const href = el.getAttribute('href');
        if (href && href.startsWith('perfil.html')) return;
        e.preventDefault();
        const section = el.dataset.section;
        const title = el.dataset.title;
        const btn = document.getElementById('nav-search-btn');
        const searchBox = document.getElementById('nav-search-box');
        const input = document.getElementById('search-input');
        const dropdown = document.getElementById('search-dropdown');
        btn.style.display = '';
        searchBox.style.display = 'none';
        searchBox.classList.remove('open');
        dropdown.classList.remove('open');
        dropdown.innerHTML = '';
        if (input) input.value = '';
        setTimeout(() => {
          const sectionEl = document.getElementById(section);
          if (!sectionEl) return;
          if (!lenis) return;
          lenis.scrollTo(sectionEl, { offset: -80, duration: 1.2, immediate: false });
          if (!title) return;
          setTimeout(() => {
            const card = section === 'galeria'
              ? sectionEl.querySelector(`.photo h3`)
              : section === 'mentorias'
                ? sectionEl.querySelector(`.mentorship-info h3`)
                : null;
            if (!card) return;
            const allCards = section === 'galeria'
              ? sectionEl.querySelectorAll('.photo h3')
              : section === 'mentorias'
                ? sectionEl.querySelectorAll('.mentorship-info h3')
                : null;
            if (!allCards) return;
            for (const h3 of allCards) {
              if (h3.textContent.trim() === title) {
                const cardEl = h3.closest('.photo, .mentorship-card');
                if (cardEl) {
                  cardEl.style.transition = 'box-shadow 0.3s, border-color 0.3s';
                  cardEl.style.boxShadow = '0 0 0 2px rgba(255,255,255,0.3)';
                  cardEl.style.borderColor = 'rgba(255,255,255,0.3)';
                  cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  setTimeout(() => {
                    cardEl.style.boxShadow = '';
                    cardEl.style.borderColor = '';
                  }, 2500);
                }
                break;
              }
            }
          }, 400);
        }, 50);
      });
    });
  } catch {
    dropdown.innerHTML = `
      <div class="search-status">
        <div class="search-status-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p class="search-status-text">Error al buscar</p>
        <p class="search-status-sub">Intentá de nuevo</p>
      </div>`;
  }
}

// =========================
// 5. LIGHTBOX CON NAVEGACIÓN
// =========================

let lightboxData = [];
let lightboxIsLocal = false;

function activarLightbox(data, isLocal) {
  lightboxData = data;
  lightboxIsLocal = isLocal;
  const lightbox = document.querySelector('.lightbox');
  const lightboxImg = document.querySelector('.lightbox-img');
  const closeBtn = document.querySelector('.lightbox-close');
  const prevBtn = document.querySelector('.lightbox-prev');
  const nextBtn = document.querySelector('.lightbox-next');
  const counter = document.querySelector('.lightbox-counter');
  const caption = document.querySelector('.lightbox-caption');
  const galleryContainer = document.getElementById('gallery-container');
  let currentIndex = 0;

  function abrir(index) {
    currentIndex = index;
    const item = lightboxData[index];
    const src = lightboxIsLocal ? item.src : (item.image || item.src);
    const titulo = item.titulo || item.title;
    const desc = item.desc || item.description || '';
    lightboxImg.src = src;
    if (counter) counter.textContent = `${index + 1} / ${lightboxData.length}`;
    if (caption) {
      caption.innerHTML = `<h3>${titulo}</h3><p>${desc}</p>`;
    }
    lightbox.classList.add('active');
    if (lenis) lenis.stop();
  }

  function cerrar() {
    lightbox.classList.remove('active');
    if (lenis) lenis.start();
  }

  function anterior() {
    currentIndex = (currentIndex - 1 + lightboxData.length) % lightboxData.length;
    abrir(currentIndex);
  }

  function siguiente() {
    currentIndex = (currentIndex + 1) % lightboxData.length;
    abrir(currentIndex);
  }

  galleryContainer.addEventListener('click', (e) => {
    const photo = e.target.closest('.photo');
    if (photo) {
      const index = parseInt(photo.dataset.index);
      abrir(index);
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', cerrar);
  if (prevBtn) prevBtn.addEventListener('click', anterior);
  if (nextBtn) nextBtn.addEventListener('click', siguiente);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) cerrar();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') cerrar();
    if (e.key === 'ArrowLeft') anterior();
    if (e.key === 'ArrowRight') siguiente();
  });
}

// =========================
// 5. SCROLL ANIMATION
// =========================

function inicializarObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.dataset.stagger || 0;
        setTimeout(() => {
          el.classList.add('show');
        }, delay);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.photo.hidden').forEach((el, i) => {
    el.dataset.stagger = i * 80;
    observer.observe(el);
  });

  document.querySelectorAll('.hidden:not(.photo), .hidden-left, .hidden-right').forEach(el => {
    observer.observe(el);
  });
}

// =========================
// 6. LOADER
// =========================

window.addEventListener('load', () => {
  const loader = document.querySelector('.loader');
  if (loader) {
    setTimeout(() => loader.classList.add('hidden'), 2200);
  }
});

// =========================
// 7. HERO PARALLAX & NAVBAR
// =========================

function actualizarHeroParallax(e) {
  const hero = document.querySelector('.hero');
  if (hero && e.progress > 0 && e.progress < 0.3) {
    const heroBottom = hero.offsetTop + hero.offsetHeight;
    const scrollInHero = Math.min(e.animatedScroll, heroBottom);
    const offset = (scrollInHero - hero.offsetTop) * 0.15;
    hero.style.transform = `translateY(${offset}px)`;
  }
}

function actualizarNavbar() {
  const navbar = document.querySelector('.navbar');
  if (navbar) navbar.classList.toggle('scrolled', lenis ? lenis.scroll > 50 : window.scrollY > 50);
}

function inicializarHeroEfectos() {
  actualizarNavbar();
}

// =========================
// 9. SCROLL PROGRESS
// =========================

function actualizarScrollProgress(progress) {
  const bar = document.querySelector('.scroll-progress');
  if (bar) {
    bar.style.width = (progress * 100) + '%';
  }
}

function inicializarScrollProgress() {
  actualizarScrollProgress(0);
}

// =========================
// 10. COUNTER ANIMATION
// =========================

function inicializarCounters() {
  const counters = document.querySelectorAll('.artist-badge-number');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target);
        if (target) animarContador(el, target);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

function animarContador(el, target) {
  let current = 0;
  const step = Math.ceil(target / 40);
  const duration = 1500;
  const interval = Math.floor(duration / (target / step));

  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = current;
  }, interval);
}

// =========================
// 11. AUTH
// =========================

function inicializarAuth() {
  actualizarNavAuth();

  const authLink = document.getElementById('nav-auth');
  if (authLink) {
    authLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (token) {
        cerrarSesion();
      } else {
        abrirModal('auth-modal');
      }
    });
  }

  // Modal tabs
  document.querySelectorAll('.modal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
      document.getElementById(`auth-form-${tab.dataset.tab}`).classList.add('active');
    });
  });

  // Modal close
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal').classList.remove('active');
      if (lenis) lenis.start();
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(bg => {
    bg.addEventListener('click', () => {
      bg.closest('.modal').classList.remove('active');
      if (lenis) lenis.start();
    });
  });

  // Login form
  document.getElementById('auth-form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = '';
    const btn = e.target.querySelector('.form-btn');
    btn.disabled = true;
    btn.textContent = 'Ingresando...';

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
      token = data.token;
      currentUser = data.user;
      localStorage.setItem('lumina_token', token);
      localStorage.setItem('lumina_user', JSON.stringify(data.user));
      document.getElementById('auth-modal').classList.remove('active');
      actualizarNavAuth();
      if (lenis) lenis.start();
    } catch (err) {
      errorEl.textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Ingresar';
    }
  });

  // Register form
  document.getElementById('auth-form-register').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const errorEl = document.getElementById('register-error');
    errorEl.textContent = '';
    const btn = e.target.querySelector('.form-btn');
    btn.disabled = true;
    btn.textContent = 'Creando...';

    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrarse');
      token = data.token;
      currentUser = data.user;
      localStorage.setItem('lumina_token', token);
      localStorage.setItem('lumina_user', JSON.stringify(data.user));
      document.getElementById('auth-modal').classList.remove('active');
      actualizarNavAuth();
      if (lenis) lenis.start();
    } catch (err) {
      errorEl.textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Crear cuenta';
    }
  });
}

function actualizarNavAuth() {
  const authLink = document.getElementById('nav-auth');
  const uploadLink = document.getElementById('nav-upload');
  const dashLink = document.getElementById('nav-dashboard');
  const adminLink = document.getElementById('nav-admin');

  if (token) {
    if (authLink) authLink.textContent = 'Cerrar sesión';
    if (uploadLink) uploadLink.style.display = '';
    if (dashLink) dashLink.style.display = '';
    if (adminLink) {
      // Check if user is admin
      try {
        const user = JSON.parse(localStorage.getItem('lumina_user') || '{}');
        adminLink.style.display = user.role === 'admin' ? '' : 'none';
      } catch { adminLink.style.display = 'none'; }
    }
  } else {
    if (authLink) authLink.textContent = 'Ingresar';
    if (uploadLink) uploadLink.style.display = 'none';
    if (dashLink) dashLink.style.display = 'none';
    if (adminLink) adminLink.style.display = 'none';
  }
}

function cerrarSesion() {
  token = null;
  currentUser = null;
  localStorage.removeItem('lumina_token');
  localStorage.removeItem('token');
  localStorage.removeItem('lumina_user');
  localStorage.removeItem('user');
  actualizarNavAuth();
}

function abrirModal(id) {
  document.getElementById(id).classList.add('active');
  if (lenis) lenis.stop();
}

// =========================
// 12. UPLOAD
// =========================

function inicializarUpload() {
  document.getElementById('nav-upload').addEventListener('click', (e) => {
    e.preventDefault();
    if (!token) {
      abrirModal('auth-modal');
      return;
    }
    abrirModal('upload-modal');
  });

  document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const errorEl = document.getElementById('upload-error');
    const successEl = document.getElementById('upload-success');
    errorEl.textContent = '';
    successEl.textContent = '';

    const formData = new FormData();
    formData.append('title', document.getElementById('upload-title').value);
    formData.append('description', document.getElementById('upload-description').value);
    formData.append('category', document.getElementById('upload-category').value);
    formData.append('tags', document.getElementById('upload-tags').value);
    formData.append('image', document.getElementById('upload-image').files[0]);

    const btn = e.target.querySelector('.form-btn');
    btn.disabled = true;
    btn.textContent = 'Publicando...';

    try {
      const res = await fetch(`${API}/artworks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al publicar');
      successEl.textContent = 'Obra publicada con éxito';
      e.target.reset();
      setTimeout(() => {
        document.getElementById('upload-modal').classList.remove('active');
        if (lenis) lenis.start();
        cargarGaleria();
      }, 1500);
    } catch (err) {
      errorEl.textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Publicar obra';
    }
  });
}

// =========================
// 13. NOTIFICACIONES
// =========================

let notifPollInterval = null;

function inicializarNotificaciones() {
  actualizarNotifVisibilidad();

  const btn = document.getElementById('nav-notif-btn');
  const dropdown = document.getElementById('nav-notif-dropdown');

  if (!btn) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropdown.classList.contains('open')) {
      cerrarNotifDropdown();
    } else {
      abrirNotifDropdown();
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-notif-item')) {
      cerrarNotifDropdown();
    }
  });
}

function actualizarNotifVisibilidad() {
  const item = document.querySelector('.nav-notif-item');
  if (item) {
    item.style.display = token ? '' : 'none';
  }
  if (token) {
    iniciarNotifPolling();
  } else {
    detenerNotifPolling();
    const badge = document.getElementById('nav-notif-badge');
    if (badge) badge.style.display = 'none';
  }
}

function iniciarNotifPolling() {
  detenerNotifPolling();
  actualizarUnreadCount();
  notifPollInterval = setInterval(actualizarUnreadCount, 15000);
}

function detenerNotifPolling() {
  if (notifPollInterval) {
    clearInterval(notifPollInterval);
    notifPollInterval = null;
  }
}

async function actualizarUnreadCount() {
  if (!token) return;
  try {
    const res = await fetch(`${API}/notifications/unread-count`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    const badge = document.getElementById('nav-notif-badge');
    if (badge) {
      if (data.unread > 0) {
        badge.textContent = data.unread > 99 ? '99+' : data.unread;
        badge.style.display = '';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch {}
}

async function abrirNotifDropdown() {
  const dropdown = document.getElementById('nav-notif-dropdown');
  if (!dropdown) return;

  dropdown.innerHTML = `
    <div class="notif-status">
      <div class="notif-status-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      </div>
      <p class="notif-status-text">Cargando...</p>
    </div>`;
  dropdown.classList.add('open');

  if (!token) return;

  try {
    const res = await fetch(`${API}/notifications?limit=15`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();

    if (!data.notifications?.length) {
      dropdown.innerHTML = `
        <div class="notif-status">
          <div class="notif-status-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <p class="notif-status-text">Sin notificaciones</p>
          <p class="notif-status-sub">No tenés novedades por ahora</p>
        </div>`;
      return;
    }

    let html = '<div class="notif-header">';
    html += '<span class="notif-title">Notificaciones</span>';
    html += '<button class="notif-read-all" id="notif-read-all-btn">Marcar todas leídas</button>';
    html += '</div>';

    html += data.notifications.map(n => {
      const timeAgo = formatearTiempo(n.createdAt);
      const typeIcon = {
        review: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        booking: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        mentorship: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        system: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
      }[n.type] || '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
      return `
        <div class="notif-item ${n.read ? 'notif-read' : 'notif-unread'}" data-id="${n._id}">
          <span class="notif-icon">${typeIcon}</span>
          <div class="notif-body">
            <p class="notif-msg">${n.message}</p>
            <span class="notif-time">${timeAgo}</span>
          </div>
        </div>
      `;
    }).join('');

    dropdown.innerHTML = html;

    dropdown.querySelectorAll('.notif-item.notif-unread').forEach(el => {
      el.addEventListener('click', async () => {
        const id = el.dataset.id;
        try {
          await fetch(`${API}/notifications/${id}/read`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` },
          });
          el.classList.remove('notif-unread');
          el.classList.add('notif-read');
          actualizarUnreadCount();
        } catch {}
      });
    });

    const readAllBtn = document.getElementById('notif-read-all-btn');
    if (readAllBtn) {
      readAllBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await fetch(`${API}/notifications/read-all`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` },
          });
          dropdown.querySelectorAll('.notif-item.notif-unread').forEach(el => {
            el.classList.remove('notif-unread');
            el.classList.add('notif-read');
          });
          const badge = document.getElementById('nav-notif-badge');
          if (badge) badge.style.display = 'none';
        } catch {}
      });
    }
  } catch {
    dropdown.innerHTML = '<p class="notif-empty">Error al cargar</p>';
  }
}

function cerrarNotifDropdown() {
  const dropdown = document.getElementById('nav-notif-dropdown');
  if (dropdown) {
    dropdown.classList.remove('open');
  }
}

function formatearTiempo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

// Override actualizarNavAuth to also update notifications
const _originalActualizarNavAuth = actualizarNavAuth;
actualizarNavAuth = function () {
  _originalActualizarNavAuth();
  actualizarNotifVisibilidad();
};
