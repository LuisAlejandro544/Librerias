# 🗺️ Roadmap de Integraciones Técnicas Futuras

Este documento traza las ideas de innovación y escalado modular que pueden implementarse en el Hub de manera nativa sin sobrecargar el rendimiento central de la plataforma.

---

## 📋 Tabla de Desarrollo

| Fase | Integración Propuesta | Tecnologías Implicadas | Estado |
| :--- | :--- | :--- | :--- |
| **Fase 1** | **Motor de Base de Datos de Kotlite** | TypeScript, LocalStorage, InMemory | **Completado** ✅ |
| **Fase 2** | **Asistente Inteligente de Documentación** | `GoogleGenAI`, `gemini-3.5-flash`, Proxy API | **Planeado (Draft)** 🚀 |
| **Fase 3** | **Sincronización Cloud Comunitaria** | Firebase Firestore, Auth, Rules | **Planeado (Draft)** 🚀 |
| **Fase 4** | **Benchmark WebAssembly Inteligente** | Rust, web-sys, Threading JS, d3.js / recharts | **Focalizado** 💡 |

---

## 🔍 Detalle del Roadmap de Innovaciones

### 1. Documentador Inteligente con SDK de Gemini

*   **Objetivo:** Permitir que los usuarios ingresen un requerimiento en lenguaje natural (ej. *"necesito una tabla de comentarios con votos positivos"*) y reciban la declaración del código DSL de Kotlite de forma interactiva generada por inteligencia artificial.
*   **Estructura de API recomendada:**
    ```ts
    // app/api/gemini/generate-schema/route.ts
    import { GoogleGenAI } from "@google/genai";
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    // Procesar prompt y estructurar la respuesta con JSON estructurado seguro
    ```

### 2. Sincronización en la Nube con Firestore

*   **Objetivo:** Permitir que los desarrolladores puedan "Guardar en la nube" las configuraciones calibradas en los playgrounds (ej. el resorte o la base de datos de pruebas) utilizando Firebase Firestore, de modo que se puedan consultar presets diseñados por otros usuarios del Hub.
*   **Ventajas:** Proporciona persistencia durable en dispositivo cruzado sin requerir servidores Postgres o SQL dedicados en este etapa del portfolio.

### 3. Simulador de Métricas de Rendimiento en Vivo (WASM Benchmarks)

*   **Objetivo:** Crear un micro-playground de velocidad comparando la base de datos local JS contra algoritmos implementados en WebAssembly (Rust).
*   **Visualización:** Representación gráfica en tiempo real mediante `d3` o `recharts` mostrando los microsegundos requeridos para procesar inserciones masivas (10K registros) en hilos paralelos del navegador.
