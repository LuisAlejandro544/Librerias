'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  createStridbDatabase, 
  StridbDatabase,
  StridbDebug,
  StridbBackup,
  StridbCrypto,
  StridbStoragePersistence,
  StridbInactivityManager,
  StridbLLMKeyVault,
  LLMKeyRecord,
  useStridbQuery
} from '../librerias/stridb';
import { 
  Plus, Trash2, ShieldAlert, Sparkles, Database, Code, 
  Terminal, Search, ToggleLeft, ToggleRight, Download, Upload, 
  Activity, RefreshCw, AlertTriangle, CheckSquare, Square,
  Lock, Unlock, Eye, EyeOff, Key, Shield, ShieldCheck, Clock
} from 'lucide-react';

// Create or retrieve sandbox database
const stridbSandbox = createStridbDatabase("stridb_sandbox_db", 1);

// Configure the database schema for Tasks (with an encrypted secret_note column!)
stridbSandbox.table("tasks", (t) => {
  t.integer("id").primaryKey().autoIncrement();
  t.text("title").notNull().unique();
  t.text("category").default("Trabajo");
  t.boolean("completed").default(false);
  t.integer("priority").default(2); // 1 = High, 2 = Medium, 3 = Low
  t.text("secret_note").encrypt(); // <-- Column encrypted!
});

const RANDOM_TITLES = [
  "Refactorizar endpoints asíncronos", "Escribir test de integración",
  "Optimizar índices en SQLite", "Diseñar interfaz de usuario bento",
  "Revisar pull request de base de datos", "Crear copias de seguridad de producción",
  "Limpiar cookies de sesión inseguras", "Actualizar dependencias de React 19",
  "Configurar volumen de datos persistente", "Documentar esquema modular Stridb"
];

const CATEGORIES = ["Trabajo", "Personal", "Estudios", "Urgente"];

interface ConsoleLogItem {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'query';
}

export default function PlaygroundStridb() {
  const { data: tasks = [], refetch: refetchTasks } = useStridbQuery<any>(
    stridbSandbox,
    "tasks"
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [completedFilter, setCompletedFilter] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customCategory, setCustomCategory] = useState("Trabajo");
  const [customPriority, setCustomPriority] = useState(2);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogItem[]>([]);
  
  // Encryption States
  const [masterKey, setMasterKey] = useState("ClaveSecreta123");
  const [secretNoteInput, setSecretNoteInput] = useState("");
  const [rawRecords, setRawRecords] = useState<any[]>([]);
  const [showRawView, setShowRawView] = useState(false);
  
  // New Stridb Modular Extension States
  const [isPersisted, setIsPersisted] = useState(false);
  const [storageEstimate, setStorageEstimate] = useState<{ used: number; quota: number; percent: number } | null>(null);
  const [inactivityTimeout, setInactivityTimeout] = useState(0); // 0 = disabled, else ms
  const [vaultRecords, setVaultRecords] = useState<any[]>([]);
  const [newProvider, setNewProvider] = useState("Gemini");
  const [newKeyName, setNewKeyName] = useState("Clave de Producción");
  const [newLLMKey, setNewLLMKey] = useState("");
  const [decryptedKeys, setDecryptedKeys] = useState<Record<string, string>>({}); // key is provider:name
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Load raw records directly using IndexedDB to showcase encrypted state
  const loadRawRecords = useCallback(() => {
    if (typeof window === "undefined" || !window.indexedDB) return;
    try {
      const request = window.indexedDB.open("stridb_sandbox_db");
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("tasks")) return;
        const tx = db.transaction(["tasks"], "readonly");
        const store = tx.objectStore("tasks");
        const req = store.getAll();
        req.onsuccess = (event: any) => {
          setRawRecords(event.target.result || []);
        };
      };
    } catch {
      // fail silently
    }
  }, []);

  // Update raw encrypted records whenever the reactive tasks update
  useEffect(() => {
    loadRawRecords();
  }, [tasks, loadRawRecords]);

  // Maintain loadAllTasks wrapper for backwards compatibility
  const loadAllTasks = useCallback(async () => {
    try {
      await refetchTasks();
      loadRawRecords();
    } catch (e: any) {
      setErrorMessage("Error cargando tareas: " + e.message);
    }
  }, [refetchTasks, loadRawRecords]);

  // Storage Persistence Actions
  const checkPersistence = useCallback(async () => {
    const persisted = await StridbStoragePersistence.isPersisted();
    setIsPersisted(persisted);
    const est = await StridbStoragePersistence.estimateStorage();
    setStorageEstimate(est);
  }, []);

  const handleRequestPersistence = async () => {
    setErrorMessage("");
    await StridbStoragePersistence.requestPersistence();
    await checkPersistence();
  };

  // LLM Key Vault Actions
  const loadVaultKeys = useCallback(() => {
    const records = StridbLLMKeyVault.getAllRecords();
    setVaultRecords(records);
  }, []);

  const handleSaveLLMKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!newLLMKey.trim()) {
      setErrorMessage("Escribe una clave de API de LLM válida.");
      return;
    }
    const ok = await StridbLLMKeyVault.saveKey(newProvider, newKeyName, newLLMKey, masterKey);
    if (ok) {
      setNewLLMKey("");
      loadVaultKeys();
    } else {
      setErrorMessage("Error al guardar la clave de API. Verifica que la clave maestra esté configurada.");
    }
  };

  const handleDecryptLLMKey = async (provider: string, name: string) => {
    setErrorMessage("");
    const keyIdentifier = `${provider}:${name}`;
    if (decryptedKeys[keyIdentifier]) {
      // Toggle visibility
      setDecryptedKeys(prev => {
        const copy = { ...prev };
        delete copy[keyIdentifier];
        return copy;
      });
      return;
    }

    const decrypted = await StridbLLMKeyVault.retrieveKey(provider, name, masterKey);
    if (decrypted) {
      setDecryptedKeys(prev => ({ ...prev, [keyIdentifier]: decrypted }));
    } else {
      setErrorMessage("No se pudo desencriptar la clave. Asegúrate de que la Clave Maestra sea la correcta.");
    }
  };

  const handleDeleteLLMKey = (provider: string, name: string) => {
    StridbLLMKeyVault.deleteKey(provider, name);
    const keyIdentifier = `${provider}:${name}`;
    setDecryptedKeys(prev => {
      const copy = { ...prev };
      delete copy[keyIdentifier];
      return copy;
    });
    loadVaultKeys();
  };

  // Set up inactivity & persistence monitors
  useEffect(() => {
    const timer = setTimeout(() => {
      checkPersistence();
      loadVaultKeys();
    }, 0);
    return () => clearTimeout(timer);
  }, [checkPersistence, loadVaultKeys]);

  useEffect(() => {
    if (inactivityTimeout > 0) {
      StridbInactivityManager.configureAutoDestruct(
        stridbSandbox,
        inactivityTimeout,
        () => {
          setErrorMessage("⚠️ Base de datos autodestruida por inactividad. Se borró todo IndexedDB.");
          refetchTasks();
          loadRawRecords();
        }
      );
    } else {
      StridbInactivityManager.configureAutoDestruct(stridbSandbox, 0);
    }
    return () => {
      StridbInactivityManager.stop();
    };
  }, [inactivityTimeout, loadRawRecords, refetchTasks]);

  // Keep Stridb masterKey in sync with state
  useEffect(() => {
    if (masterKey) {
      stridbSandbox.setEncryptionKey(masterKey);
    } else {
      stridbSandbox.setEncryptionKey("");
    }
    // Defer loading to prevent cascading render warnings in effect
    const timer = setTimeout(() => {
      loadAllTasks();
    }, 0);
    return () => clearTimeout(timer);
  }, [masterKey, loadAllTasks]);

  // Hook StridbDebug callbacks to render console logs in the visual terminal
  useEffect(() => {
    StridbDebug.setOnLog((message, type) => {
      const now = new Date();
      const timestamp = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
      
      setConsoleLogs(prev => [
        ...prev.slice(-39), // Keep last 40 logs
        {
          id: Math.random().toString(36).substring(7),
          timestamp,
          message,
          type
        }
      ]);
    });

    // Initial connection trigger
    stridbSandbox.connect().then(() => {
      loadAllTasks();
    });

    return () => {
      StridbDebug.setOnLog(() => {}); // cleanup
    };
  }, [loadAllTasks]);

  // Scroll virtual terminal to bottom on new log
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  // Insert task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const titleToInsert = customTitle.trim() || RANDOM_TITLES[Math.floor(Math.random() * RANDOM_TITLES.length)];
    const categoryToInsert = customTitle.trim() ? customCategory : CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const secretNoteToInsert = customTitle.trim() 
      ? secretNoteInput.trim() 
      : "Clave_API::live_sk_" + Math.random().toString(36).substring(2, 10).toUpperCase();

    try {
      await stridbSandbox.insert("tasks", {
        title: titleToInsert,
        category: categoryToInsert,
        completed: false,
        priority: Number(customPriority),
        secret_note: secretNoteToInsert
      });
      setCustomTitle("");
      setSecretNoteInput("");
      loadAllTasks();
    } catch (err: any) {
      setErrorMessage(err.message || "Violación de restricción única detectada");
    }
  };

  // Toggle completed state
  const handleToggleCompleted = async (id: number, currentCompleted: boolean) => {
    setErrorMessage("");
    try {
      await stridbSandbox.update("tasks", id, { completed: !currentCompleted });
      loadAllTasks();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Delete task
  const handleDeleteTask = async (id: number) => {
    setErrorMessage("");
    try {
      await stridbSandbox.delete("tasks", id);
      loadAllTasks();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Truncate tasks table
  const handleTruncate = async () => {
    setErrorMessage("");
    try {
      await stridbSandbox.truncate("tasks");
      loadAllTasks();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Export JSON Backup
  const handleExportBackup = async () => {
    try {
      const backupEngine = new StridbBackup(stridbSandbox);
      const data = await backupEngine.exportJSON();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stridb_backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMessage("Error al exportar: " + err.message);
    }
  };

  // Import JSON mock backup (Seed values)
  const handleImportSeed = async () => {
    setErrorMessage("");
    try {
      const seedData = {
        tasks: [
          { id: 1, title: "🚀 Inicializar Stridb en producción", category: "Urgente", completed: true, priority: 1 },
          { id: 2, title: "✏️ Configurar esquemas estructurados", category: "Trabajo", completed: true, priority: 1 },
          { id: 3, title: "🔍 Probar planes de ejecución indexados", category: "Trabajo", completed: false, priority: 2 },
          { id: 4, title: "📦 Descargar paquete offline de prueba", category: "Personal", completed: false, priority: 3 }
        ]
      };
      const backupEngine = new StridbBackup(stridbSandbox);
      await backupEngine.importJSON(seedData);
      loadAllTasks();
    } catch (err: any) {
      setErrorMessage("Error de importación: " + err.message);
    }
  };

  // Filter task rows locally using computed React values that match Stridb queries
  const filteredTasks = useMemo(() => {
    let list = [...tasks];

    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(lower) || t.category.toLowerCase().includes(lower));
    }

    if (categoryFilter !== "all") {
      list = list.filter(t => t.category === categoryFilter);
    }

    if (completedFilter !== "all") {
      const targetCompleted = completedFilter === "true";
      list = list.filter(t => t.completed === targetCompleted);
    }

    // Sort by priority ASC (High -> Low), then ID DESC
    return list.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return b.id - a.id;
    });
  }, [tasks, searchQuery, categoryFilter, completedFilter]);

  // Compile Stridb chaining query string representation in real-time
  const liveQueryCode = useMemo(() => {
    let code = `await db.query("tasks")`;
    if (searchQuery.trim()) {
      code += `\n  .where(t => t.title.includes("${searchQuery}"))`;
    }
    if (categoryFilter !== "all") {
      code += `\n  .where(t => t.category === "${categoryFilter}")`;
    }
    if (completedFilter !== "all") {
      code += `\n  .where(t => t.completed === ${completedFilter})`;
    }
    code += `\n  .orderBy("priority", "ASC")\n  .execute();`;
    return code;
  }, [searchQuery, categoryFilter, completedFilter]);

  return (
    <div id="playground-stridb" className="space-y-6">
      
      {/* Alert Panel */}
      {errorMessage && (
        <div className="bg-rose-950/40 border border-rose-500/30 text-rose-300 p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in font-mono">
          <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <p className="leading-relaxed">{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Control Column (Insert & Filters) */}
        <div className="lg:col-span-5 bg-[#18181B] border border-[#27272A] p-5 rounded-2xl flex flex-col justify-between space-y-6 text-white">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
              <span className="text-white font-semibold flex items-center gap-2 text-sm font-mono">
                <Database className="w-4 h-4 text-[#818cf8]" />
                Tablas SQLite-like en IDB
              </span>
              <button
                id="btn-truncate-stridb"
                onClick={handleTruncate}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-medium font-mono cursor-pointer transition"
              >
                Truncar Tabla 🧹
              </button>
            </div>

            {/* Clave de Cifrado (StridbCrypto) */}
            <div className="bg-[#09090B] p-4 rounded-xl border border-[#27272A] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-indigo-400 font-mono font-bold block uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  Clave Maestra de Encriptación
                </span>
                <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-900/50 px-1.5 py-0.5 rounded font-mono font-semibold flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> AES-GCM
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Sin clave (Cifrado deshabilitado)..."
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#52525B] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
              <p className="text-[9px] text-[#71717A] leading-normal font-mono">
                *Cifra automáticamente la columna <code className="text-indigo-300">secret_note</code> antes de guardarla en IndexedDB. Al cambiar o borrar la clave verás el cryptograma crudo.
              </p>
            </div>

            {/* Formulario de Inserción */}
            <form onSubmit={handleAddTask} className="space-y-3 bg-[#09090B] p-4 rounded-xl border border-[#27272A]">
              <span className="text-[10px] text-[#71717A] font-mono font-bold block uppercase tracking-wider">
                Insertar Registro Estricto (db.insert)
              </span>
              
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Título de tarea estructurada..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />

                {customTitle.trim() && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[9px] text-[#71717A] font-mono font-bold block mb-1">NOTA SECRETA (COLUMNA ENCRIPTADA)</label>
                      <input
                        type="text"
                        placeholder="Contraseña, API key o secreto..."
                        value={secretNoteInput}
                        onChange={(e) => setSecretNoteInput(e.target.value)}
                        className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-[#71717A] font-mono font-bold block mb-1">CATEGORÍA</label>
                        <select
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] text-[#71717A] font-mono font-bold block mb-1">PRIORIDAD</label>
                        <select
                          value={customPriority}
                          onChange={(e) => setCustomPriority(Number(e.target.value))}
                          className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                        >
                          <option value={1}>1 - Alta 🔴</option>
                          <option value={2}>2 - Media 🟡</option>
                          <option value={3}>3 - Baja 🟢</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                id="btn-add-task-stridb"
                className="w-full flex items-center justify-center gap-1.5 text-xs bg-[#818cf8] hover:bg-indigo-600 text-white font-semibold px-3 py-2 rounded-lg cursor-pointer transition shadow-md shadow-indigo-500/10"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{customTitle.trim() ? "Insertar Fila" : "Generar Fila Aleatoria"}</span>
              </button>
            </form>

            {/* Filtros de Consulta */}
            <div className="bg-[#09090B] p-4 rounded-xl border border-[#27272A] space-y-3">
              <span className="text-[10px] text-[#71717A] font-mono font-bold block uppercase tracking-wider">
                Búsqueda Indexada (db.query)
              </span>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar por título, categoría..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-[#71717A] font-semibold font-mono block mb-1">CATEGORÍA</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="all">Todas</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] text-[#71717A] font-semibold font-mono block mb-1">ESTADO</label>
                  <select
                    value={completedFilter}
                    onChange={(e) => setCompletedFilter(e.target.value)}
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="all">Cualquiera</option>
                    <option value="true">Completadas</option>
                    <option value="false">Pendientes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Portabilidad y Respaldo */}
            <div className="bg-[#09090B] p-4 rounded-xl border border-[#27272A] space-y-2.5">
              <span className="text-[10px] text-[#71717A] font-mono font-bold block uppercase tracking-wider">
                Portabilidad de Datos (StridbBackup)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="flex items-center justify-center gap-1 bg-[#18181B] hover:bg-[#27272A] text-xs py-1.5 rounded-lg text-indigo-300 font-semibold cursor-pointer border border-[#27272A] transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar</span>
                </button>
                <button
                  type="button"
                  onClick={handleImportSeed}
                  className="flex items-center justify-center gap-1 bg-[#18181B] hover:bg-[#27272A] text-xs py-1.5 rounded-lg text-emerald-400 font-semibold cursor-pointer border border-[#27272A] transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Cargar Semilla</span>
                </button>
              </div>
            </div>

            {/* Control de Resiliencia y Almacenamiento Persistente */}
            <div className="bg-[#09090B] p-4 rounded-xl border border-[#27272A] space-y-3">
              <span className="text-[10px] text-[#818cf8] font-mono font-bold block uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                Resiliencia y Persistencia de Almacenamiento
              </span>
              
              {/* Persistent storage status */}
              <div className="flex items-center justify-between bg-[#18181B] border border-[#27272A] p-2.5 rounded-lg">
                <div className="space-y-0.5 flex-1 pr-2">
                  <div className="text-[9px] text-[#A1A1AA] font-mono font-bold flex items-center gap-1 uppercase">
                    {isPersisted ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    )}
                    PERSISTENCIA: {isPersisted ? "ACTIVADA (BLOQUEADA)" : "PASIVA (EVITABLE)"}
                  </div>
                  <div className="text-[8px] text-[#71717A] font-mono leading-normal">
                    {isPersisted 
                      ? "El navegador promete no borrar la base de datos bajo presión de disco."
                      : "El navegador podría borrar la base de datos si falta espacio libre."
                    }
                  </div>
                </div>
                {!isPersisted && (
                  <button
                    type="button"
                    onClick={handleRequestPersistence}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[9px] px-2 py-1 rounded transition cursor-pointer font-mono uppercase"
                  >
                    BLOQUEAR
                  </button>
                )}
              </div>

              {/* Inactivity Auto-destruct timer configuration */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] text-[#71717A] font-bold font-mono uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3 text-rose-400" />
                    Autodestrucción por Inactividad
                  </label>
                  {inactivityTimeout > 0 && (
                    <span className="text-[8px] bg-rose-950 text-rose-300 px-1.5 py-0.5 rounded border border-rose-900/40 font-mono font-bold animate-pulse">
                      ACTIVO
                    </span>
                  )}
                </div>
                <select
                  value={inactivityTimeout}
                  onChange={(e) => setInactivityTimeout(Number(e.target.value))}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none font-mono"
                >
                  <option value={0}>🚫 Deshabilitada (Mantener datos siempre)</option>
                  <option value={5000}>⏱️ Autodestruir tras 5 segundos de inactividad</option>
                  <option value={15000}>⏱️ Autodestruir tras 15 segundos de inactividad</option>
                  <option value={30000}>⏱️ Autodestruir tras 30 segundos de inactividad</option>
                  <option value={60000}>⏱️ Autodestruir tras 1 minuto de inactividad</option>
                </select>
                <p className="text-[8px] text-[#71717A] font-mono leading-normal">
                  *Cualquier inserción o cambio reinicia el temporizador. Si expira, la base se elimina de IndexedDB por seguridad.
                </p>
              </div>

              {/* Storage usage estimate */}
              {storageEstimate && (
                <div className="bg-[#18181B]/55 border border-[#27272A]/50 p-2 rounded-lg text-[8px] font-mono text-[#71717A] space-y-1">
                  <div className="flex justify-between">
                    <span>Espacio Usado Estimado:</span>
                    <span className="text-[#A1A1AA]">{(storageEstimate.used / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cuota Máxima Permitida:</span>
                    <span className="text-[#A1A1AA]">{(storageEstimate.quota / (1024 * 1024 * 1024)).toFixed(1)} GB</span>
                  </div>
                  <div className="w-full bg-[#27272A] h-1 rounded-full overflow-hidden mt-1">
                    <div 
                      className="bg-indigo-500 h-full rounded-full" 
                      style={{ width: `${Math.max(1, storageEstimate.percent)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#27272A] text-[10px] text-[#71717A] font-mono leading-relaxed">
            *Las escrituras y búsquedas se procesan en la base asíncrona local de IndexedDB y disparan alertas de telemetría instantáneas.
          </div>
        </div>

        {/* Right Columns (Database Result Viewer & Console) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active Records Table */}
          <div className="bg-[#121214] border border-[#27272A] text-[#FAFAFA] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#27272A] gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#818cf8]" />
                  <span className="text-xs text-[#A1A1AA] font-bold uppercase tracking-wider font-mono">
                    Tabla de Registros IndexedDB
                  </span>
                </div>
                <div className="flex gap-1 bg-[#09090B] p-1 rounded-lg border border-[#27272A]">
                  <button 
                    type="button"
                    onClick={() => setShowRawView(false)}
                    className={`px-2 py-1 rounded text-[9px] font-mono font-bold transition cursor-pointer ${!showRawView ? 'bg-indigo-600 text-white' : 'text-[#71717A] hover:text-[#A1A1AA]'}`}
                  >
                    VISTA DECODIFICADA
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowRawView(true)}
                    className={`px-2 py-1 rounded text-[9px] font-mono font-bold transition cursor-pointer flex items-center gap-1 ${showRawView ? 'bg-rose-950 text-rose-300 border border-rose-900/40' : 'text-[#71717A] hover:text-[#A1A1AA]'}`}
                  >
                    <Lock className="w-2.5 h-2.5" /> RAW CIFRADO IDB
                  </button>
                </div>
              </div>

              {/* Code compiled live */}
              <div className="bg-[#09090B] p-2.5 rounded-xl border border-[#27272A]">
                <span className="text-[9px] text-[#71717A] font-mono font-bold block uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Code className="w-3.5 h-3.5" />
                  Query asíncrona en caliente compilada:
                </span>
                <pre className="text-xs text-indigo-300 font-mono overflow-x-auto leading-relaxed select-all">
                  {liveQueryCode}
                </pre>
              </div>

              {/* Matching rows */}
              <div className="space-y-2">
                <span className="text-[10px] text-[#71717A] font-mono font-bold block uppercase tracking-wider">
                  {showRawView ? "Registros Crudos en IndexedDB (Cifrados)" : `Resultados del Filtro (${filteredTasks.length})`}
                </span>

                <div className="max-h-[170px] overflow-y-auto space-y-1.5 pr-1">
                  {showRawView ? (
                    rawRecords.length === 0 ? (
                      <div className="text-center py-8 bg-[#09090B]/60 rounded-xl border border-[#27272A] text-xs text-[#71717A] italic font-mono">
                        No hay registros en IndexedDB.
                      </div>
                    ) : (
                      rawRecords.map((rec) => (
                        <div
                          key={rec.id}
                          className="bg-rose-950/10 border border-rose-900/20 p-2.5 rounded-xl space-y-1 hover:border-rose-900/40 transition font-mono"
                        >
                          <div className="flex items-center justify-between text-[10px] text-rose-400 font-bold">
                            <span>ID: {rec.id} (Fila en IndexedDB)</span>
                            <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-900/40 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> RAW CIFRADO
                            </span>
                          </div>
                          <div className="text-[11px] text-[#A1A1AA] space-y-1">
                            <div><span className="text-[#52525B]">title:</span> {rec.title}</div>
                            <div><span className="text-[#52525B]">category:</span> {rec.category}</div>
                            <div>
                              <span className="text-rose-400 font-bold">secret_note (columna cifrada):</span>{" "}
                              <span className="text-rose-300/80 break-all select-all font-mono font-semibold bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-900/30 block mt-1">
                                {rec.secret_note || "undefined"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )
                  ) : (
                    filteredTasks.length === 0 ? (
                      <div className="text-center py-8 bg-[#09090B]/60 rounded-xl border border-[#27272A] text-xs text-[#71717A] italic font-mono">
                        La consulta no retornó registros de IndexedDB.
                      </div>
                    ) : (
                      filteredTasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-[#18181B]/80 border border-[#27272A] p-2.5 rounded-xl flex items-center justify-between gap-4 hover:border-indigo-500/20 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => handleToggleCompleted(task.id, task.completed)}
                              className="text-[#71717A] hover:text-white transition cursor-pointer"
                            >
                              {task.completed ? (
                                <CheckSquare className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Square className="w-4 h-4 text-[#71717A]" />
                              )}
                            </button>
                            
                            <div className="min-w-0 flex-1">
                              <h5 className={`text-xs font-bold font-mono truncate ${task.completed ? 'line-through text-[#71717A]' : 'text-white'}`}>
                                {task.title}
                              </h5>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] bg-[#09090B] border border-[#27272A] text-[#A1A1AA] px-1.5 rounded font-mono">
                                  {task.category}
                                </span>
                                <span className={`text-[9px] font-mono px-1.5 rounded ${
                                  task.priority === 1 ? 'bg-rose-950 text-rose-300 border border-rose-900/50' :
                                  task.priority === 2 ? 'bg-amber-950 text-amber-300 border border-amber-900/50' :
                                  'bg-emerald-950 text-emerald-300 border border-emerald-900/50'
                                }`}>
                                  Prioridad: {task.priority === 1 ? 'Alta' : task.priority === 2 ? 'Media' : 'Baja'}
                                </span>
                              </div>
                              {task.secret_note && (
                                <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-indigo-300 font-mono bg-indigo-950/30 border border-indigo-900/30 px-2 py-1 rounded-md">
                                  {masterKey ? (
                                    <Unlock className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                                  ) : (
                                    <Lock className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                  )}
                                  <span className="text-[#A1A1AA] select-none font-sans">Secret:</span>
                                  <span className="font-semibold select-all truncate">{task.secret_note}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-[#52525B] font-mono">id: {task.id}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1.5 bg-rose-950/20 border border-rose-900/30 text-rose-400 hover:bg-rose-900 hover:text-white rounded-lg cursor-pointer transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Styled Terminal Output Panel connected directly to StridbDebug */}
          <div className="bg-[#09090B] border border-[#27272A] rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-[#18181B] border-b border-[#27272A] px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#818cf8]" />
                <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                  Terminal de Diagnóstico Stridb (`StridbDebug`)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] text-[#71717A] font-mono">CONECTADO</span>
              </div>
            </div>

            {/* Scrolling Logs Display area */}
            <div className="p-4 h-[190px] overflow-y-auto font-mono text-[10px] space-y-1.5 scrollbar-thin scrollbar-thumb-[#27272A]">
              {consoleLogs.length === 0 ? (
                <div className="text-center py-12 text-[#52525B] italic">
                  Presiona el botón &quot;Insertar Fila&quot; o realiza consultas para inyectar telemetría en tiempo real...
                </div>
              ) : (
                consoleLogs.map((log) => {
                  let badgeColor = "text-[#818cf8] bg-indigo-950/40 border-indigo-900/30";
                  if (log.type === 'success') badgeColor = "text-emerald-400 bg-emerald-950/40 border-emerald-900/30";
                  if (log.type === 'warn') badgeColor = "text-amber-400 bg-amber-950/40 border-amber-900/30";
                  if (log.type === 'error') badgeColor = "text-rose-400 bg-rose-950/40 border-rose-900/30";
                  if (log.type === 'query') badgeColor = "text-purple-400 bg-purple-950/40 border-purple-900/30";

                  return (
                    <div key={log.id} className="flex items-start gap-2 border-b border-[#27272A]/20 pb-1 last:border-0">
                      <span className="text-[#52525B] select-none flex-shrink-0">{log.timestamp}</span>
                      <span className={`text-[8px] font-bold px-1.5 rounded border flex-shrink-0 uppercase ${badgeColor}`}>
                        {log.type}
                      </span>
                      <span className="text-[#E4E4E7] break-all leading-relaxed">{log.message}</span>
                    </div>
                  );
                })
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>

        </div>

      </div>

      {/* Bóveda Segura de Claves de API de LLMs (StridbLLMKeyVault) */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 text-white space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272A] flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-1.5 uppercase">
                Bóveda de Claves de API de LLMs <span className="text-[10px] text-[#818cf8] font-normal lowercase">(StridbLLMKeyVault)</span>
              </h3>
              <p className="text-[10px] text-[#71717A] font-mono leading-none">Cifra y guarda claves de Inteligencia Artificial locales usando AES-GCM</p>
            </div>
          </div>
          <div className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-900/50 px-2 py-0.5 rounded font-mono font-bold">
            MASTER PASS: {masterKey ? "CONFIGURADO" : "SIN CONFIGURAR"}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Formulario de registro de clave */}
          <form onSubmit={handleSaveLLMKey} className="md:col-span-5 bg-[#09090B] p-4 rounded-xl border border-[#27272A] space-y-3">
            <span className="text-[10px] text-[#71717A] font-mono font-bold block uppercase tracking-wider">
              Registrar Clave de API
            </span>
            
            <div className="space-y-2.5">
              <div>
                <label className="text-[9px] text-[#71717A] font-bold font-mono block mb-1">PROVEEDOR DE IA / LLM</label>
                <select
                  value={newProvider}
                  onChange={(e) => setNewProvider(e.target.value)}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none font-mono"
                >
                  <option value="Gemini">Google Gemini ♊</option>
                  <option value="OpenAI">OpenAI ChatGPT 🤖</option>
                  <option value="Anthropic">Anthropic Claude 🦉</option>
                  <option value="DeepSeek">DeepSeek AI 🐳</option>
                  <option value="Cohere">Cohere Command 🌀</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] text-[#71717A] font-bold font-mono block mb-1">IDENTIFICADOR / NOMBRE</label>
                <input
                  type="text"
                  placeholder="Ej: Clave de Desarrollo, Prod-01..."
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] text-[#71717A] font-bold font-mono block mb-1 flex justify-between items-center">
                  <span>VALOR DE LA CLAVE DE API</span>
                  <span className="text-[8px] bg-[#18181B] border border-[#27272A] text-[#71717A] px-1.5 py-0.5 rounded font-mono font-semibold uppercase">
                    SE CIFRA CON AES
                  </span>
                </label>
                <input
                  type="password"
                  placeholder="Ingresa tu clave de API aquí..."
                  value={newLLMKey}
                  onChange={(e) => setNewLLMKey(e.target.value)}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-2 rounded-lg cursor-pointer transition shadow-md shadow-indigo-500/10 font-mono"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Cifrar y Guardar Clave</span>
            </button>
          </form>

          {/* Listado de claves guardadas en bóveda */}
          <div className="md:col-span-7 bg-[#09090B] p-4 rounded-xl border border-[#27272A] flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[10px] text-[#71717A] font-mono font-bold block uppercase tracking-wider">
                Bóveda de Secretos Guardados ({vaultRecords.length})
              </span>

              <div className="max-h-[190px] overflow-y-auto space-y-2 pr-1">
                {vaultRecords.length === 0 ? (
                  <div className="text-center py-10 text-xs text-[#71717A] italic font-mono border border-dashed border-[#27272A] rounded-xl bg-[#18181B]/30">
                    No hay claves de API de LLMs cifradas en la bóveda local.
                  </div>
                ) : (
                  vaultRecords.map((rec) => {
                    const keyIdentifier = `${rec.provider}:${rec.name}`;
                    const isVisible = !!decryptedKeys[keyIdentifier];
                    return (
                      <div
                        key={keyIdentifier}
                        className="bg-[#18181B]/80 border border-[#27272A] p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-500/20 transition font-mono"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold text-white uppercase bg-indigo-950/60 text-indigo-300 border border-indigo-900/50 px-1.5 py-0.5 rounded">
                              {rec.provider}
                            </span>
                            <span className="text-xs font-semibold text-[#A1A1AA] truncate">{rec.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 text-[10px] text-[#71717A] bg-[#09090B] p-1.5 rounded-md border border-[#27272A]/50">
                            {isVisible ? (
                              <Unlock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-[#818cf8] flex-shrink-0" />
                            )}
                            <span className="text-[#52525B]">Valor:</span>
                            <span className={`font-semibold select-all truncate ${isVisible ? 'text-emerald-400 font-mono' : 'text-[#3f3f46]'}`}>
                              {isVisible ? decryptedKeys[keyIdentifier] : "••••••••••••••••••••••••••••••••••••••••"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleDecryptLLMKey(rec.provider, rec.name)}
                            className="p-1.5 bg-[#09090B] border border-[#27272A] text-[#818cf8] hover:text-indigo-300 rounded-lg cursor-pointer transition flex items-center gap-1 text-[10px]"
                            title={isVisible ? "Ocultar" : "Revelar desencriptando"}
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{isVisible ? "Ocultar" : "Revelar"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLLMKey(rec.provider, rec.name)}
                            className="p-1.5 bg-rose-950/20 border border-rose-900/30 text-rose-400 hover:bg-rose-900 hover:text-white rounded-lg cursor-pointer transition"
                            title="Eliminar de la bóveda"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="text-[8px] text-[#71717A] font-mono leading-relaxed mt-2.5">
              *Las claves se almacenan de forma segura localmente. Solo se pueden descifrar si la clave maestra actual de encriptación coincide exactamente con la que se usó al guardar.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
