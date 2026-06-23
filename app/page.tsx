'use client';

import React, { useState, useMemo } from 'react';
import Header from '@/components/Header';
import LibraryCard from '@/components/LibraryCard';
import LibraryModal from '@/components/LibraryModal';
import { libraries, Library } from '@/lib/libraries';
import { Search, Cpu, Database, Compass, ChevronRight, Sparkles, BookOpen, Layout } from 'lucide-react';

export default function Page() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLibrary, setSelectedLibrary] = useState<Library | null>(null);

  // Filtrado reactivo computado con memoización eficiente
  const filteredLibraries = useMemo(() => {
    return libraries.filter((lib) => {
      const matchesSearch =
        lib.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lib.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lib.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || lib.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Componente Modular Header */}
      <Header />

      {/* Hero Intro de Alto Impacto */}
      <section className="bg-gradient-to-b from-[#09090B] to-[#121214] border-b border-[#27272A] py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#18181B] border border-[#27272A] rounded-full text-xs text-[#A1A1AA] font-mono font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>CÓDIGO ABIERTO E DELIVERABILITY DE ALTO PERFORMANCE</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-[1.15] mb-4">
              Diseñado para desarrolladores que aprecian el{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                código limpio y alto rendimiento.
              </span>
            </h2>

            <p className="text-sm md:text-base text-[#A1A1AA] leading-relaxed mb-8 max-w-2xl">
              Aquí puedes explorar todas las librerías técnicas que he implementado para NodeJS, React y entornos de frontend moderno. No consumas código ciego: abre la Sandbox para calibrar parámetros, probar flujos óptimos y copiar código listo para producción.
            </p>

            {/* Búsqueda y Filtros Rápidos */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-[#18181B] border border-[#27272A] rounded-2xl p-3 shadow-inner">
              
              {/* Buscador */}
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar librería por nombre, palabra clave o característica..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition placeholder-[#71717A]"
                />
              </div>

              {/* Botones de Categorías */}
              <div className="flex flex-wrap items-center gap-1.5 border-t md:border-t-0 md:border-l border-[#27272A] pt-3 md:pt-0 md:pl-4">
                {[
                  { id: 'all', label: 'Todo' },
                  { id: 'ui', label: 'Diseño/UI' },
                  { id: 'state', label: 'Estado' },
                  { id: 'network', label: 'Conexión' },
                  { id: 'animation', label: 'Física/Motion' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    id={`btn-filter-${cat.id}`}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none transition cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-600 border border-indigo-500 text-white font-bold shadow-md shadow-indigo-500/10'
                        : 'bg-[#09090B] border border-[#27272A] text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#18181B]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Listado Principal de Librerías (Catálogo) */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#71717A] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#71717A]" />
              Librerías Disponibles ({filteredLibraries.length})
            </h3>
            {searchQuery && (
              <span className="text-xs text-indigo-400 font-mono">
                Resultados para: &quot;{searchQuery}&quot;
              </span>
            )}
          </div>

          {filteredLibraries.length === 0 ? (
            <div className="text-center py-20 bg-[#18181B] border border-[#27272A] rounded-3xl space-y-3">
              <p className="text-[#A1A1AA] text-sm font-medium">
                No encontramos librerías asociadas a esa búsqueda o criterio de filtrado.
              </p>
              <button
                id="btn-clear-search-filters"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer transition underline"
              >
                Limpiar filtros y ver todos los paquetes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredLibraries.map((lib) => (
                <LibraryCard
                  key={lib.id}
                  library={lib}
                  onSelect={(selected) => setSelectedLibrary(selected)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sección Bento de Ideas de Integraciones Futuras (Requerimiento de experto) */}
        <section id="roadmap-integrations" className="mt-16 space-y-6 pt-10 border-t border-[#27272A]">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#A1A1AA]">
              Ideas de Integraciones Técnicas Futuras
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Integración 1: Asistente IA Gemini */}
            <div className="bg-[#18181B] border border-[#27272A] p-5 rounded-2xl space-y-3 relative group overflow-hidden transition hover:border-indigo-500/50">
              <div className="h-2 w-2 rounded-full bg-indigo-500 absolute top-4 right-4" />
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wide">
                Documentador Inteligente Gemini SDK
              </h4>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                Podemos integrar un endpoint con el modelo <code>gemini-3.5-flash</code> para leer tus archivos locales y generar scripts de configuración o ejemplos de código Typescript personalizados a la conveniencia de los usuarios.
              </p>
              <div className="flex items-center text-[10px] font-bold text-indigo-400 gap-1 pt-1">
                <span>Explorar propuesta de IA</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Integración 2: Firebase Firestore Database Sync */}
            <div className="bg-[#18181B] border border-[#27272A] p-5 rounded-2xl space-y-3 relative group overflow-hidden transition hover:border-emerald-500/50">
              <div className="h-2 w-2 rounded-full bg-emerald-500 absolute top-4 right-4" />
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Database className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wide">
                Historial Cloud con Firebase Sync
              </h4>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                Haremos posible sincronizar las configuraciones que los usuarios editan en las sandboxes (como las físicas cinéticas o grillas layout) directo a una base Firestore para guardar &quot;Presets Comunitarios&quot; persistentes.
              </p>
              <div className="flex items-center text-[10px] font-bold text-emerald-400 gap-1 pt-1">
                <span>Guardar tus configuraciones</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Integración 3: Interactive Markdown Explainer */}
            <div className="bg-[#18181B] border border-[#27272A] p-5 rounded-2xl space-y-3 relative group overflow-hidden transition hover:border-purple-500/50">
              <div className="h-2 w-2 rounded-full bg-purple-500 absolute top-4 right-4" />
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wide">
                Traductor & Playground WebAssembly
              </h4>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                Podríamos renderizar las bibliotecas directamente compitiendo en hilos WebAssembly para simular flujos de red u optimizaciones matemáticas en vivo contra hilos JS nativos y mostrar gráficos comparativos d3/recharts.
              </p>
              <div className="flex items-center text-[10px] font-bold text-purple-400 gap-1 pt-1">
                <span>Simular con WebAssembly</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* Footer de Créditos de la App */}
      <footer className="bg-[#09090B] border-t border-[#27272A] py-6 mt-16 text-center text-xs text-[#52525B] font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>API: v2.1.0-STABLE</span>
            <span>|</span>
            <span>REGION: CO-CLOUD-RUN</span>
          </div>
          <p>© {new Date().getFullYear()} Dev Library Hub. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Modal Desplegable / Detalle de la Librería */}
      {selectedLibrary && (
        <LibraryModal
          library={selectedLibrary}
          onClose={() => setSelectedLibrary(null)}
        />
      )}
    </div>
  );
}
