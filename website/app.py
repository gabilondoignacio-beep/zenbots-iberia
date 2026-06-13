#!/usr/bin/env python3
"""
ZENBOTS IBERIA S.L. — Web Server (Python/Flask) v2
Run: python3 app.py
Web: http://localhost:3000
Admin: http://localhost:3000/admin?token=ZenbotsAdmin2024!
Pitch: http://localhost:3000/pitch
"""

import os, sqlite3, json, re, csv, io
from datetime import datetime, date
from flask import Flask, request, jsonify, send_from_directory, send_file, abort, Response, make_response

# Load .env if exists
_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
if os.path.exists(_env):
    for line in open(_env):
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            os.environ.setdefault(k.strip(), v.strip())

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'db', 'zenbots.db')
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
ADMIN_DIR = os.path.join(BASE_DIR, 'admin')
ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN', 'ZenbotsAdmin2024!')
PORT = int(os.environ.get('PORT', 3000))

app = Flask(__name__, static_folder=None)

# ─── DATABASE ─────────────────────────────────────────────────────────────────

def get_db():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA journal_mode=WAL')
    return db

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with get_db() as db:
        # Email outbox table
        db.execute("""
            CREATE TABLE IF NOT EXISTS outbox_emails (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                to_email TEXT NOT NULL,
                to_name TEXT,
                subject TEXT,
                body_text TEXT,
                body_html TEXT,
                category TEXT DEFAULT 'supplier',
                status TEXT DEFAULT 'draft',
                sent_at DATETIME,
                error_msg TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Suppliers table
        db.execute("""
            CREATE TABLE IF NOT EXISTS suppliers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                country TEXT DEFAULT 'China',
                contact_name TEXT,
                email TEXT,
                phone TEXT,
                wechat TEXT,
                website TEXT,
                products TEXT,
                status TEXT DEFAULT 'prospecto',
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Seed suppliers if empty
        if db.execute('SELECT COUNT(*) FROM suppliers').fetchone()[0] == 0:
            suppliers = [
                ('Keenon Robotics', 'China', 'Emily Wang', 'sales@keenon.com', None, None, 'www.keenon.com', 'ZenAssist Pro (W3), T-series', 'contactado'),
                ('OrionStar Robotics', 'China', 'Export Dept', 'export@orionstar.com', None, None, 'www.orionstar.com', 'ZenCompañía (Lucki 2)', 'contactado'),
                ('Narwal Robotics', 'China', 'Distribution', 'distributor@narwal.com', None, None, 'www.narwal.com', 'ZenClean X1 Ultra', 'contactado'),
                ('Dreame Technology', 'China', 'Business Dev', 'business@dreametech.com', None, None, 'www.dreame.tech', 'ZenClean Pro', 'contactado'),
                ('Segway Technology', 'China', 'B2B Team', 'b2b@segway-navimow.com', None, None, 'www.segway-navimow.com', 'ZenJardín Eco', 'contactado'),
            ]
            for s in suppliers:
                db.execute('INSERT INTO suppliers (name,country,contact_name,email,phone,wechat,website,products,status) VALUES (?,?,?,?,?,?,?,?,?)', s)
        # Seed supplier outreach emails if empty
        if db.execute("SELECT COUNT(*) FROM outbox_emails WHERE category='supplier'").fetchone()[0] == 0:
            try:
                from email_module import SUPPLIER_EMAILS
                for key, em in SUPPLIER_EMAILS.items():
                    db.execute(
                        "INSERT INTO outbox_emails (to_email,to_name,subject,body_text,category,status) VALUES (?,?,?,?,?,?)",
                        (em['to_email'], em['to_name'], em['subject'], em['body_text'], 'supplier', 'draft')
                    )
            except Exception:
                pass
        db.commit()
        db.executescript("""
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
                product_id INTEGER,
                quantity INTEGER DEFAULT 1,
                unit_price REAL,
                total REAL,
                status TEXT DEFAULT 'pendiente',
                payment_status TEXT DEFAULT 'pendiente',
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """)
        # Seed products
        count = db.execute('SELECT COUNT(*) FROM products').fetchone()[0]
        if count == 0:
            products = [
                ('ZEN-AST-001', 'ZenAssist Pro', 'asistencia',
                 'Robot asistente para personas mayores con inteligencia artificial avanzada.',
                 'Navegación LiDAR autónoma|Pantalla táctil 10"|Videollamadas HD|Detección de caídas automática|Dispensador medicamentos programable|Control domótica integrado|Autonomía 12h',
                 4499, 1380, 5, 'MÁS VENDIDO'),
                ('ZEN-CMP-001', 'ZenCompañía', 'asistencia',
                 'Robot compañero con IA conversacional en español.',
                 'IA conversacional en español|Reconocimiento facial|Música y vídeos streaming|Recordatorio de citas y medicación|Control Alexa/Google Home|Videollamadas familiares',
                 2999, 920, 8, 'NUEVO'),
                ('ZEN-CLN-001', 'ZenClean X1 Ultra', 'limpieza',
                 'Robot aspirador y fregador de última generación con estación de autovaciado.',
                 'Autovaciado 60 días|Navegación LiDAR 360°|Fregado presión variable|App iOS y Android|Compatible Alexa y Google|Mapeado multi-planta|Succión 8.000 Pa',
                 899, 275, 20, 'OFERTA'),
                ('ZEN-CLN-002', 'ZenClean Pro', 'limpieza',
                 'Robot aspirador profesional de alto rendimiento para grandes superficies.',
                 'Succión 10.000 Pa|Detección obstáculos 3D|Multi-planta avanzado|Programación semanal|Limpieza selectiva por zonas|Base de recarga automática',
                 1199, 365, 15, ''),
                ('ZEN-GRD-001', 'ZenJardín Eco', 'jardin',
                 'Robot cortacésped autónomo con GPS RTK de precisión centimétrica.',
                 'GPS RTK sin cable perimetral|Regresa solo cuando llueve|App control premium|Silencioso <58 dB|Cobertura hasta 1.500 m²|Programación por zonas|Sensores antichoques',
                 1499, 460, 10, ''),
            ]
            for p in products:
                db.execute(
                    'INSERT INTO products (sku,name,category,description,features,price_retail,price_cost,stock,badge) VALUES (?,?,?,?,?,?,?,?,?)',
                    p
                )
            db.commit()

# ─── HELPERS ──────────────────────────────────────────────────────────────────

def rows_to_list(rows):
    return [dict(r) for r in rows]

def require_admin():
    token = request.headers.get('X-Admin-Token') or request.args.get('token')
    if token != ADMIN_TOKEN:
        abort(401)

def valid_email(email):
    return re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email or '')

def next_order_number(db):
    month = datetime.now().strftime('%Y%m')
    last = db.execute('SELECT id FROM orders ORDER BY id DESC LIMIT 1').fetchone()
    num = str((last['id'] + 1 if last else 1)).zfill(4)
    return f'ZEN-{month}-{num}'

# ─── PUBLIC STATIC FILES ───────────────────────────────────────────────────────

@app.route('/')
def index():
    return send_file(os.path.join(PUBLIC_DIR, 'index.html'))

@app.route('/css/<path:filename>')
def public_css(filename):
    return send_from_directory(os.path.join(PUBLIC_DIR, 'css'), filename)

@app.route('/js/<path:filename>')
def public_js(filename):
    return send_from_directory(os.path.join(PUBLIC_DIR, 'js'), filename)

@app.route('/img/<path:filename>')
def public_img(filename):
    return send_from_directory(os.path.join(PUBLIC_DIR, 'img'), filename)

@app.route('/admin/')
@app.route('/admin')
def admin_index():
    return send_file(os.path.join(ADMIN_DIR, 'index.html'))

@app.route('/admin/css/<path:filename>')
def admin_css(filename):
    return send_from_directory(os.path.join(ADMIN_DIR, 'css'), filename)

@app.route('/admin/js/<path:filename>')
def admin_js(filename):
    return send_from_directory(os.path.join(ADMIN_DIR, 'js'), filename)

# ─── PUBLIC API ────────────────────────────────────────────────────────────────

@app.route('/api/products')
def api_products():
    category = request.args.get('category')
    with get_db() as db:
        if category:
            rows = db.execute(
                'SELECT id,sku,name,category,description,features,price_retail,stock,image_url,badge FROM products WHERE active=1 AND category=? ORDER BY price_retail DESC',
                (category,)
            ).fetchall()
        else:
            rows = db.execute(
                'SELECT id,sku,name,category,description,features,price_retail,stock,image_url,badge FROM products WHERE active=1 ORDER BY price_retail DESC'
            ).fetchall()
    return jsonify(rows_to_list(rows))

@app.route('/api/contact', methods=['POST'])
def api_contact():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    if not name or not email:
        return jsonify({'error': 'Nombre y email son obligatorios'}), 400
    if not valid_email(email):
        return jsonify({'error': 'Email no válido'}), 400
    with get_db() as db:
        cur = db.execute(
            'INSERT INTO contacts (name,email,phone,product_interest,message) VALUES (?,?,?,?,?)',
            (name, email, data.get('phone'), data.get('product_interest'), data.get('message'))
        )
        db.commit()
    _send_welcome_email(name, email, data.get('product_interest', ''))
    return jsonify({'success': True, 'id': cur.lastrowid, 'message': 'Mensaje recibido. Le contactaremos en menos de 2 horas.'})

@app.route('/api/newsletter', methods=['POST'])
def api_newsletter():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    if not email:
        return jsonify({'error': 'Email requerido'}), 400
    with get_db() as db:
        db.execute('INSERT OR IGNORE INTO newsletter (email) VALUES (?)', (email,))
        db.commit()
    return jsonify({'success': True, 'message': '¡Suscripción confirmada!'})

# ─── ADMIN API ─────────────────────────────────────────────────────────────────

@app.route('/api/admin/dashboard')
def api_admin_dashboard():
    require_admin()
    with get_db() as db:
        def scalar(q, *a): return db.execute(q, a).fetchone()[0]
        stats = {
            'contacts': scalar('SELECT COUNT(*) FROM contacts'),
            'new_contacts': scalar("SELECT COUNT(*) FROM contacts WHERE status='nuevo'"),
            'newsletter_subs': scalar('SELECT COUNT(*) FROM newsletter WHERE active=1'),
            'customers': scalar('SELECT COUNT(*) FROM customers'),
            'orders_total': scalar('SELECT COUNT(*) FROM orders'),
            'orders_pending': scalar("SELECT COUNT(*) FROM orders WHERE status='pendiente'"),
            'revenue_total': scalar("SELECT COALESCE(SUM(total),0) FROM orders WHERE status NOT IN ('cancelado')"),
            'revenue_month': scalar("SELECT COALESCE(SUM(total),0) FROM orders WHERE strftime('%Y-%m',created_at)=strftime('%Y-%m','now') AND status NOT IN ('cancelado')"),
            'low_stock': scalar('SELECT COUNT(*) FROM products WHERE stock<3 AND active=1'),
            'maintenance_active': scalar("SELECT COUNT(*) FROM maintenance_contracts WHERE status='activo'"),
            'mrr': scalar("SELECT COALESCE(SUM(price_annual)/12,0) FROM maintenance_contracts WHERE status='activo'"),
            'contacts_by_month': rows_to_list(db.execute("SELECT strftime('%Y-%m',created_at) as month, COUNT(*) as n FROM contacts GROUP BY month ORDER BY month DESC LIMIT 6").fetchall()),
            'orders_by_product': rows_to_list(db.execute("SELECT p.name, COUNT(o.id) as n, COALESCE(SUM(o.total),0) as rev FROM orders o JOIN products p ON o.product_id=p.id GROUP BY p.id ORDER BY rev DESC").fetchall()),
        }
    return jsonify(stats)

@app.route('/api/admin/contacts')
def api_admin_contacts():
    require_admin()
    with get_db() as db:
        rows = db.execute('SELECT * FROM contacts ORDER BY created_at DESC').fetchall()
    return jsonify(rows_to_list(rows))

@app.route('/api/admin/contacts/<int:cid>', methods=['PATCH'])
def api_admin_contacts_update(cid):
    require_admin()
    data = request.get_json() or {}
    valid = ['nuevo','contactado','demo_agendada','propuesta','ganado','perdido']
    status = data.get('status')
    if status not in valid:
        return jsonify({'error': 'Estado no válido'}), 400
    with get_db() as db:
        db.execute('UPDATE contacts SET status=? WHERE id=?', (status, cid))
        db.commit()
    return jsonify({'success': True})

@app.route('/api/admin/contacts/<int:cid>', methods=['DELETE'])
def api_admin_contacts_delete(cid):
    require_admin()
    with get_db() as db:
        db.execute('DELETE FROM contacts WHERE id=?', (cid,))
        db.commit()
    return jsonify({'success': True})

@app.route('/api/admin/customers')
def api_admin_customers():
    require_admin()
    with get_db() as db:
        rows = db.execute('SELECT * FROM customers ORDER BY created_at DESC').fetchall()
    return jsonify(rows_to_list(rows))

@app.route('/api/admin/customers', methods=['POST'])
def api_admin_customers_create():
    require_admin()
    data = request.get_json() or {}
    if not data.get('name'):
        return jsonify({'error': 'Nombre requerido'}), 400
    with get_db() as db:
        cur = db.execute(
            'INSERT INTO customers (name,email,phone,address,type,notes) VALUES (?,?,?,?,?,?)',
            (data['name'], data.get('email'), data.get('phone'), data.get('address'), data.get('type','particular'), data.get('notes'))
        )
        db.commit()
    return jsonify({'success': True, 'id': cur.lastrowid})

@app.route('/api/admin/inventory')
def api_admin_inventory():
    require_admin()
    with get_db() as db:
        rows = db.execute('SELECT * FROM products ORDER BY category, name').fetchall()
    return jsonify(rows_to_list(rows))

@app.route('/api/admin/inventory/<int:pid>', methods=['PATCH'])
def api_admin_inventory_update(pid):
    require_admin()
    data = request.get_json() or {}
    fields, vals = [], []
    if 'stock' in data: fields.append('stock=?'); vals.append(int(data['stock']))
    if 'price_retail' in data: fields.append('price_retail=?'); vals.append(float(data['price_retail']))
    if 'price_cost' in data: fields.append('price_cost=?'); vals.append(float(data['price_cost']))
    if not fields:
        return jsonify({'error': 'Nada que actualizar'}), 400
    vals.append(pid)
    with get_db() as db:
        db.execute(f'UPDATE products SET {",".join(fields)} WHERE id=?', vals)
        db.commit()
    return jsonify({'success': True})

@app.route('/api/admin/orders')
def api_admin_orders():
    require_admin()
    with get_db() as db:
        rows = db.execute("""
            SELECT o.*, c.name as customer_name, c.email as customer_email, p.name as product_name, p.sku
            FROM orders o
            LEFT JOIN customers c ON o.customer_id=c.id
            LEFT JOIN products p ON o.product_id=p.id
            ORDER BY o.created_at DESC
        """).fetchall()
    return jsonify(rows_to_list(rows))

@app.route('/api/admin/orders', methods=['POST'])
def api_admin_orders_create():
    require_admin()
    data = request.get_json() or {}
    total = int(data.get('quantity', 1)) * float(data.get('unit_price', 0))
    with get_db() as db:
        order_number = next_order_number(db)
        cur = db.execute(
            'INSERT INTO orders (order_number,customer_id,product_id,quantity,unit_price,total,notes) VALUES (?,?,?,?,?,?,?)',
            (order_number, data.get('customer_id'), data.get('product_id'), data.get('quantity',1), data.get('unit_price',0), total, data.get('notes'))
        )
        if data.get('product_id'):
            db.execute('UPDATE products SET stock=stock-? WHERE id=?', (int(data.get('quantity',1)), data['product_id']))
        db.commit()
    return jsonify({'success': True, 'id': cur.lastrowid, 'order_number': order_number})

@app.route('/api/admin/orders/<int:oid>', methods=['PATCH'])
def api_admin_orders_update(oid):
    require_admin()
    data = request.get_json() or {}
    fields, vals = [], []
    if 'status' in data: fields.append('status=?'); vals.append(data['status'])
    if 'payment_status' in data: fields.append('payment_status=?'); vals.append(data['payment_status'])
    if not fields:
        return jsonify({'error': 'Nada que actualizar'}), 400
    vals.append(oid)
    with get_db() as db:
        db.execute(f'UPDATE orders SET {",".join(fields)} WHERE id=?', vals)
        db.commit()
    return jsonify({'success': True})

@app.route('/api/admin/maintenance')
def api_admin_maintenance():
    require_admin()
    with get_db() as db:
        rows = db.execute("""
            SELECT mc.*, c.name as customer_name, p.name as product_name
            FROM maintenance_contracts mc
            LEFT JOIN customers c ON mc.customer_id=c.id
            LEFT JOIN products p ON mc.product_id=p.id
            ORDER BY mc.end_date ASC
        """).fetchall()
    return jsonify(rows_to_list(rows))

@app.route('/api/admin/maintenance', methods=['POST'])
def api_admin_maintenance_create():
    require_admin()
    data = request.get_json() or {}
    if not data.get('customer_id'):
        return jsonify({'error': 'Cliente requerido'}), 400
    with get_db() as db:
        cur = db.execute(
            'INSERT INTO maintenance_contracts (customer_id,product_id,order_id,start_date,end_date,price_annual,notes) VALUES (?,?,?,?,?,?,?)',
            (data['customer_id'], data.get('product_id'), data.get('order_id'), data.get('start_date'), data.get('end_date'), data.get('price_annual', 199), data.get('notes'))
        )
        db.commit()
    return jsonify({'success': True, 'id': cur.lastrowid})

@app.route('/api/admin/newsletter')
def api_admin_newsletter():
    require_admin()
    with get_db() as db:
        rows = db.execute('SELECT * FROM newsletter ORDER BY created_at DESC').fetchall()
    return jsonify(rows_to_list(rows))

# ─── PITCH PAGE ───────────────────────────────────────────────────────────────

@app.route('/pitch')
def pitch():
    return send_file(os.path.join(PUBLIC_DIR, 'pitch.html'))

# ─── ROI CALCULATOR API ────────────────────────────────────────────────────────

@app.route('/api/roi', methods=['POST'])
def api_roi():
    """Calcula ROI para B2B residencias."""
    d = request.get_json() or {}
    n_robots = int(d.get('robots', 1))
    product_price = float(d.get('price', 4499))
    staff_hour_cost = float(d.get('staff_cost', 15))
    hours_saved_day = float(d.get('hours_saved', 4))
    maintenance = float(d.get('maintenance', 199))

    annual_savings = staff_hour_cost * hours_saved_day * 365 * n_robots
    annual_cost = (product_price / 3) + (maintenance * n_robots)  # amortize 3 years
    net_annual = annual_savings - annual_cost
    roi_pct = round((net_annual / annual_cost) * 100, 1) if annual_cost > 0 else 0
    payback_months = round((product_price * n_robots) / (annual_savings / 12), 1) if annual_savings > 0 else 999

    return jsonify({
        'annual_savings': round(annual_savings, 2),
        'annual_cost': round(annual_cost, 2),
        'net_annual': round(net_annual, 2),
        'roi_pct': roi_pct,
        'payback_months': payback_months,
        'total_investment': round(product_price * n_robots, 2),
    })

# ─── EMAIL MANAGEMENT ROUTES ───────────────────────────────────────────────────

@app.route('/api/admin/emails', methods=['GET'])
def api_admin_emails_list():
    require_admin()
    cat = request.args.get('category')
    with get_db() as db:
        if cat:
            rows = db.execute('SELECT * FROM outbox_emails WHERE category=? ORDER BY created_at DESC', (cat,)).fetchall()
        else:
            rows = db.execute('SELECT * FROM outbox_emails ORDER BY created_at DESC').fetchall()
    return jsonify(rows_to_list(rows))

@app.route('/api/admin/emails', methods=['POST'])
def api_admin_emails_create():
    require_admin()
    d = request.get_json() or {}
    with get_db() as db:
        cur = db.execute(
            'INSERT INTO outbox_emails (to_email,to_name,subject,body_text,category,status) VALUES (?,?,?,?,?,?)',
            (d.get('to_email'), d.get('to_name'), d.get('subject'), d.get('body_text'), d.get('category','outreach'), 'draft')
        )
        db.commit()
    return jsonify({'success': True, 'id': cur.lastrowid})

@app.route('/api/admin/emails/<int:eid>/send', methods=['POST'])
def api_admin_emails_send(eid):
    require_admin()
    try:
        from email_module import send_email, is_configured
    except ImportError:
        return jsonify({'error': 'email_module no encontrado'}), 500

    with get_db() as db:
        row = db.execute('SELECT * FROM outbox_emails WHERE id=?', (eid,)).fetchone()
        if not row:
            return jsonify({'error': 'Email no encontrado'}), 404
        row = dict(row)

    if not is_configured():
        return jsonify({'error': 'SMTP no configurado. Crea el archivo .env con tus credenciales.', 'configured': False}), 400

    ok, msg = send_email(row['to_email'], row['to_name'], row['subject'], row.get('body_html') or row['body_text'], row['body_text'])
    with get_db() as db:
        if ok:
            db.execute("UPDATE outbox_emails SET status='enviado', sent_at=CURRENT_TIMESTAMP WHERE id=?", (eid,))
        else:
            db.execute("UPDATE outbox_emails SET status='error', error_msg=? WHERE id=?", (msg, eid))
        db.commit()
    return jsonify({'success': ok, 'message': msg})

@app.route('/api/admin/emails/<int:eid>/send-all', methods=['POST'])
def api_admin_emails_send_all(eid):
    """Envía todos los drafts de una categoría."""
    require_admin()
    try:
        from email_module import send_email, is_configured
        if not is_configured():
            return jsonify({'error': 'SMTP no configurado'}), 400
    except ImportError:
        return jsonify({'error': 'email_module no encontrado'}), 500

    with get_db() as db:
        rows = db.execute("SELECT * FROM outbox_emails WHERE status='draft'").fetchall()
    results = []
    for row in rows:
        row = dict(row)
        ok, msg = send_email(row['to_email'], row['to_name'], row['subject'],
                             row.get('body_html') or row['body_text'], row['body_text'])
        with get_db() as db:
            status = 'enviado' if ok else 'error'
            db.execute("UPDATE outbox_emails SET status=?, sent_at=CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE sent_at END, error_msg=? WHERE id=?",
                       (status, ok, None if ok else msg, row['id']))
            db.commit()
        results.append({'id': row['id'], 'to': row['to_email'], 'ok': ok, 'msg': msg})
    return jsonify({'results': results})

# ─── SUPPLIER MANAGEMENT ───────────────────────────────────────────────────────

@app.route('/api/admin/suppliers', methods=['GET'])
def api_admin_suppliers():
    require_admin()
    with get_db() as db:
        rows = db.execute('SELECT * FROM suppliers ORDER BY name').fetchall()
    return jsonify(rows_to_list(rows))

@app.route('/api/admin/suppliers/<int:sid>', methods=['PATCH'])
def api_admin_suppliers_update(sid):
    require_admin()
    d = request.get_json() or {}
    fields, vals = [], []
    for col in ('status', 'notes', 'contact_name', 'phone', 'wechat'):
        if col in d:
            fields.append(f'{col}=?')
            vals.append(d[col])
    if not fields:
        return jsonify({'error': 'Nada que actualizar'}), 400
    vals.append(sid)
    with get_db() as db:
        db.execute(f'UPDATE suppliers SET {",".join(fields)} WHERE id=?', vals)
        db.commit()
    return jsonify({'success': True})

# ─── FINANCIAL REPORTS ─────────────────────────────────────────────────────────

@app.route('/api/admin/reports/financial', methods=['GET'])
def api_reports_financial():
    require_admin()
    with get_db() as db:
        def scalar(q, *a): return db.execute(q, a).fetchone()[0]
        monthly = rows_to_list(db.execute("""
            SELECT strftime('%Y-%m', created_at) as month,
                   COUNT(*) as orders,
                   COALESCE(SUM(total),0) as revenue,
                   COALESCE(SUM(total * 0.69),0) as gross_margin
            FROM orders
            WHERE status NOT IN ('cancelado')
            GROUP BY month
            ORDER BY month DESC
            LIMIT 12
        """).fetchall())
        by_product = rows_to_list(db.execute("""
            SELECT p.name, p.category, p.price_retail, p.price_cost,
                   COUNT(o.id) as units_sold,
                   COALESCE(SUM(o.total),0) as revenue
            FROM products p
            LEFT JOIN orders o ON p.id=o.product_id AND o.status NOT IN ('cancelado')
            GROUP BY p.id ORDER BY revenue DESC
        """).fetchall())
        contacts_conversion = rows_to_list(db.execute("""
            SELECT status, COUNT(*) as n FROM contacts GROUP BY status ORDER BY n DESC
        """).fetchall())

    return jsonify({
        'monthly': monthly,
        'by_product': by_product,
        'contacts_conversion': contacts_conversion,
        'summary': {
            'total_revenue': scalar("SELECT COALESCE(SUM(total),0) FROM orders WHERE status NOT IN ('cancelado')"),
            'avg_ticket': scalar("SELECT COALESCE(AVG(total),0) FROM orders WHERE status NOT IN ('cancelado')"),
            'total_orders': scalar("SELECT COUNT(*) FROM orders WHERE status NOT IN ('cancelado')"),
            'total_customers': scalar("SELECT COUNT(*) FROM customers"),
        }
    })

# ─── CSV EXPORT ────────────────────────────────────────────────────────────────

@app.route('/api/admin/export/<table>', methods=['GET'])
def api_export(table):
    require_admin()
    allowed = {
        'contacts': 'SELECT id,name,email,phone,product_interest,status,source,created_at FROM contacts ORDER BY created_at DESC',
        'customers': 'SELECT * FROM customers ORDER BY created_at DESC',
        'orders': '''SELECT o.order_number,c.name as customer,p.name as product,o.quantity,o.unit_price,o.total,o.status,o.payment_status,o.created_at
                     FROM orders o LEFT JOIN customers c ON o.customer_id=c.id LEFT JOIN products p ON o.product_id=p.id ORDER BY o.created_at DESC''',
        'newsletter': 'SELECT id,email,active,created_at FROM newsletter ORDER BY created_at DESC',
        'inventory': 'SELECT sku,name,category,price_retail,price_cost,stock,active FROM products ORDER BY category,name',
        'suppliers': 'SELECT * FROM suppliers ORDER BY name',
    }
    if table not in allowed:
        return jsonify({'error': 'Tabla no permitida'}), 400

    with get_db() as db:
        rows = db.execute(allowed[table]).fetchall()

    output = io.StringIO()
    if rows:
        writer = csv.writer(output)
        writer.writerow(rows[0].keys())
        for r in rows:
            writer.writerow(list(r))

    response = make_response(output.getvalue())
    response.headers['Content-Type'] = 'text/csv; charset=utf-8'
    response.headers['Content-Disposition'] = f'attachment; filename=zenbots_{table}_{datetime.now().strftime("%Y%m%d")}.csv'
    return response

# ─── SMTP CONFIG CHECK ─────────────────────────────────────────────────────────

@app.route('/api/admin/config/email', methods=['GET'])
def api_config_email():
    require_admin()
    try:
        from email_module import is_configured, SMTP_HOST, SMTP_PORT, SMTP_USER, FROM_EMAIL
        return jsonify({
            'configured': is_configured(),
            'smtp_host': SMTP_HOST,
            'smtp_port': SMTP_PORT,
            'smtp_user': SMTP_USER[:3] + '***' if SMTP_USER else '',
            'from_email': FROM_EMAIL,
        })
    except ImportError:
        return jsonify({'configured': False, 'error': 'email_module no disponible'})

@app.route('/api/admin/config/email/test', methods=['POST'])
def api_config_email_test():
    require_admin()
    d = request.get_json() or {}
    test_to = d.get('to_email', '')
    if not test_to:
        return jsonify({'error': 'to_email requerido'}), 400
    try:
        from email_module import send_email
        ok, msg = send_email(test_to, 'Test', 'Test SMTP — ZENBOTS IBERIA', '<p>SMTP funciona correctamente ✓</p>', 'SMTP funciona correctamente')
        return jsonify({'success': ok, 'message': msg})
    except ImportError:
        return jsonify({'error': 'email_module no disponible'}), 500

# ─── SEND CONTACT AUTO-REPLY ───────────────────────────────────────────────────

def _send_welcome_email(name, email, product_interest):
    """Enviar email de bienvenida al nuevo lead (silencioso si no configurado)."""
    try:
        from email_module import send_email, is_configured, template_welcome_lead
        if not is_configured():
            return
        html = template_welcome_lead(name, product_interest)
        send_email(email, name, f'Hola {name} — ZENBOTS IBERIA te llama en breve', html)
    except Exception:
        pass

# ─── BOOT ─────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    init_db()
    print("""
  ██████╗ ███████╗███╗   ██╗██████╗  ██████╗ ████████╗███████╗
  ╚════██╗██╔════╝████╗  ██║██╔══██╗██╔═══██╗╚══██╔══╝██╔════╝
   █████╔╝█████╗  ██╔██╗ ██║██████╔╝██║   ██║   ██║   ███████╗
  ██╔═══╝ ██╔══╝  ██║╚██╗██║██╔══██╗██║   ██║   ██║   ╚════██║
  ███████╗███████╗██║ ╚████║██████╔╝╚██████╔╝   ██║   ███████║
  ╚══════╝╚══════╝╚═╝  ╚═══╝╚═════╝  ╚═════╝    ╚═╝   ╚══════╝

  ZENBOTS IBERIA S.L. — Robots domésticos inteligentes
  Web:   http://localhost:{port}
  Admin: http://localhost:{port}/admin?token={token}
""".format(port=PORT, token=ADMIN_TOKEN))
    app.run(host='0.0.0.0', port=PORT, debug=False)
