# 🧩 Estructura de Módulos - Kotlite DB

Kotlite DB está construida bajo los principios de **Desarrollo Modular Ultra**, asegurando que cada archivo tenga una única responsabilidad bien definida. Esto previene acoplamientos rígidos y facilita enormemente la depuración y extensión de la base de datos sin alterar otras capas de abstracción.

A continuación, se detalla el rol exacto de cada archivo que compone esta carpeta:

---

## 🗺️ Mapa de Componentes y Responsabilidades

```
/kotlite
├── Storage.ts            # [Capa de Persistencia] Soporta LocalStorage con namespaces y IndexedDB híbrido con Write-Through Cache
├── Schema.ts             # [Capa de Definición] DSL y constructores de columnas fluent de estilo Kotlin
├── Query.ts              # [Capa de Consulta] Motor de ordenamiento, filtros perezosos y logging automático de duración
├── Table.ts              # [Capa de Operaciones] Transacciones CRUD, validaciones físicas e inserciones seguras
├── Database.ts           # [Orquestador Central] Fachada de acceso reactiva con inicialización asíncrona para motores IndexedDB
├── Sync.ts               # [Integración y Backups] Sincronización inteligente de backups JSON e integraciones remotas URL
├── Crypto.ts             # [Seguridad] Cifrado simétrico síncrono ultra-rápido para LocalStorage y caché
├── Relations.ts          # [Integridad] Restricciones de Claves Foráneas con soporte de acciones (CASCADE, RESTRICT, SET_NULL)
├── Debug.ts              # [Diagnóstico] Suite de diagnóstico interactivo en consola con logs detallados e inspección visual
├── Migration.ts          # [Migración] Adaptadores fieles y constructores DSL para migrar bases de datos Android SQLite/Room
├── index.ts              # [Barril de Exportación] Entrada e importaciones seguras para TypeScript
├── README.md             # [Manual General] Guía de inicio rápido y hook interactivo para React
├── STRUCTURE.md          # [Este Archivo] Mapa de arquitectura detallado con responsabilidades modulares
├── SETUP.md              # [Guía de Configuración] Pasos interactivos para instalar en Next.js
├── TUTORIAL.md           # [Manual Avanzado] Tutorial interactivo con casos de uso de IndexedDB, depuración y Room
├── CONTRIBUTING.md       # [Contribución] Normas de estilo y lineamientos para proponer mejoras en la librería
├── MODIFICATION_GUIDE.md # [Modificaciones] Guía de adaptabilidad libre conforme a los límites de la licencia Apache 2.0
└── LICENSE               # [Licencia Apache 2.0] Términos de uso y distribución de código abierto
```

---

## 🔍 Descripción Detallada de Módulos

### 1. `Storage.ts`
* **Misión:** Aislar el acceso al navegador para garantizar compatibilidad con Server-Side Rendering (SSR) e implementar bases de datos de alto volumen.
* **Funcionamiento:** 
  * Expone la interfaz `StorageEngine`.
  * Implementa `LocalStorageEngine` con aislamiento estricto mediante prefijos de namespace (`kotlite_secure_v1:`).
  * Implementa `InMemoryStorageEngine` para evitar caídas de compilación de servidor en Next.js.
  * Implementa `IndexedDBStorageEngine` que precarga todo su estado a un mapa caché de forma asíncrona al iniciar (`init()`), permitiendo búsquedas y lecturas 100% síncronas en caliente (`getItem`), propagando asíncronamente las escrituras físicas mediante transacciones Write-Through.

### 2. `Schema.ts`
* **Misión:** Proveer el DSL declarativo para definir tipos de datos y restricciones como si fuera Kotlin Exposed.
* **Funcionamiento:**
  * Define los tipos nativos soportados: `INTEGER`, `TEXT`, `REAL`, `BOOLEAN`, `DATETIME`.
  * La clase `ColumnBuilder` habilita el encadenamiento fluido (`.primaryKey()`, `.unique()`, `.notNull()`, `.default(...)`).
  * La clase `TableSchemaBuilder` expone constructores amigables como `t.integer("id")` o `t.text("name")`.

### 3. `Query.ts`
* **Misión:** Manipular y transformar conjuntos de registros filtrando de forma eficiente con registro automático de duración.
* **Funcionamiento:**
  * Mantiene inmutabilidad realizando copias locales del conjunto de datos antes de ordenar o recortar.
  * Ofrece métodos encadenables de filtrado como `.where(row => boolean)`, ordenamiento `.orderBy(col, dir)`, paginación `.offset(n)` y límites `.limit(n)`.
  * Retorna datos evaluados bajo demanda con `.execute()`, `.firstOrNull()` o `.count()`, registrando automáticamente el tiempo de respuesta (en ms) en la consola de depuración.

### 4. `Table.ts`
* **Misión:** Validar esquemas y garantizar la integridad referencial y de tipos de cada inserción, edición y borrado.
* **Funcionamiento:**
  * Almacena en memoria el estado en vivo de las filas de una tabla.
  * Valida que no existan duplicidades de llaves primarias o de columnas marcadas como `.unique()`.
  * Ejecuta conversiones al vuelo y comprueba que los tipos insertados coincidan estrictamente con la definición del esquema, interactuando con `KotliteDebugger` para alertar infracciones de restricciones de datos en caliente.

### 5. `Database.ts`
* **Misión:** Actuar como punto de entrada de la librería (`createKotliteDatabase`) y manejar la reactividad en tiempo real.
* **Funcionamiento:**
  * Carga y serializa automáticamente los datos de cada tabla hacia el motor de almacenamiento persistente (`StorageEngine`) en cada mutación.
  * Implementa un patrón Publicador/Suscriptor (`subscribe`) para notificar en milisegundos a todos los componentes web reactivos cuando cualquier dato cambie, permitiendo la actualización automática de la interfaz de usuario.
  * Permite inicializaciones asíncronas de base de datos (`await db.init()`) para garantizar que la caché se pueble antes de servir registros.

### 6. `Sync.ts`
* **Misión:** Ofrecer interoperabilidad total de datos mediante serialización y de-serialización JSON resiliente.
* **Funcionamiento:**
  * Define la interfaz `KotliteBackup` que almacena de manera unificada el nombre de la base de datos, marca temporal y registros de todas las tablas registradas.
  * `KotliteSyncManager` expone funciones para exportar el estado completo de la base de datos (con `.exportJson()` u `.exportObject()`).
  * Administra importaciones y sincronizaciones seguras con `.importJson()`, soportando opciones avanzadas como transaccionalidad y mezcla inteligente de datos (`merge` / Upsert) basada en claves primarias.
  * Integra sincronización fluida con endpoints REST o bases de datos en la nube mediante `.syncFromRemoteUrl()`.

### 7. `Crypto.ts`
* **Misión:** Garantizar confidencialidad y resiliencia en dispositivos compartidos cifrando el almacenamiento local de forma síncrona.
* **Funcionamiento:**
  * Implementa un algoritmo simétrico síncrono por bloques altamente optimizado, lo cual asegura que las lecturas e inserciones sigan ocurriendo de manera inmediata sin requerir promesas asíncronas.
  * Si se proporciona una contraseña (clave de cifrado) al instanciar la base de datos, cifra los registros serializados de cada tabla antes de guardarlos en el LocalStorage y los descifra al restaurar la base de datos. Si no se provee, funciona de manera transparente con texto plano para compatibilidad total.

### 8. `Relations.ts`
* **Misión:** Forzar y gobernar la integridad referencial de claves foráneas entre diferentes tablas.
* **Funcionamiento:**
  * `KotliteRelationsEngine` intercepta las inserciones y actualizaciones en caliente para validar que los valores relacionados realmente existan en las tablas padres, impidiendo inconsistencias de datos.
  * Gestiona las tres principales acciones relacionales al eliminar un registro padre:
    * `CASCADE`: Elimina automáticamente todos los registros dependientes en cascada.
    * `RESTRICT`: Bloquea e impide la eliminación del registro padre si aún tiene elementos hijos relacionados.
    * `SET_NULL`: Establece el campo relacional del hijo como `null` (si es una columna nullable), conservando el registro hijo desvinculado de forma segura.

### 9. `Debug.ts`
* **Misión:** Suite de diagnóstico avanzado para capturar cuellos de botella de rendimiento, incoherencias de tipos de datos o duplicaciones de llaves.
* **Funcionamiento:**
  * Muestra mensajes decorados y legibles inspirados en la CLI de Kotlin en la consola de depuración del navegador.
  * Diagnostica transacciones en tiempo real, marca consultas lentas que tarden más de 50ms, y expone `inspectTable(tableName, schema, rows)` para imprimir volcados en consola visuales con `console.table`.

### 10. `Migration.ts`
* **Misión:** Proveer puentes de transferencia de bases de datos móviles (Room de Android o SQLite plano) hacia la web.
* **Funcionamiento:**
  * `KotliteMigrationBridge` traduce automáticamente tipos de campos de Kotlin nativos (`Int`, `String`, `Boolean`, `Date`) hacia sus contrapartes en Kotlite DB (`INTEGER`, `TEXT`, `BOOLEAN`, `DATETIME`).
  * Genera automáticamente código de definición de tablas mediante DSL interactivo partiendo de arrays de metadatos de entidades Kotlin.
  * Importa volcados JSON de Room saneando tipos de datos incompatibles (como booleanos nativos guardados como `0`/`1` o timestamps de tipo `Long`).


