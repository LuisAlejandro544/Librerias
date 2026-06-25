'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Star, Github, Terminal, CheckCircle2, BookOpen, Layers, Sparkles } from 'lucide-react';
import { Library } from '@/lib/libraries';

// Importa cada simulador de Playground que creamos anteriormente
import PlaygroundGrid from './PlaygroundGrid';
import PlaygroundState from './PlaygroundState';
import PlaygroundFetch from './PlaygroundFetch';
import PlaygroundAnimate from './PlaygroundAnimate';
import PlaygroundKotlite from './PlaygroundKotlite';
import PlaygroundSync from './PlaygroundSync';
import PlaygroundStridb from './PlaygroundStridb';
import PlaygroundFloatLayer from './PlaygroundFloatLayer';

interface LibraryModalProps {
  library: Library;
  onClose: () => void;
}

export default function LibraryModal({ library, onClose }: LibraryModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sandbox' | 'docs'>('sandbox'); // Por defecto abrimos en sandbox para incentivar juego interactivo!
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [appUrl, setAppUrl] = useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        setAppUrl(window.location.origin);
      }, 0);
    }
  }, []);

  const formatWithOrigin = (text: string) => {
    const origin = appUrl || 'https://ai-studio.build';
    return text.replace(/\[APP_URL\]/g, origin);
  };

  const copyInstallCommand = () => {
    navigator.clipboard.writeText(formatWithOrigin(library.npmCommand));
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  const copyUsageCode = () => {
    navigator.clipboard.writeText(library.usageCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const renderActivePlayground = () => {
    switch (library.playgroundType) {
      case 'grid':
        return <PlaygroundGrid />;
      case 'state':
        return <PlaygroundState />;
      case 'fetch':
        return <PlaygroundFetch />;
      case 'animate':
        return <PlaygroundAnimate />;
      case 'kotlite':
        return <PlaygroundKotlite />;
      case 'sync':
        return <PlaygroundSync />;
      case 'stridb':
        return <PlaygroundStridb />;
      case 'floatlayer':
        return <PlaygroundFloatLayer />;
      default:
        return (
          <div className="text-center py-12 text-[#71717A] text-xs">
            No hay sandbox interactiva disponible para esta librería.
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      {/* Caja de diálogo global */}
      <div className="bg-[#09090B] border border-[#27272A] w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-all duration-300">
        
        {/* Cabecera del Documento/Modal */}
        <div className="p-6 border-b border-[#27272A] flex justify-between items-start gap-4 bg-[#09090B]">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold bg-[#18181B] text-indigo-300 px-2 py-0.5 rounded border border-[#27272A]">
                {library.version}
              </span>
              <span className="text-xs text-[#71717A] font-mono">| {library.size} zipped</span>
            </div>
            
            <h2 className="text-xl font-bold font-mono text-white truncate">
              {library.name}
            </h2>
            <p className="text-sm text-[#A1A1AA] leading-relaxed max-w-2xl">
              {library.tagline}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={library.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 border border-[#27272A] text-[#A1A1AA] hover:text-white hover:bg-[#18181B] rounded-xl transition cursor-pointer"
              title="Ver en GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            
            <button
              id="btn-close-modal"
              onClick={onClose}
              className="p-2 border border-[#27272A] text-[#A1A1AA] hover:text-white hover:bg-[#18181B] rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bloque rápido de instalación NPM bajo la cabecera */}
        <div className="px-6 py-2.5 bg-[#18181B] border-b border-[#27272A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#71717A]" />
            <code className="font-mono bg-[#09090B] text-indigo-300 px-2 py-1 rounded select-all font-semibold break-all border border-[#27272A]">
              {formatWithOrigin(library.npmCommand)}
            </code>
          </div>
          <button
            id="btn-copy-install"
            onClick={copyInstallCommand}
            className="flex items-center gap-1 text-[#A1A1AA] hover:text-white font-medium cursor-pointer transition py-1 px-2 hover:bg-[#27272A] rounded-lg"
          >
            {copiedInstall ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold font-mono">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="font-mono">Copiar</span>
              </>
            )}
          </button>
        </div>

        {/* Navegación por pestañas (Tabs selector) */}
        <div className="px-6 bg-[#09090B] border-b border-[#27272A] flex gap-1">
          {[
            { id: 'sandbox', label: 'Sandbox Interactiva', icon: <Sparkles className="w-3.5 h-3.5" /> },
            { id: 'overview', label: 'Visión General', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'docs', label: 'Documentación de Uso', icon: <BookOpen className="w-3.5 h-3.5" /> },
          ].map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`btn-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer -mb-px ${
                  isTabActive
                    ? 'border-indigo-500 text-indigo-400 font-bold'
                    : 'border-transparent text-[#71717A] hover:text-[#FAFAFA]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Cuerpo Scrollable del Modal */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#09090B] min-h-[300px]">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-4xl">
              <div className="space-y-2">
                <span className="text-[10px] text-[#71717A] font-mono font-semibold uppercase tracking-wider block">
                  ¿Por qué usar esta librería?
                </span>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">
                  {library.description}
                </p>
              </div>

              {/* Características Detalladas */}
              <div className="space-y-3">
                <span className="text-[10px] text-[#71717A] font-mono font-semibold uppercase tracking-wider block">
                  Características clave robustas
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {library.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-[#18181B] border border-[#27272A] rounded-xl leading-relaxed flex items-start gap-2.5 text-xs text-[#A1A1AA]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guía Rápida de Instalación */}
              <div className="space-y-2">
                <span className="text-[10px] text-[#71717A] font-mono font-semibold uppercase tracking-wider block">
                  Pasos de Instalación Complementarios
                </span>
                <pre className="text-xs bg-[#18181B] text-indigo-300 border border-[#27272A] font-mono p-4 rounded-xl leading-relaxed whitespace-pre-wrap select-all">
                  {formatWithOrigin(library.installation)}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: PLAYGROUND / SANDBOX */}
          {activeTab === 'sandbox' && (
            <div className="h-full">
              {renderActivePlayground()}
            </div>
          )}

          {/* TAB 3: DOCS (TECHNICAL CODE EXPLAINER) */}
          {activeTab === 'docs' && (
            <div className="space-y-6 max-w-4xl">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#71717A] font-mono font-semibold uppercase tracking-wider block">
                    Ejemplo de Integración en Código Fuente
                  </span>
                  
                  <button
                    id="btn-copy-usage-code"
                    onClick={copyUsageCode}
                    className="flex items-center gap-1.5 text-[11px] text-[#A1A1AA] hover:text-white font-medium cursor-pointer transition py-1.5 px-3 bg-[#18181B] border border-[#27272A] rounded-lg"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold font-mono">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#71717A]" />
                        <span className="font-mono">Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="text-xs bg-[#18181B] text-indigo-300 font-mono p-5 rounded-xl leading-relaxed overflow-x-auto select-all border border-[#27272A]">
                  {library.usageCode}
                </pre>
              </div>

              <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-xl space-y-1">
                <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 font-mono">
                  💡 Consejo de Optimización Core
                </h4>
                <p className="text-[11px] text-indigo-400 leading-relaxed">
                  Esta librería está optimizada para empaquetadores modernos (Webpack, Esbuild) mediante tree-shaking nativo. Si tu compilador es compatible, los módulos no utilizados se eliminarán del bundle final automáticamente. ¡Sigue siendo ligera!
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer del Modal con información de salida */}
        <div className="px-6 py-4 border-t border-[#27272A] bg-[#18181B] flex justify-between items-center text-xs text-[#52525B] font-mono">
          <span>Licencia: MIT (Open-Source)</span>
          <span>¿Encontraste un bug? Abre un issue en GitHub</span>
        </div>

      </div>
    </div>
  );
}
