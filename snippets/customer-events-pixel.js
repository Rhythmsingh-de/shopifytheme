// Shopify Custom Web Pixel for GA4 & GTM Event Tracking
// Instructions: Paste this code into your Shopify Admin under Settings > Customer Events > Add custom pixel.

analytics.subscribe("page_viewed", (event) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "page_view",
    page_url: event.context.document.location.href,
    page_title: event.context.document.title
  });
});

analytics.subscribe("product_viewed", (event) => {
  window.dataLayer = window.dataLayer || [];
  const variant = event.data.productVariant;
  if (!variant) return;
  window.dataLayer.push({
    event: "view_item",
    ecommerce: {
      currency: variant.price.currencyCode,
      value: parseFloat(variant.price.amount),
      items: [{
        item_id: String(variant.id),
        item_name: variant.product.title,
        item_variant: variant.title,
        price: parseFloat(variant.price.amount),
        quantity: 1
      }]
    }
  });
});

analytics.subscribe("product_added_to_cart", (event) => {
  window.dataLayer = window.dataLayer || [];
  const line = event.data.cartLine;
  if (!line || !line.merchandise) return;
  const variant = line.merchandise;
  window.dataLayer.push({
    event: "add_to_cart",
    ecommerce: {
      currency: variant.price.currencyCode,
      value: parseFloat(variant.price.amount) * line.quantity,
      items: [{
        item_id: String(variant.id),
        item_name: variant.product.title,
        item_variant: variant.title,
        price: parseFloat(variant.price.amount),
        quantity: line.quantity
      }]
    }
  });
});

analytics.subscribe("checkout_started", (event) => {
  window.dataLayer = window.dataLayer || [];
  const checkout = event.data.checkout;
  if (!checkout) return;
  window.dataLayer.push({
    event: "begin_checkout",
    ecommerce: {
      currency: checkout.totalPrice.currencyCode,
      value: parseFloat(checkout.totalPrice.amount),
      items: (checkout.lineItems || []).map(item => ({
        item_id: String(item.variant ? item.variant.id : ''),
        item_name: item.title,
        item_variant: item.variant ? item.variant.title : '',
        price: item.variant ? parseFloat(item.variant.price.amount) : 0,
        quantity: item.quantity
      }))
    }
  });
});

analytics.subscribe("checkout_completed", (event) => {
  window.dataLayer = window.dataLayer || [];
  const checkout = event.data.checkout;
  if (!checkout || !checkout.order) return;
  window.dataLayer.push({
    event: "purchase",
    ecommerce: {
      transaction_id: String(checkout.order.id),
      currency: checkout.totalPrice.currencyCode,
      value: parseFloat(checkout.totalPrice.amount),
      tax: checkout.totalTax ? parseFloat(checkout.totalTax.amount) : 0,
      shipping: checkout.shippingLine ? parseFloat(checkout.shippingLine.price.amount) : 0,
      items: (checkout.lineItems || []).map(item => ({
        item_id: String(item.variant ? item.variant.id : ''),
        item_name: item.title,
        item_variant: item.variant ? item.variant.title : '',
        price: item.variant ? parseFloat(item.variant.price.amount) : 0,
        quantity: item.quantity
      }))
    }
  });
});
