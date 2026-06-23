'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Star, Download, Play, ArrowRight, Code } from 'lucide-react';
import { Library } from '@/lib/libraries';

interface LibraryCardProps {
  library: Library;
  onSelect: (lib: Library) => void;
}

export default function LibraryCard({ library, onSelect }: LibraryCardProps) {
  // Mapa de colores sutiles oscuros por categoría de tecnología
  const categoryColors: { [key: string]: { label: string; ring: string; text: string; bg: string } } = {
    ui: { label: 'Estilos & UI', ring: 'border-purple-500/20 bg-purple-500/10', text: 'text-purple-300', bg: 'bg-purple-600' },
    state: { label: 'Estado Reactivo', ring: 'border-emerald-500/20 bg-emerald-500/10', text: 'text-emerald-300', bg: 'bg-emerald-600' },
    network: { label: 'Conexión & Red', ring: 'border-blue-500/20 bg-blue-500/10', text: 'text-blue-300', bg: 'bg-blue-600' },
    animation: { label: 'Animaciones Físicas', ring: 'border-pink-500/20 bg-pink-500/10', text: 'text-pink-300', bg: 'bg-pink-600' },
  };

  const currentTheme = categoryColors[library.category];

  return (
    <motion.div
      id={`library-card-${library.id}`}
      whileHover={{ y: -4, borderColor: 'rgba(99, 102, 241, 0.4)', boxShadow: '0 12px 30px -10px rgba(99, 102, 241, 0.15)' }}
      viewport={{ once: true }}
      className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative group overflow-hidden"
    >
      {/* Sutil gradiente traslúcido para cada categoría en la esquina superior derecha */}
      <span className={`absolute top-0 right-0 w-32 h-32 rounded-full filter blur-[40px] opacity-10 ${currentTheme.bg}`} />

      <div className="space-y-4">
        
        {/* Cabecera de Tarjeta: Versión y Categoría */}
        <div className="flex justify-between items-center">
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${currentTheme.ring} ${currentTheme.text}`}>
            {currentTheme.label}
          </span>
          <span className="font-mono text-xs text-[#71717A] font-bold">
            {library.version}
          </span>
        </div>

        {/* Info Principal */}
        <div className="space-y-1.5 focus:outline-none">
          <div className="flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-[#71717A] font-mono" />
            <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors font-mono">
              {library.name}
            </h3>
          </div>
          <p className="text-sm text-[#A1A1AA] line-clamp-2 leading-relaxed">
            {library.tagline}
          </p>
        </div>

        {/* Métricas destacadas (GitHub/downloads/size) */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#27272A] font-mono text-[11px]">
          {/* Stars */}
          <div className="space-y-0.5 text-center">
            <span className="text-[#71717A] text-[9px] uppercase tracking-wider block font-sans">GitHub Stars</span>
            <div className="flex items-center justify-center gap-1 text-[#FAFAFA] font-bold">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{library.stars.toLocaleString()}</span>
            </div>
          </div>
          {/* Downloads */}
          <div className="space-y-0.5 text-center border-x border-[#27272A]">
            <span className="text-[#71717A] text-[9px] uppercase tracking-wider block font-sans">NPM Descargas</span>
            <div className="flex items-center justify-center gap-1 text-[#FAFAFA] font-bold">
              <Download className="w-3 h-3 text-indigo-400" />
              <span>{library.downloads}</span>
            </div>
          </div>
          {/* Bundle Size */}
          <div className="space-y-0.5 text-center">
            <span className="text-[#71717A] text-[9px] uppercase tracking-wider block font-sans">Peso Gzip</span>
            <span className="text-[#FAFAFA] font-bold block">{library.size}</span>
          </div>
        </div>

        {/* Lista corta de Características (Features) */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] text-[#71717A] font-mono font-semibold uppercase tracking-wider block">
            Puntos Clave:
          </span>
          <ul className="space-y-1 text-xs text-[#A1A1AA] pr-1 list-none">
            {library.features.slice(0, 2).map((feat, idx) => (
              <li key={idx} className="flex items-start gap-1.5 truncate">
                <span className="text-indigo-400 select-none">✓</span>
                <span className="truncate">{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer de Tarjeta con botón de acción */}
      <div className="mt-6">
        <button
          id={`btn-select-${library.id}`}
          onClick={() => onSelect(library)}
          className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25"
        >
          <Play className="w-3 h-3 fill-white" />
          <span>Probar en Sandbox</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

    </motion.div>
  );
}
