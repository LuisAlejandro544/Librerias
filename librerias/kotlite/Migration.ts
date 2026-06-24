/**
 * Kotlite DB - Kotlin SQLite / Room Migration Utility
 * Proporciona adaptadores y mapeadores fieles de tipos de datos y volcados de datos
 * para migrar de forma fluida el almacenamiento de una app Kotlin nativa (Room / SQLite) a la web con Next.js.
 */

import { ColumnType } from './Schema';
import { RowData } from './Query';
import { KotliteTable } from './Table';

export interface KotlinEntityField {
  name: string;
  kotlinType: 'Int' | 'Long' | 'String' | 'Float' | 'Double' | 'Boolean' | 'Date' | string;
  isPrimaryKey: boolean;
  isNullable: boolean;
}

export class KotliteMigrationBridge {
  
  /**
   * Traduce los tipos nativos de Kotlin SQLite (Room) a tipos de columna de Kotlite DB
   */
  public static mapKotlinTypeToKotlite(kotlinType: string): ColumnType {
    const cleanType = kotlinType.trim();
    switch (cleanType) {
      case 'Int':
      case 'Integer':
      case 'Long':
      case 'Short':
      case 'Byte':
        return 'INTEGER';
      case 'Float':
      case 'Double':
        return 'REAL';
      case 'String':
      case 'Char':
        return 'TEXT';
      case 'Boolean':
        return 'BOOLEAN';
      case 'Date':
      case 'DateTime':
      case 'Calendar':
        return 'DATETIME';
      default:
        return 'TEXT'; // Fallback seguro
    }
  }

  /**
   * Genera el código correspondiente al DSL de Kotlite DB a partir de un listado de campos de una Entidad de Kotlin (Room).
   * Ayuda al desarrollador a replicar su base de datos nativa en la web de forma 100% fiel.
   */
  public static generateDSLFromKotlinSchema(tableName: string, fields: KotlinEntityField[]): string {
    let dsl = `builder.table("${tableName}", (t) => {\n`;
    
    fields.forEach(field => {
      const dbType = this.mapKotlinTypeToKotlite(field.kotlinType);
      const method = dbType.toLowerCase();
      let modifiers = "";
      
      if (field.isPrimaryKey) {
        modifiers += ".primaryKey()";
      }
      if (!field.isNullable && !field.isPrimaryKey) {
        modifiers += ".notNull()";
      }
      
      dsl += `  t.${method}("${field.name}")${modifiers};\n`;
    });
    
    dsl += `});`;
    return dsl;
  }

  /**
   * Importa de forma segura un volcado JSON proveniente de Room / SQLite de una app Kotlin.
   * Realiza conversiones en caliente de tipos (ej. enteros a booleanos o timestamps a ISO strings)
   * para asegurar que encaje perfectamente con las restricciones físicas de la tabla Kotlite.
   */
  public static importKotlinDump(
    table: KotliteTable,
    rawData: Array<Record<string, any>>,
    options: {
      ignoreErrors?: boolean;
      clearBeforeImport?: boolean;
    } = {}
  ): { importedCount: number; errors: string[] } {
    const errors: string[] = [];
    let importedCount = 0;

    if (options.clearBeforeImport) {
      table.truncate();
    }

    const schema = table.getSchema();

    rawData.forEach((rawRow, idx) => {
      try {
        const sanitizedRow: RowData = {};

        // Adaptar cada columna de acuerdo al esquema esperado
        for (const [colName, colDef] of Object.entries(schema.columns)) {
          let val = rawRow[colName];

          // Manejar omisiones
          if (val === undefined || val === null) {
            continue;
          }

          // Convertir tipos de forma inteligente (SQLite nativo no tiene Booleanos puros, usa 0 o 1)
          if (colDef.type === 'BOOLEAN') {
            if (typeof val === 'number') {
              sanitizedRow[colName] = val !== 0;
            } else if (typeof val === 'string') {
              sanitizedRow[colName] = val === 'true' || val === '1';
            } else {
              sanitizedRow[colName] = Boolean(val);
            }
          }
          // Convertir marcas de tiempo numéricas a ISO strings para DATETIME
          else if (colDef.type === 'DATETIME') {
            if (typeof val === 'number') {
              // Si es timestamp numérico de Kotlin (Long en milisegundos)
              sanitizedRow[colName] = new Date(val).toISOString();
            } else {
              sanitizedRow[colName] = String(val);
            }
          }
          // Convertir enteros
          else if (colDef.type === 'INTEGER') {
            sanitizedRow[colName] = Math.round(Number(val));
          }
          // Convertir reales
          else if (colDef.type === 'REAL') {
            sanitizedRow[colName] = Number(val);
          }
          // Convertir textos
          else if (colDef.type === 'TEXT') {
            sanitizedRow[colName] = String(val);
          } else {
            sanitizedRow[colName] = val;
          }
        }

        // Insertar registro adaptado de forma segura
        table.insert(sanitizedRow);
        importedCount++;
      } catch (err: any) {
        const errMsg = `Error importando fila en índice ${idx}: ${err.message}`;
        errors.push(errMsg);
        if (!options.ignoreErrors) {
          throw new Error(errMsg);
        }
      }
    });

    return {
      importedCount,
      errors
    };
  }
}
