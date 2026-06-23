const fs = require('fs');
const path = require('path');

try {
  const kotliteDir = path.join(process.cwd(), "kotlite");
  const publicDir = path.join(process.cwd(), "public");

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const files = [
    "Storage.ts",
    "Schema.ts",
    "Query.ts",
    "Table.ts",
    "Database.ts",
    "Sync.ts",
    "Crypto.ts",
    "Relations.ts",
    "index.ts",
    "mod.ts",
    "jsr.json",
    "README.md",
    "STRUCTURE.md",
    "SETUP.md",
    "LICENSE"
  ];

  let fileBlocks = "";

  for (const file of files) {
    const filePath = path.join(kotliteDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      fileBlocks += `
echo "📦 Creando kotlite/${file}..."
cat << 'EOF' > kotlite/${file}
${content}
EOF
`;
    }
  }

  const installerScript = `#!/bin/bash
# ==============================================================================
# 🌌 KOTLITE DB - INSTALADOR DE CÓDIGO FUENTE (DEVELOPMENT INTEGRATOR)
# Inspirado en Kotlin DSL y gobernado por Desarrollo Modular Ultra
# ==============================================================================

set -e

# Colores visuales premium
COLOR_TITLE="\\033[1;36m"
COLOR_SUCCESS="\\033[1;32m"
COLOR_INFO="\\033[1;34m"
COLOR_WARN="\\033[1;33m"
COLOR_RESET="\\033[0m"

echo -e "\${COLOR_TITLE}"
echo "======================================================================"
echo "    📦  KOTLITE DB - INSTALADOR EN CALIENTE PARA DESARROLLADORES"
echo "======================================================================"
echo -e "\${COLOR_RESET}"

echo -e "\${COLOR_INFO}👉 Preparando la instalación en el directorio actual...\${COLOR_RESET}"

# Crear el directorio kotlite
if [ -d "kotlite" ]; then
    echo -e "\${COLOR_WARN}⚠️  Se detectó que la carpeta 'kotlite' ya existe.\${COLOR_RESET}"
    read -p "¿Deseas sobreescribir los archivos actuales? (s/n): " confirm
    if [[ ! "\$confirm" =~ ^[Ss]$ ]]; then
        echo -e "\${COLOR_WARN}❌ Instalación cancelada por el usuario.\${COLOR_RESET}"
        exit 0
    fi
else
    mkdir -p kotlite
fi

# Generación dinámica de los archivos
${fileBlocks}

echo -e "\${COLOR_SUCCESS}"
echo "======================================================================"
echo "  ✅ INSTALACIÓN COMPLETADA CON ÉXITO"
echo "======================================================================"
echo -e "\${COLOR_RESET}"
echo -e "📂 La librería se ha instalado en: \${COLOR_INFO}./kotlite/\${COLOR_RESET}"
echo -e "📑 Archivos creados: \${COLOR_SUCCESS}15/15\${COLOR_RESET}"
echo ""
echo -e "💡 \${COLOR_INFO}¿Qué sigue?\${COLOR_RESET}"
echo -e " 1. Abre \${COLOR_INFO}kotlite/README.md\${COLOR_RESET} o \${COLOR_INFO}kotlite/SETUP.md\${COLOR_RESET} para ver guías rápidas."
echo -e " 2. Crea tu archivo de configuración de base de datos (ej: \${COLOR_INFO}db.ts\${COLOR_RESET})."
echo -e " 3. Importa el hook reactivo de ejemplo y disfruta del estilo de Kotlin en TS."
echo ""
echo -e "\${COLOR_SUCCESS}¡Disfruta desarrollando de forma ultra modular con Kotlite!\${COLOR_RESET}"
`;

  fs.writeFileSync(path.join(publicDir, "install.sh"), installerScript, "utf-8");
  console.log("✅ Estático 'public/install.sh' generado correctamente.");
} catch (error) {
  console.error("❌ Error al generar 'public/install.sh':", error);
  process.exit(1);
}
