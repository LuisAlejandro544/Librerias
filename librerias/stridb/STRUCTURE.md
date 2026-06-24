# Estructura del Proyecto: Stridb ⚡

Este documento describe la arquitectura modular de **Stridb**. Siguiendo el enfoque de **Desarrollo Modular Ultra**, la biblioteca está dividida en submódulos específicos para maximizar el desacoplamiento, facilitar las pruebas unitarias y promover un mantenimiento eficiente sin el riesgo de corromper un archivo monolítico.

---

## 📂 Directorio de la Librería

```text
/librerias/stridb/
├── Backup.ts             # Utilidades de respaldo, exportación e importación en formato JSON.
├── Crypto.ts             # Motor criptográfico simétrico AES-GCM usando la Web Crypto API.
├── Database.ts           # Gestor central de conexión a IndexedDB, eventos de migración y CRUD.
├── Debug.ts              # Subsistema de registro estilizado para consolas y terminales del navegador.
├── Hooks.ts              # Hook de React/Next.js useStridbQuery para vinculación reactiva en tiempo real.
├── InactivityManager.ts  # Temporizador inteligente de actividad para autodestrucción por inactividad.
├── KeyVault.ts           # Bóveda cifrada segura para almacenar API Keys de proveedores de LLMs.
├── LICENSE               # Copia fiel de la Licencia de Software Apache 2.0.
├── Query.ts              # Motor de consultas fluido (Chaining API) con ordenación y paginación.
├── README.md             # Documentación de inicio rápido, ejemplos y características clave.
├── ROADMAP.md            # Plan de ruta, ideas futuras de integración y características planeadas.
├── STRUCTURE.md          # Este documento: desglose técnico de módulos y flujos.
├── Schema.ts             # Definiciones de restricciones, constructores de tablas y validador de tipos.
├── StoragePersistence.ts # Interfaz para solicitar persistencia física al navegador y evitar purgues.
├── Transaction.ts        # Envoltorio de transacciones IndexedDB con rollback automático ante errores.
└── index.ts              # Punto de entrada unificado que expone los componentes públicos de Stridb.
```

---

## 🔄 Flujo de Datos y Conexión

El siguiente flujo resume cómo interactúan los submódulos de **Stridb** cuando un desarrollador define una tabla, aplica cifrado de columna, gestiona inactividad u opera con consultas:

```text
[Definición de Esquema]
         │
         ▼
  [Database.ts]  ──►  [Schema.ts] (Valida tipos e integridad de constraints)
         │
         ├───► [Crea ObjectStore en IndexedDB en evento onupgradeneeded]
         │
         ├───► [Crypto.ts] (Cifra transparentemente columnas .encrypted() con AES-GCM)
         │
         ▼
   [Query.ts]  ◄───►  [Debug.ts] (Registra planes de consulta, velocidad en ms)
         │
         ▼
[IndexedDB Browser Store]  ◄───► [StoragePersistence.ts] (Asegura persistencia física)
         │
         ▼
[InactivityManager.ts] (Monitorea cambios de base para resetear cronómetro o destruir DB)
```

### Detalle de Responsabilidades por Archivo

### 1. `Database.ts`
Es el punto de control central. Realiza la apertura de la base de datos IndexedDB asegurando que las migraciones (`onupgradeneeded`) creen correctamente los almacenes de objetos (`ObjectStores`) e índices secundarios requeridos por el esquema de manera automática. Expone métodos abreviados como `.insert()`, `.update()`, `.delete()`, y `.truncate()`. Integra llamadas automáticas a `Crypto.ts` para encriptar/desencriptar columnas declaradas como seguras.

### 2. `Schema.ts`
Implementa el validador estricto que analiza cada registro de datos antes de escribirlo en la base de datos. Detecta si una columna declarada como `notNull` está ausente, si un campo viola una regla de tipo (como ingresar una cadena de texto en un campo `INTEGER`), si se requiere aplicar un valor por defecto o si la columna está clasificada para encriptación.

### 3. `Query.ts`
Controla el ciclo de vida de las búsquedas en la base de datos. Usa cursores asíncronos nativos de IndexedDB para filtrar registros mediante predicados de TypeScript provistos por el usuario, ordena los resultados de forma dinámica y trunca el arreglo final según el límite definido. Informa inmediatamente al módulo `Debug.ts` para reportar el rendimiento.

### 4. `Crypto.ts`
Proporciona utilidades criptográficas estables y ultrarrápidas basadas en **AES-GCM (criptografía web nativa del cliente)**. Genera vectores de inicialización criptográficamente aleatorios (IV), asiste al cifrado y descifrado de strings, y asegura que la clave se derive de forma segura usando PBKDF2 si es necesario.

### 5. `StoragePersistence.ts`
Mapea el acceso a la API del Storage Manager de HTML5 (`navigator.storage`). Permite verificar si la persistencia de datos ya fue aprobada por el navegador y solicitar el bloqueo que impide la recolección automática de basura (evitando que el navegador elimine IndexedDB de forma autónoma al llenarse el disco).

### 6. `InactivityManager.ts`
Implementa temporizadores dinámicos en segundo plano. Se suscribe a operaciones y queries en la base de datos de Stridb para resetear continuamente un temporizador de inactividad. Si el usuario deja de interactuar con el sistema, se dispara una callback destructiva que invoca `.destroy()` sobre la base de datos asegurando la protección total contra accesos no autorizados.

### 7. `KeyVault.ts`
Gestor seguro independiente que aprovecha `StridbCrypto` para crear una mini-bóveda cifrada de llaves de API de proveedores de LLMs populares (como OpenAI, Gemini, Anthropic) dentro de un sub-almacén aislado del dispositivo. Ideal para guardar secretos de inteligencia de forma confiable.

### 8. `Debug.ts`
Proporciona un puente de visibilidad. En lugar de ensuciar el código con `console.log` dispersos, centraliza toda la telemetría del sistema utilizando grupos de consola estilizados con colores CSS personalizados. Esto permite ver claramente qué transacciones se ejecutaron, qué queries tardaron más de lo previsto, y qué fallas de restricción de integridad ocurrieron.

### 9. `Transaction.ts`
Envuelve operaciones complejas que requieren atomicidad de datos. Por ejemplo, al transferir saldos o actualizar inventario en múltiples tablas al mismo tiempo. Si cualquiera de las promesas internas del desarrollador es rechazada, se invoca `tx.abort()` para deshacer todos los cambios en IndexedDB automáticamente.

### 10. `Backup.ts`
Proporciona utilidades para migrar datos de un cliente a otro. El método `exportJSON()` genera un mapa JSON serializable conteniendo todos los registros de todos los almacenes de objetos. Por otro lado, `importJSON(data)` realiza una restauración limpia borrando el estado actual antes de inyectar el respaldo.

### 11. `Hooks.ts`
Implementa el hook de React de primera clase `useStridbQuery`. Este hook se suscribe de manera inteligente a los eventos de modificación de la base de datos Stridb. Cuando cualquier inserción, actualización, eliminación o transacción modifica la tabla seleccionada, el hook actualiza automáticamente el estado local y re-renderiza la UI en caliente sin necesidad de llamadas manuales de recarga.

