# 🛠️ Modificaciones, Limitaciones del Navegador y Licencia Apache 2.0

¡FloatLayer es una librería de código abierto y completamente maleable! Puedes modificar, rediseñar y reestructurar cualquier archivo a tu gusto para adaptarlo a las necesidades específicas de tus proyectos.

Este documento detalla lo que necesitas saber antes de meter mano al código, incluyendo limitaciones técnicas comunes en navegadores modernos y las libertades / deberes bajo la licencia **Apache 2.0**.

---

## 🚀 ¡Modifica a tu Gusto!

Debido a su arquitectura **Ultra Modular**, puedes cambiar piezas individuales sin romper el resto de la aplicación:
* Si quieres cambiar cómo se colocan las ventanas en mosaico, solo edita `pc/PcEngine.ts`. No tocarás nada del estado ni de móviles.
* Si prefieres añadir efectos de temblor o inercia táctil diferente en smartphones, modifica directamente `mobile/MobileEngine.ts`.
* Si quieres guardar configuraciones en bases de datos remotas (como Firebase o Postgres) en lugar de usar `localStorage` para la persistencia, modifica los métodos de carga y guardado en `core/FloatManager.ts`.

---

## ⚠️ Limitaciones Técnicas del Navegador que debes Considerar

Al desarrollar o modificar sistemas de ventanas flotantes complejas, te encontrarás con ciertos límites de seguridad y rendimiento impuestos por los navegadores de internet:

1. **Límites de Contenedores iFrames (Crucial)**:
   * Por defecto, las aplicaciones web que se ejecutan dentro de un `iframe` (como en entornos de previsualización, paneles sandbox o embebidos de terceros) **no pueden salir de los límites visuales del iframe**.
   * Los gestos de arrastre que salgan del área del iframe pueden dejar de registrar eventos de mouse/táctil (`mouseup` o `touchend`), lo que provoca que las ventanas se queden "pegadas" al cursor temporalmente.
   * *Solución*: En FloatLayer, se utiliza el listener en `document` para capturar el movimiento incluso si el cursor se sale brevemente de la ventana activa, pero si sale del iframe del navegador por completo, el evento se perderá inevitablemente.

2. **Eventos en Elementos Internos de la Ventana**:
   * Si colocas un iframe de un tercero dentro del contenido de una ventana flotante (ej: un vídeo de YouTube embebido o un mapa externo), los eventos del ratón no se burbujean al documento principal cuando el cursor pasa por encima del iframe interno. Esto puede interrumpir bruscamente el arrastre o redimensionado.
   * *Solución*: Al iniciar un arrastre o redimensionamiento, añade temporalmente una capa transparente (`pointer-events-none` o un div de cobertura) sobre todo el contenido interno para asegurar que el navegador registre tus movimientos de cursor sin interrupciones.

3. **Limitaciones de Capacidad de LocalStorage**:
   * El almacenamiento local (`localStorage`) utilizado por el sistema de persistencia automática está limitado por el navegador a aproximadamente **5MB** por origen (dominio).
   * Guardar estados excesivamente pesados, historiales gigantes de texto o imágenes codificadas en Base64 dentro de los perfiles guardados de `FloatLayer` causará excepciones `QuotaExceededError`. Mantén tus configuraciones compactas (coordenadas, dimensiones e identificadores simples).

4. **Rendimiento de Dispositivos Móviles (GPU vs. CPU)**:
   * El cálculo constante de coordenadas absolutas (`top`, `left`) obliga al navegador a realizar tareas constantes de maquetación y repintado (Reflow & Repaint), lo que puede bajar los frames de animación en smartphones antiguos.
   * *Consejo de Modificación*: Si notas tirones visuales, puedes reescribir el renderizador en el cliente para que use propiedades CSS de transformación en hardware de tarjeta gráfica: `transform: translate3d(x, y, 0)` en lugar de variar `left` y `top`.

---

## 📄 Cumplimiento de la Licencia Apache License 2.0

FloatLayer se distribuye bajo los términos de la **Licencia Apache 2.0**. Esto te otorga un nivel de libertad increíble, pero incluye un par de deberes éticos y legales muy sencillos:

### Lo que puedes hacer libremente (Tus libertades)
* **Uso Comercial**: Puedes integrar FloatLayer en aplicaciones de pago, software empresarial, plataformas SaaS y proyectos comerciales de cualquier escala.
* **Modificación**: Puedes alterar, remover, añadir o reescribir cualquier fragmento de código a tu entera discreción.
* **Distribución**: Puedes compartir, publicar o sublicenciar el código original o modificado.
* **Garantía de Patentes**: Los contribuyentes te conceden licencias de patentes sin regalías asociadas al uso del software.

### Tus deberes al modificar o redistribuir (Tus obligaciones)
* **Conservar el Copyright**: Debes conservar los avisos de derechos de autor (`LICENSE` y cabeceras de autor) que se encuentran en el código original.
* **Declaración de Modificaciones**: Si realizas cambios sustanciales en los archivos existentes y decides distribuir el software, debes incluir una mención destacada en el código indicando que has modificado esos archivos específicos.
* **Inclusión de la Licencia**: Siempre debes incluir una copia de la licencia Apache 2.0 (el archivo `LICENSE` provisto) en cualquier distribución del código que realices.
* **Exención de Responsabilidad**: La librería se entrega "tal cual" (AS IS), sin garantías de ningún tipo. Los creadores o mantenedores de la librería no son responsables de cualquier daño técnico o pérdida de datos derivados de su uso.

¡Al conocer estos límites técnicos y legales, estás completamente preparado para crear la mejor experiencia multitarea flotante en la web con FloatLayer! 🚀🌐
