/**
 * Kotlite DB - Test Suite / Runner v1.0.0
 * Conjunto de pruebas unitarias y de integración para validar de forma robusta 
 * todas las capacidades de la base de datos (Tipos, Constraints, CASCADE, Crypto, Consultas y Migración).
 */

import { createKotliteDatabase } from './index';
import { KotliteDebugger } from './Debug';
import { KotliteMigrationBridge } from './Migration';
import { getOptimalStorage, InMemoryStorageEngine } from './Storage';

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export class KotliteTestSuite {
  private results: TestResult[] = [];

  private async runTest(name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      this.results.push({ name, passed: true });
    } catch (err: any) {
      this.results.push({ name, passed: false, error: err.message });
    }
  }

  /**
   * Ejecuta el conjunto completo de pruebas unitarias
   */
  public async executeAll(): Promise<TestResult[]> {
    this.results = [];
    
    // Desactivar temporalmente los logs del debugger para no saturar la consola de pruebas
    const debuggerWasEnabled = KotliteDebugger.enabled;
    KotliteDebugger.enabled = false;

    // Test 1: Creación de base de datos y DSL declarativo
    await this.runTest("1. Creación de DB y Esquemas Fluent", () => {
      const db = createKotliteDatabase("test_db_1", (builder) => {
        builder.table("usuarios", (t) => {
          t.integer("id").primaryKey();
          t.text("nombre").notNull();
          t.text("email").unique();
          t.boolean("activo").default(true);
        });
      }, new InMemoryStorageEngine());

      const schema = db.table("usuarios").getSchema();
      if (schema.name !== "usuarios") throw new Error("Nombre de tabla incorrecto");
      if (!schema.columns.id.isPrimaryKey) throw new Error("Falta la llave primaria");
      if (schema.columns.nombre.isNullable) throw new Error("La columna 'nombre' debería ser No-Nula");
    });

    // Test 2: Transacciones CRUD básicas y autoincremento
    await this.runTest("2. Transacciones CRUD básicas", () => {
      const db = createKotliteDatabase("test_db_2", (builder) => {
        builder.table("tareas", (t) => {
          t.integer("id").primaryKey();
          t.text("descripcion");
          t.boolean("hecha").default(false);
        });
      }, new InMemoryStorageEngine());

      const tareas = db.table("tareas");

      // Insertar
      const r1 = tareas.insert({ descripcion: "Aprender Kotlite" });
      if (r1.id !== 1) throw new Error("Autoincremento falló, debió ser ID 1");
      if (r1.hecha !== false) throw new Error("El valor por defecto 'hecha' falló");

      const r2 = tareas.insert({ descripcion: "Crear pruebas" });
      if (r2.id !== 2) throw new Error("Autoincremento falló, debió ser ID 2");

      // Update
      const updatedCount = tareas.update(t => t.id === 1, { hecha: true });
      if (updatedCount !== 1) throw new Error("No se actualizó el registro");
      
      const primerRegistro = tareas.query().where(t => t.id === 1).firstOrNull();
      if (!primerRegistro || primerRegistro.hecha !== true) throw new Error("El valor no cambió en la actualización");

      // Delete
      const deletedCount = tareas.delete(t => t.id === 2);
      if (deletedCount !== 1) throw new Error("No se eliminó el registro");
      if (tareas.all().length !== 1) throw new Error("La cuenta final de filas no coincide");
    });

    // Test 3: Restricciones físicas (Integridad de datos)
    await this.runTest("3. Validaciones de tipos y restricciones de unicidad", () => {
      const db = createKotliteDatabase("test_db_3", (builder) => {
        builder.table("usuarios", (t) => {
          t.integer("id").primaryKey();
          t.text("nombre").notNull();
          t.text("email").unique();
        });
      }, new InMemoryStorageEngine());

      const usuarios = db.table("usuarios");
      usuarios.insert({ nombre: "Alejandro", email: "ale@test.com" });

      // Violación de Not-Null
      try {
        usuarios.insert({ email: "otro@test.com" }); // falta nombre
        throw new Error("Se permitió insertar un valor nulo en campo No-Nulo");
      } catch (e: any) {
        if (!e.message.includes("La columna No-Nula")) {
          throw new Error("Mensaje de error incorrecto para Not-Null");
        }
      }

      // Violación de Clave Única
      try {
        usuarios.insert({ nombre: "Duplicado", email: "ale@test.com" });
        throw new Error("Se permitió duplicar un email único");
      } catch (e: any) {
        if (!e.message.includes("Violación de unicidad")) {
          throw new Error("Mensaje de error incorrecto para Unicidad");
        }
      }

      // Violación de Tipo de Dato
      try {
        usuarios.insert({ nombre: 12345, email: "valido@test.com" }); // nombre debió ser string/TEXT
        throw new Error("Se permitió insertar un entero en un campo TEXT");
      } catch (e: any) {
        if (!e.message.includes("Tipo de dato inválido")) {
          throw new Error("Mensaje de error incorrecto para Incoherencia de tipo");
        }
      }
    });

    // Test 4: Consultas avanzadas de colección (Style Kotlin)
    await this.runTest("4. Consultas avanzadas y encadenamiento fluent", () => {
      const db = createKotliteDatabase("test_db_4", (builder) => {
        builder.table("productos", (t) => {
          t.integer("id").primaryKey();
          t.text("nombre");
          t.real("precio");
        });
      }, new InMemoryStorageEngine());

      const productos = db.table("productos");
      productos.insert({ nombre: "Laptop", precio: 1200.50 });
      productos.insert({ nombre: "Mouse", precio: 25.00 });
      productos.insert({ nombre: "Teclado", precio: 80.00 });
      productos.insert({ nombre: "Monitor", precio: 300.00 });

      // Filtrar, ordenar, paginar y limitar
      const result = productos.query()
        .where(p => p.precio > 50)
        .orderBy("precio", "DESC")
        .offset(1)
        .limit(2)
        .execute();

      if (result.length !== 2) throw new Error("Límite u offset incorrecto");
      if (result[0].nombre !== "Monitor") throw new Error("Ordenamiento incorrecto, debió ser Monitor primero (300)");
      if (result[1].nombre !== "Teclado") throw new Error("Ordenamiento incorrecto, debió ser Teclado después (80)");
    });

    // Test 5: Relaciones y restricciones de claves foráneas (CASCADE)
    await this.runTest("5. Integridad referencial (Claves Foráneas - CASCADE)", () => {
      const db = createKotliteDatabase("test_db_5", (builder) => {
        builder.table("blogs", (t) => {
          t.integer("id").primaryKey();
          t.text("titulo");
        });
        builder.table("comentarios", (t) => {
          t.integer("id").primaryKey();
          t.integer("blogId").notNull().references("blogs", "id", "CASCADE");
          t.text("texto");
        });
      }, new InMemoryStorageEngine());

      const blogs = db.table("blogs");
      const comentarios = db.table("comentarios");

      blogs.insert({ id: 1, titulo: "Mi viaje a la web" });
      comentarios.insert({ blogId: 1, texto: "Excelente artículo" });
      comentarios.insert({ blogId: 1, texto: "Me sirvió mucho" });

      if (comentarios.all().length !== 2) throw new Error("No se insertaron los comentarios iniciales");

      // Eliminar el blog principal y verificar CASCADE
      blogs.delete(b => b.id === 1);

      if (comentarios.all().length !== 0) {
        throw new Error("Fallo en la eliminación en cascada (CASCADE). Los comentarios huérfanos aún existen.");
      }
    });

    // Test 6: Encriptación y descifrado de datos (Crypto)
    await this.runTest("6. Cifrado simétrico de datos en almacenamiento", () => {
      const db = createKotliteDatabase("test_db_6", (builder) => {
        builder.table("segura", (t) => {
          t.integer("id").primaryKey();
          t.text("clave_secreta");
        });
      }, new InMemoryStorageEngine(), "super-secreto-123");

      const segura = db.table("segura");
      segura.insert({ clave_secreta: "MiContraseniaPrivada" });

      // Obtener el motor interno para ver si está encriptado en el almacenamiento crudo
      const memoryStorage = db.getStorage() as InMemoryStorageEngine;
      const rawStoredString = memoryStorage.getItem("kotlite:test_db_6:segura");
      
      if (!rawStoredString) throw new Error("No se guardó el registro en el storage");
      if (rawStoredString.includes("MiContraseniaPrivada")) {
        throw new Error("¡Error crítico de seguridad! El texto plano es visible en el motor de almacenamiento físico.");
      }

      // Debe poder recuperarse descifrado transparentemente al hacer query
      const descifrado = segura.query().firstOrNull();
      if (!descifrado || descifrado.clave_secreta !== "MiContraseniaPrivada") {
        throw new Error("El descifrado de datos falló o devolvió un valor erróneo");
      }
    });

    // Test 7: Puente de migración desde Android Room
    await this.runTest("7. Puente de migración desde Kotlin (Room / SQLite)", () => {
      const db = createKotliteDatabase("test_db_7", (builder) => {
        builder.table("tareas_android", (t) => {
          t.integer("id").primaryKey();
          t.text("descripcion");
          t.boolean("completada");
        });
      }, new InMemoryStorageEngine());

      const tareasAndroid = db.table("tareas_android");

      // Volcado exportado desde una App Kotlin nativa con Room (Booleanos en SQLite son 0/1)
      const dumpRoom = [
        { id: 50, descripcion: "Hacer café con Kotlin", completada: 1 },
        { id: 51, descripcion: "Configurar Compose", completada: 0 }
      ];

      const res = KotliteMigrationBridge.importKotlinDump(tareasAndroid, dumpRoom);
      
      if (res.importedCount !== 2) throw new Error("No se importó la totalidad de registros");
      
      const t1 = tareasAndroid.query().where(t => t.id === 50).firstOrNull();
      const t2 = tareasAndroid.query().where(t => t.id === 51).firstOrNull();

      if (!t1 || t1.completada !== true) throw new Error("Fallo al convertir el booleano '1' de Room a true");
      if (!t2 || t2.completada !== false) throw new Error("Fallo al convertir el booleano '0' de Room a false");
    });

    // Restaurar estado original del debugger
    KotliteDebugger.enabled = debuggerWasEnabled;

    return this.results;
  }
}
