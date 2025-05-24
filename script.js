// ===== GLOBAL LIGHTBOX & OPEN FUNCTION =====
const lightbox    = document.getElementById('lightbox');
const lbImg       = lightbox.querySelector('.lightbox-img');
const lbClose     = lightbox.querySelector('.lightbox-close');
const lbPrevBtn   = lightbox.querySelector('.lightbox-prev');
const lbNextBtn   = lightbox.querySelector('.lightbox-next');

window.lbContext  = null;   // 'product' or 'preview'
window.lbCurrent  = 0;

// Open LB on a given <img> element
function openLightbox(imgEl, context, idx) {
  window.lbContext = context;
  window.lbCurrent = idx;
  lbImg.src        = imgEl.dataset.fullres || imgEl.src;
  lightbox.classList.add('active');
}

// Close LB
lbClose.addEventListener('click', () => lightbox.classList.remove('active'));
lightbox.addEventListener('click', e => {
  if (e.target === lightbox) lightbox.classList.remove('active');
});

// LB navigation
lbPrevBtn.addEventListener('click', () => navigateLightbox(-1));
lbNextBtn.addEventListener('click', () => navigateLightbox(1));

function navigateLightbox(delta) {
  let arr;
  if (window.lbContext === 'product') {
    arr = Array.from(document.querySelectorAll('#productSlider img'));
  } else {
    arr = window.previewSlides;
  }
  window.lbCurrent = (window.lbCurrent + delta + arr.length) % arr.length;
  const nextImg   = arr[window.lbCurrent];
  lbImg.src       = nextImg.dataset.fullres || nextImg.src;
}

// keyboard for LB
document.addEventListener('keydown', e => {
  if (lightbox.classList.contains('active')) {
    if (e.key === 'ArrowLeft')  lbPrevBtn.click();
    if (e.key === 'ArrowRight') lbNextBtn.click();
    if (e.key === 'Escape')     lbClose.click();
  }
});


// ===== PRODUCT SLIDER =====
(() => {
  const slider      = document.getElementById('productSlider');
  const slides      = Array.from(slider.querySelectorAll('img'));
  const prevBtn     = slider.querySelector('.prev');
  const nextBtn     = slider.querySelector('.next');
  let currentIndex  = 0;

  function showProduct(i) {
    currentIndex = (i + slides.length) % slides.length;
    slides.forEach((img, idx) => {
      const active = idx === currentIndex;
      img.classList.toggle('active', active);
      img.style.pointerEvents = active ? 'auto' : 'none';
      img.style.zIndex        = active ? '1' : '0';
      img.style.cursor        = 'zoom-in';
    });
  }

  prevBtn.addEventListener('click', () => showProduct(currentIndex - 1));
  nextBtn.addEventListener('click', () => showProduct(currentIndex + 1));

  slides.forEach((img, idx) => {
    img.addEventListener('click', () => {
      openLightbox(img, 'product', idx);
    });
  });

  showProduct(0);
})();


// ===== PREVIEW SLIDER (INFINITE LOOP + HOVER-PAUSE) =====
(() => {
  const slider   = document.getElementById('previewSlider');
  const track    = slider.querySelector('.track');
  const orig     = Array.from(track.children);       // the real .slide elements
  const btnPrev  = document.getElementById('psPrev');
  const btnNext  = document.getElementById('psNext');

  // expose for LB nav: array of original <img> elements
  window.previewSlides = orig.map((slide, idx) => {
    const img = slide.querySelector('img');
    img.dataset.index = idx;
    return img;
  });

  const VISIBLE  = 6;  // must match your CSS
  const GAP      = parseInt(getComputedStyle(slider).getPropertyValue('--slider-gap')) || 10;
  const CARDW    = parseInt(getComputedStyle(slider).getPropertyValue('--card-w')) + GAP;
  const TOTAL    = orig.length;

  // 1) Clone tail & head for seamless loop, tag clones with original index
  orig.slice(-VISIBLE).forEach(slide => {
    const c = slide.cloneNode(true);
    c.classList.add('clone');
    const img = c.querySelector('img');
    img.dataset.index = slide.querySelector('img').dataset.index;
    track.insertBefore(c, track.firstChild);
  });
  orig.slice(0, VISIBLE).forEach(slide => {
    const c = slide.cloneNode(true);
    c.classList.add('clone');
    const img = c.querySelector('img');
    img.dataset.index = slide.querySelector('img').dataset.index;
    track.appendChild(c);
  });

  let idx = VISIBLE;
  let timer;

  // 2) Move to `idx`
  function move(instant = false) {
    track.style.transition = instant ? 'none' : 'transform .6s ease';
    track.style.transform  = `translateX(${-idx * CARDW}px)`;
  }

  // 3) After each transition, fix idx if we're on a clone
  function checkLoop() {
    if (idx >= TOTAL + VISIBLE) idx = VISIBLE;
    else if (idx < VISIBLE)     idx = TOTAL + idx;
    else                         return;
    move(true);
    requestAnimationFrame(() => {
      track.style.transition = 'transform .6s ease';
    });
  }
  track.addEventListener('transitionend', checkLoop);

  // 4) Prev/Next
  function showNext() { idx++; move(); }
  function showPrev() { idx--; move(); }
  btnNext.addEventListener('click', () => { showNext(); restartAuto(); });
  btnPrev.addEventListener('click', () => { showPrev(); restartAuto(); });

  // 5) Auto + hover/pause
  function startAuto() {
    stopAuto();
    timer = setInterval(showNext, 3000);
  }
  function stopAuto() {
    clearInterval(timer);
  }
  function restartAuto() {
    stopAuto();
    startAuto();
  }
  slider.addEventListener('mouseenter', stopAuto);
  slider.addEventListener('mouseleave', startAuto);

  // 6) Click-to-zoom on **all** (orig+clone) slides via delegation
  track.addEventListener('click', e => {
    const img = e.target.closest('img');
    if (!img || !img.dataset.index) return;
    const i = parseInt(img.dataset.index, 10);
    openLightbox(img, 'preview', i);
  });

  // 7) Keyboard nav for preview (when LB closed)
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('active')) {
      if (e.key === 'ArrowLeft')  btnPrev.click();
      if (e.key === 'ArrowRight') btnNext.click();
    }
  });

  // INIT
  move(true);   // jump immediately into place
  startAuto();  // and start sliding
})();
