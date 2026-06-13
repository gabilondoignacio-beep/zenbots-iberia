# 🤖 ZENBOTS IBERIA S.L.

**Distribución de robots domésticos inteligentes para Madrid**  
Robots de asistencia para personas mayores · Limpieza avanzada · Jardín autónomo

---

## ¿Qué es esto?

Proyecto empresarial completo de una startup de distribución de robots domésticos chinos con certificación CE en Madrid, enfocada en el nicho de asistencia para personas mayores. Incluye web corporativa, panel ERP, documentación de negocio y pitch de inversión.

**Inversión:** €82.000 · **Break-even:** Mes 5 · **Revenue Y3:** €1,4M · **Margen bruto:** 69%

---

## 🚀 Arrancar el servidor

**Opción 1 — Doble clic:**
Abre `start.command` (macOS) o `ZENBOTS.app`

**Opción 2 — Terminal:**
```bash
cd website
python3 app.py
```

| URL | Descripción |
|-----|-------------|
| http://localhost:3000 | Web corporativa pública |
| http://localhost:3000/admin?token=ZenbotsAdmin2024! | Panel ERP |
| http://localhost:3000/pitch | Pitch de inversión |

---

## 📁 Estructura del proyecto

```
zenbots-iberia/
├── start.command          ← Doble clic para arrancar
├── ZENBOTS.app            ← App macOS
├── setup-github.command   ← Configurar GitHub
├── docs/
│   ├── 01-business-plan.md
│   ├── 02-plan-financiero.md
│   ├── 03-plan-accion.md
│   ├── 04-plan-marketing.md
│   ├── 05-plan-comercial.md
│   ├── 06-tramites-legales.md
│   ├── 07-proveedores-financiacion.md
│   ├── 08-email-erp-setup.md
│   └── 09-guia-roles.md
└── website/
    ├── app.py             ← Servidor Flask
    ├── email_module.py    ← Módulo SMTP + emails proveedores
    ├── .env.example       ← Plantilla de variables de entorno
    ├── public/
    │   ├── index.html     ← Web corporativa
    │   ├── pitch.html     ← Pitch de inversión
    │   ├── manifest.json  ← PWA manifest
    │   ├── sw.js          ← Service Worker
    │   ├── css/styles.css
    │   ├── js/main.js
    │   └── img/           ← Iconos PWA
    └── admin/
        ├── index.html     ← Panel ERP
        └── js/admin.js
```

---

## ⚙️ Configuración de email (SMTP)

Para enviar emails a proveedores y clientes:

1. Copia `.env.example` a `.env`:
   ```bash
   cp website/.env.example website/.env
   ```

2. Edita `website/.env` con tus credenciales:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=tucuenta@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx   # App password de Gmail
   FROM_EMAIL=info@zenbots.es
   ```

3. Para Gmail: activa verificación en 2 pasos → [Contraseñas de aplicación](https://myaccount.google.com/apppasswords)

---

## 📊 Panel ERP — Funcionalidades

| Sección | Descripción |
|---------|-------------|
| Dashboard | KPIs en tiempo real (leads, revenue, MRR, stock) |
| CRM / Leads | Gestión de contactos del formulario web |
| Clientes | Base de datos de clientes con tipos |
| Pedidos | Creación y seguimiento de órdenes |
| Inventario | Stock, precios, márgenes por producto |
| Mantenimientos | Contratos ZenCare Plus |
| Newsletter | Suscriptores con exportación CSV |
| **Bandeja correo** | 5 emails listos a proveedores chinos |
| **Proveedores** | Estado negociación con fabricantes |
| **Informes** | Revenue mensual, funnel conversión |

---

## 🌐 APIs disponibles

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/products` | GET | Catálogo de productos |
| `/api/contact` | POST | Formulario de contacto |
| `/api/newsletter` | POST | Suscripción newsletter |
| `/api/roi` | POST | Calculadora ROI para residencias |
| `/api/admin/dashboard` | GET | Stats del ERP |
| `/api/admin/emails` | GET/POST | Bandeja de salida |
| `/api/admin/emails/<id>/send` | POST | Envío SMTP individual |
| `/api/admin/suppliers` | GET | Lista proveedores |
| `/api/admin/reports/financial` | GET | Informe financiero |
| `/api/admin/export/<tabla>` | GET | Exportación CSV |

**Autenticación admin:** header `X-Admin-Token: ZenbotsAdmin2024!` o `?token=ZenbotsAdmin2024!`

---

## 🤖 Proveedores chinos (emails en bandeja)

| Proveedor | Contacto | Producto ZENBOTS |
|-----------|----------|-----------------|
| Keenon Robotics | sales@keenon.com | ZenAssist Pro |
| OrionStar Robotics | export@orionstar.com | ZenCompañía |
| Narwal Robotics | distributor@narwal.com | ZenClean X1 Ultra |
| Dreame Technology | business@dreametech.com | ZenClean Pro |
| Segway Technology | b2b@segway-navimow.com | ZenJardín Eco |

---

## 📱 PWA — Instalar como app

La web es una Progressive Web App instalable:
- **iOS:** Safari → Compartir → "Añadir a pantalla de inicio"
- **Android/Chrome:** Menú → "Instalar aplicación"
- **macOS/Windows:** Chrome → icono de instalación en la barra de dirección

---

## 🏗️ Requisitos

- Python 3.8+
- Flask (`pip3 install flask`)
- Sin base de datos externa (SQLite incluido)

---

## 📄 Documentación de negocio

- [Business Plan](docs/01-business-plan.md) — Modelo, competencia, propuesta de valor
- [Plan Financiero](docs/02-plan-financiero.md) — P&L 3 años, cashflow
- [Plan de Acción](docs/03-plan-accion.md) — 25 pasos para ejecutar
- [Plan de Marketing](docs/04-plan-marketing.md) — Google Ads, Meta Ads, SEO
- [Plan Comercial](docs/05-plan-comercial.md) — Guión ventas, proveedores
- [Trámites Legales](docs/06-tramites-legales.md) — Constitución S.L.
- [Financiación](docs/07-proveedores-financiacion.md) — ICO, bancos, subvenciones
- [Email & ERP Setup](docs/08-email-erp-setup.md) — Google Workspace, Odoo
- [Guías de Roles](docs/09-guia-roles.md) — Secretaria, comercial, controller, marketing

---

© 2026 ZENBOTS IBERIA S.L. — Madrid, España
