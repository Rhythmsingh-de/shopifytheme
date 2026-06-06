document.addEventListener('click', function (event) {
  const trigger = event.target.closest('[data-faq-question]');
  if (!trigger) return;
  const item = trigger.closest('.faq-item');
  if (!item) return;
  item.classList.toggle('open');
});
