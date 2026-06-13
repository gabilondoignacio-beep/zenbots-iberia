# GUÍA DE CONFIGURACIÓN — EMAIL CORPORATIVO Y ERP
### ZENBOTS IBERIA S.L.

---

## PARTE 1: EMAIL CORPORATIVO

### Opción A: Google Workspace Business Starter (RECOMENDADO)
**Precio:** €6/usuario/mes (mínimo 1 usuario)  
**URL:** workspace.google.com  

**Cuentas a crear:**
| Email | Uso |
|-------|-----|
| info@zenbots.es | Principal, contacto general |
| ventas@zenbots.es | Equipo comercial |
| soporte@zenbots.es | Servicio técnico |
| facturacion@zenbots.es | Administración |
| [tu_nombre]@zenbots.es | CEO personal |

**Pasos de configuración:**
1. Ir a workspace.google.com → "Comenzar"
2. Introducir nombre empresa: "Zenbots Iberia"
3. Dominio: zenbots.es (necesitas acceso al panel DNS)
4. Configurar registros DNS en tu registrador de dominio:
   - **MX Records** (para recibir emails):
     ```
     ASPMX.L.GOOGLE.COM (prioridad 1)
     ALT1.ASPMX.L.GOOGLE.COM (prioridad 5)
     ALT2.ASPMX.L.GOOGLE.COM (prioridad 5)
     ```
   - **SPF record** (anti-spam):
     ```
     TXT: v=spf1 include:_spf.google.com ~all
     ```
   - **DKIM**: Google Workspace Admin → Apps → Gmail → Autenticación
   - **DMARC**: 
     ```
     TXT _dmarc.zenbots.es: v=DMARC1; p=quarantine; rua=mailto:info@zenbots.es
     ```
5. Verificar dominio (Google te da un código TXT)
6. Crear usuarios y cuentas
7. Configurar firma de empresa en todos los correos

**Firma corporativa:**
```html
<b>ZENBOTS IBERIA S.L.</b><br>
[Nombre] | [Cargo]<br>
<br>
Tel: +34 910 000 000<br>
Web: www.zenbots.es<br>
C/ [Dirección showroom], Madrid<br>
<br>
<i>Robots domésticos inteligentes para tu hogar</i>
```

---

### Opción B: Zoho Mail (gratis hasta 5 usuarios)
**URL:** zoho.com/mail  
**Precio:** Gratuito (plan básico suficiente para empezar)  
**Ventaja:** Integra con Zoho CRM (alternativa a Odoo para empezar)  

**Configuración DNS igual que Google Workspace pero con servidores de Zoho.**

---

## PARTE 2: ERP — ODOO COMMUNITY

### ¿Por qué Odoo?
- Código abierto y gratuito (Community Edition)
- Todo en uno: CRM, Inventario, Ventas, Contabilidad, RRHH, Web
- Traducción completa al español
- Gran comunidad y soporte
- Escalable: de 1 a 1.000 usuarios sin cambiar sistema
- Usado por 12 millones de empresas en el mundo

---

### Instalación en servidor VPS (DigitalOcean)

**Paso 1: Contratar servidor VPS**
- Proveedor: DigitalOcean (digitalocean.com)
- Plan recomendado: Basic Droplet — 2GB RAM, 1 vCPU, 50GB SSD
- Precio: $12/mes
- Sistema operativo: Ubuntu 22.04 LTS
- Zona: Frankfurt (más cercana a España)

**Alternativa más económica:** Hostinger VPS (€4.99/mes, también vale)

**Paso 2: Instalar Odoo 17**
```bash
# Conectar al servidor por SSH
ssh root@[IP_SERVIDOR]

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y python3-pip python3-dev libxml2-dev libxslt1-dev \
  zlib1g-dev libsasl2-dev libldap2-dev build-essential libssl-dev \
  libffi-dev libmysqlclient-dev libjpeg-dev libpq-dev libjpeg8-dev \
  liblcms2-dev libblas-dev libatlas-base-dev npm nodejs wkhtmltopdf

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Crear usuario PostgreSQL para Odoo
sudo -u postgres psql -c "CREATE USER odoo WITH PASSWORD 'zenbotspass2024';"
sudo -u postgres psql -c "ALTER USER odoo CREATEDB;"

# Descargar Odoo 17
wget https://nightly.odoo.com/17.0/nightly/deb/odoo_17.0.latest_all.deb
sudo dpkg -i odoo_17.0.latest_all.deb

# Configurar Odoo
sudo nano /etc/odoo/odoo.conf
```

**Configuración odoo.conf:**
```ini
[options]
admin_passwd = ZenbotsAdmin2024!
db_host = localhost
db_port = 5432
db_user = odoo
db_password = zenbotspass2024
addons_path = /usr/lib/python3/dist-packages/odoo/addons
logfile = /var/log/odoo/odoo.log
xmlrpc_port = 8069
```

```bash
# Iniciar servicio Odoo
sudo systemctl start odoo
sudo systemctl enable odoo

# Configurar Nginx como proxy reverso
sudo apt install nginx -y
```

**Configuración Nginx para erp.zenbots.es:**
```nginx
server {
    listen 80;
    server_name erp.zenbots.es;
    
    location / {
        proxy_pass http://localhost:8069;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# SSL con Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d erp.zenbots.es
```

**Acceso al ERP:** https://erp.zenbots.es (admin / ZenbotsAdmin2024!)

---

### Módulos a instalar en Odoo

**Módulos esenciales (instalar en este orden):**
1. **Contactos** — Base para CRM
2. **CRM** — Gestión de leads y oportunidades
3. **Ventas** — Presupuestos y pedidos
4. **Inventario** — Stock de robots
5. **Facturación** — Facturas y cobros
6. **Contabilidad** (plan contable español — instalar el módulo localization Spain)
7. **Email Marketing** — Campañas
8. **Sitio Web** — Si quieres usar Odoo como web (alternativo a nuestra web custom)

**Módulos opcionales (Año 2):**
- RRHH (cuando haya empleados)
- Proyectos (para gestionar instalaciones)
- Firma Electrónica (contratos de mantenimiento)
- Gastos (notas de gastos comercial)

---

### Configuración inicial de Odoo

**Paso 1: Configurar empresa**
- Ajustes → Empresa
- Nombre: ZENBOTS IBERIA S.L.
- NIF: ESB[XXXXXXXX]
- Dirección: C/ Alcalá 50, 2ºA, 28014 Madrid
- Divisa: EUR
- Logo: subir logo ZENBOTS
- Email: info@zenbots.es
- Teléfono: +34 910 000 000

**Paso 2: Plan contable español**
- Contabilidad → Configuración → Plan contable
- Instalar: "Spain — Plan General Contable" (l10n_es)
- Configurar: cuenta bancaria empresa en Odoo

**Paso 3: Cargar catálogo de productos**
- Inventario → Productos → Crear
- Crear cada producto con: nombre, precio, coste, categoría, referencia interna
- Activar seguimiento de inventario

**Paso 4: Pipeline CRM**
- CRM → Configuración → Etapas
- Crear etapas: Nuevo Lead → Contactado → Demo Agendada → Propuesta Enviada → Negociación → Ganado/Perdido

**Paso 5: Plantillas de email**
- Configurar plantillas para: confirmación pedido, factura, seguimiento lead, bienvenida cliente

---

## PARTE 3: HERRAMIENTAS COMPLEMENTARIAS

### Stack tecnológico completo ZENBOTS

| Herramienta | Uso | Precio/mes |
|-------------|-----|-----------|
| Google Workspace | Email + Drive + Meet | €18 (3 usuarios) |
| Odoo Community | ERP completo | €12 (servidor) |
| Holded | Facturación alternativa | €29 |
| Mailchimp | Newsletter | Gratis hasta 500 subs |
| Google Analytics 4 | Analítica web | Gratis |
| Google Search Console | SEO | Gratis |
| Canva Pro | Diseño marketing | €12 |
| Hootsuite / Buffer | RRSS scheduling | €15 |
| Calendly | Agendado demos | €8 |
| Slack | Comunicación interna | Gratis |
| **TOTAL** | | **~€94/mes** |

### Integración CRM ↔ Web
La web que hemos construido (en carpeta /website) tiene integración directa:
- Formulario contacto web → guarda en BD local de la web
- Se puede sincronizar manualmente con Odoo cada semana (export CSV → import Odoo)
- Para automatización: usar Zapier o Make.com (€9/mes)

---

*Elaborado por: Rol Secretaria + Controller | ZENBOTS IBERIA S.L. | Junio 2026*
