/* =============================================================
   GRUPO DISEÑO — main.js
   ============================================================= */

/* --- Intro / Splash --- */
(function () {
  const intro = document.getElementById('intro');
  if (!intro) return;

  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    intro.classList.add('is-hiding');
    intro.addEventListener('animationend', () => {
      intro.remove();
      document.body.style.overflow = '';
    }, { once: true });
  }, 1500);
})();

/* --- Header transparente sobre portada --- */
(function () {
  const header  = document.querySelector('.site-header');
  const portada = document.getElementById('portada');
  if (!header || !portada) return;

  const observer = new IntersectionObserver(
    ([entry]) => header.classList.toggle('is-transparent', entry.isIntersecting),
    { threshold: 0.05 }
  );
  observer.observe(portada);

  /* Estado inicial (sin esperar scroll) */
  header.classList.add('is-transparent');
})();

/* --- Año dinámico en footer --- */
const anioEl = document.getElementById('anio-actual');
if (anioEl) anioEl.textContent = new Date().getFullYear();

/* --- Menú mobile --- */
const navToggle = document.querySelector('.nav-toggle');
const navMenu   = document.querySelector('.nav-menu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const open = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(open));
  });

  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* --- Scroll suave compensando header sticky --- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const id = anchor.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const headerH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--header-h'),
      10
    );
    const top = target.getBoundingClientRect().top + window.scrollY - headerH;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* --- Sección activa en navbar --- */
(function () {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const headerH = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10
  ) || 96;

  function setActive(id) {
    navLinks.forEach(link => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        const hasLink = [...navLinks].some(l => l.getAttribute('href') === `#${id}`);
        if (hasLink) {
          setActive(id);
        } else {
          navLinks.forEach(l => l.classList.remove('is-active'));
        }
      });
    },
    { rootMargin: `-${headerH}px 0px -55% 0px`, threshold: 0 }
  );

  sections.forEach(s => observer.observe(s));
})();

/* --- Scroll Reveal --- */
(function () {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const revealSiblings = Array.from(entry.target.parentElement?.children ?? [])
          .filter(c => c.classList.contains('reveal'));
        const idx = revealSiblings.indexOf(entry.target);
        entry.target.style.transitionDelay = `${Math.max(0, idx) * 0.1}s`;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.10, rootMargin: '0px 0px -50px 0px' }
  );

  els.forEach(el => io.observe(el));
})();

/* --- Contadores animados (estadísticas Quiénes somos) --- */
(function () {
  const counters = document.querySelectorAll('.qs-stat-num[data-target]');
  if (!counters.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        io.unobserve(el);

        if (prefersReduced) { el.textContent = target; return; }

        const duration = 1400;
        const startTime = performance.now();

        function tick(now) {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target);
          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(el => io.observe(el));
})();

/* --- Project Viewer (galería split: thumbs + foto principal) --- */
(function () {
  const viewer      = document.getElementById('project-viewer');
  const tituloEl    = document.getElementById('viewer-titulo');
  const descEl      = document.getElementById('viewer-desc');
  const thumbsEl    = document.getElementById('viewer-thumbs');
  const fotoEl      = document.getElementById('viewer-foto');
  const btnCerrar   = document.getElementById('viewer-cerrar');
  const btnPrev     = document.getElementById('viewer-prev');
  const btnNext     = document.getElementById('viewer-next');

  if (!viewer) return;

  let imagenes = [];
  let idx = 0;

  function mostrarFoto(n) {
    idx = (n + imagenes.length) % imagenes.length;
    const src = imagenes[idx];
    fotoEl.src = src;
    fotoEl.alt = `Imagen ${idx + 1} de ${imagenes.length}`;
    fotoEl.closest('.viewer-main').style.backgroundImage = `url('${src}')`;

    thumbsEl.querySelectorAll('.thumb-item').forEach((t, i) => {
      t.classList.toggle('is-active', i === idx);
      if (i === idx) t.scrollIntoView({ block: 'nearest' });
    });
  }

  function abrir(card) {
    const raw = card.dataset.images || '';
    imagenes = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (!imagenes.length) return;

    tituloEl.textContent = card.dataset.titulo || '';
    descEl.textContent   = card.dataset.desc   || '';

    /* Construir miniaturas */
    thumbsEl.innerHTML = '';
    imagenes.forEach((src, i) => {
      const btn = document.createElement('button');
      btn.className = 'thumb-item';
      btn.setAttribute('aria-label', `Ver imagen ${i + 1}`);
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.loading = 'lazy';
      btn.appendChild(img);
      btn.addEventListener('click', () => mostrarFoto(i));
      thumbsEl.appendChild(btn);
    });

    viewer.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    mostrarFoto(0);
    btnCerrar.focus();
  }

  function cerrar() {
    viewer.setAttribute('hidden', '');
    document.body.style.overflow = '';
    fotoEl.src = '';
    thumbsEl.innerHTML = '';
    imagenes = [];
  }

  /* Abrir al clickear una tarjeta de proyecto */
  const galeriaGrid = document.querySelector('.galeria-grid');
  if (galeriaGrid) {
    galeriaGrid.addEventListener('click', e => {
      const card = e.target.closest('.proyecto-card');
      if (card) abrir(card);
    });
    galeriaGrid.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.proyecto-card');
        if (card) { e.preventDefault(); abrir(card); }
      }
    });
  }

  btnCerrar.addEventListener('click', cerrar);
  btnPrev.addEventListener('click', () => mostrarFoto(idx - 1));
  btnNext.addEventListener('click', () => mostrarFoto(idx + 1));

  document.addEventListener('keydown', e => {
    if (viewer.hasAttribute('hidden')) return;
    if (e.key === 'Escape')     cerrar();
    if (e.key === 'ArrowLeft')  mostrarFoto(idx - 1);
    if (e.key === 'ArrowRight') mostrarFoto(idx + 1);
  });
})();

/* --- Galería: fallback color cuando no hay foto --- */
(function () {
  document.querySelectorAll('.proyecto-card img.proyecto-thumb').forEach(img => {
    img.addEventListener('error', () => {
      const match = img.src.match(/proyecto-(\d+)/);
      const num = match ? match[1] : '';
      const div = document.createElement('div');
      div.className = `proyecto-thumb${num ? ` proyecto-thumb--${num}` : ''}`;
      img.replaceWith(div);
    });
  });
})();

/* --- Galería: botón Ver más / Ver menos --- */
(function () {
  const btn  = document.getElementById('galeria-ver-mas');
  const grid = document.querySelector('.galeria-grid');
  if (!btn || !grid) return;

  const label = btn.querySelector('.galeria-ver-mas-label');

  btn.addEventListener('click', () => {
    const expanded = grid.classList.toggle('is-expanded');
    btn.setAttribute('aria-expanded', String(expanded));
    label.textContent = expanded ? 'Ver menos' : 'Ver más';

    if (!expanded) {
      grid.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
})();
