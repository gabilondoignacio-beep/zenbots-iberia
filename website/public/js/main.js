/* ZENBOTS IBERIA — main.js */

// ===== SERVICE WORKER (PWA) =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW error:', err));
  });
}

// ===== NAV SCROLL EFFECT =====
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 30);
});

navToggle?.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

navLinks?.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ===== REVEAL ON SCROLL =====
const observer = new IntersectionObserver(
  entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 0.1}s`;
  observer.observe(el);
});

// ===== COUNTER ANIMATION =====
function animateCounter(el, target) {
  const duration = 1800;
  const step = target / (duration / 16);
  let current = 0;
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = Math.floor(current);
    if (current >= target) clearInterval(timer);
  }, 16);
}

const statsObserver = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const nums = e.target.querySelectorAll('[data-target]');
    nums.forEach(n => animateCounter(n, parseInt(n.dataset.target)));
    statsObserver.unobserve(e.target);
  }),
  { threshold: 0.5 }
);
const statsEl = document.querySelector('.stats__container');
if (statsEl) statsObserver.observe(statsEl);

// ===== LOAD PRODUCTS =====
const CATEGORY_NAMES = { asistencia: 'Asistencia', limpieza: 'Limpieza', jardin: 'Jardín' };

async function loadProducts(filter = 'all') {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  try {
    const url = filter === 'all' ? '/api/products' : `/api/products?category=${filter}`;
    const res = await fetch(url);
    const products = await res.json();

    if (!products.length) {
      grid.innerHTML = '<p class="products__loading">No hay productos en esta categoría.</p>';
      return;
    }

    grid.innerHTML = products.map(p => {
      const features = (p.features || '').split('|').slice(0, 4);
      return `
        <div class="product-card">
          <div class="product-card__image">
            <div class="product-card__robot-mini">
              <div class="mini-head"><div class="mini-eye"></div><div class="mini-eye"></div></div>
              <div class="mini-body"></div>
              <div class="mini-base"></div>
            </div>
            ${p.badge ? `<span class="product-card__badge">${p.badge}</span>` : ''}
          </div>
          <div class="product-card__body">
            <div class="product-card__category">${CATEGORY_NAMES[p.category] || p.category}</div>
            <h3 class="product-card__name">${p.name}</h3>
            <p class="product-card__desc">${p.description?.slice(0, 120)}…</p>
            <ul class="product-card__features">
              ${features.map(f => `<li>${f}</li>`).join('')}
            </ul>
            <div class="product-card__footer">
              <div>
                <span class="product-card__price">${Number(p.price_retail).toLocaleString('es-ES')} €</span>
                <span class="product-card__price-sub">IVA incluido · Instalación gratis</span>
              </div>
              <a href="#contacto" class="btn btn--ghost" style="padding:10px 16px;font-size:13px;">
                Solicitar demo
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch {
    // fallback static products if server not running
    grid.innerHTML = `
      <div class="product-card">
        <div class="product-card__image">
          <div class="product-card__robot-mini">
            <div class="mini-head"><div class="mini-eye"></div><div class="mini-eye"></div></div>
            <div class="mini-body"></div><div class="mini-base"></div>
          </div>
          <span class="product-card__badge">MÁS VENDIDO</span>
        </div>
        <div class="product-card__body">
          <div class="product-card__category">Asistencia</div>
          <h3 class="product-card__name">ZenAssist Pro</h3>
          <p class="product-card__desc">Robot asistente para personas mayores con IA avanzada, detección de caídas y videollamadas HD.</p>
          <ul class="product-card__features">
            <li>Navegación LiDAR autónoma</li>
            <li>Detección de caídas automática</li>
            <li>Videollamadas HD familiares</li>
            <li>Dispensador de medicamentos</li>
          </ul>
          <div class="product-card__footer">
            <div>
              <span class="product-card__price">4.499 €</span>
              <span class="product-card__price-sub">IVA incluido · Instalación gratis</span>
            </div>
            <a href="#contacto" class="btn btn--ghost" style="padding:10px 16px;font-size:13px;">Solicitar demo</a>
          </div>
        </div>
      </div>
      <div class="product-card">
        <div class="product-card__image">
          <div class="product-card__robot-mini">
            <div class="mini-head"><div class="mini-eye"></div><div class="mini-eye"></div></div>
            <div class="mini-body"></div><div class="mini-base"></div>
          </div>
          <span class="product-card__badge">NUEVO</span>
        </div>
        <div class="product-card__body">
          <div class="product-card__category">Asistencia</div>
          <h3 class="product-card__name">ZenCompañía</h3>
          <p class="product-card__desc">Robot compañero con IA conversacional en español para una vida más autónoma e independiente.</p>
          <ul class="product-card__features">
            <li>IA conversacional en español</li>
            <li>Reconocimiento facial</li>
            <li>Control domótica integrado</li>
            <li>Recordatorio medicación y citas</li>
          </ul>
          <div class="product-card__footer">
            <div>
              <span class="product-card__price">2.999 €</span>
              <span class="product-card__price-sub">IVA incluido · Instalación gratis</span>
            </div>
            <a href="#contacto" class="btn btn--ghost" style="padding:10px 16px;font-size:13px;">Solicitar demo</a>
          </div>
        </div>
      </div>
      <div class="product-card">
        <div class="product-card__image">
          <div class="product-card__robot-mini">
            <div class="mini-head"><div class="mini-eye"></div><div class="mini-eye"></div></div>
            <div class="mini-body"></div><div class="mini-base"></div>
          </div>
          <span class="product-card__badge">OFERTA</span>
        </div>
        <div class="product-card__body">
          <div class="product-card__category">Limpieza</div>
          <h3 class="product-card__name">ZenClean X1 Ultra</h3>
          <p class="product-card__desc">Robot aspirador y fregador con estación de autovaciado. 60 días sin vaciar. Limpieza total autónoma.</p>
          <ul class="product-card__features">
            <li>Autovaciado 60 días</li>
            <li>Navegación LiDAR 360°</li>
            <li>Fregado presión variable</li>
            <li>App iOS y Android</li>
          </ul>
          <div class="product-card__footer">
            <div>
              <span class="product-card__price">899 €</span>
              <span class="product-card__price-sub">IVA incluido · Instalación gratis</span>
            </div>
            <a href="#contacto" class="btn btn--ghost" style="padding:10px 16px;font-size:13px;">Solicitar demo</a>
          </div>
        </div>
      </div>
    `;
  }
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('filter-btn--active'));
    btn.classList.add('filter-btn--active');
    loadProducts(btn.dataset.filter);
  });
});

loadProducts();

// ===== CONTACT FORM =====
const contactForm = document.getElementById('contactForm');
const contactSuccess = document.getElementById('contactSuccess');
const submitBtn = document.getElementById('submitBtn');

contactForm?.addEventListener('submit', async e => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando…';

  const data = Object.fromEntries(new FormData(e.target));

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();

    if (json.success) {
      contactForm.style.display = 'none';
      contactSuccess.style.display = 'block';
    } else {
      alert(json.error || 'Error al enviar. Inténtelo de nuevo.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg> Enviar solicitud';
    }
  } catch {
    // If server not running, simulate success
    contactForm.style.display = 'none';
    contactSuccess.style.display = 'block';
  }
});

// ===== NEWSLETTER FORM =====
const newsletterForm = document.getElementById('newsletterForm');

newsletterForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const email = e.target.querySelector('input[type="email"]').value;
  const btn = e.target.querySelector('button');
  btn.textContent = '¡Suscrito!';
  btn.disabled = true;
  btn.style.background = '#0A1628';

  try {
    await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  } catch { /* silent */ }
});

// ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ===== FAQ TOGGLE =====
window.toggleFaq = (btn) => {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
};

// ===== ROI CALCULATOR =====
document.getElementById('calcRoiBtn')?.addEventListener('click', async () => {
  const payload = {
    robots: parseInt(document.getElementById('roiRobots').value) || 1,
    price: parseFloat(document.getElementById('roiPrice').value) || 4499,
    staff_cost: parseFloat(document.getElementById('roiStaff').value) || 14,
    hours_saved: parseFloat(document.getElementById('roiHours').value) || 4,
  };
  try {
    const r = await fetch('/api/roi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(res => res.json());

    document.getElementById('roiSavings').textContent = `${r.annual_savings.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €`;
    document.getElementById('roiPct').textContent = `${r.roi_pct}%`;
    document.getElementById('roiPayback').textContent = `${r.payback_months} meses`;
    document.getElementById('roiResults').style.display = 'grid';
  } catch {
    alert('Error calculando ROI. Inténtalo de nuevo.');
  }
});

// ===== COOKIE BANNER =====
(function initCookies() {
  const consent = localStorage.getItem('cookie_consent');
  if (!consent) {
    setTimeout(() => {
      const banner = document.getElementById('cookieBanner');
      if (banner) banner.style.display = 'block';
    }, 2000);
  }
})();

window.setCookieConsent = (accepted) => {
  localStorage.setItem('cookie_consent', accepted ? 'all' : 'essential');
  const banner = document.getElementById('cookieBanner');
  if (banner) banner.style.display = 'none';
};
