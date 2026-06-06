
/**
 * theme.js — cart drawer ATC handler + toast utility
 * Runs after DOM ready (defer in theme.liquid)
 */
(function () {
  'use strict';

  /* ── Toast ── */
  function toast(msg, type) {
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    var container = document.getElementById('toasts');
    if (!container) return;
    container.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 350);
    }, 2800);
  }

  /* ── Refresh cart badge + drawer count ── */
  function refreshCartUI(count) {
    var badge = document.getElementById('cartBadge');
    var drawerCount = document.getElementById('drawerCount');
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
    if (drawerCount) drawerCount.textContent = count;
  }

  /* ── ATC delegated handler ── */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.atc-btn');
    if (!btn) return;

    var variantId = btn.dataset.variant;
    if (!variantId || variantId === 'undefined') {
      toast('Please select options first', 'error');
      return;
    }

    var origText = btn.textContent.trim();
    btn.disabled = true;
    btn.textContent = 'Adding…';

    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ id: parseInt(variantId), quantity: 1 })
    })
    .then(function (r) {
      if (!r.ok) throw new Error('add failed');
      return r.json();
    })
    .then(function () {
      return fetch('/cart.js', { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
    })
    .then(function (r) { return r.json(); })
    .then(function (cart) {
      refreshCartUI(cart.item_count);
      btn.textContent = '✓ Added!';
      btn.classList.add('added');
      // open cart drawer
      var drawer = document.getElementById('cartDrawer');
      if (drawer) { drawer.classList.add('open'); drawer.removeAttribute('aria-hidden'); document.body.style.overflow = 'hidden'; }
      toast('Added to cart!', 'success');
      setTimeout(function () {
        btn.textContent = origText;
        btn.classList.remove('added');
        btn.disabled = false;
      }, 2200);
    })
    .catch(function () {
      btn.textContent = origText;
      btn.disabled = false;
      toast('Could not add to cart. Please try again.', 'error');
    });
  });

  /* ── Cart drawer qty change & remove (for drawer rendered items) ── */
  document.addEventListener('click', function (e) {
    /* qty +/- */
    var qtyBtn = e.target.closest('.qty-btn');
    if (qtyBtn && qtyBtn.closest('#cartDrawer')) {
      var key     = qtyBtn.dataset.key;
      var current = parseInt(qtyBtn.dataset.qty) || 1;
      var newQty  = qtyBtn.dataset.action === 'inc' ? current + 1 : Math.max(0, current - 1);
      fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity: newQty })
      })
      .then(function (r) { return r.json(); })
      .then(function (cart) { refreshCartUI(cart.item_count); location.reload(); })
      .catch(function () { toast('Error updating cart', 'error'); });
    }

    /* remove */
    var delBtn = e.target.closest('.cart-item__del');
    if (delBtn) {
      var k = delBtn.dataset.key;
      fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: k, quantity: 0 })
      })
      .then(function (r) { return r.json(); })
      .then(function (cart) { refreshCartUI(cart.item_count); location.reload(); })
      .catch(function () { toast('Error removing item', 'error'); });
    }
  });

  /* ── Scroll-reveal for product cards ── */
  if ('IntersectionObserver' in window) {
    var style = document.createElement('style');
    style.textContent = '.reveal{opacity:0;transform:translateY(18px);transition:opacity .5s ease,transform .5s ease}.reveal.visible{opacity:1;transform:translateY(0)}';
    document.head.appendChild(style);

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.p-card, .cat-tile, .review-card').forEach(function (el) {
      el.classList.add('reveal');
      io.observe(el);
    });
  }

})();
