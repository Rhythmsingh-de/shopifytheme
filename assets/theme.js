/* BodyLuxCare theme.js v3.1.0
   IDs unified across files:
   Nav drawer:  #nav-drawer, #nav-overlay, #mobileNavTrigger, #mobileNavClose
   Cart drawer: #cartDrawer, #cartOverlay, #cartDrawerClose, #cartItemsList, #cartSubtotal, #cartItemCount, #cartDrawerFoot
   Free ship:   #freeShippingBar .fs-bar__fill .fs-bar__label
   Search:      #searchModal, #searchOverlay, .search-toggle
   Ann bar:     #announcement-bar, #ann-prev, #ann-next, #ann-close, .ann-msg, .ann-msg--active
   Header:      #site-header
   open classes: .is-open on drawer + overlay; .open on nav sub-panels only
*/
(function () {
  'use strict';
  function qs(s,c){return(c||document).querySelector(s);}
  function qsa(s,c){return Array.from((c||document).querySelectorAll(s));}
  function on(el,ev,fn){if(el)el.addEventListener(ev,fn);}

  function rootUrl(){
    var root = (window.routes && window.routes.root_url) || (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
    return root.endsWith('/') ? root : root + '/';
  }
  function route(name, fallbackPath){
    var value = window.routes && window.routes[name];
    if (value) return value;
    return rootUrl() + String(fallbackPath || '').replace(/^\/+/, '');
  }
  function routeJs(name, fallbackPath){
    var value = route(name, fallbackPath);
    return value.slice(-3) === '.js' ? value : value + '.js';
  }
  function checkoutUrl(){
    return route('checkout_url', 'checkout');
  }
  function allProductsUrl(){
    return route('all_products_collection_url', 'collections/all');
  }

  /* ─────────── MOBILE NAV ─────────── */
  function openNav(){
    var d=qs('#nav-drawer'),o=qs('#nav-overlay');
    if(!d)return;
    d.classList.add('is-open');d.setAttribute('aria-hidden','false');
    if(o)o.classList.add('is-open');
    document.body.style.overflow='hidden';
    var f=d.querySelector('a,button');if(f)setTimeout(function(){f.focus();},60);
    var t=qs('#mobileNavTrigger');if(t)t.setAttribute('aria-expanded','true');
  }
  function closeNav(){
    var d=qs('#nav-drawer'),o=qs('#nav-overlay');
    if(d){d.classList.remove('is-open');d.setAttribute('aria-hidden','true');}
    if(o)o.classList.remove('is-open');
    document.body.style.overflow='';
    var t=qs('#mobileNavTrigger');if(t){t.focus();t.setAttribute('aria-expanded','false');}
  }
  function toggleNavGroup(btn){
    var open=btn.getAttribute('aria-expanded')==='true';
    btn.setAttribute('aria-expanded',String(!open));
    var sub=btn.nextElementSibling;
    if(sub)sub.classList.toggle('open',!open);
  }
  // Event listeners are bound inside DOMContentLoaded handler to guarantee elements exist.

  /* ─────────── HEADER SCROLL ─────────── */
  var hdr=qs('#site-header');
  if(hdr){
    window.addEventListener('scroll',function(){
      hdr.classList.toggle('header--scrolled',window.scrollY>80);
    },{passive:true});
  }

  /* ─────────── ANNOUNCEMENT BAR ─────────── */
  (function(){
    var msgs=qsa('.ann-msg');
    if(!msgs.length)return;
    var cur=0;
    function show(i){
      msgs.forEach(function(m){m.classList.remove('ann-msg--active');});
      cur=(i+msgs.length)%msgs.length;
      msgs[cur].classList.add('ann-msg--active');
    }
    var timer;
    if(msgs.length>1){
      timer=setInterval(function(){show(cur+1);},4500);
      on(qs('#ann-prev'),'click',function(){clearInterval(timer);show(cur-1);});
      on(qs('#ann-next'),'click',function(){clearInterval(timer);show(cur+1);});
    }
    on(qs('#ann-close'),'click',function(){
      var bar=qs('#announcement-bar');
      if(bar){bar.style.maxHeight='0';bar.style.overflow='hidden';}
    });
  })();

  /* ─────────── SEARCH ─────────── */
  function openSearch(){
    var m=qs('#searchModal'),o=qs('#searchOverlay');
    if(!m)return;
    m.classList.add('is-open');if(o)o.classList.add('is-open');
    var inp=m.querySelector('input[type="search"],input[name="q"]');
    if(inp)setTimeout(function(){inp.focus();},60);
  }
  function closeSearch(){
    var m=qs('#searchModal'),o=qs('#searchOverlay');
    if(m)m.classList.remove('is-open');if(o)o.classList.remove('is-open');
  }
  document.addEventListener('click',function(e){
    if(e.target.closest('.search-toggle,[data-search-toggle]')){e.preventDefault();openSearch();}
  });
  on(qs('#searchOverlay'),'click',closeSearch);

  /* ─────────── CART DRAWER ─────────── */
  function openCartDrawer(){
    var d=qs('#cartDrawer'),o=qs('#cartOverlay');
    if(!d)return;
    d.classList.add('is-open');d.setAttribute('aria-hidden','false');
    if(o)o.classList.add('is-open');
    document.body.style.overflow='hidden';
    refreshCartDrawer();
  }
  function closeCartDrawer(){
    var d=qs('#cartDrawer'),o=qs('#cartOverlay');
    if(d){d.classList.remove('is-open');d.setAttribute('aria-hidden','true');}
    if(o)o.classList.remove('is-open');
    document.body.style.overflow='';
  }
  on(qs('#cartDrawerClose'),'click',closeCartDrawer);
  on(qs('#cartOverlay'),'click',closeCartDrawer);
  document.addEventListener('click',function(e){
    if(e.target.closest('[data-cart-toggle]')){e.preventDefault();openCartDrawer();}
  });

  /* ─────────── ADD TO CART ─────────── */
  function buttonTextTarget(btn){
    return btn ? (btn.querySelector('.atc-btn-text') || btn) : null;
  }
  function readButtonText(btn){
    var target=buttonTextTarget(btn);
    return target ? target.textContent : '';
  }
  function setButtonText(btn,text){
    var target=buttonTextTarget(btn);
    if(target)target.textContent=text;
  }

  function addToCart(variantId,qty,btn){
    if(!variantId)return;
    if(btn){btn.disabled=true;btn._orig=btn._orig||readButtonText(btn);setButtonText(btn,'Adding...');}
    fetch(routeJs('cart_add_url', 'cart/add'),{
      method:'POST',
      headers:{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest'},
      body:JSON.stringify({id:parseInt(variantId,10),quantity:qty||1})
    })
    .then(function(r){return r.json();})
    .then(function(item){
      if(item.status)throw new Error(item.description||'Error');
      if(btn){setButtonText(btn,'Added');setTimeout(function(){btn.disabled=false;setButtonText(btn,btn._orig);},1800);}
      _updateCartCount();refreshCartDrawer();openCartDrawer();
      if(window.BLC && typeof window.BLC.pushDataLayerEvent === 'function'){
        window.BLC.pushDataLayerEvent({ecommerce:null});
        window.BLC.pushDataLayerEvent({
          event:'add_to_cart',
          ecommerce:{
            currency:(window.Shopify&&window.Shopify.currency&&window.Shopify.currency.active)||'USD',
            value:parseFloat((item.price/100).toFixed(2)),
            items:[{item_id:String(item.variant_id||item.id),item_name:item.product_title||item.title||'',price:parseFloat((item.price/100).toFixed(2)),quantity:item.quantity||1}]
          }
        });
      }
    })
    .catch(function(err){
      if(btn){setButtonText(btn,'Error - retry');setTimeout(function(){btn.disabled=false;setButtonText(btn,btn._orig);},2200);}
      console.error('[BLC ATC]',err);
    });
  }

  /* Delegate — data-add-to-cart button */
  document.addEventListener('click',function(e){
    var btn=e.target.closest('[data-add-to-cart]');
    if(!btn)return;
    e.preventDefault();
    var vid=btn.dataset.variantId||btn.dataset.variant;
    var wrap=btn.closest('[data-product-detail]');
    var qInput=wrap?wrap.querySelector('[data-qty-input],.product-qty__val,.sph__qty-val'):null;
    var qty=qInput?(parseInt(qInput.value)||1):(parseInt(btn.dataset.qty)||1);
    addToCart(vid,qty,btn);
  });

  /* Delegate — .atc-btn on cards */
  document.addEventListener('click',function(e){
    var btn=e.target.closest('.atc-btn');
    if(!btn)return;
    e.preventDefault();
    addToCart(btn.dataset.variant,1,btn);
  });

  function checkoutHref(variantId, qty, trigger) {
    var destination = trigger && trigger.dataset ? trigger.dataset.checkoutDestination : 'checkout';
    if (!destination && window.blcSettings) destination = window.blcSettings.fastCheckoutDestination || 'checkout';
    var suffix = destination === 'cart' ? '?storefront=true' : '';
    return route('cart_url', 'cart') + '/' + encodeURIComponent(variantId) + ':' + encodeURIComponent(qty || 1) + suffix;
  }

  /* ─────────── BUY NOW (DIRECT CHECKOUT) ─────────── */
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-card-buy-now], .sph__btn-buy, [data-buy-now], .pf__buy');
    if (!btn) return;
    if (btn.hasAttribute('aria-disabled') && btn.getAttribute('aria-disabled') !== 'false') {
      e.preventDefault();
      return;
    }

    e.preventDefault();

    var href = btn.getAttribute('href') || '';
    var vid = null;
    var qty = 1;

    if (href.includes('variant=')) {
      var urlParams = new URLSearchParams(href.split('?')[1]);
      vid = urlParams.get('variant');
      qty = parseInt(urlParams.get('quantity')) || 1;
    } else if (href.includes(route('cart_url', 'cart') + '/')) {
      var parts = href.split(route('cart_url', 'cart') + '/')[1];
      if (parts) {
        var subparts = parts.split('?')[0].split(':');
        vid = subparts[0];
        qty = parseInt(subparts[1]) || 1;
      }
    }

    var wrap = btn.closest('[data-product-detail]');
    if (wrap) {
      var atc = wrap.querySelector('[data-add-to-cart]');
      if (atc) {
        vid = atc.dataset.variantId || vid;
        var qtyVal = wrap.querySelector('[data-qty-input],.product-qty__val,.sph__qty-val');
        if (qtyVal) qty = parseInt(qtyVal.value) || qty;
      }
    }

    if (!vid) return;

    var destination = btn.dataset.checkoutDestination || 'checkout';
    if (!destination && window.blcSettings) destination = window.blcSettings.fastCheckoutDestination || 'checkout';

    var isEditor = window.Shopify && window.Shopify.designMode;
    if (isEditor) {
      btn.disabled = true;
      btn.textContent = 'Redirecting to Cart…';
      window.location.href = route('cart_url', 'cart');
      return;
    }

    btn.textContent = 'Redirecting…';
    btn.disabled = true;

    fetch(routeJs('cart_add_url', 'cart/add'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        id: parseInt(vid, 10),
        quantity: qty
      })
    })
    .then(function(r) { return r.json(); })
    .then(function(item) {
      if (item.status) {
        throw new Error(item.description || 'Error adding to cart');
      }
      if (window.BLC && typeof window.BLC.pushDataLayerEvent === 'function') {
        window.BLC.pushDataLayerEvent({ ecommerce: null });
        window.BLC.pushDataLayerEvent({
          event: 'add_to_cart',
          ecommerce: {
            currency: (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || 'USD',
            value: parseFloat((item.price / 100).toFixed(2)),
            items: [{
              item_id: String(item.variant_id || item.id),
              item_name: item.product_title || item.title || '',
              price: parseFloat((item.price / 100).toFixed(2)),
              quantity: item.quantity || 1
            }]
          }
        });
      }
      
      if (typeof _updateCartCount === 'function') _updateCartCount();
      if (typeof refreshCartDrawer === 'function') refreshCartDrawer();

      if (destination === 'cart') {
        window.location.href = route('cart_url', 'cart');
      } else {
        window.location.href = checkoutUrl();
      }
    })
    .catch(function(err) {
      console.error('[Buy Now Error]', err);
      window.location.href = checkoutHref(vid, qty, btn);
    });
  });

  /* ─────────── CART REMOVE ─────────── */
  document.addEventListener('click',function(e){
    var rb=e.target.closest('.cart-item__del,[data-remove]');
    if(!rb)return;
    e.preventDefault();
    var key=rb.dataset.key||rb.dataset.remove;
    var line=parseInt(rb.dataset.line,10);
    var body=key?{id:key,quantity:0}:(line?{line:line,quantity:0}:{});
    fetch(routeJs('cart_change_url', 'cart/change'),{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest'},body:JSON.stringify(body)})
    .then(function(r){return r.json();})
    .then(function(cart){_updateCartCount();refreshCartDrawer();_updateFSBar(cart.total_price);})
    .catch(function(){});
  });

  /* ─────────── CART QTY STEPPERS (inside drawer) ─────────── */
  document.addEventListener('click',function(e){
    var btn=e.target.closest('.qty__btn,.qty-stepper__btn');
    if(!btn)return;
    var wrap=btn.closest('.cart-item');
    if(!wrap)return;
    var input=wrap.querySelector('.qty-stepper__val,input[type="number"]');
    if(!input)return;
    var cur=parseInt(input.value,10)||1;
    var isUp=btn.classList.contains('qty__btn--plus')||btn.dataset.dir==='up'||btn.textContent.trim()==='+';
    var next=isUp?cur+1:Math.max(0,cur-1);
    var line=parseInt(wrap.dataset.line,10);
    if(!line)return;
    input.value=next;
    fetch(routeJs('cart_change_url', 'cart/change'),{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest'},body:JSON.stringify({line:line,quantity:next})})
    .then(function(r){return r.json();})
    .then(function(cart){_updateCartCount();refreshCartDrawer();_updateFSBar(cart.total_price);})
    .catch(function(){});
  });

  /* ─────────── CART REFRESH ─────────── */
  function refreshCartDrawer(){
    var list=qs('#cartItemsList');
    if(!list)return;
    fetch(routeJs('cart_url', 'cart'),{headers:{'X-Requested-With':'XMLHttpRequest'}})
    .then(function(r){return r.json();})
    .then(function(cart){
      _updateFSBar(cart.total_price);
      var sub=qs('#cartSubtotal');if(sub)sub.textContent=_fmt(cart.total_price);
      var cnt=qs('#cartItemCount');if(cnt)cnt.textContent=cart.item_count+' item'+(cart.item_count===1?'':'s');
      var foot=qs('#cartDrawerFoot');
      if(!cart.items||!cart.items.length){
        var productsUrl = allProductsUrl();
        list.innerHTML='<div class="cart-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><p>Your cart is empty</p><a href="'+productsUrl+'" class="btn btn--primary btn--sm" onclick="window.BLC?BLC.closeCartDrawer():void 0">Start Shopping</a></div>';
        if(foot)foot.style.display='none';return;
      }
      if(foot)foot.style.display='';
      list.innerHTML=cart.items.map(function(item,i){
        var img=item.image?item.image.replace(/_\d+x\d+/,'_160x200').replace(/_\d+x\./,'_160x.'): '';
        return '<div class="cart-item" data-line="'+(i+1)+'" data-key="'+item.key+'">'
          +(img?'<img src="'+img+'" alt="'+esc(item.product_title)+'" class="cart-item__img" width="80" height="100" loading="lazy">'
              :'<div class="cart-item__img cart-item__img--placeholder"></div>')
          +'<div class="cart-item__body">'
            +'<div class="cart-item__title">'+esc(item.product_title)+'</div>'
            +(item.variant_title&&item.variant_title!=='Default Title'?'<div class="cart-item__variant">'+esc(item.variant_title)+'</div>':'')
            +'<div class="cart-item__row">'
              +'<div class="qty-stepper">'
                +'<button class="qty-stepper__btn qty__btn qty__btn--minus" aria-label="Decrease" data-dir="down">−</button>'
                +'<input class="qty-stepper__val" type="number" value="'+item.quantity+'" min="0" aria-label="Quantity" readonly>'
                +'<button class="qty-stepper__btn qty__btn qty__btn--plus" aria-label="Increase" data-dir="up">+</button>'
              +'</div>'
              +'<div class="cart-item__price">'+_fmt(item.line_price)+'</div>'
            +'</div>'
            +'<button class="cart-item__del" data-key="'+item.key+'" data-line="'+(i+1)+'" aria-label="Remove '+esc(item.product_title)+'">Remove</button>'
          +'</div>'
        +'</div>';
      }).join('');
    }).catch(function(){});
  }

  function _updateCartCount(){
    fetch(routeJs('cart_url', 'cart'),{headers:{'X-Requested-With':'XMLHttpRequest'}})
    .then(function(r){return r.json();})
    .then(function(cart){
      qsa('[data-cart-count]').forEach(function(el){
        el.textContent=cart.item_count;
        el.style.display=cart.item_count>0?'flex':'none';
      });
    }).catch(function(){});
  }
  function _updateFSBar(totalCents){
    var bar=qs('#freeShippingBar');if(!bar)return;
    var rawThreshold=(window.blcSettings&&typeof window.blcSettings.freeShippingThreshold!=='undefined')?window.blcSettings.freeShippingThreshold:75;
    var threshold=rawThreshold*100;
    var pct=threshold>0?Math.min((totalCents/threshold)*100,100):100;
    var fill=bar.querySelector('.fs-bar__fill');var label=bar.querySelector('.fs-bar__label');
    if(fill)fill.style.width=pct+'%';
    if(label)label.textContent=pct>=100?'🎉 Free shipping unlocked!':'$'+((threshold-totalCents)/100).toFixed(2)+' away from free shipping';
  }
  function _fmt(c){return '$'+(c/100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',');}
  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function stripHtml(s) {
    var div = document.createElement('div');
    div.innerHTML = String(s || '').replace(/<script[\s\S]*?<\/script>/gi, '');
    return div.textContent || div.innerText || '';
  }

  /* ─────────── PRODUCT PAGE QTY ─────────── */
  document.addEventListener('click',function(e){
    var btn=e.target.closest('[data-qty-minus],[data-qty-plus]');
    if(!btn)return;
    var wrap=btn.closest('[data-qty-stepper]');if(!wrap)return;
    var input=wrap.querySelector('[data-qty-input],.product-qty__val,.sph__qty-val');if(!input)return;
    var val=parseInt(input.value)||1;
    if(btn.hasAttribute('data-qty-minus'))val=Math.max(1,val-1);
    else val=val+1;
    input.value=val;

    var detail=btn.closest('[data-product-detail]');
    if(detail){
      var atc=detail.querySelector('[data-add-to-cart]');
      if(atc)atc.dataset.qty=val;
      var buyBtn=detail.querySelector('[data-buy-now], [data-card-buy-now], .sph__btn-buy, .pf__buy');
      if(buyBtn){
        var vid=atc?atc.dataset.variantId:buyBtn.dataset.variantId;
        if(vid && !(buyBtn.hasAttribute('aria-disabled') && buyBtn.getAttribute('aria-disabled') !== 'false'))buyBtn.href=checkoutHref(vid,val,buyBtn);
      }
    }
  });

  /* ─────────── PRODUCT THUMBNAILS ─────────── */
  document.addEventListener('click',function(e){
    var thumb=e.target.closest('.product-media-thumb, .sph__thumb');if(!thumb)return;
    var stack=thumb.closest('.product-media-stack, .sph__media, .blc-hero__split-media');if(!stack)return;
    var main=qs('#ProductMainImage, #SphMainImg, .sph__img',stack);if(!main)return;
    var img=thumb.querySelector('img');
    var src=thumb.getAttribute('data-src') || (img && img.src.replace(/_\d+x\d+/,'_900x900').replace(/_\d+x\./,'_900x.'));if(!src)return;
    main.src=src;
    main.removeAttribute('srcset');
    qsa('.product-media-thumb, .sph__thumb',stack).forEach(function(t){t.classList.remove('is-active');});
    thumb.classList.add('is-active');
  });

  /* ─────────── PRODUCT NAVIGATION ARROWS ─────────── */
  document.addEventListener('click',function(e){
    var nav=e.target.closest('[data-sph-nav]');if(!nav)return;
    var direction=nav.getAttribute('data-sph-nav');
    var stack=nav.closest('.product-media-stack, .sph__media, .blc-hero__split-media');if(!stack)return;
    var thumbs=qsa('.product-media-thumb, .sph__thumb',stack);if(!thumbs.length)return;
    var activeIdx=-1;
    for(var i=0;i<thumbs.length;i++){
      if(thumbs[i].classList.contains('is-active')){activeIdx=i;break;}
    }
    if(activeIdx===-1)activeIdx=0;
    var newIdx;
    if(direction==='next'){
      newIdx=(activeIdx+1)%thumbs.length;
    }else{
      newIdx=(activeIdx-1+thumbs.length)%thumbs.length;
    }
    var targetThumb=thumbs[newIdx];
    if(targetThumb)targetThumb.click();
  });

  /* ─────────── CLICK MAIN IMAGE TO CYCLE ─────────── */
  document.addEventListener('click',function(e){
    var mainImg=e.target.closest('#ProductMainImage, #SphMainImg, [data-main-image]');if(!mainImg)return;
    if(e.target.closest('[data-sph-nav], .product-media-thumb, .sph__thumb'))return;
    var stack=mainImg.closest('.product-media-stack, .sph__media, .blc-hero__split-media');if(!stack)return;
    var nextBtn=stack.querySelector('[data-sph-nav="next"]');
    if(nextBtn){
      nextBtn.click();
    }else{
      var thumbs=stack.querySelectorAll('.product-media-thumb, .sph__thumb');
      if(thumbs.length>1){
        var activeIdx=-1;
        for(var i=0;i<thumbs.length;i++){
          if(thumbs[i].classList.contains('is-active')){activeIdx=i;break;}
        }
        if(activeIdx===-1)activeIdx=0;
        var nextThumb=thumbs[(activeIdx+1)%thumbs.length];
        if(nextThumb)nextThumb.click();
      }
    }
  });

  /* ─────────── ACCORDION ─────────── */
  document.addEventListener('click',function(e){
    var t=e.target.closest('.accordion-trigger');if(!t)return;
    var id=t.getAttribute('aria-controls');
    var body=id?document.getElementById(id):t.nextElementSibling;
    if(!body)return;
    var open=t.getAttribute('aria-expanded')==='true';
    t.setAttribute('aria-expanded',String(!open));
    body.classList.toggle('is-open',!open);
  });

  /* ─────────── VARIANT SWATCHES ─────────── */
  document.addEventListener('click',function(e){
    var sw=e.target.closest('.option-swatch');if(!sw)return;
    var grp=sw.closest('.product-option__swatches');if(!grp)return;
    qsa('.option-swatch',grp).forEach(function(s){s.classList.remove('is-active');s.setAttribute('aria-pressed','false');});
    sw.classList.add('is-active');sw.setAttribute('aria-pressed','true');
    var lbl=grp.previousElementSibling;
    if(lbl){var sp=lbl.querySelector('[data-selected-option], [id^="selected-"]');if(sp)sp.textContent=sw.dataset.optionValue;}
    _syncVariant(sw.closest('[data-product-detail]'));
  });
  /* ─────────── CARD VARIANT SELECTOR ─────────── */
  document.addEventListener('change', function(e){
    var sel=e.target.closest('[data-card-variant-selector]');if(!sel)return;
    var card=sel.closest('.prod-card');if(!card)return;
    var vid=sel.value;
    
    // Update ATC button data-variant-id
    var atc=card.querySelector('.atc-btn');
    if(atc)atc.dataset.variantId=vid;
    
    // Update Buy Now link href
    var buy=card.querySelector('[data-card-buy-now]');
    if(buy){
      buy.dataset.variantId=vid;
      buy.href=checkoutHref(vid,1,buy);
    }
  });

  function _syncVariant(form){
    if(!form)return;
    var vals=qsa('.option-swatch.is-active',form).map(function(s){return s.dataset.optionValue;});
    try{
      var variants=JSON.parse(form.dataset.variants||'[]');
      var match=variants.find(function(v){
        return vals.every(function(val,i){
          return v['option'+(i+1)]===val;
        });
      });
      if(match){
        var btn=form.querySelector('[data-add-to-cart]');
        if(btn){
          btn.dataset.variantId=match.id;
          btn.disabled=!match.available;
          btn.setAttribute('aria-disabled',!match.available);
          var atcText=btn.querySelector('.atc-btn-text')||btn;
          if(match.available){
            if(atcText===btn){
              var prefix = btn.dataset.btnPrefix || btn.textContent.split('—')[0].split('&mdash;')[0].trim();
              if(!btn.dataset.btnPrefix) btn.dataset.btnPrefix = prefix;
              btn.textContent = prefix + ' — ' + _fmt(match.price);
            }else{
              var prefix = btn.dataset.btnPrefix || atcText.textContent.split('—')[0].split('&mdash;')[0].trim();
              if(!btn.dataset.btnPrefix) btn.dataset.btnPrefix = prefix;
              atcText.textContent = prefix + ' — ' + _fmt(match.price);
            }
          }else{
            if(atcText===btn){
              btn.textContent='Sold Out';
            }else{
              atcText.textContent='Sold Out';
            }
          }
        }
        var priceEl=form.querySelector('.product-info__price-sale, .product-info__price-now, .sph__price, [data-price-now]');
        if(priceEl){
          priceEl.textContent=_fmt(match.price);
          if(priceEl.classList.contains('blc-hero__price')){
            priceEl.classList.toggle('blc-hero__price--sale', !!(match.compare_at_price && match.compare_at_price > match.price));
          }
          if(priceEl.classList.contains('product-info__price-now')){
            priceEl.classList.toggle('is-sale', !!(match.compare_at_price && match.compare_at_price > match.price));
          }
        }

        var compareEl=form.querySelector('.product-info__price-was, .sph__price-was, [data-price-compare]');
        if(compareEl){
          if(match.compare_at_price && match.compare_at_price > match.price){
            compareEl.textContent=_fmt(match.compare_at_price);
            compareEl.style.display='';
          }else{
            compareEl.style.display='none';
          }
        }

        var badgeEl=form.querySelector('.badge--sale, .sph__badge, [data-sale-badge]');
        if(badgeEl){
          if(match.compare_at_price && match.compare_at_price > match.price){
            var pct=Math.round(((match.compare_at_price - match.price) / match.compare_at_price) * 100);
            badgeEl.textContent='Save ' + pct + '%';
            badgeEl.style.display='';
          }else{
            badgeEl.style.display='none';
          }
        }

        var stockEl=form.querySelector('[data-hero-stock]');
        if(stockEl){
          stockEl.textContent=match.available ? 'In stock' : 'Sold out';
          stockEl.classList.toggle('is-sold-out', !match.available);
        }

        // Also update featured image if variant has one
        if(match.featured_image && match.featured_image.src){
          var mainImg=form.querySelector('#ProductMainImage, #SphMainImg, .sph__img, [data-main-image]');
          if(mainImg){
            mainImg.src=match.featured_image.src;
            mainImg.removeAttribute('srcset');
          }
        }

        // Update Buy Now link href
        var buyBtn=form.querySelector('[data-buy-now], [data-card-buy-now], .sph__btn-buy, .pf__buy');
        if(buyBtn){
          var currentQty=1;
          var qtyInp=form.querySelector('[data-qty-input],.product-qty__val,.sph__qty-val');
          if(qtyInp)currentQty=parseInt(qtyInp.value)||1;
          buyBtn.dataset.variantId=String(match.id);
          if(match.available){
            buyBtn.removeAttribute('aria-disabled');
            buyBtn.href=checkoutHref(match.id,currentQty,buyBtn);
            buyBtn.removeAttribute('tabindex');
          }else{
            buyBtn.setAttribute('aria-disabled','true');
            buyBtn.removeAttribute('href');
            buyBtn.setAttribute('tabindex','-1');
          }
        }

        // Trigger events to sync other components (like sticky ATC)
        var detail = { variant: match };
        window.dispatchEvent(new CustomEvent('variant:changed', { detail: detail }));
        window.dispatchEvent(new CustomEvent('sph:variant:changed', { detail: detail }));
      }
    }catch(ex){console.error('[BLC variants]',ex);}
  }

  /* ─────────── 3D TILT ─────────── */
  if(window.matchMedia('(hover:hover)').matches){
    document.addEventListener('mouseover', function(e) {
      var card = e.target.closest('.prod-card, .fp__media-slider');
      if (!card) return;
      if (!card.dataset.tiltInit) {
        card.dataset.tiltInit = 'true';
        card.addEventListener('mousemove', function(e) {
          var r=card.getBoundingClientRect();
          var x=(e.clientX-r.left)/r.width-0.5;
          var y=(e.clientY-r.top)/r.height-0.5;
          card.style.transition = 'none';
          if (card.classList.contains('prod-card')) {
            card.style.transform='perspective(900px) rotateY('+(x*10)+'deg) rotateX('+(-y*8)+'deg) translateY(-6px)';
          } else {
            card.style.transform='perspective(900px) rotateY('+(x*6)+'deg) rotateX('+(-y*5)+'deg)';
          }
        });
        card.addEventListener('mouseleave', function() {
          card.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
          card.style.transform='';
        });
      }
    });
  }

  /* ─────────── SCROLL REVEAL ─────────── */
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){if(en.isIntersecting){en.target.classList.add('is-visible');io.unobserve(en.target);}});
    },{threshold:0.07,rootMargin:'0px 0px -50px 0px'});
    function _obs(){qsa('.reveal').forEach(function(el){io.observe(el);});}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',_obs);
    else _obs();
  } else {
    qsa('.reveal').forEach(function(el){el.classList.add('is-visible');});
  }

  /* ─────────── TABS ─────────── */
  document.addEventListener('click',function(e){
    var pill=e.target.closest('.tab-pill[role="tab"]');if(!pill)return;
    var tabId=pill.dataset.tab;
    var sec=pill.closest('section,.tab-section')||document;
    qsa('.tab-pill[role="tab"]',sec).forEach(function(p){p.classList.remove('active');p.setAttribute('aria-selected','false');});
    qsa('.tab-pane',sec).forEach(function(p){p.classList.remove('active');});
    pill.classList.add('active');pill.setAttribute('aria-selected','true');
    var pane=document.getElementById('tab-pane-'+tabId);if(pane)pane.classList.add('active');
  });

  function initOfferCountdowns(root) {
    qsa('[data-offer-countdown]', root || document).forEach(function(el) {
      if (el._offerCountdownTimer) clearInterval(el._offerCountdownTimer);
      var rawEnd = el.dataset.countdownEnd;
      if (!rawEnd) {
        var meta = document.querySelector('meta[name="offer-countdown-end"]');
        rawEnd = meta ? meta.content : '';
      }
      var endTime = rawEnd ? new Date(rawEnd).getTime() : 0;
      if (!endTime || Number.isNaN(endTime)) return;

      var labelEl = el.querySelector('[data-countdown-label]');
      var daysEl = el.querySelector('[data-countdown-days]');
      var hoursEl = el.querySelector('[data-countdown-hours]');
      var minsEl = el.querySelector('[data-countdown-mins]');
      var secsEl = el.querySelector('[data-countdown-secs]');
      var daysWrap = el.querySelector('[data-countdown-days-wrap]');
      var expiredText = el.dataset.expiredText || 'Offer ended';

      function pad(n) { return n < 10 ? '0' + n : '' + n; }
      function tick() {
        var diff = endTime - Date.now();
        if (diff <= 0) {
          el.classList.add('is-expired');
          if (labelEl) labelEl.textContent = expiredText;
          if (daysEl) daysEl.textContent = '00';
          if (hoursEl) hoursEl.textContent = '00';
          if (minsEl) minsEl.textContent = '00';
          if (secsEl) secsEl.textContent = '00';
          clearInterval(el._offerCountdownTimer);
          return;
        }
        var days = Math.floor(diff / 86400000);
        var hours = Math.floor((diff % 86400000) / 3600000);
        var mins = Math.floor((diff % 3600000) / 60000);
        var secs = Math.floor((diff % 60000) / 1000);
        if (daysEl) daysEl.textContent = pad(days);
        if (hoursEl) hoursEl.textContent = pad(hours);
        if (minsEl) minsEl.textContent = pad(mins);
        if (secsEl) secsEl.textContent = pad(secs);
        if (daysWrap) daysWrap.hidden = days === 0 && !el.classList.contains('offer-countdown--compact');
      }

      tick();
      el._offerCountdownTimer = setInterval(tick, 1000);
    });
  }

  document.addEventListener('shopify:section:load', function(e) {
    initOfferCountdowns(e.target);
    initRecentlyViewed(e.target);
    initProductRecommendations(e.target);
    initPromoPopups(e.target);
  });

  /* New merchandising and modal features */
  function money(cents) {
    var locale = (window.Shopify && window.Shopify.locale) || document.documentElement.lang || 'en';
    var currency = (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || 'USD';
    try { return new Intl.NumberFormat(locale, { style: 'currency', currency: currency }).format((cents || 0) / 100); }
    catch (_) { return _fmt(cents || 0); }
  }

  function productImage(src, width) {
    if (!src) return '';
    return src.indexOf('?') > -1 ? src + '&width=' + width : src + '?width=' + width;
  }

  function openQuickView(handle, trigger) {
    var modal = qs('[data-quick-view-modal]');
    var content = qs('[data-quick-view-content]', modal);
    if (!modal || !content || !handle) return;
    modal._lastTrigger = trigger || document.activeElement;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    content.innerHTML = '<p class="quick-view__loading">Loading...</p>';

    fetch('/products/' + encodeURIComponent(handle) + '.js', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(function(r) { return r.json(); })
      .then(function(p) {
        var firstAvailable = (p.variants || []).find(function(v) { return v.available; }) || (p.variants || [])[0];
        var variants = (p.variants || []).map(function(v) {
          return '<option value="' + v.id + '" data-price="' + v.price + '" data-available="' + v.available + '"' + (!v.available ? ' disabled' : '') + '>' + esc(v.title) + ' - ' + money(v.price) + (!v.available ? ' (Sold Out)' : '') + '</option>';
        }).join('');
        content.innerHTML =
          '<div class="quick-view__content" data-product-detail>' +
            '<div class="quick-view__media">' + (p.featured_image ? '<img src="' + productImage(p.featured_image, 900) + '" alt="' + esc(p.title) + '">' : '') + '</div>' +
            '<div class="quick-view__info">' +
              '<p class="quick-view__vendor">' + esc(p.vendor || '') + '</p>' +
              '<h2 class="quick-view__title">' + esc(p.title) + '</h2>' +
              '<div class="quick-view__price" data-price-now>' + money(firstAvailable ? firstAvailable.price : p.price) + '</div>' +
              ((p.variants || []).length > 1 ? '<select class="quick-view__select" data-quick-view-variant aria-label="Select variant">' + variants + '</select>' : '') +
              '<input class="quick-view__qty" data-qty-input type="number" min="1" value="1" aria-label="Quantity">' +
              '<div class="quick-view__actions">' +
                '<button class="btn btn--primary" data-add-to-cart data-variant-id="' + (firstAvailable ? firstAvailable.id : '') + '" data-qty="1"' + (!firstAvailable || !firstAvailable.available ? ' disabled aria-disabled="true"' : '') + '><span class="atc-btn-text">Add to Cart</span></button>' +
                '<a class="btn btn--ghost" data-buy-now data-checkout-destination="' + ((window.blcSettings && window.blcSettings.fastCheckoutDestination) || 'checkout') + '" data-variant-id="' + (firstAvailable ? firstAvailable.id : '') + '" href="' + checkoutHref(firstAvailable ? firstAvailable.id : '', 1, null) + '">Buy Now</a>' +
              '</div>' +
              '<a href="' + p.url + '" class="quick-view__details">View full details</a>' +
              '<div class="quick-view__desc">' + esc(stripHtml(p.description).slice(0, 520)) + '</div>' +
            '</div>' +
          '</div>';
        var focusable = modal.querySelector('button, a, select, input');
        if (focusable) focusable.focus();
        window.dispatchEvent(new CustomEvent('quick-view:opened', { detail: { handle: handle } }));
      })
      .catch(function() {
        content.innerHTML = '<p class="quick-view__loading">Product could not be loaded.</p>';
      });
  }

  function closeQuickView() {
    var modal = qs('[data-quick-view-modal]');
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (modal._lastTrigger && modal._lastTrigger.focus) modal._lastTrigger.focus();
  }

  function openSizeGuide(id, trigger) {
    var modal = id ? document.getElementById(id) : null;
    if (!modal || !modal.matches('[data-size-guide-modal]')) return;
    modal._lastTrigger = trigger || document.activeElement;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var focusable = modal.querySelector('button, a, input, select, textarea');
    if (focusable) focusable.focus();
  }

  function closeSizeGuides() {
    qsa('[data-size-guide-modal]').forEach(function(modal) {
      if (modal.hidden) return;
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (modal._lastTrigger && modal._lastTrigger.focus) modal._lastTrigger.focus();
    });
  }

  document.addEventListener('click', function(e) {
    var sizeGuideOpen = e.target.closest('[data-size-guide-open]');
    if (sizeGuideOpen) {
      e.preventDefault();
      openSizeGuide(sizeGuideOpen.dataset.sizeGuideOpen, sizeGuideOpen);
      return;
    }
    if (e.target.closest('[data-size-guide-close]')) {
      e.preventDefault();
      closeSizeGuides();
      return;
    }
    var quick = e.target.closest('[data-quick-view]');
    if (quick) {
      e.preventDefault();
      openQuickView(quick.dataset.productHandle, quick);
      return;
    }
    if (e.target.closest('[data-quick-view-close]')) {
      e.preventDefault();
      closeQuickView();
    }
  });

  document.addEventListener('change', function(e) {
    var sel = e.target.closest('[data-quick-view-variant]');
    if (!sel) return;
    var wrap = sel.closest('[data-product-detail]');
    var opt = sel.options[sel.selectedIndex];
    var vid = sel.value;
    var available = opt && opt.dataset.available === 'true';
    var atc = wrap.querySelector('[data-add-to-cart]');
    var buy = wrap.querySelector('[data-buy-now]');
    var price = wrap.querySelector('[data-price-now]');
    if (atc) {
      atc.dataset.variantId = vid;
      atc.disabled = !available;
      atc.setAttribute('aria-disabled', String(!available));
    }
    if (buy) {
      buy.dataset.variantId = vid;
      buy.href = checkoutHref(vid, 1, buy);
      buy.toggleAttribute('aria-disabled', !available);
    }
    if (price && opt && opt.dataset.price) price.textContent = money(parseInt(opt.dataset.price, 10));
  });

  var RV_KEY = 'blc_recently_viewed';
  function currentProductForRecent() {
    var marker = qs('[data-recent-product]');
    if (!marker) return null;
    return {
      handle: marker.dataset.handle,
      title: marker.dataset.title,
      url: marker.dataset.url,
      image: marker.dataset.image,
      price: marker.dataset.price
    };
  }
  function storeRecentProduct() {
    var p = currentProductForRecent();
    if (!p || !p.handle) return;
    var list = [];
    try { list = JSON.parse(localStorage.getItem(RV_KEY)) || []; } catch(_) {}
    list = list.filter(function(item) { return item.handle !== p.handle; });
    list.unshift(p);
    try { localStorage.setItem(RV_KEY, JSON.stringify(list.slice(0, 12))); } catch(_) {}
    window.dispatchEvent(new CustomEvent('recently-viewed:updated', { detail: { products: list.slice(0, 12) } }));
  }
  function initRecentlyViewed(root) {
    qsa('[data-recently-viewed]', root || document).forEach(function(el) {
      var current = el.dataset.currentHandle || '';
      var limit = parseInt(el.dataset.limit, 10) || 4;
      var list = [];
      try { list = JSON.parse(localStorage.getItem(RV_KEY)) || []; } catch(_) {}
      list = list.filter(function(item) { return item.handle && item.handle !== current; }).slice(0, limit);
      if (!list.length) {
        el.hidden = true;
        return;
      }
      el.hidden = false;
      var grid = el.querySelector('[data-recently-viewed-grid]');
      if (!grid) return;
      grid.innerHTML = list.map(function(item) {
        return '<article class="recent-card">' +
          '<a href="' + esc(item.url) + '">' + (item.image ? '<img src="' + esc(item.image) + '" alt="' + esc(item.title) + '" loading="lazy">' : '') + '</a>' +
          '<h3><a href="' + esc(item.url) + '">' + esc(item.title) + '</a></h3>' +
          (item.price ? '<p>' + esc(item.price) + '</p>' : '') +
        '</article>';
      }).join('');
    });
  }

  function initProductRecommendations(root) {
    qsa('[data-product-recommendations]', root || document).forEach(function(el) {
      if (el.dataset.loaded === 'true') return;
      var productId = el.dataset.productId;
      var limit = el.dataset.limit || 4;
      if (!productId) return;
      fetch('/recommendations/products?section_id=' + encodeURIComponent(el.dataset.sectionId) + '&product_id=' + encodeURIComponent(productId) + '&limit=' + encodeURIComponent(limit))
        .then(function(r) { return r.text(); })
        .then(function(html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var fresh = doc.querySelector('[data-product-recommendations]');
          if (fresh && fresh.innerHTML.trim()) {
            el.innerHTML = fresh.innerHTML;
            el.dataset.loaded = 'true';
          }
        })
        .catch(function() {});
    });
  }

  function initPromoPopups(root) {
    qsa('[data-promo-popup]', root || document).forEach(function(el) {
      var key = 'blc_promo_popup_seen_' + (el.dataset.popupId || 'default');
      if (localStorage.getItem(key) === '1' && el.dataset.frequency !== 'always') return;
      var delay = parseInt(el.dataset.delay, 10) || 3000;
      setTimeout(function() {
        el.hidden = false;
        el.classList.add('is-visible');
        var first = el.querySelector('a, button, input');
        if (first) first.focus();
      }, delay);
      qsa('[data-promo-popup-close]', el).forEach(function(btn) {
        btn.addEventListener('click', function() {
          el.classList.remove('is-visible');
          el.hidden = true;
          try { localStorage.setItem(key, '1'); } catch(_) {}
          window.dispatchEvent(new CustomEvent('promo-popup:closed', { detail: { id: el.dataset.popupId || 'default' } }));
        });
      });
    });
  }

  document.addEventListener('input', function(e) {
    var slider = e.target.closest('[data-before-after-range]');
    if (!slider) return;
    var wrap = slider.closest('[data-before-after]');
    if (wrap) wrap.style.setProperty('--ba-pos', slider.value + '%');
  });

  document.addEventListener('click', function(e) {
    var top = e.target.closest('[data-back-to-top]');
    if (!top) return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ─────────── ESC KEY ─────────── */
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape')return;
    closeNav();closeCartDrawer();closeSearch();closeQuickView();closeSizeGuides();
  });

  /* ─────────── COOKIE CONSENT ─────────── */
  function _activateTracking(){
    qsa('[type="text/blc-tracking"]').forEach(function(s){
      var live=document.createElement('script');live.textContent=s.textContent;document.head.appendChild(live);
    });
    if(typeof gtag==='function'){
      gtag('consent','update',{ad_storage:'granted',analytics_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'});
    }
  }

  /* ─────────── INIT ─────────── */
  document.addEventListener('DOMContentLoaded',function(){
    _updateCartCount();
    initOfferCountdowns();
    storeRecentProduct();
    initRecentlyViewed();
    initProductRecommendations();
    initPromoPopups();
    if(document.cookie.indexOf('blc_cookie_consent=accepted')>-1)_activateTracking();

    // Bind mobile navigation drawer elements
    on(qs('#mobileNavTrigger'),'click',openNav);
    on(qs('#mobileNavClose'),'click',closeNav);
    on(qs('#nav-overlay'),'click',closeNav);
  });

  /* ─────────── GLOBAL BLC NAMESPACE ─────────── */
  var existingBLC = window.BLC || {};
  window.BLC=Object.assign(existingBLC,{
    trackingMode: existingBLC.trackingMode || 'consent',
    trackingSettings: existingBLC.trackingSettings || {},
    isTrackingAllowed: existingBLC.isTrackingAllowed || function(){
      if (window.BLC && window.BLC.trackingMode === 'always_on') return true;
      if (window.BLC && window.BLC.trackingMode === 'always_off') return false;
      return document.cookie.indexOf('blc_cookie_consent=accepted') > -1;
    },
    pushDataLayerEvent: existingBLC.pushDataLayerEvent || function(obj){
      if(window.dataLayer) window.dataLayer.push(obj);
    },
    openNav:openNav,closeNav:closeNav,toggleNavGroup:toggleNavGroup,
    openSearch:openSearch,closeSearch:closeSearch,
    openCartDrawer:openCartDrawer,closeCartDrawer:closeCartDrawer,
    openCart:openCartDrawer,closeCart:closeCartDrawer,
    addToCart:addToCart,
    route:route,
    routeJs:routeJs,
    checkoutHref:checkoutHref,
    checkoutUrl:checkoutUrl,
    initOfferCountdowns:initOfferCountdowns,
    refreshCartDrawer:refreshCartDrawer,
    openQuickView:openQuickView,
    closeQuickView:closeQuickView,
    openSizeGuide:openSizeGuide,
    closeSizeGuides:closeSizeGuides,
    acceptCookies:function(){
      var expires=';max-age=31536000;path=/;SameSite=Lax';
      document.cookie='blc_cookie=1'+expires;
      document.cookie='blc_cookie_consent=accepted'+expires;
      if (window.Shopify && window.Shopify.customerPrivacy) {
        try {
          window.Shopify.customerPrivacy.setTrackingConsent({
            analytics: true,
            marketing: true,
            preferences: true
          }, function() {});
        } catch(_) {}
      }
      var el=document.getElementById('cookie-consent');
      if(el){
        document.documentElement.classList.remove('cookie-consent-open');
        el.classList.add('is-hidden');
        setTimeout(function(){el.setAttribute('hidden', '');},380);
      }
      if(window.dataLayer)window.dataLayer.push({event:'cookie_consent', consent_choice:'accepted'});
      _activateTracking();
    },
    declineCookies:function(){
      var expires=';max-age=31536000;path=/;SameSite=Lax';
      document.cookie='blc_cookie=0'+expires;
      document.cookie='blc_cookie_consent=declined'+expires;
      if (window.Shopify && window.Shopify.customerPrivacy) {
        try {
          window.Shopify.customerPrivacy.setTrackingConsent({
            analytics: false,
            marketing: false,
            preferences: false
          }, function() {});
        } catch(_) {}
      }
      if(typeof gtag==='function'){
        gtag('consent','update',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
      }
      var el=document.getElementById('cookie-consent');
      if(el){
        document.documentElement.classList.remove('cookie-consent-open');
        el.classList.add('is-hidden');
        setTimeout(function(){el.setAttribute('hidden', '');},380);
      }
      if(window.dataLayer)window.dataLayer.push({event:'cookie_consent', consent_choice:'declined'});
    }
  });

  /* Listen to cart updates dispatched by other components (e.g. product-form) */
  window.addEventListener('cart:updated', function() {
    if (typeof _updateCartCount === 'function') _updateCartCount();
    if (typeof refreshCartDrawer === 'function') refreshCartDrawer();
    if (typeof openCartDrawer === 'function') openCartDrawer();
  });
})();
