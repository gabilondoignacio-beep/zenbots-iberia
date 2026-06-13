#!/bin/bash
# ZENBOTS IBERIA — Iniciar servidor web
# Uso: ./start.sh [puerto]

PORT=${1:-3000}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

echo ""
echo "  Iniciando ZENBOTS IBERIA..."
echo "  Web:   http://localhost:$PORT"
echo "  Admin: http://localhost:$PORT/admin?token=ZenbotsAdmin2024!"
echo ""
echo "  Presiona Ctrl+C para detener."
echo ""

PORT=$PORT python3 app.py
