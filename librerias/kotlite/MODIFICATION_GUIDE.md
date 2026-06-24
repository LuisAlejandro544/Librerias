# Guía de Modificación Libre de Kotlite DB (Bajo Apache 2.0)

¡Hola desarrollador! Uno de los mayores valores de **Kotlite DB** es que es una librería flexible y abierta. Te animamos a clonarla, adaptarla y modificar cada uno de sus componentes internos de acuerdo con las necesidades de tu proyecto. 

Esta librería se distribuye bajo la **Licencia Apache 2.0**, lo que te otorga una enorme libertad, pero con ciertos límites claros que debes respetar para mantener un ecosistema de software honesto y legal.

---

## 🟢 Lo que PUEDES hacer libremente:

* **Modificación Completa**: Puedes reescribir la lógica de consultas, cambiar la encriptación de datos, añadir nuevos motores de bases de datos de almacenamiento, o incluso modificar el estilo DSL.
* **Uso Comercial y Privado**: Puedes utilizar Kotlite DB (original o modificada) en proyectos comerciales, internos de tu empresa o de código cerrado sin pagar regalías ni pedir permisos adicionales.
* **Distribución**: Puedes distribuir copias de la librería, originales o modificadas, a tus usuarios o clientes.

---

## ⚠️ Lo que DEBES respetar (Límites de la Licencia Apache 2.0):

1. **Mantener Avisos de Derechos de Autor (Atribución)**: Si modificas la librería, debes conservar en la cabecera de los archivos de código fuente todos los avisos originales de copyright, patentes, marcas registradas y atribución que ya estén presentes en el código.
2. **Indicar los Cambios Realizados**: Si modificas algún archivo existente de la librería y decides distribuirlo, debes añadir una nota clara en los archivos correspondientes indicando que realizaste modificaciones sobre el código original.
3. **Distribución del Archivo de Licencia**: Debes incluir una copia de la licencia **Apache 2.0** (el archivo `LICENSE` provisto) en cualquier distribución de software que contenga Kotlite DB.
4. **Sin Garantías (As-Is)**: La librería se entrega "tal cual" (As-Is), sin garantías de ningún tipo. Los autores no se hacen responsables de pérdidas de datos, fallos en producción o incompatibilidades de software derivados del uso directo o modificado de Kotlite DB.

---

## 💡 Sugerencias para modificar Kotlite DB sin romperla:

* **Sigue el Desarrollo Modular Ultra**: Si deseas añadir un nuevo comportamiento o integración (por ejemplo, sincronizar con Supabase), no lo programes directamente dentro de `Table.ts` o `Database.ts`. Crea un archivo especializado como `SupabaseSync.ts` y expórtalo a través de `index.ts`. Esto evita que tus cambios colisionen con futuras actualizaciones de seguridad de Kotlite DB.
* **Prueba tus Cambios Localmente**: Utiliza el playground interactivo que hemos diseñado en Next.js para probar tus consultas y flujos en caliente antes de empaquetar o lanzar tu versión de producción.

¡Disfruta hackeando y mejorando Kotlite DB a tu gusto! 💻⚡
