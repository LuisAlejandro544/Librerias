# 🌐 FloatLayer

**FloatLayer** es una librería web ultra-modular, reactiva y ligera diseñada para crear ventanas flotantes, paneles Picture-in-Picture (PiP), widgets móviles estilo "Chat Heads" y paneles superpuestos interactivos que flotan por encima de cualquier página web. 

Todo esto se logra con total aislamiento visual, optimizaciones táctiles para dispositivos móviles y un motor de ventanas avanzado para computadoras de escritorio (PC).

Licencia oficial bajo los términos de **Apache License 2.0**.

---

## 🎨 Características Clave

- 📦 **Desarrollo Modular Ultra**: Lógica dividida de forma estricta entre núcleo (`core`), móvil (`mobile`) y escritorio (`pc`) para máxima velocidad de mantenimiento y prevención de fallos catastróficos.
- 📱 **Mobile Optimized (Módulo Mobile)**: Simulación de burbujas colapsables (como las burbujas flotantes de chat), snapping automático a los bordes de la pantalla del celular y cálculo avanzado de inercia por velocidad de arrastre táctil.
- 💻 **PC Desktop Engine (Módulo PC)**: Sistema modular con soporte para arrastrar (`drag`), cambiar tamaño (`resize`), controles de ventana (minimizar, maximizar, cerrar), distribución ordenada en cascada o cuadrícula y enfoque dinámico de capas (`zIndex`).
- ⚡ **SSR-Safe & Reactivo**: Diseñado para entornos modernos como Next.js (SSR). Incluye el Hook `useFloatLayer` para sincronizar las interfaces en tiempo real de manera limpia y veloz.
- 💾 **Persistencia Inteligente**: Opción para guardar automáticamente las coordenadas y dimensiones de las ventanas flotantes en `localStorage` usando un identificador persistente.

---

## 📁 Arquitectura del Directorio

El código se encuentra organizado de manera modular bajo la filosofía de **Desarrollo Modular Ultra**:

```text
/librerias/FloatLayer/
├── core/
│   ├── Types.ts          # Definiciones de tipo rigurosas
│   └── FloatManager.ts   # Gestor de estado reactivo (Store unificado)
├── mobile/
│   ├── MobileEngine.ts   # Algoritmos de snapping táctil, burbujas e inercia de gestos
│   └── index.ts          # Exportador del submódulo de móvil
├── pc/
│   ├── PcEngine.ts       # Layout en cascada, cuadrícula y restricción en contenedores padres
│   └── index.ts          # Exportador del submódulo de PC
├── LICENSE               # Licencia de distribución Apache 2.0
├── README.md             # Guía técnica y de instalación
├── index.ts              # Punto de entrada unificado y Hook Reactivo useFloatLayer
├── mod.ts                # Entrada compatible con Deno / JSR
└── jsr.json              # Configuración y metadatos JSR
```

---

## ⚙️ Instalación

Puedes agregar **FloatLayer** a tu aplicación mediante registro **JSR** o importándolo directamente de forma offline:

```bash
# Instalación recomendada vía JSR
npx jsr add @alejandro/floatlayer
```

---

## 🚀 Guía de Uso Rápido

### 1. Inicialización en React / Next.js

Para renderizar las capas flotantes de manera global, puedes colocar el visor de instancias en tu layout general o página principal:

```tsx
'use client';

import React from 'react';
import { useFloatLayer } from './librerias/FloatLayer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { instances, open, close, move, resize, focus } = useFloatLayer();

  const handleOpenWidget = () => {
    open("asistente-ai", "Asistente AI Flotante", (instance) => (
      <div className="p-4 bg-zinc-900 text-white h-full flex flex-col justify-between">
        <p>¡Hola! Soy tu asistente en primer plano.</p>
        <button 
          onClick={() => close(instance.id)}
          className="mt-4 px-3 py-1 bg-red-600 rounded text-xs"
        >
          Cerrar
        </button>
      </div>
    ), {
      initialWidth: 320,
      initialHeight: 400,
      edgeSnapping: true,
      persistentId: "widget_asistente_ai" // Se guardará su posición automáticamente!
    });
  };

  return (
    <div className="relative min-h-screen">
      {children}
      
      {/* Botón para disparar la capa */}
      <button 
        onClick={handleOpenWidget}
        className="fixed bottom-6 right-6 z-50 bg-indigo-600 p-3 rounded-full text-white"
      >
        Abrir Capa AI
      </button>

      {/* Renderizador de ventanas flotantes */}
      {instances.map(inst => (
        <div
          key={inst.id}
          style={{
            position: 'fixed',
            left: inst.x,
            top: inst.y,
            width: inst.isMaximized ? '100vw' : inst.width,
            height: inst.isMaximized ? '100vh' : (inst.isMinimized ? '48px' : inst.height),
            zIndex: inst.zIndex,
          }}
          className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col"
          onMouseDown={() => focus(inst.id)}
        >
          {/* Header de arrastre */}
          <div 
            className="bg-zinc-900 px-3 py-2 flex items-center justify-between cursor-move select-none"
            onMouseDown={(e) => {
              const startX = e.clientX;
              const startY = e.clientY;
              const handleMouseMove = (moveEvent: MouseEvent) => {
                move(inst.id, moveEvent.clientX - startX, moveEvent.clientY - startY);
              };
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          >
            <span className="text-xs font-bold text-zinc-300">{inst.title}</span>
            <button onClick={() => close(inst.id)} className="text-zinc-500 hover:text-white">✕</button>
          </div>

          {/* Cuerpo del widget flotante */}
          {!inst.isMinimized && (
            <div className="flex-1 overflow-auto">
              {typeof inst.content === 'function' ? inst.content(inst) : inst.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 2. Uso del Módulo de PC Desktop (`PcEngine`)

Puedes automatizar layouts inteligentes como ordenar todas las ventanas abiertas en **cascada** o en **cuadrícula** con un solo clic:

```ts
import { FloatPcEngine, FloatManager } from './librerias/FloatLayer';

const handleCascade = () => {
  const state = FloatManager.getState();
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  const updates = FloatPcEngine.cascade(state.instances, screenW, screenH);
  
  updates.forEach(up => {
    // Reposiciona cada ventana
    FloatManager.move(up.id, up.x - FloatManager.getState().instances.find(i => i.id === up.id)!.x, up.y - FloatManager.getState().instances.find(i => i.id === up.id)!.y);
  });
};
```

### 3. Uso del Módulo de Celular (`MobileEngine`)

Para celulares, si el usuario desliza la ventana, puedes colapsarla en una pequeña "burbuja" interactiva que se adhiere suavemente a los bordes laterales del viewport:

```ts
import { FloatMobileEngine } from './librerias/FloatLayer';

// Al terminar de arrastrar en móvil, snap a los bordes laterales
const onTouchEnd = (x: number, y: number) => {
  const bubbleSize = 64;
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  const targetCoords = FloatMobileEngine.snapBubbleToEdge(x, y, bubbleSize, screenW, screenH);
  
  console.log("Coordenadas óptimas de adherencia táctil:", targetCoords);
  // Actualizar coordenadas de la burbuja...
};
```

---

## 📝 Licencia

Este proyecto está licenciado bajo la licencia **Apache License 2.0**. Consulta el archivo `LICENSE` adjunto para obtener los términos completos de uso, distribución y contribuciones de patentes.
