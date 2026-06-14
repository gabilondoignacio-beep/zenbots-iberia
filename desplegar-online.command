#!/bin/bash
# ZENBOTS IBERIA — Desplegar online en Railway
# Ejecuta este script para publicar la web en Internet (URL pública gratis)

clear
echo ""
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║   ZENBOTS IBERIA — Despliegue online (Railway)      ║"
echo "  ║   Tu web estará en: https://zenbots-iberia.up.railway.app"
echo "  ╚══════════════════════════════════════════════════════╝"
echo ""

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RAILWAY_BIN="$HOME/.railway/bin/railway"

# ── PASO 1: Instalar Railway CLI ──────────────────────────────────────────────
if ! command -v railway &>/dev/null && [ ! -f "$RAILWAY_BIN" ]; then
  echo "  [1/4] Instalando Railway CLI…"
  curl -fsSL https://railway.app/install.sh | sh
  export PATH="$HOME/.railway/bin:$PATH"
  echo "  ✓ Railway CLI instalado"
else
  export PATH="$HOME/.railway/bin:$PATH"
  echo "  [1/4] Railway CLI ya instalado ✓"
fi

echo ""

# ── PASO 2: Login ─────────────────────────────────────────────────────────────
echo "  [2/4] Iniciando sesión en Railway…"
echo "  (Se abrirá el navegador — crea cuenta gratis o entra con GitHub)"
echo ""
railway login

echo ""

# ── PASO 3: Configurar variables de entorno ───────────────────────────────────
echo "  [3/4] Configurando proyecto Railway…"
cd "$PROJECT_DIR"

# Link or create project
railway link 2>/dev/null || {
  echo "  Creando nuevo proyecto en Railway…"
  railway init --name "zenbots-iberia"
}

# Set environment variables
railway variables set ADMIN_TOKEN=ZenbotsAdmin2024! 2>/dev/null
railway variables set FROM_EMAIL=info@zenbotsiberia.com 2>/dev/null
railway variables set FROM_NAME="ZENBOTS IBERIA" 2>/dev/null

# Add volume for SQLite persistence
echo "  Configurando volumen para base de datos persistente…"
railway volume add --mount /app/website/db 2>/dev/null || echo "  (El volumen se configurará en el dashboard)"

echo ""

# ── PASO 4: Deploy ────────────────────────────────────────────────────────────
echo "  [4/4] Desplegando… (puede tardar 2-3 minutos)"
railway up --detach

echo ""
echo "  Obteniendo URL pública…"
sleep 5
URL=$(railway domain 2>/dev/null || echo "")

echo ""
echo "  ╔══════════════════════════════════════════════════════╗"
if [ -n "$URL" ]; then
  echo "  ║  ✓ ZENBOTS IBERIA está en LÍNEA                     ║"
  echo "  ╠══════════════════════════════════════════════════════╣"
  echo "  ║  Web pública:  https://$URL"
  echo "  ║  Panel ERP:    https://$URL/admin?token=ZenbotsAdmin2024!"
  echo "  ║  Pitch:        https://$URL/pitch"
  open "https://$URL"
else
  echo "  ║  ✓ Deploy iniciado correctamente                     ║"
  echo "  ╠══════════════════════════════════════════════════════╣"
  echo "  ║  Abriendo Railway dashboard para ver la URL…         ║"
  open "https://railway.app/dashboard"
fi
echo "  ╚══════════════════════════════════════════════════════╝"
echo ""
echo "  Próximos pasos:"
echo "  1. Copia la URL y compártela con clientes e inversores"
echo "  2. Configura dominio propio en Railway dashboard → Settings → Domains"
echo "  3. Cada 'git push' actualizará la web automáticamente"
echo ""
echo "  GitHub:   https://github.com/gabilondoignacio-beep/zenbots-iberia"
echo "  Railway:  https://railway.app/dashboard"
echo ""
read -p "  Pulsa Enter para cerrar…"
