/* OpenClash's subscribe fields: grow each address textarea to its
   content, and follow table changes and window resizes. Runs on that one
   page only; taken from the Xocen build. */
(() => {
  'use strict';
  if (document.body?.dataset.page !== 'admin-services-openclash-config-subscribe') return;
  const selector = '#cbi-openclash-config_subscribe td[data-name="address"][data-widget="tvalue"] textarea';
  const widths = new WeakMap();
  let pending = false;
  function resize(el) {
    if (!el.getClientRects().length) return;
    el.style.setProperty('height', '0px', 'important');
    const style = getComputedStyle(el);
    const border = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    el.style.setProperty('height', Math.ceil(el.scrollHeight + border) + 'px', 'important');
  }
  function refresh() {
    pending = false;
    document.querySelectorAll(selector).forEach(el => {
      if (observer && !widths.has(el)) {
        widths.set(el, el.getBoundingClientRect().width);
        observer.observe(el);
      }
      resize(el);
    });
  }
  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(refresh); }
  }
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(entries => {
    for (const entry of entries) {
      const width = entry.target.getBoundingClientRect().width;
      if (widths.get(entry.target) !== width) { widths.set(entry.target, width); schedule(); }
    }
  });
  document.addEventListener('input', event => {
    if (event.target.matches?.(selector)) resize(event.target);
  });
  window.addEventListener('resize', schedule);
  if (typeof MutationObserver !== 'undefined') {
    const table = document.querySelector('#cbi-openclash-config_subscribe');
    if (table) new MutationObserver(schedule).observe(table, {childList: true, subtree: true});
  }
  schedule();
})();
