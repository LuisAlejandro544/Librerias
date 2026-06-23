# 📦 Kotlite DB

**Kotlite DB** es un motor de bases de datos local, inmutable, reactivo y tipado, diseñado con la elegancia y expresividad de la sintaxis declarativa de **Kotlin** (inspirado en frameworks como *Exposed* y *Anko*), pero optimizado para el ecosistema moderno de JavaScript y TypeScript.

Es ideal para aplicaciones web (**Next.js**, **React**, **Vite**), ya que es **100% seguro contra Server-Side Rendering (SSR)** al conmutar automáticamente a un motor en memoria cuando se ejecuta en el servidor y sincronizarse de manera persistente con `localStorage` en el navegador.

---

## ✨ Características Principales

*   **Kotlin-Style DSL:** Define esquemas de tablas e inicializa tu base de datos mediante bloques funcionales encadenados y descriptivos.
*   **Seguridad SSR (Next.js Friendly):** No rompe tu compilación en el servidor. Cuenta con un sistema interno con detección inteligente de entornos (`window` y `localStorage` condicionales).
*   **Validación de Esquema Estricta:** Comprobación en tiempo real de tipos de datos (`INTEGER`, `REAL`, `TEXT`, `BOOLEAN`, `DATETIME`).
*   **Manejo de Restricciones (Constraints):** Detección nativa de claves primarias únicas (`primaryKey`), restricciones únicas (`unique`), campos no nulos (`notNull`) y autoincrementos automáticos tipo SQLite.
*   **Consultas Fluidas:** Filtra colecciones usando predicados dinámicos con métodos anidados: `.where()`, `.orderBy()`, `.limit()`, `.offset()`, `.execute()`.
*   **Reactividad en Tiempo Real:** Sistema de suscripción de publicación/suscripción incorporado para enlazar automáticamente el estado almacenado con tus vistas de usuario.

---

## 🛠️ Arquitectura Modular

En cumplimiento del patrón de **Desarrollo Modular Ultra**, la librería está dividida en submódulos especializados para facilitar actualizaciones independientes y depuración de errores:

1.  [`Storage.ts`](./Storage.ts): Capa de abstracción persistente (LocalStorage vs InMemory).
2.  [`Schema.ts`](./Schema.ts): Definición semántica de tipos y columnas fluent.
3.  [`Query.ts`](./Query.ts): Motor de procesamiento de filtros y criterios de búsqueda.
4.  [`Table.ts`](./Table.ts): Administrador de operaciones atómicas CRUD y protección de integridad referencial.
5.  [`Database.ts`](./Database.ts): Fachada centralizadora y gestor reactivo del almacenamiento.

---

## 🚀 Guía de Uso Rápido

### 1. Inicialización y Declaración de Esquema (Kotlin DSL)

Declara tu base de datos local de manera fluida y declarativa:

```typescript
import { createKotliteDatabase } from './kotlite';

// Creamos la base de datos de forma declarativa como si fuera Kotlin
export const db = createKotliteDatabase("mi_app_db", (builder) => {
  
  // Tabla de Usuarios
  builder.table("users", (t) => {
    t.integer("id").primaryKey(); // Autoincremento automático si no se provee
    t.text("username").unique().notNull();
    t.text("role").default("subscriber");
    t.boolean("active").default(true);
    t.datetime("createdAt").default(() => new Date().toISOString());
  });

  // Tabla de Tareas (Todos)
  builder.table("tasks", (t) => {
    t.integer("id").primaryKey();
    t.integer("userId").notNull(); // Relación conceptual
    t.text("title").notNull();
    t.boolean("completed").default(false);
  });
  
});
```

---

### 2. Operaciones CRUD (Inserción, Consulta y Mutación)

#### Insertar Registros (`insert`)
*Kotlite* aplicará valores por defecto, validará unicidades de claves y autoincrementará los IDs tipo entero:

```typescript
try {
  const nuevoUsuario = db.table("users").insert({
    username: "dev_alejandro",
    role: "administrator"
  });
  console.log("Usuario guardado con éxito:", nuevoUsuario);
  // Resultado: { id: 1, username: "dev_alejandro", role: "administrator", active: true, createdAt: "2026..." }
} catch (error) {
  console.error("Error de restricción:", error.message);
}
```

#### Consultar con Sintaxis Bohemia (`query`)
Filtra, ordena y página fácilmente:

```typescript
const usuariosActivosAdmin = db.table("users")
  .query()
  .where(u => u.active === true && u.role === "administrator")
  .orderBy("id", "DESC")
  .limit(5)
  .execute();

console.log("Administradores:", usuariosActivosAdmin);
```

#### Actualizar Registros (`update`)
Modifica los datos de los registros que cumplan cierta condición de forma segura:

```typescript
// Cambiar a inactivo a los usuarios que se llamen "test"
const totalAfectados = db.table("users").update(
  (u) => u.username === "test",
  { active: false }
);

console.log(`Se actualizaron ${totalAfectados} registros.`);
```

#### Eliminar Registros (`delete`)
```typescript
const eliminados = db.table("users").delete(u => u.active === false);
console.log(`Se eliminaron ${eliminados} registros inactivos.`);
```

---

## ⚛️ Integración en React / Next.js (SSR Safe Hook)

Para consumir los datos dentro de React y hacer que tus componentes se vuelvan a renderizar automáticamente cuando la base de datos se actualiza (desde cualquier otra parte de tu código), define este Hook personalizado de alto rendimiento:

```typescript
import { useState, useEffect } from 'react';
import { db } from './db_config'; // Tu base de datos configurada
import { RowData } from './kotlite';

/**
 * Hook reactivo de Kotlite para consultar y mutar una tabla de forma automática.
 */
export function useKotliteTable(tableName: string) {
  const table = db.table(tableName);
  const [data, setData] = useState<RowData[]>(() => table.all());

  useEffect(() => {
    // Suscribirse a cambios en tiempo real
    const unsubscribe = db.subscribe((updatedTable, updatedRows) => {
      if (updatedTable === tableName) {
        setData(updatedRows);
      }
    });

    // Cargar estado inicial por seguridad
    setData(table.all());

    return () => unsubscribe();
  }, [tableName]);

  return {
    data,
    insert: (entity: RowData) => table.insert(entity),
    update: (pred: (r: RowData) => boolean, fields: Partial<RowData>) => table.update(pred, fields),
    delete: (pred: (r: RowData) => boolean) => table.delete(pred),
    truncate: () => table.truncate(),
    query: () => table.query(),
  };
}
```

### Componente de React de Ejemplo

```tsx
'use client';

import React, { useState } from 'react';
import { useKotliteTable } from './hooks/useKotliteTable';

export default function ListaTareas() {
  const { data: tasks, insert, delete: removeTask } = useKotliteTable("tasks");
  const [nuevoTitulo, setNuevoTitulo] = useState("");

  const agregarTarea = () => {
    if (!nuevoTitulo.trim()) return;
    insert({
      userId: 1,
      title: nuevoTitulo,
      completed: false
    });
    setNuevoTitulo("");
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-zinc-950 text-white rounded-3xl border border-zinc-805">
      <h2 className="text-lg font-mono font-bold mb-4">Tareas de Kotlite</h2>
      
      <div className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={nuevoTitulo} 
          onChange={e => setNuevoTitulo(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm"
          placeholder="¿Qué haremos hoy?"
        />
        <button onClick={agregarTarea} className="bg-indigo-600 px-4 py-2 rounded-xl text-sm font-semibold">
          Añadir
        </button>
      </div>

      <ul className="space-y-2">
        {tasks.map(task => (
          <li key={task.id} className="flex justify-between items-center bg-zinc-900 p-3 rounded-xl border border-zinc-900">
            <span className="text-xs font-mono">{task.title}</span>
            <button 
              onClick={() => removeTask(t => t.id === task.id)}
              className="text-red-400 hover:text-red-300 text-xs font-bold"
            >
              Borrar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT (Open-Source)**. ¡Eres libre de copiarlo, extenderlo y comercializarlo sin restricciones!
