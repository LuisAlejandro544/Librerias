export const dynamic = "force-static";

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const stridbDir = path.join(process.cwd(), "librerias", "stridb");
    
    // Lista explícita de archivos de Stridb
    const files = [
      "Database.ts",
      "Schema.ts",
      "Query.ts",
      "Crypto.ts",
      "InactivityManager.ts",
      "KeyVault.ts",
      "StoragePersistence.ts",
      "Debug.ts",
      "Transaction.ts",
      "Backup.ts",
      "Hooks.ts",
      "index.ts",
      "mod.ts",
      "jsr.json",
      "README.md",
      "STRUCTURE.md",
      "TUTORIAL.md",
      "CONTRIBUTING.md",
      "LIMITATIONS_AND_MODS.md",
      "AI_CONTEXT.md",
      "LICENSE"
    ];

    let fileBlocks = "";

    for (const file of files) {
      const filePath = path.join(stridbDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        fileBlocks += `
echo "📦 Creando stridb/${file}..."
cat << 'EOF' > stridb/${file}
${content}
EOF
`;
      }
    }

    const installerScript = `#!/bin/bash
# ==============================================================================
# ⚡ STRIDB - INSTALADOR DE CÓDIGO FUENTE (DEVELOPMENT INTEGRATOR)
# Base de datos IndexedDB Estricta y Ultra Modular
# ==============================================================================

set -e

# Colores visuales premium
COLOR_TITLE="\\033[1;35m"
COLOR_SUCCESS="\\033[1;32m"
COLOR_INFO="\\033[1;34m"
COLOR_WARN="\\033[1;33m"
COLOR_RESET="\\033[0m"

echo -e "\${COLOR_TITLE}"
echo "======================================================================"
echo "    ⚡  STRIDB - INSTALADOR EN CALIENTE PARA DESARROLLADORES"
echo "======================================================================"
echo -e "\${COLOR_RESET}"

echo -e "\${COLOR_INFO}👉 Preparando la instalación en el directorio actual...\${COLOR_RESET}"

# Crear el directorio stridb
if [ -d "stridb" ]; then
    echo -e "\${COLOR_WARN}⚠️  Se detectó que la carpeta 'stridb' ya existe.\${COLOR_RESET}"
    read -p "¿Deseas sobreescribir los archivos actuales? (s/n): " confirm
    if [[ ! "\$confirm" =~ ^[Ss]$ ]]; then
        echo -e "\${COLOR_WARN}❌ Instalación cancelada por el usuario.\${COLOR_RESET}"
        exit 0
    fi
else
    mkdir -p stridb
fi

# Generación dinámica de los archivos
${fileBlocks}

echo -e "\${COLOR_SUCCESS}"
echo "======================================================================"
echo "  ✅ INSTALACIÓN COMPLETADA CON ÉXITO"
echo "======================================================================"
echo -e "\${COLOR_RESET}"
echo -e "📂 La librería se ha instalado en: \${COLOR_INFO}./stridb/\${COLOR_RESET}"
echo -e "📑 Archivos creados: \${COLOR_SUCCESS}${files.length}/${files.length}\${COLOR_RESET}"
echo ""
echo -e "💡 \${COLOR_INFO}¿Qué sigue?\${COLOR_RESET}"
echo -e " 1. Abre \${COLOR_INFO}stridb/README.md\${COLOR_RESET}, \${COLOR_INFO}stridb/STRUCTURE.md\${COLOR_RESET} y \${COLOR_INFO}stridb/TUTORIAL.md\${COLOR_RESET} para entender la arquitectura."
echo -e " 2. Revisa la guía de desarrollo en \${COLOR_INFO}stridb/LIMITATIONS_AND_MODS.md\${COLOR_RESET} y contribuye con \${COLOR_INFO}stridb/CONTRIBUTING.md\${COLOR_RESET}."
echo -e " 3. Importa tus módulos con: \${COLOR_INFO}import { createStridbDatabase } from './stridb';\${COLOR_RESET}"
echo -e " 4. Utiliza la bóveda cifrada segura \${COLOR_INFO}StridbLLMKeyVault\${COLOR_RESET} para guardar tus claves de API."
echo -e " 5. Enlaza tus componentes de React con el nuevo Hook reactivo \${COLOR_INFO}useStridbQuery\${COLOR_RESET}."
echo ""
echo -e "\${COLOR_SUCCESS}¡Disfruta desarrollando de forma ultra modular con Stridb! ⚡\${COLOR_RESET}"
`;

    return new NextResponse(installerScript, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });

  } catch (error: any) {
    console.error("Error generating installer script for Stridb:", error);
    return new NextResponse(`echo "Error generating installer: ${error?.message || error}"`, {
      status: 500,
      headers: { "Content-Type": "text/plain" }
    });
  }
}
