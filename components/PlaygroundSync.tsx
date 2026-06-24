'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Wifi, WifiOff, Plus, Database, Cloud, Terminal } from 'lucide-react';

interface SyncItem {
  id: string;
  title: string;
  status: 'pending' | 'synced' | 'conflict';
  updatedAt: number;
  origin: 'local' | 'cloud' | 'both';
}

const BASE_TIME = 1719225600000; // Marca de tiempo estática para mantener la pureza del componente

export default function PlaygroundSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [localDB, setLocalDB] = useState<SyncItem[]>([
    { id: '1', title: 'Completar documentación de Kotlite', status: 'synced', updatedAt: BASE_TIME - 3600000, origin: 'both' },
    { id: '2', title: 'Optimizar índices en Storage.ts', status: 'synced', updatedAt: BASE_TIME - 1800000, origin: 'both' },
    { id: '3', title: 'Crear tests de transacciones CRUD', status: 'pending', updatedAt: BASE_TIME, origin: 'local' },
  ]);
  const [cloudDB, setCloudDB] = useState<SyncItem[]>([
    { id: '1', title: 'Completar documentación de Kotlite', status: 'synced', updatedAt: BASE_TIME - 3600000, origin: 'both' },
    { id: '2', title: 'Optimizar índices en Storage.ts (Modificado en Cloud)', status: 'synced', updatedAt: BASE_TIME - 600000, origin: 'cloud' },
  ]);

  const [logs, setLogs] = useState<string[]>([
    'Iniciando protocolo de sincronización KotliteSync...',
    'Base de datos local enlazada a localStorage.',
    'Listo para recibir cambios (Modo Online).'
  ]);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const addLog = (message: string) => {
    setLogs((prev) => [message, ...prev.slice(0, 14)]);
  };

  const handleAddLocal = () => {
    const newId = (localDB.length + 1).toString();
    const newItem: SyncItem = {
      id: newId,
      title: `Nuevo elemento local #${newId}`,
      status: isOnline ? 'synced' : 'pending',
      updatedAt: Date.now(),
      origin: 'local'
    };

    setLocalDB(prev => [...prev, newItem]);
    addLog(`➕ Item creado localmente en la tabla 'todos': "${newItem.title}"`);
    if (isOnline) {
      addLog(`⚡ Auto-Sync activo: El item se propagaría inmediatamente a la nube.`);
      // Encolar simulación instantánea en cloud
      setTimeout(() => {
        setCloudDB(prev => [...prev, { ...newItem, status: 'synced', origin: 'both' }]);
      }, 800);
    } else {
      addLog(`⚠️ Modo Offline: El cambio queda encolado con status 'pending'`);
    }
  };

  const handleSimulateCloudChange = () => {
    // Buscar un elemento sincronizado y modificarlo sólo en cloud para crear un conflicto
    const target = cloudDB.find(item => item.id === '2');
    if (target) {
      setCloudDB(prev =>
        prev.map(item =>
          item.id === '2'
            ? { ...item, title: 'Optimizar índices en Storage.ts (Modificado en Cloud por otro dev)', updatedAt: Date.now(), origin: 'cloud' }
            : item
        )
      );
      // En local también marcamos la discrepancia para simular conflicto
      setLocalDB(prev =>
        prev.map(item =>
          item.id === '2' ? { ...item, status: 'conflict' } : item
        )
      );
      addLog(`☁️ Simulación: Otro desarrollador modificó el item #2 directamente en Cloud.`);
      addLog(`⚠️ Discrepancia detectada en item #2. Conflicto potencial registrado.`);
    }
  };

  const handleSync = () => {
    if (!isOnline) {
      addLog(`❌ Sincronización fallida: No hay conexión a Internet.`);
      return;
    }

    setIsSyncing(true);
    addLog(`🔄 Iniciando sincronización de datos bidireccional...`);

    setTimeout(() => {
      // 1. Resolver pendientes locales (se suben a la nube)
      const pendingItems = localDB.filter(item => item.status === 'pending');
      const updatedCloud: SyncItem[] = [...cloudDB];

      pendingItems.forEach(item => {
        const alreadyInCloud = updatedCloud.find(c => c.id === item.id);
        if (!alreadyInCloud) {
          updatedCloud.push({ ...item, status: 'synced', origin: 'both' });
        }
      });

      // 2. Resolver conflictos usando LWW (Last-Write-Wins)
      const resolvedLocal: SyncItem[] = localDB.map(localItem => {
        const cloudItem = updatedCloud.find(c => c.id === localItem.id);
        if (cloudItem) {
          // Si tienen el mismo ID pero diferentes contenidos, comparamos timestamps
          if (localItem.title !== cloudItem.title) {
            const isLocalNewer = localItem.updatedAt > cloudItem.updatedAt;
            addLog(`⚖️ Resolviendo conflicto en item #${localItem.id} mediante LWW (Last-Write-Wins)...`);
            if (isLocalNewer) {
              addLog(`  -> Local es más reciente. Propagando versión local a Cloud.`);
              // Actualizamos la nube con lo local
              const idx = updatedCloud.findIndex(c => c.id === localItem.id);
              updatedCloud[idx] = { ...localItem, status: 'synced', origin: 'both' };
              return { ...localItem, status: 'synced', origin: 'both' };
            } else {
              addLog(`  -> Cloud es más reciente (${new Date(cloudItem.updatedAt).toLocaleTimeString()}). Sobrescribiendo Local.`);
              return { ...cloudItem, status: 'synced', origin: 'both' };
            }
          }
          return { ...localItem, status: 'synced', origin: 'both' };
        }
        return { ...localItem, status: 'synced', origin: 'both' };
      });

      // Asegurar que todos los items de cloud estén en local también
      updatedCloud.forEach(cloudItem => {
        const existsInLocal = resolvedLocal.find(l => l.id === cloudItem.id);
        if (!existsInLocal) {
          resolvedLocal.push({ ...cloudItem, status: 'synced', origin: 'both' });
        }
      });

      setLocalDB(resolvedLocal);
      setCloudDB(updatedCloud);
      setIsSyncing(false);
      addLog(`✅ Sincronización completada con éxito. Ambos almacenes están armonizados.`);
      addLog(`📦 Delta transmitido: ${JSON.stringify(pendingItems.map(i => i.id))} (${(Math.random() * 200 + 40).toFixed(0)} bytes)`);
    }, 1500);
  };

  const handleToggleOnline = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    addLog(`🌐 Red cambiada a: ${nextState ? 'ONLINE (Conectado)' : 'OFFLINE (Desconectado)'}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Barra de Controles Superiores */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-[#18181B] border border-[#27272A] rounded-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleOnline}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition select-none border ${
              isOnline
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
            }`}
          >
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span>Red: {isOnline ? 'Online' : 'Offline'}</span>
          </button>

          <span className="text-[11px] text-[#71717A] font-mono">
            Estrategia de Conflicto: <span className="text-indigo-400 font-bold">LWW</span>
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAddLocal}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#09090B] hover:bg-[#27272A] border border-[#27272A] rounded-xl text-xs text-white font-medium cursor-pointer transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Local</span>
          </button>

          <button
            onClick={handleSimulateCloudChange}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#09090B] hover:bg-[#27272A] border border-[#27272A] rounded-xl text-xs text-amber-400 font-medium cursor-pointer transition"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Simular Cambio Cloud</span>
          </button>

          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-lg shadow-indigo-500/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sincronizar ⚡</span>
          </button>
        </div>
      </div>

      {/* Visualizador de Bases de Datos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Base de Datos Local */}
        <div className="bg-[#18181B]/50 border border-[#27272A] p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-400" />
              Kotlite DB (Cliente Local)
            </h4>
            <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded font-mono">
              In-Memory/Storage
            </span>
          </div>

          <div className="space-y-2 min-h-[140px]">
            {localDB.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-[#09090B] border border-[#27272A] rounded-xl flex items-center justify-between text-xs"
              >
                <div className="space-y-1 min-w-0 flex-1 pr-3">
                  <p className="font-medium text-white truncate font-mono">{item.title}</p>
                  <p className="text-[10px] text-[#71717A] font-mono">
                    Modificado: {new Date(item.updatedAt).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  {item.status === 'pending' && (
                    <span className="text-[9px] bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
                      Pendiente
                    </span>
                  )}
                  {item.status === 'synced' && (
                    <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold">
                      Sincronizado
                    </span>
                  )}
                  {item.status === 'conflict' && (
                    <span className="text-[9px] bg-red-500/10 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
                      Conflicto
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Base de Datos Cloud */}
        <div className="bg-[#18181B]/50 border border-[#27272A] p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-emerald-400" />
              Cloud Server Database (Nube)
            </h4>
            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded font-mono">
              Firestore / Postgres
            </span>
          </div>

          <div className="space-y-2 min-h-[140px]">
            {cloudDB.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-[#09090B] border border-[#27272A] rounded-xl flex items-center justify-between text-xs"
              >
                <div className="space-y-1 min-w-0 flex-1 pr-3">
                  <p className="font-medium text-white truncate font-mono">{item.title}</p>
                  <p className="text-[10px] text-[#71717A] font-mono">
                    Modificado: {new Date(item.updatedAt).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold">
                    Sincronizado
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Consola de Logs en Tiempo Real */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between text-[#71717A] pb-1 border-b border-[#27272A]">
          <span className="text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            Consola del Protocolo KotliteSync
          </span>
          <span className="text-[9px] font-mono">STABLE-PROTOCOL v1.0</span>
        </div>

        <div className="font-mono text-[11px] text-[#A1A1AA] space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {logs.map((log, i) => (
              <motion.div
                key={logs.length - i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="leading-relaxed border-l-2 border-indigo-500/30 pl-2 py-0.5"
              >
                <span className="text-indigo-400 select-none mr-1.5">❯</span>
                {log}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
