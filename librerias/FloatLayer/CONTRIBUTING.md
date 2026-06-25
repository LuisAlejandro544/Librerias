# 🤝 Guía de Contribución para FloatLayer

¡Nos alegra enormemente que quieras ayudarnos a mejorar **FloatLayer**! Para mantener la librería súper modular, rápida y robusta, te pedimos que sigas estas directrices al enviar sugerencias, corregir errores o proponer nuevas integraciones.

---

## 🛠️ Directrices para Desarrollar e Innovar

1. **Separación Estricta de Módulos (Ultra Modular)**:
   * **Nada de código acoplado**: Si creas un nuevo comportamiento para PC, debe ir estrictamente bajo `/pc/`. Si es para móviles o pantallas táctiles, colócalo bajo `/mobile/`.
   * **Sin herencia de estilos sucios**: No inyectes archivos CSS globales o clases específicas que no se controlen mediante props (`className`, `headerClassName`). Todo el estilo visual base debe ser flexible para que el integrador use Tailwind u otras tecnologías según prefiera.

2. **Evita la sobrecarga de dependencias**:
   * El núcleo (`core`) debe mantenerse **100% libre de dependencias pesadas**. Solo depende de React para la inyección de tipos en las firmas y hooks.
   * Evita introducir paquetes de animaciones o de arrastre masivos como `framer-motion` o `react-draggable` dentro del código raíz de la librería. Las físicas deben calcularse de forma nativa o delegarse opcionalmente a nivel de hook del cliente si el desarrollador final lo requiere.

3. **Métricas y Telemetría**:
   * Si añades una nueva acción interactiva de arrastre, escalado o transición, asegúrate de llamar a `FloatDebug.recordMetrics(instanceId, action, startTime)` al terminar para que el panel de rendimiento del desarrollador registre la latencia de respuesta en milisegundos.

---

## 📝 Flujo para Enviar una Mejora (Pull Request)

1. **Haz un Fork de la rama `main`**.
2. **Crea una rama descriptiva** con tu mejora o parche: `git checkout -b feature/muelles-fisicos-tactil` o `git checkout -b fix/recalibracion-resize`.
3. **Escribe código modular y tipado**: Asegúrate de que las interfaces en `core/Types.ts` queden bien documentadas con JSDoc para que los IDEs de otros desarrolladores muestren la ayuda visual.
4. **Verifica el tipado y el formateo**: Corre el linter (`npm run lint` o equivalente) antes de realizar el commit.
5. **No actualices la versión manualmente** en `jsr.json` a menos que sea una release oficial. Deja que el mantenedor del repositorio asigne la etiqueta adecuada.

---

## 💡 Ideas de Contribuciones que nos encantarían

* **Spring Physics**: Implementar animaciones basadas en elasticidad física en lugar de transiciones lineales en `MobileEngine`.
* **Filtro de Consola**: Permitir al módulo `FloatDebug` filtrar mensajes interceptados por categorías (`warn`, `error`, `success`) para reducir el ruido en apps muy activas.
* **Portal Manager**: Crear un contenedor React Portal que inyecte de manera limpia las instancias directamente bajo el tag `<body>` del DOM para evadir colisiones de z-index del componente contenedor original.

¡Gracias por ser parte del ecosistema de desarrollo ultra modular con FloatLayer! 🌐💙
