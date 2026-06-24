export const dynamic = "force-static";

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const kotliteDir = path.join(process.cwd(), "librerias", "kotlite");
    
    // Lista explícita de archivos que componen la librería Kotlite
    const files = [
      "Storage.ts",
      "Schema.ts",
      "Query.ts",
      "Table.ts",
      "Database.ts",
      "Sync.ts",
      "Crypto.ts",
      "Relations.ts",
      "Debug.ts",
      "Migration.ts",
      "index.ts",
      "mod.ts",
      "jsr.json",
      "README.md",
      "STRUCTURE.md",
      "SETUP.md",
      "TUTORIAL.md",
      "CONTRIBUTING.md",
      "MODIFICATION_GUIDE.md",
      "LICENSE"
    ];

    let fileBlocks = "";

    for (const file of files) {
      const filePath = path.join(kotliteDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        // Escribimos un heredoc literal seguro ('EOF') para que bash no expanda variables como $ o acentos graves
        fileBlocks += `
echo "📦 Creando kotlite/${file}..."
cat << 'EOF' > kotlite/${file}
${content}
EOF
`;
      }
    }

    // Código completo del instalador interactivo en bash
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
echo -e "📑 Archivos creados: \${COLOR_SUCCESS}${files.length}/${files.length}\${COLOR_RESET}"
echo ""
echo -e "💡 \${COLOR_INFO}¿Qué sigue?\${COLOR_RESET}"
echo -e " 1. Abre \${COLOR_INFO}kotlite/TUTORIAL.md\${COLOR_RESET} para aprender a modificar cada componente."
echo -e " 2. Configura tu almacenamiento para usar IndexedDB o LocalStorage."
echo -e " 3. Utiliza la suite de depuración \${COLOR_INFO}KotliteDebugger\${COLOR_RESET} en consola para diagnosticar."
echo -e " 4. Migra tus esquemas y volcados de SQLite/Room usando el \${COLOR_INFO}KotliteMigrationBridge\${COLOR_RESET}."
echo ""
echo -e "\${COLOR_SUCCESS}¡Disfruta desarrollando de forma ultra modular con Kotlite!\${COLOR_RESET}"
`;

    return new NextResponse(installerScript, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });

  } catch (error: any) {
    console.error("Error generating installer script:", error);
    return new NextResponse(`echo "Error generating installer: ${error?.message || error}"`, {
      status: 500,
      headers: { "Content-Type": "text/plain" }
    });
  }
}
