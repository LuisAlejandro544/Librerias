'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createKotliteDatabase } from '../kotlite';
import { Plus, Trash2, ShieldAlert, Sparkles, Database, Code, RefreshCw, CheckCircle, Search, ToggleLeft, ToggleRight } from 'lucide-react';

// Instanciar la base de datos de pruebas (Sandbox)
const sandboxDb = createKotliteDatabase("kotlite_sandbox_db", (builder) => {
  builder.table("developers", (t) => {
    t.integer("id").primaryKey();
    t.text("name").notNull();
    t.text("role").default("Fullstack Engineer");
    t.boolean("active").default(true);
  });
});

const RANDOM_NAMES = [
  "Alejandro Camacho", "Sofia Rodriguez", "Santiago Perez", "Lucia Martinez",
  "Mateo Gomez", "Valeria Fernandez", "Nicolas Diaz", "Gabriela Alvarez",
  "Benjamin Romero", "Camila Ruiz", "Emilio Silva", "Isabella Castro"
];

const RANDOM_ROLES = [
  "Frontend Architect", "Android Kotlin Dev", "Senior Backend Engineer",
  "Data Scientist", "DevOps Specialist", "Product Engineer", "Security Researcher"
];

export default function PlaygroundKotlite() {
  const [developers, setDevelopers] = useState<any[]>(() => sandboxDb.table("developers").all());
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");
  const [customName, setCustomName] = useState("");
  const [customRole, setCustomRole] = useState("Frontend Architect");

  // Suscribirse a cambios en tiempo real en la base de datos
  useEffect(() => {
    const unsubscribe = sandboxDb.subscribe((tableName, updatedRows) => {
      if (tableName === "developers") {
        setDevelopers(updatedRows);
      }
    });

    // Cargar registros por defecto si la base está vacía para dinamismo del sandbox
    const currentRows = sandboxDb.table("developers").all();
    if (currentRows.length === 0) {
      try {
        sandboxDb.table("developers").insert({ name: "Alejandro Camacho", role: "Kotlin Architect", active: true });
        sandboxDb.table("developers").insert({ name: "Sofia Rodriguez", role: "Frontend Architect", active: true });
        sandboxDb.table("developers").insert({ name: "Santiago Perez", role: "DevOps Specialist", active: false });
      } catch (e) {
        console.error(e);
      }
    }

    return () => unsubscribe();
  }, []);

  // Agregar un registro en caliente
  const handleAddDeveloper = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const nameToInsert = customName.trim() || RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const roleToInsert = customName.trim() ? customRole : RANDOM_ROLES[Math.floor(Math.random() * RANDOM_ROLES.length)];

    try {
      sandboxDb.table("developers").insert({
        name: nameToInsert,
        role: roleToInsert,
        active: true
      });
      setCustomName("");
    } catch (err: any) {
      setErrorMessage(err.message || "Violación de restricción detectada");
    }
  };

  // Cambiar el estado activo con update() de Kotlite
  const handleToggleActive = (id: number, currentActive: boolean) => {
    setErrorMessage("");
    try {
      sandboxDb.table("developers").update(
        (dev) => dev.id === id,
        { active: !currentActive }
      );
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Eliminar un desarrollador con delete() de Kotlite
  const handleDelete = (id: number) => {
    setErrorMessage("");
    try {
      sandboxDb.table("developers").delete((dev) => dev.id === id);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Vaciar la tabla con truncate()
  const handleTruncate = () => {
    setErrorMessage("");
    sandboxDb.table("developers").truncate();
  };

  // CONSULTA FILTRADA DINÁMICAMENTE CON KOTLITE QUERY ENGINE
  // Aquí usamos el motor real que programamos en Query.ts y Table.ts
  const filteredDevelopers = useMemo(() => {
    // Vinculamos reactivamente la pila mediante 'developers'
    const _forceTrigger = developers;
    let queryObj = sandboxDb.table("developers").query();

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      queryObj = queryObj.where(dev => 
        dev.name.toLowerCase().includes(searchLower) || 
        dev.role.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por rol
    if (roleFilter !== "all") {
      queryObj = queryObj.where(dev => dev.role === roleFilter);
    }

    // Filtro por estado activo
    if (activeFilter !== "all") {
      const activeBool = activeFilter === "true";
      queryObj = queryObj.where(dev => dev.active === activeBool);
    }

    // Ordenamiento por ID descendiente
    return queryObj.orderBy("id", "DESC").execute();
  }, [developers, searchQuery, roleFilter, activeFilter]);

  // Lista de roles únicos para el filtro dropdown
  const uniqueRoles = useMemo(() => {
    const roles = developers.map(dev => dev.role);
    return Array.from(new Set(roles));
  }, [developers]);

  // Construir la cadena que describe la consulta ejecutándose en tiempo real
  const currentQueryCodeString = useMemo(() => {
    let code = `db.table("developers")\n  .query()`;
    
    if (searchQuery.trim()) {
      code += `\n  .where(dev => dev.name.includes("${searchQuery}"))`;
    }
    if (roleFilter !== "all") {
      code += `\n  .where(dev => dev.role === "${roleFilter}")`;
    }
    if (activeFilter !== "all") {
      code += `\n  .where(dev => dev.active === ${activeFilter})`;
    }
    
    code += `\n  .orderBy("id", "DESC")\n  .execute();`;
    return code;
  }, [searchQuery, roleFilter, activeFilter]);

  return (
    <div id="playground-kotlite-db" className="space-y-6">
      
      {/* Mensajes de restricción / error */}
      {errorMessage && (
        <div className="bg-rose-950/40 border border-rose-500/30 text-rose-300 p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in">
          <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <p className="leading-relaxed font-mono">{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Panel izquierdo de Entrada de datos y Filtros */}
        <div className="lg:col-span-5 bg-[#18181B] border border-[#27272A] p-5 rounded-2xl flex flex-col justify-between space-y-6 text-white">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
              <span className="text-white font-semibold flex items-center gap-2 text-sm font-mono">
                <Database className="w-4 h-4 text-indigo-400" />
                Operaciones CRUD (Kotlin DSL)
              </span>
              <button
                id="btn-truncate-kotlite"
                onClick={handleTruncate}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium inline-flex items-center gap-1 cursor-pointer transition font-mono"
              >
                Truncar Tabla 🧹
              </button>
            </div>

            {/* Formulario de Inserción */}
            <form onSubmit={handleAddDeveloper} className="space-y-3 bg-[#09090B] p-4 rounded-xl border border-[#27272A]">
              <span className="text-[10px] text-[#71717A] font-mono font-bold block uppercase tracking-wider">
                Insertar Registro (Kotlin table.insert)
              </span>
              
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Nombre de desarrollador..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />

                {customName.trim() && (
                  <select
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {RANDOM_ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                )}
              </div>

              <button
                type="submit"
                id="btn-add-dev-kotlite"
                className="w-full flex items-center justify-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-2 rounded-lg cursor-pointer transition shadow-md shadow-indigo-500/10"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{customName.trim() ? "Insertar Candidato" : "Insertar Desarrollador Aleatorio"}</span>
              </button>
            </form>

            {/* Buscador y selectores de filtros de Consulta */}
            <div className="bg-[#09090B] p-4 rounded-xl border border-[#27272A] space-y-3">
              <span className="text-[10px] text-[#71717A] font-mono font-bold block uppercase tracking-wider">
                Motor de Búsqueda y Consultas (table.query)
              </span>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar por nombre o palabra clave..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-[#71717A] font-semibold font-mono block mb-1">FILTRAR ROL</label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">Todos los Roles</option>
                    {uniqueRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] text-[#71717A] font-semibold font-mono block mb-1">ESTADO ACTIVO</label>
                  <select
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">Cualquier Estado</option>
                    <option value="true">Activos</option>
                    <option value="false">Inactivos</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#27272A] text-[10px] text-[#71717A] font-mono leading-relaxed">
            *Las operaciones en el sandbox son atómicas y persisten de forma transparente en el <code>localStorage</code> del navegador.
          </div>
        </div>

        {/* Panel derecho de Resultados de la base de datos y Visualización del Código */}
        <div className="lg:col-span-7 bg-[#121214] border border-[#27272A] text-[#FAFAFA] rounded-2xl p-6 flex flex-col justify-between shadow-lg relative min-h-[440px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span className="text-xs text-[#A1A1AA] font-bold uppercase tracking-wider font-mono">
                  Base de Datos en Tiempo Real (Kotlite Table)
                </span>
              </div>
              <span className="text-[10px] bg-[#18181B] border border-[#27272A] text-indigo-400 px-2.5 py-0.5 rounded font-mono font-bold">
                PERSISTENTE (LOCALSTORAGE)
              </span>
            </div>

            {/* Código generado en tiempo real */}
            <div className="bg-[#09090B] p-3 rounded-xl border border-[#27272A] space-y-1.5">
              <span className="text-[9px] text-[#71717A] font-mono font-bold block uppercase tracking-wider flex items-center gap-1">
                <Code className="w-3.5 h-3.5" />
                Consulta Kotlin DSL compilada en tiempo real:
              </span>
              <pre className="text-xs text-indigo-300 font-mono overflow-x-auto leading-relaxed select-all">
                {currentQueryCodeString}
              </pre>
            </div>

            {/* Tabla de registros resultantes */}
            <div className="space-y-2">
              <span className="text-[10px] text-[#71717A] font-mono font-bold block uppercase tracking-wider">
                Registros Coincidentes ({filteredDevelopers.length})
              </span>

              <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                {filteredDevelopers.length === 0 ? (
                  <div className="text-center py-10 bg-[#09090B]/60 rounded-xl border border-[#27272A] text-xs text-[#71717A] italic">
                    Ningún desarrollador coincide con los filtros aplicados.
                  </div>
                ) : (
                  filteredDevelopers.map((dev) => (
                    <div
                      key={dev.id}
                      className="bg-[#18181B]/80 border border-[#27272A] p-3.5 rounded-xl flex items-center justify-between gap-4 hover:border-indigo-500/20 transition duration-200"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="text-xs font-mono bg-[#09090B] px-2 py-1 rounded border border-[#27272A] text-[#71717A] font-bold">
                          id: {dev.id}
                        </span>
                        <div className="min-w-0 space-y-0.5">
                          <h5 className="text-xs font-extrabold text-white truncate font-mono">
                            {dev.name}
                          </h5>
                          <p className="text-[10px] text-[#A1A1AA] truncate">
                            {dev.role}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3.5 flex-shrink-0">
                        {/* Toggle de activo */}
                        <button
                          onClick={() => handleToggleActive(dev.id, dev.active)}
                          className="text-[#71717A] hover:text-white transition cursor-pointer"
                          title={dev.active ? "Desactivar" : "Activar"}
                        >
                          {dev.active ? (
                            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                              <span>Activo</span>
                              <ToggleRight className="w-6 h-6 text-emerald-400" />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[10px] text-[#71717A] font-mono">
                              <span>Inactivo</span>
                              <ToggleLeft className="w-6 h-6 text-[#71717A]" />
                            </div>
                          )}
                        </button>

                        {/* Eliminar registro */}
                        <button
                          onClick={() => handleDelete(dev.id)}
                          className="p-1.5 bg-rose-950/20 border border-rose-900/30 text-rose-400 hover:bg-rose-900 hover:text-white rounded-lg cursor-pointer transition"
                          title="Eliminar de la tabla"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          <div className="text-[10px] text-[#52525B] text-center font-mono pt-4 border-t border-[#27272A]/50">
            Intenta recargar el navegador de pruebas. Verás que tus cambios persisten automáticamente gracias a Kotlite DB.
          </div>
        </div>

      </div>
    </div>
  );
}
