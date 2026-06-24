/**
 * Kotlite DB - Schema & DD Builder (Kotlin DSL Mirror)
 * Gestiona la definición de tipos, columnas y restricciones.
 */

export type ColumnType = 'INTEGER' | 'TEXT' | 'REAL' | 'BOOLEAN' | 'DATETIME';

export interface ForeignKeyDefinition {
  parentTable: string;
  parentColumn: string;
  onDelete?: 'CASCADE' | 'RESTRICT' | 'SET_NULL';
}

export interface ColumnDefinition {
  name: string;
  type: ColumnType;
  isPrimaryKey: boolean;
  isUnique: boolean;
  isNullable: boolean;
  defaultValue?: any;
  foreignKey?: ForeignKeyDefinition;
}

/**
 * Permite configurar las columnas utilizando encadenamiento de funciones (Chaining)
 * idéntico al DSL de declaración en Kotlin.
 */
export class ColumnBuilder {
  private col: ColumnDefinition;

  constructor(name: string, type: ColumnType) {
    this.col = {
      name,
      type,
      isPrimaryKey: false,
      isUnique: false,
      isNullable: true,
    };
  }

  /**
   * Configura la columna como Clave Primaria (implica No Nulo)
   */
  primaryKey(): ColumnBuilder {
    this.col.isPrimaryKey = true;
    this.col.isNullable = false;
    return this;
  }

  /**
   * Restringe la columna para guardar únicamente valores únicos
   */
  unique(): ColumnBuilder {
    this.col.isUnique = true;
    return this;
  }

  /**
   * Configura la columna para no permitir valores Nulos
   */
  notNull(): ColumnBuilder {
    this.col.isNullable = false;
    return this;
  }

  /**
   * Permite valores Nulos en esta columna
   */
  nullable(): ColumnBuilder {
    this.col.isNullable = true;
    return this;
  }

  /**
   * Asigna un valor predeterminado si no se provee en el INSERT
   */
  default(value: any): ColumnBuilder {
    this.col.defaultValue = value;
    return this;
  }

  /**
   * Define una restricción de clave foránea apuntando a otra tabla/columna.
   */
  references(
    parentTable: string,
    parentColumn: string,
    options?: { onDelete?: 'CASCADE' | 'RESTRICT' | 'SET_NULL' } | 'CASCADE' | 'RESTRICT' | 'SET_NULL'
  ): ColumnBuilder {
    let onDelete: 'CASCADE' | 'RESTRICT' | 'SET_NULL' = 'RESTRICT';
    if (typeof options === 'string') {
      onDelete = options;
    } else if (options && options.onDelete) {
      onDelete = options.onDelete;
    }

    this.col.foreignKey = {
      parentTable,
      parentColumn,
      onDelete,
    };
    return this;
  }

  build(): ColumnDefinition {
    return this.col;
  }
}

export interface TableSchema {
  name: string;
  columns: Record<string, ColumnDefinition>;
}

/**
 * Espejo del inicializador de tablas de Kotlin.
 * Ofrece métodos fluidos para declarar tipos específicos de SQL local.
 */
export class TableSchemaBuilder {
  private name: string;
  private columns: Record<string, ColumnDefinition> = {};

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Crea una columna numérica de tipo Entero
   */
  integer(name: string): ColumnBuilder {
    const builder = new ColumnBuilder(name, 'INTEGER');
    this.columns[name] = builder.build(); // Guardamos por referencia para aplicar mutaciones del Chaining
    return builder;
  }

  /**
   * Crea una columna de cadena de Texto
   */
  text(name: string): ColumnBuilder {
    const builder = new ColumnBuilder(name, 'TEXT');
    this.columns[name] = builder.build();
    return builder;
  }

  /**
   * Crea una columna decimal / flotante
   */
  real(name: string): ColumnBuilder {
    const builder = new ColumnBuilder(name, 'REAL');
    this.columns[name] = builder.build();
    return builder;
  }

  /**
   * Crea una columna de tipo Booleano (1 o 0 de forma interna)
   */
  boolean(name: string): ColumnBuilder {
    const builder = new ColumnBuilder(name, 'BOOLEAN');
    this.columns[name] = builder.build();
    return builder;
  }

  /**
   * Crea una columna de Fecha y Hora (serializa/deserializa texto de forma automática)
   */
  datetime(name: string): ColumnBuilder {
    const builder = new ColumnBuilder(name, 'DATETIME');
    this.columns[name] = builder.build();
    return builder;
  }

  buildTableSchema(): TableSchema {
    return {
      name: this.name,
      columns: this.columns
    };
  }
}
