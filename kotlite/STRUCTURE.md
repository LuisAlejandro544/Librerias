# 🧩 Estructura de Módulos - Kotlite DB

Kotlite DB está construida bajo los principios de **Desarrollo Modular Ultra**, asegurando que cada archivo tenga una única responsabilidad bien definida. Esto previene acoplamientos rígidos y facilita enormemente la depuración y extensión de la base de datos sin alterar otras capas de abstracción.

A continuación, se detalla el rol exacto de cada archivo que compone esta carpeta:

---

## 🗺️ Mapa de Componentes y Responsabilidades

```
/kotlite
├── Storage.ts     # [Capa de Persistencia] Abstracción segura para SSR
├── Schema.ts      # [Capa de Definición] DSL y constructores de columnas fluent
├── Query.ts       # [Capa de Consulta] Motor de ordenamiento y filtrado perezoso
├── Table.ts       # [Capa de Operaciones] Transacciones CRUD e integridad física
├── Database.ts    # [Orquestador Central] Fachada de acceso reactivo y publicador
├── Sync.ts        # [Integración y Backups] Sincronización inteligente y exportador JSON
├── Crypto.ts      # [Seguridad] Cifrado simétrico síncrono ultra-rápido para LocalStorage
├── Relations.ts   # [Integridad] Restricciones de Claves Foráneas (CASCADE, RESTRICT, SET_NULL)
├── index.ts       # [Barril de Exportación] Entrada segura para TypeScript
├── README.md      # [Manual General] Guía de inicio rápido y hook para React
├── STRUCTURE.md   # [Este Archivo] Mapa de arquitectura detallado
├── SETUP.md       # [Guía de Configuración] Instrucciones paso a paso para Next.js / React
└── LICENSE        # [Licencia Apache 2.0] Términos de uso y distribución de código abierto
```

---

## 🔍 Descripción Detallada de Módulos

### 1. `Storage.ts`
* **Misión:** Aislar el acceso al navegador para garantizar compatibilidad con Server-Side Rendering (SSR).
* **Funcionamiento:** 
  * Expone la interfaz `StorageEngine`.
  * Implementa `LocalStorageEngine` (para uso persistente en navegador) y `InMemoryStorageEngine` (un mapa temporal `Map` para uso en Node.js de servidor).
  * La función `getOptimalStorage()` selecciona dinámicamente el motor correcto evitando que Next.js o Remix fallen en el proceso de pre-renderizado del servidor.

### 2. `Schema.ts`
* **Misión:** Proveer el DSL declarativo para definir tipos de datos y restricciones como si fuera Kotlin Exposed.
* **Funcionamiento:**
  * Define los tipos nativos soportados: `INTEGER`, `TEXT`, `REAL`, `BOOLEAN`, `DATETIME`.
  * La clase `ColumnBuilder` habilita el encadenamiento fluido (`.primaryKey()`, `.unique()`, `.notNull()`, `.default(...)`).
  * La clase `TableSchemaBuilder` expone constructores amigables como `t.integer("id")` o `t.text("name")`.

### 3. `Query.ts`
* **Misión:** Manipular y transformar conjuntos de registros filtrando de forma eficiente.
* **Funcionamiento:**
  * Mantiene inmutabilidad realizando copias locales del conjunto de datos antes de ordenar o recortar.
  * Ofrece métodos encadenables de filtrado como `.where(row => boolean)`, ordenamiento `.orderBy(col, dir)`, paginación `.offset(n)` y límites `.limit(n)`.
  * Retorna datos evaluados bajo demanda con `.execute()`, o atajos como `.firstOrNull()` y `.count()`.

### 4. `Table.ts`
* **Misión:** Validar esquemas y garantizar la integridad referencial y de tipos de cada inserción, edición y borrado.
* **Funcionamiento:**
  * Almacena en memoria el estado en vivo de las filas de una tabla.
  * Valida que no existan duplicidades de llaves primarias o de columnas marcadas como `.unique()`.
  * Ejecuta conversiones al vuelo y comprueba que los tipos insertados coincidan estrictamente con la definición del esquema (`validateType`).

### 5. `Database.ts`
* **Misión:** Actuar como punto de entrada de la librería (`createKotliteDatabase`) y manejar la reactividad en tiempo real.
* **Funcionamiento:**
  * Carga y serializa automáticamente los datos de cada tabla hacia el motor de almacenamiento persistente (`StorageEngine`) en cada mutación.
  * Implementa un patrón Publicador/Suscriptor (`subscribe`) para notificar en milisegundos a todos los componentes web reactivos cuando cualquier dato cambie, permitiendo la actualización automática de la interfaz de usuario.

### 6. `Sync.ts`
* **Misión:** Ofrecer interoperabilidad total de datos mediante serialización y de-serialización JSON resiliente.
* **Funcionamiento:**
  * Define la interfaz `KotliteBackup` que almacena de manera unificada el nombre de la base de datos, marca temporal y registros de todas las tablas registradas.
  * `KotliteSyncManager` expone funciones para exportar el estado completo de la base de datos (con `.exportJson()` u `.exportObject()`).
  * Administra importaciones y sincronizaciones seguras con `.importJson()`, soportando opciones avanzadas como transaccionalidad (rollback total automático de tablas si falla alguna restricción física o de tipo de datos al insertar un registro) y mezcla inteligente de datos (`merge` / Upsert) basada en claves primarias.
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

