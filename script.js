const menuToggle = document.querySelector('.menu-toggle');

const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});


const hiddenElements = document.querySelectorAll('.hidden');

const observer = new IntersectionObserver((entries) => {

  entries.forEach((entry) => {

    if(entry.isIntersecting){
      entry.target.classList.add('show');
    }

  });

});

hiddenElements.forEach((el) => observer.observe(el));


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


window.addEventListener('load', () => {

  const loader = document.querySelector('.loader');

  setTimeout(() => {

    loader.style.opacity = '0';

    setTimeout(() => {

      loader.style.display = 'none';

    }, 1000);

  }, 2000);

});


const cursor = document.querySelector('.cursor');

document.addEventListener('mousemove', (e) => {

  if(cursor){

    cursor.style.left = e.clientX + 'px';

    cursor.style.top = e.clientY + 'px';

  }

});