import { useState, useEffect } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useFirestoreConnection() {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const checkConnection = async () => {
    setIsChecking(true);
    
    try {
      // Intentar una consulta simple con timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      const testQuery = getDocs(query(collection(db, 'posts'), limit(1)));
      
      await Promise.race([testQuery, timeoutPromise]);
      
      console.log('✅ Firestore conectado correctamente');
      setIsBlocked(false);
      
    } catch (error) {
      console.error('❌ Error de conexión a Firestore:', error);
      
      const isConnectionBlocked = 
        error.message?.includes('ERR_BLOCKED_BY_CLIENT') ||
        error.message?.includes('timeout') ||
        error.message?.includes('Failed to fetch') ||
        error.code === 'unavailable';
      
      if (isConnectionBlocked) {
        console.warn('🚫 Firestore bloqueado por adblocker');
        setIsBlocked(true);
      }
    } finally {
      setIsChecking(false);
    }
  };

  const retry = () => {
    setRetryCount(prev => prev + 1);
    checkConnection();
  };

  useEffect(() => {
    checkConnection();
  }, [retryCount]);

  // Verificar cada 30 segundos si está bloqueado
  useEffect(() => {
    if (isBlocked) {
      const interval = setInterval(() => {
        console.log('🔄 Verificando reconexión automática...');
        checkConnection();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isBlocked]);

  return {
    isBlocked,
    isChecking,
    retry,
    checkConnection
  };
}