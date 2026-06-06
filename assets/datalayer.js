
// BodyLuxCare — Data Layer v1.0
// GTM-compatible | GA4 | Meta Pixel | TikTok Pixel
// All events fire non-blocking via requestIdleCallback

window.dataLayer = window.dataLayer || [];
window.BLC = window.BLC || {};

/* ─── HELPERS ─────────────────────────────────────────────────── */
function dlPush(event, data) {
  try {
    window.dataLayer.push({ event: event, ...data });
  } catch(e) { console.warn('[BLC DL]', e); }
}

function idle(fn) {
  if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: 2000 });
  else setTimeout(fn, 0);
}

/* ─── GTM INIT ─────────────────────────────────────────────────── */
window.BLC.initGTM = function(id) {
  if (!id) return;
  idle(function() {
    (function(w,d,s,l,i){
      w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
      var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
      j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
      f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer',id);

    // GTM noscript
    var ns = document.createElement('noscript');
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.googletagmanager.com/ns.html?id=' + id;
    iframe.height = '0'; iframe.width = '0';
    iframe.style.cssText = 'display:none;visibility:hidden';
    ns.appendChild(iframe);
    document.body.insertBefore(ns, document.body.firstChild);
  });
};

/* ─── GA4 DIRECT ───────────────────────────────────────────────── */
window.BLC.initGA4 = function(id) {
  if (!id) return;
  idle(function() {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(s);
    window.gtag = function(){window.dataLayer.push(arguments)};
    window.gtag('js', new Date());
    window.gtag('config', id, {
      send_page_view: false,
      cookie_flags: 'max-age=7200;secure;samesite=none'
    });
  });
};

/* ─── META PIXEL ───────────────────────────────────────────────── */
window.BLC.initMeta = function(id) {
  if (!id) return;
  idle(function() {
    !function(f,b,e,v,n,t,s){
      if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)
    }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', id);
    fbq('track', 'PageView');
    window.BLC._metaReady = true;
  });
};

/* ─── TIKTOK PIXEL ─────────────────────────────────────────────── */
window.BLC.initTikTok = function(id) {
  if (!id) return;
  idle(function() {
    !function(w,d,t){
      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
      ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
      ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
      for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
      ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
      ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._as=ttq._as||[];ttq._as.push({id:e,options:n});var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
      ttq.load(id);ttq.page();
    }(window,document,'ttq');
    window.BLC._tiktokReady = true;
  });
};

/* ─── PAGE VIEW ────────────────────────────────────────────────── */
window.BLC.pageView = function(data) {
  dlPush('page_view', {
    page_type: data.page_type || 'other',
    page_title: document.title,
    page_url: window.location.href,
    user_currency: data.currency || 'USD',
    user_logged_in: data.customer_id ? true : false,
    customer_id: data.customer_id || null,
    customer_email_hash: data.customer_email_hash || null
  });
  if (typeof gtag !== 'undefined') {
    gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname
    });
  }
};

/* ─── VIEW ITEM (Product Page) ─────────────────────────────────── */
window.BLC.viewItem = function(product) {
  dlPush('view_item', {
    ecommerce: {
      currency: 'USD',
      value: product.price,
      items: [{
        item_id: product.id,
        item_name: product.title,
        item_brand: product.vendor,
        item_category: product.type,
        item_variant: product.variant_title,
        price: product.price,
        quantity: 1
      }]
    }
  });
  if (typeof gtag !== 'undefined') {
    gtag('event', 'view_item', {
      currency: 'USD',
      value: product.price,
      items: [{
        item_id: product.id,
        item_name: product.title,
        item_brand: product.vendor,
        item_category: product.type,
        price: product.price
      }]
    });
  }
  if (typeof fbq !== 'undefined') {
    fbq('track', 'ViewContent', {
      content_ids: [String(product.id)],
      content_name: product.title,
      content_type: 'product',
      value: product.price,
      currency: 'USD'
    });
  }
  if (typeof ttq !== 'undefined') {
    ttq.track('ViewContent', {
      content_id: String(product.id),
      content_name: product.title,
      content_type: 'product',
      value: product.price,
      currency: 'USD'
    });
  }
};

/* ─── VIEW ITEM LIST (Collection) ──────────────────────────────── */
window.BLC.viewItemList = function(items, listName) {
  dlPush('view_item_list', {
    ecommerce: {
      item_list_name: listName || 'Collection',
      items: items.map(function(p, i) {
        return {
          item_id: p.id,
          item_name: p.title,
          item_brand: p.vendor,
          item_category: p.type,
          price: p.price,
          index: i + 1
        };
      })
    }
  });
  if (typeof gtag !== 'undefined') {
    gtag('event', 'view_item_list', {
      item_list_name: listName || 'Collection',
      items: items.map(function(p, i) {
        return { item_id: p.id, item_name: p.title, price: p.price, index: i + 1 };
      })
    });
  }
};

/* ─── ADD TO CART ───────────────────────────────────────────────── */
window.BLC.addToCart = function(product) {
  dlPush('add_to_cart', {
    ecommerce: {
      currency: 'USD',
      value: product.price * product.quantity,
      items: [{
        item_id: product.id,
        item_name: product.title,
        item_brand: product.vendor,
        item_category: product.type,
        item_variant: product.variant_title,
        price: product.price,
        quantity: product.quantity || 1
      }]
    }
  });
  if (typeof gtag !== 'undefined') {
    gtag('event', 'add_to_cart', {
      currency: 'USD',
      value: product.price,
      items: [{ item_id: product.id, item_name: product.title, price: product.price, quantity: product.quantity || 1 }]
    });
  }
  if (typeof fbq !== 'undefined') {
    fbq('track', 'AddToCart', {
      content_ids: [String(product.id)],
      content_name: product.title,
      content_type: 'product',
      value: product.price * (product.quantity || 1),
      currency: 'USD'
    });
  }
  if (typeof ttq !== 'undefined') {
    ttq.track('AddToCart', {
      content_id: String(product.id),
      content_name: product.title,
      value: product.price * (product.quantity || 1),
      currency: 'USD',
      quantity: product.quantity || 1
    });
  }
};

/* ─── BEGIN CHECKOUT ───────────────────────────────────────────── */
window.BLC.beginCheckout = function(cart) {
  dlPush('begin_checkout', {
    ecommerce: {
      currency: 'USD',
      value: cart.total,
      coupon: cart.coupon || '',
      items: cart.items
    }
  });
  if (typeof gtag !== 'undefined') {
    gtag('event', 'begin_checkout', {
      currency: 'USD',
      value: cart.total,
      items: cart.items
    });
  }
  if (typeof fbq !== 'undefined') {
    fbq('track', 'InitiateCheckout', {
      value: cart.total,
      currency: 'USD',
      num_items: cart.items.length
    });
  }
  if (typeof ttq !== 'undefined') {
    ttq.track('InitiateCheckout', {
      value: cart.total,
      currency: 'USD'
    });
  }
};

/* ─── PURCHASE (Thank You Page) ─────────────────────────────────── */
window.BLC.purchase = function(order) {
  dlPush('purchase', {
    ecommerce: {
      transaction_id: order.id,
      value: order.total,
      tax: order.tax,
      shipping: order.shipping,
      currency: 'USD',
      coupon: order.coupon || '',
      items: order.items
    }
  });
  if (typeof gtag !== 'undefined') {
    gtag('event', 'purchase', {
      transaction_id: order.id,
      value: order.total,
      tax: order.tax,
      shipping: order.shipping,
      currency: 'USD',
      items: order.items
    });
  }
  if (typeof fbq !== 'undefined') {
    fbq('track', 'Purchase', {
      value: order.total,
      currency: 'USD',
      content_ids: order.items.map(function(i){ return String(i.item_id); }),
      content_type: 'product',
      num_items: order.items.length
    });
  }
  if (typeof ttq !== 'undefined') {
    ttq.track('CompletePayment', {
      value: order.total,
      currency: 'USD',
      content_id: order.items.map(function(i){ return String(i.item_id); }).join(',')
    });
  }
};

/* ─── SEARCH ─────────────────────────────────────────────────────── */
window.BLC.search = function(term) {
  dlPush('search', { search_term: term });
  if (typeof gtag !== 'undefined') gtag('event', 'search', { search_term: term });
  if (typeof fbq !== 'undefined') fbq('track', 'Search', { search_string: term });
  if (typeof ttq !== 'undefined') ttq.track('Search', { query: term });
};

/* ─── WISHLIST / SAVE ───────────────────────────────────────────── */
window.BLC.addToWishlist = function(product) {
  dlPush('add_to_wishlist', {
    ecommerce: {
      currency: 'USD',
      value: product.price,
      items: [{ item_id: product.id, item_name: product.title, price: product.price }]
    }
  });
  if (typeof gtag !== 'undefined') {
    gtag('event', 'add_to_wishlist', {
      currency: 'USD',
      value: product.price,
      items: [{ item_id: product.id, item_name: product.title, price: product.price }]
    });
  }
  if (typeof fbq !== 'undefined') fbq('track', 'AddToWishlist', { content_ids: [String(product.id)], value: product.price, currency: 'USD' });
};

/* ─── FORM SUBMIT (Contact/Newsletter) ─────────────────────────── */
window.BLC.formSubmit = function(type) {
  dlPush('form_submit', { form_type: type });
  if (typeof fbq !== 'undefined') fbq('track', 'Lead', { content_name: type });
  if (typeof ttq !== 'undefined') ttq.track('SubmitForm');
};

/* ─── SCROLL DEPTH ──────────────────────────────────────────────── */
(function() {
  var marks = [25, 50, 75, 90], fired = {};
  window.addEventListener('scroll', function() {
    var pct = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    marks.forEach(function(m) {
      if (pct >= m && !fired[m]) {
        fired[m] = true;
        dlPush('scroll_depth', { scroll_depth_threshold: m, page_url: window.location.href });
        if (typeof gtag !== 'undefined') gtag('event', 'scroll', { percent_scrolled: m });
      }
    });
  }, { passive: true });
})();

/* ─── CLICK EVENTS (CTA tracking) ──────────────────────────────── */
document.addEventListener('click', function(e) {
  var el = e.target.closest('[data-track]');
  if (!el) return;
  dlPush('cta_click', {
    cta_label: el.getAttribute('data-track'),
    cta_url: el.href || '',
    page_url: window.location.href
  });
});
