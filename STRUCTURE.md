# 🧩 Estructura de Proyecto (Desarrollo Modular Ultra)

Para garantizar la mantenibilidad absoluta, prevenir acoplamientos rígidos y asegurar que cualquier bug pueda ser reparado de manera focalizada sin comprometer el compilador general del sistema, **Dev Library Hub** se rige por un esquema de **Desarrollo Modular Ultra**.

---

## 🗺️ Mapa de Directorios

```
/
├── .github/                  # Integración Continua y Automatización
│   └── workflows/
│       ├── publish.yml       # Flujo para publicar Kotlite en JSR
│       └── publish-stridb.yml # Flujo para publicar Stridb en JSR
├── app/                      # Enrutamiento de Next.js (App Router)
│   ├── api/                  # Endpoints del servidor (ej. Gemini Proxy)
│   ├── globals.css           # Punto de entrada de Tailwind v4 y reset CSS
│   ├── layout.tsx            # Contenedor raíz de navegación y meta-tags
│   └── page.tsx              # Página de inicio (Consolidador del portfolio)
│
├── components/               # Módulos y Widgets visuales reutilizables
│   ├── Header.tsx            # Cabecera global con estadísticas consolidadas reales
│   ├── LibraryCard.tsx       # Tarjetas que encapsulan datos de rendimiento de cada kit
│   ├── LibraryModal.tsx      # Contenedor modal con pestañas (Overview, Sandbox, Docs)
│   ├── PlaygroundAnimate.tsx # Módulo de físicas de resorte (Omni-Hooks)
│   ├── PlaygroundFetch.tsx   # Simulador de resiliencia y exponencial backoff
│   ├── PlaygroundGrid.tsx    # Herramienta interactiva de diseño CSS Grid
│   └── PlaygroundState.tsx   # Consola inmutable de variables del State-Flow
│
├── kotlite/                  # Motor Autónomo de Base de Datos Local (Estilo Kotlin)
│   ├── Storage.ts            # Abstracción de persistencia (InMemory y LocalStorage)
│   ├── Schema.ts             # DSL Declarativo y constructores de columnas
│   ├── Query.ts              # Algoritmos de ordenado, límites y predicados lambda
│   ├── Table.ts              # Manejador transaccional CRUD con protección de claves únicas
│   ├── Database.ts           # Orquestador del sistema y gestor de eventos reactivos
│   ├── README.md             # Documentación exhaustiva y ejemplos de código
│   └── index.ts              # Barril de exportación (TypeScript Isolated-Modules safe)
│
├── lib/                      # Configuraciones estáticas, types e hilos lógicos
│   └── libraries.ts          # DataSet de los repositorios y comandos de instalación
│
├── librerias/                # Librerías de desarrollo de vanguardia y motores locales
│   └── stridb/               # Stridb: IndexedDB con Cifrado AES-GCM
│       ├── .gitignore        # Exclusión de archivos temporales e IDEs en la sub-librería
│       └── ...               # Submódulos ultra-modulares de Stridb
│
├── .gitignore                # Reglas globales de exclusión para evitar la subida de basura
└── metadata.json             # Permisos globales, nombre de app e identificación de API
```

---

## 🛠️ Principio de Modularidad Exclusiva

*   **Aislamiento de Playgrounds:** Cada Sandbox o simulador interactivo de biblioteca tiene su propia jerarquía de estados. Si modificas las variables de fricción de la física de rebote en `PlaygroundAnimate.tsx`, no interfieres con el canal de sockets de reintentos artificiales de `PlaygroundFetch.tsx`.
*   **Enlace Reactivo Independiente en Modales:** El componente `LibraryModal.tsx` actúa únicamente como consumidor de plantillas. Cuando cambias de pestaña, el estado interno se desmonta limpiamente, previniendo sobrecargas de eventos sobre el navegador.
*   **SSR Sólido en Capa de Base de Datos:** Kotlite DB fue diseñado bajo una separación drástica de dependencias de cliente/servidor. La detección inteligente de `window` en `Storage.ts` asegura la compilación estática del proyecto Next.js en servidores Cloud sin necesidad de inyectar parches `"use client"` sobre módulos de base no interactivos.
