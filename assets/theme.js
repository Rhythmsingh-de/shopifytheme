// Minimal theme JS - dataLayer + AJAX cart from original export
document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('.product__form');
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const variantId = formData.get('id');
      const quantity = formData.get('quantity') || 1;
      try {
        const res = await fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: variantId, quantity: quantity }) });
        const item = await res.json();
        if (window.dataLayer) { dataLayer.push({ event: 'add_to_cart', ecommerce: { currency: '{{ cart.currency.iso_code }}', value: item.price / 100, items: [{ item_id: item.variant_id, item_name: item.product_title, price: item.price / 100, quantity: parseInt(quantity) }] } }); }
        window.location.href = '/cart';
      } catch (err) { form.submit(); }
    });
  });
});