/**
 * BodyLuxCare Theme — theme.js
 * Handles: cart AJAX, nav/cart drawers, reveal animations,
 *          search modal, DataLayer events, cookie consent,
 *          sticky header, quantity steppers, product gallery,
 *          email capture, announcement dismissal, toast
 */
(function () {
  'use strict';

  /* ──────────────────────────────────────
     CART STATE
  ────────────────────────────────────── */
  let cartState = { items: [], item_count: 0, total_price: 0 };

  /* ──────────────────────────────────────
     DOM HELPERS
  ────────────────────────────────────── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  /* ──────────────────────────────────────
     TOAST
  ────────────────────────────────────── */
  function showToast(msg, duration = 3000) {
    let toast = $('#blc-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'blc-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
  }

  /* ──────────────────────────────────────
     CART DRAWER
  ────────────────────────────────────── */
  function openCart() {
    const drawer = $('#cart-drawer');
    const overlay = $('#cart-overlay');
    if (!drawer) return;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    overlay && overlay.classList.add('open');
    document.body.classList.add('cart-open');
    fetchCart();
    pushDL({ event: 'view_cart_drawer' });
  }

  function closeCart() {
    const drawer = $('#cart-drawer');
    const overlay = $('#cart-overlay');
    drawer && drawer.classList.remove('open');
    drawer && drawer.setAttribute('aria-hidden', 'true');
    overlay && overlay.classList.remove('open');
    document.body.classList.remove('cart-open');
  }

  async function fetchCart() {
    try {
      const res = await fetch('/cart.js');
      const data = await res.json();
      cartState = data;
      renderCartDrawer(data);
      updateCartCount(data.item_count);
    } catch (e) { console.warn('Cart fetch failed', e); }
  }

  function renderCartDrawer(cart) {
    const itemsEl = $('#cart-items');
    const totalEl = $('#cart-total');
    const subtotalEl = $('#cart-subtotal');
    if (!itemsEl) return;

    if (cart.item_count === 0) {
      itemsEl.innerHTML = `
        <div style="text-align:center;padding:3rem 1rem;color:var(--color-text-muted)">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 1rem" aria-hidden="true">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <p style="font-weight:600;margin-bottom:.5rem">Your cart is empty</p>
          <a href="/collections/all" class="btn btn--primary btn--sm" onclick="BLC.closeCart()" style="margin-top:1rem">Shop Now</a>
        </div>`;
      totalEl && (totalEl.style.display = 'none');
      return;
    }

    itemsEl.innerHTML = cart.items.map((item, i) => `
      <div class="cart-item" data-line="${i + 1}">
        <a href="${item.url}" onclick="BLC.closeCart()">
          <img src="${item.image}" alt="${escHtml(item.title)}" width="80" height="80"
               style="width:80px;height:80px;object-fit:cover;border-radius:var(--radius-md);flex-shrink:0"
               loading="lazy">
        </a>
        <div class="cart-item__info">
          <a href="${item.url}" style="font-weight:600;font-size:var(--text-sm);line-height:1.3;display:block;margin-bottom:4px" onclick="BLC.closeCart()">${escHtml(item.product_title)}</a>
          ${item.variant_title !== 'Default Title' ? `<span style="font-size:var(--text-xs);color:var(--color-text-muted)">${escHtml(item.variant_title)}</span>` : ''}
          <span style="font-weight:700;font-size:var(--text-sm);display:block;margin-top:4px">${formatMoney(item.price)}</span>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
            <div class="qty qty--sm">
              <button class="qty__btn" onclick="BLC.updateCartLine(${i + 1}, ${item.quantity - 1})" aria-label="Decrease quantity">−</button>
              <input type="number" class="qty__input" value="${item.quantity}" min="0"
                     onchange="BLC.updateCartLine(${i + 1}, +this.value)" aria-label="Quantity"
                     style="width:42px;text-align:center;border:none;font-weight:700;background:transparent;font-size:var(--text-sm)">
              <button class="qty__btn" onclick="BLC.updateCartLine(${i + 1}, ${item.quantity + 1})" aria-label="Increase quantity">+</button>
            </div>
            <button onclick="BLC.updateCartLine(${i + 1}, 0)" style="font-size:var(--text-xs);color:var(--color-text-muted);text-decoration:underline" aria-label="Remove ${escHtml(item.product_title)}">Remove</button>
          </div>
        </div>
      </div>`).join('');

    if (subtotalEl) {
      subtotalEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-2)">
          <span style="font-size:var(--text-sm);color:var(--color-text-muted)">Subtotal (${cart.item_count} item${cart.item_count !== 1 ? 's' : ''})</span>
          <span style="font-weight:800;font-size:var(--text-lg)">${formatMoney(cart.total_price)}</span>
        </div>
        <p style="font-size:var(--text-xs);color:var(--color-text-muted);margin-bottom:var(--sp-3)">Shipping &amp; taxes calculated at checkout</p>`;
    }
    totalEl && (totalEl.style.display = 'block');
  }

  function updateCartCount(count) {
    $$('[data-cart-count]').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  async function addToCart(variantId, quantity, btn) {
    if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>'; }
    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity: quantity || 1 })
      });
      const item = await res.json();
      if (item.status && item.status !== 200) throw new Error(item.description);
      await fetchCart();
      openCart();
      showToast('✓ Added to cart!');
      pushDL({
        event: 'add_to_cart',
        ecommerce: {
          currency: window.BLC_CURRENCY || 'USD',
          value: item.price / 100,
          items: [{
            item_id: item.product_id,
            item_name: item.product_title,
            item_variant: item.variant_title,
            price: item.price / 100,
            quantity: quantity || 1
          }]
        }
      });
    } catch (e) {
      showToast('Could not add to cart. Please try again.');
      console.warn('Add to cart error', e);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Add to Cart'; }
    }
  }

  async function updateCartLine(line, quantity) {
    try {
      const res = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line, quantity })
      });
      const cart = await res.json();
      cartState = cart;
      renderCartDrawer(cart);
      updateCartCount(cart.item_count);
      if (quantity === 0) showToast('Item removed.');
      pushDL({ event: quantity === 0 ? 'remove_from_cart' : 'update_cart', line, quantity });
    } catch (e) { console.warn('Update cart error', e); }
  }

  /* ──────────────────────────────────────
     NAV DRAWER
  ────────────────────────────────────── */
  function openNav() {
    const drawer = $('#nav-drawer');
    const overlay = $('#cart-overlay');
    drawer && drawer.classList.add('open');
    overlay && overlay.classList.add('open');
    document.body.classList.add('nav-open');
    const close = $('#mobileNavClose');
    if (close) { close.focus(); }
  }

  function closeNav() {
    const drawer = $('#nav-drawer');
    const overlay = $('#cart-overlay');
    drawer && drawer.classList.remove('open');
    overlay && overlay.classList.remove('open');
    document.body.classList.remove('nav-open');
  }

  /* ──────────────────────────────────────
     SEARCH MODAL
  ────────────────────────────────────── */
  function openSearch() {
    const modal = $('#search-modal');
    modal && modal.classList.add('open');
    modal && modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => { const inp = $('#search-input'); inp && inp.focus(); }, 50);
  }

  function closeSearch() {
    const modal = $('#search-modal');
    modal && modal.classList.remove('open');
    modal && modal.setAttribute('aria-hidden', 'true');
  }

  /* ──────────────────────────────────────
     SCROLL REVEAL
  ────────────────────────────────────── */
  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      $$('.reveal').forEach(el => el.classList.add('revealed'));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(el => obs.observe(el));
  }

  /* ──────────────────────────────────────
     STICKY HEADER
  ────────────────────────────────────── */
  function initStickyHeader() {
    const header = $('#site-header');
    if (!header) return;
    let lastY = 0;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 80) {
        header.classList.add('scrolled');
        if (y > lastY && y > 200) {
          header.style.transform = 'translateY(-100%)';
        } else {
          header.style.transform = '';
        }
      } else {
        header.classList.remove('scrolled');
        header.style.transform = '';
      }
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ──────────────────────────────────────
     PRODUCT GALLERY
  ────────────────────────────────────── */
  function initProductGallery() {
    const thumbs = $$('.product-gallery__thumb');
    const mainImg = $('#product-gallery-main');
    if (!thumbs.length || !mainImg) return;
    thumbs.forEach(thumb => {
      on(thumb, 'click', () => {
        const src = thumb.dataset.src;
        if (!src) return;
        mainImg.src = src;
        mainImg.alt = thumb.dataset.alt || '';
        $$('.product-gallery__thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });
  }

  /* ──────────────────────────────────────
     VARIANT SELECTOR
  ────────────────────────────────────── */
  function initVariantSelector() {
    const form = $('#product-form');
    if (!form) return;
    const variantSelect = form.querySelector('[name="id"]');
    if (!variantSelect) return;

    on(variantSelect, 'change', () => {
      const varId = variantSelect.value;
      const priceEl = $('#product-price');
      const comparePriceEl = $('#product-compare-price');
      const atcBtn = $('#add-to-cart-btn');

      try {
        const varData = JSON.parse(variantSelect.dataset.variants || '[]');
        const variant = varData.find(v => v.id == varId);
        if (!variant) return;

        if (priceEl) priceEl.textContent = formatMoney(variant.price);
        if (comparePriceEl) {
          if (variant.compare_at_price > variant.price) {
            comparePriceEl.textContent = formatMoney(variant.compare_at_price);
            comparePriceEl.style.display = 'inline';
          } else {
            comparePriceEl.style.display = 'none';
          }
        }
        if (atcBtn) {
          atcBtn.disabled = !variant.available;
          atcBtn.textContent = variant.available ? 'Add to Cart' : 'Sold Out';
        }
      } catch (e) { /* variant data not available */ }
    });
  }

  /* ──────────────────────────────────────
     STICKY ADD TO CART (mobile)
  ────────────────────────────────────── */
  function initStickyAtc() {
    const stickyAtc = $('#sticky-atc');
    const productForm = $('#product-form');
    if (!stickyAtc || !productForm) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        stickyAtc.classList.toggle('visible', !e.isIntersecting);
      });
    }, { threshold: 0.1 });
    obs.observe(productForm);
  }

  /* ──────────────────────────────────────
     EMAIL CAPTURE
  ────────────────────────────────────── */
  async function handleEmailCapture(e, form) {
    e.preventDefault();
    const input = form.querySelector('[type="email"]');
    const msgEl = $('#email-capture-msg');
    const btn = form.querySelector('[type="submit"]');
    if (!input || !input.value) return;

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Submitting...';

    try {
      await fetch('/contact#contact_form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `form_type=customer&email=${encodeURIComponent(input.value)}&utf8=%E2%9C%93`
      });
      if (msgEl) {
        msgEl.style.color = '#6daa45';
        msgEl.textContent = '🎉 You\'re in! Check your email for your 10% off code.';
      }
      input.value = '';
      pushDL({ event: 'email_signup', method: 'footer_capture' });
    } catch (err) {
      if (msgEl) { msgEl.style.color = '#c0392b'; msgEl.textContent = 'Something went wrong. Please try again.'; }
    } finally {
      btn.disabled = false;
      btn.textContent = 'Claim My 10% Off';
    }
  }

  /* ──────────────────────────────────────
     COOKIE CONSENT
  ────────────────────────────────────── */
  function acceptCookies() {
    document.cookie = 'blc_cookie=1;path=/;max-age=31536000;SameSite=Lax';
    const el = $('#cookie-consent');
    el && el.classList.add('hidden');
    setTimeout(() => el && el.remove(), 400);
    pushDL({ event: 'cookie_consent', choice: 'accept' });
  }

  function declineCookies() {
    document.cookie = 'blc_cookie=0;path=/;max-age=31536000;SameSite=Lax';
    const el = $('#cookie-consent');
    el && el.classList.add('hidden');
    setTimeout(() => el && el.remove(), 400);
    pushDL({ event: 'cookie_consent', choice: 'decline' });
  }

  /* ──────────────────────────────────────
     DATALAYER HELPER
  ────────────────────────────────────── */
  function pushDL(obj) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(obj);
  }

  /* ──────────────────────────────────────
     MONEY FORMATTER
  ────────────────────────────────────── */
  function formatMoney(cents) {
    const currency = window.BLC_CURRENCY || 'USD';
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
    } catch (e) {
      return '$' + (cents / 100).toFixed(2);
    }
  }

  /* ──────────────────────────────────────
     HTML ESCAPE
  ────────────────────────────────────── */
  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ──────────────────────────────────────
     ANNOUNCEMENT BAR DISMISS
  ────────────────────────────────────── */
  function dismissAnnouncement() {
    const bar = $('#announcement-bar');
    if (!bar) return;
    bar.style.maxHeight = bar.offsetHeight + 'px';
    bar.offsetHeight; // force reflow
    bar.style.transition = 'max-height 0.35s, opacity 0.35s';
    bar.style.maxHeight = '0';
    bar.style.opacity = '0';
    bar.style.overflow = 'hidden';
    setTimeout(() => bar.remove(), 380);
  }

  /* ──────────────────────────────────────
     NAV MEGA-MENU / DROPDOWN
  ────────────────────────────────────── */
  function initNavDropdowns() {
    $$('.nav-item--has-dropdown').forEach(item => {
      const toggle = item.querySelector('.nav-link');
      const dropdown = item.querySelector('.nav-dropdown');
      if (!toggle || !dropdown) return;
      let timer;
      const open = () => { clearTimeout(timer); dropdown.classList.add('open'); item.setAttribute('aria-expanded', 'true'); };
      const close = () => { timer = setTimeout(() => { dropdown.classList.remove('open'); item.setAttribute('aria-expanded', 'false'); }, 100); };
      on(item, 'mouseenter', open);
      on(item, 'mouseleave', close);
      on(toggle, 'focus', open);
      on(dropdown, 'mouseleave', close);
    });
  }

  /* ──────────────────────────────────────
     PRODUCT PAGE — ADD TO CART SUBMIT
  ────────────────────────────────────── */
  function initProductForm() {
    const form = $('#product-form');
    if (!form) return;
    on(form, 'submit', async (e) => {
      e.preventDefault();
      const variantId = form.querySelector('[name="id"]')?.value;
      const qty = parseInt(form.querySelector('[name="quantity"]')?.value || 1);
      const btn = form.querySelector('#add-to-cart-btn');
      if (!variantId) return;
      await addToCart(variantId, qty, btn);
    });
  }

  /* ──────────────────────────────────────
     KEYBOARD ACCESSIBILITY
  ────────────────────────────────────── */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCart();
      closeNav();
      closeSearch();
    }
  });

  /* ──────────────────────────────────────
     INIT
  ────────────────────────────────────── */
  function init() {
    fetchCart();
    initReveal();
    initStickyHeader();
    initProductGallery();
    initVariantSelector();
    initStickyAtc();
    initNavDropdowns();
    initProductForm();

    // Wire mobile hamburger
    on($('#mobileMenuBtn'), 'click', openNav);
    on($('#mobileNavClose'), 'click', closeNav);

    // Wire cart triggers
    $$('[data-open-cart]').forEach(el => on(el, 'click', openCart));

    // Wire search triggers
    $$('[data-open-search]').forEach(el => on(el, 'click', openSearch));

    // Wire overlay to close both drawers
    on($('#cart-overlay'), 'click', () => { closeCart(); closeNav(); });
  }

  document.addEventListener('DOMContentLoaded', init);

  /* ──────────────────────────────────────
     PUBLIC API
  ────────────────────────────────────── */
  window.BLC = {
    openCart, closeCart, fetchCart, addToCart, updateCartLine,
    openNav, closeNav,
    openSearch, closeSearch,
    handleEmailCapture,
    acceptCookies, declineCookies,
    dismissAnnouncement,
    showToast
  };

})();
