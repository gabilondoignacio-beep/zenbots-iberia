#!/bin/bash
# ZENBOTS IBERIA — Arranque del servidor
# Doble clic en este archivo para iniciar

DIR="$(cd "$(dirname "$0")/website" && pwd)"

echo "================================"
echo "  ZENBOTS IBERIA — Iniciando…"
echo "================================"

# Verifica Python
if ! command -v python3 &>/dev/null; then
  echo "ERROR: Python 3 no encontrado"
  read -p "Pulsa Enter para cerrar…"
  exit 1
fi

# Instala Flask si falta
python3 -c "import flask" 2>/dev/null || {
  echo "Instalando Flask…"
  pip3 install flask --quiet
}

# Mata proceso anterior en el mismo puerto
lsof -ti :3000 | xargs kill -9 2>/dev/null
sleep 0.5

echo ""
echo "Iniciando servidor en http://localhost:3000"
echo "Admin:  http://localhost:3000/admin?token=ZenbotsAdmin2024!"
echo "Pitch:  http://localhost:3000/pitch"
echo ""
echo "Para parar el servidor: Ctrl+C"
echo "================================"
echo ""

# Abre el navegador tras 2 segundos
(sleep 2 && open "http://localhost:3000") &

cd "$DIR"
python3 app.py
