# 🤝 Contribuyendo a Stridb

¡Gracias por tu interés en contribuir a **Stridb**! Como un proyecto ultra modular y enfocado en la excelencia del software, valoramos enormemente las contribuciones de la comunidad que ayuden a pulir, expandir y fortalecer esta librería de base de datos.

Este documento proporciona pautas y directrices claras para asegurarnos de que el proceso sea ágil, limpio y agradable para todos.

---

## 🏗️ Filosofía de Desarrollo

Nuestra base de código está regida por principios rigurosos:
1. **Ultra Modularidad**: Cada componente tiene una única responsabilidad y debe estar contenido en su propio archivo (ej. `Crypto.ts` para encriptación, `Query.ts` para el motor de consultas, `Hooks.ts` para ganchos de frontend). Evitamos agrupar todo en un archivo gigante.
2. **Cero Dependencias Externas**: La librería núcleo debe correr directamente en navegadores, Deno o entornos compatibles sin requerir dependencias pesadas de terceros. Aprovechamos las APIs nativas del navegador (como `IndexedDB` y `Web Crypto API`).
3. **Tipado Estricto de TypeScript**: No se admiten tipos `any` en funciones del núcleo a menos que sea estrictamente necesario para compatibilidad genérica. Todo parámetro y retorno debe estar tipado explícitamente.
4. **Respeto a las Restricciones del Entorno**: Garantizar que el código compile y pase el linter sin advertencias antes de proponer cambios.

---

## 🛠️ Cómo Empezar

### 1. Clonar el Repositorio y Configurar el Entorno
Asegúrate de tener instalado Node.js (versión 18 o superior) y npm en tu máquina de desarrollo.

```bash
git clone https://github.com/tu-usuario/stridb.git
cd stridb
npm install
```

### 2. Estructura de Directorios Clave
* `librerias/stridb/` - Código fuente de la librería.
* `components/` - Suite de playground interactiva para probar modificaciones visualmente en tiempo real.
* `scripts/` - Scripts de automatización y generadores de empaquetado.

---

## 🧪 Pruebas y Validación de Calidad

Antes de realizar un Commit o enviar una solicitud de cambio (Pull Request), es obligatorio realizar dos pasos críticos de control de calidad:

### 1. Análisis Estático (Linter)
Garantiza que no haya fallos sintácticos, variables no utilizadas, dependencias circulares ni malas prácticas de reactividad:
```bash
npm run lint
```

### 2. Construcción de Producción
Verifica que el transpilador de TypeScript y el empaquetador generen los artefactos sin advertencias o errores de tipo:
```bash
npm run build
```

---

## 📝 Reglas de Formato y Estilo de Código

* **Nombres de Archivos**: Capitalización estilo PascalCase para clases u objetos de gran envergadura (ej. `Database.ts`, `Query.ts`), y camelCase o PascalCase coherente según la convención del proyecto.
* **Declaración de Enums**: Utiliza siempre enums estándar de TypeScript (`enum MyEnum { ... }`). Quedan **estrictamente prohibidos** los `const enum`.
* **Imports**: Todas las declaraciones de `import` deben estar situadas en el tope superior del archivo. No destructures en los imports de tipo.
* **Documentación**: Toda nueva clase, método público o hook exportado **debe** incluir comentarios estructurados JSDoc explicando detalladamente los parámetros, retornos y excepciones potenciales.

---

## 🚀 Proceso de Pull Requests (PR)

1. **Crea una nueva rama** con un nombre descriptivo (`git checkout -b feature/mi-nueva-funcionalidad` o `git checkout -b fix/correccion-de-bug`).
2. **Implementa tus cambios** siguiendo la arquitectura ultra modular.
3. **Actualiza la documentación** pertinente si estás agregando o modificando parámetros en la API pública (`README.md`, `STRUCTURE.md`, `TUTORIAL.md`).
4. **Haz Commit** con mensajes claros y concisos siguiendo la convención de Commits Convencionales (ej. `feat: añade operador BETWEEN al motor de consultas`).
5. **Envía el PR** a la rama principal (`main`) y describe detalladamente los cambios propuestos y el porqué de la implementación.

---

¡Gracias por ayudarnos a hacer de Stridb una herramienta cada vez más robusta y veloz para desarrolladores de todo el mundo! ⚡
