/* ZENBOTS IBERIA — ERP Admin Panel */

const TOKEN = new URLSearchParams(location.search).get('token') || localStorage.getItem('erp_token') || '';
if (TOKEN) localStorage.setItem('erp_token', TOKEN);

const api = async (path, opts = {}) => {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', 'x-admin-token': TOKEN },
    ...opts,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// ===== HEADER DATE =====
document.getElementById('headerDate').textContent = new Date().toLocaleDateString('es-ES', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

// ===== SIDEBAR TOGGLE =====
const sidebar = document.getElementById('sidebar');
document.getElementById('sidebarToggle')?.addEventListener('click', () => sidebar.classList.toggle('open'));

// ===== NAVIGATION =====
const pages = document.querySelectorAll('.page');
const links = document.querySelectorAll('.sidebar__link[data-page]');
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  contacts: 'CRM — Leads',
  customers: 'Clientes',
  orders: 'Pedidos',
  inventory: 'Inventario',
  maintenance: 'Mantenimientos',
  newsletter: 'Newsletter',
  emails: 'Bandeja de correo',
  suppliers: 'Proveedores',
  expenses: 'Gastos & Cashflow',
  reports: 'Informes financieros',
};

function showPage(name) {
  pages.forEach(p => p.classList.remove('active'));
  links.forEach(l => l.classList.remove('active'));
  const page = document.getElementById(`page-${name}`);
  if (page) page.classList.add('active');
  const link = document.querySelector(`[data-page="${name}"]`);
  if (link) link.classList.add('active');
  document.getElementById('pageTitle').textContent = PAGE_TITLES[name] || name;
  location.hash = name;
  loaders[name]?.();
}

links.forEach(l => l.addEventListener('click', e => {
  e.preventDefault();
  showPage(l.dataset.page);
  sidebar.classList.remove('open');
}));

document.querySelectorAll('[data-page]').forEach(el => {
  el.addEventListener('click', e => {
    if (el.tagName === 'A' && !el.dataset.page) return;
    e.preventDefault();
    showPage(el.dataset.page);
  });
});

// ===== MODAL =====
const overlay = document.getElementById('modalOverlay');
const modal = { title: document.getElementById('modalTitle'), body: document.getElementById('modalBody'), footer: document.getElementById('modalFooter') };

function openModal(title, bodyHTML, footerHTML = '') {
  modal.title.textContent = title;
  modal.body.innerHTML = bodyHTML;
  modal.footer.innerHTML = footerHTML;
  overlay.classList.add('open');
}
function closeModal() { overlay.classList.remove('open'); }
document.getElementById('modalClose').addEventListener('click', closeModal);
overlay.addEventListener('click', e => e.target === overlay && closeModal());

// ===== STATUS BADGE =====
function badge(status) {
  return `<span class="status-badge status-${status}">${status.replace(/_/g, ' ')}</span>`;
}

// ===== FORMAT CURRENCY =====
function eur(n) { return `${Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`; }

// ===== FORMAT DATE =====
function fdate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }); }

// ===== LOAD DASHBOARD =====
async function loadDashboard() {
  try {
    const d = await api('/api/admin/dashboard');
    document.getElementById('stat-contacts').textContent = d.contacts;
    document.getElementById('stat-new-contacts').textContent = d.new_contacts > 0 ? `${d.new_contacts} nuevos` : '';
    document.getElementById('stat-orders').textContent = d.orders_total;
    document.getElementById('stat-pending-orders').textContent = d.orders_pending > 0 ? `${d.orders_pending} pendientes` : '';
    document.getElementById('stat-revenue').textContent = eur(d.revenue_total);
    document.getElementById('stat-newsletter').textContent = d.newsletter_subs;
    document.getElementById('stat-maintenance').textContent = d.maintenance_active;
    document.getElementById('stat-lowstock').textContent = d.low_stock;
    document.getElementById('stat-mrr').textContent = eur(d.mrr);
    document.getElementById('stat-customers').textContent = d.customers;
    document.getElementById('newLeadsBadge').textContent = d.new_contacts || '';

    // Recent leads
    const contacts = await api('/api/admin/contacts');
    const recentLeads = document.getElementById('recentLeads');
    if (!contacts.length) { recentLeads.innerHTML = '<p style="padding:20px;color:#94A3B8;text-align:center">Sin leads aún</p>'; }
    else {
      recentLeads.innerHTML = contacts.slice(0, 6).map(c => `
        <div class="quick-lead">
          <div class="quick-lead__avatar">${(c.name || 'X').slice(0,2).toUpperCase()}</div>
          <div class="quick-lead__info">
            <div class="quick-lead__name">${c.name}</div>
            <div class="quick-lead__product">${c.product_interest || 'Sin especificar'}</div>
          </div>
          <div class="quick-lead__status">${badge(c.status)}</div>
          <div class="quick-lead__date">${fdate(c.created_at)}</div>
        </div>
      `).join('');
    }

    // Revenue by product
    const rev = document.getElementById('revenueByProduct');
    if (!d.orders_by_product?.length) { rev.innerHTML = '<p style="padding:20px;color:#94A3B8;text-align:center">Sin ventas aún</p>'; }
    else {
      const max = Math.max(...d.orders_by_product.map(r => r.rev), 1);
      rev.innerHTML = `<div class="mini-bar-chart">${d.orders_by_product.map(r => `
        <div class="mini-bar">
          <div class="mini-bar__label">
            <span class="mini-bar__name">${r.name}</span>
            <span class="mini-bar__value">${eur(r.rev)}</span>
          </div>
          <div class="mini-bar__track">
            <div class="mini-bar__fill" style="width:${(r.rev/max*100).toFixed(0)}%"></div>
          </div>
        </div>`).join('')}</div>`;
    }
  } catch (err) {
    console.error('Dashboard error:', err);
  }
}

// ===== LOAD CONTACTS (CRM) =====
async function loadContacts() {
  try {
    const contacts = await api('/api/admin/contacts');
    document.getElementById('contactsCount').textContent = `${contacts.length} leads`;
    const body = document.getElementById('contactsBody');
    if (!contacts.length) { body.innerHTML = '<tr><td colspan="8" class="table-loading">Sin leads aún</td></tr>'; return; }
    body.innerHTML = contacts.map(c => `
      <tr>
        <td><strong>#${c.id}</strong></td>
        <td>${c.name}</td>
        <td><a href="mailto:${c.email}" style="color:#0891B2">${c.email}</a></td>
        <td>${c.phone || '—'}</td>
        <td style="max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.product_interest || '—'}</td>
        <td>
          <select class="status-select" data-id="${c.id}" onchange="updateContactStatus(this)">
            ${['nuevo','contactado','demo_agendada','propuesta','ganado','perdido'].map(s =>
              `<option value="${s}" ${c.status===s?'selected':''}>${s.replace(/_/g,' ')}</option>`
            ).join('')}
          </select>
        </td>
        <td style="white-space:nowrap">${fdate(c.created_at)}</td>
        <td>
          <button class="btn-erp btn-erp--sm btn-erp--ghost" onclick="viewContact(${c.id})">Ver</button>
        </td>
      </tr>
    `).join('');
  } catch { document.getElementById('contactsBody').innerHTML = '<tr><td colspan="8" class="table-loading">Error cargando datos</td></tr>'; }
}

window.updateContactStatus = async (sel) => {
  try { await api(`/api/admin/contacts/${sel.dataset.id}`, { method: 'PATCH', body: JSON.stringify({ status: sel.value }) }); }
  catch { alert('Error actualizando estado'); }
};

window.viewContact = async (id) => {
  const contacts = await api('/api/admin/contacts');
  const c = contacts.find(x => x.id === id);
  if (!c) return;
  openModal(`Lead #${c.id} — ${c.name}`, `
    <div style="display:flex;flex-direction:column;gap:10px">
      <div><strong>Email:</strong> <a href="mailto:${c.email}">${c.email}</a></div>
      <div><strong>Teléfono:</strong> ${c.phone || '—'}</div>
      <div><strong>Producto interés:</strong> ${c.product_interest || '—'}</div>
      <div><strong>Estado:</strong> ${badge(c.status)}</div>
      <div><strong>Fuente:</strong> ${c.source || 'web'}</div>
      <div><strong>Fecha:</strong> ${fdate(c.created_at)}</div>
      ${c.message ? `<div><strong>Mensaje:</strong><br><em style="color:#64748B">${c.message}</em></div>` : ''}
    </div>
  `, `<button class="btn-erp btn-erp--ghost" onclick="closeModal()">Cerrar</button>`);
};

// ===== LOAD CUSTOMERS =====
async function loadCustomers() {
  try {
    const customers = await api('/api/admin/customers');
    const body = document.getElementById('customersBody');
    if (!customers.length) { body.innerHTML = '<tr><td colspan="7" class="table-loading">Sin clientes registrados</td></tr>'; return; }
    body.innerHTML = customers.map(c => `
      <tr>
        <td>#${c.id}</td>
        <td><strong>${c.name}</strong></td>
        <td>${c.email ? `<a href="mailto:${c.email}" style="color:#0891B2">${c.email}</a>` : '—'}</td>
        <td>${c.phone || '—'}</td>
        <td>${badge(c.type || 'particular')}</td>
        <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.address || '—'}</td>
        <td style="white-space:nowrap">${fdate(c.created_at)}</td>
      </tr>
    `).join('');
  } catch { document.getElementById('customersBody').innerHTML = '<tr><td colspan="7" class="table-loading">Error</td></tr>'; }
}

document.getElementById('newCustomerBtn')?.addEventListener('click', () => {
  openModal('Nuevo cliente', `
    <div class="modal-row">
      <div class="modal-field"><label>Nombre *</label><input class="modal-input" id="c_name" placeholder="Nombre completo" /></div>
      <div class="modal-field"><label>Tipo</label><select class="modal-input modal-select" id="c_type"><option value="particular">Particular</option><option value="empresa">Empresa</option><option value="residencia">Residencia</option></select></div>
    </div>
    <div class="modal-row">
      <div class="modal-field"><label>Email</label><input class="modal-input" id="c_email" type="email" placeholder="email@ejemplo.com" /></div>
      <div class="modal-field"><label>Teléfono</label><input class="modal-input" id="c_phone" placeholder="+34 600 000 000" /></div>
    </div>
    <div class="modal-field"><label>Dirección</label><input class="modal-input" id="c_address" placeholder="Calle, número, ciudad" /></div>
    <div class="modal-field"><label>Notas</label><textarea class="modal-input" id="c_notes" rows="2" placeholder="Observaciones…"></textarea></div>
  `, `
    <button class="btn-erp btn-erp--ghost" onclick="closeModal()">Cancelar</button>
    <button class="btn-erp btn-erp--primary" onclick="saveCustomer()">Guardar cliente</button>
  `);
});

window.saveCustomer = async () => {
  const data = {
    name: document.getElementById('c_name').value,
    email: document.getElementById('c_email').value,
    phone: document.getElementById('c_phone').value,
    address: document.getElementById('c_address').value,
    type: document.getElementById('c_type').value,
    notes: document.getElementById('c_notes').value,
  };
  if (!data.name) return alert('Nombre requerido');
  await api('/api/admin/customers', { method: 'POST', body: JSON.stringify(data) });
  closeModal(); loadCustomers();
};

// ===== LOAD ORDERS =====
async function loadOrders() {
  try {
    const orders = await api('/api/admin/orders');
    const body = document.getElementById('ordersBody');
    if (!orders.length) { body.innerHTML = '<tr><td colspan="9" class="table-loading">Sin pedidos aún</td></tr>'; return; }
    body.innerHTML = orders.map(o => `
      <tr>
        <td><strong>${o.order_number || `#${o.id}`}</strong></td>
        <td>${o.customer_name || '—'}</td>
        <td>${o.product_name || '—'}</td>
        <td>${o.quantity}</td>
        <td><strong>${eur(o.total)}</strong></td>
        <td>${badge(o.status)}</td>
        <td>${badge(o.payment_status)}</td>
        <td style="white-space:nowrap">${fdate(o.created_at)}</td>
        <td>
          <select class="status-select" onchange="updateOrderStatus(this, ${o.id})">
            ${['pendiente','confirmado','entregado','cancelado'].map(s =>
              `<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`
            ).join('')}
          </select>
        </td>
      </tr>
    `).join('');
  } catch { document.getElementById('ordersBody').innerHTML = '<tr><td colspan="9" class="table-loading">Error</td></tr>'; }
}

window.updateOrderStatus = async (sel, id) => {
  try { await api(`/api/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status: sel.value }) }); }
  catch { alert('Error actualizando estado'); }
};

document.getElementById('newOrderBtn')?.addEventListener('click', async () => {
  const [customers, products] = await Promise.all([api('/api/admin/customers'), api('/api/admin/inventory')]);
  openModal('Nuevo pedido', `
    <div class="modal-field"><label>Cliente *</label>
      <select class="modal-input modal-select" id="o_customer">
        <option value="">Seleccionar cliente…</option>
        ${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
    </div>
    <div class="modal-field"><label>Producto *</label>
      <select class="modal-input modal-select" id="o_product">
        <option value="">Seleccionar producto…</option>
        ${products.map(p => `<option value="${p.id}" data-price="${p.price_retail}">${p.name} — ${eur(p.price_retail)}</option>`).join('')}
      </select>
    </div>
    <div class="modal-row">
      <div class="modal-field"><label>Cantidad</label><input class="modal-input" id="o_qty" type="number" value="1" min="1" /></div>
      <div class="modal-field"><label>Precio unitario (€)</label><input class="modal-input" id="o_price" type="number" step="0.01" placeholder="0.00" /></div>
    </div>
    <div class="modal-field"><label>Notas</label><textarea class="modal-input" id="o_notes" rows="2"></textarea></div>
  `, `
    <button class="btn-erp btn-erp--ghost" onclick="closeModal()">Cancelar</button>
    <button class="btn-erp btn-erp--primary" onclick="saveOrder()">Crear pedido</button>
  `);
  document.getElementById('o_product')?.addEventListener('change', e => {
    const opt = e.target.selectedOptions[0];
    if (opt?.dataset.price) document.getElementById('o_price').value = opt.dataset.price;
  });
});

window.saveOrder = async () => {
  const data = {
    customer_id: document.getElementById('o_customer').value,
    product_id: document.getElementById('o_product').value,
    quantity: document.getElementById('o_qty').value,
    unit_price: document.getElementById('o_price').value,
    notes: document.getElementById('o_notes').value,
  };
  if (!data.customer_id || !data.product_id) return alert('Cliente y producto requeridos');
  const r = await api('/api/admin/orders', { method: 'POST', body: JSON.stringify(data) });
  closeModal();
  alert(`Pedido ${r.order_number} creado correctamente`);
  loadOrders();
};

// ===== LOAD INVENTORY =====
async function loadInventory() {
  try {
    const products = await api('/api/admin/inventory');
    const body = document.getElementById('inventoryBody');
    body.innerHTML = products.map(p => {
      const margin = p.price_cost > 0 ? Math.round((1 - p.price_cost / p.price_retail) * 100) : 0;
      const stockClass = p.stock === 0 ? 'stock-out' : p.stock < 3 ? 'stock-low' : 'stock-ok';
      return `
        <tr>
          <td style="font-family:monospace;font-size:12px">${p.sku || '—'}</td>
          <td><strong>${p.name}</strong></td>
          <td>${p.category}</td>
          <td><strong>${eur(p.price_retail)}</strong></td>
          <td>${eur(p.price_cost)}</td>
          <td><span style="color:${margin>60?'#16A34A':'#CA8A04'};font-weight:700">${margin}%</span></td>
          <td>
            <div class="stock-indicator">
              <div class="stock-dot ${stockClass}"></div>
              <span>${p.stock} uds</span>
            </div>
          </td>
          <td>${p.active ? '<span class="status-badge status-activo">activo</span>' : '<span class="status-badge status-perdido">inactivo</span>'}</td>
          <td>
            <button class="btn-erp btn-erp--sm btn-erp--ghost" onclick="editStock(${p.id}, '${p.name}', ${p.stock})">Stock</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch { document.getElementById('inventoryBody').innerHTML = '<tr><td colspan="9" class="table-loading">Error</td></tr>'; }
}

window.editStock = (id, name, currentStock) => {
  openModal(`Actualizar stock — ${name}`, `
    <div class="modal-field">
      <label>Nuevo stock</label>
      <input class="modal-input" id="new_stock" type="number" value="${currentStock}" min="0" />
    </div>
  `, `
    <button class="btn-erp btn-erp--ghost" onclick="closeModal()">Cancelar</button>
    <button class="btn-erp btn-erp--primary" onclick="saveStock(${id})">Guardar</button>
  `);
};
window.saveStock = async (id) => {
  const stock = document.getElementById('new_stock').value;
  await api(`/api/admin/inventory/${id}`, { method: 'PATCH', body: JSON.stringify({ stock }) });
  closeModal(); loadInventory();
};

// ===== LOAD MAINTENANCE =====
async function loadMaintenance() {
  try {
    const contracts = await api('/api/admin/maintenance');
    const body = document.getElementById('maintenanceBody');
    if (!contracts.length) { body.innerHTML = '<tr><td colspan="7" class="table-loading">Sin contratos aún</td></tr>'; return; }
    body.innerHTML = contracts.map(c => `
      <tr>
        <td>#${c.id}</td>
        <td>${c.customer_name || '—'}</td>
        <td>${c.product_name || '—'}</td>
        <td style="white-space:nowrap">${fdate(c.start_date)}</td>
        <td style="white-space:nowrap">${fdate(c.end_date)}</td>
        <td><strong>${eur(c.price_annual)}</strong></td>
        <td>${badge(c.status)}</td>
      </tr>
    `).join('');
  } catch { document.getElementById('maintenanceBody').innerHTML = '<tr><td colspan="7" class="table-loading">Error</td></tr>'; }
}

document.getElementById('newMaintenanceBtn')?.addEventListener('click', async () => {
  const [customers, products] = await Promise.all([api('/api/admin/customers'), api('/api/admin/inventory')]);
  openModal('Nuevo contrato de mantenimiento', `
    <div class="modal-field"><label>Cliente *</label>
      <select class="modal-input modal-select" id="m_customer">
        <option value="">Seleccionar cliente…</option>
        ${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
    </div>
    <div class="modal-field"><label>Producto</label>
      <select class="modal-input modal-select" id="m_product">
        <option value="">Seleccionar producto…</option>
        ${products.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
      </select>
    </div>
    <div class="modal-row">
      <div class="modal-field"><label>Fecha inicio</label><input class="modal-input" id="m_start" type="date" /></div>
      <div class="modal-field"><label>Fecha fin</label><input class="modal-input" id="m_end" type="date" /></div>
    </div>
    <div class="modal-field"><label>Precio anual (€)</label><input class="modal-input" id="m_price" type="number" value="199" /></div>
  `, `
    <button class="btn-erp btn-erp--ghost" onclick="closeModal()">Cancelar</button>
    <button class="btn-erp btn-erp--primary" onclick="saveMaintenance()">Guardar contrato</button>
  `);
  const today = new Date().toISOString().slice(0, 10);
  const nextYear = new Date(Date.now() + 365*24*60*60*1000).toISOString().slice(0, 10);
  document.getElementById('m_start').value = today;
  document.getElementById('m_end').value = nextYear;
});

window.saveMaintenance = async () => {
  const data = {
    customer_id: document.getElementById('m_customer').value,
    product_id: document.getElementById('m_product').value || null,
    start_date: document.getElementById('m_start').value,
    end_date: document.getElementById('m_end').value,
    price_annual: document.getElementById('m_price').value,
  };
  if (!data.customer_id) return alert('Cliente requerido');
  await api('/api/admin/maintenance', { method: 'POST', body: JSON.stringify(data) });
  closeModal(); loadMaintenance();
};

// ===== LOAD NEWSLETTER =====
async function loadNewsletter() {
  try {
    const subs = await api('/api/admin/newsletter');
    document.getElementById('newsletterCount').textContent = `${subs.length} suscriptores`;
    const body = document.getElementById('newsletterBody');
    if (!subs.length) { body.innerHTML = '<tr><td colspan="4" class="table-loading">Sin suscriptores aún</td></tr>'; return; }
    body.innerHTML = subs.map(s => `
      <tr>
        <td>#${s.id}</td>
        <td><a href="mailto:${s.email}" style="color:#0891B2">${s.email}</a></td>
        <td>${s.active ? '<span class="status-badge status-activo">activo</span>' : '<span class="status-badge status-perdido">baja</span>'}</td>
        <td style="white-space:nowrap">${fdate(s.created_at)}</td>
      </tr>
    `).join('');
  } catch { document.getElementById('newsletterBody').innerHTML = '<tr><td colspan="4" class="table-loading">Error</td></tr>'; }
}

// ===== LOAD EMAILS =====
async function loadEmails() {
  try {
    const [emails, config] = await Promise.all([
      api('/api/admin/emails?category=supplier'),
      api('/api/admin/config/email'),
    ]);

    const statusEl = document.getElementById('emailConfigStatus');
    if (config.configured) {
      statusEl.innerHTML = `<span style="color:#16A34A;font-weight:600">✓ SMTP configurado</span> — ${config.from_email} via ${config.smtp_host}`;
    } else {
      statusEl.innerHTML = `<span style="color:#DC2626;font-weight:600">✗ SMTP no configurado</span> — Crea el archivo <code style="background:rgba(255,255,255,.1);padding:2px 6px;border-radius:4px">.env</code> con tus credenciales para enviar emails. <a href="#" onclick="showSmtpHelp()" style="color:#00C9A7">Ver ayuda</a>`;
    }

    const drafts = emails.filter(e => e.status === 'draft').length;
    document.getElementById('emailDraftsBadge').textContent = drafts || '';

    const body = document.getElementById('emailsBody');
    if (!emails.length) { body.innerHTML = '<tr><td colspan="6" class="table-loading">Sin emails aún</td></tr>'; return; }
    body.innerHTML = emails.map(e => `
      <tr>
        <td>#${e.id}</td>
        <td>
          <div style="font-weight:600;font-size:13px">${e.to_name || '—'}</div>
          <div style="font-size:11px;color:#94A3B8">${e.to_email}</div>
        </td>
        <td style="max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13px">${e.subject || '—'}</td>
        <td>${badge(e.status)}</td>
        <td style="white-space:nowrap;font-size:12px">${e.sent_at ? fdate(e.sent_at) : '—'}</td>
        <td>
          <button class="btn-erp btn-erp--sm btn-erp--ghost" onclick="viewEmail(${e.id})">Ver</button>
          ${e.status === 'draft' ? `<button class="btn-erp btn-erp--sm btn-erp--primary" onclick="sendEmail(${e.id})">Enviar</button>` : ''}
        </td>
      </tr>
    `).join('');
  } catch(err) { document.getElementById('emailsBody').innerHTML = `<tr><td colspan="6" class="table-loading">Error: ${err.message}</td></tr>`; }
}

window.viewEmail = async (id) => {
  const emails = await api('/api/admin/emails?category=supplier');
  const e = emails.find(x => x.id === id);
  if (!e) return;
  openModal(`Email — ${e.to_name}`, `
    <div style="display:flex;flex-direction:column;gap:10px;font-size:13px">
      <div><strong>Para:</strong> ${e.to_name} &lt;${e.to_email}&gt;</div>
      <div><strong>Asunto:</strong> ${e.subject}</div>
      <div><strong>Estado:</strong> ${badge(e.status)}</div>
      ${e.sent_at ? `<div><strong>Enviado:</strong> ${fdate(e.sent_at)}</div>` : ''}
      ${e.error_msg ? `<div style="color:#EF4444"><strong>Error:</strong> ${e.error_msg}</div>` : ''}
      <div style="margin-top:8px;padding:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;white-space:pre-wrap;font-family:monospace;font-size:12px;max-height:300px;overflow-y:auto">${e.body_text || '(sin contenido)'}</div>
    </div>
  `, `
    <button class="btn-erp btn-erp--ghost" onclick="closeModal()">Cerrar</button>
    ${e.status === 'draft' ? `<button class="btn-erp btn-erp--primary" onclick="closeModal();sendEmail(${e.id})">Enviar ahora</button>` : ''}
  `);
};

window.sendEmail = async (id) => {
  const btn = event?.target;
  if (btn) btn.textContent = 'Enviando…';
  try {
    const r = await api(`/api/admin/emails/${id}/send`, { method: 'POST' });
    if (r.success) {
      alert('✓ Email enviado correctamente');
    } else {
      alert(`Error: ${r.error || r.message}`);
    }
  } catch(err) {
    alert(`Error: ${err.message}`);
  }
  loadEmails();
};

window.showSmtpHelp = () => {
  openModal('Configurar SMTP para envío de emails', `
    <div style="font-size:13px;line-height:1.7">
      <p>Para enviar emails desde el ERP, crea un archivo <code style="background:rgba(255,255,255,.1);padding:2px 6px;border-radius:4px">.env</code> en la carpeta <code>website/</code>:</p>
      <pre style="background:rgba(0,0,0,.3);padding:16px;border-radius:8px;margin:12px 0;overflow-x:auto;font-size:12px">SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tucuenta@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
FROM_EMAIL=info@zenbotsiberia.com
FROM_NAME=ZENBOTS IBERIA</pre>
      <p><strong>Para Gmail:</strong> activa verificación en 2 pasos → <a href="https://myaccount.google.com/security" target="_blank" style="color:#00C9A7">myaccount.google.com/security</a> → "Contraseñas de aplicación"</p>
      <p><strong>Alternativa gratuita:</strong> Brevo (antes SendinBlue) — 300 emails/día gratis</p>
      <p>Tras crear el archivo .env, reinicia el servidor: <code>python3 app.py</code></p>
    </div>
  `, `<button class="btn-erp btn-erp--ghost" onclick="closeModal()">Cerrar</button>`);
};

document.getElementById('sendAllEmailsBtn')?.addEventListener('click', async () => {
  if (!confirm('¿Enviar TODOS los borradores de emails a proveedores?')) return;
  const btn = document.getElementById('sendAllEmailsBtn');
  btn.textContent = 'Enviando…';
  btn.disabled = true;
  try {
    const r = await api('/api/admin/emails/0/send-all', { method: 'POST' });
    const ok = r.results?.filter(x => x.ok).length || 0;
    const fail = r.results?.filter(x => !x.ok).length || 0;
    alert(`Enviados: ${ok} ✓  |  Errores: ${fail}`);
  } catch(err) {
    alert(`Error: ${err.message}`);
  }
  btn.textContent = '✉ Enviar todos los borradores';
  btn.disabled = false;
  loadEmails();
});

// ===== LOAD SUPPLIERS =====
async function loadSuppliers() {
  try {
    const suppliers = await api('/api/admin/suppliers');
    const body = document.getElementById('suppliersBody');
    if (!suppliers.length) { body.innerHTML = '<tr><td colspan="8" class="table-loading">Sin proveedores</td></tr>'; return; }
    body.innerHTML = suppliers.map(s => `
      <tr>
        <td><strong>${s.name}</strong><br><span style="font-size:11px;color:#94A3B8">${s.country}</span></td>
        <td>${s.contact_name || '—'}</td>
        <td><a href="mailto:${s.email}" style="color:#0891B2;font-size:13px">${s.email}</a></td>
        <td><a href="http://${s.website}" target="_blank" style="color:#00C9A7;font-size:12px">${s.website || '—'}</a></td>
        <td style="max-width:180px;font-size:12px;color:#94A3B8">${s.products || '—'}</td>
        <td>
          <select class="status-select" data-id="${s.id}" onchange="updateSupplierStatus(this)">
            ${['prospecto','contactado','negociando','activo','descartado'].map(st =>
              `<option value="${st}" ${s.status===st?'selected':''}>${st}</option>`
            ).join('')}
          </select>
        </td>
        <td style="max-width:160px;font-size:12px;color:#94A3B8">${s.notes || '—'}</td>
        <td>
          <button class="btn-erp btn-erp--sm btn-erp--ghost" onclick="editSupplierNotes(${s.id}, '${(s.notes||'').replace(/'/g,"\\'")}')">Notas</button>
        </td>
      </tr>
    `).join('');
  } catch(err) { document.getElementById('suppliersBody').innerHTML = `<tr><td colspan="8" class="table-loading">Error</td></tr>`; }
}

window.updateSupplierStatus = async (sel) => {
  try { await api(`/api/admin/suppliers/${sel.dataset.id}`, { method: 'PATCH', body: JSON.stringify({ status: sel.value }) }); }
  catch { alert('Error actualizando estado'); }
};

window.editSupplierNotes = (id, currentNotes) => {
  openModal('Actualizar notas del proveedor', `
    <div class="modal-field">
      <label>Notas / Observaciones</label>
      <textarea class="modal-input" id="sup_notes" rows="4" placeholder="Resultado de contacto, precio ofertado, siguiente paso…">${currentNotes}</textarea>
    </div>
  `, `
    <button class="btn-erp btn-erp--ghost" onclick="closeModal()">Cancelar</button>
    <button class="btn-erp btn-erp--primary" onclick="saveSupplierNotes(${id})">Guardar</button>
  `);
};
window.saveSupplierNotes = async (id) => {
  const notes = document.getElementById('sup_notes').value;
  await api(`/api/admin/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify({ notes }) });
  closeModal(); loadSuppliers();
};

// ===== LOAD REPORTS =====
async function loadReports() {
  try {
    const r = await api('/api/admin/reports/financial');

    // By product bar chart
    const byProd = document.getElementById('repByProduct');
    if (!r.by_product?.length) { byProd.innerHTML = '<p style="padding:20px;color:#94A3B8;text-align:center">Sin datos</p>'; }
    else {
      const max = Math.max(...r.by_product.map(p => p.revenue), 1);
      byProd.innerHTML = `<div class="mini-bar-chart">${r.by_product.map(p => `
        <div class="mini-bar">
          <div class="mini-bar__label">
            <span class="mini-bar__name">${p.name}</span>
            <span class="mini-bar__value">${eur(p.revenue)} (${p.units_sold || 0} uds)</span>
          </div>
          <div class="mini-bar__track">
            <div class="mini-bar__fill" style="width:${(p.revenue/max*100).toFixed(0)}%"></div>
          </div>
        </div>`).join('')}</div>`;
    }

    // Conversion funnel
    const conv = document.getElementById('repConversion');
    if (!r.contacts_conversion?.length) { conv.innerHTML = '<p style="padding:20px;color:#94A3B8;text-align:center">Sin leads aún</p>'; }
    else {
      const total = r.contacts_conversion.reduce((s, x) => s + x.n, 0);
      conv.innerHTML = `<div class="mini-bar-chart">${r.contacts_conversion.map(c => `
        <div class="mini-bar">
          <div class="mini-bar__label">
            <span class="mini-bar__name">${badge(c.status)}</span>
            <span class="mini-bar__value">${c.n} (${total ? Math.round(c.n/total*100) : 0}%)</span>
          </div>
          <div class="mini-bar__track">
            <div class="mini-bar__fill" style="width:${total ? (c.n/total*100).toFixed(0) : 0}%;background:${c.status==='ganado'?'#16A34A':c.status==='perdido'?'#DC2626':'var(--teal)'}"></div>
          </div>
        </div>`).join('')}</div>`;
    }

    // Summary KPIs
    document.getElementById('rep-revenue').textContent = eur(r.summary.total_revenue);
    document.getElementById('rep-expenses').textContent = eur(r.summary.total_expenses);
    const netEl = document.getElementById('rep-net');
    netEl.textContent = eur(r.summary.net_result);
    netEl.style.color = r.summary.net_result >= 0 ? '#16A34A' : '#DC2626';
    document.getElementById('rep-customers').textContent = r.summary.total_customers;

    // Cashflow monthly table
    const monthBody = document.getElementById('monthlyRevenueBody');
    if (!r.monthly?.length) { monthBody.innerHTML = '<tr><td colspan="6" class="table-loading">Sin datos</td></tr>'; }
    else {
      monthBody.innerHTML = r.monthly.map(m => {
        const net = m.net;
        return `
        <tr>
          <td><strong>${m.month}</strong></td>
          <td>${m.orders}</td>
          <td style="color:#16A34A"><strong>${eur(m.revenue)}</strong></td>
          <td style="color:#DC2626">${eur(m.expenses)}</td>
          <td style="color:#94A3B8">${eur(m.gross_margin)}</td>
          <td style="color:${net>=0?'#16A34A':'#DC2626'};font-weight:600">${eur(net)}</td>
        </tr>`;
      }).join('');
    }
  } catch(err) { console.error('Reports error:', err); }
}

// ===== GASTOS & CASHFLOW =====
async function loadExpenses() {
  try {
    const rows = await api('/api/admin/expenses');
    const total = rows.reduce((s, r) => s + r.amount, 0);
    document.getElementById('exp-total').textContent = eur(total);
    document.getElementById('exp-count').textContent = rows.length;

    // Top category
    const catMap = {};
    rows.forEach(r => { catMap[r.category] = (catMap[r.category] || 0) + r.amount; });
    const topCat = Object.entries(catMap).sort((a,b) => b[1]-a[1])[0];
    document.getElementById('exp-top-cat').textContent = topCat ? topCat[0] : '—';

    // Net (need revenue from reports API too)
    try {
      const rep = await api('/api/admin/reports/financial');
      const netEl = document.getElementById('exp-net');
      netEl.textContent = eur(rep.summary.net_result);
      netEl.style.color = rep.summary.net_result >= 0 ? '#16A34A' : '#DC2626';
    } catch(_) {}

    // Expense list
    const body = document.getElementById('expensesBody');
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="6" class="table-loading">Sin gastos registrados aún</td></tr>';
    } else {
      body.innerHTML = rows.map(r => `
        <tr>
          <td>${r.date}</td>
          <td><span class="status-badge">${r.category}</span></td>
          <td>${r.description}</td>
          <td style="font-weight:600;color:#DC2626">${eur(r.amount)}</td>
          <td style="color:#94A3B8">${r.payment_method}</td>
          <td><button class="btn-erp btn-erp--sm btn-erp--danger" onclick="deleteExpense(${r.id})">✕</button></td>
        </tr>`).join('');
    }

    // By category bar chart
    const catEl = document.getElementById('expByCategory');
    const cats = Object.entries(catMap).sort((a,b) => b[1]-a[1]);
    if (!cats.length) {
      catEl.innerHTML = '<p style="padding:20px;color:#94A3B8;text-align:center">Sin datos</p>';
    } else {
      const max = Math.max(...cats.map(c=>c[1]), 1);
      catEl.innerHTML = `<div class="mini-bar-chart">${cats.map(([cat, val]) => `
        <div class="mini-bar">
          <div class="mini-bar__label">
            <span class="mini-bar__name">${cat}</span>
            <span class="mini-bar__value">${eur(val)}</span>
          </div>
          <div class="mini-bar__track">
            <div class="mini-bar__fill" style="width:${(val/max*100).toFixed(0)}%;background:#DC2626"></div>
          </div>
        </div>`).join('')}</div>`;
    }
  } catch(err) { console.error('Expenses error:', err); }
}

window.deleteExpense = async function(id) {
  if (!confirm('¿Eliminar este gasto?')) return;
  try {
    await api(`/api/admin/expenses/${id}`, { method: 'DELETE' });
    loadExpenses();
  } catch(e) { alert('Error al eliminar'); }
};

document.getElementById('expenseForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.textContent = 'Guardando…'; btn.disabled = true;
  try {
    await api('/api/admin/expenses', {
      method: 'POST',
      body: JSON.stringify({
        date: document.getElementById('expDate').value,
        category: document.getElementById('expCategory').value,
        description: document.getElementById('expDesc').value,
        amount: document.getElementById('expAmount').value,
        payment_method: document.getElementById('expPayment').value,
      }),
    });
    e.target.reset();
    document.getElementById('expDate').value = new Date().toISOString().slice(0,10);
    loadExpenses();
  } catch(err) { alert('Error al guardar'); }
  finally { btn.textContent = '+ Añadir gasto'; btn.disabled = false; }
});

// Set today's date as default on expense form
(function() {
  const dateEl = document.getElementById('expDate');
  if (dateEl) dateEl.value = new Date().toISOString().slice(0,10);
})();

// ===== PAGE LOADERS =====
const loaders = {
  dashboard: loadDashboard,
  contacts: loadContacts,
  customers: loadCustomers,
  orders: loadOrders,
  inventory: loadInventory,
  maintenance: loadMaintenance,
  newsletter: loadNewsletter,
  emails: loadEmails,
  suppliers: loadSuppliers,
  expenses: loadExpenses,
  reports: loadReports,
};

// ===== INIT =====
const initialPage = (location.hash || '#dashboard').slice(1);
showPage(PAGE_TITLES[initialPage] ? initialPage : 'dashboard');
