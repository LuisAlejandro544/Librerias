/**
 * Kotlite DB - Referential Integrity & Relations Engine
 * 
 * Gestiona de forma modular el análisis y la ejecución de restricciones de claves foráneas,
 * incluyendo inserciones seguras, eliminaciones en cascada (CASCADE), restricciones (RESTRICT)
 * y formateo a nulo (SET_NULL).
 */

import { TableSchema, ForeignKeyDefinition } from './Schema';
import { RowData } from './Query';

export class KotliteRelationsEngine {
  
  /**
   * Valida la integridad referencial antes de insertar o actualizar un registro.
   * Comprueba que la fila hija contenga un ID válido que realmente exista en la tabla padre.
   */
  static validateInsertion(
    childTableName: string,
    childRow: RowData,
    childSchema: TableSchema,
    getAllRowsFromTable: (tableName: string) => RowData[]
  ): void {
    for (const [colName, colDef] of Object.entries(childSchema.columns)) {
      if (colDef.foreignKey) {
        const fk = colDef.foreignKey;
        const childVal = childRow[colName];

        // Si el valor es null o undefined y la columna permite nulos, omitimos la comprobación
        if ((childVal === null || childVal === undefined) && colDef.isNullable) {
          continue;
        }

        // Obtener datos de la tabla padre
        const parentRows = getAllRowsFromTable(fk.parentTable);
        const parentKeyExists = parentRows.some(pRow => pRow[fk.parentColumn] === childVal);

        if (!parentKeyExists) {
          throw new Error(
            `[Violación de Clave Foránea en ${childTableName}.${colName}]: ` +
            `El valor '${childVal}' no existe en la tabla padre '${fk.parentTable}' (columna '${fk.parentColumn}').`
          );
        }
      }
    }
  }

  /**
   * Maneja las acciones de borrado de registros padres (CASCADE, RESTRICT, SET_NULL).
   * Se ejecuta antes de remover físicamente la fila del padre para asegurar que las tablas hijas respondan bien.
   */
  static handleParentDeletion(
    parentTableName: string,
    parentRowToDelete: RowData,
    parentColumnName: string,
    allTables: Record<string, { 
      getSchema: () => TableSchema; 
      all: () => RowData[];
      update: (pred: (r: RowData) => boolean, fields: Partial<RowData>) => void;
      delete: (pred: (r: RowData) => boolean, skipFkCheck?: boolean) => void;
    }>
  ): void {
    const parentVal = parentRowToDelete[parentColumnName];
    if (parentVal === undefined || parentVal === null) return;

    // Buscar dependencias en todas las demás tablas
    for (const [childTableName, childTableInstance] of Object.entries(allTables)) {
      if (childTableName === parentTableName) continue;

      const childSchema = childTableInstance.getSchema();

      for (const [childColName, childColDef] of Object.entries(childSchema.columns)) {
        const fk = childColDef.foreignKey;
        if (fk && fk.parentTable === parentTableName && fk.parentColumn === parentColumnName) {
          
          // Buscar si hay filas hijas que dependan de este valor
          const childRows = childTableInstance.all();
          const dependentRows = childRows.filter(r => r[childColName] === parentVal);

          if (dependentRows.length > 0) {
            const onDeleteAction = fk.onDelete || 'RESTRICT';

            if (onDeleteAction === 'RESTRICT') {
              throw new Error(
                `[Falla de Borrado - RESTRICT]: ` +
                `No se puede eliminar el registro con ID '${parentVal}' de '${parentTableName}' ` +
                `porque tiene registros relacionados en la tabla hija '${childTableName}' (columna '${childColName}').`
              );
            } 
            
            else if (onDeleteAction === 'CASCADE') {
              // Eliminar todas las filas hijas relacionadas de forma segura
              // skipFkCheck se activa para evitar recursiones redundantes ya resueltas
              childTableInstance.delete(r => r[childColName] === parentVal, true);
            } 
            
            else if (onDeleteAction === 'SET_NULL') {
              if (!childColDef.isNullable) {
                throw new Error(
                  `[Falla de Integridad - SET_NULL]: ` +
                  `La clave foránea '${childTableName}.${childColName}' está configurada como SET_NULL ` +
                  `pero la columna está marcada como NOT NULL.`
                );
              }
              // Actualizar el campo relacionado a null
              childTableInstance.update(
                r => r[childColName] === parentVal,
                { [childColName]: null }
              );
            }
          }
        }
      }
    }
  }
}
