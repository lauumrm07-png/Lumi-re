(function () {
  'use strict';

  const header = document.querySelector('header');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-menu a');

  function onScroll() {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function toggleMenu(force) {
    const isOpen = force !== undefined ? force : navMenu.classList.contains('open');
    navMenu.classList.toggle('open', !isOpen);
    navToggle.setAttribute('aria-expanded', !isOpen);
    navToggle.setAttribute('aria-label', isOpen ? 'Abrir menú' : 'Cerrar menú');
    document.body.style.overflow = isOpen ? '' : 'hidden';
  }

  navToggle.addEventListener('click', function () {
    toggleMenu();
  });

  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        const wasOpen = navMenu.classList.contains('open');
        if (wasOpen) toggleMenu(true);
        setTimeout(function () {
          target.scrollIntoView({ behavior: 'smooth' });
        }, wasOpen ? 350 : 0);
      }
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navMenu.classList.contains('open')) {
      toggleMenu(true);
    }
  });

  // --- Lista de espera ---
  const waitlistForm = document.getElementById('waitlist-form');
  if (waitlistForm) {
    const status = document.getElementById('waitlist-status');

    function showStatus(message) {
      waitlistForm.hidden = true;
      status.hidden = false;
      status.textContent = message;
    }

    waitlistForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const action = waitlistForm.getAttribute('action') || '';

      // Modo demostración: mientras no se configure el servicio de correos,
      // mostramos el mensaje de éxito para que se vea el comportamiento real.
      if (action.indexOf('TU_ID_DE_FORMSPREE') !== -1) {
        showStatus('¡Gracias! Te avisaremos en cuanto Aurart abra. (Nota para Laura: falta conectar el servicio de correos para guardar los registros de verdad.)');
        return;
      }

      const submitBtn = waitlistForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      fetch(action, {
        method: 'POST',
        body: new FormData(waitlistForm),
        headers: { Accept: 'application/json' },
      })
        .then(function (response) {
          if (response.ok) {
            showStatus('¡Gracias! Ya estás en la lista. Te avisaremos en cuanto Aurart abra sus puertas.');
          } else {
            if (submitBtn) submitBtn.disabled = false;
            showStatus('Ups, algo falló. Escríbenos a lauumrm07@gmail.com y te agregamos a mano.');
          }
        })
        .catch(function () {
          if (submitBtn) submitBtn.disabled = false;
          showStatus('Ups, algo falló. Escríbenos a lauumrm07@gmail.com y te agregamos a mano.');
        });
    });
  }

  const revealElements = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    revealElements.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }
})();
