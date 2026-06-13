#!/bin/bash
# ZENBOTS IBERIA — Asistente de email empresarial
# Tiempo total estimado: 15 minutos

clear
DOMAIN="zenbotsiberia.com"
EMAIL="info@${DOMAIN}"
PROJECT="/Users/ignaciogabilondo/Documents/claude project/zenbots-iberia/website"

print_header() {
  clear
  echo ""
  echo "  ╔══════════════════════════════════════════════╗"
  echo "  ║   ZENBOTS — Crear email empresarial          ║"
  echo "  ║   $EMAIL               ║"
  echo "  ╚══════════════════════════════════════════════╝"
  echo ""
}

press_enter() {
  echo ""
  echo -n "  → Pulsa Enter cuando hayas terminado este paso… "
  read -r
}

# ════════════════════════════════════════════════
# PASO 1: REGISTRAR DOMINIO en Namecheap
# ════════════════════════════════════════════════
print_header
echo "  ┌──────────────────────────────────────────────┐"
echo "  │  PASO 1 de 4 — Registrar el dominio          │"
echo "  │  $DOMAIN                        │"
echo "  │  Precio: ~€10/año en Namecheap               │"
echo "  └──────────────────────────────────────────────┘"
echo ""
echo "  Se va a abrir Namecheap con el dominio buscado."
echo "  Instrucciones:"
echo ""
echo "  1. Haz clic en «Add to cart»"
echo "  2. Desactiva cualquier addon innecesario"
echo "  3. Crea cuenta con: gabilondoignacio@gmail.com"
echo "  4. Paga con tarjeta (Visa/Mastercard)"
echo "  5. Confirma el email de verificación"
echo ""
open "https://www.namecheap.com/domains/registration/results/?domain=${DOMAIN}"
press_enter

# ════════════════════════════════════════════════
# PASO 2: CREAR CUENTA ZOHO MAIL (gratis)
# ════════════════════════════════════════════════
print_header
echo "  ┌──────────────────────────────────────────────┐"
echo "  │  PASO 2 de 4 — Crear buzón Zoho Mail FREE    │"
echo "  │  5 cuentas gratis · 5GB · SMTP incluido      │"
echo "  └──────────────────────────────────────────────┘"
echo ""
echo "  Instrucciones:"
echo ""
echo "  1. Haz clic en «Sign Up for Free» → plan FREE"
echo "  2. Elige «Business Email» (no personal)"
echo "  3. Introduce el dominio: $DOMAIN"
echo "  4. Crea la cuenta info@$DOMAIN"
echo "  5. Contraseña fuerte — guárdala abajo:"
echo ""
echo "  ┌────────────────────────────────────────────┐"
echo -n "  │  Contraseña Zoho: "
read -r ZOHO_PASS
echo "  └────────────────────────────────────────────┘"
echo ""
open "https://www.zoho.com/mail/zohomail-pricing.html"
press_enter

# ════════════════════════════════════════════════
# PASO 3: CONFIGURAR DNS en Namecheap
# ════════════════════════════════════════════════
print_header
echo "  ┌──────────────────────────────────────────────┐"
echo "  │  PASO 3 de 4 — Apuntar DNS a Zoho Mail       │"
echo "  └──────────────────────────────────────────────┘"
echo ""
echo "  Abre Namecheap → Domain List → Manage → Advanced DNS"
echo "  Añade estos registros MX exactamente:"
echo ""
echo "  ┌────────────────────────────────────────────────────────┐"
echo "  │  Tipo    Host    Valor                   Prioridad     │"
echo "  ├────────────────────────────────────────────────────────┤"
echo "  │  MX      @       mx.zoho.eu              10            │"
echo "  │  MX      @       mx2.zoho.eu             20            │"
echo "  │  MX      @       mx3.zoho.eu             50            │"
echo "  │  TXT     @       v=spf1 include:zoho.eu ~all          │"
echo "  │  CNAME   mail    business.zoho.eu                      │"
echo "  └────────────────────────────────────────────────────────┘"
echo ""
echo "  (Los cambios DNS tardan 5-30 minutos en propagarse)"
echo ""
open "https://ap.www.namecheap.com/domains/list/"
press_enter

# ════════════════════════════════════════════════
# PASO 4: CONFIGURAR SMTP EN ZENBOTS
# ════════════════════════════════════════════════
print_header
echo "  ┌──────────────────────────────────────────────┐"
echo "  │  PASO 4 de 4 — Configurar ZENBOTS con Zoho   │"
echo "  └──────────────────────────────────────────────┘"
echo ""

if [ -z "$ZOHO_PASS" ]; then
  echo -n "  Introduce la contraseña de Zoho Mail: "
  read -r ZOHO_PASS
fi

# Escribir .env
cat > "$PROJECT/.env" << ENVEOF
# ZENBOTS IBERIA — Configuración de entorno
# Email empresarial: $EMAIL
# Generado el $(date '+%d/%m/%Y %H:%M')

PORT=3000
ADMIN_TOKEN=ZenbotsAdmin2024!

# ── SMTP Zoho Mail (info@zenbotsiberia.com) ──
SMTP_HOST=smtp.zoho.eu
SMTP_PORT=587
SMTP_USER=$EMAIL
SMTP_PASS=$ZOHO_PASS

FROM_EMAIL=$EMAIL
FROM_NAME=ZENBOTS IBERIA

# ── Empresa ──
COMPANY_PHONE=+34 910 000 000
COMPANY_ADDRESS=Calle de Alcalá 50, 2ºA, 28014 Madrid
COMPANY_DOMAIN=$DOMAIN
ENVEOF

echo "  ✓ Archivo .env creado con Zoho Mail"
echo "  Reiniciando servidor…"

lsof -ti :3000 | xargs kill -9 2>/dev/null
sleep 1
cd "$PROJECT" && python3 app.py > /tmp/zenbots.log 2>&1 &
sleep 4

# Test de envío
echo "  Enviando email de prueba a gabilondoignacio@gmail.com…"
RESULT=$(curl -s -X POST "http://localhost:3000/api/admin/config/email/test?token=ZenbotsAdmin2024!" \
  -H "Content-Type: application/json" \
  -d '{"to_email":"gabilondoignacio@gmail.com"}')

SUCCESS=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('success','false'))" 2>/dev/null)

echo ""
if [ "$SUCCESS" = "True" ] || [ "$SUCCESS" = "true" ]; then
  echo "  ╔══════════════════════════════════════════════╗"
  echo "  ║  ✓ ¡Email empresarial funcionando!           ║"
  echo "  ╠══════════════════════════════════════════════╣"
  echo "  ║  Cuenta:   $EMAIL          ║"
  echo "  ║  Dominio:  $DOMAIN                ║"
  echo "  ║  SMTP:     smtp.zoho.eu:587              ║"
  echo "  ╚══════════════════════════════════════════════╝"
  echo ""
  echo "  Abriendo el panel ERP → Bandeja de correo…"
  sleep 1
  open "http://localhost:3000/admin?token=ZenbotsAdmin2024!#emails"
else
  MSG=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('message') or d.get('error',''))" 2>/dev/null)
  echo "  ⚠ El email aún no llega:"
  echo "    $MSG"
  echo ""
  echo "  Causas más comunes:"
  echo "  · Los DNS de Zoho aún no han propagado (espera 30 min)"
  echo "  · La contraseña de Zoho es incorrecta"
  echo "  · Falta activar IMAP/SMTP en Zoho: Mail → Settings → IMAP"
  echo ""
  echo "  Vuelve a ejecutar este script cuando haya pasado un rato."
fi

echo ""
read -p "  Pulsa Enter para cerrar…"
