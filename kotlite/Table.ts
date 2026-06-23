/**
 * Kotlite DB - Table Handler
 * Administra el CRUD (Creación, Lectura, Actualización, Borrado) de registros
 * de forma inmutable, con validaciones continuas de esquema y restricciones.
 */

import { TableSchema, ColumnType } from './Schema';
import { RowData, QueryBuilder } from './Query';
import { KotliteRelationsEngine } from './Relations';

export class KotliteTable {
  private schema: TableSchema;
  private rows: RowData[] = [];
  private onStateChanged: (rows: RowData[]) => void;
  private getTables?: () => Record<string, KotliteTable>;

  constructor(
    schema: TableSchema,
    initialRows: RowData[],
    onStateChanged: (rows: RowData[]) => void,
    getTables?: () => Record<string, KotliteTable>
  ) {
    this.schema = schema;
    this.rows = initialRows;
    this.onStateChanged = onStateChanged;
    this.getTables = getTables;
  }

  getSchema(): TableSchema {
    return this.schema;
  }

  getTableName(): string {
    return this.schema.name;
  }

  /**
   * Valida en tiempo real si la fila cumple con todos las restricciones físicas y tipos del Schema
   */
  private validateRow(row: RowData, isUpdate: boolean, oldRow?: RowData) {
    const columns = this.schema.columns;

    for (const [colName, colDef] of Object.entries(columns)) {
      const val = row[colName];

      // 1. Confirmar campos de no-nulidad obligatoria
      if (!colDef.isNullable && (val === undefined || val === null)) {
        // En una actualización, si el valor se omite del payload, conservamos el actual seguro
        if (isUpdate && val === undefined) {
          continue;
        }
        if (colDef.defaultValue === undefined && !colDef.isPrimaryKey) {
          throw new Error(
            `[Kotlite Constraint Error] La columna No-Nula '${colName}' requiere un valor o un valor predeterminado en la tabla '${this.schema.name}'.`
          );
        }
      }

      // 2. Controlar integridad de datos
      if (val !== undefined && val !== null) {
        this.validateType(colName, val, colDef.type);
      }
    }

    // 3. Controlar restricciones de Clave Primaria & Unicidad (Evitar duplicidades)
    for (const [colName, colDef] of Object.entries(columns)) {
      if (colDef.isPrimaryKey || colDef.isUnique) {
        const val = row[colName];
        if (val === undefined || val === null) continue;

        // Comparamos el valor ingresado contra toda la base de datos excluyendo,
        // si es un UPDATE, la fila origen para permitir modificaciones sin autorechazos.
        const hashConflict = this.rows.some((existingRow) => {
          if (oldRow && existingRow === oldRow) return false;
          return existingRow[colName] === val;
        });

        if (hashConflict) {
          throw new Error(
            `[Kotlite Constraint Error] Violación de unicidad en '${colName}'. El registro con valor '${val}' ya existe en la tabla '${this.schema.name}'.`
          );
        }
      }
    }
  }

  /**
   * Cast en caliente de tipos SQLLite a JS
   */
  private validateType(colName: string, value: any, type: ColumnType) {
    switch (type) {
      case 'INTEGER':
        if (!Number.isInteger(Number(value))) {
          throw new Error(
            `[Kotlite Type Mismatch] Columna '${colName}' requiere un número entero (INTEGER), se envió: '${value}' (${typeof value}).`
          );
        }
        break;
      case 'REAL':
        if (typeof value !== 'number' || isNaN(value)) {
          throw new Error(
            `[Kotlite Type Mismatch] Columna '${colName}' requiere un número de punto flotante (REAL), se envió: '${value}'.`
          );
        }
        break;
      case 'TEXT':
        if (typeof value !== 'string') {
          throw new Error(
            `[Kotlite Type Mismatch] Columna '${colName}' requiere cadenas de texto (TEXT), se envió: '${value}' (${typeof value}).`
          );
        }
        break;
      case 'BOOLEAN':
        if (typeof value !== 'boolean' && value !== 0 && value !== 1) {
          throw new Error(
            `[Kotlite Type Mismatch] Columna '${colName}' requiere un tipo Booleano (BOOLEAN), se envió: '${value}'.`
          );
        }
        break;
      case 'DATETIME':
        const isValidDateObj = value instanceof Date && !isNaN(value.getTime());
        const isValidDateStr = typeof value === 'string' && !isNaN(Date.parse(value));
        if (!isValidDateObj && !isValidDateStr) {
          throw new Error(
            `[Kotlite Type Mismatch] Columna '${colName}' requiere una fecha válida o cadena ISO-DATE, se envió: '${value}'.`
          );
        }
        break;
    }
  }

  /**
   * Inserta un elemento en la base de datos con autoincremento dinámico de ID primarios.
   * Retorna el registro consolidado al usuario.
   */
  insert(data: RowData): RowData {
    const newRow = { ...data };
    const columns = this.schema.columns;

    // 1. Simular Claves Primarias autoincrementales (SQLite behaviour) si no se proveen
    for (const [colName, colDef] of Object.entries(columns)) {
      if (
        colDef.isPrimaryKey &&
        colDef.type === 'INTEGER' &&
        (newRow[colName] === undefined || newRow[colName] === null)
      ) {
        const allIds = this.rows
          .map((r) => r[colName] as number)
          .filter((id) => Number.isInteger(id));
        const maxId = allIds.length > 0 ? Math.max(...allIds) : 0;
        newRow[colName] = maxId + 1;
      }

      // 2. Colocar valores por defecto si el payload omite la columna
      if (newRow[colName] === undefined && colDef.defaultValue !== undefined) {
        const defaultValue = colDef.defaultValue;
        newRow[colName] =
          typeof defaultValue === 'function' ? defaultValue() : defaultValue;
      }
    }

    // Validar propiedades consolidadas antes de guardar
    this.validateRow(newRow, false);

    // Validar integridad referencial (Claves Foráneas)
    if (this.getTables) {
      const tables = this.getTables();
      const getter = (tblName: string) => tables[tblName]?.all() || [];
      KotliteRelationsEngine.validateInsertion(this.schema.name, newRow, this.schema, getter);
    }

    this.rows.push(newRow);
    this.onStateChanged([...this.rows]);

    return newRow;
  }

  /**
   * Construye una consulta interactiva sobre la tabla
   */
  query(): QueryBuilder {
    return new QueryBuilder(this.rows);
  }

  /**
   * Retorna instantáneamente todas las filas sin filtros
   */
  all(): RowData[] {
    return [...this.rows];
  }

  /**
   * Modifica filas que cumplan las condiciones del predicado lambda de Kotlin.
   * Retorna el recuento de elementos alterados.
   */
  update(predicate: (row: RowData) => boolean, updates: Partial<RowData>): number {
    let affectedCounter = 0;

    const modifiedRows = this.rows.map((row) => {
      if (predicate(row)) {
        affectedCounter++;
        const draftRow = { ...row, ...updates };
        this.validateRow(draftRow, true, row); // Verifica integridad de unicidades
        
        // Validar integridad referencial (Claves Foráneas) en actualizaciones
        if (this.getTables) {
          const tables = this.getTables();
          const getter = (tblName: string) => tables[tblName]?.all() || [];
          KotliteRelationsEngine.validateInsertion(this.schema.name, draftRow, this.schema, getter);
        }
        
        return draftRow;
      }
      return row;
    });

    if (affectedCounter > 0) {
      this.rows = modifiedRows;
      this.onStateChanged([...this.rows]);
    }

    return affectedCounter;
  }

  /**
   * Elimina cualquier fila que coincida con la lambda de búsqueda.
   * Retorna el número de registros purgados.
   */
  delete(predicate: (row: RowData) => boolean, skipFkCheck: boolean = false): number {
    const startCount = this.rows.length;

    // Si no se pide omitir la verificación y contamos con acceso a las tablas relacionadas, ejecutamos trigger onDelete
    if (!skipFkCheck && this.getTables) {
      const tables = this.getTables();
      const rowsToDelete = this.rows.filter(predicate);

      for (const row of rowsToDelete) {
        for (const [colName, colDef] of Object.entries(this.schema.columns)) {
          if (colDef.isPrimaryKey) {
            KotliteRelationsEngine.handleParentDeletion(
              this.schema.name,
              row,
              colName,
              tables
            );
          }
        }
      }
    }

    this.rows = this.rows.filter((row) => !predicate(row));
    const deletedCount = startCount - this.rows.length;

    if (deletedCount > 0) {
      this.onStateChanged([...this.rows]);
    }

    return deletedCount;
  }

  /**
   * Trunca (vacía) completamente la tabla
   */
  truncate(): void {
    this.rows = [];
    this.onStateChanged([]);
  }
}
