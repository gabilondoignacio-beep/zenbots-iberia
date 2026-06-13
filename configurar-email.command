#!/bin/bash
# ZENBOTS IBERIA — Configurar email empresarial Zoho Mail
# Ejecuta este script DESPUÉS de completar crear-email-empresarial.command
# Solo introduce la contraseña de Zoho Mail y el sistema queda listo

clear
echo ""
echo "  ╔═══════════════════════════════════════════╗"
echo "  ║   ZENBOTS — Activar email empresarial     ║"
echo "  ║   info@zenbotsiberia.com via Zoho Mail    ║"
echo "  ╚═══════════════════════════════════════════╝"
echo ""

PROJECT="/Users/ignaciogabilondo/Documents/claude project/zenbots-iberia/website"
ENV_FILE="$PROJECT/.env"
EMAIL="info@zenbotsiberia.com"

# Si ya existe .env con contraseña configurada, preguntar si reconfigurar
if [ -f "$ENV_FILE" ] && grep -q "SMTP_PASS=." "$ENV_FILE" 2>/dev/null; then
  CURRENT=$(grep "SMTP_USER" "$ENV_FILE" | cut -d= -f2)
  echo "  Ya existe una configuración de email: $CURRENT"
  echo -n "  ¿Reconfigurar? (s/n): "
  read -r RECONF
  if [ "$RECONF" != "s" ] && [ "$RECONF" != "S" ]; then
    echo ""
    echo "  Configuración no modificada. Probando la existente…"
  else
    RECONF="yes"
  fi
fi

if [ "$RECONF" = "yes" ] || ! grep -q "SMTP_PASS=." "$ENV_FILE" 2>/dev/null; then
  echo ""
  echo "  Introduce la contraseña de la cuenta info@zenbotsiberia.com en Zoho:"
  echo "  (la creaste en crear-email-empresarial.command)"
  echo ""
  echo -n "  Contraseña Zoho Mail: "
  read -rs ZOHO_PASS
  echo ""

  if [ -z "$ZOHO_PASS" ]; then
    echo "  ✗ No se introdujo contraseña."
    read -p "  Pulsa Enter para cerrar…"
    exit 1
  fi

  cat > "$ENV_FILE" << ENVEOF
# ZENBOTS IBERIA — Configuración de entorno
# Generado el $(date '+%d/%m/%Y %H:%M')

PORT=3000
ADMIN_TOKEN=ZenbotsAdmin2024!

# ── SMTP Zoho Mail ──────────────────────────────
SMTP_HOST=smtp.zoho.eu
SMTP_PORT=587
SMTP_USER=$EMAIL
SMTP_PASS=$ZOHO_PASS

FROM_EMAIL=$EMAIL
FROM_NAME=ZENBOTS IBERIA

# ── Empresa ──────────────────────────────────────
COMPANY_PHONE=+34 910 000 000
COMPANY_ADDRESS=Calle de Alcalá 50, 2ºA, 28014 Madrid
COMPANY_DOMAIN=zenbotsiberia.com
ENVEOF

  echo "  ✓ Archivo .env guardado"
fi

# Reiniciar servidor
echo "  Reiniciando servidor…"
lsof -ti :3000 | xargs kill -9 2>/dev/null
sleep 1
cd "$PROJECT" && python3 app.py > /tmp/zenbots.log 2>&1 &
sleep 4

# Test
echo "  Enviando email de prueba a gabilondoignacio@gmail.com…"
RESULT=$(curl -s -X POST "http://localhost:3000/api/admin/config/email/test?token=ZenbotsAdmin2024!" \
  -H "Content-Type: application/json" \
  -d '{"to_email":"gabilondoignacio@gmail.com"}')

SUCCESS=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('success','false'))" 2>/dev/null)

echo ""
if [ "$SUCCESS" = "True" ] || [ "$SUCCESS" = "true" ]; then
  echo "  ╔═══════════════════════════════════════════╗"
  echo "  ║  ✓ Email empresarial funcionando          ║"
  echo "  ╠═══════════════════════════════════════════╣"
  echo "  ║  Cuenta:  $EMAIL    ║"
  echo "  ║  Revisa tu bandeja de gabilondoignacio@   ║"
  echo "  ╚═══════════════════════════════════════════╝"
  echo ""
  echo "  Abriendo ERP → Bandeja de correo…"
  sleep 1
  open "http://localhost:3000/admin?token=ZenbotsAdmin2024!#emails"
else
  MSG=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('message') or d.get('error',''))" 2>/dev/null)
  echo "  ⚠ El envío falló: $MSG"
  echo ""
  echo "  Comprueba en Zoho Mail → Settings → Mail Accounts → IMAP:"
  open "https://mail.zoho.eu/zm/#setting/accounts"
  echo "  Activa «IMAP Access» y «SMTP» si no lo están."
  echo "  Espera 5 minutos y vuelve a ejecutar este script."
fi

echo ""
read -p "  Pulsa Enter para cerrar…"
