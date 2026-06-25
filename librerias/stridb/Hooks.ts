'use client';

import { useState, useEffect, useCallback } from 'react';
import { StridbDatabase } from './Database';
import { StridbQuery } from './Query';

export interface StridbQueryResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook reactivo para realizar consultas sobre tablas de Stridb con actualización automática
 * en tiempo real cuando cambien los datos de la tabla.
 * 
 * @param db Instancia de la base de datos Stridb.
 * @param tableName Nombre de la tabla a consultar.
 * @param queryBuilderFn Callback opcional para encadenar filtros, ordenamientos o límites sobre la consulta.
 */
export function useStridbQuery<T = any>(
  db: StridbDatabase,
  tableName: string,
  queryBuilderFn?: (query: StridbQuery<T>) => StridbQuery<T>
): StridbQueryResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const executeQuery = useCallback(async () => {
    try {
      setLoading(true);
      let queryInstance = db.query<T>(tableName);
      if (queryBuilderFn) {
        queryInstance = queryBuilderFn(queryInstance);
      }
      const results = await queryInstance.execute();
      setData(results);
      setError(null);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [db, tableName, queryBuilderFn]);

  useEffect(() => {
    // Consulta inicial diferida de forma asíncrona para evitar re-renderizados en cascada (regla estricta del linter)
    const timer = setTimeout(() => {
      executeQuery();
    }, 0);

    // Suscribirse a cambios en la tabla para actualizar la UI en caliente
    const unsubscribe = db.subscribe((table, _action) => {
      if (table === tableName || table === "*") {
        executeQuery();
      }
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [db, tableName, executeQuery]);

  return {
    data,
    loading,
    error,
    refetch: executeQuery
  };
}
