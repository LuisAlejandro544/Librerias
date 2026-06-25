/**
 * FloatLayer - Motor de Ventanas Picture-in-Picture (PiP) Reales
 * Encapsula la API nativa HTML5 'documentPictureInPicture' para abrir elementos
 * o vistas completas por encima de todo el sistema operativo.
 */

import { FloatDebug } from '../Debug';

export interface PipWindowOptions {
  width?: number;
  height?: number;
  title?: string;
  onClose?: () => void;
}

export class FloatPipEngine {
  private activePipWindow: any = null;

  // Verifica si el navegador actual soporta la API nativa de Document Picture-in-Picture
  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'documentPictureInPicture' in window;
  }

  // Abre un elemento o componente React renderizado en una ventana flotante real fuera del navegador
  public async requestPipWindow(
    elementToMove: HTMLElement,
    options: PipWindowOptions = {}
  ): Promise<any> {
    if (!this.isSupported()) {
      const errMsg = 'La API de Document Picture-in-Picture no es compatible con este navegador.';
      FloatDebug.log(errMsg, 'error', 'PiPEngine');
      throw new Error(errMsg);
    }

    const width = options.width || 450;
    const height = options.height || 350;

    try {
      // Cerrar ventana PiP anterior si existe
      this.closeActivePip();

      FloatDebug.log('Solicitando ventana Picture-in-Picture nativa...', 'info', 'PiPEngine');
      
      // Abrir la ventana flotante real a nivel de sistema operativo
      const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
        width,
        height
      });

      this.activePipWindow = pipWindow;

      // Sincronizar todos los estilos CSS de la ventana principal para mantener el diseño de Tailwind y fuentes
      this.copyStylesToPipWindow(pipWindow);

      // Mover el elemento HTML deseado a la ventana Picture-in-Picture
      const pipDocument = pipWindow.document;
      pipDocument.body.style.margin = '0';
      pipDocument.body.style.padding = '0';
      pipDocument.body.style.backgroundColor = '#09090b'; // color oscuro de fondo por defecto
      pipDocument.body.style.overflow = 'hidden';

      // Crear un contenedor de destino
      const container = pipDocument.createElement('div');
      container.id = 'pip-content-root';
      container.style.width = '100vw';
      container.style.height = '100vh';
      container.appendChild(elementToMove);
      
      pipDocument.body.appendChild(container);

      // Registrar título si es posible
      if (options.title) {
        pipDocument.title = options.title;
      }

      FloatDebug.log(`Ventana PiP abierta exitosamente (${width}x${height}px).`, 'success', 'PiPEngine');

      // Escuchar el evento de cierre de la ventana flotante nativa
      pipWindow.addEventListener('pagehide', () => {
        FloatDebug.log('Ventana Picture-in-Picture nativa cerrada.', 'warn', 'PiPEngine');
        
        // Devolver el elemento a su lugar original o invocar callback
        if (options.onClose) {
          options.onClose();
        }
        this.activePipWindow = null;
      });

      return pipWindow;
    } catch (error: any) {
      const errMsg = `Error al inicializar Picture-in-Picture: ${error?.message || error}`;
      FloatDebug.log(errMsg, 'error', 'PiPEngine');
      throw error;
    }
  }

  // Cierra activamente la ventana PiP abierta
  public closeActivePip() {
    if (this.activePipWindow) {
      this.activePipWindow.close();
      this.activePipWindow = null;
    }
  }

  // Copia todas las hojas de estilo del documento actual al de la ventana flotante nativa
  private copyStylesToPipWindow(pipWindow: any) {
    const mainDocument = window.document;
    const pipDocument = pipWindow.document;

    // 1. Copiar estilos vinculados por tags <style> y <link>
    Array.from(mainDocument.styleSheets).forEach((styleSheet: any) => {
      try {
        if (styleSheet.cssRules) {
          const newStyle = pipDocument.createElement('style');
          
          Array.from(styleSheet.cssRules).forEach((cssRule: any) => {
            newStyle.appendChild(pipDocument.createTextNode(cssRule.cssText));
          });
          
          pipDocument.head.appendChild(newStyle);
        } else if (styleSheet.href) {
          // Copiar estilos remotos vinculados mediante <link rel="stylesheet">
          const newLink = pipDocument.createElement('link');
          newLink.rel = 'stylesheet';
          newLink.href = styleSheet.href;
          pipDocument.head.appendChild(newLink);
        }
      } catch (e) {
        // Fallback simple por si hay protección CORS o reglas inaccesibles
        if (styleSheet.ownerNode) {
          const clonedNode = styleSheet.ownerNode.cloneNode(true);
          pipDocument.head.appendChild(clonedNode);
        }
      }
    });
  }
}

export const FloatPip: FloatPipEngine = new FloatPipEngine();
