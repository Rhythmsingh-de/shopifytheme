/**
 * BodyLuxCare DataLayer — GA4 + Server-Side GTM ready
 * Events: page_view, view_item_list, select_item,
 *         add_to_cart, remove_from_cart, begin_checkout,
 *         cart_update, search, scroll_depth, user_data
 * Gated by window.BLC.isTrackingAllowed() — set in cookie-consent.liquid
 */
(function () {
  'use strict';
  window.dataLayer = window.dataLayer || [];
  window.BLC = window.BLC || {};

  var cfg = window.BLC.trackingSettings || {};
  var eventCfg = cfg.events || {};

  /* Tracking gate — respects theme setting: Compliance > Tracking mode */
  function trackingAllowed() {
    if (window.BLC && window.BLC.trackingMode === 'always_on') return true;
    if (window.BLC && window.BLC.trackingMode === 'always_off') return false;
    if (window.BLC && typeof window.BLC.isTrackingAllowed === 'function') {
      return window.BLC.isTrackingAllowed();
    }
    if (window.Shopify && window.Shopify.customerPrivacy && typeof window.Shopify.customerPrivacy.userCanBeTracked === 'function') {
      try {
        if (!window.Shopify.customerPrivacy.userCanBeTracked()) return false;
      } catch (e) {}
    }
    /* Fallback: check cookie directly if BLC not yet loaded */
    return document.cookie.indexOf('blc_cookie_consent=accepted') !== -1;
  }

  function eventAllowed(eventName) {
    if (cfg.dataLayerEnabled === false) return false;
    if ((eventName === 'page_view' || eventName === 'scroll_depth') && eventCfg.pageViews === false) return false;
    if ((eventName || '').match(/^(view_item|view_item_list|select_item|add_to_cart|remove_from_cart|begin_checkout|view_cart|purchase|view_promotion|select_promotion|cart_update)$/) && eventCfg.ecommerce === false) return false;
    if ((eventName === 'generate_lead' || eventName === 'contact_submit') && eventCfg.leads === false) return false;
    if ((eventName === 'search' || eventName === 'scroll_depth') && eventCfg.engagement === false) return false;
    return true;
  }

  function push(obj) {
    obj = obj || {};
    if (!eventAllowed(obj.event)) return;
    if (!trackingAllowed()) {
      if (cfg.blockedEventMode === 'status_only' && obj.event) {
        window.dataLayer.push({
          event: 'blc_tracking_blocked',
          blocked_event: obj.event,
          consent_state: window.BLC.consentResolved || 'declined'
        });
      }
      return;
    }
    window.dataLayer.push(obj);
  }
  window.BLC.pushDataLayerEvent = push;

  function money(cents) { return parseFloat((Number(cents) / 100).toFixed(2)); }

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

  /* ── Safe dataset reader — never crashes on undefined ── */
  function safeData(el, key, fallback) {
    if (!el || !el.dataset) return fallback !== undefined ? fallback : '';
    var val = el.dataset[key];
    return (val !== undefined && val !== '') ? val : (fallback !== undefined ? fallback : '');
  }

  /* ── Build item object from a prod-card DOM element ── */
  function itemFromCard(card, idx) {
    var pid   = safeData(card, 'productId',    '');
    var name  = safeData(card, 'productTitle', '');
    var type  = safeData(card, 'productType',  '');
    var price = parseFloat(safeData(card, 'price', '0')) || 0;
    if (!pid && !name) return null; /* skip cards with no tracking data */
    return {
      item_id:       pid,
      item_name:     name,
      item_category: type,
      price:         price,
      index:         idx
    };
  }

  /* ── view_item_list — fires on DOM ready ── */
  function fireViewItemList() {
    /* Only target cards that have data-product-id (avoids skeleton / placeholder cards) */
    var cards = document.querySelectorAll('.prod-card[data-product-id]');
    if (!cards.length) return;
    var items = [];
    cards.forEach(function (card, i) {
      var item = itemFromCard(card, i);
      if (item) items.push(item);
    });
    if (!items.length) return;
    push({ ecommerce: null });
    push({
      event: 'view_item_list',
      ecommerce: {
        currency:       (window.Shopify && window.Shopify.currency) ? window.Shopify.currency.active : 'USD',
        item_list_name: document.title,
        items:          items
      }
    });
  }

  /* ── select_item — click on any prod-card link ── */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('.prod-card a');
    if (!link) return;
    var card = link.closest('.prod-card[data-product-id]');
    if (!card) return;
    var allCards = Array.from(document.querySelectorAll('.prod-card[data-product-id]'));
    var idx      = allCards.indexOf(card);
    var item     = itemFromCard(card, idx);
    if (!item) return;
    push({ ecommerce: null });
    push({
      event: 'select_item',
      ecommerce: {
        currency:       (window.Shopify && window.Shopify.currency) ? window.Shopify.currency.active : 'USD',
        item_list_name: document.title,
        items:          [item]
      }
    });
  });

  /* ── add_to_cart ── */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.prod-atc');
    if (!btn) return;
    var variantId = safeData(btn, 'variant', '');
    if (!variantId) return;
    var card  = btn.closest('.prod-card');
    var price = card ? (parseFloat(safeData(card, 'price', '0')) || 0) : 0;
    var name  = card
      ? safeData(card, 'productTitle', '')
      : (document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : '');
    push({ ecommerce: null });
    push({
      event: 'add_to_cart',
      ecommerce: {
        currency: (window.Shopify && window.Shopify.currency) ? window.Shopify.currency.active : 'USD',
        value:    price,
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
  /* Targets .cart-item__del (added to remove buttons) OR data-line=0 qty updates */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.cart-item__del, [data-remove]');
    if (!btn) return;
    /* Support both data-key and data-line attribute patterns */
    var key  = safeData(btn, 'key', '') || safeData(btn, 'remove', '') || safeData(btn, 'line', '');
    var card = btn.closest('.cart-item');
    var name = card ? ((card.querySelector('.cart-item__name, .cart-item__title') || {}).textContent || '').trim() : '';
    push({ ecommerce: null });
    push({
      event: 'remove_from_cart',
      ecommerce: {
        items: [{ item_id: key, item_name: name, quantity: 1 }]
      }
    });
  });

  /* ── begin_checkout ── */
  /* Targets .btn-checkout class OR #cart-checkout-btn OR any /checkout link */
  document.addEventListener('click', function (e) {
    var checkoutBtn = e.target.closest('.btn-checkout, #cart-checkout-btn, [href*="/checkout"]');
    if (!checkoutBtn) return;
    
    var href = checkoutBtn.getAttribute('href') || '';
    if (href.includes('/checkout') && href.includes('variant=')) {
      var urlParams = new URLSearchParams(href.split('?')[1]);
      var variantId = urlParams.get('variant');
      var quantity = parseInt(urlParams.get('quantity')) || 1;
      
      var detail = checkoutBtn.closest('[data-product-detail]');
      var priceEl = detail ? detail.querySelector('.product-info__price-sale, .product-info__price-now, .sph__price, [data-price-now]') : null;
      var priceVal = priceEl ? parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) : 0;
      var price = isNaN(priceVal) ? 0 : priceVal;
      
      var h1El = detail ? detail.querySelector('h1') : null;
      var name = h1El ? h1El.textContent.trim() : document.title;
      
      push({ ecommerce: null });
      push({
        event: 'begin_checkout',
        ecommerce: {
          currency: (window.Shopify && window.Shopify.currency) ? window.Shopify.currency.active : 'USD',
          value: parseFloat((price * quantity).toFixed(2)),
          items: [{
            item_id: String(variantId),
            item_name: name,
            price: price,
            quantity: quantity
          }]
        }
      });
    } else {
      fetch('/cart.js')
        .then(function (r) { return r.json(); })
        .then(function (cart) {
          push({ ecommerce: null });
          push({
            event: 'begin_checkout',
            ecommerce: {
              currency: cart.currency,
              value:    money(cart.total_price),
              items:    (cart.items || []).map(mapItem)
            }
          });
        })
        .catch(function () {});
    }
  });

  /* ── cart_update (qty +/-) ── */
  /* Targets qty__btn (cart drawer inline) AND qty-btn (any other usage) */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.qty__btn, .qty-btn');
    if (!btn) return;
    var card    = btn.closest('.cart-item');
    var line    = card ? safeData(card, 'line', '') : '';
    var action  = btn.getAttribute('aria-label') || safeData(btn, 'action', '');
    push({
      event:  'cart_update',
      action: action.toLowerCase().includes('decrease') ? 'decrease' : 'increase',
      line:   line,
      key:    safeData(btn, 'key', line)
    });
  });

  /* ── search ── */
  var searchForm = document.querySelector('form[action*="search"]');
  if (searchForm) {
    searchForm.addEventListener('submit', function () {
      var input = searchForm.querySelector('[name="q"]');
      var q     = input ? input.value.trim() : '';
      if (q) push({ event: 'search', search_term: q });
    });
  }

  /* generate_lead — newsletter and contact forms, no personal data */
  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (!form || !form.matches) return;
    var isNewsletter = form.querySelector('input[name="contact[tags]"][value*="newsletter"]');
    var isContact = form.getAttribute('action') && form.getAttribute('action').indexOf('/contact') !== -1;
    if (!isNewsletter && !isContact) return;
    push({
      event: 'generate_lead',
      lead_type: isNewsletter ? 'newsletter' : 'contact',
      form_id: form.id || ''
    });
  });

  /* Promotion impressions and clicks */
  function promoPayload(el) {
    return {
      promotion_id: safeData(el, 'promoId', '') || el.id || '',
      promotion_name: safeData(el, 'promoName', '') || (el.textContent || '').trim().slice(0, 80),
      creative_name: el.className || '',
      creative_slot: safeData(el, 'promoSlot', '')
    };
  }
  function firePromotions() {
    var promos = document.querySelectorAll('[data-promo-link], [data-promo-card]');
    if (!promos.length) return;
    var seen = {};
    var items = [];
    promos.forEach(function(el) {
      var p = promoPayload(el);
      var key = p.promotion_id + '|' + p.promotion_name;
      if (seen[key]) return;
      seen[key] = true;
      items.push(p);
    });
    if (!items.length) return;
    push({ ecommerce: null });
    push({
      event: 'view_promotion',
      ecommerce: { items: items }
    });
  }
  document.addEventListener('click', function(e) {
    var promo = e.target.closest('[data-promo-link], [data-promo-card]');
    if (!promo) return;
    push({ ecommerce: null });
    push({
      event: 'select_promotion',
      ecommerce: { items: [promoPayload(promo)] }
    });
  });

  /* ── user_data for server-side enrichment ── */
  try {
    var meta = window.ShopifyAnalytics && window.ShopifyAnalytics.meta;
    if (meta && meta.page && meta.page.customerId) {
      push({
        event:      'user_data',
        user_id:    String(meta.page.customerId),
        logged_in:  true
      });
    }
  } catch (err) {}

  /* ── scroll depth ── */
  var depthMarks = [25, 50, 75, 100];
  var depthFired = {};
  window.addEventListener('scroll', function () {
    var scrollable = document.body.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    var pct = Math.round((window.scrollY / scrollable) * 100);
    depthMarks.forEach(function (d) {
      if (pct >= d && !depthFired[d]) {
        depthFired[d] = true;
        push({ event: 'scroll_depth', percent: d });
      }
    });
  }, { passive: true });

  /* ── DOM ready: fire view_item_list ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      fireViewItemList();
      firePromotions();
    });
  } else {
    fireViewItemList();
    firePromotions();
  }

})();
