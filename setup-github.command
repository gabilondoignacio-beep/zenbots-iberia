#!/bin/bash
# ZENBOTS IBERIA — Configuración GitHub
# Doble clic para conectar con GitHub y subir el repositorio

clear
echo "============================================"
echo "  ZENBOTS IBERIA — Configuración de GitHub"
echo "============================================"
echo ""

GH="$HOME/bin/gh"
PROJECT="$HOME/Documents/claude project/zenbots-iberia"

# Verificar gh
if ! "$GH" --version &>/dev/null; then
  echo "ERROR: gh CLI no encontrado"
  read -p "Pulsa Enter para cerrar…"
  exit 1
fi

# Verificar autenticación
if "$GH" auth status &>/dev/null 2>&1; then
  echo "✓ Ya estás autenticado en GitHub"
  USER=$("$GH" api user -q .login)
  echo "  Usuario: $USER"
else
  echo "Paso 1: Autenticación con GitHub"
  echo "----------------------------------"
  echo "Se abrirá tu navegador para conectar tu cuenta."
  echo ""
  "$GH" auth login --hostname github.com --git-protocol https --web
  if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: No se pudo autenticar. Inténtalo de nuevo."
    read -p "Pulsa Enter para cerrar…"
    exit 1
  fi
fi

USER=$("$GH" api user -q .login 2>/dev/null)
echo ""
echo "============================================"
echo "Paso 2: Creando repositorio en GitHub"
echo "============================================"
echo ""

REPO_NAME="zenbots-iberia"

# Comprobar si ya existe el repo
if "$GH" repo view "$USER/$REPO_NAME" &>/dev/null 2>&1; then
  echo "✓ Repositorio ya existe: github.com/$USER/$REPO_NAME"
else
  "$GH" repo create "$REPO_NAME" \
    --public \
    --description "ZENBOTS IBERIA S.L. — Distribución de robots domésticos para Madrid. Web corporativa, ERP y pitch de inversión." \
    --source="$PROJECT" \
    --push
  echo "✓ Repositorio creado: https://github.com/$USER/$REPO_NAME"
fi

echo ""
echo "============================================"
echo "Paso 3: Subiendo código a GitHub"
echo "============================================"
cd "$PROJECT"

# Añadir remote si no existe
if ! git remote get-url origin &>/dev/null 2>&1; then
  git remote add origin "https://github.com/$USER/$REPO_NAME.git"
fi

git push -u origin main
echo ""
echo "============================================"
echo "✓ ¡TODO LISTO!"
echo "============================================"
echo ""
echo "Repositorio: https://github.com/$USER/$REPO_NAME"
echo ""
open "https://github.com/$USER/$REPO_NAME"
echo ""
read -p "Pulsa Enter para cerrar esta ventana…"
