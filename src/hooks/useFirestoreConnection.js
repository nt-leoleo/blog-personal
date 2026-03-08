import { useState, useEffect } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useFirestoreConnection() {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  const checkConnection = async () => {
    setIsChecking(true);
    
    try {
      // Intentar una consulta simple con timeout más largo
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 10000); // 10 segundos
      });

      const testQuery = getDocs(query(collection(db, 'posts'), limit(1)));
      
      await Promise.race([testQuery, timeoutPromise]);
      
      console.log('✅ Firestore conectado correctamente');
      setIsBlocked(false);
      setConsecutiveFailures(0);
      
    } catch (error) {
      console.error('❌ Error de conexión a Firestore:', error);
      
      const newFailureCount = consecutiveFailures + 1;
      setConsecutiveFailures(newFailureCount);
      
      // Solo considerar bloqueado después de múltiples fallos específicos
      const isDefinitelyBlocked = 
        (error.message?.includes('ERR_BLOCKED_BY_CLIENT') && newFailureCount >= 2) ||
        (error.message?.includes('Failed to fetch') && newFailureCount >= 3) ||
        (error.code === 'unavailable' && newFailureCount >= 3);
      
      // Además, verificar que no sea un problema temporal de red
      const isTemporaryNetworkIssue = 
        error.message?.includes('timeout') ||
        error.message?.includes('network') ||
        error.code === 'permission-denied';
      
      if (isDefinitelyBlocked && !isTemporaryNetworkIssue) {
        console.warn('🚫 Firestore definitivamente bloqueado después de', newFailureCount, 'intentos');
        setIsBlocked(true);
      } else {
        console.log('⚠️ Error temporal de conexión, intento', newFailureCount);
        // No mostrar modal para errores temporales
      }
    } finally {
      setIsChecking(false);
    }
  };

  const retry = () => {
    setRetryCount(prev => prev + 1);
    setConsecutiveFailures(0); // Reset contador al reintentar manualmente
    checkConnection();
  };

  useEffect(() => {
    // Esperar un poco antes de la primera verificación
    const timer = setTimeout(() => {
      checkConnection();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [retryCount]);

  // NO verificar automáticamente cada 30 segundos si está bloqueado
  // Esto causaba falsos positivos

  return {
    isBlocked,
    isChecking,
    retry,
    checkConnection,
    consecutiveFailures
  };
}