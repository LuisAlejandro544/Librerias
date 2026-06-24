# 🚀 Guía de Configuración - Kotlite DB

Sigue estos pasos detallados para integrar, inicializar y utilizar Kotlite DB de forma óptima en tus proyectos de **Next.js**, **React** o **Vite**.

---

## 📋 Pasos para la Configuración Completa

### Paso 1: Importar la librería a tu proyecto
Copia la carpeta entera `kotlite` en la raíz o dentro del directorio de código fuente de tu aplicación (por ejemplo, en `src/kotlite` o simplemente en `/kotlite`).

---

### Paso 2: Crear el archivo de configuración de la Base de Datos
Crea un archivo llamado `db.ts` (o `db_config.ts`) en tu directorio favorito de lógica para declarar e instanciar tu base de datos utilizando el DSL declarativo inspirado en Kotlin.

```typescript
// src/lib/db.ts
import { createKotliteDatabase } from '../kotlite';

export const db = createKotliteDatabase("app_local_database", (builder) => {
  
  // Tabla de Usuarios
  builder.table("users", (t) => {
    t.integer("id").primaryKey(); // ID autoincremental automático
    t.text("username").unique().notNull();
    t.text("email").unique().notNull();
    t.text("role").default("user");
    t.boolean("active").default(true);
    t.datetime("createdAt").default(() => new Date().toISOString());
  });

  // Tabla de Notas de ejemplo
  builder.table("notes", (t) => {
    t.integer("id").primaryKey();
    t.integer("userId").notNull();
    t.text("title").notNull();
    t.text("content").default("");
    t.boolean("starred").default(false);
  });

});
```

---

### Paso 3: Crear el Hook Reactivo para React / Next.js
Para que tus componentes de React se actualicen automáticamente en milisegundos cuando ocurra un cambio (`insert`, `update`, `delete`) en las tablas desde cualquier parte del código, crea un hook reactivo.

Crea un archivo llamado `useKotliteTable.ts`:

```typescript
// src/hooks/useKotliteTable.ts
'use client'; // Requerido en Next.js App Router

import { useState, useEffect } from 'react';
import { db } from '../lib/db'; // Importa tu base de datos configurada
import { RowData } from '../kotlite';

/**
 * Hook reactivo de alto rendimiento para interactuar con tablas de Kotlite DB.
 * Recibe el nombre de la tabla y expone métodos CRUD reactivos en tiempo real.
 */
export function useKotliteTable(tableName: string) {
  const table = db.table(tableName);
  
  // Inicializamos el estado local de React con los datos actuales de la tabla
  const [data, setData] = useState<RowData[]>(() => table.all());

  useEffect(() => {
    // 1. Nos suscribimos al bus de eventos reactivos de la base de datos
    const unsubscribe = db.subscribe((updatedTableName, updatedRows) => {
      // Si la tabla modificada coincide con la de este hook, actualizamos el estado
      if (updatedTableName === tableName) {
        setData(updatedRows);
      }
    });

    // 2. Cargamos el estado inicial por seguridad y sincronización
    setData(table.all());

    // 3. Limpieza de suscripciones para evitar fugas de memoria
    return () => {
      unsubscribe();
    };
  }, [tableName]);

  return {
    /** Listado de registros actualizados en tiempo real */
    data,
    
    /** Inserta un nuevo registro con auto-id y valores por defecto */
    insert: (entity: RowData) => table.insert(entity),
    
    /** Actualiza campos selectivos de los registros que cumplan el predicado */
    update: (pred: (r: RowData) => boolean, fields: Partial<RowData>) => table.update(pred, fields),
    
    /** Elimina registros que coincidan con la lambda de búsqueda */
    delete: (pred: (r: RowData) => boolean) => table.delete(pred),
    
    /** Vacía por completo la tabla */
    truncate: () => table.truncate(),
    
    /** Genera un constructor de consultas (QueryBuilder) para filtros complejos */
    query: () => table.query(),
    
    /** Retorna el esquema semántico de la tabla */
    schema: table.getSchema(),
  };
}
```

---

### Paso 4: Consumir datos en tus componentes visuales
Ahora simplemente importa tu hook en cualquier componente de React e interactúa con los datos con total naturalidad:

```tsx
// src/components/NotasApp.tsx
'use client';

import React, { useState } from 'react';
import { useKotliteTable } from '../hooks/useKotliteTable';

export default function NotasApp() {
  const { data: notes, insert, delete: removeNote } = useKotliteTable("notes");
  const [title, setTitle] = useState("");

  const addNote = () => {
    if (!title.trim()) return;
    
    insert({
      userId: 1, // Usuario asociado simulado
      title: title,
      content: "Contenido de mi nota editable...",
      starred: false
    });
    
    setTitle("");
  };

  return (
    <div className="p-6 bg-zinc-900 text-white rounded-2xl max-w-md mx-auto">
      <h2 className="text-xl font-bold font-mono mb-4">Notas con Kotlite</h2>
      
      <div className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={title} 
          onChange={e => setTitle(e.target.value)}
          className="flex-1 bg-zinc-850 border border-zinc-700 px-3 py-2 rounded-xl text-sm"
          placeholder="Escribe el título..."
        />
        <button onClick={addNote} className="bg-indigo-600 px-4 py-2 rounded-xl text-sm font-semibold">
          Guardar
        </button>
      </div>

      <ul className="space-y-2">
        {notes.map(note => (
          <li key={note.id} className="flex justify-between items-center bg-zinc-800 p-3 rounded-xl border border-zinc-750">
            <span className="text-sm">{note.title}</span>
            <button 
              onClick={() => removeNote(n => n.id === note.id)}
              className="text-red-400 hover:text-red-300 text-xs font-mono font-bold"
            >
              [Borrar]
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

### Paso 5: Exportar, Importar y Sincronizar Datos JSON
Para gestionar copias de seguridad de tus tablas o sincronizarlas con APIs de internet de forma segura, utiliza el nuevo `KotliteSyncManager` integrado de forma modular en Kotlite DB.

```typescript
import { db } from '../lib/db';
import { KotliteSyncManager } from '../kotlite';

// 1. Instanciar el gestor asociándolo a tu base de datos
const syncManager = new KotliteSyncManager(db);

// 2. Exportar el estado completo de la base de datos a un String JSON legible
const backupJson = syncManager.exportJson();
console.log("Copia de Seguridad de Kotlite:", backupJson);

// 3. Sincronizar / Importar un backup JSON de forma segura y transaccional
const importResult = syncManager.importJson(backupJson, {
  mode: 'merge',          // 'merge' para Upsert basado en ID, u 'overwrite' para limpiar tablas antes
  transactional: true     // Si algo falla (tipos, constraints), hace un Rollback total y automático
});

if (importResult.success) {
  console.log("Datos sincronizados con éxito:", importResult.importedCount);
} else {
  console.error("Fallo de integridad al importar:", importResult.message, importResult.errors);
}

// 4. Sincronizar en caliente desde una API externa (Endpoint REST JSON)
async function syncDataFromServer() {
  const result = await syncManager.syncFromRemoteUrl("https://api.mi-servidor.com/v1/backups", {
    mode: 'merge',
    transactional: true,
    headers: {
      'Authorization': 'Bearer token-de-acceso'
    }
  });
  
  if (result.success) {
    console.log("¡Tablas locales actualizadas en tiempo real desde el servidor!");
  }
}
```

---

## 🛡️ Preguntas Frecuentes e Integración SSR

1. **¿Por qué Kotlite es seguro contra SSR (Server-Side Rendering)?**
   En entornos como Next.js, las páginas se evalúan primero en el servidor donde `window` y `localStorage` no existen. Kotlite detecta automáticamente esto en su submódulo `Storage.ts` y monta un almacenamiento temporal en memoria `InMemoryStorageEngine` para que el renderizador no falle. Una vez que llega al navegador de cliente, conmuta fluidamente a `LocalStorageEngine` cargando tus datos persistidos de forma transparente.

2. **¿Cómo hacer consultas complejas con filtros y ordenamientos?**
   Utiliza el método `.query()` que retorna un `QueryBuilder`. Este objeto te permite encadenar filtros perezosos inspirados en las colecciones de Kotlin:
   ```typescript
   const misFavoritas = db.table("notes")
     .query()
     .where(n => n.starred === true && n.userId === 1)
     .orderBy("title", "ASC")
     .limit(10)
     .execute();
   ```

3. **¿Cómo configurar el Cifrado Simétrico Síncrono de LocalStorage?**
   Para asegurar la confidencialidad de tus datos locales en dispositivos compartidos, puedes proveer una clave de cifrado secreta como cuarto parámetro en `createKotliteDatabase`. Los datos se encriptarán automáticamente antes de escribirse en el LocalStorage:
   ```typescript
   import { createKotliteDatabase } from './kotlite';

   export const db = createKotliteDatabase(
     "mi_base_de_datos", 
     (db) => {
       db.table("users", (t) => {
         t.integer("id").primaryKey();
         t.text("name").notNull();
       });
     },
     undefined, // Almacenamiento óptimo automático
     "mi-super-clave-secreta-aes-128" // Clave secreta de cifrado
   );
   ```

4. **¿Cómo declarar Claves Foráneas (Foreign Keys) en el DSL?**
   Utiliza el método `.references("tablaPadre", "columnaPadre", accion)` en el constructor de columnas. Soporta las tres acciones relacionales estándar: `'CASCADE'`, `'RESTRICT'` y `'SET_NULL'`:
   ```typescript
   import { createKotliteDatabase } from './kotlite';

   export const db = createKotliteDatabase("empresa", (db) => {
     // 1. Tabla Padre
     db.table("departments", (t) => {
       t.integer("id").primaryKey();
       t.text("name").unique().notNull();
     });

     // 2. Tabla Hija
     db.table("employees", (t) => {
       t.integer("id").primaryKey();
       t.text("name").notNull();
       // Clave Foránea: si se borra el departamento, elimina en cascada los empleados
       t.integer("departmentId")
         .references("departments", "id", "CASCADE")
         .notNull();
     });
   });
   ```
