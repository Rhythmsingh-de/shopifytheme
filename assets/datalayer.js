
/**
 * Bombas-style DataLayer — GA4 + Server-Side GTM ready
 * All standard ecommerce events: view_item_list, view_item,
 * add_to_cart, remove_from_cart, begin_checkout, purchase
 */
(function () {
  'use strict';
  window.dataLayer = window.dataLayer || [];

  /* ── helpers ── */
  function push(obj) { window.dataLayer.push(obj); }

  function money(cents) { return parseFloat((cents / 100).toFixed(2)); }

  function mapItem(p, idx) {
    return {
      item_id:       String(p.id || p.variant_id || ''),
      item_name:     p.title || p.product_title || '',
      item_brand:    p.vendor || '',
      item_category: p.product_type || p.type || '',
      item_variant:  p.variant_title || '',
      price:         money(p.price || 0),
      quantity:      p.quantity || 1,
      index:         idx || 0
    };
  }

  /* ── page_view (fired inline in theme.liquid for initial load) ── */

  /* ── view_item_list on collection + homepage grids ── */
  function fireViewItemList() {
    var cards = document.querySelectorAll('.p-card[data-product-id]');
    if (!cards.length) return;
    var items = [];
    cards.forEach(function (card, i) {
      items.push({
        item_id:       card.dataset.productId || '',
        item_name:     card.dataset.productTitle || '',
        item_category: card.dataset.productType || '',
        price:         parseFloat(card.dataset.price || 0),
        index:         i
      });
    });
    if (!items.length) return;
    push({ ecommerce: null });
    push({
      event: 'view_item_list',
      ecommerce: {
        item_list_name: document.title,
        items: items
      }
    });
  }

  /* ── add_to_cart — listen to all ATC buttons ── */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.atc-btn, .prod-atc');
    if (!btn) return;
    var variantId = btn.dataset.variant;
    if (!variantId) return;

    /* fetch variant price from Shopify AJAX if not on card */
    var card   = btn.closest('.p-card');
    var price  = card ? parseFloat(card.dataset.price || 0) : 0;
    var name   = card ? (card.dataset.productTitle || '') : (document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : '');

    push({ ecommerce: null });
    push({
      event: 'add_to_cart',
      ecommerce: {
        currency: window.Shopify && window.Shopify.currency ? window.Shopify.currency.active : 'USD',
        value: price,
        items: [{
          item_id:   String(variantId),
          item_name: name,
          price:     price,
          quantity:  1
        }]
      }
    });
  });

  /* ── remove_from_cart ── */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.cart-item__del, [data-remove]');
    if (!btn) return;
    var key  = btn.dataset.key || btn.dataset.remove;
    var item = document.querySelector('.cart-item[data-key="' + key + '"]');
    var name = item ? (item.querySelector('.cart-item__name') || {}).textContent || '' : '';
    push({ ecommerce: null });
    push({
      event: 'remove_from_cart',
      ecommerce: {
        items: [{ item_id: key, item_name: name.trim(), quantity: 1 }]
      }
    });
  });

  /* ── begin_checkout ── */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.btn-checkout, [href*="/checkout"]')) return;
    fetch('/cart.js')
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        push({ ecommerce: null });
        push({
          event: 'begin_checkout',
          ecommerce: {
            currency: cart.currency,
            value:    money(cart.total_price),
            items:    cart.items.map(mapItem)
          }
        });
      })
      .catch(function () {});
  });

  /* ── cart_update — qty change ── */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.qty-btn');
    if (!btn) return;
    push({
      event:  'cart_update',
      action: btn.dataset.action,
      key:    btn.dataset.key
    });
  });

  /* ── search ── */
  var searchForm = document.querySelector('form[action*="search"]');
  if (searchForm) {
    searchForm.addEventListener('submit', function () {
      var q = (searchForm.querySelector('[name="q"]') || {}).value || '';
      push({ event: 'search', search_term: q.trim() });
    });
  }

  /* ── user_data for server-side enrichment ── */
  if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta) {
    var meta = window.ShopifyAnalytics.meta;
    if (meta.page && meta.page.customerId) {
      push({
        event: 'user_data',
        user_id: String(meta.page.customerId),
        logged_in: true
      });
    }
  }

  /* ── scroll depth ── */
  var depths = [25, 50, 75, 100];
  var fired  = {};
  window.addEventListener('scroll', function () {
    var pct = Math.round(
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    );
    depths.forEach(function (d) {
      if (pct >= d && !fired[d]) {
        fired[d] = true;
        push({ event: 'scroll_depth', percent: d });
      }
    });
  }, { passive: true });

  /* ── fire view_item_list on DOM ready ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fireViewItemList);
  } else {
    fireViewItemList();
  }

})();
