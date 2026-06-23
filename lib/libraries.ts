export interface Library {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: 'ui' | 'state' | 'network' | 'animation';
  stars: number;
  downloads: string;
  size: string;
  version: string;
  githubUrl: string;
  npmCommand: string;
  features: string[];
  installation: string;
  usageCode: string;
  playgroundType: 'grid' | 'state' | 'fetch' | 'animate';
}

export const libraries: Library[] = [
  {
    id: "tw-flex-grid",
    name: "tw-flex-grid",
    tagline: "El generador definitivo de grillas y layouts responsivos con Tailwind CSS.",
    description: "Una utilidad de diseño ultrarrápida creada para mitigar los dolores de cabeza al estructurar layouts complejos en Tailwind. Introduce un motor declarativo que calcula breakpoints de rejillas fluidas sobre la marcha, optimizando el CSS inyectado y reduciendo el marcado hasta en un 40%.",
    category: "ui",
    stars: 1420,
    downloads: "42k/m",
    size: "2.1 KB",
    version: "v1.4.2",
    githubUrl: "https://github.com/developer/tw-flex-grid",
    npmCommand: "npm i tw-flex-grid",
    features: [
      "Breapoints fluidos y personalizados listos para producción",
      "Reducción del DOM redundante al generar grillas dinámicas",
      "Soporte estricto de auto-ajuste y auto-llenado con CSS Grid genuino",
      "Modo de depuración visual integrado para ver zonas de colisión"
    ],
    installation: `npm install tw-flex-grid

# O usando Yarn / Pnpm:
yarn add tw-flex-grid
pnpm add tw-flex-grid`,
    usageCode: `import { createFlexGrid } from 'tw-flex-grid';

// Define un layout de grilla ultra-dinámico adaptativo
const gridClasses = createFlexGrid({
  cols: { default: 1, sm: 2, md: 3, lg: 4 },
  gap: '6',
  align: 'center',
  flow: 'row-dense'
});

// Devuelve clases combinadas Tailwind puras:
// "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-center grid-flow-row-dense"`,
    playgroundType: "grid"
  },
  {
    id: "state-flow",
    name: "state-flow",
    tagline: "Gestor de estados reactivo y micro-finito con motor de Time-Travel innato.",
    description: "Una alternativa ultra-ligera (menos de 2KB) a Redux o Zustand. Diseñada sobre flujos reactivos puros de TypeScript que permiten crear almacenes (stores) con historial automático e inmutable integrado. Habilita deshacer (Undo), rehacer (Redo) y depuración cronológica sin configurar middlewares redundantes.",
    category: "state",
    stars: 2150,
    downloads: "89k/m",
    size: "1.8 KB",
    version: "v2.1.0",
    githubUrl: "https://github.com/developer/state-flow",
    npmCommand: "npm i state-flow",
    features: [
      "Inmutabilidad nativa mediante clonado estructural óptimo",
      "Viaje en el tiempo (Time Travel) integrado a nivel estructural del State",
      "Suscripciones reactivas granulares por campo de datos para evitar re-renders",
      "Historial configurable con límite dinámico de memoria (Buffer circular)"
    ],
    installation: `npm install state-flow

# O con Yarn / Pnpm:
yarn add state-flow
pnpm add state-flow`,
    usageCode: `import { createStore } from 'state-flow';

// Inicializa el almacén reactivo con límite de 50 pasos de historial
const store = createStore({
  initialState: { count: 0, items: [] },
  historyLimit: 50
});

// Suscríbete a cambios selectivos del estado
store.select('count').subscribe(count => {
  console.log('El contador ahora es:', count);
});

// Modifica el estado de forma segura (genera un nuevo hito en el historial)
store.dispatch(state => {
  state.count += 1;
});

// Viaja en el tiempo de forma instantánea
store.undo(); // Retrocede
store.redo(); // Avanza`,
    playgroundType: "state"
  },
  {
    id: "safe-fetch",
    name: "safe-fetch",
    tagline: "Cliente HTTP resiliente con reintentos de retroceso exponencial automático.",
    description: "Un envoltorio inteligente sobre la API fetch nativa para el desarrollo de aplicaciones hiper-fieles. Implementa bucles de reintentos asíncronos configurables, jitter aleatorio (para evitar colapsos de servidores), deduplicación inteligente y resolución automática de fallas de conexión transitorias.",
    category: "network",
    stars: 980,
    downloads: "15k/m",
    size: "3.4 KB",
    version: "v0.9.8",
    githubUrl: "https://github.com/developer/safe-fetch",
    npmCommand: "npm i safe-fetch",
    features: [
      "Retroceso exponencial (Exponential Backoff) con Jitter adaptativo",
      "Deduplicación automática de llamadas paralelas idénticas",
      "Detector nativo de estado offline/online con cola de retransmisión diferida",
      "Límite de tiempo (timeout) estricto con cancelación limpia de recursos"
    ],
    installation: `npm install safe-fetch

# O con tu gestor preferido:
yarn add safe-fetch
pnpm add safe-fetch`,
    usageCode: `import { safeFetch } from 'safe-fetch';

// Realiza una petición ultra-resistente que se adapta a problemas de red
const data = await safeFetch('https://api.ejemplo.com/resource', {
  retries: 4,
  backoffFactor: 2, // Espera 1s, luego 2s, 4s, 8s...
  initialDelayMs: 1000,
  timeoutMs: 5000,
  onRetry: (err, count) => {
    console.warn(\`Fallo, reintentando por vez número \${count}...\`);
  }
});`,
    playgroundType: "fetch"
  },
  {
    id: "zen-animate",
    name: "zen-animate",
    tagline: "Motor de física de resortes cinéticos de alto rendimiento para microinteracciones.",
    description: "Diseña animaciones fluidas y orgánicas gobernadas por leyes de Newton en el navegador. Proporciona soluciones matemáticas simplificadas para tensiones de resortes, fricción dinámica e inercia táctil que se integran de forma natural con cualquier biblioteca de renderizado (o uso de CSS directo).",
    category: "animation",
    stars: 1870,
    downloads: "64k/m",
    size: "4.0 KB",
    version: "v3.0.1",
    githubUrl: "https://github.com/developer/zen-animate",
    npmCommand: "npm i zen-animate",
    features: [
      "Animación basada puramente en física vectorial (fuerzas y masas)",
      "Cálculo de velocidad inicial heredada para transiciones perfectas",
      "Uso de Web Animations API (WAAPI) para renderizado por hardware",
      "Integración impecable con Tailwind y Framer Motion mediante presets"
    ],
    installation: `npm install zen-animate

# O con tu gestor preferido:
yarn add zen-animate
pnpm add zen-animate`,
    usageCode: `import { createSpring } from 'zen-animate';

// Instancia un resorte físico regulador
const spring = createSpring({
  stiffness: 180, // Rigidez del resorte
  damping: 12,    // Resistencia física
  mass: 1,        // Inercia del elemento
});

// Actualiza el objetivo de destino físico
spring.animateTo(250, (currentValue) => {
  // Se ejecuta fluidamente a 60-120 FPS
  box.style.transform = \`translateX(\${currentValue}px)\`;
});`,
    playgroundType: "animate"
  }
];
