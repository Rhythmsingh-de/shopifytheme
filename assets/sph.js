/**
 * sph.js — Single Product Home interactive behaviours
 * SPH-06: loaded once via layout/theme.liquid, NOT inside the section
 * Handles: review slider (SPH-10 CSS classes), gallery (SPH-11), compare toggle, DetailsAccordion
 */

/* ─── 1. Review Slider — SPH-10: CSS class toggles instead of inline style mutation ─── */
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
      const allCards = container.querySelectorAll('.sph-review-card');
      const first    = allCards[0];
      const nextCard = allCards[visibleCount];
      if (!first) return;
      /* SPH-10: enter via CSS class, not inline style */
      if (nextCard) nextCard.classList.add('is-entering');
      first.classList.add('is-leaving');
      setTimeout(function () {
        first.classList.remove('is-leaving');
        if (nextCard) nextCard.classList.remove('is-entering');
        container.appendChild(first);
      }, 600);
    }, intervalMs);
    container.dataset.sliderIntervalId = String(id);
  });
}

/* ─── 2. Image Gallery — SPH-11: scoped initGallery per section ─── */
function initGallery(root) {
  (root || document).querySelectorAll('[data-sph-gallery]').forEach(function (gallery) {
    if (gallery.dataset.galleryReady === 'true') return;
    gallery.dataset.galleryReady = 'true';
    const thumbs = gallery.querySelectorAll('[data-gallery-thumb]');
    const mainImg = gallery.querySelector('[data-gallery-main]');
    if (!thumbs.length || !mainImg) return;
    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        const src    = thumb.dataset.gallerySrc || thumb.querySelector('img')?.src;
        const srcset = thumb.dataset.gallerySrcset || thumb.querySelector('img')?.srcset || '';
        const alt    = thumb.dataset.galleryAlt    || thumb.querySelector('img')?.alt    || '';
        if (!src) return;
        mainImg.setAttribute('src', src);
        if (srcset) mainImg.setAttribute('srcset', srcset);
        mainImg.setAttribute('alt', alt);
        thumbs.forEach(t => t.classList.remove('is-active'));
        thumb.classList.add('is-active');
      });
    });
    /* Mark first thumb active */
    if (thumbs[0]) thumbs[0].classList.add('is-active');
  });
}

/* ─── 3. Compare Toggle ─── */
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

/* ─── 4. DetailsAccordion custom element ─── */
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

/* ─── Boot ─── */
function sphBoot(root) {
  initReviewSlider(root);
  initGallery(root);
}
document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', () => sphBoot(document))
  : sphBoot(document);
document.addEventListener('shopify:section:load', e => {
  if (e.target.querySelector('.sph-review-cards,[data-sph-nav],[data-sph-gallery]')) sphBoot(e.target);
});
