# Plan de Ruta (Roadmap): Stridb ⚡

Este documento describe la visión a mediano y largo plazo para **Stridb**, detallando las características planificadas e integraciones que consolidarán su potencial como el envoltorio estructurado de IndexedDB definitivo para la web moderna.

---

## 🗺️ Fases de Desarrollo

### 🟢 Fase 1: Fundaciones Estrictas (Completado)
* [x] Diseño de arquitectura bajo el modelo de **Desarrollo Modular Ultra**.
* [x] Definición estricta de esquemas mediante encadenamiento fluidos (`TableSchemaBuilder`).
* [x] Sistema de validación de tipos e integridad de constraints (`notNull`, `primaryKey`, `unique`).
* [x] Motor de consultas fluido (`StridbQuery`) con filtrado por predicados, ordenamiento de alto rendimiento y limitadores.
* [x] Módulo de telemetría y consola visual estilizada (`StridbDebug`).
* [x] Transacciones seguras con soporte de cancelación inmediata (*Rollback*).
* [x] Funcionalidades completas de respaldo e importación estructurada JSON (`StridbBackup`).

### 🟡 Fase 2: Resiliencia, Criptografía y Seguridad (Completado)
* [x] **Encriptación por Columna AES-GCM (`StridbCrypto`)**: Cifrado transparente nativo de columnas marcadas como encriptadas.
* [x] **Bóveda Segura de Claves de API de LLMs (`StridbLLMKeyVault`)**: Panel y sistema aislado de almacenamiento y recuperación de tokens de Inteligencia Artificial de forma cifrada en disco.
* [x] **Gestor de Inactividad y Auto-Destrucción (`StridbInactivityManager`)**: Temporizadores que purgan la base de datos si el usuario deja de interactuar, protegiendo contra accesos locales no autorizados.
* [x] **Persistencia de Almacenamiento (`StridbStoragePersistence`)**: Bloqueo interactivo frente a recolección de basura del sistema de disco del navegador web.

### 🟠 Fase 3: Ecosistema y Reactividad (Próximamente)
* [ ] **Hooks de React / Next.js de Primera Clase**: Crear `useStridbQuery` para enlazar estados locales reactivos con IndexedDB automáticamente a través de suscripciones pub/sub.
* [ ] **Migración Automática de Esquemas**: Implementar un comparador inteligente de esquemas que analice cambios en las columnas declaradas e inyecte alteraciones de datos sin requerir que el usuario incremente manualmente la versión de base de datos.
* [ ] **Búsqueda Indexada Avanzada (B-Tree)**: Utilizar los índices nativos de IndexedDB de forma optimizada en el motor de consultas para evitar escaneos de cursor completos en columnas indexadas de alta densidad.

### 🔴 Fase 4: Integraciones Avanzadas e Inteligencia (Visión Futura)
* [ ] **Sincronización Bidireccional Diferencial (Stridb Sync)**: Protocolo offline-first para sincronizar tablas de Stridb con PostgreSQL o Firestore, utilizando marcas de tiempo de modificación y políticas avanzadas de resolución de conflictos.
* [ ] **Integración con IA (Gemini SDK/Grounding)**: Permitir que un agente inteligente o asistente local (vía Gemini Nano o Gemini API Serverless) lea el esquema y los datos consolidados en Stridb para responder preguntas analíticas directas ("¿Cuántos productos tienen precio menor a $50?").
