# 🧠 AI Context (Contexto de Desarrollo para Inteligencias Artificiales)

Este archivo está diseñado específicamente para que cualquier agente inteligente, LLM o desarrollador asistido que ingrese a programar y expandir este repositorio comprenda las directrices estéticas, el stack técnico y las reglas absolutas para **no romper el proyecto** ni degradar su calidad técnica.

---

## 🚫 Restricciones Críticas Especiales (Zero-Larping, Anti-Slop)

1.  **Anti-Slop / Integridad Profesional:** Está estrictamente prohibido decorar la interfaz con datos de consola ficticios o metadatos técnicos redundantes inventados (ej. no añadir `PING: ok`, `PORT: 3000`, `SYSTEMS: OPTIMAL` o animaciones de terminal de hackeo vacías en zonas estáticas del layout). Los datos mostrados deben reflejar estados de variables legítimas del código.
2.  **Uso Exclusivo de Lucide React:** No importar iconos SVG nativos ni otras bibliotecas de tipografía en componentes interactivos. Todos los iconos deben consumirse desde la importación estándar `lucide-react`.
3.  **No Modificar Configuración PostCSS o Tailwind v4:** La gestión de estilos se gobierna enteramente por el plugin de PostCSS `@tailwindcss/postcss` importado en `app/globals.css`. No crear archivos `tailwind.config.ts` o archivos CSS auxiliares.
4.  **No Integrar SDKs de Cliente con Secretos:** Cualquier llamada de IA o persistencia debe cruzar por rutas en el servidor Next.js (`/app/api/*`) protegiendo credenciales sensibles como `GEMINI_API_KEY` o variables Firebase fuera del alcance del explorador.

---

## 🎨 Consistencia Visual (Elegant Dark Theme)

Todas las nuevos componentes o adiciones deben encajar quirúrgicamente bajo la paleta de colores de diseño premium e industrial definida para el sitio:

*   **Fondo de Pantalla Principal (Canvas):** `#09090B` (Zinc Negro oscuro)
*   **Bordes de Separación y Líneas:** `#27272A` (Bordes limpios de contraste)
*   **Fondo de Cajas de Contenido / Cards:** `#18181B` (Gris oscuro moderno)
*   **Colores de Contraste Activo / Links:** `indigo-500` / `indigo-400`
*   **Tipografía de Interfaz:** `font-sans` general, con acentos en `font-mono` para versiones, códigos, descargas y datos de ingeniería.

---

## 📜 Reglas de TypeScript y SSR en React

*   **Paso Seguro por el Servidor (SSR Protection):** En Next.js, por defecto los componentes son Server Components. Al crear componentes que involucren listeners (`onClick`, `onChange`), hooks (`useState`, `useEffect`) o APIs del navegador (`window`), debes añadir la directiva `'use client'` obligatoriamente en la primera línea.
*   **Isolated Modules:** Al realizar re-exportaciones en barriles `index.ts` (como en el de la librería `kotlite`), siempre distingue los elementos lógicos de ejecución de los elementos puramente conceptuales de tipado usando `export type { ... }` para evitar caídas catastróficas en el transpilador.
*   **Efectos Seguros (Safe Effects):** Nunca llames actualizaciones síncronas de estados dentro de un `useEffect` que puedan desencadenar bucles infinitos de re-renderizado en caliente. Utiliza diferidos tácticos (`setTimeout` o micro-callbacks) cuando sea estrictamente requerido sincronizar triggers de visualización.
