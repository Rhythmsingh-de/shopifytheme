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
  var platformCfg = cfg.platforms || {};
  var META_EVENTS = {
    page_view: 'PageView',
    view_item: 'ViewContent',
    view_item_list: 'ViewContent',
    select_item: 'ViewContent',
    add_to_cart: 'AddToCart',
    begin_checkout: 'InitiateCheckout',
    purchase: 'Purchase',
    search: 'Search',
    generate_lead: 'Lead',
    contact_submit: 'Lead'
  };
  var TIKTOK_EVENTS = {
    view_item: 'ViewContent',
    view_item_list: 'ViewContent',
    select_item: 'ViewContent',
    add_to_cart: 'AddToCart',
    begin_checkout: 'InitiateCheckout',
    purchase: 'Purchase',
    search: 'Search',
    generate_lead: 'SubmitForm',
    contact_submit: 'Contact'
  };

  /* Tracking gate */
  function trackingAllowed() {
    if (window.BLC && window.BLC.trackingMode === 'always_on') return true;
    if (window.BLC && window.BLC.trackingMode === 'always_off') return false;
    if (window.BLC && typeof window.BLC.isTrackingAllowed === 'function') {
      return window.BLC.isTrackingAllowed();
    }
    if (window.Shopify && window.Shopify.customerPrivacy) {
      try {
        var privacy = window.Shopify.customerPrivacy;
        if (typeof privacy.analyticsProcessingAllowed === 'function' || typeof privacy.marketingAllowed === 'function') {
          var analyticsAllowed = typeof privacy.analyticsProcessingAllowed === 'function' ? privacy.analyticsProcessingAllowed() : true;
          var marketingAllowed = typeof privacy.marketingAllowed === 'function' ? privacy.marketingAllowed() : true;
          if (!analyticsAllowed || !marketingAllowed) return false;
        } else if (typeof privacy.userCanBeTracked === 'function' && !privacy.userCanBeTracked()) {
          return false;
        }
      } catch (e) {}
    }
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

  function platformEnabled(name) {
    var platform = platformCfg[name] || {};
    return platform.enabled !== false;
  }

  function platformPixelId(name) {
    var platform = platformCfg[name] || {};
    return platform.pixelId || '';
  }

  function rootUrl() {
    var root = (window.routes && window.routes.root_url) || (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
    return root.endsWith('/') ? root : root + '/';
  }

  function route(name, fallbackPath) {
    var value = window.routes && window.routes[name];
    if (value) return value;
    return rootUrl() + String(fallbackPath || '').replace(/^\/+/, '');
  }

  function routeJs(name, fallbackPath) {
    var value = route(name, fallbackPath);
    return value.slice(-3) === '.js' ? value : value + '.js';
  }

  function checkoutUrl() {
    return route('checkout_url', 'checkout');
  }

  function eventId(eventName) {
    return 'blc_' + (eventName || 'event') + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
  }

  function activeCurrency(obj) {
    if (obj && obj.ecommerce && obj.ecommerce.currency) return obj.ecommerce.currency;
    if (obj && obj.currency) return obj.currency;
    if (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) return window.Shopify.currency.active;
    return 'USD';
  }

  function numberValue(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : (fallback || 0);
  }

  function normalizeItem(item) {
    item = item || {};
    var id = item.item_id || item.id || item.variant_id || item.sku || '';
    var quantity = numberValue(item.quantity, 1) || 1;
    var price = numberValue(item.price, 0);
    return {
      id: String(id),
      name: item.item_name || item.name || item.product_title || item.title || '',
      category: item.item_category || item.category || item.product_type || '',
      variant: item.item_variant || item.variant || item.variant_title || '',
      brand: item.item_brand || item.brand || item.vendor || '',
      quantity: quantity,
      price: price
    };
  }

  function normalizedItems(obj) {
    var ecommerce = obj && obj.ecommerce;
    var rawItems = ecommerce && Array.isArray(ecommerce.items) ? ecommerce.items : [];
    return rawItems.map(normalizeItem).filter(function(item) { return item.id || item.name; });
  }

  function eventValue(obj, items) {
    if (obj && obj.ecommerce && obj.ecommerce.value !== undefined) return numberValue(obj.ecommerce.value, 0);
    if (obj && obj.value !== undefined) return numberValue(obj.value, 0);
    return items.reduce(function(sum, item) {
      return sum + (numberValue(item.price, 0) * (numberValue(item.quantity, 1) || 1));
    }, 0);
  }

  function itemQuantity(items) {
    return items.reduce(function(sum, item) {
      return sum + (numberValue(item.quantity, 1) || 1);
    }, 0);
  }

  function firstFilled(items, key) {
    for (var i = 0; i < items.length; i++) {
      if (items[i][key]) return items[i][key];
    }
    return '';
  }

  function metaCustomData(obj, items) {
    var value = eventValue(obj, items);
    var data = {
      content_type: 'product',
      content_ids: items.map(function(item) { return item.id; }).filter(Boolean),
      contents: items.map(function(item) {
        return { id: item.id, quantity: item.quantity, item_price: item.price };
      }),
      currency: activeCurrency(obj),
      value: value,
      num_items: itemQuantity(items)
    };
    var name = firstFilled(items, 'name');
    var category = firstFilled(items, 'category');
    if (name) data.content_name = name;
    if (category) data.content_category = category;
    if (obj && obj.search_term) data.search_string = obj.search_term;
    if (obj && obj.lead_type) data.content_name = obj.lead_type;
    return data;
  }

  function tiktokProperties(obj, items) {
    var value = eventValue(obj, items);
    var props = {
      content_type: 'product',
      content_ids: items.map(function(item) { return item.id; }).filter(Boolean),
      contents: items.map(function(item) {
        return { content_id: item.id, content_name: item.name, content_category: item.category, quantity: item.quantity, price: item.price };
      }),
      currency: activeCurrency(obj),
      value: value,
      quantity: itemQuantity(items)
    };
    var description = firstFilled(items, 'name');
    if (description) props.description = description;
    if (obj && obj.search_term) props.search_string = obj.search_term;
    if (obj && obj.lead_type) props.description = obj.lead_type;
    return props;
  }

  function decorateTrackingEvent(obj) {
    if (!obj || !obj.event || obj.ecommerce === null) return obj;
    var metaName = META_EVENTS[obj.event];
    var tiktokName = TIKTOK_EVENTS[obj.event];
    if (!metaName && !tiktokName) return obj;
    var items = normalizedItems(obj);
    var id = obj.event_id || obj.blc_event_id || eventId(obj.event);
    var value = eventValue(obj, items);
    var contentIds = items.map(function(item) { return item.id; }).filter(Boolean);
    var contents = items.map(function(item) {
      return { id: item.id, quantity: item.quantity, item_price: item.price };
    });
    obj.event_id = id;
    obj.blc_event_id = id;
    obj.content_type = obj.content_type || 'product';
    obj.content_ids = obj.content_ids || contentIds;
    obj.contents = obj.contents || contents;
    obj.currency = obj.currency || activeCurrency(obj);
    if (obj.value === undefined) obj.value = value;
    obj.num_items = obj.num_items || itemQuantity(items);
    if (metaName && platformEnabled('meta')) {
      obj.meta_event_name = metaName;
      obj.meta_pixel_id = platformPixelId('meta');
      obj.meta = { pixel_id: obj.meta_pixel_id, event_name: metaName, event_id: id, custom_data: metaCustomData(obj, items) };
    }
    if (tiktokName && platformEnabled('tiktok')) {
      obj.tiktok_event_name = tiktokName;
      obj.tiktok_pixel_id = platformPixelId('tiktok');
      obj.tiktok = { pixel_id: obj.tiktok_pixel_id, event_name: tiktokName, event_id: id, properties: tiktokProperties(obj, items) };
    }
    return obj;
  }
  window.BLC.decorateTrackingEvent = decorateTrackingEvent;

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
    window.dataLayer.push(decorateTrackingEvent(obj));
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

  function safeData(el, key, fallback) {
    if (!el || !el.dataset) return fallback !== undefined ? fallback : '';
    var val = el.dataset[key];
    return (val !== undefined && val !== '') ? val : (fallback !== undefined ? fallback : '');
  }

  function itemFromCard(card, idx) {
    var pid   = safeData(card, 'productId',    '');
    var name  = safeData(card, 'productTitle', '');
    var type  = safeData(card, 'productType',  '');
    var price = parseFloat(safeData(card, 'price', '0')) || 0;
    if (!pid && !name) return null;
    return { item_id: pid, item_name: name, item_category: type, price: price, index: idx };
  }

  /* view_item_list */
  function fireViewItemList() {
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

  /* select_item */
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

  /* ── add_to_cart ──
   * DL-2 FIX: was '.prod-atc' only — now also covers:
   *   [data-add-to-cart]  used by product-card.liquid and cart-drawer upsell
   *   .sph__btn-atc       used by single-product-home section
   *   .prod-card__btn-atc used by product-card quick-add
   */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.prod-atc, [data-add-to-cart], .sph__btn-atc, .prod-card__btn-atc');
    if (!btn) return;
    var variantId = safeData(btn, 'variantId', '') || safeData(btn, 'variant', '');
    if (!variantId) return;
    /* price: prefer card data-price, fall back to SPH section data-price attr or 0 */
    var card  = btn.closest('.prod-card, [data-sph-section], .sph-section, .shopify-section');
    var price = card ? (parseFloat(safeData(card, 'price', '0')) || 0) : 0;
    /* name: card title, SPH h1, or page h1 */
    var name = '';
    if (card) {
      name = safeData(card, 'productTitle', '');
      if (!name) {
        var h1 = card.querySelector('h1, .sph__title, .product-info__title');
        name = h1 ? h1.textContent.trim() : '';
      }
    }
    if (!name) {
      var pageH1 = document.querySelector('h1');
      name = pageH1 ? pageH1.textContent.trim() : document.title;
    }
    /* item_variant from a visible variant selector in scope */
    var variantLabel = '';
    if (card) {
      var sel = card.querySelector('[data-variant-selector], .sph__variant-select, select[name="id"]');
      if (sel) variantLabel = sel.options && sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text.trim() : '';
    }
    push({ ecommerce: null });
    push({
      event: 'add_to_cart',
      ecommerce: {
        currency: (window.Shopify && window.Shopify.currency) ? window.Shopify.currency.active : 'USD',
        value:    price,
        items: [{
          item_id:      String(variantId),
          item_name:    name,
          item_variant: variantLabel,
          price:        price,
          quantity:     1
        }]
      }
    });
  });

  /* remove_from_cart */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.cart-item__del, [data-remove]');
    if (!btn) return;
    var key  = safeData(btn, 'key', '') || safeData(btn, 'remove', '') || safeData(btn, 'line', '');
    var card = btn.closest('.cart-item');
    var name = card ? ((card.querySelector('.cart-item__name, .cart-item__title') || {}).textContent || '').trim() : '';
    push({ ecommerce: null });
    push({
      event: 'remove_from_cart',
      ecommerce: { items: [{ item_id: key, item_name: name, quantity: 1 }] }
    });
  });

  /* begin_checkout */
  document.addEventListener('click', function (e) {
    var checkoutBtn = e.target.closest('.btn-checkout, #cart-checkout-btn, [data-buy-now], [data-card-buy-now], .sph__btn-buy, .pf__buy');
    if (!checkoutBtn) return;
    if (safeData(checkoutBtn, 'checkoutDestination', '') === 'cart') return;
    var href = checkoutBtn.getAttribute('href') || '';
    var variantId = '';
    var quantity = 1;
    var cartPrefix = route('cart_url', 'cart') + '/';
    var checkoutPrefix = checkoutUrl();
    if (href.includes(cartPrefix) && !href.includes('storefront=true')) {
      var cartParts = href.split(cartPrefix)[1];
      if (cartParts) {
        var firstItem = cartParts.split('?')[0].split(',')[0].split(':');
        variantId = firstItem[0] || '';
        quantity = parseInt(firstItem[1], 10) || 1;
      }
    } else if (href.includes(checkoutPrefix) && href.includes('variant=')) {
      var urlParams = new URLSearchParams(href.split('?')[1]);
      variantId = urlParams.get('variant') || '';
      quantity = parseInt(urlParams.get('quantity'), 10) || 1;
    }
    if (variantId) {
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
          items: [{ item_id: String(variantId), item_name: name, price: price, quantity: quantity }]
        }
      });
    } else {
      fetch(routeJs('cart_url', 'cart'))
        .then(function (r) { return r.json(); })
        .then(function (cart) {
          push({ ecommerce: null });
          push({
            event: 'begin_checkout',
            ecommerce: { currency: cart.currency, value: money(cart.total_price), items: (cart.items || []).map(mapItem) }
          });
        })
        .catch(function () {});
    }
  });

  /* cart_update (qty +/-) */
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

  /* search */
  var searchForm = document.querySelector('form[action*="search"]');
  if (searchForm) {
    searchForm.addEventListener('submit', function () {
      var input = searchForm.querySelector('[name="q"]');
      var q     = input ? input.value.trim() : '';
      if (q) push({ event: 'search', search_term: q });
    });
  }

  /* generate_lead */
  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (!form || !form.matches) return;
    var isNewsletter = form.querySelector('input[name="contact[tags]"][value*="newsletter"]');
    var isContact = form.getAttribute('action') && form.getAttribute('action').indexOf('/contact') !== -1;
    if (!isNewsletter && !isContact) return;
    push({ event: 'generate_lead', lead_type: isNewsletter ? 'newsletter' : 'contact', form_id: form.id || '' });
  });

  /* Promotion impressions + clicks */
  function promoPayload(el) {
    return {
      promotion_id:   safeData(el, 'promoId', '') || el.id || '',
      promotion_name: safeData(el, 'promoName', '') || (el.textContent || '').trim().slice(0, 80),
      creative_name:  el.className || '',
      creative_slot:  safeData(el, 'promoSlot', '')
    };
  }
  function firePromotions() {
    var promos = document.querySelectorAll('[data-promo-link], [data-promo-card]');
    if (!promos.length) return;
    var seen = {}; var items = [];
    promos.forEach(function(el) {
      var p = promoPayload(el);
      var key = p.promotion_id + '|' + p.promotion_name;
      if (seen[key]) return;
      seen[key] = true; items.push(p);
    });
    if (!items.length) return;
    push({ ecommerce: null });
    push({ event: 'view_promotion', ecommerce: { items: items } });
  }
  document.addEventListener('click', function(e) {
    var promo = e.target.closest('[data-promo-link], [data-promo-card]');
    if (!promo) return;
    push({ ecommerce: null });
    push({ event: 'select_promotion', ecommerce: { items: [promoPayload(promo)] } });
  });

  /* user_data */
  try {
    var meta = window.ShopifyAnalytics && window.ShopifyAnalytics.meta;
    if (meta && meta.page && meta.page.customerId) {
      push({ event: 'user_data', user_id: String(meta.page.customerId), logged_in: true });
    }
  } catch (err) {}

  /* scroll depth */
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

  /* DOM ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { fireViewItemList(); firePromotions(); });
  } else {
    fireViewItemList();
    firePromotions();
  }

})();
