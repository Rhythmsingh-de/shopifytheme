/* BodyLuxCare — theme.js v5.3.0 — June 2026
   CHANGE: Wrap all inline header onclick BLC calls with window.BLC? to avoid
           runtime errors before theme.js initializes.
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
  on(qs('#mobileNavTrigger'),'click',openNav);
  on(qs('#mobileNavClose'),'click',closeNav);
  on(qs('#nav-overlay'),'click',closeNav);

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
  function addToCart(variantId,qty,btn){
    if(!variantId)return;
    if(btn){btn.disabled=true;btn._orig=btn._orig||btn.textContent;btn.textContent='Adding…';}
    fetch('/cart/add.js',{
      method:'POST',
      headers:{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest'},
      body:JSON.stringify({id:parseInt(variantId,10),quantity:qty||1})
    })
    .then(function(r){return r.json();})
    .then(function(item){
      if(item.status)throw new Error(item.description||'Error');
      if(btn){btn.textContent='✓ Added!';setTimeout(function(){btn.disabled=false;btn.textContent=btn._orig;},1800);}
      _updateCartCount();refreshCartDrawer();openCartDrawer();
      if(window.dataLayer){
        window.dataLayer.push({ecommerce:null});
        window.dataLayer.push({
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
      if(btn){btn.textContent='Error — retry';setTimeout(function(){btn.disabled=false;btn.textContent=btn._orig;},2200);}
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

  /* ─────────── CART REMOVE ─────────── */
  document.addEventListener('click',function(e){
    var rb=e.target.closest('.cart-item__del,[data-remove]');
    if(!rb)return;
    e.preventDefault();
    var key=rb.dataset.key||rb.dataset.remove;
    var line=parseInt(rb.dataset.line,10);
    var body=key?{id:key,quantity:0}:(line?{line:line,quantity:0}:{});
    fetch('/cart/change.js',{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest'},body:JSON.stringify(body)})
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
    fetch('/cart/change.js',{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest'},body:JSON.stringify({line:line,quantity:next})})
    .then(function(r){return r.json();})
    .then(function(cart){_updateCartCount();refreshCartDrawer();_updateFSBar(cart.total_price);})
    .catch(function(){});
  });

  /* ─────────── CART REFRESH ─────────── */
  function refreshCartDrawer(){
    var list=qs('#cartItemsList');
    if(!list)return;
    fetch('/cart.js',{headers:{'X-Requested-With':'XMLHttpRequest'}})
    .then(function(r){return r.json();})
    .then(function(cart){
      _updateFSBar(cart.total_price);
      var sub=qs('#cartSubtotal');if(sub)sub.textContent=_fmt(cart.total_price);
      var cnt=qs('#cartItemCount');if(cnt)cnt.textContent=cart.item_count+' item'+(cart.item_count===1?'':'s');
      var foot=qs('#cartDrawerFoot');
      if(!cart.items||!cart.items.length){
        list.innerHTML='<div class="cart-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><p>Your cart is empty</p><a href="/collections/all" class="btn btn--primary btn--sm" onclick="window.BLC?BLC.closeCartDrawer():void 0">Start Shopping</a></div>';
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
    fetch('/cart.js',{headers:{'X-Requested-With':'XMLHttpRequest'}})
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
    var threshold=((window.blcSettings&&window.blcSettings.freeShippingThreshold)||75)*100;
    var pct=Math.min((totalCents/threshold)*100,100);
    var fill=bar.querySelector('.fs-bar__fill');var label=bar.querySelector('.fs-bar__label');
    if(fill)fill.style.width=pct+'%';
    if(label)label.textContent=pct>=100?'🎉 Free shipping unlocked!':'$'+((threshold-totalCents)/100).toFixed(2)+' away from free shipping';
  }
  function _fmt(c){return '$'+(c/100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',');}
  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

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
      var buyBtn=detail.querySelector('a[href*="/checkout"]');
      if(buyBtn){
        var vid=atc?atc.dataset.variantId:null;
        if(vid)buyBtn.href='/checkout?variant='+vid+'&quantity='+val;
      }
    }
  });

  /* ─────────── PRODUCT THUMBNAILS ─────────── */
  document.addEventListener('click',function(e){
    var thumb=e.target.closest('.product-media-thumb, .sph__thumb');if(!thumb)return;
    var stack=thumb.closest('.product-media-stack, .sph__media');if(!stack)return;
    var main=qs('#ProductMainImage, #SphMainImg, .sph__img',stack);if(!main)return;
    var img=thumb.querySelector('img');if(!img)return;
    main.src=img.src.replace(/_\d+x\d+/,'_900x900').replace(/_\d+x\./,'_900x.');
    qsa('.product-media-thumb, .sph__thumb',stack).forEach(function(t){t.classList.remove('is-active');});
    thumb.classList.add('is-active');
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
    if(lbl){var sp=lbl.querySelector('[id^="selected-"]');if(sp)sp.textContent=sw.dataset.optionValue;}
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
    if(buy)buy.href='/checkout?variant='+vid+'&quantity=1';
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
        if(priceEl)priceEl.textContent=_fmt(match.price);

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

        // Also update featured image if variant has one
        if(match.featured_image && match.featured_image.src){
          var mainImg=form.querySelector('#ProductMainImage, #SphMainImg, .sph__img, [data-main-image]');
          if(mainImg){
            mainImg.src=match.featured_image.src;
          }
        }

        // Update Buy Now link href
        var buyBtn=form.querySelector('a[href*="/checkout"]');
        if(buyBtn){
          var currentQty=1;
          var qtyInp=form.querySelector('[data-qty-input],.product-qty__val,.sph__qty-val');
          if(qtyInp)currentQty=parseInt(qtyInp.value)||1;
          buyBtn.href='/checkout?variant='+match.id+'&quantity='+currentQty;
        }
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

  /* ─────────── ESC KEY ─────────── */
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape')return;
    closeNav();closeCartDrawer();closeSearch();
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
    if(document.cookie.indexOf('blc_cookie_consent=accepted')>-1)_activateTracking();
  });

  /* ─────────── GLOBAL BLC NAMESPACE ─────────── */
  window.BLC={
    openNav:openNav,closeNav:closeNav,toggleNavGroup:toggleNavGroup,
    openSearch:openSearch,closeSearch:closeSearch,
    openCartDrawer:openCartDrawer,closeCartDrawer:closeCartDrawer,
    openCart:openCartDrawer,closeCart:closeCartDrawer,
    addToCart:addToCart,
    refreshCartDrawer:refreshCartDrawer,
    acceptCookies:function(){
      var expires=';max-age=31536000;path=/;SameSite=Lax';
      document.cookie='blc_cookie=1'+expires;
      document.cookie='blc_cookie_consent=accepted'+expires;
      if (window.Shopify && window.Shopify.customerPrivacy) {
        try { window.Shopify.customerPrivacy.setTrackingConsent(true, function() {}); } catch(_) {}
      }
      var el=document.getElementById('cookie-consent');
      if(el){
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
        try { window.Shopify.customerPrivacy.setTrackingConsent(false, function() {}); } catch(_) {}
      }
      var el=document.getElementById('cookie-consent');
      if(el){
        el.classList.add('is-hidden');
        setTimeout(function(){el.setAttribute('hidden', '');},380);
      }
      if(window.dataLayer)window.dataLayer.push({event:'cookie_consent', consent_choice:'declined'});
    }
  };
})();
