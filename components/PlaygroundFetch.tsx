'use client';

import React, { useState, useRef } from 'react';
import { Play, RotateCcw, ShieldCheck, Terminal, AlertTriangle, CheckCircle, Wifi, WifiOff } from 'lucide-react';

interface TerminalLog {
  time: string;
  type: 'info' | 'warn' | 'success' | 'retry' | 'fatal';
  message: string;
}

export default function PlaygroundFetch() {
  const [retries, setRetries] = useState(3);
  const [errorRate, setErrorRate] = useState(60); // 60% probabilidad de fallo
  const [backoffFactor, setBackoffFactor] = useState(2);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<TerminalLog[]>([
    { time: '00:00:00', type: 'info', message: 'Terminal de safe-fetch inicializada. Presiona "Iniciar safeFetch() en vivo" para simular requests de resiliencia.' }
  ]);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [statusText, setStatusText] = useState<'idle' | 'fetching' | 'waiting' | 'success' | 'failed'>('idle');

  const runningRef = useRef(false);

  const formatTime = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
  };

  const addLog = (type: TerminalLog['type'], message: string) => {
    setLogs((prev) => [...prev, { time: formatTime(), type, message }]);
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const startSimulation = async () => {
    if (isRunning) return;
    setIsRunning(true);
    runningRef.current = true;
    setLogs([]);
    setStatusText('fetching');
    setCurrentAttempt(1);

    addLog('info', `safeFetch("https://api.github.com/v1/repos", { retries: ${retries}, backoff: ${backoffFactor}x, failureRateConfig: ${errorRate}% })`);
    await sleep(600);

    let success = false;
    let attempt = 1;

    while (attempt <= retries + 1 && runningRef.current) {
      setCurrentAttempt(attempt);
      setStatusText('fetching');
      addLog('info', `[Enviando Intento ${attempt}] Fetching de cabeceras HTTP...`);
      await sleep(1000);

      if (!runningRef.current) break;

      // Generamos el factor aleatorio de fallo simulado
      const randomValue = Math.random() * 100;
      const isFailedAttempt = randomValue < errorRate;

      if (!isFailedAttempt) {
        // ÉXITO
        success = true;
        setStatusText('success');
        addLog('success', `[¡ÉXITO EN INTENTO ${attempt}!] HTTP 200 OK. Conexión limpia establecida con el socket.`);
        addLog('info', `Respuesta segura retornada de forma diferida: { active: true, payload: "Hello World", sizeBytes: 1024, cached: false }`);
        break;
      } else {
        // FALLO
        addLog('warn', `[¡ERROR EN INTENTO ${attempt}!] HTTP 503 Service Unavailable (Mala Conectividad o Timeout de API).`);
        
        if (attempt <= retries) {
          setStatusText('waiting');
          // Calcular backoff exponencial recursivo: 1s * factor^(intento - 1)
          const waitTimeMs = 1000 * Math.pow(backoffFactor, attempt - 1);
          addLog('retry', `[RETROCESO ADAPTATIVO] Retroceso Exponencial activado. Esperando reintentar en ${waitTimeMs / 1000}s...`);
          
          // Contador dinámico visible
          let remainingSeconds = waitTimeMs / 1000;
          setCountdown(remainingSeconds);
          
          while (remainingSeconds > 0 && runningRef.current) {
            await sleep(250);
            remainingSeconds -= 0.25;
            setCountdown(Math.max(0, Math.round(remainingSeconds * 10) / 10));
          }
          setCountdown(null);
          attempt++;
        } else {
          // Ya no quedan reintentos
          setStatusText('failed');
          addLog('fatal', `[ERROR CATASTRÓFICO] Se agotaron los ${retries} reintentos máximos configurados. Terminando ejecución segura.`);
          addLog('fatal', `safeFetch error lanzado: [NetworkRetryLimitExceeded] No se obtuvo respuesta del backend.`);
          break;
        }
      }
    }

    setIsRunning(false);
  };

  const stopSimulation = () => {
    runningRef.current = false;
    setIsRunning(false);
    setCountdown(null);
    setStatusText('idle');
    addLog('warn', 'Simulación detenida manualmente por el usuario.');
  };

  return (
    <div id="playground-safe-fetch" className="space-y-6 text-[#FAFAFA]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Lado izquierdo: calibradores de red */}
        <div className="lg:col-span-5 bg-[#18181B] border border-[#27272A] p-5 rounded-2xl space-y-6">
          <div className="flex items-center gap-2 text-white font-semibold pb-2 border-b border-[#27272A]">
            <Wifi className="w-4 h-4 text-indigo-400" />
            <span>Resiliencia de Red</span>
          </div>

          {/* Reintentos máximos */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-[#A1A1AA] font-medium">Reintentos Máximos (retries)</label>
              <span className="font-mono bg-[#09090B] border border-[#27272A]/80 text-indigo-300 px-1.5 py-0.5 rounded text-[11px] font-bold">
                {retries} veces
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={retries}
              disabled={isRunning}
              onChange={(e) => setRetries(Number(e.target.value))}
              className="w-full h-1.5 bg-[#09090B] rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-30"
            />
          </div>

          {/* Probabilidad de Error */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-[#A1A1AA] font-medium">Probabilidad de Falla de Servidor</label>
              <span className="font-mono bg-red-950 text-red-400 px-1.5 py-0.5 rounded text-[11px] font-bold border border-red-900/50">
                {errorRate}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={errorRate}
              disabled={isRunning}
              onChange={(e) => setErrorRate(Number(e.target.value))}
              className="w-full h-1.5 bg-[#09090B] rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-30"
            />
            <p className="text-[10px] text-[#71717A] italic">
              *Controla la probabilidad de que falle el request HTTP original de forma aleatoria.
            </p>
          </div>

          {/* Factor de Backoff */}
          <div className="space-y-2">
            <label className="block text-xs text-[#A1A1AA] font-medium">Factor de Multiplicación (Backoff Factor)</label>
            <div className="flex gap-2">
              {[1.5, 2, 2.5, 3].map((factor) => (
                <button
                  key={factor}
                  id={`btn-factor-${factor}`}
                  disabled={isRunning}
                  onClick={() => setBackoffFactor(factor)}
                  className={`flex-1 text-center py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer disabled:opacity-30 ${
                    backoffFactor === factor
                      ? 'border-indigo-500 bg-indigo-600 text-white font-medium shadow-md shadow-indigo-500/10'
                      : 'border-[#27272A] bg-[#09090B] text-[#71717A] hover:bg-[#18181B] hover:text-[#FAFAFA]'
                  }`}
                >
                  {factor}x
                </button>
              ))}
            </div>
          </div>

          {/* Botones de acción general */}
          <div className="pt-4 border-t border-[#27272A] space-y-3">
            {!isRunning ? (
              <button
                id="btn-fetch-simulate-start"
                onClick={startSimulation}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl cursor-pointer transition shadow-lg shadow-indigo-600/15"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Iniciar safeFetch() en vivo</span>
              </button>
            ) : (
              <button
                id="btn-fetch-simulate-stop"
                onClick={stopSimulation}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl cursor-pointer transition shadow-lg shadow-rose-600/15"
              >
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Detener Simulación</span>
              </button>
            )}
            <div className="bg-[#09090B] p-3 rounded-xl border border-[#27272A] flex items-center gap-2.5">
              <span className={`w-3 h-3 rounded-full flex-shrink-0 animate-pulse ${
                statusText === 'fetching' ? 'bg-orange-500' :
                statusText === 'waiting' ? 'bg-rose-500' :
                statusText === 'success' ? 'bg-emerald-500' :
                statusText === 'failed' ? 'bg-red-600' : 'bg-neutral-500'
              }`} />
              <div className="text-[11px] text-[#A1A1AA] font-mono leading-tight">
                {statusText === 'idle' && 'Estado: En espera de simulación'}
                {statusText === 'fetching' && `Estado: Enviando Intento #${currentAttempt}...`}
                {statusText === 'waiting' && `Estado: Retroceso Exponencial (${countdown}s restantes)`}
                {statusText === 'success' && 'Estado: ¡Resuelto con éxito! HTTP 200'}
                {statusText === 'failed' && 'Estado: Excepción lanzada (Fallo permanente)'}
              </div>
            </div>
          </div>
        </div>

        {/* Lado derecho: logs de terminal retro-moderno y barra animada */}
        <div className="lg:col-span-7 bg-[#121214] text-[#FAFAFA] rounded-2xl p-5 flex flex-col justify-between shadow-xl min-h-[440px] border border-[#27272A]">
          <div>
            {/* Header de la consola de red */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#27272A]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-450" />
                <span className="text-xs font-mono font-medium tracking-wide text-[#71717A]">
                  Consola de Micro-Resiliencia HTTP
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#52525B]">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>NATIVO OFF-FLIGHT</span>
              </div>
            </div>

            {/* Terminal Logs Viewport */}
            <div className="bg-[#09090B]/60 border border-[#27272A] rounded-xl p-4 h-[280px] overflow-y-auto space-y-2.5 font-mono text-xs text-[#A1A1AA]">
              {logs.map((log, idx) => {
                const colors: { [key: string]: string } = {
                  info: 'text-[#71717A]',
                  warn: 'text-amber-350 font-medium',
                  success: 'text-emerald-400 font-bold',
                  retry: 'text-indigo-300 font-medium',
                  fatal: 'text-rose-400 border-l-2 border-rose-500 pl-2 font-bold',
                };

                const icons: { [key: string]: React.ReactNode } = {
                  info: <span className="text-[#52525B]">ℹ</span>,
                  warn: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />,
                  success: <CheckCircle className="w-3.5 h-3.5 text-emerald-450 flex-shrink-0" />,
                  retry: <Wifi className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />,
                  fatal: <WifiOff className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />,
                };

                return (
                  <div key={idx} className="flex gap-2.5 items-start leading-relaxed">
                    <span className="text-[10px] text-[#52525B] select-none pt-0.5">{log.time}</span>
                    <span className="pt-0.5">{icons[log.type]}</span>
                    <span className={colors[log.type]}>{log.message}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cronograma visual en Countdown */}
          <div className="mt-4 pt-3 border-t border-[#27272A] flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-[11px] text-[#52525B] font-mono leading-tight">
              *Factor exponencial: delay = max_backoff | retryCount = {currentAttempt}/{retries}
            </span>
            
            {countdown !== null && (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-xs text-rose-450 font-mono font-medium animate-pulse">
                  Reintentando en {countdown}s
                </span>
                <div className="w-24 h-2 bg-[#09090B] border border-[#27272A] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 transition-all duration-200"
                    style={{ width: `${(countdown / (1 * Math.pow(backoffFactor, currentAttempt - 1))) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
