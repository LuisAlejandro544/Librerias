# 📂 Arquitectura de Directorio y Módulos de FloatLayer

Este documento detalla la estructura modular de la librería **FloatLayer** bajo la filosofía de **Desarrollo Modular Ultra**, garantizando aislamiento visual, flujos de datos estables y alto rendimiento.

---

## 🏗️ Diagrama de Flujo de Datos

```text
 💻 Vistas de Usuario / React Components (useFloatLayer Hook)
        │                                 ▲
        │ (Desencadena Acciones)          │ (Suscripción Reactiva)
        ▼                                 │
┌─────────────────────────────────────────────────────────┐
│              FloatManager (Core Store)                  │◄─── [Local Storage] (Persistencia)
└──────────────────────────┬──────────────────────────────┘
                           │
      ┌────────────────────┴────────────────────┐
      ▼                                         ▼
┌──────────────┐                          ┌──────────────┐
│   PcEngine   │                          │ MobileEngine │
│ (Mosaico,    │                          │ (Snapping,   │
│  Cascada)    │                          │  Inercia)    │
└──────────────┘                          └──────────────┘
      │                                         │
      └────────────────────┬────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│                FloatDebug Hub (Debug.ts)                │◄─── [Console Bridge] (Captura global)
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Detalle de Carpetas y Módulos

### 1. `/core/` (Núcleo del Sistema)
- **`Types.ts`**: Contiene la definición de los contratos fundamentales del sistema.
  - `FloatOptions`: Configuración que el desarrollador pasa al spawnear una ventana.
  - `FloatInstance`: Objeto de datos con las coordenadas, estado (minimizada, maximizada), tamaño y `zIndex` de la ventana en ejecución.
  - `FloatLayerState`: Estructura unificada del Store de la librería.
- **`FloatManager.ts`**: El controlador unificado. Implementa un patrón de Store centralizado libre de dependencias pesadas.
  - Gestiona la pila de zIndex dinámicos.
  - Realiza el recalibrado de ventanas en caso de resize de pantalla (`clampAllToScreen`).
  - Ofrece métodos seguros para cargar y guardar los estados del desarrollador en `localStorage`.

### 2. `/pc/` (Motor de Escritorio)
- **`PcEngine.ts`**: Algoritmos puros enfocados en productividad en pantallas grandes.
  - `cascade(...)`: Recibe las ventanas activas y calcula coordenadas en escalera, evitando encabalgamientos visuales.
  - `tile(...)`: Divide el espacio útil del viewport en una cuadrícula proporcional óptima, auto-ajustando anchos y altos para un dashboard ordenado.
  - `constrainToParent(...)`: Restringe coordenadas para impedir que las ventanas sobrepasen un contenedor específico.

### 3. `/mobile/` (Motor Móvil Táctil)
- **`MobileEngine.ts`**: Lógica de interacción optimizada para gestos en smartphones.
  - `snapBubbleToEdge(...)`: Determina el anclaje lateral magnético óptimo (estilo Chat Heads de Messenger) con límites de seguridad del sistema.
  - `calculateSwipeVelocity(...)`: Deriva la aceleración del usuario a partir del historial de movimientos táctiles.
  - `calculateSlideInertia(...)`: Aplica algoritmos de fricción física para simular deslizamientos naturales después de soltar el arrastre.

### 4. `/Debug.ts` (Módulo de Telemetría y Soporte)
- Ofrece el módulo `FloatDebug` que permite a los integradores depurar sus widgets en tiempo real.
  - **Console Bridge**: Intercepta de forma transparente logs de consola nativos (`console.log`, `console.warn`, etc.) para canalizarlos en paneles flotantes de diagnóstico.
  - **Performance Tracker**: Reporta drops de frames o retrasos si el cálculo del arrastre excede el estándar de 16ms (60fps).
  - **Memory/Durable Diagnostics**: Reporta la huella de memoria consumida por las configuraciones guardadas en `localStorage`.

---

## 🚀 Filosofía de Diseño: Aislamiento Completo
La librería no inserta estilos globales en los componentes del desarrollador ni modifica las variables de CSS de terceras pestañas. Se ejecuta en capas flotantes independientes bajo un control preciso de `zIndex` que puede ser montado en portales React o layouts base.
