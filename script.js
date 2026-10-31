/* =========================================================
   CALINE MENDES | Corretora de Imóveis
   Interações e animações
   ========================================================= */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ---------------------------------------------------
     1) SPLIT DE TEXTO — revelação palavra por palavra
     --------------------------------------------------- */
  const splitWords = (el) => {
    const source = [...el.childNodes];
    let i = 0;
    el.textContent = '';

    const build = (nodes, target) => {
      nodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          node.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              target.appendChild(document.createTextNode(' '));
              return;
            }
            const mask = document.createElement('span');
            mask.className = 'word-mask';
            const word = document.createElement('span');
            word.className = 'word';
            word.style.setProperty('--wd', `${(0.18 + i * 0.07).toFixed(2)}s`);
            word.textContent = part;
            i += 1;
            mask.appendChild(word);
            target.appendChild(mask);
          });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const clone = node.cloneNode(false);
          target.appendChild(clone);
          build([...node.childNodes], clone);
        }
      });
    };

    build(source, el);
  };

  $$('[data-split]').forEach(splitWords);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      $$('[data-split]').forEach((el) => el.classList.add('words-ready'));
    });
  });

  /* ---------------------------------------------------
     2) REVEAL NO SCROLL
     --------------------------------------------------- */
  const revealTargets = $$('[data-anim], [data-stagger], .section-header');

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in', 'visible');
        io.unobserve(entry.target);
        // libera delays de hover depois que a entrada termina
        setTimeout(() => entry.target.classList.add('revealed'), 1500);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('in', 'visible', 'revealed'));
  }

  /* ---------------------------------------------------
     3) HEADER — sólido ao rolar / esconde ao descer
     --------------------------------------------------- */
  const header = $('.header');
  let lastY = window.scrollY;

  const onScrollHeader = () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 40);

    if (!reduceMotion && y > 420 && y > lastY + 4) {
      header.classList.add('hidden');
    } else if (y < lastY - 4 || y < 200) {
      header.classList.remove('hidden');
    }
    lastY = y;
  };

  /* ---------------------------------------------------
     4) BARRA DE PROGRESSO
     --------------------------------------------------- */
  const progress = $('.scroll-progress');
  const onProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
  };

  /* ---------------------------------------------------
     5) PARALLAX DO HERO (rAF)
     --------------------------------------------------- */
  const heroImage = $('.hero-image');
  const heroGlow = $('.hero-glow');
  let ticking = false;

  const parallax = () => {
    const y = window.scrollY;
    if (heroImage && y < window.innerHeight * 1.2) {
      heroImage.style.transform = `translate3d(0, ${(y * 0.07).toFixed(1)}px, 0)`;
      if (heroGlow) heroGlow.style.transform = `translate3d(0, ${(y * 0.12).toFixed(1)}px, 0)`;
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      onScrollHeader();
      onProgress();
      if (!reduceMotion) parallax();
      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScrollHeader();
  onProgress();

  /* ---------------------------------------------------
     6) MENU MOBILE
     --------------------------------------------------- */
  const menuToggle = $('#menuToggle');
  const navLinks = $('#navLinks');

  const closeMenu = () => {
    menuToggle?.classList.remove('open');
    navLinks?.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    header.classList.remove('hidden');
  };

  menuToggle?.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuToggle.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    if (open) header.classList.remove('hidden');
  });

  $$('#navLinks a').forEach((a) => a.addEventListener('click', closeMenu));
  window.addEventListener('resize', () => {
    if (window.innerWidth > 860) closeMenu();
  });

  /* ---------------------------------------------------
     7) FAQ
     --------------------------------------------------- */
  const faqItems = $$('.faq-item');

  faqItems.forEach((item) => {
    const question = $('.faq-question', item);
    const answer = $('.faq-answer', item);

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');

      faqItems.forEach((other) => {
        other.classList.remove('active');
        $('.faq-question', other).setAttribute('aria-expanded', 'false');
        $('.faq-answer', other).style.maxHeight = '';
      });

      if (!isOpen) {
        item.classList.add('active');
        question.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = `${answer.scrollHeight}px`;
      }
    });
  });

  /* ---------------------------------------------------
     8) SCROLL SUAVE COM OFFSET
     --------------------------------------------------- */
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;

      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      const offset = 74;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* ---------------------------------------------------
     9) BOTÕES MAGNÉTICOS
     --------------------------------------------------- */
  if (!reduceMotion && finePointer) {
    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / r.width;
        const y = (e.clientY - r.top - r.height / 2) / r.height;
        btn.style.transform = `translate(${(x * 10).toFixed(1)}px, ${(y * 8).toFixed(1)}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------
     10) CARDS 3D + SPOTLIGHT
     --------------------------------------------------- */
  if (!reduceMotion && finePointer) {
    $$('.tilt').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;

        card.style.setProperty('--mx', `${px * 100}%`);
        card.style.setProperty('--my', `${py * 100}%`);
        card.style.transform =
          `perspective(900px) translateY(-8px) rotateX(${((0.5 - py) * 9).toFixed(2)}deg) rotateY(${((px - 0.5) * 9).toFixed(2)}deg) scale(1.02)`;
      });

      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------
     11) LIGHTBOX DA GALERIA
     --------------------------------------------------- */
  const items = $$('.galeria-item');
  const lightbox = $('#lightbox');
  const lbImg = $('img', lightbox);
  let current = 0;

  const openLightbox = (index) => {
    current = (index + items.length) % items.length;
    lbImg.src = items[current].dataset.full;
    lbImg.alt = $('img', items[current])?.alt || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  items.forEach((item, index) => {
    item.addEventListener('click', () => openLightbox(index));
  });

  $('.lb-close', lightbox).addEventListener('click', closeLightbox);
  $('.lb-prev', lightbox).addEventListener('click', () => openLightbox(current - 1));
  $('.lb-next', lightbox).addEventListener('click', () => openLightbox(current + 1));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') openLightbox(current + 1);
    if (e.key === 'ArrowLeft') openLightbox(current - 1);
  });

  /* ---------------------------------------------------
     12) LINK ATIVO NO MENU
     --------------------------------------------------- */
  const sections = $$('section[id]');
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        $$('#navLinks a').forEach((a) => {
          a.style.color = a.getAttribute('href') === `#${id}` ? 'var(--dourado)' : '';
        });
      });
    }, { threshold: 0.35 });

    sections.forEach((s) => navObserver.observe(s));
  }
})();
