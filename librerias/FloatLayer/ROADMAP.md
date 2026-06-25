# 🗺️ Roadmap de Desarrollo para FloatLayer

Este documento traza los hitos proyectados para la evolución de **FloatLayer**, estructurado en fases incrementales para asegurar estabilidad y modularidad.

---

## 📈 Fases del Proyecto

### Fase 1: Núcleo y Arquitectura Unificada (Completada ✓)
- [x] Arquitectura unificada con separación estricta `/core`, `/mobile` y `/pc`.
- [x] Gestor de estado reactivo unificado `FloatManager`.
- [x] Algoritmos de ordenamiento `cascade` y `tile` en PC.
- [x] Snapping magnético lateral para celulares (`MobileEngine.snapBubbleToEdge`).
- [x] Hook de React `useFloatLayer` compatible con SSR de Next.js.
- [x] Módulo de análisis y diagnóstico avanzado (`Debug.ts`).

### Fase 2: Robustez y Gestos Complejos (Próximamente 🚀)
- [ ] Integración de físicas de muelle (Spring Physics) en el arrastre táctil de burbujas en celular usando `motion/react`.
- [ ] Implementación de un componente nativo `<FloatPortal />` que use React Portals para inyectar ventanas en el elemento `body` de forma segura, reduciendo herencia de z-index corrupta.
- [ ] Sistema de acoplamiento lateral automático en PC (Docking System), permitiendo anclar widgets en mitades de pantalla de forma similar a Windows Snap Assist.

### Fase 3: Integraciones Avanzadas e Intervenciones AI (Planificado 🔮)
- [ ] **Modo Picture-in-Picture Nativo**: Posibilidad de delegar el contenido flotante a la API PiP del navegador (Document Picture-in-Picture) para que flote por encima de pestañas de Chrome completas e incluso del escritorio del usuario.
- [ ] **Coordinación Inteligente Multitarea**: Enlace con asistentes de inteligencia artificial (LLM) que puedan posicionar o mover las ventanas según las necesidades visuales del usuario (ej: "AI, ordena mis notas al lado derecho").
- [ ] **Optimizaciones de GPU**: Soporte opcional para transformaciones acelera-hardware (`will-change: transform`, `translate3d`) con fallback de CPU si detecta dispositivos de muy bajos recursos.

---

## 💡 Ideas de Integraciones que puedes Construir con FloatLayer

1. **Dashboard de Analíticas PiP**: Un widget de gráficos de rendimiento flotando sobre tu panel administrativo principal mientras editas bases de datos.
2. **Ayudante IA Contextual**: Una burbuja colapsable de soporte en la esquina inferior que se expande a un chat inteligente solo con un toque.
3. **Consola Interactiva de Devs**: Un módulo terminal flotante en pre-producción que muestra errores internos y métricas de carga en móviles de prueba sin necesidad de conectar cables USB o Xcode/Android Studio.
