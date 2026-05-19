// MENU MOBILE

const menuToggle = document.querySelector('.menu-toggle');

const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', () => {

  navLinks.classList.toggle('active');

});


// SCROLL ANIMATION

const hiddenElements = document.querySelectorAll('.hidden');

const observer = new IntersectionObserver((entries) => {

  entries.forEach((entry) => {

    if(entry.isIntersecting){

      entry.target.classList.add('show');

    }

  });

});

hiddenElements.forEach((el) => observer.observe(el));


// LIGHTBOX

const photos = document.querySelectorAll('.photo img');

const lightbox = document.querySelector('.lightbox');

const lightboxImg = document.querySelector('.lightbox-img');

const closeBtn = document.querySelector('.close');

photos.forEach((photo) => {

  photo.addEventListener('click', () => {

    lightbox.style.display = 'flex';

    lightboxImg.src = photo.src;

  });

});

closeBtn.addEventListener('click', () => {

  lightbox.style.display = 'none';

});


// LOADER

window.addEventListener('load', () => {

  const loader = document.querySelector('.loader');

  setTimeout(() => {

    loader.style.opacity = '0';

    setTimeout(() => {

      loader.style.display = 'none';

    }, 1000);

  }, 2000);

});


// CUSTOM CURSOR

const cursor = document.querySelector('.cursor');

document.addEventListener('mousemove', (e) => {

  if(cursor){

    cursor.style.left = e.clientX + 'px';

    cursor.style.top = e.clientY + 'px';

  }

});


// PARALLAX HERO

const hero = document.querySelector('.hero');

window.addEventListener('scroll', () => {

  if(window.scrollY < window.innerHeight){

    let scrollPosition = window.scrollY;

    hero.style.transform =
    `translateY(${scrollPosition * 0.15}px)`;

  }

});
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {

  if(window.scrollY > 50){

    navbar.classList.add('scrolled');

  }else{

    navbar.classList.remove('scrolled');

  }

});
const galleryImages = document.querySelectorAll('.photo img');

window.addEventListener('scroll', () => {

  let scroll = window.scrollY;

  galleryImages.forEach((img, index) => {

    img.style.transform =
    `translateY(${scroll * 0.02}px) scale(1.05)`;

  });

});
const magneticButton = document.querySelector('.hero-content button');

magneticButton.addEventListener('mousemove', (e) => {

  const rect = magneticButton.getBoundingClientRect();

  const x = e.clientX - rect.left - rect.width / 2;

  const y = e.clientY - rect.top - rect.height / 2;

  magneticButton.style.transform =
  `translate(${x * 0.2}px, ${y * 0.2}px)`;

});

magneticButton.addEventListener('mouseleave', () => {

  magneticButton.style.transform =
  'translate(0,0)';

});