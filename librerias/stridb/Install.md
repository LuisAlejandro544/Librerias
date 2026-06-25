# Guía de Instalación de Stridb ⚡

Stridb está publicado en **JSR** (JavaScript Registry), el registro moderno y optimizado para TypeScript y módulos ESM nativos. Puedes instalarlo con tu gestor de paquetes favorito:

---

## 🟢 Node.js (npm)

### Agregar el Paquete
```bash
npx jsr add @alejandro/stridb
```

### Importar Símbolo
```typescript
import * as stridb from "@alejandro/stridb";
```

---

## 🟡 pnpm

### Agregar el Paquete
Para versiones de pnpm modernas (v10 o superior):
```bash
pnpm i jsr:@alejandro/stridb
```

Para versiones anteriores de pnpm (v9 o inferior):
```bash
pnpm dlx jsr add @alejandro/stridb
```

### Importar Símbolo
```typescript
import * as stridb from "@alejandro/stridb";
```

---

## 🟤 Bun

### Agregar el Paquete
```bash
bunx jsr add @alejandro/stridb
```

### Importar Símbolo
```typescript
import * as stridb from "@alejandro/stridb";
```

---

## 🟣 Vlt (Vlt Package Manager)

### Agregar el Paquete
```bash
vlt install jsr:@alejandro/stridb
```

### Importar Símbolo
```typescript
import * as stridb from "@alejandro/stridb";
```

---

## 🦕 Deno

### Agregar el Paquete
```bash
deno add jsr:@alejandro/stridb
```

### Importar Símbolo
Puedes importarlo mediante el mapeo generado:
```typescript
import * as stridb from "@alejandro/stridb";
```

O de manera directa sin instalación previa con el especificador de JSR:
```typescript
import * as stridb from "jsr:@alejandro/stridb";
```

---

## 🟠 Yarn

### Agregar el Paquete
```bash
yarn add jsr:@alejandro/stridb
```

O si utilizas Yarn v4 o inferior:
```bash
yarn dlx jsr add @alejandro/stridb
```

### Importar Símbolo
```typescript
import * as stridb from "@alejandro/stridb";
```
