/**
 * Stridb Schema Definitions
 * Defines relational constraints, column types and structure validations for IndexedDB object stores.
 */

export type ColumnType = "INTEGER" | "TEXT" | "BOOLEAN" | "JSON" | "DATETIME";

export interface ColumnDefinition {
  type: ColumnType;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  notNull?: boolean;
  unique?: boolean;
  default?: any;
  encrypt?: boolean;
}

export interface TableSchema {
  name: string;
  columns: Record<string, ColumnDefinition>;
}

export class TableSchemaBuilder {
  private columns: Record<string, ColumnDefinition> = {};

  constructor(private tableName: string) {}

  public integer(name: string): ColumnBuilder {
    return this.addColumn(name, "INTEGER");
  }

  public text(name: string): ColumnBuilder {
    return this.addColumn(name, "TEXT");
  }

  public boolean(name: string): ColumnBuilder {
    return this.addColumn(name, "BOOLEAN");
  }

  public json(name: string): ColumnBuilder {
    return this.addColumn(name, "JSON");
  }

  public datetime(name: string): ColumnBuilder {
    return this.addColumn(name, "DATETIME");
  }

  private addColumn(name: string, type: ColumnType): ColumnBuilder {
    const col: ColumnDefinition = { type };
    this.columns[name] = col;
    return new ColumnBuilder(col);
  }

  public build(): TableSchema {
    return {
      name: this.tableName,
      columns: this.columns
    };
  }
}

export class ColumnBuilder {
  constructor(private config: ColumnDefinition) {}

  public primaryKey(): ColumnBuilder {
    this.config.primaryKey = true;
    return this;
  }

  public autoIncrement(): ColumnBuilder {
    this.config.autoIncrement = true;
    return this;
  }

  public notNull(): ColumnBuilder {
    this.config.notNull = true;
    return this;
  }

  public unique(): ColumnBuilder {
    this.config.unique = true;
    return this;
  }

  public default(value: any): ColumnBuilder {
    this.config.default = value;
    return this;
  }

  public encrypt(): ColumnBuilder {
    this.config.encrypt = true;
    return this;
  }

  public encrypted(): ColumnBuilder {
    this.config.encrypt = true;
    return this;
  }
}

/**
 * Validates a record against its table schema before insert or update operations.
 */
export function validateRecord(schema: TableSchema, record: any, isUpdate = false): any {
  const validated: Record<string, any> = { ...record };

  for (const [colName, colDef] of Object.entries(schema.columns)) {
    const val = validated[colName];

    // Primary key handling for autoincrement
    if (colDef.primaryKey && colDef.autoIncrement && !isUpdate) {
      if (val !== undefined && val !== null) {
        // Let the assigned ID pass or strip it to autoincrement
      }
      continue;
    }

    // Default values if undefined
    if (val === undefined && colDef.default !== undefined && !isUpdate) {
      validated[colName] = typeof colDef.default === "function" ? colDef.default() : colDef.default;
      continue;
    }

    // Check NOT NULL constraint
    if (colDef.notNull && (validated[colName] === undefined || validated[colName] === null)) {
      throw new Error(`Restricción de No Nulo violada: La columna '${colName}' de la tabla '${schema.name}' no puede ser nula.`);
    }

    // Validate Types
    if (validated[colName] !== undefined && validated[colName] !== null) {
      const actualVal = validated[colName];
      switch (colDef.type) {
        case "INTEGER":
          if (typeof actualVal !== "number" || !Number.isInteger(actualVal)) {
            const num = Number(actualVal);
            if (isNaN(num) || !Number.isInteger(num)) {
              throw new Error(`Error de tipo: Se esperaba un ENTERO en la columna '${colName}' de la tabla '${schema.name}', se obtuvo '${typeof actualVal}'`);
            }
            validated[colName] = num;
          }
          break;
        case "TEXT":
          if (typeof actualVal !== "string") {
            validated[colName] = String(actualVal);
          }
          break;
        case "BOOLEAN":
          if (typeof actualVal !== "boolean") {
            validated[colName] = Boolean(actualVal);
          }
          break;
        case "JSON":
          if (typeof actualVal === "string") {
            try {
              validated[colName] = JSON.parse(actualVal);
            } catch {
              // keep as string
            }
          }
          break;
        case "DATETIME":
          if (!(actualVal instanceof Date) && typeof actualVal !== "string" && typeof actualVal !== "number") {
            throw new Error(`Error de tipo: Se esperaba un DATETIME en la columna '${colName}' de la tabla '${schema.name}'`);
          }
          if (actualVal instanceof Date) {
            validated[colName] = actualVal.toISOString();
          } else {
            validated[colName] = new Date(actualVal).toISOString();
          }
          break;
      }
    }
  }

  return validated;
}
