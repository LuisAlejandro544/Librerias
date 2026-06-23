'use client';

import React from 'react';
import { Sparkles, Star, Download, Code2, Layers, Github } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-[#27272A] bg-[#09090B]/90 backdrop-blur-md sticky top-0 z-40 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo y Titular */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Code2 className="w-5 h-5 text-white stroke-[2]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
                Dev Library Hub
                <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-medium">
                  PORTFOLIO v2.5
                </span>
              </h1>
              <p className="text-xs text-[#A1A1AA] font-medium">
                Explora y experimenta con mis paquetes y utilidades open-source de alto rendimiento.
              </p>
            </div>
          </div>

          {/* Estadísticas agregadas consolidadas y Botón de Perfil */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            
            {/* Total Stars */}
            <div className="flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <div>
                <span className="text-[9px] text-[#71717A] block font-sans uppercase">Stars</span>
                <span className="font-bold text-[#FAFAFA]">6.4K+</span>
              </div>
            </div>

            {/* Total Downloads */}
            <div className="flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2">
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <div>
                <span className="text-[9px] text-[#71717A] block font-sans uppercase">Descargas</span>
                <span className="font-bold text-[#FAFAFA]">214K/mes</span>
              </div>
            </div>

            {/* Total Libraries */}
            <div className="flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <div>
                <span className="text-[9px] text-[#71717A] block font-sans uppercase">Hechas</span>
                <span className="font-bold text-[#FAFAFA]">4 Activas</span>
              </div>
            </div>

            {/* Github Profile Button */}
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all duration-350 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center gap-1.5 cursor-pointer"
            >
              <Github className="w-3.5 h-3.5" />
              <span>@github</span>
            </a>

          </div>

        </div>
      </div>
    </header>
  );
}
