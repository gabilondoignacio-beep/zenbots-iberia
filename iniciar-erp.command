#!/bin/bash
# ZENBOTS IBERIA — Iniciar Panel ERP
# Doble clic para arrancar el servidor y abrir el ERP directamente

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/website"
clear
echo ""
echo "  ╔═══════════════════════════════════════════╗"
echo "  ║   ZENBOTS IBERIA — Panel ERP              ║"
echo "  ║   Iniciando sistema de gestión…           ║"
echo "  ╚═══════════════════════════════════════════╝"
echo ""

# Kill any existing server on port 3000
lsof -ti :3000 | xargs kill -9 2>/dev/null

# Install Flask if not present
python3 -c "import flask" 2>/dev/null || {
  echo "  Instalando Flask…"
  pip3 install flask --quiet
}

echo "  Iniciando servidor en http://localhost:3000"
(sleep 2 && open "http://localhost:3000/admin?token=ZenbotsAdmin2024!") &

cd "$DIR" && python3 app.py
