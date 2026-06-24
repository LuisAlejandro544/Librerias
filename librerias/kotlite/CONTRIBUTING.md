# Guía de Contribución a Kotlite DB 🚀

¡Gracias por tu interés en mejorar **Kotlite DB**! Como un proyecto diseñado bajo el estándar de **Desarrollo Modular Ultra**, nos enorgullece mantener un código limpio, legible y robusto. Si deseas colaborar con nosotros, lee atentamente las siguientes directrices.

---

## 📋 Normas Generales de Desarrollo

Para asegurar que el proyecto continúe siendo estable y eficiente, seguimos un estricto conjunto de principios:

1. **Diseño Modular Puro**: Cada función de la base de datos debe residir en su propio archivo (ej. `Query.ts` para consultas, `Storage.ts` para almacenamiento, `Debug.ts` para diagnóstico). Está terminantemente prohibido consolidar lógica no relacionada en un solo archivo para evitar romper la base de datos en actualizaciones concurrentes.
2. **SSR-Safe (Next.js)**: Cualquier interacción con APIs del navegador (como `window`, `localStorage`, `indexedDB`) debe estar salvaguardada frente a entornos de ejecución del servidor Node.js.
3. **Validación Exhaustiva de Tipos**: Mantén tipado estricto en TypeScript. No utilices tipos sueltos (`any`) a menos que sea estrictamente necesario para compatibilidad con firmas de funciones genéricas.
4. **Respeto a las Colecciones de Kotlin**: Al añadir métodos o extensiones a `QueryBuilder` o `KotliteTable`, intenta que su comportamiento y nombre repliquen las funciones de extensión de colecciones de Kotlin (ej. `firstOrNull()`, `where()`, `limit()`, `all()`).

---

## 🛠️ Cómo Proponer Cambios y Mejoras

1. **Forkea el Repositorio**: Crea una rama descriptiva para tu cambio (ej. `feature/indexed-db-indices` o `bugfix/cascading-null-handling`).
2. **Añade Tests y Verificaciones**: Ejecuta el formateador y linter de TypeScript para asegurarte de que tu código no añade errores de tipado o de estilo.
3. **Documenta los Cambios**: Si añades una nueva opción en el esquema de Chaining o el motor de persistencia, actualiza el `TUTORIAL.md` y el `README.md` con ejemplos prácticos.
4. **Envía un Pull Request**: Describe detalladamente el problema que estás solucionando y por qué la solución propuesta es la más óptima y respetuosa con los esquemas del proyecto.

---

¡Gracias por ser parte del ecosistema **Kotlite**! Juntos construiremos la base de datos local más rápida, fiel y limpia del ecosistema web.
