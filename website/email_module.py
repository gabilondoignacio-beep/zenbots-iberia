"""
ZENBOTS IBERIA — Módulo de email (SMTP + templates)
Soporta Gmail, Zoho, Brevo y cualquier SMTP estándar.
"""

import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASS = os.environ.get('SMTP_PASS', '')
FROM_EMAIL = os.environ.get('FROM_EMAIL', 'info@zenbots.es')
FROM_NAME = os.environ.get('FROM_NAME', 'ZENBOTS IBERIA')
COMPANY_PHONE = os.environ.get('COMPANY_PHONE', '+34 910 000 000')
COMPANY_ADDRESS = os.environ.get('COMPANY_ADDRESS', 'Calle de Alcalá 50, 2ºA, 28014 Madrid')


def is_configured():
    return bool(SMTP_USER and SMTP_PASS)


def send_email(to_email, to_name, subject, body_html, body_text=None, reply_to=None):
    """Envía un email. Devuelve (True, 'ok') o (False, 'error message')."""
    if not is_configured():
        return False, 'SMTP no configurado. Editar .env con credenciales de email.'

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = f'{FROM_NAME} <{FROM_EMAIL}>'
    msg['To'] = f'{to_name} <{to_email}>' if to_name else to_email
    if reply_to:
        msg['Reply-To'] = reply_to

    if body_text:
        msg.attach(MIMEText(body_text, 'plain', 'utf-8'))
    msg.attach(MIMEText(body_html, 'html', 'utf-8'))

    try:
        ctx = ssl.create_default_context()
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls(context=ctx)
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        return True, 'Enviado'
    except smtplib.SMTPAuthenticationError:
        return False, 'Error de autenticación SMTP. Verifica usuario y contraseña en .env'
    except smtplib.SMTPException as e:
        return False, f'Error SMTP: {e}'
    except Exception as e:
        return False, f'Error: {e}'


# ─── HTML WRAPPER ──────────────────────────────────────────────────────────────

def _wrap_html(title, content_html):
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>{title}</title>
</head>
<body style="margin:0;padding:0;background:#F0F4F8;font-family:Inter,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4F8;padding:32px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
  <tr><td style="background:#0A1628;padding:28px 40px;text-align:center">
    <span style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-.02em">
      <span>ZEN</span><span style="color:#00C9A7">BOTS</span>
    </span>
    <span style="font-size:11px;color:rgba(255,255,255,.4);margin-left:6px;vertical-align:middle">IBERIA</span>
  </td></tr>
  <tr><td style="padding:40px">{content_html}</td></tr>
  <tr><td style="background:#F8FAFB;padding:20px 40px;border-top:1px solid #E2E8F0;text-align:center">
    <p style="margin:0;font-size:12px;color:#94A3B8">
      ZENBOTS IBERIA S.L. · {COMPANY_ADDRESS}<br/>
      <a href="tel:{COMPANY_PHONE}" style="color:#00C9A7">{COMPANY_PHONE}</a> ·
      <a href="mailto:{FROM_EMAIL}" style="color:#00C9A7">{FROM_EMAIL}</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>"""


# ─── PLANTILLAS EMAILS PROVEEDORES ────────────────────────────────────────────

SUPPLIER_EMAILS = {
    'keenon': {
        'to_email': 'sales@keenon.com',
        'to_name': 'Keenon Robotics International Sales',
        'subject': 'Distribution Partnership Inquiry — Spain & Portugal — ZENBOTS IBERIA S.L.',
        'body_text': """Dear Keenon Robotics International Sales Team,

My name is the CEO of ZENBOTS IBERIA S.L., a newly established technology distribution company based in Madrid, Spain, specialized in bringing premium robotics solutions to the Spanish market.

MARKET OPPORTUNITY — SPAIN:
Spain ranks 2nd in Europe by percentage of elderly population, with 9.5 million people over 65. Madrid alone has 860,000 elderly residents. The Spanish residential care sector (7,500 facilities nationwide) is actively seeking technology solutions to reduce staff workload and improve resident quality of life. There is currently NO specialized robotic assistance distributor in Madrid — a clear market gap.

WHY KEENON:
After extensive research across all major service robot manufacturers, we believe Keenon's W3 series perfectly addresses the Spanish market's needs in terms of navigation capability, screen size, and interaction quality.

OUR PROPOSAL:
We are seeking to become your authorized distributor for Spain and Portugal for:
- Keenon W3 (primary focus: residential care + domestic assistance)
- Keenon T8/T9 series (secondary: restaurant/hotel delivery)

INITIAL COMMITMENT:
- Initial order: 5 units within 60 days of agreement
- Year 1 projection: 30-50 units
- Year 2 projection: 80-120 units
- Target sectors: Elderly care facilities, home assistance, hospitals

WHAT WE NEED FROM YOU:
1. Authorized distributor agreement terms for Spain/Portugal
2. FOB Shanghai pricing for W3 (quantity 5, 10, 20 units)
3. CE certification documentation (required for EU sales)
4. Spanish-language user manual (or translation rights)
5. Technical support protocol for EU customers

We would greatly appreciate a 30-minute video call to discuss this opportunity. We are available any day this week (CET timezone, UTC+2).

We look forward to building a long-term strategic partnership with Keenon Robotics.

Best regards,

CEO | ZENBOTS IBERIA S.L.
C/ Alcalá 50, 2ºA · 28014 Madrid, Spain
Tel: +34 910 000 000 | info@zenbots.es | www.zenbots.es
Company Registration: ZENBOTS IBERIA S.L. (Spain)

---
WeChat ID available upon request for faster communication.""",
    },

    'orionstar': {
        'to_email': 'export@orionstar.com',
        'to_name': 'OrionStar Robotics Export Team',
        'subject': 'Exclusive Distribution Opportunity — Spain Market — OrionStar Lucki 2',
        'body_text': """Dear OrionStar Robotics Export Team,

I am writing to you from ZENBOTS IBERIA S.L., a Madrid-based robotics distribution company launching in Spain in July 2026.

We have been closely following OrionStar's development, particularly the Lucki 2 series and its impressive conversational AI capabilities in multiple languages. We believe OrionStar products represent a unique opportunity for the Spanish elderly companion robot market.

THE SPANISH COMPANION ROBOT MARKET:
- 9.5 million people over 65 (20% of population)
- 2.5 million elderly living alone — high isolation rates
- Growing demand for AI companion solutions
- NO specialized competitor in this segment

OUR INTEREST:
We are particularly interested in:
1. OrionStar Lucki 2 — companion/conversational robot
2. Possibility of Spanish language integration (Castilian Spanish)
3. Customization options for Spanish market (UI/UX adaptation)

PROPOSED COOPERATION:
- Exclusive distribution rights: Spain + Portugal
- Initial order: 5-10 units for market testing
- Target: 40+ units in Year 1
- Joint marketing: we will invest in local brand awareness

We are a serious partner with full business plan, showroom in Madrid, and marketing budget committed. We would love to schedule a video call to discuss partnership terms.

Please let us know your availability this week.

Best regards,
CEO | ZENBOTS IBERIA S.L.
info@zenbots.es | +34 910 000 000 | www.zenbots.es""",
    },

    'narwal': {
        'to_email': 'distributor@narwal.com',
        'to_name': 'Narwal Robotics Distribution Team',
        'subject': 'Narwal Authorized Dealer Application — Spain (Madrid) — ZENBOTS IBERIA',
        'body_text': """Dear Narwal Distribution Team,

We are applying to become an authorized Narwal dealer for the Spanish market through your official distribution program.

ABOUT US:
ZENBOTS IBERIA S.L. is a new robotics distribution company launching in Madrid, Spain in July 2026. We have a dedicated showroom in central Madrid (Chamberí district), a complete e-commerce website, and a marketing budget focused on the Madrid metropolitan area (7 million population).

WHY NARWAL IN SPAIN:
The Narwal Freo X Ultra is exactly what the Spanish premium home automation market is looking for. Spain has:
- High urbanization rate (80%) — apartment living ideal for robot vacuum+mop combo
- Growing affluent middle class seeking premium smart home solutions
- Currently underserved by premium robotic cleaning brands (only low-end Chinese brands via Amazon)

OUR PLAN:
- Showroom demonstration of Narwal products in Madrid
- Google Ads campaigns targeting "robot aspirador" keywords (2,400 monthly searches)
- Partnership with 30+ high-end real estate agencies in Madrid
- B2B sales to hotel chains and serviced apartment operators

INITIAL ORDER REQUEST:
- 10x Narwal Freo X Ultra (white label or Narwal brand)
- 5x Narwal Freo Z Ultra (if available)
- Restocking cycle: monthly

We are aware of your EU warehouse in the Netherlands and would prefer to start with orders from there for faster delivery.

Please send us your authorized dealer application form and pricing schedule.

Best regards,
ZENBOTS IBERIA S.L.
info@zenbots.es | +34 910 000 000 | www.zenbots.es
Madrid, Spain""",
    },

    'dreame': {
        'to_email': 'business@dreametech.com',
        'to_name': 'Dreame Technology Business Development',
        'subject': 'Reseller Partnership — Spain Market — ZENBOTS IBERIA S.L.',
        'body_text': """Dear Dreame Technology Business Development Team,

ZENBOTS IBERIA S.L. is a Madrid-based robotics distributor launching in July 2026, and we are very interested in becoming a Dreame reseller for the Spanish market.

We are aware that Dreame already has a presence in Barcelona. We would like to discuss becoming an additional authorized reseller specifically covering Madrid and central Spain — a market of 7 million people currently underserved.

WHAT WE OFFER:
- Dedicated physical showroom in Chamberí (Madrid) — premium location
- Online store with SEO-optimized product pages in Spanish
- Active Google Ads + Meta Ads campaigns (budget: €500/month)
- Customer installation and after-sales service in Madrid
- B2B sales pipeline to property management companies

PRODUCTS OF INTEREST:
1. Dreame X30 Ultra (flagship)
2. Dreame L20 Ultra Complete
3. Dreame W10 Pro (for our B2B hotel/office pipeline)

INITIAL ORDER:
We would like to start with 10-15 units across 3 models for our showroom and first customer deliveries.

Could you please share your reseller pricing and minimum order requirements?

We are ready to move quickly — our showroom opens in September 2026.

Kind regards,
ZENBOTS IBERIA S.L.
C/ Alcalá 50, 28014 Madrid, Spain
info@zenbots.es | +34 910 000 000""",
    },

    'segway': {
        'to_email': 'b2b@segway-navimow.com',
        'to_name': 'Segway Navimow B2B Team',
        'subject': 'Dealer Partnership Application — Spain — ZENBOTS IBERIA S.L.',
        'body_text': """Dear Segway Navimow B2B Team,

We are ZENBOTS IBERIA S.L., a Madrid-based robotics distributor launching in Spain in Summer 2026. We would like to apply for your Authorized Dealer Program for the Spanish market.

MARKET CONTEXT — SPAIN:
Spain has approximately 3.2 million single-family homes with gardens. The robotic lawnmower market is extremely underdeveloped compared to Northern Europe — the vast majority of garden owners still use traditional mowers. This represents a huge growth opportunity.

The Navimow H series (no perimeter wire, GPS RTK) is a game-changer for this market, as Spanish homeowners are particularly sensitive to garden aesthetics and would not want to install perimeter wires.

OUR PROPOSITION:
- Physical showroom demos in Madrid (running demonstrations in a real garden space)
- Partnership with 15+ garden centers and landscaping companies in Madrid
- B2B pipeline: residential urbanizations (gated communities) with shared garden management
- Instagram/YouTube content showcasing the robot in Spanish gardens

INITIAL ORDER REQUEST:
- 5x Navimow H800E (800 m²)
- 3x Navimow H1500E (1500 m²)
- Restocking every 4-6 weeks

We understand your EU distribution is based in Germany. Can you confirm delivery times and pricing to Spain?

We look forward to joining your dealer network.

Best regards,
ZENBOTS IBERIA S.L.
info@zenbots.es | +34 910 000 000 | www.zenbots.es
Madrid, Spain

P.S. We would also like to discuss any co-marketing opportunities for the Spanish launch.""",
    },
}


# ─── PLANTILLAS EMAILS CLIENTES ───────────────────────────────────────────────

def template_welcome_lead(name, product_interest=''):
    content = f"""
<h2 style="color:#0A1628;font-size:24px;font-weight:800;margin:0 0 8px">
  Hola {name} 👋
</h2>
<p style="color:#64748B;font-size:16px;margin:0 0 24px">
  Hemos recibido tu solicitud y nos alegramos mucho de que hayas contactado con ZENBOTS.
</p>
<div style="background:#F0F4F8;border-radius:12px;padding:20px;margin:0 0 24px">
  <p style="margin:0;color:#1E293B;font-size:15px;font-weight:600">¿Qué pasa ahora?</p>
  <p style="margin:8px 0 0;color:#64748B;font-size:14px">
    Un asesor especializado te llamará en las próximas <strong>2 horas hábiles</strong>
    para resolver todas tus dudas sobre {f"el <strong>{product_interest}</strong>" if product_interest else "nuestros robots"}
    y si lo deseas, agendar una demo gratuita.
  </p>
</div>
<div style="background:#0A1628;border-radius:12px;padding:20px;margin:0 0 24px">
  <p style="margin:0;color:rgba(255,255,255,.6);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.08em">
    Mientras tanto
  </p>
  <p style="margin:8px 0 0;color:#FFFFFF;font-size:15px">
    Puedes visitar nuestro <strong>showroom en Madrid</strong> (zona Chamberí) para ver
    los robots en acción. No hace falta cita previa.
  </p>
  <p style="margin:12px 0 0;color:#00C9A7;font-size:14px">
    📍 Zona Chamberí, Madrid &nbsp;·&nbsp; ☎️ +34 910 000 000 &nbsp;·&nbsp; L-V 9:00-18:00
  </p>
</div>
<a href="https://www.zenbots.es"
   style="display:inline-block;background:#00C9A7;color:#0A1628;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none">
  Ver todos los robots →
</a>"""
    return _wrap_html(f'Hola {name} — ZENBOTS IBERIA', content)


def template_demo_confirmation(name, date_str, time_str, address='nuestro showroom'):
    content = f"""
<h2 style="color:#0A1628;font-size:22px;font-weight:800;margin:0 0 8px">
  Demo confirmada ✓
</h2>
<p style="color:#64748B;font-size:15px;margin:0 0 24px">
  Hola {name}, tu demostración está confirmada. ¡Estamos deseando conocerte!
</p>
<div style="border:2px solid #00C9A7;border-radius:12px;padding:24px;margin:0 0 24px">
  <div style="display:flex;gap:12px;margin-bottom:12px">
    <span style="font-size:20px">📅</span>
    <div><p style="margin:0;font-size:12px;color:#94A3B8;font-weight:600">FECHA</p>
    <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#1E293B">{date_str}</p></div>
  </div>
  <div style="display:flex;gap:12px;margin-bottom:12px">
    <span style="font-size:20px">🕐</span>
    <div><p style="margin:0;font-size:12px;color:#94A3B8;font-weight:600">HORA</p>
    <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#1E293B">{time_str}</p></div>
  </div>
  <div style="display:flex;gap:12px">
    <span style="font-size:20px">📍</span>
    <div><p style="margin:0;font-size:12px;color:#94A3B8;font-weight:600">LUGAR</p>
    <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#1E293B">{address}</p></div>
  </div>
</div>
<p style="color:#64748B;font-size:14px">
  Si necesitas cambiar la cita, llámanos al <strong>+34 910 000 000</strong>
  o responde a este email.
</p>"""
    return _wrap_html('Demo confirmada — ZENBOTS IBERIA', content)


def template_order_confirmation(name, order_number, product_name, total, delivery_date):
    content = f"""
<h2 style="color:#0A1628;font-size:22px;font-weight:800;margin:0 0 8px">
  Pedido confirmado 🎉
</h2>
<p style="color:#64748B;font-size:15px;margin:0 0 24px">
  Gracias {name}. Tu pedido está en proceso.
</p>
<div style="background:#F0F4F8;border-radius:12px;padding:24px;margin:0 0 24px">
  <p style="margin:0 0 12px;font-size:12px;color:#94A3B8;font-weight:600;text-transform:uppercase">Detalle del pedido</p>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:6px 0;color:#64748B;font-size:14px">Nº Pedido</td>
        <td style="padding:6px 0;color:#1E293B;font-weight:700;font-size:14px;text-align:right">{order_number}</td></tr>
    <tr><td style="padding:6px 0;color:#64748B;font-size:14px">Producto</td>
        <td style="padding:6px 0;color:#1E293B;font-weight:700;font-size:14px;text-align:right">{product_name}</td></tr>
    <tr><td style="padding:6px 0;color:#64748B;font-size:14px">Total</td>
        <td style="padding:6px 0;color:#00C9A7;font-weight:800;font-size:18px;text-align:right">{total}</td></tr>
    <tr><td style="padding:6px 0;color:#64748B;font-size:14px">Instalación estimada</td>
        <td style="padding:6px 0;color:#1E293B;font-weight:700;font-size:14px;text-align:right">{delivery_date}</td></tr>
  </table>
</div>
<div style="background:#0A1628;border-radius:12px;padding:20px;margin:0 0 24px">
  <p style="margin:0;color:#FFFFFF;font-size:15px;font-weight:600">¿Qué incluye tu compra?</p>
  <ul style="margin:10px 0 0;padding-left:20px;color:rgba(255,255,255,.7);font-size:14px">
    <li style="margin-bottom:6px">Instalación y configuración a domicilio</li>
    <li style="margin-bottom:6px">Sesión de formación de 90 minutos</li>
    <li style="margin-bottom:6px">Garantía CE europea 2 años</li>
    <li>Soporte técnico en español</li>
  </ul>
</div>"""
    return _wrap_html(f'Pedido {order_number} — ZENBOTS IBERIA', content)
