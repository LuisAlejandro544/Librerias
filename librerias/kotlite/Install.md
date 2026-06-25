# Guía de Instalación de Kotlite ⚡

Kotlite está publicado en **JSR** (JavaScript Registry), el registro moderno y optimizado para TypeScript. Esto permite que funcione de manera nativa, rápida y ligera en cualquier entorno de ejecución moderno (Node.js, Deno, Bun, etc.).

A continuación se muestran los comandos exactos según el gestor de paquetes de tu elección:

---

## 🟢 Node.js (npm)

### Agregar el Paquete
```bash
npx jsr add @alejandro/kotlite-db
```

### Importar Símbolo
```typescript
import * as kotlite_db from "@alejandro/kotlite-db";
```

---

## 🟡 pnpm

### Agregar el Paquete
Para versiones de pnpm modernas (v10 o superior):
```bash
pnpm i jsr:@alejandro/kotlite-db
```

Para versiones anteriores de pnpm (v9 o inferior):
```bash
pnpm dlx jsr add @alejandro/kotlite-db
```

### Importar Símbolo
```typescript
import * as kotlite_db from "@alejandro/kotlite-db";
```

---

## 🦕 Deno

### Agregar el Paquete
```bash
deno add jsr:@alejandro/kotlite-db
```

### Importar Símbolo
Puedes importarlo mediante el mapeo generado:
```typescript
import * as kotlite_db from "@alejandro/kotlite-db";
```

O importarlo de manera directa sin instalación previa con el especificador de JSR:
```typescript
import * as kotlite_db from "jsr:@alejandro/kotlite-db";
```

---

## 🟠 Yarn

### Agregar el Paquete
```bash
yarn add jsr:@alejandro/kotlite-db
```

O si utilizas Yarn v4 o inferior:
```bash
yarn dlx jsr add @alejandro/kotlite-db
```

### Importar Símbolo
```typescript
import * as kotlite_db from "@alejandro/kotlite-db";
```

---

## 🟤 Bun

### Agregar el Paquete
```bash
bunx jsr add @alejandro/kotlite-db
```

### Importar Símbolo
```typescript
import * as kotlite_db from "@alejandro/kotlite-db";
```

---

## 🟣 Vlt (Vlt Package Manager)

### Agregar el Paquete
```bash
vlt install jsr:@alejandro/kotlite-db
```

### Importar Símbolo
```typescript
import * as kotlite_db from "@alejandro/kotlite-db";
```
