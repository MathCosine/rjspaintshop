/* RJ's Paint Shop — interactions & scroll motion */
(function () {
  'use strict';

  var root = document.documentElement;
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

  if (hasGsap && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    initSmoothScroll();
  }

  initHeader();
  initMenu();
  initAnchors();
  initFooterWord();

  if (hasGsap && !reduceMotion && isHome) {
    whenFontsReady(function () {
      initHeroIntro();
      initHeroScroll();
      initTicker();
      initServices();
      initReveals();
      initSplitHeadings();
      initStatement();
      initParallax();
      initAbout();
      initReviews();
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
    var ticker = $('[data-ticker]');
    var track = $('[data-ticker-track]');
    if (!ticker || !track) return;
    track.innerHTML += track.innerHTML;

    var wrap = gsap.utils.wrap(-50, 0);
    var x = 0, dir = 1, speed = 1, target = 1, active = false;
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
      x = wrap(x - speed * 0.02 * delta / 16.67);
      setX(x);
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

      submit.disabled = true;
      submitLabel.textContent = photos.length ? 'Preparing photos…' : 'Sending…';
      setStatus('', false);

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
          submitLabel.textContent = 'Send Request';
        });
    });
  }
})();
