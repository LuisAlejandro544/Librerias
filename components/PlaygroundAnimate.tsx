'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings, RefreshCw, Copy, Check, Eye } from 'lucide-react';

interface Preset {
  name: string;
  stiffness: number;
  damping: number;
  mass: number;
  description: string;
}

const PRESETS: Preset[] = [
  { name: 'Gelatina Rebotona 🍩', stiffness: 220, damping: 11, mass: 0.9, description: 'Alta elasticidad con rebote vigoroso' },
  { name: 'Seda Fluida 🌊', stiffness: 100, damping: 18, mass: 1.2, description: 'Movimiento armonizado ultra-suave' },
  { name: 'Puntero Rígido ⚡', stiffness: 380, damping: 28, mass: 0.6, description: 'Respuesta instantánea y precisa' },
  { name: 'Bloque Industrial ⚙️', stiffness: 60, damping: 15, mass: 4.0, description: 'Inercia magnánima y pesada' },
];

export default function PlaygroundAnimate() {
  const [stiffness, setStiffness] = useState(180);
  const [damping, setDamping] = useState(12);
  const [mass, setMass] = useState(1.0);
  const [activePreset, setActivePreset] = useState<string>('');
  const [ballIndex, setBallIndex] = useState(0); 
  const [copied, setCopied] = useState(false);
  
  // Posiciones dinámicas de la esfera en el viewport
  const [ballPosition, setBallPosition] = useState({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);

  const applyPreset = (preset: Preset) => {
    setStiffness(preset.stiffness);
    setDamping(preset.damping);
    setMass(preset.mass);
    setActivePreset(preset.name);
  };

  const handleViewportClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 24; // 24 es la mitad del tamaño de la bola
    const y = e.clientY - rect.top - 24;
    setBallPosition({ x, y });
    setBallIndex((prev) => prev + 1);
  };

  const codeString = `{
  type: "spring",
  stiffness: ${stiffness},
  damping: ${damping},
  mass: ${mass}
}`;

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Posicionamiento de coordenadas inicial al cargar la pantalla
  useEffect(() => {
    if (viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      setBallPosition({
        x: rect.width / 2 - 24,
        y: rect.height / 2 - 24,
      });
    }
  }, []);

  const triggerImpulse = () => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    // Lanzamiento a posición aleatoria
    const x = Math.random() * (rect.width - 64);
    const y = Math.random() * (rect.height - 64);
    setBallPosition({ x, y });
    setBallIndex((prev) => prev + 1);
  };

  return (
    <div id="playground-zen-animate" className="space-y-6 text-[#FAFAFA]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Lado izquierdo: controladores de inercia y springs */}
        <div className="lg:col-span-5 bg-[#18181B] border border-[#27272A] p-5 rounded-2xl space-y-5">
          <div className="flex items-center gap-2 text-white font-semibold pb-2 border-b border-[#27272A]">
            <Settings className="w-4 h-4 text-indigo-400" />
            <span>Física Vibracional</span>
          </div>

          {/* Ajuste Rigidez */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="text-[#A1A1AA] font-medium">Rigidez del Resorte (stiffness)</label>
              <span className="font-mono bg-[#09090B] border border-[#27272A]/80 text-indigo-300 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                {stiffness}
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="500"
              value={stiffness}
              onChange={(e) => {
                setStiffness(Number(e.target.value));
                setActivePreset('');
              }}
              className="w-full h-1.5 bg-[#09090B] rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <p className="text-[10px] text-[#71717A]">Determina el retorno de fuerza del resorte, a mayor número más rápido retrocede.</p>
          </div>

          {/* Ajuste Amortiguamiento */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="text-[#A1A1AA] font-medium">Amortiguación (damping)</label>
              <span className="font-mono bg-[#09090B] border border-[#27272A]/80 text-indigo-300 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                {damping}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="60"
              value={damping}
              onChange={(e) => {
                setDamping(Number(e.target.value));
                setActivePreset('');
              }}
              className="w-full h-1.5 bg-[#09090B] rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <p className="text-[10px] text-[#71717A]">Controla la fricción y resistencia. Menor amortiguación causa oscilación constante.</p>
          </div>

          {/* Ajuste de Masa */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="text-[#A1A1AA] font-medium">Inercia de la Masa (mass)</label>
              <span className="font-mono bg-[#09090B] border border-[#27272A]/80 text-indigo-300 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                {mass.toFixed(1)} kg
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="5.0"
              step="0.1"
              value={mass}
              onChange={(e) => {
                setMass(Number(e.target.value));
                setActivePreset('');
              }}
              className="w-full h-1.5 bg-[#09090B] rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <p className="text-[10px] text-[#71717A]">Añade peso gravitatorio simulado. Mayor masa genera un retraso al iniciar pero gran inercia.</p>
          </div>

          {/* Presets Rápidos */}
          <div className="space-y-2 pt-2 border-t border-[#27272A]">
            <span className="text-[10.5px] text-[#71717A] font-semibold uppercase tracking-wider block">
              Físicas de Referencia (Presets)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  id={`btn-preset-${preset.name.split(' ')[0]}`}
                  onClick={() => applyPreset(preset)}
                  className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    activePreset === preset.name
                      ? 'border-indigo-500 bg-indigo-505/10 text-indigo-300 font-semibold shadow-inner'
                      : 'border-[#27272A] bg-[#09090B] hover:bg-[#18181B] hover:border-[#3f3f46] text-[#71717A] hover:text-white'
                  }`}
                >
                  <div className="text-[11px] font-bold truncate">{preset.name}</div>
                  <div className="text-[9px] opacity-75 truncate">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Botón de impulso */}
          <button
            id="btn-trigger-impulse"
            onClick={triggerImpulse}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-lg transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-200" />
            <span>Lanzar Impulso Aleatorio</span>
          </button>
        </div>

        {/* Lado derecho: viewport táctil interactivo y código */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          
          {/* Viewport físico */}
          <div
            ref={viewportRef}
            onClick={handleViewportClick}
            className="relative h-[280px] bg-[#121214] border border-[#27272A] rounded-2xl overflow-hidden cursor-crosshair select-none bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]"
          >
            {/* Indicaciones flotantes */}
            <div className="absolute top-4 left-4 z-10 bg-[#09090B]/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-[#27272A] text-[10px] text-[#A1A1AA] font-semibold leading-tight">
              Haz clic en cualquier zona de esta cuadrícula para ver oscilar la esfera
            </div>

            {/* Bola física gobernada por motion */}
            <motion.div
              animate={{ x: ballPosition.x, y: ballPosition.y }}
              transition={{
                type: 'spring',
                stiffness: stiffness,
                damping: damping,
                mass: mass,
              }}
              className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 border border-white/50 shadow-[0_8px_24px_rgba(99,102,241,0.4)] flex items-center justify-center text-[10px] text-white font-mono font-bold select-none pointer-events-none"
            >
              m-{ballIndex}
            </motion.div>
          </div>

          {/* Bloque técnico para copiar código en Framer Motion */}
          <div className="bg-[#121214] text-white rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-[#27272A] shadow-inner">
            <div className="space-y-1.5 flex-1 w-full">
              <span className="text-[10px] text-[#71717A] font-mono font-semibold uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                Objeto de Transición de Resorte (Framer Motion)
              </span>
              <pre className="text-xs text-indigo-300 font-mono bg-[#09090B] p-3 rounded-xl border border-[#27272A] leading-relaxed max-w-full overflow-x-auto select-all">
                {codeString}
              </pre>
            </div>
            
            <button
              id="btn-copy-transition"
              onClick={copyCodeToClipboard}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition whitespace-nowrap self-end shadow-lg shadow-indigo-650/10"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-indigo-200" />
                  <span>Copiar Configuración</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
