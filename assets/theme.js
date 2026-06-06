/* BodyLuxCare Theme JS — v2.1.0 */
(function () {
  'use strict';

  /* ============================================================
     UTILITY
  ============================================================ */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  function on(el, ev, fn, opts) { if (el) el.addEventListener(ev, fn, opts); }

  /* ============================================================
     MOBILE NAV — BUG FIX: use correct ID #mobileNavClose
  ============================================================ */
  var mobileNavOpen = false;
  var nav = $('#mobileNav');
  var overlay = $('#mobileNavOverlay');

  function openNav() {
    if (!nav) return;
    nav.classList.add('is-open');
    if (overlay) overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    mobileNavOpen = true;
    nav.setAttribute('aria-hidden', 'false');
    var firstLink = nav.querySelector('a, button');
    if (firstLink) firstLink.focus();
  }

  function closeNav() {
    if (!nav) return;
    nav.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    mobileNavOpen = false;
    nav.setAttribute('aria-hidden', 'true');
    var trigger = $('#mobileNavTrigger');
    if (trigger) trigger.focus();
  }

  on($('#mobileNavTrigger'), 'click', openNav);
  // FIXED: was 'mobileClose', now correctly 'mobileNavClose'
  on($('#mobileNavClose'), 'click', closeNav);
  on(overlay, 'click', closeNav);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileNavOpen) closeNav();
  });

  /* ============================================================
     HEADER SCROLL BEHAVIOUR
  ============================================================ */
  var header = $('header.site-header, .site-header');
  var lastScroll = 0;
  if (header) {
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y > 80) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
      lastScroll = y;
    }, { passive: true });
  }

  /* ============================================================
     ANNOUNCEMENT BAR ROTATION
  ============================================================ */
  var annBar = $('.announcement-bar__messages');
  if (annBar) {
    var msgs = $$('.announcement-bar__msg', annBar);
    if (msgs.length > 1) {
      var idx = 0;
      setInterval(function () {
        msgs[idx].classList.remove('is-active');
        idx = (idx + 1) % msgs.length;
        msgs[idx].classList.add('is-active');
      }, 4000);
    }
  }

  /* ============================================================
     CART DRAWER
  ============================================================ */
  function openCartDrawer() {
    var drawer = $('#cartDrawer');
    var overlay2 = $('#cartDrawerOverlay');
    if (!drawer) return;
    drawer.classList.add('is-open');
    if (overlay2) overlay2.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    drawer.setAttribute('aria-hidden', 'false');
  }

  function closeCartDrawer() {
    var drawer = $('#cartDrawer');
    var overlay2 = $('#cartDrawerOverlay');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    if (overlay2) overlay2.classList.remove('is-open');
    document.body.style.overflow = '';
    drawer.setAttribute('aria-hidden', 'true');
  }

  on($('#cartDrawerOverlay'), 'click', closeCartDrawer);
  on($('#cartDrawerClose'), 'click', closeCartDrawer);

  /* Delegated cart toggle */
  document.addEventListener('click', function (e) {
    var cartBtn = e.target.closest('[data-cart-toggle]');
    if (cartBtn) { e.preventDefault(); openCartDrawer(); }
  });

  /* ============================================================
     ADD TO CART — AJAX
  ============================================================ */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-add-to-cart]');
    if (!btn) return;
    e.preventDefault();
    var variantId = btn.dataset.variantId;
    var qtyInput = btn.closest('[data-product-detail]')
      ? btn.closest('[data-product-detail]').querySelector('[data-qty-input]')
      : null;
    var qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
    if (!variantId) return;

    btn.disabled = true;
    var orig = btn.textContent;
    btn.textContent = 'Adding…';

    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ id: variantId, quantity: qty })
    })
      .then(function (r) { return r.json(); })
      .then(function (item) {
        btn.textContent = '✓ Added!';
        setTimeout(function () {
          btn.disabled = false;
          btn.textContent = orig;
        }, 1800);
        refreshCartDrawer();
        openCartDrawer();
        updateCartCount();
        /* DataLayer */
        if (window.dataLayer) {
          window.dataLayer.push({ ecommerce: null });
          window.dataLayer.push({
            event: 'add_to_cart',
            ecommerce: {
              currency: Shopify.currency.active || 'USD',
              value: (item.price / 100).toFixed(2),
              items: [{
                item_id: String(item.variant_id || item.id),
                item_name: item.product_title || item.title,
                item_variant: item.variant_title,
                price: (item.price / 100).toFixed(2),
                quantity: item.quantity
              }]
            }
          });
        }
      })
      .catch(function () {
        btn.textContent = 'Error — try again';
        setTimeout(function () { btn.disabled = false; btn.textContent = orig; }, 2000);
      });
  });

  /* ============================================================
     CART REFRESH
  ============================================================ */
  function refreshCartDrawer() {
    var list = $('#cartItemsList');
    var subtotalEl = $('#cartSubtotal');
    if (!list) return;
    fetch('/cart.js', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        if (subtotalEl) subtotalEl.textContent = formatMoney(cart.total_price);
        updateFreeShippingBar(cart.total_price);
      })
      .catch(function () {});
  }

  function updateCartCount() {
    fetch('/cart.js', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        $$('[data-cart-count]').forEach(function (el) {
          el.textContent = cart.item_count;
          el.style.display = cart.item_count > 0 ? 'flex' : 'none';
        });
      });
  }

  function updateFreeShippingBar(totalCents) {
    var bar = $('#freeShippingBar');
    if (!bar) return;
    var threshold = (window.blcSettings && window.blcSettings.freeShippingThreshold) || 75;
    var thresholdCents = threshold * 100;
    var pct = Math.min((totalCents / thresholdCents) * 100, 100);
    var fill = bar.querySelector('.fs-bar__fill');
    var label = bar.querySelector('.fs-bar__label');
    if (fill) fill.style.width = pct + '%';
    if (label) {
      if (pct >= 100) {
        label.textContent = '🎉 You've unlocked free shipping!';
      } else {
        var remaining = ((thresholdCents - totalCents) / 100).toFixed(2);
        label.textContent = '$' + remaining + ' away from free shipping';
      }
    }
  }

  function formatMoney(cents) {
    var dollars = (cents / 100).toFixed(2);
    return '$' + dollars;
  }

  /* ============================================================
     QTY STEPPER
  ============================================================ */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-qty-minus], [data-qty-plus]');
    if (!btn) return;
    var wrap = btn.closest('[data-qty-stepper]');
    if (!wrap) return;
    var input = wrap.querySelector('[data-qty-input]');
    if (!input) return;
    var val = parseInt(input.value, 10) || 1;
    if (btn.hasAttribute('data-qty-minus')) val = Math.max(1, val - 1);
    if (btn.hasAttribute('data-qty-plus')) val = val + 1;
    input.value = val;
    var addBtn = wrap.closest('[data-product-detail]')
      ? wrap.closest('[data-product-detail]').querySelector('[data-add-to-cart]')
      : null;
    if (addBtn) addBtn.dataset.qty = val;
  });

  /* ============================================================
     PRODUCT IMAGE THUMBNAILS
  ============================================================ */
  document.addEventListener('click', function (e) {
    var thumb = e.target.closest('.product-media-thumb');
    if (!thumb) return;
    var stack = thumb.closest('.product-media-stack');
    if (!stack) return;
    var main = stack.querySelector('#ProductMainImage');
    if (!main) return;
    var src = thumb.querySelector('img');
    if (!src) return;
    main.src = src.src.replace('_72x72', '_900x900').replace('_144x', '_900x').replace(/(_\d+x\d+)/, '_900x900');
    $$('.product-media-thumb', stack).forEach(function (t) { t.classList.remove('is-active'); });
    thumb.classList.add('is-active');
  });

  /* ============================================================
     ACCORDION
  ============================================================ */
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('.accordion-trigger');
    if (!trigger) return;
    var body = document.getElementById(trigger.getAttribute('aria-controls'));
    if (!body) return;
    var isOpen = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', !isOpen);
    body.classList.toggle('is-open', !isOpen);
  });

  /* ============================================================
     TABS (new-arrivals / any tabbed section)
  ============================================================ */
  document.addEventListener('click', function (e) {
    var tab = e.target.closest('.tab-btn');
    if (!tab) return;
    var section = tab.closest('[class*="shopify-section"]') || tab.closest('section');
    if (!section) return;
    $$('.tab-btn', section).forEach(function (t) {
      t.classList.remove('is-active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('is-active');
    tab.setAttribute('aria-selected', 'true');
    $$('.tab-panel', section).forEach(function (p) { p.classList.remove('is-active'); });
    var target = section.querySelector('[data-tab-panel="' + tab.dataset.tab + '"]');
    if (target) target.classList.add('is-active');
  });

  /* ============================================================
     SEARCH MODAL
  ============================================================ */
  function openSearch() {
    var modal = $('#searchModal');
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    var inp = modal.querySelector('input[type="search"]');
    if (inp) setTimeout(function () { inp.focus(); }, 80);
  }

  function closeSearch() {
    var modal = $('#searchModal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-search-open]')) { e.preventDefault(); openSearch(); }
    if (e.target.closest('[data-search-close]')) closeSearch();
    if (e.target.id === 'searchModal') closeSearch();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeSearch();
  });

  /* ============================================================
     SCROLL REVEAL — IntersectionObserver
     FIXED: uses .p-card, .cat-tile, .review-card, .trust-block, .reveal
  ============================================================ */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    /* FIXED: observe all card/reveal selectors used in the theme */
    $$('.p-card, .cat-tile, .review-card, .trust-block, .reveal').forEach(function (el) {
      el.classList.add('reveal-init');
      io.observe(el);
    });
  }

  /* ============================================================
     3D CARD TILT (product cards desktop only)
  ============================================================ */
  if (window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('mousemove', function (e) {
      var card = e.target.closest('.p-card');
      if (!card) return;
      var rect = card.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
      var y = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
      card.style.transform = 'perspective(600px) rotateX(' + y + 'deg) rotateY(' + x + 'deg) scale3d(1.035,1.035,1.035)';
    });
    document.addEventListener('mouseleave', function (e) {
      var card = e.target.closest('.p-card');
      if (card) card.style.transform = '';
    }, true);
  }

  /* ============================================================
     COOKIE BANNER
  ============================================================ */
  var cookieBanner = $('#cookieBanner');
  var cookieDismissed = false;
  try { cookieDismissed = !!sessionStorage.getItem('blc_cookie_ok'); } catch (e) {}
  if (cookieBanner && !cookieDismissed) {
    setTimeout(function () { cookieBanner.classList.add('is-revealed'); }, 1500);
    on($('#cookieAccept'), 'click', function () {
      cookieBanner.classList.remove('is-revealed');
      try { sessionStorage.setItem('blc_cookie_ok', '1'); } catch (e) {}
    });
    on($('#cookieDecline'), 'click', function () {
      cookieBanner.classList.remove('is-revealed');
    });
  }

  /* ============================================================
     FOOTER COOKIE SETTINGS
  ============================================================ */
  on($('#FooterCookieBtn'), 'click', function () {
    if (cookieBanner) cookieBanner.classList.add('is-revealed');
  });

  /* ============================================================
     PROMO DISCOUNT CODE AUTO-APPLY (Shopify URL param)
  ============================================================ */
  var checkoutBtns = $$('[data-checkout-btn]');
  if (checkoutBtns.length && window.blcSettings && window.blcSettings.promoCode) {
    checkoutBtns.forEach(function (btn) {
      var href = btn.href || '/checkout';
      btn.href = href + '?discount=' + encodeURIComponent(window.blcSettings.promoCode);
    });
  }

  /* Init cart count on load */
  updateCartCount();

})();
