// Shopify Customer Events custom pixel.
// Paste this file into Shopify Admin > Settings > Customer events > Add custom pixel.
// It mirrors checkout-safe Shopify events into a GA4-style dataLayer payload.

(function () {
  var GTM_CONTAINER_ID = 'GTM-XXXXXXX';

  function getDataLayer() {
    var target = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null);
    if (!target) return null;
    target.dataLayer = target.dataLayer || [];
    return target.dataLayer;
  }

  function loadGtm() {
    if (!GTM_CONTAINER_ID || GTM_CONTAINER_ID === 'GTM-XXXXXXX') return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    var dataLayer = getDataLayer();
    if (!dataLayer) return;
    dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var firstScript = document.getElementsByTagName('script')[0];
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(GTM_CONTAINER_ID);
    firstScript.parentNode.insertBefore(script, firstScript);
  }

  function eventId(name, id) {
    return ['shopify', name, id || Date.now(), Math.random().toString(36).slice(2, 10)].join('_');
  }

  function money(price) {
    if (!price) return 0;
    return Number.parseFloat(price.amount || price) || 0;
  }

  function currency(price, fallback) {
    return (price && price.currencyCode) || fallback || 'EUR';
  }

  function variantItem(variant, quantity) {
    if (!variant) return null;
    var product = variant.product || {};
    return {
      item_id: String(variant.id || ''),
      item_name: product.title || variant.title || '',
      item_brand: product.vendor || '',
      item_category: product.type || '',
      item_variant: variant.title || '',
      price: money(variant.price),
      quantity: quantity || 1
    };
  }

  function checkoutItems(checkout) {
    return (checkout && checkout.lineItems || []).map(function (line) {
      var variant = line.variant || line.merchandise || {};
      var product = variant.product || {};
      return {
        item_id: String(variant.id || ''),
        item_name: line.title || product.title || '',
        item_brand: product.vendor || '',
        item_category: product.type || '',
        item_variant: variant.title || '',
        price: money(line.finalLinePrice || variant.price),
        quantity: line.quantity || 1
      };
    });
  }

  function push(payload) {
    var dataLayer = getDataLayer();
    if (!dataLayer || !payload || !payload.event) return;
    if (payload.ecommerce) dataLayer.push({ ecommerce: null });
    dataLayer.push(payload);
  }

  loadGtm();

  if (typeof analytics === 'undefined' || !analytics.subscribe) return;

  analytics.subscribe('page_viewed', function (event) {
    var doc = event.context && event.context.document;
    push({
      event: 'page_view',
      event_id: eventId('page_view', event.id),
      page_location: doc && doc.location ? doc.location.href : '',
      page_title: doc ? doc.title : ''
    });
  });

  analytics.subscribe('product_viewed', function (event) {
    var variant = event.data && event.data.productVariant;
    var item = variantItem(variant, 1);
    if (!item) return;
    push({
      event: 'view_item',
      event_id: eventId('view_item', event.id),
      ecommerce: {
        currency: currency(variant.price),
        value: item.price,
        items: [item]
      }
    });
  });

  analytics.subscribe('product_added_to_cart', function (event) {
    var line = event.data && event.data.cartLine;
    var variant = line && line.merchandise;
    var item = variantItem(variant, line ? line.quantity : 1);
    if (!item) return;
    push({
      event: 'add_to_cart',
      event_id: eventId('add_to_cart', event.id),
      ecommerce: {
        currency: currency(variant.price),
        value: item.price * item.quantity,
        items: [item]
      }
    });
  });

  analytics.subscribe('checkout_started', function (event) {
    var checkout = event.data && event.data.checkout;
    if (!checkout) return;
    push({
      event: 'begin_checkout',
      event_id: eventId('begin_checkout', event.id || checkout.token),
      ecommerce: {
        currency: currency(checkout.totalPrice),
        value: money(checkout.totalPrice),
        items: checkoutItems(checkout)
      }
    });
  });

  analytics.subscribe('checkout_completed', function (event) {
    var checkout = event.data && event.data.checkout;
    if (!checkout) return;
    push({
      event: 'purchase',
      event_id: eventId('purchase', checkout.order && checkout.order.id),
      ecommerce: {
        transaction_id: String((checkout.order && checkout.order.id) || checkout.token || ''),
        currency: currency(checkout.totalPrice),
        value: money(checkout.totalPrice),
        tax: money(checkout.totalTax),
        shipping: checkout.shippingLine ? money(checkout.shippingLine.price) : 0,
        items: checkoutItems(checkout)
      }
    });
  });
})();
