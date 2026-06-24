# 🛠️ Modificación de la Librería y Limitaciones Técnicas

Este documento contiene la guía técnica para desarrolladores que deseen modificar, extender, personalizar o auditar el funcionamiento interno de **Stridb**. También se detallan las limitaciones estructurales inherentes al uso de IndexedDB y Web Crypto API en navegadores web modernos.

---

## 🏗️ Cómo Modificar la Librería sin Romperla

Stridb cuenta con un diseño **Ultra Modular** en el cual cada archivo tiene una única responsabilidad. Si deseas realizar cambios, sigue estas directrices para evitar regresiones o colapsos arquitectónicos:

### 1. Modificar Estructura de Tablas o Tipos de Datos (`Schema.ts`)
* **Ubicación:** `librerias/stridb/Schema.ts`.
* **Cómo actuar:** El validador de esquemas se ejecuta al insertar o actualizar registros. Si añades un nuevo tipo de dato soportado (por ejemplo, `date` o `array`), debes actualizar el tipo `StridbDataType` y la lógica interna de validación en `StridbSchema.validate()`.

### 2. Extender Métodos de Consulta (`Query.ts`)
* **Ubicación:** `librerias/stridb/Query.ts`.
* **Cómo actuar:** Las consultas se procesan en memoria filtrando sobre IndexedDB. Si deseas agregar nuevos operadores lógicos como `between`, `in` o `not_in`:
  1. Agrega el nuevo operador al tipo de unión `StridbQueryOperator`.
  2. Implementa el evaluador correspondiente en la función privada de filtrado dentro de `StridbQuery.execute()`.

### 3. Ajustar el Motor de Encriptación (`Crypto.ts`)
* **Ubicación:** `librerias/stridb/Crypto.ts`.
* **Cómo actuar:** Stridb utiliza encriptación simétrica **AES-GCM de 256 bits** con derivación de clave mediante PBKDF2.
  * Si requieres cambiar el algoritmo, hazlo dentro de `StridbCrypto`.
  * **Regla de oro:** No expongas la clave de cifrado original en logs ni en variables globales. Asegúrate de procesar siempre búferes binarios de forma asíncrona para maximizar la velocidad.

### 4. Modificar Eventos de Conexión o Auto-Migración (`Database.ts`)
* **Ubicación:** `librerias/stridb/Database.ts`.
* **Cómo actuar:** Stridb detecta cambios estructurales automáticamente comparando la firma hash JSON en `localStorage` con la firma activa obtenida por `getSchemaSignature()`.
  * Si añades nuevas propiedades de configuración a las columnas (por ejemplo, `cascade` u `onDelete`), debes registrarlas en la función `getSchemaSignature()` de `Database.ts` para que el sistema de auto-migración detecte correctamente la actualización y eleve la versión física de IndexedDB de forma fluida.

---

## ⚠️ Limitaciones Técnicas de Stridb

Al desarrollar con Stridb, ten muy en cuenta las siguientes limitaciones y restricciones técnicas impuestas por el entorno de ejecución (navegador web / sandboxing):

### 1. Cuotas de Almacenamiento del Navegador (Browser Quota Limits)
* **Limitación:** IndexedDB está condicionado por las políticas de espacio en disco del navegador.
* **Detalle:** La mayoría de navegadores modernos permiten almacenar grandes volúmenes de datos (hasta el 50% del espacio libre en disco en algunos casos), pero el sistema operativo o el navegador pueden purgar silenciosamente bases de datos de aplicaciones si el dispositivo se queda sin espacio de disco persistente.
* **Solución:** Utiliza la utilidad `StridbStoragePersistence` para solicitar almacenamiento persistente explícito al navegador (`navigator.storage.persist()`), lo cual reduce drásticamente las posibilidades de que el navegador purgue tu base de datos en situaciones de almacenamiento crítico.

### 2. Contextos Seguros Requeridos (HTTPS / localhost)
* **Limitación:** El motor criptográfico integrado (`Crypto.ts`) depende de la API nativa `window.crypto.subtle`.
* **Detalle:** Los navegadores restringen el acceso a `crypto.subtle` únicamente a contextos seguros (sitios servidos mediante HTTPS o en entornos locales ejecutándose en `localhost`).
* **Impacto:** Si despliegas tu aplicación en servidores HTTP no seguros, el cifrado de campos fallará lanzando excepciones críticas en tiempo de ejecución.

### 3. Sincronización de Múltiples Pestañas (Multi-Tab Concurrency)
* **Limitación:** La comunicación y los eventos reactivos del hook `useStridbQuery` se limitan al hilo y contexto de la pestaña activa de manera predeterminada.
* **Detalle:** Si un usuario tiene la misma aplicación web abierta en dos pestañas diferentes, las mutaciones a la base de datos realizadas en la Pestaña A no se propagarán de forma instantánea mediante reactividad en caliente a la Pestaña B hasta que esta última recargue la página o interactúe con IndexedDB.
* **Solución:** Para sincronizar mutaciones multitab, puedes implementar un canal de transmisión global nativo mediante `BroadcastChannel` en futuras iteraciones de tu capa de eventos.

### 4. Limitaciones del Buscador de Texto Completo
* **Limitación:** El operador `contains` realiza una búsqueda parcial secuencial en memoria.
* **Detalle:** Al no ser un motor de búsqueda indexada invertida por palabras clave (como Lucene), las búsquedas extensas mediante `contains` sobre millones de registros encriptados requerirán primero descargar y descifrar secuencialmente los datos en memoria antes de evaluar el texto.
* **Impacto:** Altamente eficiente para miles de registros habituales en aplicaciones cliente offline, pero puede mostrar latencias si la base de datos almacena cientos de miles de entradas complejas.
