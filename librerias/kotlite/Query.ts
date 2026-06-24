/**
 * Kotlite DB - Query Engine
 * Motor de consultas encadenadas similar a las operaciones de colecciones en Kotlin.
 */

import { KotliteDebugger } from './Debug';

export type RowData = Record<string, any>;

export class QueryBuilder {
  private rows: RowData[];
  private tableName: string;
  private startTime: number;
  private filtersApplied: string[] = [];

  constructor(rows: RowData[], tableName: string = "unnamed_table") {
    this.rows = [...rows]; // Copiamos el array para mantener inmutabilidad celular
    this.tableName = tableName;
    this.startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  /**
   * Filtra registros mediante un predicado booleano lambda (similar al .filter { } de Kotlin)
   * 
   * @example
   * query.where(user => user.active && user.age > 18)
   */
  where(predicate: (row: RowData) => boolean): QueryBuilder {
    this.rows = this.rows.filter(predicate);
    this.filtersApplied.push("where()");
    return this;
  }

  /**
   * Ordena los resultados por el nombre de columna indicado de forma ascendente o descendente.
   * 
   * @example
   * query.orderBy("createdAt", "DESC")
   */
  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder {
    this.rows.sort((a, b) => {
      const valA = a[column];
      const valB = b[column];

      if (valA === undefined || valB === undefined) return 0;
      if (valA === null && valB !== null) return direction === 'ASC' ? -1 : 1;
      if (valB === null && valA !== null) return direction === 'ASC' ? 1 : -1;

      // Ordenar cadenas
      if (typeof valA === 'string' && typeof valB === 'string') {
        const order = valA.localeCompare(valB);
        return direction === 'ASC' ? order : -order;
      }

      // Ordenar números o booleanos
      if (direction === 'ASC') {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      } else {
        return valB > valA ? 1 : valB < valA ? -1 : 0;
      }
    });

    this.filtersApplied.push(`orderBy(${column}, ${direction})`);
    return this;
  }

  /**
   * Omite los primeros N registros (útil para paginación)
   */
  offset(count: number): QueryBuilder {
    this.rows = this.rows.slice(count);
    this.filtersApplied.push(`offset(${count})`);
    return this;
  }

  /**
   * Limita la cantidad de filas retornadas por la consulta
   */
  limit(count: number): QueryBuilder {
    this.rows = this.rows.slice(0, count);
    this.filtersApplied.push(`limit(${count})`);
    return this;
  }

  /**
   * Ejecuta la consulta y retorna el array de filas final
   */
  execute(): RowData[] {
    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const duration = endTime - this.startTime;
    const filterDesc = this.filtersApplied.length > 0 ? this.filtersApplied.join(" -> ") : "all()";
    
    KotliteDebugger.logQuery(this.tableName, filterDesc, duration, this.rows.length);
    return this.rows;
  }

  /**
   * Helper conveniente para retornar únicamente el primer Match de la fila o null si no se encuentra nada
   */
  firstOrNull(): RowData | null {
    const result = this.rows.length > 0 ? this.rows[0] : null;
    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const duration = endTime - this.startTime;
    const filterDesc = `${this.filtersApplied.join(" -> ")} -> firstOrNull()`;
    
    KotliteDebugger.logQuery(this.tableName, filterDesc, duration, result ? 1 : 0);
    return result;
  }

  /**
   * Cuenta los registros que superaron el filtro y retorna su longitud
   */
  count(): number {
    const countVal = this.rows.length;
    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const duration = endTime - this.startTime;
    const filterDesc = `${this.filtersApplied.join(" -> ")} -> count()`;
    
    KotliteDebugger.logQuery(this.tableName, filterDesc, duration, countVal);
    return countVal;
  }
}
