'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  useFloatLayer, 
  FloatManager, 
  FloatPcEngine, 
  FloatMobileEngine, 
  FloatInstance 
} from '../librerias/FloatLayer';
import { 
  Plus, Laptop, Smartphone, LayoutGrid, RotateCcw, 
  Settings, Music, FileText, Gamepad2, Maximize2, 
  Minimize2, X, Move, ChevronDown, ChevronUp, Save, 
  Terminal, ShieldCheck, HelpCircle, Activity, Play, 
  Pause, SkipForward, Star, Info, Volume2
} from 'lucide-react';

// Tic-Tac-Toe Floating Game State
interface GameState {
  board: (string | null)[];
  isXNext: boolean;
  winner: string | null;
}

export default function PlaygroundFloatLayer() {
  const { 
    instances, 
    allInstances, 
    layoutMode, 
    focusedId,
    open, 
    close, 
    destroy, 
    focus, 
    toggleMinimize, 
    toggleMaximize, 
    move, 
    resize,
    stopDragging,
    stopResizing
  } = useFloatLayer();

  // Local playground states
  const [useGlobalViewport, setUseGlobalViewport] = useState(false);
  const [activeTab, setActiveTab] = useState<'widgets' | 'pc' | 'mobile' | 'logs'>('widgets');
  const [logMessages, setLogMessages] = useState<{ id: string; msg: string; type: 'info' | 'success' | 'warn' }[]>([]);
  const [simulatedMobile, setSimulatedMobile] = useState(false);

  // Floating notepad content persist state
  const [noteText, setNoteText] = useState("📝 ¡Este bloc de notas es flotante!\n\nPuedes arrastrarlo por el encabezado, estirarlo desde las esquinas inferiores y cambiar su tamaño.\n\nPrueba los modos de Mosaico (Tile) y Cascada (Cascade) en la barra lateral.");

  // Floating Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState("Lo-Fi Study Beats - Chilled Vol. 1");
  const [audioVolume, setAudioVolume] = useState(70);

  // Floating Tic-Tac-Toe game state
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    isXNext: true,
    winner: null
  });

  const sandboxRef = useRef<HTMLDivElement>(null);

  // Helper to add log entries
  const addLog = useCallback((msg: string, type: 'info' | 'success' | 'warn' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setLogMessages(prev => [{ id, msg, type }, ...prev.slice(0, 39)]);
  }, []);

  // Sync state transitions to logs
  useEffect(() => {
    const timer = setTimeout(() => {
      addLog(`FloatLayer inicializado en modo ${layoutMode.toUpperCase()}`, 'success');
    }, 0);
    return () => clearTimeout(timer);
  }, [layoutMode, addLog]);

  // Handle Drag start
  const handleDragStart = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    focus(id);
    addLog(`Arrastre iniciado en ventana: ${id}`, 'info');

    const startX = e.clientX;
    const startY = e.clientY;
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      move(id, deltaX, deltaY);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      stopDragging(id);
      const inst = FloatManager.getState().instances.find(i => i.id === id);
      if (inst) {
        addLog(`Arrastre finalizado. Coordenadas: X:${Math.round(inst.x)}, Y:${Math.round(inst.y)}`, 'success');
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Handle Resize start
  const handleResizeStart = (id: string, handle: 'r' | 'b' | 'se', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    focus(id);
    addLog(`Redimensión iniciada (control: ${handle}) en: ${id}`, 'info');

    const startX = e.clientX;
    const startY = e.clientY;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      resize(id, deltaX, deltaY, handle);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      stopResizing(id);
      const inst = FloatManager.getState().instances.find(i => i.id === id);
      if (inst) {
        addLog(`Redimensión finalizada. Tamaño: ${inst.width}x${inst.height}`, 'success');
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Layout triggers: PC Cascade
  const triggerCascade = () => {
    if (typeof window === 'undefined') return;
    addLog("Ejecutando algoritmo FloatPcEngine.cascade()", "warn");
    const containerWidth = sandboxRef.current?.clientWidth || window.innerWidth;
    const containerHeight = sandboxRef.current?.clientHeight || window.innerHeight;

    const updates = FloatPcEngine.cascade(allInstances, containerWidth, containerHeight, 40, 40, 30, 30);
    updates.forEach(up => {
      const targetInst = allInstances.find(i => i.id === up.id);
      if (targetInst) {
        const dx = up.x - targetInst.x;
        const dy = up.y - targetInst.y;
        move(up.id, dx, dy);
        stopDragging(up.id);
      }
    });
    addLog(`Cascada completada para ${updates.length} ventanas`, "success");
  };

  // Layout triggers: PC Tile Grid
  const triggerTile = () => {
    if (typeof window === 'undefined') return;
    addLog("Ejecutando algoritmo FloatPcEngine.tile()", "warn");
    const containerWidth = sandboxRef.current?.clientWidth || window.innerWidth;
    const containerHeight = sandboxRef.current?.clientHeight || window.innerHeight;

    const updates = FloatPcEngine.tile(allInstances, containerWidth, containerHeight, 16, 16);
    updates.forEach(up => {
      const targetInst = allInstances.find(i => i.id === up.id);
      if (targetInst) {
        const dx = up.x - targetInst.x;
        const dy = up.y - targetInst.y;
        move(up.id, dx, dy);
        stopDragging(up.id);
        
        // Resize manually to fit tile
        const dw = up.width - targetInst.width;
        const dh = up.height - targetInst.height;
        resize(up.id, dw, dh, 'se');
        stopResizing(up.id);
      }
    });
    addLog(`Distribución en Mosaico completada para ${updates.length} ventanas`, "success");
  };

  // Mobile Snapping Simulation helper
  const handleMobileBubbleSnap = (id: string, x: number, y: number) => {
    if (typeof window === 'undefined') return;
    const containerWidth = sandboxRef.current?.clientWidth || window.innerWidth;
    const containerHeight = sandboxRef.current?.clientHeight || window.innerHeight;

    const snapped = FloatMobileEngine.snapBubbleToEdge(x, y, 64, containerWidth, containerHeight, 12);
    
    // Smoothly transition coordinates via sequential delta movements
    const current = allInstances.find(i => i.id === id);
    if (current) {
      const dx = snapped.x - current.x;
      const dy = snapped.y - current.y;
      move(id, dx, dy);
      stopDragging(id);
      addLog(`MobileEngine: Burbuja adherida magnéticamente a X:${snapped.x} Y:${snapped.y}`, 'success');
    }
  };

  // Floating Notepad Spawner
  const spawnNotepad = () => {
    addLog("Spawneando bloc de notas flotante...", "info");
    open("notepad", "Bloc de Notas Flotante", (inst) => {
      return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="flex-1 w-full bg-[#1e1e1e] border-0 p-3.5 outline-none resize-none focus:ring-0 leading-relaxed text-[#c8c8c8] scrollbar-thin"
            placeholder="Escribe algo aquí..."
          />
          <div className="bg-[#2d2d2d] border-t border-[#3e3e3e] px-3 py-1.5 flex justify-between items-center text-[10px] text-zinc-400">
            <span>{noteText.length} caracteres</span>
            <span className="text-indigo-400 font-bold uppercase tracking-wide">Persistente Local</span>
          </div>
        </div>
      );
    }, {
      initialWidth: 320,
      initialHeight: 260,
      initialX: 30,
      initialY: 40,
      persistentId: "notepad_sandbox",
      edgeSnapping: true
    });
  };

  // Floating Music Player Spawner
  const spawnMusicPlayer = () => {
    addLog("Spawneando reproductor de música flotante...", "info");
    open("player", "Estudio Lo-Fi Player", (inst) => {
      return (
        <div className="flex flex-col h-full bg-[#0d0e12] text-white p-4 justify-between font-sans">
          <div className="flex items-center gap-3.5">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/10 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }}>
              <Music className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate">{currentTrack}</h4>
              <p className="text-[10px] text-purple-400 mt-0.5">Streaming de baja fidelidad</p>
            </div>
          </div>

          {/* Equalizer Bars Simulation */}
          <div className="flex items-end justify-center gap-1 h-12 bg-zinc-950/40 border border-zinc-900/30 p-2.5 rounded-xl">
            {[...Array(14)].map((_, i) => (
              <div 
                key={i} 
                className="bg-purple-500 w-1.5 rounded-t transition-all duration-300"
                style={{ 
                  height: isPlaying ? `${Math.floor(Math.random() * 100)}%` : '15%',
                  animation: isPlaying ? `bounce 1s ease-in-out infinite alternate` : undefined,
                  animationDelay: `${i * 0.08}s`
                }}
              />
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span>0:45</span>
              <div className="flex-1 mx-3 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full w-1/3" />
              </div>
              <span>3:20</span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="w-3.5 h-3.5 text-zinc-500" />
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={audioVolume}
                  onChange={(e) => setAudioVolume(Number(e.target.value))}
                  className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setIsPlaying(!isPlaying);
                    addLog(isPlaying ? "Música pausada" : "Música reproduciéndose", "info");
                  }}
                  className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
                </button>
                <button 
                  onClick={() => {
                    setCurrentTrack("Midnight Cafe Jazz - Track " + Math.floor(Math.random() * 10 + 1));
                    setIsPlaying(true);
                  }}
                  className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }, {
      initialWidth: 310,
      initialHeight: 240,
      initialX: 380,
      initialY: 40,
      isResizable: false
    });
  };

  // Tic-Tac-Toe Game Logic Spawner
  const resetGame = () => {
    setGameState({
      board: Array(9).fill(null),
      isXNext: true,
      winner: null
    });
  };

  const handleGameMove = (index: number) => {
    if (gameState.board[index] || gameState.winner) return;

    const nextBoard = [...gameState.board];
    nextBoard[index] = gameState.isXNext ? 'X' : 'O';

    // Calculate Winner
    const winPatterns = [
      [0,1,2], [3,4,5], [6,7,8], // Rows
      [0,3,6], [1,4,7], [2,5,8], // Cols
      [0,4,8], [2,4,6]           // Diag
    ];

    let winner = null;
    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (nextBoard[a] && nextBoard[a] === nextBoard[b] && nextBoard[a] === nextBoard[c]) {
        winner = nextBoard[a];
        break;
      }
    }

    if (!winner && nextBoard.every(cell => cell !== null)) {
      winner = 'Tie';
    }

    setGameState({
      board: nextBoard,
      isXNext: !gameState.isXNext,
      winner
    });

    if (winner) {
      addLog(winner === 'Tie' ? "Tres en raya flotante finalizó en empate!" : `¡Ganador ${winner} en Tres en Raya!`, "success");
    }
  };

  const spawnGame = () => {
    addLog("Spawneando juego Tres en Raya flotante...", "info");
    open("game", "Retro Tic-Tac-Toe Game", (inst) => {
      return (
        <div className="flex flex-col h-full bg-[#151515] text-white p-4 justify-between font-sans">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 font-mono">Turno: <span className="text-amber-400 font-bold">{gameState.isXNext ? 'X' : 'O'}</span></span>
            <button 
              onClick={resetGame}
              className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-[#e4e4e7] px-2 py-0.5 rounded border border-zinc-700 transition"
            >
              Reiniciar
            </button>
          </div>

          {/* Board */}
          <div className="grid grid-cols-3 gap-2 my-3">
            {gameState.board.map((cell, idx) => (
              <button
                key={idx}
                onClick={() => handleGameMove(idx)}
                className={`h-12 rounded-lg bg-zinc-900 border border-zinc-800 text-sm font-bold flex items-center justify-center transition cursor-pointer hover:bg-zinc-800/80 active:scale-95 ${cell === 'X' ? 'text-amber-400' : 'text-indigo-400'}`}
              >
                {cell}
              </button>
            ))}
          </div>

          <div className="text-center">
            {gameState.winner ? (
              <p className="text-xs bg-indigo-950 text-indigo-300 py-1.5 rounded-lg border border-indigo-900/40 animate-pulse font-bold uppercase tracking-wider">
                {gameState.winner === 'Tie' ? "¡Empate técnico!" : `🏆 ¡Ganador: ${gameState.winner}!`}
              </p>
            ) : (
              <p className="text-[10px] text-zinc-500 font-mono">Haz tres en raya flotando encima de otras vistas.</p>
            )}
          </div>
        </div>
      );
    }, {
      initialWidth: 260,
      initialHeight: 250,
      initialX: 200,
      initialY: 180,
      isResizable: false
    });
  };

  return (
    <div id="playground-floatlayer" className="space-y-6">
      
      {/* Upper Control Bar */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider block">
            Laboratorio Interactivo
          </span>
          <h2 className="text-lg font-bold font-sans flex items-center gap-2">
            FloatLayer Sandbox Playground 🔬
          </h2>
          <p className="text-xs text-[#A1A1AA] max-w-xl">
            Prueba de forma reactiva la creación, arrastre y snapping magnético de ventanas modulares. Cambia de layout para móviles o PC y visualiza la telemetría.
          </p>
        </div>

        {/* Viewport setting toggle */}
        <div className="flex items-center gap-3 bg-[#09090B] p-1.5 rounded-xl border border-[#27272A]">
          <button
            onClick={() => {
              setUseGlobalViewport(false);
              addLog("Cambiado a Modo Lienzo Local (Sandbox)", "warn");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${!useGlobalViewport ? 'bg-indigo-600 text-white shadow-lg' : 'text-[#71717A] hover:text-[#e4e4e7]'}`}
          >
            <Laptop className="w-3.5 h-3.5" />
            Lienzo Interno
          </button>
          <button
            onClick={() => {
              setUseGlobalViewport(true);
              addLog("Cambiado a Modo Pantalla Completa Global (Fixed)", "warn");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${useGlobalViewport ? 'bg-[#818cf8] text-zinc-950 shadow-lg' : 'text-[#71717A] hover:text-[#e4e4e7]'}`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Global Pantalla
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Control Column */}
        <div className="lg:col-span-4 bg-[#121214] border border-[#27272A] rounded-2xl p-5 flex flex-col justify-between space-y-5 text-white">
          <div className="space-y-4">
            
            {/* Quick action buttons */}
            <div className="pb-3 border-b border-[#27272A]">
              <span className="text-[10px] text-zinc-400 font-bold font-mono block mb-2.5 uppercase">
                1. Spawnear Widgets Flotantes
              </span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={spawnNotepad}
                  className="w-full flex items-center justify-between bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-2.5 rounded-xl text-left text-xs font-bold transition group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-900/40 text-indigo-400 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-white">Bloc de Notas</h4>
                      <p className="text-[9px] text-[#71717A] font-normal">Persistencia local integrada</p>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-zinc-500 group-hover:text-white transition" />
                </button>

                <button
                  onClick={spawnMusicPlayer}
                  className="w-full flex items-center justify-between bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-2.5 rounded-xl text-left text-xs font-bold transition group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-pink-950 border border-pink-900/40 text-pink-400 flex items-center justify-center">
                      <Music className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-white">Music Player</h4>
                      <p className="text-[9px] text-[#71717A] font-normal">Ecualizador de ondas activo</p>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-zinc-500 group-hover:text-white transition" />
                </button>

                <button
                  onClick={spawnGame}
                  className="w-full flex items-center justify-between bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-2.5 rounded-xl text-left text-xs font-bold transition group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-950 border border-amber-900/40 text-amber-400 flex items-center justify-center">
                      <Gamepad2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-white">Tres en Raya</h4>
                      <p className="text-[9px] text-[#71717A] font-normal">Tablero interactivo flotante</p>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-zinc-500 group-hover:text-white transition" />
                </button>
              </div>
            </div>

            {/* Layout Engines Configuration */}
            <div>
              <span className="text-[10px] text-indigo-400 font-bold font-mono block mb-2.5 uppercase tracking-wider">
                2. Motores de Layout (PC / Móvil)
              </span>

              <div className="space-y-3 bg-[#09090B] p-4 rounded-xl border border-[#27272A]">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                  <span className="text-xs font-bold text-white">Algoritmos PC</span>
                  <Laptop className="w-4 h-4 text-indigo-400" />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={triggerCascade}
                    disabled={instances.length === 0}
                    className="flex flex-col items-center justify-center bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-indigo-500/20 py-2.5 px-2 rounded-lg text-center transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
                  >
                    <span className="text-[11px] font-bold text-zinc-100 group-hover:text-indigo-400">Cascada 📑</span>
                    <span className="text-[8px] text-zinc-500 mt-1">FloatPcEngine.cascade</span>
                  </button>

                  <button
                    onClick={triggerTile}
                    disabled={instances.length === 0}
                    className="flex flex-col items-center justify-center bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-indigo-500/20 py-2.5 px-2 rounded-lg text-center transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
                  >
                    <span className="text-[11px] font-bold text-zinc-100 group-hover:text-indigo-400">Mosaico 📊</span>
                    <span className="text-[8px] text-zinc-500 mt-1">FloatPcEngine.tile</span>
                  </button>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center pb-1.5">
                    <span className="text-xs font-bold text-white">Simulador Móvil</span>
                    <Smartphone className="w-4 h-4 text-purple-400" />
                  </div>
                  <button
                    onClick={() => {
                      setSimulatedMobile(!simulatedMobile);
                      addLog(simulatedMobile ? "Simulador de móvil desactivado" : "Simulador de móvil activado. Las capas flotantes se adaptarán al viewport móvil.", "warn");
                    }}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${simulatedMobile ? 'bg-purple-950 text-purple-300 border border-purple-800/40' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'}`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{simulatedMobile ? "Desactivar Celular" : "Activar Contenedor Celular"}</span>
                  </button>
                  <p className="text-[8px] text-[#71717A] mt-1.5 font-mono leading-normal">
                    *Al activar el contenedor celular, los arrastres simularán snapping magnético y tamaño fluido adaptable en celulares.
                  </p>
                </div>
              </div>
            </div>

            {/* Diagnostic system logger */}
            <div className="bg-[#09090B] border border-[#27272A] rounded-xl overflow-hidden">
              <div className="bg-[#18181B] px-3 py-1.5 flex items-center justify-between border-b border-zinc-900">
                <span className="text-[9px] font-mono font-bold text-indigo-400 flex items-center gap-1.5">
                  <Terminal className="w-3 h-3 text-indigo-400" />
                  Registro de Telemetría
                </span>
                <span className="text-[8px] text-emerald-400 bg-emerald-950 border border-emerald-900 px-1 py-0.2 rounded font-mono font-bold">LIVE</span>
              </div>
              <div className="h-32 p-3 overflow-y-auto font-mono text-[9px] space-y-1.5 scrollbar-thin">
                {logMessages.length === 0 ? (
                  <div className="text-center py-8 text-zinc-600 italic">No hay registros de eventos todavía. Arrastra un widget para inyectar logs.</div>
                ) : (
                  logMessages.map(log => {
                    let c = "text-zinc-400";
                    if (log.type === "success") c = "text-emerald-400";
                    if (log.type === "warn") c = "text-amber-400";
                    return (
                      <div key={log.id} className="flex gap-2">
                        <span className="text-zinc-600 select-none">&gt;</span>
                        <p className={`${c} leading-normal`}>{log.msg}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          <div className="pt-3 border-t border-[#27272A] text-[9px] text-[#52525b] font-mono leading-normal flex items-center gap-1.5 justify-between">
            <span>FloatLayer @ 1.0.0</span>
            <div className="flex items-center gap-1 text-emerald-500">
              <ShieldCheck className="w-3.5 h-3.5" /> Apache-2.0
            </div>
          </div>
        </div>

        {/* Right Sandbox Canvas Column */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
          
          <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-2xl border border-[#27272A]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span className="text-xs font-bold text-zinc-300 font-mono">
                Lienzo de Pruebas: {!useGlobalViewport ? "Local Sandbox (Clamp interno)" : "Pantalla Completa (Viewport global)"}
              </span>
            </div>
            <div className="flex gap-1 bg-[#09090B] p-0.5 rounded-lg border border-zinc-900 text-[10px] font-mono font-bold text-zinc-500">
              <span className="px-2 py-0.5 text-[#e4e4e7] bg-indigo-950/60 rounded border border-indigo-900/30">
                {instances.length} Widgets Activos
              </span>
            </div>
          </div>

          {/* Sandbox Area container */}
          <div 
            ref={sandboxRef}
            className={`relative rounded-3xl overflow-hidden bg-grid-white border border-[#27272A] flex items-center justify-center transition-all duration-300 ${simulatedMobile ? 'w-full max-w-[360px] h-[640px] mx-auto border-purple-500/40 shadow-2xl shadow-purple-950/10' : 'w-full h-[520px] bg-[#09090b]'}`}
            style={{ 
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          >
            {simulatedMobile && (
              <div className="absolute top-0 inset-x-0 bg-zinc-950 px-4 py-2 flex justify-between items-center text-[10px] text-zinc-400 border-b border-zinc-900/60 font-mono z-50 select-none">
                <span>9:41 📱</span>
                <span className="font-bold text-purple-400">Simulación Celular</span>
                <span className="flex items-center gap-1">📶🔋</span>
              </div>
            )}

            {/* If no instances are open, show instructions */}
            {instances.length === 0 && (
              <div className="text-center p-6 space-y-3 z-10 max-w-sm">
                <div className="w-12 h-12 rounded-2xl bg-indigo-950/50 border border-indigo-900/40 text-indigo-400 flex items-center justify-center mx-auto animate-bounce">
                  <Move className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">Lienzo Vacío</h3>
                <p className="text-xs text-[#71717A] leading-relaxed">
                  Presiona los botones de la barra lateral izquierda para generar widgets flotantes interactivos como un Bloc de notas o un reproductor Lo-Fi.
                </p>
              </div>
            )}

            {/* LOCAL LIENZO RENDER: Render floats here if not using global viewport */}
            {!useGlobalViewport && instances.map((inst) => {
              const isFocused = focusedId === inst.id;
              
              // Mobile layout overrides in simulation
              const isSimulatedBubble = simulatedMobile && inst.isMinimized;
              const displayWidth = isSimulatedBubble ? 64 : (inst.isMaximized ? '100%' : inst.width);
              const displayHeight = isSimulatedBubble ? 64 : (inst.isMaximized ? '100%' : (inst.isMinimized ? 44 : inst.height));

              return (
                <div
                  key={inst.id}
                  style={{
                    position: 'absolute',
                    left: isSimulatedBubble ? inst.x : (inst.isMaximized ? 0 : inst.x),
                    top: isSimulatedBubble ? inst.y : (inst.isMaximized ? 0 : inst.y),
                    width: displayWidth,
                    height: displayHeight,
                    zIndex: inst.zIndex,
                  }}
                  onMouseDown={() => focus(inst.id)}
                  className={`flex flex-col bg-[#14151a] border rounded-2xl overflow-hidden shadow-2xl transition-all duration-150 ${isFocused ? 'border-indigo-500 shadow-indigo-500/10' : 'border-[#27272A]'}`}
                >
                  {/* BUBBLE MOBILE CHAT HEAD SIMULATOR */}
                  {isSimulatedBubble ? (
                    <button
                      onMouseDown={(e) => handleDragStart(inst.id, e)}
                      onTouchStart={() => addLog(`Burbuja táctil presionada: ${inst.id}`, 'info')}
                      onTouchEnd={() => handleMobileBubbleSnap(inst.id, inst.x, inst.y)}
                      className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white cursor-pointer hover:scale-105 active:scale-95 transition shadow-lg relative animate-fade-in border border-indigo-400/40"
                    >
                      {inst.id === 'notepad' && <FileText className="w-7 h-7" />}
                      {inst.id === 'player' && <Music className="w-7 h-7" />}
                      {inst.id === 'game' && <Gamepad2 className="w-7 h-7" />}
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-bold">1</span>
                    </button>
                  ) : (
                    <>
                      {/* Normal Window Layout */}
                      <div 
                        onMouseDown={(e) => handleDragStart(inst.id, e)}
                        className={`px-3 py-2.5 flex items-center justify-between cursor-move select-none border-b border-zinc-900 ${isFocused ? 'bg-[#181920]' : 'bg-[#0f1013]'}`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <Move className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                          <span className="text-xs font-bold text-zinc-100 truncate font-sans">{inst.title}</span>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {/* Minimize button */}
                          <button
                            onClick={() => {
                              toggleMinimize(inst.id);
                              addLog(`Ventana ${inst.isMinimized ? 'restaurada' : 'minimizada'}: ${inst.id}`, 'info');
                            }}
                            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition cursor-pointer"
                          >
                            <Minimize2 className="w-3 h-3" />
                          </button>

                          {/* Maximize button */}
                          <button
                            onClick={() => {
                              toggleMaximize(inst.id);
                              addLog(`Ventana ${inst.isMaximized ? 'restaurada' : 'maximizada'}: ${inst.id}`, 'info');
                            }}
                            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition cursor-pointer"
                          >
                            <Maximize2 className="w-3 h-3" />
                          </button>

                          {/* Close button */}
                          <button
                            onClick={() => {
                              close(inst.id);
                              addLog(`Ventana oculta: ${inst.id}`, 'warn');
                            }}
                            className="p-1 hover:bg-rose-950 hover:text-rose-400 text-zinc-500 rounded transition cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Content panel */}
                      {!inst.isMinimized && (
                        <div className="flex-1 overflow-auto min-h-0 bg-[#0c0d10]">
                          {typeof inst.content === 'function' ? inst.content(inst) : inst.content}
                        </div>
                      )}

                      {/* Window Resizing Handle handles */}
                      {inst.options.isResizable && !inst.isMinimized && !inst.isMaximized && (
                        <>
                          <div 
                            onMouseDown={(e) => handleResizeStart(inst.id, 'r', e)}
                            className="absolute top-0 right-0 w-1.5 h-full cursor-ew-resize hover:bg-indigo-500/10 transition z-40"
                          />
                          <div 
                            onMouseDown={(e) => handleResizeStart(inst.id, 'b', e)}
                            className="absolute bottom-0 left-0 w-full h-1.5 cursor-ns-resize hover:bg-indigo-500/10 transition z-40"
                          />
                          <div 
                            onMouseDown={(e) => handleResizeStart(inst.id, 'se', e)}
                            className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize bg-indigo-500/20 hover:bg-indigo-500/40 rounded-tl transition z-50"
                          />
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* GLOBAL LIENZO RENDER: Render fixed on top of everything if global viewport active */}
      {useGlobalViewport && instances.map((inst) => {
        const isFocused = focusedId === inst.id;

        return (
          <div
            key={inst.id}
            style={{
              position: 'fixed',
              left: inst.isMaximized ? 0 : inst.x,
              top: inst.isMaximized ? 0 : inst.y,
              width: inst.isMaximized ? '100vw' : inst.width,
              height: inst.isMaximized ? '100vh' : (inst.isMinimized ? 44 : inst.height),
              zIndex: inst.zIndex + 2000, // Make sure it sits on top of navbar
            }}
            onMouseDown={() => focus(inst.id)}
            className={`flex flex-col bg-[#14151a] border rounded-2xl overflow-hidden shadow-2xl transition-all duration-150 ${isFocused ? 'border-indigo-500 shadow-indigo-500/20' : 'border-[#27272A]'}`}
          >
            <div 
              onMouseDown={(e) => handleDragStart(inst.id, e)}
              className={`px-3 py-2.5 flex items-center justify-between cursor-move select-none border-b border-zinc-900 ${isFocused ? 'bg-[#181920]' : 'bg-[#0f1013]'}`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <Move className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                <span className="text-xs font-bold text-zinc-100 truncate font-sans">{inst.title}</span>
                <span className="text-[8px] bg-indigo-950 text-indigo-400 px-1 py-0.2 rounded font-mono font-bold select-none">MODO GLOBAL</span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => toggleMinimize(inst.id)}
                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition cursor-pointer"
                >
                  <Minimize2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => toggleMaximize(inst.id)}
                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    close(inst.id);
                    addLog(`Ventana oculta: ${inst.id}`, 'warn');
                  }}
                  className="p-1 hover:bg-rose-950 hover:text-rose-400 text-zinc-500 rounded transition cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {!inst.isMinimized && (
              <div className="flex-1 overflow-auto min-h-0 bg-[#0c0d10]">
                {typeof inst.content === 'function' ? inst.content(inst) : inst.content}
              </div>
            )}

            {inst.options.isResizable && !inst.isMinimized && !inst.isMaximized && (
              <>
                <div 
                  onMouseDown={(e) => handleResizeStart(inst.id, 'r', e)}
                  className="absolute top-0 right-0 w-1.5 h-full cursor-ew-resize hover:bg-indigo-500/10 transition z-40"
                />
                <div 
                  onMouseDown={(e) => handleResizeStart(inst.id, 'b', e)}
                  className="absolute bottom-0 left-0 w-full h-1.5 cursor-ns-resize hover:bg-indigo-500/10 transition z-40"
                />
                <div 
                  onMouseDown={(e) => handleResizeStart(inst.id, 'se', e)}
                  className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize bg-indigo-500/20 hover:bg-indigo-500/40 rounded-tl transition z-50"
                />
              </>
            )}
          </div>
        );
      })}

    </div>
  );
}
