# AI Context: Stridb ⚡

Este archivo proporciona contexto técnico inmediato, especificaciones e instrucciones de mantenimiento para agentes de Inteligencia Artificial (IA) y desarrolladores de código automatizado que interactúen con el repositorio de **Stridb**.

---

## 🧭 Misión y Filosofía
Stridb existe para proporcionar una interfaz de base de datos **estricta y estructurada** para IndexedDB en entornos web. La sopa de claves-valores es inaceptable para datos críticos de aplicaciones offline-first. Stridb impone rigidez estructural similar a un motor SQL, conservando la ligereza y fluidez esperada en TypeScript, junto con capacidades de resiliencia avanzada y criptografía cliente de grado militar.

---

## 🛡️ Reglas Críticas para Agentes de IA

### 1. Respetar el "Desarrollo Modular Ultra"
* **PROHIBIDO**: Escribir funciones monolíticas o fusionar submódulos en un solo archivo.
* **REGLA**: Cada funcionalidad (consultas, esquemas, copias de seguridad, transacciones, criptografía, persistencia de almacenamiento, monitores de inactividad, bóveda de claves) debe permanecer aislada en su archivo correspondiente (`Query.ts`, `Schema.ts`, `Backup.ts`, `Transaction.ts`, `Database.ts`, `Debug.ts`, `Crypto.ts`, `StoragePersistence.ts`, `InactivityManager.ts`, `KeyVault.ts`). Las modificaciones deben ser quirúrgicas y enfocadas exclusivamente en la parte responsable.

### 2. Preservar la Telemetría de Depuración (`StridbDebug`)
* Cualquier operación CRUD, cambio de persistencia, cifrado de claves, o de consulta de larga duración debe registrarse inmediatamente utilizando los métodos estilizados de `StridbDebug`.
* Nunca elimines o ignores llamadas de depuración durante refactorizaciones.

### 3. Evitar Dependencias de Node en el Cliente
* Stridb es una biblioteca diseñada exclusivamente para ejecutarse en el navegador del cliente (dentro del entorno de ejecución de IndexedDB).
* No introduzcas módulos integrados de Node.js (como `fs`, `path`, o `crypto` de Node) en el código fuente de Stridb. Usa `Web Crypto API` nativa del navegador.

---

## 📂 Glosario de Archivos e Interfaces de Referencia

Para agregar características o depurar problemas, sigue esta guía de mapeo:

* **¿Problemas de integridad o tipos incorrectos?** ──► Modifica `Schema.ts` y asegúrate de actualizar la función `validateRecord()`.
* **¿Optimizaciones en filtros, ordenación o limits?** ──► Ve a `Query.ts` y optimiza la lógica asíncrona alrededor del cursor IndexedDB.
* **¿Errores al guardar o revertir transacciones?** ──► Corrige `Transaction.ts`.
* **¿Problemas con el guardado en IndexedDB o eventos de actualización?** ──► Revisa `Database.ts`.
* **¿Exportación/Importación de respaldos corrupta?** ──► Examina `Backup.ts`.
* **¿Algoritmos de cifrado simétrico AES-GCM defectuosos?** ──► Corrige la criptografía en `Crypto.ts`.
* **¿Problemas para bloquear que el navegador borre almacenamiento local?** ──► Ajusta `StoragePersistence.ts`.
* **¿Autodestrucción por tiempo de inactividad no reinicia o falla?** ──► Ajusta la lógica del temporizador en `InactivityManager.ts`.
* **¿Bóveda cifrada de claves de API de LLMs falla al guardar o descifrar?** ──► Corrige `KeyVault.ts`.
* **¿Vincular estados reactivos en React/Next.js de forma directa?** ──► Utiliza el Hook expuesto en `Hooks.ts` (`useStridbQuery`).
* **¿Mecanismo de Auto-Migración de Base de Datos ante cambios de esquema?** ──► Implementado transparentemente en `Database.ts` calculando la firma estructural con `getSchemaSignature()`.
* **¿Empaquetado e instalación interactiva de Stridb para terminales?** ──► Generado estáticamente por `/scripts/generate-stridb-installer.js` y expuesto en la API `/app/api/download/stridb-install.sh/route.ts`.

