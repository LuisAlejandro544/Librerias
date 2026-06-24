# 📖 Tutorial Completo de Stridb

¡Bienvenido al tutorial oficial de **Stridb**! Stridb es una base de datos IndexedDB ultrarrápida, estricta, modular y reactiva diseñada para aplicaciones de alto rendimiento, optimizada para entornos modernos de JavaScript/TypeScript, navegadores y frameworks como React y Next.js.

En este tutorial aprenderás a instalar, configurar, modelar esquemas, insertar datos, realizar consultas complejas, utilizar encriptación y acoplar el estado reactivo con React.

---

## 🎯 1. Conceptos Fundamentales

Stridb se organiza en base a tres conceptos clave:
1. **Database (`StridbDatabase`)**: Administra el ciclo de vida de la conexión física a IndexedDB, eventos de migración automática de esquemas e inicialización de recursos.
2. **Schema (`StridbSchema`)**: Define la estructura de las tablas, restricciones (`primaryKey`, `unique`, `notNull`) y opciones avanzadas como encriptación automática (`encrypt`).
3. **Query (`StridbQuery`)**: Un motor fluente que permite construir consultas con filtros (`where`), ordenamiento (`orderBy`), paginación (`limit`, `offset`) y búsquedas de texto.

---

## 🚀 2. Instalación y Primeros Pasos

Puedes integrar Stridb en tu proyecto importándola directamente desde JSR o mediante nuestro instalador integrado de código fuente en caliente:

```bash
# Vía JSR
npx jsr add @alejandro/stridb
```

---

## 📝 3. Definiendo tu Primer Esquema

Vamos a diseñar una base de datos para una aplicación de tareas y notas de seguridad con encriptación nativa para la información confidencial.

```typescript
import { StridbDatabase, StridbSchema } from '@alejandro/stridb';

// 1. Inicializar la base de datos
const db = new StridbDatabase("mi_app_secure_db", 1);

// 2. Registrar el esquema de la tabla de Tareas
db.registerTable("tasks", new StridbSchema({
  id: { type: "string", primaryKey: true },
  title: { type: "string", notNull: true },
  description: { type: "string", encrypt: true }, // ¡Encriptado simétrico automático!
  completed: { type: "boolean", default: false },
  category: { type: "string", default: "general" },
  createdAt: { type: "number", notNull: true }
}));

// Conectarse a IndexedDB
await db.connect();
```

---

## 💾 4. Escritura y Lectura de Datos

### Insertar registros
Al insertar un registro, Stridb valida automáticamente los tipos definidos en tu `StridbSchema` y cifra cualquier campo marcado con `encrypt: true` antes de tocar el almacenamiento físico de IndexedDB.

```typescript
await db.query("tasks").insert({
  id: "task-001",
  title: "Comprar suministros",
  description: "Clave de acceso al almacén: SECURE-1234", // Este campo se guardará encriptado
  completed: false,
  category: "compras",
  createdAt: Date.now()
});
```

### Consultas básicas
Las lecturas descifran los campos automáticamente si la clave de cifrado maestra (`masterKey`) está configurada en la base de datos.

```typescript
// Configurar la clave maestra para poder leer datos encriptados
db.setMasterKey("mi_super_secreto_encriptador_32_chars!");

const todasLasTareas = await db.query("tasks").execute();
console.log(todasLasTareas[0].description); 
// Output original: "Clave de acceso al almacén: SECURE-1234"
```

---

## 🔍 5. Consultas Complejas con el Motor de Consultas

El motor de consultas de Stridb es declarativo y altamente legible:

```typescript
const tareasFiltradas = await db.query("tasks")
  .where("category", "==", "compras")
  .where("completed", "==", false)
  .orderBy("createdAt", "desc")
  .limit(10)
  .execute();
```

### Operadores disponibles en `where`:
* `==` (Igualdad)
* `!=` (Desigualdad)
* `>` / `>=` (Mayor/Mayor o igual)
* `<` / `<=` (Menor/Menor o igual)
* `contains` (Búsqueda parcial de texto dentro del string, insensible a mayúsculas/minúsculas)

---

## ⚡ 6. Vinculación Reactiva en React / Next.js

Stridb viene con soporte nativo de primera clase para React a través del hook `useStridbQuery`. Este hook se suscribe al bus de eventos de la base de datos para ofrecer actualizaciones reactivas en tiempo real ante inserciones, modificaciones o borrados de datos.

```tsx
'use client';

import React from 'react';
import { useStridbQuery } from '@alejandro/stridb';
import { db } from './miConfiguracionDB'; // Tu instancia inicializada de StridbDatabase

export default function ListaDeTareas() {
  // El hook ejecuta la consulta inicial y se auto-actualiza en caliente ante cambios de datos
  const { data: tasks, loading, error } = useStridbQuery(db, "tasks");

  if (loading) return <p>Cargando tareas...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id} className={task.completed ? 'line-through' : ''}>
          <strong>{task.title}</strong>
          <p>{task.description}</p>
        </li>
      ))}
    </ul>
  );
}
```

---

## 🔐 7. Seguridad y Bóveda de Claves de APIs (LLMKeyVault)

Stridb incluye una herramienta especializada para desarrolladores de IA: el `StridbLLMKeyVault`. Te permite almacenar API Keys sensibles de proveedores de LLMs (Google Gemini, OpenAI, Anthropic) de forma cifrada a nivel de cliente para aplicaciones offline-first.

```typescript
import { StridbLLMKeyVault } from '@alejandro/stridb';

// Guardar una API Key de Gemini cifrada con la clave del usuario
await StridbLLMKeyVault.saveKey(
  "Gemini", 
  "Clave de Producción",
  "AIzaSyD_EXAMPLE_KEY_12345", 
  "password_maestro_del_usuario"
);

// Recuperar y descifrar en caliente para realizar una llamada a un LLM
const keyValue = await StridbLLMKeyVault.retrieveKey("Gemini", "Clave de Producción", "password_maestro_del_usuario");
if (keyValue) {
  console.log("Clave recuperada y descifrada:", keyValue);
}
```

---

## 💾 8. Copias de Seguridad y Migración

Puedes importar y exportar estados completos de la base de datos fácilmente:

```typescript
import { StridbBackup } from '@alejandro/stridb';

// 1. Exportar todas las tablas a un solo JSON
const backupJSON = await StridbBackup.exportJSON(db);
console.log(backupJSON);

// 2. Restaurar un respaldo completo (limpia el estado actual e inserta los datos)
await StridbBackup.importJSON(db, backupJSON);
```

---

¡Felicidades! Ahora ya conoces los fundamentos de **Stridb** para crear aplicaciones estables, seguras, dinámicas y ultra modulares. Consúltanos en cualquier momento si necesitas expandir funciones.
