const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'ZenbotsAdmin2024!';

// --- DATABASE SETUP ---
const db = new Database(path.join(__dirname, 'db', 'zenbots.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    product_interest TEXT,
    message TEXT,
    status TEXT DEFAULT 'nuevo',
    source TEXT DEFAULT 'web',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS newsletter (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT UNIQUE,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    features TEXT,
    price_retail REAL,
    price_cost REAL,
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    badge TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    type TEXT DEFAULT 'particular',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE,
    customer_id INTEGER,
    contact_id INTEGER,
    product_id INTEGER,
    quantity INTEGER DEFAULT 1,
    unit_price REAL,
    total REAL,
    status TEXT DEFAULT 'pendiente',
    payment_status TEXT DEFAULT 'pendiente',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS maintenance_contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    product_id INTEGER,
    order_id INTEGER,
    start_date DATE,
    end_date DATE,
    price_annual REAL DEFAULT 199,
    status TEXT DEFAULT 'activo',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );
`);

// Seed products if empty
const { count } = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO products (sku, name, category, description, features, price_retail, price_cost, stock, badge)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  [
    ['ZEN-AST-001', 'ZenAssist Pro', 'asistencia',
     'Robot asistente para personas mayores con inteligencia artificial avanzada. Diseñado para proporcionar compañía, seguridad y asistencia diaria en el hogar.',
     'Navegación LiDAR autónoma|Pantalla táctil 10"|Videollamadas HD|Detección de caídas automática|Dispensador medicamentos programable|Control domótica integrado|Autonomía 12h',
     4499, 1380, 5, 'MÁS VENDIDO'],
    ['ZEN-CMP-001', 'ZenCompañía', 'asistencia',
     'Robot compañero con IA conversacional en español. Entretenimiento, recordatorios y control inteligente del hogar para una vida más autónoma e independiente.',
     'IA conversacional en español|Reconocimiento facial|Música y vídeos streaming|Recordatorio de citas y medicación|Control Alexa/Google Home|Videollamadas familiares',
     2999, 920, 8, 'NUEVO'],
    ['ZEN-CLN-001', 'ZenClean X1 Ultra', 'limpieza',
     'Robot aspirador y fregador de última generación con estación de autovaciado. Limpieza total sin intervención humana durante 60 días.',
     'Autovaciado 60 días|Navegación LiDAR 360°|Fregado presión variable|App iOS y Android|Compatible Alexa y Google|Mapeado multi-planta|Succión 8.000 Pa',
     899, 275, 20, 'OFERTA'],
    ['ZEN-CLN-002', 'ZenClean Pro', 'limpieza',
     'Robot aspirador profesional de alto rendimiento para grandes superficies. Tecnología de detección de obstáculos 3D y planificación de ruta inteligente.',
     'Succión 10.000 Pa|Detección obstáculos 3D|Multi-planta avanzado|Programación semanal|Limpieza selectiva por zonas|Base de recarga automática',
     1199, 365, 15, ''],
    ['ZEN-GRD-001', 'ZenJardín Eco', 'jardin',
     'Robot cortacésped autónomo con GPS RTK de precisión centimétrica. Sin cable perimetral, silencioso y con gestión total desde la app.',
     'GPS RTK sin cable perimetral|Regresa solo cuando llueve|App control premium|Silencioso <58 dB|Cobertura hasta 1.500 m²|Programación por zonas|Sensores antichoques',
     1499, 460, 10, ''],
  ].forEach(row => insert.run(...row));
}

// --- MIDDLEWARE ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
app.use('/api/', apiLimiter);

// --- ADMIN AUTH ---
function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token === ADMIN_TOKEN) return next();
  res.status(401).json({ error: 'No autorizado' });
}

// ============================================================
// PUBLIC API ROUTES
// ============================================================

app.get('/api/products', (req, res) => {
  const { category } = req.query;
  let stmt = 'SELECT id, sku, name, category, description, features, price_retail, stock, image_url, badge FROM products WHERE active = 1';
  const params = [];
  if (category) { stmt += ' AND category = ?'; params.push(category); }
  stmt += ' ORDER BY price_retail DESC';
  res.json(db.prepare(stmt).all(...params));
});

app.post('/api/contact', (req, res) => {
  const { name, email, phone, product_interest, message } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Nombre y email son obligatorios' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Email no válido' });
  try {
    const r = db.prepare(
      'INSERT INTO contacts (name, email, phone, product_interest, message) VALUES (?, ?, ?, ?, ?)'
    ).run(name.trim(), email.trim().toLowerCase(), phone || null, product_interest || null, message || null);
    res.json({ success: true, id: r.lastInsertRowid, message: 'Mensaje recibido. Le contactaremos en menos de 2 horas.' });
  } catch {
    res.status(500).json({ error: 'Error al guardar. Inténtelo de nuevo.' });
  }
});

app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });
  try {
    db.prepare('INSERT OR IGNORE INTO newsletter (email) VALUES (?)').run(email.trim().toLowerCase());
    res.json({ success: true, message: '¡Suscripción confirmada! Bienvenido/a a la familia ZENBOTS.' });
  } catch {
    res.status(500).json({ error: 'Error al suscribirse' });
  }
});

// ============================================================
// ADMIN API ROUTES
// ============================================================

app.get('/api/admin/dashboard', adminAuth, (req, res) => {
  const stats = {
    contacts: db.prepare('SELECT COUNT(*) as n FROM contacts').get().n,
    new_contacts: db.prepare("SELECT COUNT(*) as n FROM contacts WHERE status='nuevo'").get().n,
    newsletter: db.prepare('SELECT COUNT(*) as n FROM newsletter WHERE active=1').get().n,
    customers: db.prepare('SELECT COUNT(*) as n FROM customers').get().n,
    orders_total: db.prepare('SELECT COUNT(*) as n FROM orders').get().n,
    orders_pending: db.prepare("SELECT COUNT(*) as n FROM orders WHERE status='pendiente'").get().n,
    revenue_total: db.prepare("SELECT COALESCE(SUM(total),0) as r FROM orders WHERE status NOT IN ('cancelado')").get().r,
    revenue_month: db.prepare("SELECT COALESCE(SUM(total),0) as r FROM orders WHERE strftime('%Y-%m', created_at)=strftime('%Y-%m','now') AND status NOT IN ('cancelado')").get().r,
    low_stock: db.prepare('SELECT COUNT(*) as n FROM products WHERE stock<3 AND active=1').get().n,
    maintenance_active: db.prepare("SELECT COUNT(*) as n FROM maintenance_contracts WHERE status='activo'").get().n,
    mrr: db.prepare("SELECT COALESCE(SUM(price_annual)/12,0) as r FROM maintenance_contracts WHERE status='activo'").get().r,
    contacts_by_month: db.prepare(
      "SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as n FROM contacts GROUP BY month ORDER BY month DESC LIMIT 6"
    ).all(),
    orders_by_product: db.prepare(
      "SELECT p.name, COUNT(o.id) as n, COALESCE(SUM(o.total),0) as rev FROM orders o JOIN products p ON o.product_id=p.id GROUP BY p.id ORDER BY rev DESC"
    ).all(),
  };
  res.json(stats);
});

// Contacts / CRM
app.get('/api/admin/contacts', adminAuth, (req, res) => {
  const contacts = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
  res.json(contacts);
});

app.patch('/api/admin/contacts/:id', adminAuth, (req, res) => {
  const { status } = req.body;
  const valid = ['nuevo', 'contactado', 'demo_agendada', 'propuesta', 'ganado', 'perdido'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Estado no válido' });
  db.prepare('UPDATE contacts SET status=? WHERE id=?').run(status, req.params.id);
  res.json({ success: true });
});

app.delete('/api/admin/contacts/:id', adminAuth, (req, res) => {
  db.prepare('DELETE FROM contacts WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// Customers
app.get('/api/admin/customers', adminAuth, (req, res) => {
  const customers = db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all();
  res.json(customers);
});

app.post('/api/admin/customers', adminAuth, (req, res) => {
  const { name, email, phone, address, type, notes } = req.body;
  const r = db.prepare(
    'INSERT INTO customers (name, email, phone, address, type, notes) VALUES (?,?,?,?,?,?)'
  ).run(name, email || null, phone || null, address || null, type || 'particular', notes || null);
  res.json({ success: true, id: r.lastInsertRowid });
});

// Inventory
app.get('/api/admin/inventory', adminAuth, (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY category, name').all();
  res.json(products);
});

app.patch('/api/admin/inventory/:id', adminAuth, (req, res) => {
  const { stock, price_retail, price_cost } = req.body;
  const fields = [];
  const vals = [];
  if (stock !== undefined) { fields.push('stock=?'); vals.push(Number(stock)); }
  if (price_retail !== undefined) { fields.push('price_retail=?'); vals.push(Number(price_retail)); }
  if (price_cost !== undefined) { fields.push('price_cost=?'); vals.push(Number(price_cost)); }
  if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });
  vals.push(req.params.id);
  db.prepare(`UPDATE products SET ${fields.join(',')} WHERE id=?`).run(...vals);
  res.json({ success: true });
});

// Orders
app.get('/api/admin/orders', adminAuth, (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, c.name as customer_name, c.email as customer_email, p.name as product_name, p.sku
    FROM orders o
    LEFT JOIN customers c ON o.customer_id=c.id
    LEFT JOIN products p ON o.product_id=p.id
    ORDER BY o.created_at DESC
  `).all();
  res.json(orders);
});

app.post('/api/admin/orders', adminAuth, (req, res) => {
  const { customer_id, product_id, quantity, unit_price, notes } = req.body;
  const total = Number(quantity) * Number(unit_price);
  const month = new Date().toISOString().slice(0, 7).replace('-', '');
  const lastOrder = db.prepare("SELECT id FROM orders ORDER BY id DESC LIMIT 1").get();
  const nextNum = (lastOrder ? lastOrder.id + 1 : 1).toString().padStart(4, '0');
  const order_number = `ZEN-${month}-${nextNum}`;
  const r = db.prepare(
    'INSERT INTO orders (order_number, customer_id, product_id, quantity, unit_price, total, notes) VALUES (?,?,?,?,?,?,?)'
  ).run(order_number, customer_id, product_id, quantity, unit_price, total, notes || null);
  // Decrease stock
  db.prepare('UPDATE products SET stock = stock - ? WHERE id=?').run(Number(quantity), product_id);
  res.json({ success: true, id: r.lastInsertRowid, order_number });
});

app.patch('/api/admin/orders/:id', adminAuth, (req, res) => {
  const { status, payment_status } = req.body;
  const fields = [];
  const vals = [];
  if (status) { fields.push('status=?'); vals.push(status); }
  if (payment_status) { fields.push('payment_status=?'); vals.push(payment_status); }
  vals.push(req.params.id);
  db.prepare(`UPDATE orders SET ${fields.join(',')} WHERE id=?`).run(...vals);
  res.json({ success: true });
});

// Maintenance contracts
app.get('/api/admin/maintenance', adminAuth, (req, res) => {
  const contracts = db.prepare(`
    SELECT mc.*, c.name as customer_name, p.name as product_name
    FROM maintenance_contracts mc
    LEFT JOIN customers c ON mc.customer_id=c.id
    LEFT JOIN products p ON mc.product_id=p.id
    ORDER BY mc.end_date ASC
  `).all();
  res.json(contracts);
});

app.post('/api/admin/maintenance', adminAuth, (req, res) => {
  const { customer_id, product_id, order_id, start_date, end_date, price_annual, notes } = req.body;
  const r = db.prepare(
    'INSERT INTO maintenance_contracts (customer_id, product_id, order_id, start_date, end_date, price_annual, notes) VALUES (?,?,?,?,?,?,?)'
  ).run(customer_id, product_id || null, order_id || null, start_date, end_date, price_annual || 199, notes || null);
  res.json({ success: true, id: r.lastInsertRowid });
});

// Newsletter list
app.get('/api/admin/newsletter', adminAuth, (req, res) => {
  const subs = db.prepare('SELECT * FROM newsletter ORDER BY created_at DESC').all();
  res.json(subs);
});

// Serve admin panel
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin', 'index.html')));
app.get('/admin/*', (req, res) => {
  const file = req.path.replace('/admin/', '');
  res.sendFile(path.join(__dirname, 'admin', file), err => {
    if (err) res.sendFile(path.join(__dirname, 'admin', 'index.html'));
  });
});

app.listen(PORT, () => {
  console.log(`\n  ██████╗ ███████╗███╗   ██╗██████╗  ██████╗ ████████╗███████╗`);
  console.log(`  ╚════██╗██╔════╝████╗  ██║██╔══██╗██╔═══██╗╚══██╔══╝██╔════╝`);
  console.log(`   █████╔╝█████╗  ██╔██╗ ██║██████╔╝██║   ██║   ██║   ███████╗`);
  console.log(`  ██╔═══╝ ██╔══╝  ██║╚██╗██║██╔══██╗██║   ██║   ██║   ╚════██║`);
  console.log(`  ███████╗███████╗██║ ╚████║██████╔╝╚██████╔╝   ██║   ███████║`);
  console.log(`  ╚══════╝╚══════╝╚═╝  ╚═══╝╚═════╝  ╚═════╝    ╚═╝   ╚══════╝`);
  console.log(`\n  ZENBOTS IBERIA S.L. — Robots domésticos inteligentes`);
  console.log(`  Web:   http://localhost:${PORT}`);
  console.log(`  Admin: http://localhost:${PORT}/admin?token=${ADMIN_TOKEN}\n`);
});
