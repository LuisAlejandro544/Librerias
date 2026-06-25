# 📖 Tutorial Oficial de Integración: FloatLayer

¡Bienvenido al tutorial paso a paso de **FloatLayer**! En esta guía aprenderás cómo dominar cada módulo y exprimir el máximo rendimiento de tus ventanas flotantes tanto en computadoras de escritorio como en celulares táctiles.

---

## 🎯 ¿Para qué sirve cada Componente / Módulo?

### 1. El Núcleo (`core`)
El núcleo es el cerebro que administra el estado global sin interferir con tu UI.
* **`FloatManager`**: Es un controlador reactivo tipo Store. Se encarga de abrir, enfocar, redimensionar, mover, cerrar y guardar en el almacenamiento local (`localStorage`) la posición y dimensiones de cada ventana. Además, vigila el tamaño de pantalla para evitar que los elementos floten fuera de la zona visible.
* **`Types.ts`**: Define las interfaces TypeScript estrictas. Aquí configuras cosas como `initialX`, `initialY`, `minWidth`, `persistentId` (para persistencia automática) y si la ventana es arrastrable (`isDraggable`) o redimensionable (`isResizable`).

### 2. El Motor de Escritorio (`pc`)
Optimizado para productividad y flujos de trabajo multi-tarea.
* **`PcEngine.cascade()`**: Organiza todas las ventanas activas en forma de escalera, aplicando un pequeño desplazamiento progresivo hacia abajo y a la derecha. Ideal para limpiar el desorden con un solo botón.
* **`PcEngine.tile()`**: Distribuye tus widgets en una cuadrícula (Grid) proporcional perfecta que llena el espacio del lienzo de manera equitativa.
* **`PcEngine.constrainToParent()`**: Devuelve coordenadas limitadas para evitar que una ventana pueda ser arrastrada fuera de un contenedor o área padre seleccionada.

### 3. El Motor Móvil (`mobile`)
Diseñado para la respuesta rápida en pantallas táctiles y móviles de bajos recursos.
* **`MobileEngine.snapBubbleToEdge()`**: Si minimizas una ventana en móvil, esta se colapsa en una pequeña burbuja redonda (estilo "Chat Head" o burbuja de chat). Este algoritmo calcula el borde de pantalla lateral izquierdo o derecho más cercano y succiona magnéticamente la burbuja allí, respetando márgenes de seguridad para no tapar barras del sistema.
* **`MobileEngine.calculateSwipeVelocity()`**: Mide la velocidad del dedo al soltar el arrastre para estimar la inercia del movimiento táctil.
* **`MobileEngine.calculateSlideInertia()`**: Simula físicas de fricción clásicas para que las ventanas o burbujas se deslicen suavemente con inercia orgánica en lugar de frenar en seco.

### 4. El Depurador de Telemetría (`Debug.ts`)
Herramientas profesionales para que monitorices tu desarrollo en tiempo real.
* **`FloatDebug.enableConsoleBridge()`**: Intercepta de forma segura tu `console.log` nativo y envía los mensajes directamente a la cola de logs de FloatLayer, lo cual te permite renderizar consolas de depuración integradas dentro de un widget flotante (ideal para pruebas en celulares reales sin cables).
* **`FloatDebug.recordMetrics()`**: Registra latencias. Si un renderizado o arrastre excede los **16.6ms** (60fps), inyectará una advertencia de rendimiento de GPU.

---

## 🚀 Paso a Paso: Tu primera Ventana Persistente con React

Aquí tienes una receta de código limpia para registrar tu primer widget de notas flotante que recuerde su posición incluso después de recargar la página.

### Paso 1: Configura el Renderizador Global

En tu layout o componente principal, renderiza el bucle de instancias.

```tsx
'use client';

import React from 'react';
import { useFloatLayer } from './librerias/FloatLayer';

export default function FloatLayerCanvas() {
  const { instances, focus, move, resize, close, toggleMinimize, toggleMaximize, stopDragging, stopResizing } = useFloatLayer();

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {instances.map(inst => (
        <div
          key={inst.id}
          style={{
            position: 'absolute',
            left: inst.x,
            top: inst.y,
            width: inst.isMaximized ? '100vw' : inst.width,
            height: inst.isMaximized ? '100vh' : (inst.isMinimized ? '44px' : inst.height),
            zIndex: inst.zIndex,
          }}
          onMouseDown={() => focus(inst.id)}
          className="pointer-events-auto bg-[#18181b] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col text-white"
        >
          {/* Header de Arrastre */}
          <div
            className="bg-zinc-900 px-3 py-2 flex items-center justify-between cursor-move select-none border-b border-zinc-800"
            onMouseDown={(e) => {
              e.preventDefault();
              focus(inst.id);
              const startX = e.clientX;
              const startY = e.clientY;
              
              const handleMouseMove = (me: MouseEvent) => {
                move(inst.id, me.clientX - startX, me.clientY - startY);
              };
              
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                stopDragging(inst.id);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          >
            <span className="text-xs font-bold truncate">{inst.title}</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => toggleMinimize(inst.id)} className="text-zinc-400 hover:text-white">🗕</button>
              <button onClick={() => toggleMaximize(inst.id)} className="text-zinc-400 hover:text-white">🗖</button>
              <button onClick={() => close(inst.id)} className="text-red-400 hover:text-red-300">✕</button>
            </div>
          </div>

          {/* Cuerpo */}
          {!inst.isMinimized && (
            <div className="flex-1 overflow-auto bg-[#09090b]">
              {typeof inst.content === 'function' ? inst.content(inst) : inst.content}
            </div>
          )}

          {/* Controlador de Redimensión */}
          {inst.options.isResizable && !inst.isMinimized && !inst.isMaximized && (
            <div
              className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-se-resize bg-indigo-500/20 hover:bg-indigo-500/40 rounded-tl"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const startX = e.clientX;
                const startY = e.clientY;
                
                const handleMouseMove = (me: MouseEvent) => {
                  resize(inst.id, me.clientX - startX, me.clientY - startY, 'se');
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                  stopResizing(inst.id);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

### Paso 2: Invoca Ventanas desde cualquier Botón

```tsx
'use client';

import { useFloatLayer } from './librerias/FloatLayer';

export function ComponenteDisparador() {
  const { open } = useFloatLayer();

  const lanzarWidget = () => {
    open("notepad_ayudante", "Bloc de Notas Inteligente", (inst) => (
      <div className="p-4 h-full flex flex-col justify-between">
        <textarea 
          placeholder="Escribe tus ideas..." 
          className="bg-transparent border-0 outline-none w-full flex-1 text-xs text-zinc-300 resize-none"
        />
        <p className="text-[9px] text-indigo-400 font-mono">Los cambios se guardan al arrastrar o estirar.</p>
      </div>
    ), {
      initialWidth: 320,
      initialHeight: 240,
      persistentId: "mi_bloc_notas_guardado", // ¡Recuerda las coordenadas en localStorage!
      edgeSnapping: true
    });
  };

  return (
    <button onClick={lanzarWidget} className="px-4 py-2 bg-indigo-600 rounded-xl text-white font-bold text-xs transition hover:bg-indigo-500">
      Abrir Bloc de Notas Flotante 📝
    </button>
  );
}
```

---

## 🛠️ Depuración Pro activa para Desarrolladores

Si estás integrando componentes complejos o pesados (como mapas 3D o reproductores de vídeo), activa la consola integrada para interceptar fallos sobre la marcha:

```typescript
import { FloatDebug } from './librerias/FloatLayer';

// Ejecutar únicamente en el cliente al iniciar la app
if (typeof window !== 'undefined') {
  FloatDebug.enableConsoleBridge();
  
  // Imprime logs normales, ¡se derivarán al debugger de FloatLayer!
  console.log("Iniciando componentes pesados...");
  console.warn("Límite de memoria local saludable.");
}
```
