(function () {
  const status = (message, button) => {
    const region = button?.closest('.share-actions, .public-share-tools')?.querySelector('.share-status') || document.querySelector('.share-status');
    if (region) region.textContent = message;
  };
  const publicUrl = () => window.location.origin + window.location.pathname;
  document.querySelectorAll('[data-share-page]').forEach(button => button.addEventListener('click', async () => {
    const payload = { title: document.title, text: 'Independent, nonpartisan voter information from OpenVoterGuide.', url: publicUrl() };
    if (navigator.share) { try { await navigator.share(payload); } catch (error) { if (error.name !== 'AbortError') status('Sharing is unavailable here. Copy the link instead.', button); } }
    else { try { await navigator.clipboard.writeText(payload.url); status('Link copied.', button); } catch { status(payload.url, button); } }
  }));
  document.querySelectorAll('[data-copy-page-link]').forEach(button => button.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(publicUrl()); status('Link copied.', button); }
    catch { status(`Copy this link: ${publicUrl()}`, button); }
  }));
  document.querySelectorAll('[data-facebook-share]').forEach(link => {
    link.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl())}`;
  });
  document.querySelectorAll('[data-print-flyer]').forEach(button => button.addEventListener('click', () => {
    document.body.dataset.flyerFormat = button.dataset.printFlyer;
    window.print();
  }));
  window.addEventListener('afterprint', () => { delete document.body.dataset.flyerFormat; });
})();
