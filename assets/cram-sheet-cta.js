/*
 * Shared "download the free cram sheet" box.
 * Every page has a placeholder like:
 *   <div data-cram-cta><p><a href="/free-cram-sheet.pdf">Download the free cram sheet (PDF)</a></p></div>
 *   <script src="/assets/cram-sheet-cta.js" defer></script>
 * The plain link inside the placeholder still works if this script fails to load.
 * To change the wording, link or styling on every page, edit only this file.
 * data-cram-cta="pretrip" picks the pre-trip cheat sheet variant below.
 */
(function () {
  var VARIANTS = {
    'default': {
      eyebrow: 'Free download',
      heading: 'IUOE aptitude test cram sheet',
      text: 'Every formula, conversion and exam trap on one page. Free PDF, no email needed.',
      button: 'Download the free cram sheet (PDF) →',
      href: '/free-cram-sheet.pdf',
      event: 'cram_sheet_download'
    },
    'pretrip': {
      eyebrow: 'Free download',
      heading: 'Pre-trip inspection cheat sheet',
      text: 'The full inspection sequence, air brake specs and defect lists on one page. Free PDF, no email needed.',
      button: 'Download the free cheat sheet (PDF) →',
      href: '/pretrip-cheatsheet.pdf',
      event: 'pretrip_sheet_download'
    }
  };

  var CSS =
    '.cram-cta{background:#111;border:1px solid #333;border-top:3px solid #e8a020;border-radius:8px;' +
    'padding:2rem 1.5rem;margin:3rem auto;max-width:640px;width:calc(100% - 2rem);box-sizing:border-box;' +
    'text-align:center;font-family:inherit;}' +
    '.cram-cta__eyebrow{font-size:.75rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;' +
    'color:#e8a020;margin:0 0 .5rem;}' +
    '.cram-cta__heading{font-size:1.3rem;font-weight:800;color:#f0ede8;margin:0 0 .5rem;line-height:1.3;}' +
    '.cram-cta__text{color:#aaa;font-size:.95rem;margin:0 0 1.25rem;line-height:1.5;}' +
    '.cram-cta__btn{display:inline-block;background:#e8a020;color:#0d0d0d !important;font-weight:800;' +
    'padding:.85rem 1.5rem;border-radius:6px;text-decoration:none !important;font-size:1rem;line-height:1.3;}' +
    '.cram-cta__btn:hover,.cram-cta__btn:focus{background:#f5b53a;}';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    n.className = cls;
    n.textContent = text;
    return n;
  }

  function render() {
    var slots = document.querySelectorAll('[data-cram-cta]');
    if (!slots.length) return;

    if (!document.getElementById('cram-cta-style')) {
      var style = document.createElement('style');
      style.id = 'cram-cta-style';
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      var v = VARIANTS[slot.getAttribute('data-cram-cta')] || VARIANTS['default'];
      var box = el('section', 'cram-cta', '');
      box.appendChild(el('p', 'cram-cta__eyebrow', v.eyebrow));
      box.appendChild(el('h3', 'cram-cta__heading', v.heading));
      box.appendChild(el('p', 'cram-cta__text', v.text));
      var a = el('a', 'cram-cta__btn', v.button);
      a.href = v.href;
      a.target = '_blank';
      a.rel = 'noopener';
      (function (eventName, href) {
        a.addEventListener('click', function () {
          if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, {
              event_category: 'engagement',
              event_label: href,
              page_path: window.location.pathname
            });
          }
        });
      })(v.event, v.href);
      box.appendChild(a);
      slot.innerHTML = '';
      slot.appendChild(box);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
