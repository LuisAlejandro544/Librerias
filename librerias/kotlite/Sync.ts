/**
 * Kotlite DB - JSON Exporter & Synchronizer
 * Motor modular para exportación, importación segura, copias de seguridad
 * y sincronización remota con soporte para transacciones simuladas (Rollback).
 */

import { KotliteDatabase } from './Database';
import { RowData } from './Query';

export interface KotliteBackup {
  dbName: string;
  version: string;
  exportedAt: string;
  data: Record<string, RowData[]>;
}

export interface ImportOptions {
  /**
   * 'overwrite': Vacía por completo las tablas antes de insertar los datos nuevos.
   * 'merge': Si el ID primario ya existe, lo actualiza (Upsert). Si no existe, lo inserta.
   */
  mode?: 'overwrite' | 'merge';
  /**
   * Si es true, detiene todo el proceso de importación y restaura el estado original si falla una validación.
   */
  transactional?: boolean;
}

export interface ImportResult {
  success: boolean;
  importedCount: Record<string, number>;
  message: string;
  errors?: string[];
}

export class KotliteSyncManager {
  private db: KotliteDatabase;

  constructor(db: KotliteDatabase) {
    this.db = db;
  }

  /**
   * Exporta todo el estado de la base de datos a un objeto tipado.
   */
  exportObject(): KotliteBackup {
    const backup: KotliteBackup = {
      dbName: this.db.getDatabaseName(),
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      data: {}
    };

    const tables = this.db.getTables();
    for (const [tableName, tableInstance] of Object.entries(tables)) {
      backup.data[tableName] = tableInstance.all();
    }

    return backup;
  }

  /**
   * Exporta todo el estado como una cadena JSON formateada de forma legible.
   */
  exportJson(pretty: boolean = true): string {
    const backup = this.exportObject();
    return JSON.stringify(backup, null, pretty ? 2 : undefined);
  }

  /**
   * Sincroniza e importa datos de un objeto o cadena de texto JSON.
   * Cuenta con un sistema automático de restauración (Rollback) si ocurre algún error de integridad.
   */
  importJson(
    backupInput: string | KotliteBackup,
    options: ImportOptions = {}
  ): ImportResult {
    const mode = options.mode ?? 'merge';
    const transactional = options.transactional ?? true;

    let backup: KotliteBackup;

    try {
      if (typeof backupInput === 'string') {
        backup = JSON.parse(backupInput);
      } else {
        backup = backupInput;
      }
    } catch (e: any) {
      return {
        success: false,
        importedCount: {},
        message: "Error de análisis: La entrada de datos no es un JSON válido.",
        errors: [e.message]
      };
    }

    // Validar esquema mínimo del backup
    if (!backup || typeof backup.data !== 'object' || !backup.dbName) {
      return {
        success: false,
        importedCount: {},
        message: "Estructura inválida: El backup no contiene metadatos o tabla de datos válidos."
      };
    }

    const registeredTables = this.db.getTables();
    const importedCount: Record<string, number> = {};
    const errors: string[] = [];

    // Sistema de seguridad: Hacer una foto del estado inicial por si requerimos Rollback transaccional
    const backupStateSnapshot: Record<string, RowData[]> = {};
    if (transactional) {
      for (const [tName, tInstance] of Object.entries(registeredTables)) {
        backupStateSnapshot[tName] = tInstance.all();
      }
    }

    try {
      // Iterar sobre las tablas provistas en el JSON
      for (const [tableName, rowsToImport] of Object.entries(backup.data)) {
        const tableInstance = registeredTables[tableName];

        // Omitir si la tabla importada no existe en la estructura declarada de la base de datos
        if (!tableInstance) {
          errors.push(`La tabla '${tableName}' no existe en el esquema actual de la base de datos.`);
          continue;
        }

        if (!Array.isArray(rowsToImport)) {
          errors.push(`Los datos provistos para la tabla '${tableName}' deben ser una lista (Array).`);
          continue;
        }

        importedCount[tableName] = 0;

        // Si es overwrite, vaciar la tabla por completo antes
        if (mode === 'overwrite') {
          tableInstance.truncate();
        }

        const schema = tableInstance.getSchema();
        // Buscar si tiene columna Primary Key
        const primaryKeyColName = Object.entries(schema.columns).find(
          ([_, colDef]) => colDef.isPrimaryKey
        )?.[0];

        for (const row of rowsToImport) {
          if (mode === 'merge' && primaryKeyColName) {
            const rowId = row[primaryKeyColName];

            if (rowId !== undefined && rowId !== null) {
              // Buscar si ya existe el registro con esa ID
              const existingRow = tableInstance.all().find(r => r[primaryKeyColName] === rowId);

              if (existingRow) {
                // Actualizar registro selectivamente
                tableInstance.update(r => r[primaryKeyColName] === rowId, row);
                importedCount[tableName]++;
                continue;
              }
            }
          }

          // Si es merge pero no existía, o si es overwrite, insertamos el nuevo registro
          tableInstance.insert(row);
          importedCount[tableName]++;
        }
      }

      return {
        success: true,
        importedCount,
        message: `Sincronización JSON completada con éxito (${mode}).`
      };

    } catch (err: any) {
      // ROLLBACK: Restaurar estado original si falló la validación estricta y es transaccional
      if (transactional) {
        for (const [tName, originalRows] of Object.entries(backupStateSnapshot)) {
          const tableInstance = registeredTables[tName];
          if (tableInstance) {
            tableInstance.truncate();
            for (const row of originalRows) {
              // Insertamos directamente los originales de vuelta de forma segura
              tableInstance.insert(row);
            }
          }
        }
      }

      return {
        success: false,
        importedCount: {},
        message: "Sincronización abortada por fallas de integridad o tipos en los datos importados.",
        errors: [err.message || "Error desconocido"]
      };
    }
  }

  /**
   * Realiza un fetch asíncrono a una URL externa de tipo API/JSON, descarga el estado,
   * y lo sincroniza de forma atómica en tu base de datos local.
   */
  async syncFromRemoteUrl(
    url: string,
    options: ImportOptions & { headers?: HeadersInit } = {}
  ): Promise<ImportResult> {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          ...(options.headers || {})
        }
      });

      if (!response.ok) {
        throw new Error(`Código de estado HTTP incorrecto: ${response.status} ${response.statusText}`);
      }

      const backupData = await response.json();
      return this.importJson(backupData, options);

    } catch (e: any) {
      return {
        success: false,
        importedCount: {},
        message: `Error al conectar con la pasarela de sincronización remota.`,
        errors: [e.message]
      };
    }
  }
}
