'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FloatDebug, DebugLog } from '../Debug';

export interface TelemetryConsoleProps {
  className?: string;
  maxStoredLogs?: number;
}

export function TelemetryConsole({ className = '', maxStoredLogs = 100 }: TelemetryConsoleProps): React.JSX.Element {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [command, setCommand] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Suscribirse de manera reactiva al puente de telemetría de FloatDebug
    const unsubscribe = FloatDebug.subscribe((newLogs) => {
      setLogs(newLogs.slice(0, maxStoredLogs));
    });

    return () => unsubscribe();
  }, [maxStoredLogs]);

  useEffect(() => {
    if (autoScroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleClearLogs = () => {
    // Registra una acción de limpieza en el log para conservar la historia de depuración
    FloatDebug.log('Panel de logs limpiado por el desarrollador.', 'info', 'System');
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    const cmd = command.trim();
    FloatDebug.log(`> ${cmd}`, 'info', 'ConsoleInput');

    try {
      // Evalúa de forma controlada expresiones sencillas de JS para depurar
      const result = new Function(`return (${cmd})`)();
      FloatDebug.log(`Result: ${typeof result === 'object' ? JSON.stringify(result) : result}`, 'success', 'ConsoleResult');
    } catch (err: any) {
      FloatDebug.log(`Error al evaluar comando: ${err?.message || err}`, 'error', 'ConsoleResult');
    }

    setCommand('');
  };

  // Extraer categorías únicas para poder filtrar dinámicamente
  const categories = Array.from(new Set(logs.map(l => l.category)));

  // Aplicar filtros seleccionados en tiempo real
  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesCategory = filterCategory === 'all' || log.category === filterCategory;
    return matchesLevel && matchesCategory;
  });

  return (
    <div id="telemetry-console" className={`flex flex-col h-full bg-[#09090b] text-zinc-300 font-mono text-xs ${className}`}>
      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#121214] border-b border-zinc-800">
        <div className="flex items-center gap-2">
          {/* Nivel de Log */}
          <select 
            value={filterLevel} 
            onChange={(e) => setFilterLevel(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-zinc-400 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todos los Niveles</option>
            <option value="success">✅ Exitoso</option>
            <option value="info">ℹ️ Información</option>
            <option value="warn">⚠️ Advertencias</option>
            <option value="error">🚨 Errores</option>
          </select>

          {/* Categorías */}
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-zinc-400 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todas las Categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[10px] text-zinc-500 select-none cursor-pointer">
            <input 
              type="checkbox" 
              checked={autoScroll} 
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded bg-zinc-900 border-zinc-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3 h-3"
            />
            AutoScroll
          </label>
          <button 
            onClick={handleClearLogs}
            className="text-[10px] text-zinc-500 hover:text-white bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 transition"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Visor de Mensajes */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 select-text selection:bg-zinc-800">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 text-[10px]">
            No hay registros de telemetría que coincidan con los filtros actuales.
          </div>
        ) : (
          filteredLogs.map((log, idx) => {
            let badgeColor = 'bg-zinc-800 text-zinc-400';
            let textColor = 'text-zinc-300';
            
            if (log.level === 'success') {
              badgeColor = 'bg-green-950/40 text-green-400 border border-green-900/30';
              textColor = 'text-green-300';
            } else if (log.level === 'warn') {
              badgeColor = 'bg-yellow-950/40 text-yellow-400 border border-yellow-900/30';
              textColor = 'text-yellow-300';
            } else if (log.level === 'error') {
              badgeColor = 'bg-red-950/40 text-red-400 border border-red-900/30';
              textColor = 'text-red-300';
            }

            return (
              <div key={idx} className="flex items-start gap-2 leading-relaxed animate-fade-in">
                {/* Timestamp */}
                <span className="text-zinc-600 text-[10px] shrink-0 font-mono mt-0.5">{log.timestamp}</span>
                {/* Categoría */}
                <span className="bg-zinc-900/80 border border-zinc-800 text-zinc-500 text-[9px] px-1 py-0.2 rounded uppercase tracking-wider scale-95 shrink-0">
                  {log.category}
                </span>
                {/* Mensaje */}
                <span className={`text-[11px] break-all ${textColor}`}>
                  {log.message}
                </span>
              </div>
            );
          })
        )}
        <div ref={consoleEndRef} />
      </div>

      {/* Shell / Línea de Comandos Interactiva */}
      <form onSubmit={handleCommandSubmit} className="flex border-t border-zinc-800 bg-[#0c0c0e]">
        <div className="flex items-center pl-3 text-indigo-500 font-bold text-xs select-none">
          $
        </div>
        <input 
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Escribe expresión JS (ej: window.innerWidth)..."
          className="flex-1 bg-transparent border-0 outline-none px-2 py-2 text-[11px] text-zinc-100 placeholder-zinc-600 font-mono focus:ring-0"
        />
      </form>
    </div>
  );
}
