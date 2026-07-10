/**
 * sph.js — Single Product Home interactive behaviours
 * Handles: review slider, compare toggle (localStorage), DetailsAccordion
 */

/* 1. Review Slider */
function initReviewSlider(root) {
  (root || document).querySelectorAll('.sph-review-cards').forEach(function (container) {
    if (container.dataset.sliderIntervalId) {
      clearInterval(parseInt(container.dataset.sliderIntervalId, 10));
    }
    const cards = container.querySelectorAll('.sph-review-card');
    if (!cards.length) return;
    Array.from(cards).sort(() => 0.5 - Math.random()).forEach(c => container.appendChild(c));
    const cycling      = container.dataset.cycling === 'true';
    const intervalMs   = parseFloat(container.dataset.interval) || 3500;
    const visibleCount = parseInt(container.dataset.visible, 10) || 3;
    if (!cycling || container.querySelectorAll('.sph-review-card').length <= visibleCount) return;
    const id = setInterval(function () {
      const first    = container.querySelector('.sph-review-card');
      const nextCard = container.children[visibleCount];
      if (!first) return;
      if (nextCard) {
        nextCard.style.cssText = 'display:flex;opacity:0;transition:opacity .6s ease';
        nextCard.offsetHeight;
        nextCard.style.opacity = '1';
      }
      first.style.transition = 'opacity .6s ease,transform .6s ease,max-height .6s ease,margin .6s ease,padding .6s ease,border-width .6s ease';
      Object.assign(first.style, { opacity:'0', transform:'translateY(-20px)', maxHeight:'0', paddingTop:'0', paddingBottom:'0', marginTop:'0', marginBottom:'0', borderWidth:'0', overflow:'hidden' });
      setTimeout(function () {
        ['transition','opacity','transform','maxHeight','paddingTop','paddingBottom','marginTop','marginBottom','borderWidth','overflow'].forEach(p => first.style[p] = '');
        if (nextCard) ['transition','opacity','display'].forEach(p => nextCard.style[p] = '');
        container.appendChild(first);
      }, 600);
    }, intervalMs);
    container.dataset.sliderIntervalId = String(id);
  });
}

/* 2. Compare Toggle */
(function () {
  const KEY = 'theme_compare_products';
  const getList  = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const saveList = l => { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch {} };
  function syncButton(btn) {
    const saved = getList().some(i => String(i.id) === String(btn.dataset.productId));
    btn.classList.toggle('is-saved', saved);
    btn.setAttribute('aria-pressed', String(saved));
    btn.setAttribute('aria-label', (saved ? 'Remove ' : 'Add ') + btn.dataset.productTitle + (saved ? ' from compare' : ' to compare'));
  }
  function initCompare(root) { (root || document).querySelectorAll('[data-compare-btn]').forEach(syncButton); }
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-compare-btn]');
    if (!btn) return;
    e.preventDefault();
    const list  = getList();
    const id    = String(btn.dataset.productId);
    const index = list.findIndex(i => String(i.id) === id);
    if (index > -1) list.splice(index, 1);
    else list.push({ id, title: btn.dataset.productTitle || '', url: btn.dataset.productUrl || '' });
    saveList(list.slice(-4));
    syncButton(btn);
    window.dispatchEvent(new CustomEvent('compare:updated', { detail: { products: getList() } }));
  });
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', () => initCompare(document)) : initCompare(document);
  document.addEventListener('shopify:section:load', e => initCompare(e.target));
})();

/* 3. DetailsAccordion custom element */
class DetailsAccordion extends HTMLElement {
  connectedCallback() {
    if (this.dataset.accordionReady === 'true') return;
    this.dataset.accordionReady = 'true';
    this._details   = this.querySelector('details');
    this._summary   = this.querySelector('summary');
    this._content   = this.querySelector('.sph-description__a');
    this._animation = null;
    this._closing   = false;
    this._expanding = false;
    if (this._summary) this._summary.addEventListener('click', e => this._onClick(e));
  }
  _onClick(e) {
    e.preventDefault();
    this._details.style.overflow = 'hidden';
    if (this._closing || !this._details.open) this._open();
    else this._shrink();
  }
  _shrink() {
    this._closing = true;
    this._animate(this._details.offsetHeight, this._summary.offsetHeight, false);
  }
  _open() {
    this._details.style.height = `${this._details.offsetHeight}px`;
    this._details.open = true;
    requestAnimationFrame(() => this._expand());
  }
  _expand() {
    this._expanding = true;
    this._animate(this._details.offsetHeight, this._summary.offsetHeight + this._content.offsetHeight, true);
  }
  _animate(from, to, opening) {
    if (this._animation) this._animation.cancel();
    this._animation = this._details.animate({ height: [`${from}px`, `${to}px`] }, { duration: opening ? 350 : 300, easing: 'cubic-bezier(0.16,1,0.3,1)' });
    this._animation.onfinish = () => this._finish(opening);
    this._animation.oncancel = () => { this._closing = false; this._expanding = false; };
  }
  _finish(open) {
    this._details.open  = open;
    this._animation     = null;
    this._closing       = false;
    this._expanding     = false;
    this._details.style.height   = '';
    this._details.style.overflow = '';
    open ? this.setAttribute('open', '') : this.removeAttribute('open');
  }
}
if (!customElements.get('details-accordion')) customElements.define('details-accordion', DetailsAccordion);

/* Boot */
function sphBoot(root) { initReviewSlider(root); }
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', () => sphBoot(document)) : sphBoot(document);
document.addEventListener('shopify:section:load', e => { if (e.target.querySelector('.sph-review-cards,[data-sph-nav]')) sphBoot(e.target); });
