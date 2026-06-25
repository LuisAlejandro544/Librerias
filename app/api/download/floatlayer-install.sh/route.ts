export const dynamic = "force-static";

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const floatlayerDir = path.join(process.cwd(), "librerias", "FloatLayer");
    
    // Lista explícita de archivos de FloatLayer
    const files = [
      "core/Types.ts",
      "core/FloatManager.ts",
      "mobile/MobileEngine.ts",
      "mobile/index.ts",
      "pc/PcEngine.ts",
      "pc/index.ts",
      "Debug.ts",
      "index.ts",
      "mod.ts",
      "jsr.json",
      "extensions/TelemetryConsole.tsx",
      "extensions/PipEngine.ts",
      "README.md",
      "STRUCTURE.md",
      "TUTORIAL.md",
      "CONTRIBUTING.md",
      "MODIFICATIONS_AND_LIMITATIONS.md",
      "LICENSE"
    ];

    let fileBlocks = "";

    for (const file of files) {
      const filePath = path.join(floatlayerDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        
        // Determinar si es un archivo dentro de un subdirectorio
        const fileDir = path.dirname(file);
        let mkdirCmd = "";
        if (fileDir !== ".") {
          mkdirCmd = `mkdir -p floatlayer/${fileDir}`;
        }

        fileBlocks += `
${mkdirCmd}
echo "📦 Creando floatlayer/${file}..."
cat << 'EOF' > floatlayer/${file}
${content}
EOF
`;
      }
    }

    const installerScript = `#!/bin/bash
# ==============================================================================
# 🌐 FLOATLAYER - INSTALADOR DE CÓDIGO FUENTE (DEVELOPMENT INTEGRATOR)
# Capas y ventanas flotantes modulares con motores PC & Mobile independientes
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
echo "   🌐  FLOATLAYER - INSTALADOR DE CÓDIGO FUENTE EN CALIENTE"
echo "======================================================================"
echo -e "\${COLOR_RESET}"

echo -e "\${COLOR_INFO}👉 Preparando la instalación modular en el directorio actual...\${COLOR_RESET}"

# Crear el directorio raíz
if [ -d "floatlayer" ]; then
    echo -e "\${COLOR_WARN}⚠️  Se detectó que la carpeta 'floatlayer' ya existe.\${COLOR_RESET}"
    read -p "¿Deseas sobreescribir los archivos actuales? (s/n): " confirm
    if [[ ! "\$confirm" =~ ^[Ss]$ ]]; then
        echo -e "\${COLOR_WARN}❌ Instalación cancelada por el usuario.\${COLOR_RESET}"
        exit 0
    fi
else
    mkdir -p floatlayer
fi

# Generación dinámica de los subdirectorios y archivos
${fileBlocks}

echo -e "\${COLOR_SUCCESS}"
echo "======================================================================"
echo "  ✅ INSTALACIÓN DE FLOATLAYER COMPLETADA CON ÉXITO"
echo "======================================================================"
echo -e "\${COLOR_RESET}"
echo -e "📂 La librería se ha instalado en: \${COLOR_INFO}./floatlayer/\${COLOR_RESET}"
echo -e "📑 Archivos creados: \${COLOR_SUCCESS}${files.length}/${files.length}\${COLOR_RESET}"
echo ""
echo -e "💡 \${COLOR_INFO}¿Qué sigue?\${COLOR_RESET}"
echo -e " 1. Revisa \${COLOR_INFO}floatlayer/README.md\${COLOR_RESET} y \${COLOR_INFO}floatlayer/STRUCTURE.md\${COLOR_RESET} para entender el flujo."
echo -e " 2. Importa el hook reactivo usando: \${COLOR_INFO}import { useFloatLayer } from './floatlayer';\${COLOR_RESET}"
echo -e " 3. Activa la telemetría en desarrollo con: \${COLOR_INFO}FloatDebug.enableConsoleBridge();\${COLOR_RESET}"
echo -e " 4. Utiliza \${COLOR_INFO}FloatPcEngine\${COLOR_RESET} para vistas Desktop y \${COLOR_INFO}FloatMobileEngine\${COLOR_RESET} para vistas táctiles."
echo ""
echo -e "\${COLOR_SUCCESS}¡Disfruta desarrollando de forma ultra modular con FloatLayer! 🌐\${COLOR_RESET}"
`;

    return new NextResponse(installerScript, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });

  } catch (error: any) {
    console.error("Error generating installer script for FloatLayer:", error);
    return new NextResponse(`echo "Error generating installer: ${error?.message || error}"`, {
      status: 500,
      headers: { "Content-Type": "text/plain" }
    });
  }
}
