import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function FirestoreDiagnostic() {
  const [diagnostics, setDiagnostics] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setLogs([]);
    setDiagnostics({});

    const results = {};

    try {
      addLog('🔍 Iniciando diagnóstico completo de Firestore...', 'info');

      // 1. Verificar configuración de Firebase
      addLog('📋 Verificando configuración de Firebase...', 'info');
      const config = {
        apiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: !!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: !!import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: !!import.meta.env.VITE_FIREBASE_APP_ID
      };
      
      results.config = config;
      const missingConfig = Object.entries(config).filter(([key, value]) => !value);
      
      if (missingConfig.length > 0) {
        addLog(`❌ Configuración incompleta: ${missingConfig.map(([key]) => key).join(', ')}`, 'error');
      } else {
        addLog('✅ Configuración de Firebase completa', 'success');
      }

      // 2. Verificar conectividad básica
      addLog('🌐 Verificando conectividad básica...', 'info');
      try {
        const response = await fetch('https://firestore.googleapis.com/', { method: 'HEAD' });
        results.connectivity = { status: response.status, accessible: true };
        addLog('✅ Firestore API es accesible', 'success');
      } catch (error) {
        results.connectivity = { error: error.message, accessible: false };
        addLog(`❌ Error de conectividad: ${error.message}`, 'error');
      }

      // 3. Verificar permisos de lectura
      addLog('📖 Verificando permisos de lectura...', 'info');
      try {
        const startTime = Date.now();
        const postsRef = collection(db, 'posts');
        const snapshot = await getDocs(postsRef);
        const duration = Date.now() - startTime;
        
        results.readPermissions = {
          success: true,
          postsCount: snapshot.size,
          duration: `${duration}ms`
        };
        addLog(`✅ Lectura exitosa: ${snapshot.size} posts en ${duration}ms`, 'success');
      } catch (error) {
        results.readPermissions = { success: false, error: error.message, code: error.code };
        addLog(`❌ Error de lectura: ${error.code} - ${error.message}`, 'error');
      }

      // 4. Verificar permisos de escritura
      addLog('✍️ Verificando permisos de escritura...', 'info');
      try {
        const testRef = collection(db, 'diagnostics');
        const testDoc = await addDoc(testRef, {
          test: true,
          timestamp: serverTimestamp(),
          userAgent: navigator.userAgent
        });
        
        results.writePermissions = { success: true, docId: testDoc.id };
        addLog(`✅ Escritura exitosa: documento ${testDoc.id}`, 'success');
      } catch (error) {
        results.writePermissions = { success: false, error: error.message, code: error.code };
        addLog(`❌ Error de escritura: ${error.code} - ${error.message}`, 'error');
      }

      // 5. Verificar colecciones específicas
      addLog('📁 Verificando colecciones específicas...', 'info');
      const collections = ['posts', 'users', 'adminEmails'];
      
      for (const collectionName of collections) {
        try {
          const collRef = collection(db, collectionName);
          const snapshot = await getDocs(collRef);
          results[`collection_${collectionName}`] = {
            exists: true,
            count: snapshot.size,
            accessible: true
          };
          addLog(`✅ Colección '${collectionName}': ${snapshot.size} documentos`, 'success');
        } catch (error) {
          results[`collection_${collectionName}`] = {
            exists: false,
            error: error.message,
            code: error.code
          };
          addLog(`❌ Error en colección '${collectionName}': ${error.code}`, 'error');
        }
      }

      // 6. Verificar reglas de seguridad
      addLog('🔒 Verificando reglas de seguridad...', 'info');
      try {
        // Intentar acceder a un documento específico
        const testDocRef = doc(db, 'posts', 'test-doc-that-does-not-exist');
        await getDoc(testDocRef);
        results.securityRules = { accessible: true };
        addLog('✅ Reglas de seguridad permiten acceso', 'success');
      } catch (error) {
        if (error.code === 'permission-denied') {
          results.securityRules = { 
            accessible: false, 
            error: 'Reglas de seguridad muy restrictivas',
            code: error.code 
          };
          addLog('⚠️ Reglas de seguridad pueden ser muy restrictivas', 'warning');
        } else {
          results.securityRules = { error: error.message, code: error.code };
          addLog(`❌ Error verificando reglas: ${error.code}`, 'error');
        }
      }

      // 7. Información del navegador
      results.browser = {
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        cookieEnabled: navigator.cookieEnabled,
        language: navigator.language,
        platform: navigator.platform
      };

      addLog('🎯 Diagnóstico completado', 'success');

    } catch (error) {
      addLog(`💥 Error general en diagnóstico: ${error.message}`, 'error');
      results.generalError = error.message;
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  const exportDiagnostics = () => {
    const data = {
      timestamp: new Date().toISOString(),
      diagnostics,
      logs,
      url: window.location.href
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firestore-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'white',
      border: '2px solid #ddd',
      borderRadius: '8px',
      padding: '20px',
      maxWidth: '600px',
      maxHeight: '80vh',
      overflow: 'auto',
      zIndex: 10000,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
        🔍 Diagnóstico de Firestore
      </h2>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          style={{
            background: isRunning ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {isRunning ? '🔄 Ejecutando...' : '▶️ Ejecutar Diagnóstico'}
        </button>

        {Object.keys(diagnostics).length > 0 && (
          <button
            onClick={exportDiagnostics}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📥 Exportar Resultados
          </button>
        )}
      </div>

      {logs.length > 0 && (
        <div style={{
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          padding: '10px',
          maxHeight: '200px',
          overflow: 'auto',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          {logs.map((log, index) => (
            <div
              key={index}
              style={{
                color: log.type === 'error' ? '#dc3545' : 
                       log.type === 'success' ? '#28a745' : 
                       log.type === 'warning' ? '#ffc107' : '#333',
                marginBottom: '2px'
              }}
            >
              [{log.timestamp}] {log.message}
            </div>
          ))}
        </div>
      )}

      {Object.keys(diagnostics).length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Resultados:</h3>
          <pre style={{
            background: '#f8f9fa',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto',
            maxHeight: '300px'
          }}>
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}