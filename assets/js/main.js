/* RJ's Paint Shop — interactions & scroll motion */
(function () {
  'use strict';

  var root = document.documentElement;
  var scriptSrc = (document.currentScript && document.currentScript.src) || '';
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger && window.SplitText);
  var lenis = null;

  var header = $('[data-header]');
  var headerHeight = function () { return header ? header.offsetHeight : 0; };

  // Pages without the full landing layout (legal pages) share this script.
  var isHome = !!$('.hero');

  initYear();
  initOpenStatus();
  initEstimateForm();

  var animated = hasGsap && !reduceMotion;

  if (animated) {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    if (window.DrawSVGPlugin) gsap.registerPlugin(DrawSVGPlugin);
    if (window.MotionPathPlugin) gsap.registerPlugin(MotionPathPlugin);
    initSmoothScroll();
  }

  initHeader();
  initMenu();
  initAnchors();
  initFooterWord();
  initTach();
  initFaq();
  initSwatches();

  if (hasGsap && !reduceMotion && isHome) {
    whenFontsReady(function () {
      initHeroIntro();
      initHeroScroll();
      initServices();
      initExplode();
      initTicker();
      initReveals();
      initSplitHeadings();
      initStatement();
      initParallax();
      initAbout();
      initReviews();
      initGauges();
      initProcess();
      initTrustIcons();
      initMagnetic();
      initNavSpy();
      root.classList.add('is-ready');
      ScrollTrigger.refresh();
    });
  } else {
    if (hasGsap && isHome) {
      gsap.registerPlugin(ScrollTrigger);
      initNavSpy();
      initServicesStatic();
    }
    if (isHome) {
      loadCar();
      initGauges();
      $$('.step').forEach(function (el) { el.classList.add('is-lit'); });
    }
    root.classList.remove('js');
    root.classList.add('is-ready');
  }

  /* ------------------------------------------------------------------ */

  function whenFontsReady(cb) {
    var done = false;
    var run = function () { if (!done) { done = true; cb(); } };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
    setTimeout(run, 1200);
  }

  function gutter() {
    return parseFloat(getComputedStyle($('.container') || document.body).paddingLeft) || 16;
  }

  function initYear() {
    $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
  }

  /* ---------- Smooth scroll (Lenis driven by GSAP's ticker) ---------- */
  function initSmoothScroll() {
    if (!window.Lenis) return;
    lenis = new Lenis({ lerp: 0.095, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(target, done) {
    var isSection = target.tagName === 'SECTION';
    var offset = isSection ? 0 : -(headerHeight() + 24);
    if (target.id === 'top') {
      if (lenis) lenis.scrollTo(0, { duration: 1.6, onComplete: done });
      else { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); done(); }
      return;
    }
    if (lenis) {
      lenis.scrollTo(target, { offset: offset, duration: 1.6, onComplete: done });
    } else {
      var y = target.getBoundingClientRect().top + window.pageYOffset + offset;
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
      done();
    }
  }

  function initAnchors() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var hash = a.getAttribute('href');
      if (hash.length < 2) return;
      var target = document.getElementById(hash.slice(1));
      if (!target) return;
      e.preventDefault();
      closeMenu(false);
      scrollToTarget(target, function () {
        if (target.id !== 'top') {
          if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
      });
      if (history.replaceState) history.replaceState(null, '', hash === '#top' ? location.pathname : hash);
    });
  }

  /* ---------- Header ---------- */
  function initHeader() {
    if (!header) return;
    var lastY = window.pageYOffset;
    var update = function (y) {
      header.classList.toggle('is-scrolled', y > 24);
      var delta = y - lastY;
      if (Math.abs(delta) > 6) {
        var menuOpen = document.body.classList.contains('menu-open');
        header.classList.toggle('is-hidden', !menuOpen && delta > 0 && y > 480);
        lastY = y;
      }
    };
    if (lenis) lenis.on('scroll', function (l) { update(l.scroll); });
    else window.addEventListener('scroll', function () { update(window.pageYOffset); }, { passive: true });
    update(lastY);
    header.addEventListener('focusin', function () { header.classList.remove('is-hidden'); });
  }

  /* ---------- Mobile menu ---------- */
  var menu, toggle;
  function initMenu() {
    menu = $('[data-menu]');
    toggle = $('[data-menu-toggle]');
    if (!menu || !toggle) return;
    toggle.addEventListener('click', function () {
      if (menu.hidden) openMenu(); else closeMenu(true);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) closeMenu(true);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 960 && !menu.hidden) closeMenu(false);
    });
  }

  function setInert(on) {
    ['main', '.site-footer', '.skip-link'].forEach(function (sel) {
      var el = $(sel);
      if (el) el.inert = on;
    });
  }

  function openMenu() {
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    $('.menu-toggle__label', toggle).textContent = 'Close';
    document.body.classList.add('menu-open');
    header.classList.remove('is-hidden');
    setInert(true);
    if (lenis) lenis.stop(); else document.body.style.overflow = 'hidden';
    if (hasGsap && !reduceMotion) {
      gsap.fromTo(menu, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'expo.inOut' });
      gsap.fromTo($$('.mobile-menu__links li, .mobile-menu__foot > *', menu),
        { y: 40, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.05, ease: 'expo.out', delay: 0.25 });
    }
    var first = $('a', menu);
    if (first) first.focus({ preventScroll: true });
  }

  function closeMenu(returnFocus) {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    $('.menu-toggle__label', toggle).textContent = 'Menu';
    document.body.classList.remove('menu-open');
    setInert(false);
    if (lenis) lenis.start(); else document.body.style.overflow = '';
    if (returnFocus) toggle.focus();
  }

  /* ---------- Hero ---------- */
  function initHeroIntro() {
    var title = $('[data-hero-title]');
    var fades = $$('[data-hero-fade]');
    var media = $('[data-hero-media]');
    var picture = $('picture', media);
    var img = $('img', media);

    var split = SplitText.create($$('.hero__line', title), { type: 'lines', mask: 'lines', linesClass: 'split-line' });
    gsap.set([title, media], { visibility: 'visible' });

    var tl = gsap.timeline({
      defaults: { ease: 'expo.out' },
      onComplete: function () { split.revert(); }
    });
    tl.from(split.lines, { yPercent: 115, duration: 1.5, stagger: 0.1 }, 0.15)
      .fromTo(fades, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.08 }, 0.55)
      .fromTo(picture, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' }, 0.25)
      .fromTo(img, { scale: 1.3 }, { scale: 1, duration: 2.4 }, 0.55);
  }

  function initHeroScroll() {
    var media = $('[data-hero-media]');
    var inner = $('[data-hero-media-inner]');
    var mm = gsap.matchMedia();

    // The framed image opens up to full-bleed as it scrolls into place.
    gsap.fromTo(media,
      { clipPath: function () { var g = gutter(); return 'inset(0px ' + g + 'px 0px ' + g + 'px round 12px)'; } },
      {
        clipPath: 'inset(0px 0px 0px 0px round 0px)',
        ease: 'none',
        scrollTrigger: {
          trigger: media,
          start: 'top bottom',
          end: 'top top',
          scrub: true,
          invalidateOnRefresh: true
        }
      });

    gsap.fromTo(inner, { yPercent: -7 }, {
      yPercent: 7,
      ease: 'none',
      scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true }
    });

    mm.add('(min-width: 1024px)', function () {
      gsap.to('.hero__text', {
        y: -90,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=700', scrub: true }
      });
    });
  }

  /* ---------- Ticker: drifts on its own, speeds up with scroll velocity ---------- */
  function initTicker() {
    $$('[data-ticker]').forEach(function (ticker) {
      var track = $('[data-ticker-track]', ticker);
      if (!track) return;
      track.innerHTML += track.innerHTML;

      var base = parseFloat(ticker.getAttribute('data-direction')) || 1;
      var wrap = gsap.utils.wrap(-50, 0);
      var x = base < 0 ? -25 : 0, dir = 1, speed = 1, target = 1, active = false;
      var setX = gsap.quickSetter(track, 'xPercent');

      ScrollTrigger.create({
        trigger: ticker,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: function (self) { active = self.isActive; },
        onUpdate: function (self) {
          dir = self.direction;
          target = dir * (1 + Math.min(Math.abs(self.getVelocity()) / 220, 7));
        }
      });

      gsap.ticker.add(function (time, delta) {
        if (!active) return;
        target += (dir - target) * 0.04;
        speed += (target - speed) * 0.1;
        x = wrap(x - base * speed * 0.02 * delta / 16.67);
        setX(x);
      });
    });
  }

  /* ---------- Services: sticky frame swaps as each service takes focus ---------- */
  function initServices() {
    var mm = gsap.matchMedia();
    mm.add('(min-width: 1024px)', function () {
      var section = $('.services');
      var items = $$('[data-service]');
      var imgs = $$('[data-service-img]');
      var counter = $('[data-service-current]');
      var current = 0;

      section.classList.add('has-services-js');
      items[0].classList.add('is-active');

      function setActive(i) {
        if (i === current) return;
        var down = i > current;
        var prev = imgs[current];
        var next = imgs[i];
        imgs.forEach(function (el) { el.style.zIndex = '0'; });
        prev.style.zIndex = '1';
        next.style.zIndex = '2';
        gsap.killTweensOf([next, $('img', next)]);
        gsap.fromTo(next,
          { clipPath: down ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'expo.inOut' });
        gsap.fromTo($('img', next), { scale: 1.18 }, { scale: 1, duration: 1.8, ease: 'expo.out' });
        items[current].classList.remove('is-active');
        items[i].classList.add('is-active');
        if (counter) counter.textContent = String(i + 1).padStart(2, '0');
        current = i;
      }

      items.forEach(function (item, i) {
        ScrollTrigger.create({
          trigger: item,
          start: 'top center',
          end: 'bottom center',
          onToggle: function (self) { if (self.isActive) setActive(i); }
        });
      });

      return function () {
        section.classList.remove('has-services-js');
        items.forEach(function (el) { el.classList.remove('is-active'); });
      };
    });

    // Mobile: each inline image wipes in as it arrives.
    mm.add('(max-width: 1023px)', function () {
      $$('.service__thumb').forEach(function (fig) {
        gsap.fromTo(fig, { clipPath: 'inset(0% 0% 100% 0%)' }, {
          clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut',
          scrollTrigger: { trigger: fig, start: 'top 88%', once: true }
        });
        gsap.fromTo($('img', fig), { scale: 1.25 }, {
          scale: 1, duration: 1.8, ease: 'expo.out',
          scrollTrigger: { trigger: fig, start: 'top 88%', once: true }
        });
      });
    });
  }

  // Reduced motion: still swap the sticky image, just without animation.
  function initServicesStatic() {
    var mm = gsap.matchMedia();
    mm.add('(min-width: 1024px)', function () {
      var items = $$('[data-service]');
      var imgs = $$('[data-service-img]');
      var counter = $('[data-service-current]');
      $('.services').classList.add('has-services-js');
      items.forEach(function (item, i) {
        ScrollTrigger.create({
          trigger: item, start: 'top center', end: 'bottom center',
          onToggle: function (self) {
            if (!self.isActive) return;
            items.forEach(function (el, j) { el.classList.toggle('is-active', j === i); });
            imgs.forEach(function (el, j) { el.classList.toggle('is-active', j === i); });
            if (counter) counter.textContent = String(i + 1).padStart(2, '0');
          }
        });
      });
    });
  }

  /* ---------- Generic reveals ---------- */
  function initReveals() {
    var els = $$('[data-reveal]');
    gsap.set(els, { autoAlpha: 0, y: 36 });
    ScrollTrigger.batch(els, {
      start: 'top 90%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.09, overwrite: true });
      }
    });
  }

  function initSplitHeadings() {
    $$('[data-split]').forEach(function (el) {
      var split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
      gsap.from(split.lines, {
        yPercent: 115,
        duration: 1.4,
        ease: 'expo.out',
        stagger: 0.09,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onComplete: function () { split.revert(); }
      });
    });
  }

  /* ---------- Statement: words brighten as you read down ---------- */
  function initStatement() {
    var el = $('[data-words]');
    if (!el) return;
    var split = SplitText.create(el, { type: 'words', wordsClass: 'word' });
    gsap.fromTo(split.words, { opacity: 0.14 }, {
      opacity: 1,
      ease: 'none',
      stagger: 0.12,
      scrollTrigger: { trigger: el, start: 'top 75%', end: 'bottom 45%', scrub: true }
    });
  }

  function initParallax() {
    $$('[data-parallax]').forEach(function (el) {
      gsap.fromTo(el, { yPercent: -8 }, {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ---------- About ---------- */
  function initAbout() {
    var frame = $('[data-parallax-frame]');
    if (frame) {
      var img = $('img', frame);
      gsap.fromTo(frame, { clipPath: 'inset(12% 8% 12% 8% round 12px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 12px)',
        ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'center center', scrub: true }
      });
      gsap.fromTo(img, { yPercent: -15 }, {
        yPercent: 0,
        ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }

    $$('[data-count]').forEach(function (el) {
      var end = parseInt(el.getAttribute('data-count'), 10);
      var obj = { v: 0 };
      el.textContent = '0';
      gsap.to(obj, {
        v: end,
        duration: 2.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: function () { el.textContent = String(Math.round(obj.v)); }
      });
    });
  }

  /* ---------- Reviews: columns drift at different speeds ---------- */
  function initReviews() {
    var mm = gsap.matchMedia();
    mm.add('(min-width: 1024px)', function () {
      var grid = $('[data-reviews]');
      var travel = [40, 110, 70];
      $$('[data-review-col]', grid).forEach(function (col, i) {
        gsap.fromTo(col, { y: travel[i] }, {
          y: -travel[i],
          ease: 'none',
          force3D: false,
          scrollTrigger: { trigger: grid, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
    });
  }

  /* ---------- Nav: highlight the section in view ---------- */
  function initNavSpy() {
    var links = $$('.nav a[href^="#"]');
    links.forEach(function (link) {
      var section = document.getElementById(link.getAttribute('href').slice(1));
      if (!section) return;
      ScrollTrigger.create({
        trigger: section,
        start: 'top center',
        end: 'bottom center',
        onToggle: function (self) {
          if (self.isActive) {
            links.forEach(function (l) { l.removeAttribute('aria-current'); });
            link.setAttribute('aria-current', 'true');
          } else {
            link.removeAttribute('aria-current');
          }
        }
      });
    });
  }

  /* ---------- Footer wordmark: fit to width ---------- */
  function initFooterWord() {
    var word = $('[data-footer-word]');
    if (!word) return;
    var fit = function () {
      word.style.fontSize = '100px';
      var available = word.parentElement.clientWidth - gutter() * 2;
      var size = Math.floor(100 * available / word.scrollWidth);
      word.style.fontSize = size + 'px';
    };
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fit, 120); });

    if (hasGsap && !reduceMotion) {
      gsap.fromTo(word, { yPercent: 35, opacity: 0 }, {
        yPercent: 0,
        opacity: 1,
        ease: 'none',
        scrollTrigger: { trigger: word, start: 'top bottom', end: 'bottom bottom', scrub: true }
      });
    }
  }

  /* ---------- 3D car: loaded on approach, driven by scroll ---------- */
  var car3d = null;
  var carState = { yaw: -0.5, pitch: 0.1, dist: 8.4, explode: 0, lookY: 0.62, lights: 1, focus: null, tiltX: 0, tiltY: 0 };
  function pushCar(next) {
    if (next) Object.assign(carState, next);
    if (car3d) car3d.set(carState);
  }

  function loadCar(onReady) {
    var section = $('.explode');
    if (!section) return;
    var stage = $('[data-stage]', section);
    var canvas = $('[data-car3d]', section);
    var labelsEl = $('[data-labels]', section);
    var loading = $('[data-car-loading]', section);
    var labels = $$('[data-part-item]', section).map(function (li) {
      var el = document.createElement('div');
      el.className = 'car-label';
      el.setAttribute('data-label', li.getAttribute('data-part-item'));
      el.innerHTML = '<span>' + $('.parts__num', li).textContent + '</span>' + $('.parts__name', li).innerHTML;
      labelsEl.appendChild(el);
      return el;
    });
    var fail = function () {
      section.classList.add('no-3d');
      stage.classList.add('no-3d');
      loading.lastChild.textContent = '3D view isn’t available on this device';
    };
    var started = false;
    var start = function () {
      if (started) return;
      started = true;
      var url = scriptSrc ? new URL('car3d.js', scriptSrc).href : 'assets/js/car3d.js';
      import(url).then(function (mod) {
        var pressed = $('.swatch[aria-pressed="true"]', section);
        car3d = mod.mountCar(canvas, { labels: labels, paint: pressed ? pressed.getAttribute('data-paint') : undefined });
        if (!car3d) { fail(); return; }
        pushCar();
        stage.classList.add('is-ready');
        if (onReady) onReady(car3d);
      }).catch(fail);
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); start(); }
      }, { rootMargin: '150% 0px' });
      io.observe(section);
    } else {
      start();
    }
  }

  function initSwatches() {
    var section = $('.explode');
    if (!section) return;
    var swatches = $$('.swatch', section);
    var nameEl = $('[data-paint-name]', section);
    swatches.forEach(function (sw) {
      sw.addEventListener('click', function () {
        swatches.forEach(function (o) { o.setAttribute('aria-pressed', o === sw ? 'true' : 'false'); });
        nameEl.textContent = sw.getAttribute('data-name');
        if (car3d) car3d.setPaint(sw.getAttribute('data-paint'));
      });
    });
  }

  function initExplode() {
    var section = $('.explode');
    var pinEl = $('[data-explode]');
    if (!pinEl) return;
    var stage = $('[data-stage]', section);
    var items = $$('[data-part-item]', section);
    var numEl = $('[data-readout-num]', section);
    var nameEl = $('[data-readout-name]', section);
    var detailEl = $('[data-readout-detail]', section);
    var bar = $('[data-explode-bar]', section);
    var pct = $('[data-explode-pct]', section);
    var parts = items.map(function (li) {
      return {
        id: li.getAttribute('data-part-item'),
        name: $('.parts__name', li).textContent,
        detail: $('.parts__detail', li).textContent
      };
    });
    var total = String(parts.length).padStart(2, '0');
    var proxy = { yaw: -2.3, pitch: 0.2, dist: 13, explode: 0, lookY: 0.62, lights: 0.12, focus: null };
    var push = function () { pushCar(proxy); };

    loadCar(push);

    // 1. Swings round from the rear and dollies in as the section arrives;
    //    the light bars switch on as it settles.
    gsap.timeline({
      onUpdate: push,
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'top top', scrub: 0.6 }
    })
      .fromTo(proxy, { yaw: -2.3, pitch: 0.2, dist: 13 }, { yaw: -0.5, pitch: 0.1, dist: 8.4, ease: 'power2.out', duration: 1 }, 0)
      .fromTo(proxy, { lights: 0.12 }, { lights: 1, ease: 'steps(3)', duration: 0.08 }, 0.86);

    // 2. Pinned: turns side-on, comes apart, each part is called out, then
    //    it all goes back together.
    var HL_START = 2.3, HL_STEP = 0.3;
    var HL_END = HL_START + parts.length * HL_STEP;
    var back = HL_END + 0.25;
    var tl = gsap.timeline({
      defaults: { ease: 'power2.inOut', immediateRender: false },
      scrollTrigger: {
        trigger: pinEl,
        start: 'top top',
        end: function () { return '+=' + Math.round(window.innerHeight * 3.6); },
        pin: true,
        scrub: 0.8,
        refreshPriority: 1,
        invalidateOnRefresh: true,
        onToggle: function (self) {
          var tach = $('[data-tach]');
          if (tach) tach.classList.toggle('is-tucked', self.isActive);
        }
      }
    });
    tl.fromTo(proxy, { yaw: -0.5, pitch: 0.1, dist: 8.4 }, { yaw: -1.4, pitch: 0.12, dist: 9.2, duration: 1 }, 0)
      .fromTo(proxy, { explode: 0 }, { explode: 1, duration: 1.2 }, 1)
      .fromTo(proxy, { yaw: -1.4, pitch: 0.12, dist: 9.2, lookY: 0.62 }, { yaw: -0.98, pitch: 0.36, dist: 12.6, lookY: 0.48, duration: 1.2 }, 1)
      .fromTo(proxy, { yaw: -0.98 }, { yaw: -0.5, ease: 'none', duration: HL_END - HL_START }, HL_START)
      .fromTo(proxy, { explode: 1 }, { explode: 0, ease: 'power3.inOut', duration: 1 }, back)
      .fromTo(proxy, { yaw: -0.5, pitch: 0.36, dist: 12.6, lookY: 0.48 }, { yaw: -0.5, pitch: 0.1, dist: 8.4, lookY: 0.62, duration: 1 }, back)
      .to({}, { duration: 0.3 });

    var state = null;
    function readout(idx, phase) {
      var key = idx + ':' + phase;
      if (key === state) return;
      state = key;
      items.forEach(function (li, i) { li.classList.toggle('is-active', i === idx); });
      if (idx >= 0) {
        numEl.textContent = String(idx + 1).padStart(2, '0') + ' / ' + total;
        nameEl.textContent = parts[idx].name;
        detailEl.textContent = parts[idx].detail;
      } else if (phase === 'apart') {
        numEl.textContent = '-- / ' + total;
        nameEl.textContent = 'Disassembly';
        detailEl.textContent = 'Every panel, mount and fastener';
      } else if (phase === 'done') {
        numEl.textContent = total + ' / ' + total;
        nameEl.textContent = 'Reassembled';
        detailEl.textContent = 'Back to factory specifications';
      } else {
        numEl.textContent = '00 / ' + total;
        nameEl.textContent = 'Assembled';
        detailEl.textContent = 'Every part, inside and out';
      }
    }

    tl.eventCallback('onUpdate', function () {
      var t = tl.time();
      var idx = t >= HL_START && t < HL_END ? Math.floor((t - HL_START) / HL_STEP) : -1;
      var phase = t < 1.05 ? 'start' : t < HL_START ? 'apart' : t < back ? 'parts' : 'done';
      readout(idx, phase);
      proxy.focus = idx >= 0 ? parts[idx].id : null;
      var p = tl.progress();
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      pct.textContent = String(Math.round(p * 100)).padStart(3, '0');
      push();
    });

    // Look around: mouse position on desktop, horizontal drag on touch.
    var tilt = { x: 0, y: 0 };
    var tiltTo = function (x, y) {
      gsap.to(tilt, {
        x: x, y: y, duration: 0.9, ease: 'power3.out', overwrite: true,
        onUpdate: function () { pushCar({ tiltX: tilt.x, tiltY: tilt.y }); }
      });
    };
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      stage.addEventListener('pointermove', function (e) {
        var r = stage.getBoundingClientRect();
        tiltTo(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2);
      });
      stage.addEventListener('pointerleave', function () { tiltTo(0, 0); });
    } else {
      var startX = null;
      var base = 0;
      stage.addEventListener('pointerdown', function (e) { startX = e.clientX; base = tilt.x; });
      stage.addEventListener('pointermove', function (e) {
        if (startX === null) return;
        tiltTo(Math.max(-2, Math.min(2, base + (e.clientX - startX) / 120)), 0);
      });
      ['pointerup', 'pointercancel'].forEach(function (ev) {
        stage.addEventListener(ev, function () { startX = null; tiltTo(0, 0); });
      });
    }
  }

  /* ---------- Dashboard gauges: ignition sweep, then settle on the value ---------- */
  function initGauges() {
    $$('[data-gauge]').forEach(function (g) {
      var value = parseFloat(g.getAttribute('data-gauge')) || 0;
      var ticks = $('[data-gauge-ticks]', g);
      var fill = $('[data-gauge-fill]', g);
      var needle = $('[data-gauge-needle]', g);
      var NS = 'http://www.w3.org/2000/svg';
      for (var i = 0; i <= 10; i++) {
        var a = (-135 + i * 27) * Math.PI / 180;
        var line = document.createElementNS(NS, 'line');
        line.setAttribute('x1', (60 + 36 * Math.sin(a)).toFixed(2));
        line.setAttribute('y1', (60 - 36 * Math.cos(a)).toFixed(2));
        line.setAttribute('x2', (60 + 42 * Math.sin(a)).toFixed(2));
        line.setAttribute('y2', (60 - 42 * Math.cos(a)).toFixed(2));
        if (i >= 9) line.setAttribute('class', 'is-red');
        ticks.appendChild(line);
      }
      var angle = function (v) { return -135 + 270 * v; };
      var dash = function (v) { return (75 * v).toFixed(2) + ' 100'; };

      if (!animated) {
        needle.setAttribute('transform', 'rotate(' + angle(value) + ' 60 60)');
        fill.setAttribute('stroke-dasharray', dash(value));
        return;
      }
      gsap.set(needle, { rotation: angle(0), svgOrigin: '60 60' });
      gsap.set(fill, { attr: { 'stroke-dasharray': dash(0) } });
      gsap.timeline({ scrollTrigger: { trigger: g, start: 'top 88%', once: true } })
        .to(needle, { rotation: angle(1), svgOrigin: '60 60', duration: 0.9, ease: 'power2.inOut' }, 0.1)
        .to(fill, { attr: { 'stroke-dasharray': dash(1) }, duration: 0.9, ease: 'power2.inOut' }, 0.1)
        .to(needle, { rotation: angle(value), svgOrigin: '60 60', duration: 1.3, ease: 'elastic.out(1, 0.6)' }, 1.05)
        .to(fill, { attr: { 'stroke-dasharray': dash(value) }, duration: 1, ease: 'power3.out' }, 1.05);
    });
  }

  /* ---------- Process: a car drives the route and lights each step ---------- */
  function initProcess() {
    var section = $('.process');
    if (!section) return;
    var steps = $$('.step', section);
    var mm = gsap.matchMedia();
    mm.add('(min-width: 768px)', function () {
      var road = $('[data-road]', section);
      var car = $('[data-road-car]', section);
      if (!window.MotionPathPlugin || !window.DrawSVGPlugin) {
        steps.forEach(function (el) { el.classList.add('is-lit'); });
        return;
      }
      section.classList.add('has-road');
      gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 55%',
          end: 'bottom 75%',
          scrub: 0.6,
          onUpdate: function (self) {
            steps.forEach(function (el, i) { el.classList.toggle('is-lit', self.progress >= 0.06 + i * 0.25); });
          }
        }
      })
        .fromTo(road, { drawSVG: '0%' }, { drawSVG: '100%', ease: 'none', duration: 1 }, 0)
        .to(car, {
          motionPath: { path: road, align: road, alignOrigin: [0.5, 0.5], autoRotate: true },
          ease: 'none',
          duration: 1
        }, 0);
      return function () {
        section.classList.remove('has-road');
        steps.forEach(function (el) { el.classList.remove('is-lit'); });
      };
    });
    mm.add('(max-width: 767px)', function () {
      steps.forEach(function (el) {
        ScrollTrigger.create({
          trigger: el, start: 'top 80%', once: true,
          onEnter: function () { el.classList.add('is-lit'); }
        });
      });
    });
  }

  /* ---------- Trust badges: icons draw themselves in ---------- */
  function initTrustIcons() {
    if (!window.DrawSVGPlugin) return;
    $$('.trust__item').forEach(function (item) {
      gsap.from($$('[data-draw]', item), {
        drawSVG: '0%',
        duration: 1.3,
        ease: 'power2.inOut',
        stagger: 0.18,
        scrollTrigger: { trigger: item, start: 'top 90%', once: true }
      });
    });
  }

  /* ---------- Magnetic buttons (mouse only) ---------- */
  function initMagnetic() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    $$('.hero__ctas .btn, .cta .btn, .site-header .btn--red').forEach(function (btn) {
      var xTo = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'power3.out' });
      var yTo = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'power3.out' });
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.25);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      btn.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  }

  /* ---------- FAQ: smooth open / close ---------- */
  function initFaq() {
    $$('.faq__item').forEach(function (d) {
      var summary = $('summary', d);
      var body = $('.faq__a', d);
      summary.addEventListener('click', function (e) {
        if (!animated) return;
        e.preventDefault();
        var refresh = function () { gsap.set(body, { clearProps: 'height,opacity' }); ScrollTrigger.refresh(); };
        if (d.open) {
          gsap.to(body, {
            height: 0, opacity: 0, duration: 0.45, ease: 'power2.inOut',
            onComplete: function () { d.open = false; refresh(); }
          });
        } else {
          d.open = true;
          gsap.fromTo(body, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.55, ease: 'power3.out', onComplete: refresh });
        }
      });
    });
  }

  /* ---------- Back-to-top tachometer: fills with scroll progress ---------- */
  function initTach() {
    var tach = $('[data-tach]');
    if (!tach) return;
    var fill = $('[data-tach-fill]', tach);
    var ticks = $('[data-tach-ticks]', tach);
    var NS = 'http://www.w3.org/2000/svg';
    for (var i = 0; i < 24; i++) {
      var a = i * 15 * Math.PI / 180;
      var line = document.createElementNS(NS, 'line');
      var r1 = i % 6 === 0 ? 17 : 19;
      line.setAttribute('x1', (32 + r1 * Math.sin(a)).toFixed(2));
      line.setAttribute('y1', (32 - r1 * Math.cos(a)).toFixed(2));
      line.setAttribute('x2', (32 + 21 * Math.sin(a)).toFixed(2));
      line.setAttribute('y2', (32 - 21 * Math.cos(a)).toFixed(2));
      ticks.appendChild(line);
    }
    var update = function (y) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      fill.setAttribute('stroke-dasharray', (p * 100).toFixed(2) + ' 100');
      tach.classList.toggle('is-visible', y > 700);
    };
    if (lenis) lenis.on('scroll', function (l) { update(l.scroll); });
    else window.addEventListener('scroll', function () { update(window.pageYOffset); }, { passive: true });
    update(window.pageYOffset);
  }

  /* ---------- Open / closed indicator (shop time, Pacific) ---------- */
  function initOpenStatus() {
    var el = $('[data-open-status]');
    if (!el || !window.Intl) return;
    try {
      var parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hourCycle: 'h23'
      }).formatToParts(new Date());
      var get = function (type) {
        for (var i = 0; i < parts.length; i++) if (parts[i].type === type) return parts[i].value;
        return '';
      };
      var weekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(get('weekday')) !== -1;
      var minutes = parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10);
      var open = weekday && minutes >= 8 * 60 && minutes < 17 * 60;
      el.textContent = open ? 'Open now' : 'Closed now';
      el.classList.toggle('is-open', open);
      el.hidden = false;
    } catch (err) { /* leave hidden */ }
  }

  /* ---------- Estimate form ---------- */
  function initEstimateForm() {
    var form = $('[data-estimate-form]');
    if (!form) return;

    var MAX_PHOTOS = 5;
    var MAX_DIM = 1600;
    var MAX_PAYLOAD = 3800000; // stay under Vercel's 4.5 MB request limit

    var input = $('[data-photo-input]', form);
    var list = $('[data-photo-list]', form);
    var wrap = $('[data-photos]', form);
    var status = $('[data-form-status]', form);
    var submit = $('[data-submit]', form);
    var submitLabel = $('[data-submit-label]', form);
    var done = $('[data-estimate-done]');
    var photos = [];

    // Static hosts (GitHub Pages) can't run the email function, so the form
    // hands the request to the visitor's email app instead.
    var shopEmail = form.getAttribute('data-email') || 'rj@rjspaintshop.com';
    var emailMode = /\.github\.io$/.test(location.hostname) || location.protocol === 'file:';
    var idleLabel = emailMode ? 'Continue in Email' : 'Send Request';
    if (emailMode) {
      form.classList.add('is-email-mode');
      submitLabel.textContent = idleLabel;
      $$('[data-email-only]').forEach(function (el) { el.hidden = false; });
      $$('[data-api-only]').forEach(function (el) { el.hidden = true; });
    }

    input.addEventListener('change', function () {
      var files = Array.prototype.slice.call(input.files || []);
      var skipped = 0;
      files.forEach(function (file) {
        if (photos.length >= MAX_PHOTOS || !/^image\//.test(file.type)) { skipped++; return; }
        photos.push({ file: file, url: URL.createObjectURL(file) });
      });
      input.value = '';
      renderPhotos();
      setStatus(skipped ? 'You can add up to ' + MAX_PHOTOS + ' photos.' : '', !!skipped);
    });

    list.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-remove]');
      if (!btn) return;
      var i = parseInt(btn.getAttribute('data-remove'), 10);
      URL.revokeObjectURL(photos[i].url);
      photos.splice(i, 1);
      renderPhotos();
      input.focus();
    });

    function renderPhotos() {
      list.innerHTML = '';
      photos.forEach(function (p, i) {
        var li = document.createElement('li');
        li.className = 'photo';
        var img = document.createElement('img');
        img.src = p.url;
        img.alt = 'Photo ' + (i + 1) + ': ' + p.file.name;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('data-remove', String(i));
        btn.setAttribute('aria-label', 'Remove photo ' + (i + 1));
        btn.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-close"/></svg>';
        li.appendChild(img);
        li.appendChild(btn);
        list.appendChild(li);
      });
      wrap.classList.toggle('is-full', photos.length >= MAX_PHOTOS);
    }

    function setStatus(html, isError) {
      status.innerHTML = html;
      status.classList.toggle('is-error', !!isError);
    }

    function loadImage(file) {
      if (window.createImageBitmap) {
        return createImageBitmap(file).catch(function () { return loadViaElement(file); });
      }
      return loadViaElement(file);
    }
    function loadViaElement(file) {
      return new Promise(function (resolve, reject) {
        var img = new Image();
        var url = URL.createObjectURL(file);
        img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('decode')); };
        img.src = url;
      });
    }

    function compress(file, maxDim, quality) {
      return loadImage(file).then(function (source) {
        var w = source.width, h = source.height;
        var scale = Math.min(1, maxDim / Math.max(w, h));
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
        if (source.close) source.close();
        return new Promise(function (resolve) {
          canvas.toBlob(function (blob) {
            var reader = new FileReader();
            reader.onload = function () { resolve(String(reader.result).split(',')[1]); };
            reader.readAsDataURL(blob);
          }, 'image/jpeg', quality);
        });
      });
    }

    function encodePhotos(maxDim, quality) {
      return Promise.all(photos.map(function (p, i) {
        return compress(p.file, maxDim, quality)
          .then(function (data) { return { name: 'photo-' + (i + 1) + '.jpg', data: data }; })
          .catch(function () { return null; });
      })).then(function (out) { return out.filter(Boolean); });
    }

    var fields = ['name', 'phone', 'vehicle'];

    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true' && e.target.value.trim()) {
        e.target.removeAttribute('aria-invalid');
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var firstInvalid = null;
      fields.forEach(function (name) {
        var el = form.elements[name];
        var bad = !el.value.trim();
        if (bad) { el.setAttribute('aria-invalid', 'true'); firstInvalid = firstInvalid || el; }
        else el.removeAttribute('aria-invalid');
      });
      var email = form.elements.email;
      if (email.value.trim() && !email.checkValidity()) {
        email.setAttribute('aria-invalid', 'true');
        firstInvalid = firstInvalid || email;
      }
      if (firstInvalid) {
        setStatus('Please add your name, phone number, and vehicle' + (email.getAttribute('aria-invalid') ? ', and check your email address' : '') + '.', true);
        firstInvalid.focus();
        return;
      }

      var checked = form.querySelector('input[name="insurance"]:checked');
      var base = {
        name: form.elements.name.value.trim(),
        phone: form.elements.phone.value.trim(),
        email: email.value.trim(),
        vehicle: form.elements.vehicle.value.trim(),
        insurance: checked ? checked.value : '',
        message: form.elements.message.value.trim(),
        company: form.elements.company.value
      };

      if (emailMode) {
        if (base.company) return;
        var lines = [
          'Name: ' + base.name,
          'Phone: ' + base.phone,
          'Email: ' + (base.email || '-'),
          'Vehicle: ' + base.vehicle,
          'Insurance claim: ' + (base.insurance || '-'),
          '',
          'What happened:',
          base.message || '-',
          '',
          '(Photos of the damage are attached.)'
        ];
        var href = 'mailto:' + shopEmail +
          '?subject=' + encodeURIComponent('Estimate request: ' + base.name + ', ' + base.vehicle) +
          '&body=' + encodeURIComponent(lines.join('\n'));
        window.location.href = href;
        form.hidden = true;
        done.hidden = false;
        done.focus();
        return;
      }

      submit.disabled = true;
      submitLabel.textContent = photos.length ? 'Preparing photos…' : 'Sending…';
      setStatus('', false);

      encodePhotos(MAX_DIM, 0.8)
        .then(function (encoded) {
          var size = encoded.reduce(function (n, p) { return n + p.data.length; }, 0);
          return size > MAX_PAYLOAD ? encodePhotos(1100, 0.68) : encoded;
        })
        .then(function (encoded) {
          submitLabel.textContent = 'Sending…';
          var body = Object.assign({}, base, { photos: encoded });
          return fetch('/api/estimate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
        })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          form.hidden = true;
          done.hidden = false;
          done.focus();
          photos.forEach(function (p) { URL.revokeObjectURL(p.url); });
          photos = [];
        })
        .catch(function () {
          setStatus('Sorry, your request didn’t go through. Please call us at <a href="tel:9257304911">(925) 730-4911</a>.', true);
        })
        .then(function () {
          submit.disabled = false;
          submitLabel.textContent = idleLabel;
        });
    });
  }
})();
