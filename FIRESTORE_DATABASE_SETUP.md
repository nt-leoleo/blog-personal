# ERROR: Database '(default)' not found

## Problema
Firebase Firestore está intentando conectarse a una base de datos que NO EXISTE en tu proyecto.

## Solución: Crear la base de datos Firestore

### Pasos para crear la base de datos:

1. **Ir a la consola de Firebase**
   - Abrí: https://console.firebase.google.com/
   - Seleccioná tu proyecto: `blog-personal-5a4a9`

2. **Crear Firestore Database**
   - En el menú lateral, buscá "Firestore Database" o "Base de datos de Firestore"
   - Hacé clic en "Crear base de datos" o "Create database"

3. **Configurar la base de datos**
   - **Modo**: Seleccioná "Producción" (Production mode)
   - **Ubicación**: Elegí la región más cercana (ej: `us-east1`, `southamerica-east1`)
   - Hacé clic en "Siguiente" y luego "Habilitar"

4. **Configurar reglas de seguridad**
   Una vez creada la base de datos, andá a la pestaña "Reglas" (Rules) y usá estas reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura a todos
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Solo usuarios autenticados pueden leer/escribir usuarios
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

5. **Crear las colecciones iniciales**
   - En la pestaña "Datos" (Data), creá manualmente estas colecciones:
     - `posts` (hacé clic en "Iniciar colección")
     - `users` (hacé clic en "Iniciar colección")
   
   Podés agregar un documento de prueba y luego eliminarlo.

6. **Verificar**
   - Refrescá tu aplicación web
   - Los errores deberían desaparecer
   - Los posts deberían aparecer en la pantalla principal

## Notas importantes
- Este error NO es del navegador ni del código
- Es simplemente que la base de datos Firestore no fue inicializada en Firebase
- Una vez creada, todo debería funcionar correctamente
