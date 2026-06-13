#!/bin/bash
# ZENBOTS IBERIA — Configurador de email automático
# Solo necesitas copiar un código de 16 caracteres de Google

clear
echo ""
echo "  ╔═══════════════════════════════════════╗"
echo "  ║   ZENBOTS — Configurar email SMTP     ║"
echo "  ╚═══════════════════════════════════════╝"
echo ""

PROJECT="/Users/ignaciogabilondo/Documents/claude project/zenbots-iberia/website"
ENV_FILE="$PROJECT/.env"

# ── PASO 1: Detección cuenta Google ──────────────────────────────
EMAIL="gabilondoignacio@gmail.com"
echo "  Cuenta detectada: $EMAIL"
echo ""

# ── PASO 2: Abrir navegador en la página correcta ────────────────
echo "  Paso 1/3 — Abriendo Google en tu navegador…"
echo ""
echo "  ┌─────────────────────────────────────────┐"
echo "  │  Se abrirá: myaccount.google.com        │"
echo "  │  Sección: Seguridad → Contraseñas de    │"
echo "  │  aplicación                             │"
echo "  │                                         │"
echo "  │  1. Selecciona «Otra (nombre propio)»   │"
echo "  │  2. Escribe «ZENBOTS»                   │"
echo "  │  3. Pulsa «Generar»                     │"
echo "  │  4. Copia el código amarillo de 16 letras│"
echo "  └─────────────────────────────────────────┘"
echo ""

open "https://myaccount.google.com/apppasswords"
sleep 2

# ── PASO 3: Leer la contraseña ───────────────────────────────────
echo "  Paso 2/3 — Introduce la contraseña de aplicación"
echo ""
echo -n "  Pega aquí el código de 16 letras (sin espacios): "
read -r APP_PASS

# Limpiar espacios
APP_PASS=$(echo "$APP_PASS" | tr -d ' ')

# Validar longitud
if [ ${#APP_PASS} -ne 16 ]; then
  echo ""
  echo "  ✗ Error: el código debe tener exactamente 16 caracteres"
  echo "    (escribiste ${#APP_PASS}). Vuelve a intentarlo."
  echo ""
  read -p "  Pulsa Enter para cerrar…"
  exit 1
fi

# ── PASO 4: Escribir .env ────────────────────────────────────────
echo ""
echo "  Paso 3/3 — Guardando configuración…"

cat > "$ENV_FILE" << ENVEOF
# ZENBOTS IBERIA — Configuración de entorno
# Generado automáticamente el $(date '+%d/%m/%Y %H:%M')

PORT=3000
ADMIN_TOKEN=ZenbotsAdmin2024!

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=$EMAIL
SMTP_PASS=$APP_PASS

FROM_EMAIL=info@zenbots.es
FROM_NAME=ZENBOTS IBERIA

COMPANY_PHONE=+34 910 000 000
COMPANY_ADDRESS=Calle de Alcalá 50, 2ºA, 28014 Madrid
ENVEOF

echo "  ✓ Archivo .env creado"

# ── PASO 5: Reiniciar servidor ───────────────────────────────────
echo "  Reiniciando servidor con la nueva configuración…"
lsof -ti :3000 | xargs kill -9 2>/dev/null
sleep 1

cd "$PROJECT"
python3 app.py > /tmp/zenbots.log 2>&1 &
sleep 4

# ── PASO 6: Test de envío ────────────────────────────────────────
echo "  Enviando email de prueba a $EMAIL…"
RESULT=$(curl -s -X POST "http://localhost:3000/api/admin/config/email/test?token=ZenbotsAdmin2024!" \
  -H "Content-Type: application/json" \
  -d "{\"to_email\":\"$EMAIL\"}")

SUCCESS=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('success','false'))" 2>/dev/null)

echo ""
if [ "$SUCCESS" = "True" ] || [ "$SUCCESS" = "true" ]; then
  echo "  ╔═══════════════════════════════════════╗"
  echo "  ║   ✓ ¡Email configurado correctamente! ║"
  echo "  ╠═══════════════════════════════════════╣"
  echo "  ║  Revisa tu bandeja: $EMAIL  ║"
  echo "  ║                                       ║"
  echo "  ║  Abre el panel ERP → Bandeja de       ║"
  echo "  ║  correo → Enviar todos los borradores ║"
  echo "  ║  para contactar a los 5 proveedores.  ║"
  echo "  ╚═══════════════════════════════════════╝"
  echo ""
  # Abrir admin en bandeja de correo
  sleep 1
  open "http://localhost:3000/admin?token=ZenbotsAdmin2024!#emails"
else
  MSG=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('message') or d.get('error','Error desconocido'))" 2>/dev/null)
  echo "  ✗ Error al enviar el email de prueba:"
  echo "    $MSG"
  echo ""
  echo "  Posibles causas:"
  echo "  · La verificación en 2 pasos no está activada"
  echo "  · El código de 16 letras no es correcto"
  echo "  · Vuelve a ejecutar este script e inténtalo de nuevo"
fi

echo ""
read -p "  Pulsa Enter para cerrar esta ventana…"
